# Varmint Ridge on an iPhone

## Add to Home Screen (Safari, no App Store)

Host this folder on HTTPS. Opening the files from a computer over USB, or from a `file://` page, will not install a home-screen app and will not run the service worker.

1. On the iPhone, open `index.html` in Safari (not Chrome, not an in-app browser).
2. Tap Share, then Add to Home Screen. The name should be Varmint Ridge and the icon should be the pine raccoon.
3. Open it from the home screen. It should be full screen, with no Safari toolbar, and the garden should sit below the notch and above the home indicator.
4. Turn on airplane mode and open the icon again. The title screen should still load. Scores stay on the phone.
5. Tap the moon/sun chip to move between Auto, Light, and Dark. Settings, on the title screen and while paused, turns on Color-blind safe. Health bars use blue and orange, plus a circle, square, or triangle.
6. Play wave 1 with a thumb. The yard says where to tap: place a scarecrow, then tap Start Wave, then keep one bed alive. Those tips are gone on wave 2. On a small phone the buttons under the garden are taller, and a tap still places when you lift. A mouse still places on the click. Tap a defense at the left or right edge. Upgrade and Sell stay on the screen. The campaign is 12 waves. Foxes show up later and hop the fence once.
7. Tap Supporter Store. A multiplication question appears on its own screen before any purchase, including gems. Wrong answers do not open the store. After a right answer you can read every pack before you buy: gem packs, the Starter Pack, speed-ups, defense lessons, yard and varmint skins, and Season 1 with a free track and a paid track. Nothing is random and nothing has a countdown. Confirming a pack in test mode does not charge a card. Settings lists what was spent. There are no ads.

Today's Ridge (on the title screen) is the same challenge the widgets describe.

## Widgets (needs the Xcode project)

Widgets cannot be added from the Safari home-screen icon. They ship inside the Expo app in `ios-app/`. See `ios-app/README.md`. You need a Mac, Xcode, and an Apple Developer account before a real iPhone will run that build.
