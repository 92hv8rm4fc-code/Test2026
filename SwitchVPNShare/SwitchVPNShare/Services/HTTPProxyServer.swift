import Foundation
import Network

enum ProxyServerError: LocalizedError {
    case alreadyRunning
    case bindFailed(String)

    var errorDescription: String? {
        switch self {
        case .alreadyRunning:
            return "Прокси уже запущен."
        case .bindFailed(let message):
            return "Не удалось открыть порт: \(message)"
        }
    }
}

/// Minimal HTTP/HTTPS CONNECT proxy. Switch traffic that honors the system proxy
/// is forwarded by this process and therefore rides the iPhone VPN tunnel.
final class HTTPProxyServer {
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "SwitchBridge.HTTPProxy", qos: .userInitiated)
    private var totalBytes: Int64 = 0
    private var connectionCount = 0

    var onStats: ((Int64, Int) -> Void)?

    var isRunning: Bool { listener != nil }

    func start(port: UInt16) throws {
        guard listener == nil else { throw ProxyServerError.alreadyRunning }

        let parameters = NWParameters.tcp
        parameters.allowLocalEndpointReuse = true

        do {
            let listener = try NWListener(using: parameters, on: NWEndpoint.Port(rawValue: port)!)
            self.listener = listener

            listener.stateUpdateHandler = { [weak self] state in
                if case .failed(let error) = state {
                    self?.stop()
                    self?.emitStats()
                    print("Proxy listener failed: \(error)")
                }
            }

            listener.newConnectionHandler = { [weak self] connection in
                self?.handle(connection)
            }

            listener.start(queue: queue)
        } catch {
            throw ProxyServerError.bindFailed(error.localizedDescription)
        }
    }

    func stop() {
        listener?.cancel()
        listener = nil
        connectionCount = 0
        emitStats()
    }

    private func handle(_ connection: NWConnection) {
        connection.stateUpdateHandler = { state in
            if case .failed = state { connection.cancel() }
            if case .cancelled = state { }
        }
        connection.start(queue: queue)
        receiveHeader(on: connection, buffer: Data())
    }

    private func receiveHeader(on connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, isComplete, error in
            guard let self else { return }
            if let error {
                print("Header receive error: \(error)")
                connection.cancel()
                return
            }

            var next = buffer
            if let data { next.append(data) }

            if let range = next.range(of: Data("\r\n\r\n".utf8)) {
                let headerData = next.subdata(in: next.startIndex..<range.upperBound)
                let leftover = next.subdata(in: range.upperBound..<next.endIndex)
                self.route(connection: connection, headerData: headerData, leftover: leftover)
                return
            }

            if isComplete || next.count > 256 * 1024 {
                connection.cancel()
                return
            }

            self.receiveHeader(on: connection, buffer: next)
        }
    }

    private func route(connection: NWConnection, headerData: Data, leftover: Data) {
        guard let header = String(data: headerData, encoding: .utf8) else {
            connection.cancel()
            return
        }

        let lines = header.split(separator: "\r\n", omittingEmptySubsequences: false)
        guard let requestLine = lines.first else {
            connection.cancel()
            return
        }

        let parts = requestLine.split(separator: " ")
        guard parts.count >= 2 else {
            connection.cancel()
            return
        }

        let method = String(parts[0]).uppercased()
        let target = String(parts[1])

        if method == "CONNECT" {
            handleConnect(client: connection, target: target)
        } else {
            handleHTTP(client: connection, method: method, target: target, rawHeader: header, leftover: leftover)
        }
    }

    private func handleConnect(client: NWConnection, target: String) {
        let hostPort = splitHostPort(target, defaultPort: 443)
        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(hostPort.host),
            port: NWEndpoint.Port(rawValue: hostPort.port)!
        )
        let remote = NWConnection(to: endpoint, using: .tcp)
        remote.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready:
                let ok = Data("HTTP/1.1 200 Connection Established\r\n\r\n".utf8)
                client.send(content: ok, completion: .contentProcessed { error in
                    if error != nil {
                        client.cancel()
                        remote.cancel()
                        return
                    }
                    self?.bumpConnection(1)
                    self?.pipe(client, remote)
                    self?.pipe(remote, client)
                })
            case .failed, .cancelled:
                client.cancel()
            default:
                break
            }
        }
        remote.start(queue: queue)
    }

    private func handleHTTP(
        client: NWConnection,
        method: String,
        target: String,
        rawHeader: String,
        leftover: Data
    ) {
        guard let url = absoluteURL(from: target, headers: rawHeader) else {
            client.cancel()
            return
        }

        let host = url.host ?? ""
        let port = UInt16(url.port ?? (url.scheme == "https" ? 443 : 80))
        let path: String = {
            if url.path.isEmpty { return "/" + (url.query.map { "?\($0)" } ?? "") }
            return url.path + (url.query.map { "?\($0)" } ?? "")
        }()

        var rewritten = rawHeader.replacingOccurrences(
            of: "\(method) \(target)",
            with: "\(method) \(path)"
        )
        if !rewritten.lowercased().contains("\r\nhost:") {
            rewritten = rewritten.replacingOccurrences(
                of: "\r\n\r\n",
                with: "\r\nHost: \(host)\r\n\r\n"
            )
        }

        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(host),
            port: NWEndpoint.Port(rawValue: port)!
        )
        let remote = NWConnection(to: endpoint, using: .tcp)
        remote.stateUpdateHandler = { [weak self] state in
            guard let self else { return }
            switch state {
            case .ready:
                var payload = Data(rewritten.utf8)
                payload.append(leftover)
                remote.send(content: payload, completion: .contentProcessed { error in
                    if error != nil {
                        client.cancel()
                        remote.cancel()
                        return
                    }
                    self.bumpConnection(1)
                    self.pipe(remote, client)
                    self.pipe(client, remote)
                })
            case .failed, .cancelled:
                client.cancel()
            default:
                break
            }
        }
        remote.start(queue: queue)
    }

    private func pipe(_ from: NWConnection, _ to: NWConnection) {
        from.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, isComplete, error in
            guard let self else { return }
            if let data, !data.isEmpty {
                self.addBytes(data.count)
                to.send(content: data, completion: .contentProcessed { sendError in
                    if sendError != nil || isComplete || error != nil {
                        from.cancel()
                        to.cancel()
                        self.bumpConnection(-1)
                        return
                    }
                    self.pipe(from, to)
                })
                return
            }

            if isComplete || error != nil {
                from.cancel()
                to.cancel()
                self.bumpConnection(-1)
            } else {
                self.pipe(from, to)
            }
        }
    }

    private func splitHostPort(_ value: String, defaultPort: UInt16) -> (host: String, port: UInt16) {
        if value.hasPrefix("["), let close = value.firstIndex(of: "]") {
            let host = String(value[value.index(after: value.startIndex)..<close])
            let rest = value[value.index(after: close)...]
            if rest.hasPrefix(":"), let port = UInt16(rest.dropFirst()) {
                return (host, port)
            }
            return (host, defaultPort)
        }

        let pieces = value.split(separator: ":")
        if pieces.count == 2, let port = UInt16(pieces[1]) {
            return (String(pieces[0]), port)
        }
        return (value, defaultPort)
    }

    private func absoluteURL(from target: String, headers: String) -> URL? {
        if target.hasPrefix("http://") || target.hasPrefix("https://") {
            return URL(string: target)
        }
        let host = headers
            .split(separator: "\r\n")
            .first(where: { $0.lowercased().hasPrefix("host:") })
            .map { $0.dropFirst(5).trimmingCharacters(in: .whitespaces) }
        guard let host, !host.isEmpty else { return nil }
        return URL(string: "http://\(host)\(target.hasPrefix("/") ? target : "/\(target)")")
    }

    private func addBytes(_ count: Int) {
        totalBytes += Int64(count)
        emitStats()
    }

    private func bumpConnection(_ delta: Int) {
        connectionCount = max(0, connectionCount + delta)
        emitStats()
    }

    private func emitStats() {
        let bytes = totalBytes
        let connections = connectionCount
        DispatchQueue.main.async { [onStats] in
            onStats?(bytes, connections)
        }
    }
}
