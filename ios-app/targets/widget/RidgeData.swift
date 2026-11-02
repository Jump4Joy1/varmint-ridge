import Foundation
import WidgetKit

/// Shared with the web game. The FNV-1a seed and the tables must stay in lockstep
/// with `ridgeFnv` / `RIDGE_CRITTERS` / `RIDGE_DAILIES` in index.html.
/// Fixture: "jwmanor-vr-2026-10-30" -> 3339250613, varmint 3 (Possum), daily 1 (Lantern Watch), wave 1.
enum RidgeCalendar {
  static let appGroup = "group.com.jwmanor.varmintridge"

  static let critters: [(name: String, line: String)] = [
    ("Raccoon", "Steals a crop and runs. Catch it before it gets away."),
    ("Crow", "Flies right over the fence. Scarecrows and lanterns watch the sky."),
    ("Armadillo", "Digs under the rail. Snap traps still bite while it digs."),
    ("Possum", "Plays dead once. Wait it out, then it gets back up."),
    ("Bandit King", "The wave 10 boss. The gang shows up twice as his health drops."),
  ]

  static let dailies: [(title: String, blurb: String)] = [
    ("Straw Only", "Clear this wave with scarecrows only."),
    ("Lantern Watch", "Lanterns only. Fliers take the extra hit."),
    ("Snap Line", "Snap traps only. Keep an eye on the crows."),
    ("Lean Purse", "Start with 70 coins and make them count."),
    ("Zeus on Duty", "Zeus starts at level 1 and chases the closest critter."),
    ("Clean Beds", "Lose one crop bed and the challenge ends."),
  ]

  static func fnv1a(_ string: String) -> UInt32 {
    var hash: UInt32 = 2166136261
    for byte in string.utf8 {
      hash ^= UInt32(byte)
      hash = hash &* 16777619
    }
    return hash
  }

  static func dayKey(_ date: Date) -> String {
    let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
  }

  static func pack(for date: Date = Date()) -> (day: String, varmint: Int, daily: Int, wave: Int) {
    let day = dayKey(date)
    let hash = fnv1a("jwmanor-vr-" + day)
    return (
      day,
      Int(hash % 5),
      Int((hash >> 8) % 6),
      1 + Int((hash >> 16) % 6)
    )
  }

  static func load(now: Date = Date()) -> RidgeSnapshot {
    let defaults = UserDefaults(suiteName: appGroup)
    let best = defaults?.integer(forKey: "vr.best") ?? 0
    let initials = defaults?.string(forKey: "vr.initials") ?? ""
    let reach = defaults?.object(forKey: "vr.reach") == nil ? 1 : (defaults?.integer(forKey: "vr.reach") ?? 1)
    let today = pack(for: now)
    return RidgeSnapshot(
      best: best,
      initials: initials,
      reach: reach,
      dayKey: today.day,
      varmintIndex: today.varmint,
      dailyIndex: today.daily,
      wave: today.wave
    )
  }

  static var sample: RidgeSnapshot {
    RidgeSnapshot(
      best: 1840,
      initials: "JW",
      reach: 4,
      dayKey: "2026-10-30",
      varmintIndex: 3,
      dailyIndex: 1,
      wave: 1
    )
  }
}

struct RidgeSnapshot {
  var best: Int
  var initials: String
  var reach: Int
  var dayKey: String
  var varmintIndex: Int
  var dailyIndex: Int
  var wave: Int

  var critterName: String { RidgeCalendar.critters[varmintIndex].name }
  var critterLine: String { RidgeCalendar.critters[varmintIndex].line }
  var dailyTitle: String { RidgeCalendar.dailies[dailyIndex].title }
  var dailyBlurb: String { RidgeCalendar.dailies[dailyIndex].blurb }

  var bestText: String {
    guard best > 0 else { return "—" }
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    return formatter.string(from: NSNumber(value: best)) ?? "\(best)"
  }
}

struct RidgeEntry: TimelineEntry {
  let date: Date
  let snap: RidgeSnapshot
}

struct RidgeProvider: TimelineProvider {
  func placeholder(in context: Context) -> RidgeEntry {
    RidgeEntry(date: Date(), snap: RidgeCalendar.sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (RidgeEntry) -> Void) {
    completion(RidgeEntry(date: Date(), snap: context.isPreview ? RidgeCalendar.sample : RidgeCalendar.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<RidgeEntry>) -> Void) {
    let now = Date()
    let entry = RidgeEntry(date: now, snap: RidgeCalendar.load(now: now))
    let start = Calendar.current.startOfDay(for: now)
    let next = Calendar.current.date(byAdding: .day, value: 1, to: start) ?? now.addingTimeInterval(60 * 60)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}
