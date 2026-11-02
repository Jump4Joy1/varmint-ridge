# Varmint Ridge on an iPhone

## Add to Home Screen (Safari, no App Store)

Host this folder on HTTPS. Opening the files from a computer over USB, or from a `file://` page, will not install a home-screen app and will not run the service worker.

1. On the iPhone, open `index.html` in Safari (not Chrome, not an in-app browser).
2. Tap Share, then Add to Home Screen. The name should be Varmint Ridge and the icon should be the pine raccoon.
3. Open it from the home screen. It should be full screen, with no Safari toolbar, and the garden should sit below the notch and above the home indicator.
4. Turn on airplane mode and open the icon again. The title screen should still load. Scores stay on the phone.
5. Tap the moon/sun chip to move between Auto, Light, and Dark.
6. Play a wave with a thumb. Slide on the yard, then lift, to place a defense. A mouse still places on the click. The five buttons under the garden should be easy to hit, and tapping a defense you already placed should open Upgrade / Sell. The campaign is 12 waves. Foxes show up later and hop the fence once.
7. Tap Supporter Store. A multiplication question appears on its own screen. Wrong answers do not open the store. After a right answer, Coin Pack can be confirmed in test mode. That adds 500 coins to the next game and does not charge a card. There are no ads.

Today's Ridge (on the title screen) is the same challenge the widgets describe.

## Widgets (needs the Xcode project)

Widgets cannot be added from the Safari home-screen icon. They ship inside the Expo app in `ios-app/`. See `ios-app/README.md`. You need a Mac, Xcode, and an Apple Developer account before a real iPhone will run that build.
