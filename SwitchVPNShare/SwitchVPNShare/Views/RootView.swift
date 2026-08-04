import SwiftUI
import NetworkExtension

struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @State private var tab: Tab = .bridge

    enum Tab: Hashable {
        case bridge, vpn, guide
    }

    var body: some View {
        ZStack {
            AtmosphereBackground()

            VStack(spacing: 0) {
                header
                TabView(selection: $tab) {
                    BridgeHomeView()
                        .tag(Tab.bridge)
                    VPNSetupView()
                        .tag(Tab.vpn)
                    SwitchGuideView()
                        .tag(Tab.guide)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                bottomBar
            }
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text("SwitchBridge")
                    .font(Brand.display)
                    .foregroundStyle(Brand.mist)
                Text("VPN с iPhone → Nintendo Switch 2")
                    .font(Brand.caption)
                    .foregroundStyle(Brand.mist.opacity(0.7))
            }
            Spacer()
            PulseDot(active: model.vpnStatus == .connected && model.proxyRunning)
        }
        .padding(.horizontal, 22)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    private var bottomBar: some View {
        HStack(spacing: 8) {
            tabButton("Мост", tab: .bridge)
            tabButton("VPN", tab: .vpn)
            tabButton("Switch", tab: .guide)
        }
        .padding(8)
        .background(Brand.panel.opacity(0.92), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Brand.line.opacity(0.7), lineWidth: 1)
        )
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }

    private func tabButton(_ title: String, tab: Tab) -> some View {
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                self.tab = tab
            }
        } label: {
            Text(title)
                .font(Brand.body)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    self.tab == tab ? Brand.accent.opacity(0.18) : Color.clear,
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
                .foregroundStyle(self.tab == tab ? Brand.accent : Brand.mist.opacity(0.7))
        }
        .buttonStyle(.plain)
    }
}

struct PulseDot: View {
    let active: Bool
    @State private var pulse = false

    var body: some View {
        Circle()
            .fill(active ? Brand.accent : Brand.line)
            .frame(width: 12, height: 12)
            .scaleEffect(pulse && active ? 1.25 : 1)
            .opacity(pulse && active ? 0.7 : 1)
            .animation(
                active
                    ? .easeInOut(duration: 1.1).repeatForever(autoreverses: true)
                    : .default,
                value: pulse
            )
            .onAppear { pulse = true }
            .accessibilityLabel(active ? "Мост активен" : "Мост неактивен")
    }
}
