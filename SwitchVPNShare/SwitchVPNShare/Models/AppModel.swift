import Foundation
import Combine
import NetworkExtension

@MainActor
final class AppModel: ObservableObject {
    @Published var vpnConfig: VPNConfiguration
    @Published var vpnStatus: NEVPNStatus = .invalid
    @Published var proxyRunning = false
    @Published var proxyPort: UInt16 = 8888
    @Published var hotspotIPv4: String?
    @Published var statusMessage: String?
    @Published var bytesProxied: Int64 = 0
    @Published var activeConnections: Int = 0

    let vpnManager = VPNManager()
    let proxyServer = HTTPProxyServer()
    let networkInfo = NetworkInfoService()

    private var statusObserver: NSObjectProtocol?

    init() {
        vpnConfig = VPNConfiguration.load() ?? .empty
        proxyServer.onStats = { [weak self] bytes, connections in
            Task { @MainActor in
                self?.bytesProxied = bytes
                self?.activeConnections = connections
            }
        }
        observeVPNStatus()
        refreshAddresses()
    }

    deinit {
        if let statusObserver {
            NotificationCenter.default.removeObserver(statusObserver)
        }
    }

    func saveConfig() {
        vpnConfig.save()
    }

    func refreshAddresses() {
        hotspotIPv4 = networkInfo.preferredShareAddress()
    }

    func connectVPN() async {
        statusMessage = nil
        do {
            try await vpnManager.apply(configuration: vpnConfig)
            try await vpnManager.connect()
            statusMessage = "VPN подключается…"
        } catch {
            statusMessage = error.localizedDescription
        }
        vpnStatus = vpnManager.currentStatus
    }

    func disconnectVPN() {
        vpnManager.disconnect()
        vpnStatus = vpnManager.currentStatus
        statusMessage = "VPN отключён"
    }

    func startProxy() {
        refreshAddresses()
        do {
            try proxyServer.start(port: proxyPort)
            proxyRunning = true
            statusMessage = "Прокси слушает порт \(proxyPort)"
        } catch {
            proxyRunning = false
            statusMessage = error.localizedDescription
        }
    }

    func stopProxy() {
        proxyServer.stop()
        proxyRunning = false
        activeConnections = 0
        statusMessage = "Прокси остановлен"
    }

    var shareAddressLine: String {
        let ip = hotspotIPv4 ?? "172.20.10.1"
        return "\(ip):\(proxyPort)"
    }

    private func observeVPNStatus() {
        statusObserver = NotificationCenter.default.addObserver(
            forName: .NEVPNStatusDidChange,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.vpnStatus = self.vpnManager.currentStatus
            }
        }
        vpnStatus = vpnManager.currentStatus
    }
}
