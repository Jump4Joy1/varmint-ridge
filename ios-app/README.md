# Varmint Ridge iOS wrapper

This is a real Expo app plus a WidgetKit extension. The widgets are SwiftUI, compiled by Xcode. They are not web pages pretending to be widgets.

The phone app is a full-screen WebView of the same game as `../www` (staged into `assets/www`). When a score is saved, the page posts the best score into the App Group `group.com.jwmanor.varmintridge`. The widgets read that group. The daily challenge and the varmint of the day are computed from the date with the same FNV-1a seed as the web game, so they match even before the first score.

There are four widgets:

| Widget | Size | What it shows |
| --- | --- | --- |
| Best Score | Home Screen small | Top score and initials |
| Daily Challenge | Home Screen medium | Today's rule and wave |
| Varmint of the Day | Home Screen large | Critter, line, daily, best score, waves opened of 12 |
| Ridge Glance | Lock Screen | Varmint, best score, daily title |

Tapping Daily, Varmint, or Glance opens `varmintridge://play?daily=1` and highlights Today's Ridge. Tapping Best Score just opens the game.

No ads SDK. No analytics SDK. No tracking prompt. Real purchases stay off until you set `IAP_ENABLED` in the game for a store build. In the browser, Coin Pack is a test purchase: the grown-up math question comes first, then the store, then a confirm step that does not charge a card.

## Build (Mac, Xcode 16 or newer, iOS 17+)

A paid Apple Developer Program membership is required for a real iPhone, because the widgets use an App Group. The account is also required for TestFlight and the App Store.

From this folder:

```bash
npm run stage
npm install
npx expo prebuild -p ios --clean
open ios/*.xcworkspace
```

In Xcode:

1. Sign the app target and the VarmintRidgeWidgets target with your team.
2. Confirm both targets have the App Group `group.com.jwmanor.varmintridge`.
3. Run the app on your iPhone.
4. Leave the app, long-press the Home Screen, tap Edit, then Add Widget, and search for Varmint Ridge.
5. Add Best Score, Daily Challenge, and Varmint of the Day. Add Ridge Glance from the Lock Screen widget gallery.

Play one round so a best score exists, then go back to the Home Screen. The small widget should show that score. Today's varmint and the daily challenge change at local midnight.

Do not add an advertising or analytics package. Do not turn `IAP_ENABLED` on until the App Store products exist.
