import SwiftUI
import WidgetKit

enum RidgePalette {
  static let pine = Color(red: 48 / 255, green: 80 / 255, blue: 50 / 255)
  static let gold = Color(red: 193 / 255, green: 154 / 255, blue: 80 / 255)
  static let ink = Color(red: 26 / 255, green: 26 / 255, blue: 26 / 255)
  static let cream = Color(red: 243 / 255, green: 230 / 255, blue: 196 / 255)
}

struct RidgeBackground: View {
  @Environment(\.colorScheme) private var scheme
  var body: some View {
    LinearGradient(
      colors: scheme == .dark
        ? [RidgePalette.pine, RidgePalette.ink]
        : [RidgePalette.cream, Color(red: 0.91, green: 0.84, blue: 0.68)],
      startPoint: .top,
      endPoint: .bottom
    )
  }
}

struct CritterMark: View {
  var index: Int
  var body: some View {
    Canvas { context, size in
      let s = min(size.width, size.height)
      func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }
      func fill(_ path: Path, _ color: Color) { context.fill(path, with: .color(color)) }

      switch index {
      case 1:
        var body = Path()
        body.addEllipse(in: CGRect(x: s * 0.18, y: s * 0.32, width: s * 0.5, height: s * 0.38))
        fill(body, RidgePalette.ink)
        var wing = Path()
        wing.move(to: p(0.42, 0.42))
        wing.addQuadCurve(to: p(0.88, 0.28), control: p(0.7, 0.18))
        wing.addQuadCurve(to: p(0.55, 0.55), control: p(0.78, 0.5))
        fill(wing, RidgePalette.ink.opacity(0.85))
        var beak = Path()
        beak.move(to: p(0.62, 0.46))
        beak.addLine(to: p(0.86, 0.52))
        beak.addLine(to: p(0.62, 0.58))
        fill(beak, RidgePalette.gold)
      case 2:
        var shell = Path()
        shell.addEllipse(in: CGRect(x: s * 0.16, y: s * 0.28, width: s * 0.68, height: s * 0.42))
        fill(shell, RidgePalette.gold)
        var band = Path()
        band.addEllipse(in: CGRect(x: s * 0.28, y: s * 0.34, width: s * 0.44, height: s * 0.28))
        fill(band, RidgePalette.pine)
        var head = Path()
        head.addEllipse(in: CGRect(x: s * 0.68, y: s * 0.42, width: s * 0.22, height: s * 0.18))
        fill(head, RidgePalette.cream)
      case 3:
        var face = Path()
        face.addEllipse(in: CGRect(x: s * 0.18, y: s * 0.22, width: s * 0.64, height: s * 0.56))
        fill(face, RidgePalette.cream)
        var earL = Path(); earL.addEllipse(in: CGRect(x: s * 0.16, y: s * 0.12, width: s * 0.16, height: s * 0.22)); fill(earL, RidgePalette.ink)
        var earR = Path(); earR.addEllipse(in: CGRect(x: s * 0.66, y: s * 0.12, width: s * 0.16, height: s * 0.22)); fill(earR, RidgePalette.ink)
        var eye = Path(); eye.addEllipse(in: CGRect(x: s * 0.34, y: s * 0.4, width: s * 0.1, height: s * 0.1)); fill(eye, RidgePalette.ink)
        var eye2 = Path(); eye2.addEllipse(in: CGRect(x: s * 0.56, y: s * 0.4, width: s * 0.1, height: s * 0.1)); fill(eye2, RidgePalette.ink)
        var nose = Path(); nose.addEllipse(in: CGRect(x: s * 0.44, y: s * 0.56, width: s * 0.12, height: s * 0.08)); fill(nose, Color(red: 0.72, green: 0.4, blue: 0.4))
      case 4:
        var crown = Path()
        crown.move(to: p(0.28, 0.28))
        crown.addLine(to: p(0.36, 0.08))
        crown.addLine(to: p(0.5, 0.22))
        crown.addLine(to: p(0.64, 0.08))
        crown.addLine(to: p(0.72, 0.28))
        fill(crown, RidgePalette.gold)
        fallthrough
      default:
        var earL = Path(); earL.addEllipse(in: CGRect(x: s * 0.18, y: s * 0.08, width: s * 0.2, height: s * 0.2)); fill(earL, RidgePalette.ink)
        var earR = Path(); earR.addEllipse(in: CGRect(x: s * 0.62, y: s * 0.08, width: s * 0.2, height: s * 0.2)); fill(earR, RidgePalette.ink)
        var face = Path(); face.addEllipse(in: CGRect(x: s * 0.16, y: s * 0.22, width: s * 0.68, height: s * 0.58)); fill(face, RidgePalette.cream)
        var mask = Path(); mask.addEllipse(in: CGRect(x: s * 0.16, y: s * 0.36, width: s * 0.68, height: s * 0.26)); fill(mask, RidgePalette.ink)
        var eyeL = Path(); eyeL.addEllipse(in: CGRect(x: s * 0.3, y: s * 0.42, width: s * 0.12, height: s * 0.12)); fill(eyeL, RidgePalette.gold)
        var eyeR = Path(); eyeR.addEllipse(in: CGRect(x: s * 0.58, y: s * 0.42, width: s * 0.12, height: s * 0.12)); fill(eyeR, RidgePalette.gold)
        var nose = Path(); nose.addEllipse(in: CGRect(x: s * 0.44, y: s * 0.62, width: s * 0.12, height: s * 0.08)); fill(nose, RidgePalette.ink)
      }
    }
    .aspectRatio(1, contentMode: .fit)
  }
}

