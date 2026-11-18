# Varmint Ridge

A family garden-defense game from JW Manor. All ages. No ads.

Keep at least one crop bed alive through twelve named waves. Place a Scarecrow, Lantern, or Snap Trap, upgrade the fence, and send Zeus the farm dog after whatever is closest to the tomatoes. Wave 12 is the Bandit King.

## Play in a browser

The game is static files in `www/`.

```bash
npm ci
node scripts/serve-www.mjs
```

Open http://127.0.0.1:4173/ . First launch shows a short tutorial, then Wave 1 points at place, start, and keep a bed alive. Settings has music, effects, haptics, color-blind safe, and light or dark.

Continue restores a saved build. Today's Ridge is a one-wave challenge seeded by the local date.

## Family rules

- No ads, no analytics, no tracking SDKs.
- Gem shop and Season 1 Pass are **mock-only** behind a grown-up math question. Confirming a pack does not charge a card. There are no loot boxes or random paid rewards.
- Contact: [support@backfortyapps.com](mailto:support@backfortyapps.com)
- Support: https://backfortyapps.com/varmint-ridge/support/
- Privacy: https://backfortyapps.com/varmint-ridge/privacy/

In-app pages: `www/privacy.html`, `www/terms.html`, `www/support.html`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run test:iap
npm run build
```

`npm run build` copies `www/` into `ios-app/assets/www` and, when native folders exist, runs `npx cap sync`. It does not deploy GitHub Pages.

## Device shell

Capacitor wraps `www/` for iOS and Android. Bundle ID `com.jwmanor.varmintridge`. Version **1.0.0** build **1**.

```bash
npx cap sync
```

Opening Xcode or Android Studio, signing, and installing on a phone still need Jesse's developer accounts. See `REVIEW.md`.

The Expo project in `ios-app/` is the WidgetKit wrapper. Widgets do not install from the website.

## Store drafts

`store/app-store.md` and `store/play-store.md` plus screenshots from `npm run screenshots`. Do not upload them from this branch.

## GitHub Pages

https://jump4joy1.github.io/varmint-ridge/ publishes **main** only (`.github/workflows/pages.yml`). This branch does not change that.
