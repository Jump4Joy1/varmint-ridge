# Varmint Ridge widgets

Status: UNRUN

xcodebuild: not run

device install: not run

The checks in this repo read the Swift and the web game. They do not compile a widget, sign an app, or place anything on an iPhone Home Screen. A green check is not a WidgetKit install.

## What is in the repo

Four WidgetKit layouts, written in SwiftUI, not as HTML:

| Widget | Family | Shows |
| --- | --- | --- |
| Best Score | Home Screen small | Top score and initials |
| Daily Challenge | Home Screen medium | Today's rule and wave |
| Varmint of the Day | Home Screen large | Critter, line, daily, and waves opened of 12 |
| Ridge Glance | Lock Screen | Varmint, best score, daily title |

The daily varmint list is Raccoon, Crow, Armadillo, Possum, and Bandit King. Fox is a campaign critter, not a daily widget critter. The date seed is FNV-1a of `jwmanor-vr-YYYY-MM-DD`. The fixture `jwmanor-vr-2026-10-30` is hash 3339250613, Possum, Lantern Watch, wave 1. The same tables are in `www/index.html` and `ios-app/targets/widget/RidgeData.swift`.

App Group: `group.com.jwmanor.varmintridge`. Bundle id: `com.jwmanor.varmintridge`. Light and dark colors are pine `#305032`, gold `#C19A50`, ink `#1A1A1A`, and cream `#F3E6C4`.

## What a real iPhone still needs

1. A Mac.
2. Xcode 16 or newer.
3. An Apple Developer Program membership. The App Group will not install on a device without it.
4. From `ios-app/`: `npm run stage`, `npm install`, `npx expo prebuild -p ios --clean`, then open the workspace.
5. Sign the app target and the VarmintRidgeWidgets target. Confirm the App Group on both.
6. Run on a phone. Add the widgets from the Home Screen and Lock Screen galleries. They do not install from the website, from GitHub Pages, or from the Safari Add to Home Screen icon.

No ads. No store signing in these checks. Real billing stays off.