private func ridgeInk(_ scheme: ColorScheme) -> Color {
  scheme == .dark ? RidgePalette.cream : RidgePalette.ink
}

struct BestScoreView: View {
  @Environment(\.colorScheme) private var scheme
  var snap: RidgeSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("VARMINT RIDGE")
        .font(.custom("Georgia", size: 11))
        .tracking(0.8)
        .foregroundStyle(RidgePalette.gold)
      Spacer(minLength: 0)
      Text(snap.bestText)
        .font(.custom("Georgia", size: 40))
        .foregroundStyle(ridgeInk(scheme))
        .minimumScaleFactor(0.5)
        .lineLimit(1)
      Text(snap.best > 0 ? (snap.initials.isEmpty ? "Best score" : "Best · \(snap.initials)") : "Play a round")
        .font(.custom("Georgia", size: 13))
        .foregroundStyle(scheme == .dark ? RidgePalette.cream.opacity(0.82) : RidgePalette.pine)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(14)
  }
}

struct DailyChallengeView: View {
  @Environment(\.colorScheme) private var scheme
  var snap: RidgeSnapshot

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        Text("TODAY'S RIDGE")
          .font(.custom("Georgia", size: 11))
          .tracking(0.8)
          .foregroundStyle(RidgePalette.gold)
        Text(snap.dailyTitle)
          .font(.custom("Georgia", size: 22))
          .foregroundStyle(ridgeInk(scheme))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Text("Wave \(snap.wave) · \(snap.dailyBlurb)")
          .font(.custom("Georgia", size: 13))
          .foregroundStyle(scheme == .dark ? RidgePalette.cream.opacity(0.85) : RidgePalette.pine)
          .lineLimit(3)
          .fixedSize(horizontal: false, vertical: true)
      }
      CritterMark(index: snap.varmintIndex)
        .frame(width: 72, height: 72)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(14)
  }
}

