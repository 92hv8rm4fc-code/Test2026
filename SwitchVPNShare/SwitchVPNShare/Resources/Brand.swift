import SwiftUI

enum Brand {
    static let ink = Color(red: 0.04, green: 0.09, blue: 0.12)
    static let panel = Color(red: 0.07, green: 0.14, blue: 0.18)
    static let line = Color(red: 0.18, green: 0.32, blue: 0.36)
    static let mist = Color(red: 0.72, green: 0.86, blue: 0.84)
    static let accent = Color(red: 0.22, green: 0.92, blue: 0.62)
    static let warn = Color(red: 0.98, green: 0.72, blue: 0.28)
    static let danger = Color(red: 0.95, green: 0.35, blue: 0.38)

    static let display = Font.custom("AvenirNext-Bold", size: 34, relativeTo: .largeTitle)
    static let title = Font.custom("AvenirNext-DemiBold", size: 22, relativeTo: .title2)
    static let body = Font.custom("AvenirNext-Medium", size: 16, relativeTo: .body)
    static let caption = Font.custom("AvenirNext-Regular", size: 13, relativeTo: .caption)
    static let mono = Font.custom("Menlo-Bold", size: 15, relativeTo: .body)
}

struct AtmosphereBackground: View {
    var body: some View {
        ZStack {
            Brand.ink
            RadialGradient(
                colors: [
                    Color(red: 0.08, green: 0.28, blue: 0.30).opacity(0.85),
                    .clear
                ],
                center: .topLeading,
                startRadius: 20,
                endRadius: 420
            )
            RadialGradient(
                colors: [
                    Color(red: 0.05, green: 0.35, blue: 0.22).opacity(0.45),
                    .clear
                ],
                center: .bottomTrailing,
                startRadius: 10,
                endRadius: 380
            )
            GeometryReader { geo in
                Canvas { context, size in
                    for i in 0..<18 {
                        let x = CGFloat((i * 47) % 100) / 100 * size.width
                        let y = CGFloat((i * 79) % 100) / 100 * size.height
                        let r = CGFloat(1 + i % 3)
                        context.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: r, height: r)),
                            with: .color(Brand.mist.opacity(0.12))
                        )
                    }
                }
            }
            .allowsHitTesting(false)
        }
        .ignoresSafeArea()
    }
}
