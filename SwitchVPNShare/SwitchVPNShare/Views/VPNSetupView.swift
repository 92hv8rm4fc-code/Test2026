import SwiftUI

struct VPNSetupView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("IKEv2 профиль")
                    .font(Brand.title)
                    .foregroundStyle(Brand.mist)

                Text("Встроенный клиент iOS. После сохранения система попросит разрешение на добавление VPN-конфигурации.")
                    .font(Brand.caption)
                    .foregroundStyle(Brand.mist.opacity(0.65))

                field("Имя", text: $model.vpnConfig.displayName)
                field("Сервер", text: $model.vpnConfig.serverAddress, keyboard: .URL)
                field("Remote ID", text: $model.vpnConfig.remoteIdentifier)
                field("Local ID (опционально)", text: $model.vpnConfig.localIdentifier)
                field("Логин", text: $model.vpnConfig.username)
                secureField("Пароль", text: $model.vpnConfig.password)
                secureField("Shared Secret", text: $model.vpnConfig.sharedSecret)

                HStack {
                    Text("Порт прокси")
                        .font(Brand.body)
                        .foregroundStyle(Brand.mist)
                    Spacer()
                    TextField("8888", value: $model.proxyPort, format: .number)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .font(Brand.mono)
                        .foregroundStyle(Brand.accent)
                        .frame(width: 90)
                }
                .padding(14)
                .background(Brand.panel.opacity(0.8), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                Button {
                    model.saveConfig()
                    model.statusMessage = "Профиль сохранён на устройстве"
                } label: {
                    Label("Сохранить профиль", systemImage: "square.and.arrow.down")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(GlowButtonStyle(filled: true))

                limitations
            }
            .padding(22)
            .padding(.bottom, 90)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func field(
        _ title: String,
        text: Binding<String>,
        keyboard: UIKeyboardType = .default
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.55))
            TextField(title, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(Brand.body)
                .foregroundStyle(Brand.mist)
                .padding(14)
                .background(Brand.panel.opacity(0.8), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Brand.line.opacity(0.6), lineWidth: 1)
                )
        }
    }

    private func secureField(_ title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.55))
            SecureField(title, text: text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(Brand.body)
                .foregroundStyle(Brand.mist)
                .padding(14)
                .background(Brand.panel.opacity(0.8), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Brand.line.opacity(0.6), lineWidth: 1)
                )
        }
    }

    private var limitations: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Важно про iOS и Switch")
                .font(Brand.body)
                .foregroundStyle(Brand.warn)
            Text("Трафик Режим модема сам по себе не идёт через VPN. Поэтому Switch указывает HTTP‑прокси на iPhone: исходящие запросы делает приложение и они уже идут в VPN‑туннель. UDP‑трафик онлайн‑игр прокси может не покрыть — для полного туннеля лучше travel‑router или Android.")
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.65))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .background(Brand.panel.opacity(0.7), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
