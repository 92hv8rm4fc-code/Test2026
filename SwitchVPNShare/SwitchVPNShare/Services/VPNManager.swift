import Foundation
import NetworkExtension
import Security

enum VPNManagerError: LocalizedError {
    case incompleteConfiguration
    case preferenceLoadFailed
    case saveFailed(String)

    var errorDescription: String? {
        switch self {
        case .incompleteConfiguration:
            return "Заполните адрес сервера, ID, логин, пароль и Shared Secret."
        case .preferenceLoadFailed:
            return "Не удалось загрузить VPN-профиль iOS."
        case .saveFailed(let message):
            return "Не удалось сохранить VPN: \(message)"
        }
    }
}

final class VPNManager {
    private let manager = NEVPNManager.shared()

    var currentStatus: NEVPNStatus {
        manager.connection.status
    }

    func apply(configuration: VPNConfiguration) async throws {
        guard configuration.isReady else { throw VPNManagerError.incompleteConfiguration }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            manager.loadFromPreferences { error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let ikev2 = NEVPNProtocolIKEv2()
                ikev2.serverAddress = configuration.serverAddress.trimmed
                ikev2.remoteIdentifier = configuration.remoteIdentifier.trimmed
                ikev2.localIdentifier = configuration.localIdentifier.trimmed.isEmpty
                    ? configuration.username.trimmed
                    : configuration.localIdentifier.trimmed
                ikev2.username = configuration.username.trimmed
                ikev2.authenticationMethod = .sharedSecret
                ikev2.useExtendedAuthentication = true
                ikev2.disconnectOnSleep = false

                ikev2.passwordReference = KeychainStore.save(
                    service: "SwitchBridge.vpn.password",
                    account: configuration.username.trimmed,
                    value: configuration.password
                )
                ikev2.sharedSecretReference = KeychainStore.save(
                    service: "SwitchBridge.vpn.sharedSecret",
                    account: configuration.serverAddress.trimmed,
                    value: configuration.sharedSecret
                )

                ikev2.ikeSecurityAssociationParameters.encryptionAlgorithm = .algorithmAES256
                ikev2.ikeSecurityAssociationParameters.integrityAlgorithm = .SHA256
                ikev2.ikeSecurityAssociationParameters.diffieHellmanGroup = .group14
                ikev2.childSecurityAssociationParameters.encryptionAlgorithm = .algorithmAES256
                ikev2.childSecurityAssociationParameters.integrityAlgorithm = .SHA256
                ikev2.childSecurityAssociationParameters.diffieHellmanGroup = .group14

                self.manager.protocolConfiguration = ikev2
                self.manager.localizedDescription = configuration.displayName.isEmpty
                    ? "SwitchBridge"
                    : configuration.displayName
                self.manager.isEnabled = true

                self.manager.saveToPreferences { saveError in
                    if let saveError {
                        continuation.resume(throwing: VPNManagerError.saveFailed(saveError.localizedDescription))
                    } else {
                        self.manager.loadFromPreferences { _ in
                            continuation.resume()
                        }
                    }
                }
            }
        }
    }

    func connect() async throws {
        guard manager.protocolConfiguration != nil else {
            throw VPNManagerError.incompleteConfiguration
        }
        try manager.connection.startVPNTunnel()
    }

    func disconnect() {
        manager.connection.stopVPNTunnel()
    }
}

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

enum KeychainStore {
    @discardableResult
    static func save(service: String, account: String, value: String) -> Data? {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock

        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else { return nil }

        var copyQuery = query
        copyQuery[kSecReturnPersistentRef as String] = true
        var result: CFTypeRef?
        let copyStatus = SecItemCopyMatching(copyQuery as CFDictionary, &result)
        guard copyStatus == errSecSuccess else { return nil }
        return result as? Data
    }
}
