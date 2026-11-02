import SwiftUI
import WidgetKit

@main
struct RidgeWidgetBundle: WidgetBundle {
  var body: some Widget {
    BestScoreWidget()
    DailyChallengeWidget()
    VarmintDayWidget()
    RidgeGlanceWidget()
  }
}
