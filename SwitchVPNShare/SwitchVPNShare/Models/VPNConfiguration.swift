import Foundation
import NetworkExtension

struct VPNConfiguration: Codable, Equatable {
    var displayName: String
    var serverAddress: String
    var remoteIdentifier: String
    var localIdentifier: String
    var username: String
    var password: String
    var sharedSecret: String
    var useCertificate: Bool

    static let empty = VPNConfiguration(
        displayName: "SwitchBridge",
        serverAddress: "",
        remoteIdentifier: "",
        localIdentifier: "",
        username: "",
        password: "",
        sharedSecret: "",
        useCertificate: false
    )

    var isReady: Bool {
        !serverAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !remoteIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !password.isEmpty
            && !sharedSecret.isEmpty
    }

    private static let storageKey = "switchbridge.vpn.configuration"

    func save() {
        guard let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults.standard.set(data, forKey: Self.storageKey)
    }

    static func load() -> VPNConfiguration? {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return nil }
        return try? JSONDecoder().decode(VPNConfiguration.self, from: data)
    }
}

extension NEVPNStatus {
    var title: String {
        switch self {
        case .invalid: return "Не настроен"
        case .disconnected: return "Отключён"
        case .connecting: return "Подключение…"
        case .connected: return "Подключён"
        case .reasserting: return "Переподключение…"
        case .disconnecting: return "Отключение…"
        @unknown default: return "Неизвестно"
        }
    }
}
