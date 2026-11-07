## Widgets (2026-11-07)

The WidgetKit source is in the repo. It has not been compiled. `WIDGETS.md` is the checklist: xcodebuild not run, device install not run. A Mac, Xcode 16 or newer, and an Apple Developer account are still required. The website cannot add the widgets.

## Shop audit (2026-11-05)

Continuing a saved game keeps a coin pack and a Zeus bonus bought after the save, and it keeps an armed speed-up. A second tap does not buy twice, cancel does not spend, and an expired grown-up question has to be answered again. The Starter Pack, lessons, skins, and season rewards grant once. Real billing stays off. The campaign is still free to play.

## Test-mode shop (2026-11-03)

Gems are saved on the device. The store lists fixed packs only: gem packs, the Starter Pack, speed-ups, defense lessons, cosmetic yard and varmint skins, and Season 1 with the free and paid tracks both visible before you buy. Prices stay on the buttons. Settings keeps a spend summary. There is no timer, no ads, and no surprise box. Real billing stays off. A grown-up math question still comes first.

## Short phone pass (2026-11-03)

On a short phone the title keeps Settings, both volume sliders, and the privacy line on screen. Tapping a defense at either edge of the yard opens Upgrade and Sell inside the garden, stacked, not cut off. Short phones skip the blur behind menus. If the phone asks for less motion, the screen does not shake. Real purchases stay off.

## Phone pass (2026-11-02)

Wave 1 shows three tap hints: place a scarecrow, start the wave, keep one bed alive. They stop after wave 1, and they stay off for Today's Ridge. Small phones get taller buttons, a larger Start pill, and a wider thumb reach. Settings has Color-blind safe (blue, orange, and a circle, square, or triangle). Older short phone screens drop the pixel ratio to 1.25 and skip blur, the extra banjo voice, and some particles. Real purchases stay off.

## Polish pass (2026-11-02)

The campaign is 12 waves. Fox Trot and Moonlit Run sit in front of the Bandit King. Foxes hop the fence once, then nip the beds. Phone placement is slide-then-lift, with a bigger thumb target. A mouse still places on the click. The banjo has a quieter lower voice, plus a soft wind bed, a fox yip, and a rare crow call. Mist drifts in the yard and healthy crops show dew. Real purchases stay off. The Coin Pack test purchase is still behind the grown-up math screen. Widgets use the same Bandit King line, now wave 12, and the large widget shows waves opened of 12. The daily seed did not change. Music and effects now have separate sliders on the title and on Pause, saved on the device. Ground varmints keep one sideways offset instead of shaking off the bed every frame. Hit flashes are drawn on the critter, not with ctx.filter. The theme chip hides during play so it does not cover Pause.

# Varmint Ridge: Status (2026-10-14, phone shell 2026-10-30)

## iPhone install + widgets (2026-10-30)

The game loop below is unchanged. This pass is the phone shell.

- Add to Home Screen: `manifest.webmanifest` (`display: standalone`, portrait), apple-touch icon, `apple-mobile-web-app-capable`, and a black-translucent status bar. Light and dark still follow the system, with a saved override, and the theme-color meta follows the theme.
- Offline: `sw.js` precaches the page, privacy page, manifest, and icons. Scores stay in localStorage. No network is required to play.
- Notch and home indicator: the shell pads with `env(safe-area-inset-*)` on all four sides, and the canvas is fitted to the space that remains, including the real height of the control bar.
- Phone controls: the yard bar shares the width (no sideways scroll), targets are at least 44px, tower taps are larger for a finger than for a mouse, and the pause / fast-forward / start-wave hits on the canvas are bigger.
- Family rules unchanged: all ages, no ads, no people in the art. Real App Store billing stays `IAP_ENABLED=false`. Browser test mode (`IAP_TEST`) can finish the Coin Pack after a grown-up math question. The question is its own screen. The store, prices, and the test purchase sheet stay hidden until the answer is right. A test purchase does not charge a card. 500 coins are banked for the next game.
- Today's Ridge is a real one-wave challenge seeded by the local date. The same seed drives the widgets.
- Native widgets live in `ios-app/` as a WidgetKit extension (`@bacons/apple-targets`), not as HTML. Four options: Best Score (small), Daily Challenge (medium), Varmint of the Day (large), Ridge Glance (Lock Screen). The app writes the best score into App Group `group.com.jwmanor.varmintridge`. See `IPHONE.md`.

