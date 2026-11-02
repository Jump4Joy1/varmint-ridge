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
- Full loop: title, build phase, 10 named waves, between-wave upgrade shop, then win or lose with a 1 to 3 star rating, initials, and a top 5 board. Continue/save works, plus Choose Wave (unlocks as you progress).
- Defenses: Scarecrow (slow pulse that scares crows), Lantern (light bolts, extra damage on fliers), Snap Trap (hits ground critters, including armadillos while they dig). Each upgrades to Level 3 and can be sold for 60% back. Placement rules come with a live range preview.
- Critters: Raccoon (steals a crop and runs, and catching it saves the crop), Crow (flies over the fence), Armadillo (burrows under the fence), Possum (plays dead once), and the Bandit King boss on wave 10, who calls in his gang at 66% and 33% health. Homestead upgrades: Fence Lv 3, Zeus the farm dog Lv 3, and Crop Care.
- You lose only when all 5 crop beds are gone. The Clean Beds daily ends if any one bed is lost.
- Visuals are all canvas-drawn: a sky that moves from dusk to night across the waves, layered hills, treeline, barn, drifting clouds, fireflies and stars, and a vignette. Critters are animated and drawn with gradients. You get hit flashes, particle bursts, lightning-style lantern bolts, pulse rings, screen shake, coins that fly to the HUD, floating text, an animated wave banner, and a boss health bar.
- UI: styled overlays with no alerts, tower cards drawn on canvas showing costs and affordability, a pause screen, x2 fast-forward, and a mute toggle that is saved. Keys: 1/2/3, Space, F, P/Esc, M. Pointer events work for mouse and touch. The layout is responsive with crisp DPR scaling, and the game auto-pauses when the tab is hidden.
- Family rule: no people, only critters, the dog, and a straw scarecrow. Colors are #305032, #C19A50, #1A1A1A.

## Remaining
- A real-device pass on iOS Safari using `IPHONE.md`. `ctx.filter` hit-flash may not show on older Safari, but that is cosmetic.
- Balance tuning from human playtests. Optional extras: endless mode, achievements.
- A music volume slider separate from sound effects (right now one mute covers both).
- Apple Developer account, then `ios-app/README.md`, before the widgets can be installed on a phone.

## Supporter Store (native IAP, OFF)
- Stripe was removed: the payment-link slots and the `?paid=` handler are gone. The games are sold only through the App Store and Google Play. See `../IAP_PLAN.md`.
- The `IAP` module offers `products`, `purchase(sku)`, `restore()`, `onEntitlement(key, sku)` and `init()`. Natively it uses RevenueCat, or `cordova-plugin-purchase` as a fallback, and only when `IAP_ENABLED` is true. In a browser, `IAP_TEST` runs the same Coin Pack / Ridge Pass / Starter Bundle flow with a confirm step and no charge. Coin Pack banks 500 coins for the next game. The grown-up multiplication question opens first, on its own screen.
- Products: `com.jwmanor.varmintridge.coins` (consumable, $0.99, 500 coins banked), `.ridgepass` (non-consumable, $2.99, all waves), `.starter` (non-consumable, $1.99, 300 coins + Zeus Lv1, granted once).
- The grown-up math gate guards the store, and each Buy and Restore once the two-minute pass expires. Grants happen only from plugin callbacks, and RevenueCat does the server-side receipt validation.
