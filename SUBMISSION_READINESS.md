# Submission readiness

This branch is not submission-ready. A green test run is not a signed iPhone build, and it is not an App Store listing.

Branch: `iap-test` on Jump4Joy1/varmint-ridge. Pull request #3 stays open. Do not merge it from this note. The public site https://jump4joy1.github.io/varmint-ridge/ is the older main build and is not this branch.

## Verified here

These checks ran in Node on this branch. They do not use a Mac, Xcode, or a device.

| Check | Command | What it actually shows |
| --- | --- | --- |
| Shop, gate, save, phone | `node tests/iap-audit.mjs` | Mock purchases, grown-up gate, reload, one-time Starter Pack, daily seed, 12 waves, color-blind, reduced motion, 390px gate. `IAP_ENABLED` is false. No ad SDK in the page. |
| Same audit, second run | `node tests/iap-audit.mjs` | Repeated after the cache bump. No failure. |
| Widget source | `node tests/widget-contract.mjs` | Swift tables match the web game. Fixture `jwmanor-vr-2026-10-30` is hash 3339250613, Possum, Lantern Watch, wave 1. |
| Service worker | read of `www/sw.js` and `ios-app/assets/www/sw.js` | Both use `varmint-ridge-iphone-9`. Network first. Activate deletes older cache names. |

Also true in the source, and covered by those checks:

- All ages. No ads. Light, dark, and a color-blind setting.
- Purchases are fixed mock packs behind the grown-up question. Nothing is random. Nothing charges a card.
- Add to Home Screen is the Safari path in `IPHONE.md`. That is not the widget install.

## UNRUN

- `xcodebuild` was not run.
- The widget was not installed on an iPhone. See `WIDGETS.md`.
- No signing, no provisioning profile, no TestFlight upload.
- No App Store Connect listing, screenshots, age rating, or privacy answers.
- Real in-app purchase is off by design. As of Nov 10, 2026 there is no billing SDK code in the page at all (RevenueCat and cordova-plugin-purchase paths removed). No store product was created.
- Cloudflare review settings were not changed. That project is coordinator-managed.

## Blockers before any store submission

1. A Mac.
2. Xcode 16 or newer.
3. An Apple Developer Program membership.
4. Sign the app target and the VarmintRidgeWidgets target. Both need the App Group `group.com.jwmanor.varmintridge`.
5. An App Store Connect listing: name, screenshots, age rating, and the privacy answers. The app does not use tracking, location, or ads.
6. Leave `IAP_ENABLED` false until real products exist. Turning it on is a separate decision. This branch must not be submitted as a paid build.
7. Widgets do not install from the website, from GitHub Pages, or from Safari Add to Home Screen.

## Backlog (do not treat as done)

- Device check of the four widgets after the Xcode steps above.
- Do not run `tools/patch-index.mjs`. It still describes the Bandit King as wave 10. The live game is wave 12.
- Do not merge pull request #3 until that is asked for.
- Do not overwrite https://jump4joy1.github.io/varmint-ridge/.
