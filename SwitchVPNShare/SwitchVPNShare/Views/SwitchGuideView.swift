import SwiftUI

struct SwitchGuideView: View {
    private let steps: [(String, String)] = [
        ("1", "Включите VPN в SwitchBridge и дождитесь статуса «Подключён»."),
        ("2", "Запустите прокси и скопируйте адрес (обычно 172.20.10.1:8888)."),
        ("3", "На iPhone: Настройки → Режим модема → разрешите другим подключаться."),
        ("4", "На Switch 2: Настройки → Интернет → Интернет‑настройки → подключитесь к хотспоту iPhone."),
        ("5", "В параметрах сети консоли включите прокси: укажите IP iPhone и порт из приложения."),
        ("6", "Проверьте соединение. Для eShop/аккаунта HTTP‑прокси обычно достаточно.")
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Подключение Switch 2")
                    .font(Brand.title)
                    .foregroundStyle(Brand.mist)

                Text("Короткий маршрут: VPN на телефоне → прокси → хотспот → консоль.")
                    .font(Brand.caption)
                    .foregroundStyle(Brand.mist.opacity(0.65))

                ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                    GuideStep(index: step.0, text: step.1)
                        .opacity(1)
                        .offset(y: 0)
                        .animation(
                            .spring(response: 0.45, dampingFraction: 0.8).delay(Double(index) * 0.05),
                            value: steps.count
                        )
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Если не коннектится")
                        .font(Brand.body)
                        .foregroundStyle(Brand.mist)
                    bullet("Убедитесь, что прокси запущен, пока открыт экран приложения (iOS может усыпить фон).")
                    bullet("На хотспоте IP почти всегда 172.20.10.1 — нажмите «Обновить IP», если другой.")
                    bullet("Отключите Private Relay / низкий объем данных на хотспоте.")
                    bullet("Для WireGuard/OpenVPN используйте их приложение для туннеля, а SwitchBridge — только как прокси‑мост.")
                }
                .padding(16)
                .background(Brand.panel.opacity(0.75), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(22)
            .padding(.bottom, 90)
        }
    }

    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("▸")
                .foregroundStyle(Brand.accent)
                .font(Brand.caption)
            Text(text)
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.7))
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct GuideStep: View {
    let index: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Text(index)
                .font(Brand.mono)
                .foregroundStyle(Brand.ink)
                .frame(width: 32, height: 32)
                .background(Brand.accent, in: Circle())
            Text(text)
                .font(Brand.body)
                .foregroundStyle(Brand.mist.opacity(0.9))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 4)
    }
}