struct VarmintDayView: View {
  @Environment(\.colorScheme) private var scheme
  var snap: RidgeSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("VARMINT OF THE DAY")
        .font(.custom("Georgia", size: 12))
        .tracking(1)
        .foregroundStyle(RidgePalette.gold)
      HStack(alignment: .center, spacing: 12) {
        CritterMark(index: snap.varmintIndex)
          .frame(width: 108, height: 108)
        VStack(alignment: .leading, spacing: 4) {
          Text(snap.critterName)
            .font(.custom("Georgia", size: 28))
            .foregroundStyle(ridgeInk(scheme))
          Text(snap.critterLine)
            .font(.custom("Georgia", size: 14))
            .foregroundStyle(scheme == .dark ? RidgePalette.cream.opacity(0.88) : RidgePalette.pine)
            .fixedSize(horizontal: false, vertical: true)
        }
      }
      Rectangle()
        .fill(RidgePalette.gold.opacity(0.7))
        .frame(height: 1)
      Text(snap.dailyTitle)
        .font(.custom("Georgia", size: 18))
        .foregroundStyle(ridgeInk(scheme))
      Text("Wave \(snap.wave). \(snap.dailyBlurb)")
        .font(.custom("Georgia", size: 14))
        .foregroundStyle(scheme == .dark ? RidgePalette.cream.opacity(0.85) : RidgePalette.pine)
      Spacer(minLength: 0)
      Text(snap.best > 0 ? "Best \(snap.bestText) · opened \(min(snap.reach, 12)) of 12" : "Best score shows up after you play")
        .font(.custom("Georgia", size: 13))
        .foregroundStyle(RidgePalette.gold)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(16)
  }
}

struct RidgeGlanceView: View {
  @Environment(\.widgetFamily) private var family
  var snap: RidgeSnapshot

  var body: some View {
    switch family {
    case .accessoryCircular:
      VStack(spacing: 0) {
        Text(snap.bestText)
          .font(.headline)
          .minimumScaleFactor(0.5)
          .lineLimit(1)
        Text("best")
          .font(.caption2)
      }
    case .accessoryInline:
      Text("\(snap.critterName) · \(snap.bestText)")
    default:
      VStack(alignment: .leading, spacing: 1) {
        Text(snap.critterName)
          .font(.headline)
          .widgetAccentable()
        Text("Best \(snap.bestText)")
          .font(.caption)
        Text(snap.dailyTitle)
          .font(.caption2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

struct BestScoreWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "vr.best", provider: RidgeProvider()) { entry in
      BestScoreView(snap: entry.snap)
        .widgetURL(URL(string: "varmintridge://play"))
        .containerBackground(for: .widget) { RidgeBackground() }
    }
    .configurationDisplayName("Best Score")
    .description("Your top score on Varmint Ridge.")
    .supportedFamilies([.systemSmall])
    .contentMarginsDisabled()
  }
}

struct DailyChallengeWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "vr.daily", provider: RidgeProvider()) { entry in
      DailyChallengeView(snap: entry.snap)
        .widgetURL(URL(string: "varmintridge://play?daily=1"))
        .containerBackground(for: .widget) { RidgeBackground() }
    }
    .configurationDisplayName("Daily Challenge")
    .description("Today's Ridge: one wave, one rule.")
    .supportedFamilies([.systemMedium])
    .contentMarginsDisabled()
  }
}

struct VarmintDayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "vr.varmint", provider: RidgeProvider()) { entry in
      VarmintDayView(snap: entry.snap)
        .widgetURL(URL(string: "varmintridge://play?daily=1"))
        .containerBackground(for: .widget) { RidgeBackground() }
    }
    .configurationDisplayName("Varmint of the Day")
    .description("Who is coming down off the ridge today, plus the daily challenge.")
    .supportedFamilies([.systemLarge])
    .contentMarginsDisabled()
  }
}

struct RidgeGlanceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "vr.glance", provider: RidgeProvider()) { entry in
      RidgeGlanceView(snap: entry.snap)
        .widgetURL(URL(string: "varmintridge://play?daily=1"))
        .containerBackground(for: .widget) { AccessoryWidgetBackground() }
    }
    .configurationDisplayName("Ridge Glance")
    .description("Lock Screen: today's varmint, the daily, and your best score.")
    .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
  }
}
