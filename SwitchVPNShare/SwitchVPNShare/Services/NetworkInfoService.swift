import Foundation
import Darwin
import Network

final class NetworkInfoService {
    /// Prefers Personal Hotspot / USB sharing addresses, then Wi‑Fi LAN.
    func preferredShareAddress() -> String? {
        let addresses = ipv4Addresses()
        let hotspot = addresses.first { $0.hasPrefix("172.20.10.") }
        if let hotspot { return hotspot }

        let linkLocalBridge = addresses.first { $0.hasPrefix("192.168.43.") || $0.hasPrefix("192.168.137.") }
        if let linkLocalBridge { return linkLocalBridge }

        return addresses.first { !$0.hasPrefix("127.") }
    }

    func ipv4Addresses() -> [String] {
        var addresses: [String] = []
        var ifaddr: UnsafeMutablePointer<ifaddrs>?

        guard getifaddrs(&ifaddr) == 0, let first = ifaddr else { return [] }
        defer { freeifaddrs(ifaddr) }

        var pointer: UnsafeMutablePointer<ifaddrs>? = first
        while let interface = pointer {
            let flags = Int32(interface.pointee.ifa_flags)
            let isUp = (flags & IFF_UP) == IFF_UP
            let isLoopback = (flags & IFF_LOOPBACK) == IFF_LOOPBACK

            if isUp, !isLoopback,
               let addr = interface.pointee.ifa_addr,
               addr.pointee.sa_family == UInt8(AF_INET) {
                var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                let result = getnameinfo(
                    addr,
                    socklen_t(addr.pointee.sa_len),
                    &hostname,
                    socklen_t(hostname.count),
                    nil,
                    0,
                    NI_NUMERICHOST
                )
                if result == 0 {
                    addresses.append(String(cString: hostname))
                }
            }
            pointer = interface.pointee.ifa_next
        }

        return addresses
    }
}