## Before (commit 967be72, 56,023 bytes)
**Honest completion: ~45%.** The game ran with no console errors, but it was two scripts stacked on top of each other: the 13KB original plus the "VR ADD 1" add-on, which monkey-patched most of its functions.

Gaps found in the headless audit:
- How to Play was a browser `alert()` box.
- Towers dealt invisible "aura" damage, with no shots, no feedback, and no hit effects.
- You could place defenses anywhere, even stacked on each other, on the fence, or on the HUD. You couldn't select, upgrade, or sell them.
- No build phase: waves started on their own, and the shop opened mid-flow.
- Losing any one crop meant instant game over, which made it far too punishing. A typical run ended on wave 3.
- Leftover dead code from the original: a duplicate keydown handler, an unused update loop, and an `S` key that opened the shop mid-wave.
- Flat placeholder art, no parallax, a weak HUD, no win celebration, and no stars or rating.
- Touch bar buttons were plain text with no costs shown. The canvas scaling was crude.
- No level select. Sound and the banjo loop worked, and mute, pause, top 5 scores, and save/continue were already in.

## After (the single-file rewrite)
**Honest completion: ~90%.** Clean single-file rewrite. All the content from the add-on was kept.
- Full loop: title, build phase, named waves (10 in the rewrite, 12 after the polish above), between-wave upgrade shop, then win or lose with a 1 to 3 star rating, initials, and a top 5 board. Continue/save works, plus Choose Wave (unlocks as you progress).
- Defenses: Scarecrow (slow pulse that scares crows), Lantern (light bolts, extra damage on fliers), Snap Trap (hits ground critters, including armadillos while they dig). Each upgrades to Level 3 and can be sold for 60% back. Placement rules come with a live range preview.
- Critters: Raccoon (steals a crop and runs, and catching it saves the crop), Crow (flies over the fence), Armadillo (burrows under the fence), Possum (plays dead once), Fox (hops the fence once, then nips the beds), and the Bandit King boss on wave 12, who calls in his gang at 66% and 33% health. Homestead upgrades: Fence Lv 3, Zeus the farm dog Lv 3, and Crop Care.
- You lose only when all 5 crop beds are gone. The Clean Beds daily ends if any one bed is lost.
- Visuals are all canvas-drawn: a sky that moves from dusk to night across the waves, layered hills, treeline, barn, drifting clouds, fireflies and stars, and a vignette. Critters are animated and drawn with gradients. You get hit flashes, particle bursts, lightning-style lantern bolts, pulse rings, screen shake, coins that fly to the HUD, floating text, an animated wave banner, and a boss health bar.
- UI: styled overlays with no alerts, tower cards drawn on canvas showing costs and affordability, a pause screen, x2 fast-forward, and a mute toggle that is saved. Keys: 1/2/3, Space, F, P/Esc, M. Pointer events work for mouse and touch. The layout is responsive with crisp DPR scaling, and the game auto-pauses when the tab is hidden.
- Family rule: no people, only critters, the dog, and a straw scarecrow. Colors are #305032, #C19A50, #1A1A1A.

## Remaining
- A real-device pass on iOS Safari using `IPHONE.md`. This desk can only check a phone-sized browser, not a physical iPhone.
- Balance tuning from human playtests. Optional extras: endless mode, achievements. Wave numbers were not retuned this round.
- Apple Developer account, then `ios-app/README.md`, before the widgets can be installed on a phone.

## Supporter Store (native IAP, OFF)
- Stripe was removed: the payment-link slots and the `?paid=` handler are gone. The games are sold only through the App Store and Google Play. See `../IAP_PLAN.md`.
- The `IAP` module offers `products`, `purchase(sku)`, `restore()`, `onEntitlement(key, sku)` and `init()`. Natively it uses RevenueCat, or `cordova-plugin-purchase` as a fallback, and only when `IAP_ENABLED` is true. In a browser, `IAP_TEST` runs the same Coin Pack / Ridge Pass / Starter Bundle flow with a confirm step and no charge. Coin Pack banks 500 coins for the next game. The grown-up multiplication question opens first, on its own screen.
- Products: `com.jwmanor.varmintridge.coins` (consumable, $0.99, 500 coins banked), `.ridgepass` (non-consumable, $2.99, all waves), `.starter` (non-consumable, $1.99, 300 coins + Zeus Lv1, granted once).
- The grown-up math gate guards the store, and each Buy and Restore once the two-minute pass expires. Grants happen only from plugin callbacks, and RevenueCat does the server-side receipt validation.
