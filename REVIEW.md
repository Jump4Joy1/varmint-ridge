# Varmint Ridge review — device-ready branch

Branch: `cursor/device-ready-69b0` on Jump4Joy1/varmint-ridge.

This pull request **supersedes** [#3](https://github.com/Jump4Joy1/varmint-ridge/pull/3) (iap-test) and [#4](https://github.com/Jump4Joy1/varmint-ridge/pull/4) (launcher-identity). Leave those two as they are; Jesse's coordinator can close them. Do not merge this branch to `main` unless you mean to republish GitHub Pages. `.github/workflows/pages.yml` is unchanged and still deploys **main** only.

PR #3 was already on `main` when this work started (merged 11 Nov 2026). This branch still carries that shop, plus every launcher-identity commit from #4, plus the device-ready pass below.

## What is done and verified here

These checks run in Node on Linux. They do not use a Mac, Xcode, or a physical phone.

| Check | Command | What it shows |
| --- | --- | --- |
| Lint | `npm run lint` | ESLint on `src/`, tests, scripts, Capacitor and Playwright configs |
| Typecheck | `npm run typecheck` | `tsc --noEmit` on the TypeScript configs and e2e specs |
| Unit tests | `npm test` | Damage (possum, Bandit King summons, lantern vs fliers, trap vs armadillo), economy (place / upgrade / sell / homestead), twelve waves and HP scale, save/load with banked coins, daily seed fixture `jwmanor-vr-2026-10-30`, mock gem grants, contact URLs, cache name, no ads |
| Hub contract | `node tests/hub-menu.mjs` | Public menu from #4: only reviewed Varmint Ridge links, other cards unlinked, parental gate, light/dark, cache `manor-games-hub-7` |
| Widget contract | `node tests/widget-contract.mjs` | Swift tables still match the web game. Fixture hash 3339250613, Possum, Lantern Watch, wave 1 |
| Shop / gate / phone | `npm run test:iap` | Mock purchases, grown-up gate, reload, Starter Pack once, daily seed, 12 waves, color-blind, reduced motion, 390px gate. `IAP_ENABLED` is false |
| Playwright 390×844 | `npm run test:e2e` | Light and dark: start, first-run tutorial, a wave win, a loss, campaign win screen, shop behind the parental gate, settings (haptics, theme, volume) |
| Build / stage | `npm run build` | Copies `www/` into `ios-app/assets/www` and syncs Capacitor web assets. Does not sign or upload |

Also true in the source:

- Full campaign: 12 named waves, Scarecrow / Lantern / Snap Trap to level 3, Fence / Zeus / Crop Care, raccoons, crows, armadillos, possums, foxes, Bandit King. Title, How to Play, Choose Wave, high scores, pause, win/lose with stars, save and resume, Today's Ridge.
- First-run tutorial overlay, then Wave 1 tap hints.
- Settings: music, effects, haptics, color-blind safe, Light / Dark / Auto. Every overlay follows the theme.
- Hit flashes, death bursts, lantern bolts, scarecrow pulses, snap bites, crop-lost shake (skipped when the phone asks for less motion). Banjo plus wind bed, separate volume sliders.
- Gem shop and Season 1 Pass are mock-only behind the grown-up math gate. Fixed packs. No loot boxes. No real billing SDK.
- Service worker cache name: `varmint-ridge-iphone-10` (bumped so returning players fetch this build).
- Public contact is **support@backfortyapps.com**. Support URL https://backfortyapps.com/varmint-ridge/support/ . Privacy URL https://backfortyapps.com/varmint-ridge/privacy/ . In-app `privacy.html`, `terms.html`, `support.html` have no placeholder copy.
- No analytics or tracking SDKs.
- Capacitor iOS and Android projects are in the repo (`com.jwmanor.varmintridge`, version 1.0.0, build 1). `ios/App/App/PrivacyInfo.xcprivacy` declares no tracking and no collected data.
- Store drafts in `store/app-store.md` and `store/play-store.md`. Screenshots from real gameplay: iPhone 6.9" 1320×2868, iPhone 6.3" 1179×2556, Play phone 1080×1920, via `npm run screenshots`.
- Lockfile `package-lock.json` is committed.

What was scaled down on purpose (still a real, playable version, called out so it is not treated as missing):

- Art is canvas-drawn (the original look), not a 3D engine. There is no placeholder "coming soon" screen in the garden game.
- Music is the synthesized banjo and wind bed already in the page, with real volume controls, not a licensed studio score.
- The Expo `ios-app/` WidgetKit extension is unchanged in role: source is here; it still has not been compiled on a Mac.

## What needs a Mac / Xcode or a real device

- `xcodebuild` for the Capacitor iOS app and for `ios-app/` widgets. Not run here.
- `pod install` on a Mac (CocoaPods is not run on this Linux agent). The `ios/` project is present.
- Android Studio / Gradle install on a phone. The `android/` project is present; a signed Play AAB was not built.
- Physical iPhone or Android pass: notch, haptics, 60 fps, Add to Home Screen, airplane-mode offline, widget install.
- TestFlight / internal Play testing.

See `IPHONE.md` and `WIDGETS.md`. Those still say widget compile and device install are UNRUN.

## What only Jesse can decide

- Apple Developer Program and Google Play developer accounts.
- Signing, provisioning, App Group `group.com.jwmanor.varmintridge` on a paid team.
- Turning `IAP_ENABLED` on and creating real App Store / Play products. This branch must not ship as a paid build.
- Merging to `main` (that republishes https://jump4joy1.github.io/varmint-ridge/).
- Uploading screenshots or listings to App Store Connect or Play Console.
- Closing pull requests #3 and #4.

## Pages

Do not treat this pull request as live. GitHub Pages settings were not touched.
