import SwiftUI
import UIKit
import NetworkExtension

struct BridgeHomeView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                statusStrip
                sharePanel
                controls
                statsRow
                if let message = model.statusMessage {
                    Text(message)
                        .font(Brand.caption)
                        .foregroundStyle(Brand.warn)
                        .transition(.opacity)
                }
                tip
            }
            .padding(22)
            .padding(.bottom, 90)
        }
    }

    private var statusStrip: some View {
        HStack(spacing: 14) {
            StatusChip(
                title: "VPN",
                value: model.vpnStatus.title,
                ok: model.vpnStatus == .connected
            )
            StatusChip(
                title: "Прокси",
                value: model.proxyRunning ? "Онлайн" : "Выключен",
                ok: model.proxyRunning
            )
        }
    }

    private var sharePanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Адрес для Switch 2")
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.65))
            Text(model.shareAddressLine)
                .font(Brand.mono)
                .foregroundStyle(Brand.accent)
                .padding(.vertical, 4)
                .contentTransition(.numericText())

            HStack {
                Button {
                    model.refreshAddresses()
                    UIPasteboard.general.string = model.shareAddressLine
                    model.statusMessage = "Скопировано: \(model.shareAddressLine)"
                } label: {
                    Label("Скопировать", systemImage: "doc.on.doc")
                        .font(Brand.body)
                }
                .buttonStyle(GlowButtonStyle())

                Button {
                    model.refreshAddresses()
                } label: {
                    Label("Обновить IP", systemImage: "arrow.clockwise")
                        .font(Brand.body)
                }
                .buttonStyle(GhostButtonStyle())
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Brand.panel.opacity(0.9))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Brand.accent.opacity(0.35), lineWidth: 1)
        )
    }

    private var controls: some View {
        VStack(spacing: 12) {
            Button {
                if model.vpnStatus == .connected || model.vpnStatus == .connecting {
                    model.disconnectVPN()
                } else {
                    Task { await model.connectVPN() }
                }
            } label: {
                Label(
                    model.vpnStatus == .connected ? "Отключить VPN" : "Включить VPN",
                    systemImage: "lock.shield"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(GlowButtonStyle(filled: true))

            Button {
                if model.proxyRunning {
                    model.stopProxy()
                } else {
                    model.startProxy()
                }
            } label: {
                Label(
                    model.proxyRunning ? "Остановить прокси" : "Запустить прокси",
                    systemImage: "antenna.radiowaves.left.and.right"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(GlowButtonStyle(filled: model.proxyRunning))
        }
    }

    private var statsRow: some View {
        HStack {
            metric("Сессии", "\(model.activeConnections)")
            Spacer()
            metric("Трафик", ByteCountFormatter.string(fromByteCount: model.bytesProxied, countStyle: .binary))
            Spacer()
            metric("Порт", "\(model.proxyPort)")
        }
        .padding(.top, 4)
    }

    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.55))
            Text(value)
                .font(Brand.body)
                .foregroundStyle(Brand.mist)
        }
    }

    private var tip: some View {
        Text("Сначала включите Режим модема на iPhone, подключите Switch 2 к хотспоту, затем введите этот адрес как прокси в настройках интернета консоли.")
            .font(Brand.caption)
            .foregroundStyle(Brand.mist.opacity(0.6))
            .fixedSize(horizontal: false, vertical: true)
    }
}

struct StatusChip: View {
    let title: String
    let value: String
    let ok: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(Brand.caption)
                .foregroundStyle(Brand.mist.opacity(0.55))
            Text(value)
                .font(Brand.body)
                .foregroundStyle(ok ? Brand.accent : Brand.mist)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Brand.panel.opacity(0.75), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(ok ? Brand.accent.opacity(0.4) : Brand.line.opacity(0.5), lineWidth: 1)
        )
    }
}

struct GlowButtonStyle: ButtonStyle {
    var filled: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Brand.body)
            .foregroundStyle(filled ? Brand.ink : Brand.accent)
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(filled ? Brand.accent : Brand.accent.opacity(0.12))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Brand.accent.opacity(0.5), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Brand.body)
            .foregroundStyle(Brand.mist.opacity(0.85))
            .padding(.horizontal, 14)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Brand.line, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}
