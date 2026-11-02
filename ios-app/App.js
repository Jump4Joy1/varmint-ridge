import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { WebView } from "react-native-webview";
import { ExtensionStorage } from "@bacons/apple-targets";

const APP_GROUP = "group.com.jwmanor.varmintridge";
const storage = new ExtensionStorage(APP_GROUP);

const FILES = {
  "index.html": require("./assets/www/index.html"),
  "manifest.webmanifest": require("./assets/www/manifest.webmanifest"),
  "sw.js": require("./assets/www/sw.js"),
  "privacy.html": require("./assets/www/privacy.html"),
  "icons/favicon.svg": require("./assets/www/icons/favicon.svg"),
  "icons/apple-touch-icon.png": require("./assets/www/icons/apple-touch-icon.png"),
  "icons/icon-192.png": require("./assets/www/icons/icon-192.png"),
  "icons/icon-512.png": require("./assets/www/icons/icon-512.png"),
  "icons/icon-maskable.png": require("./assets/www/icons/icon-maskable.png"),
  "icons/icon-full.svg": require("./assets/www/icons/icon-full.svg"),
  "icons/icon-maskable.svg": require("./assets/www/icons/icon-maskable.svg"),
};

function wantsDaily(url) {
  return typeof url === "string" && url.includes("daily");
}

async function stageWww() {
  const root = FileSystem.documentDirectory + "ridge-www/";
  await FileSystem.makeDirectoryAsync(root + "icons", { intermediates: true });
  for (const [rel, mod] of Object.entries(FILES)) {
    const asset = Asset.fromModule(mod);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error("Missing bundled file " + rel);
    await FileSystem.copyAsync({ from: asset.localUri, to: root + rel });
  }
  return { uri: root + "index.html", dir: root };
}

function writeWidget(snap) {
  if (!snap) return;
  storage.set("vr.best", Number(snap.best) || 0);
  storage.set("vr.initials", String(snap.initials || "").slice(0, 3));
  storage.set("vr.reach", Number(snap.reach) || 1);
  ExtensionStorage.reloadWidget();
}

export default function App() {
  const webRef = useRef(null);
  const [ready, setReady] = useState(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let live = true;
    (async () => {
      const initial = await Linking.getInitialURL();
      const staged = await stageWww();
      if (!live) return;
      setReady({ ...staged, launch: wantsDaily(initial) ? "daily" : "play" });
    })().catch(() => {
      if (live) setReady({ error: true });
    });
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (!wantsDaily(url)) return;
      webRef.current?.injectJavaScript(
        "window.__VR_LAUNCH__='daily';if(window.VR&&window.VR.promptDaily)window.VR.promptDaily();true;",
      );
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  const ink = theme === "light" ? "#F3E6C4" : "#1A1A1A";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ink }]}>
      <StatusBar barStyle={theme === "light" ? "dark-content" : "light-content"} />
      {ready && ready.uri ? (
        <WebView
          ref={webRef}
          style={styles.web}
          source={{ uri: ready.uri }}
          allowingReadAccessToURL={ready.dir}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={`window.__VR_LAUNCH__=${JSON.stringify(ready.launch)};true;`}
          onShouldStartLoadWithRequest={(req) => {
            const url = req.url || "";
            return url.startsWith("file:") || url.startsWith("about:");
          }}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type !== "vr-widget") return;
              if (msg.snap && (msg.snap.theme === "light" || msg.snap.theme === "dark")) {
                setTheme(msg.snap.theme);
              }
              writeWidget(msg.snap);
            } catch {
              /* ignore non-widget messages */
            }
          }}
        />
      ) : (
        <View style={styles.boot}>
          {ready && ready.error ? (
            <Text style={styles.title}>The ridge didn't load. Reinstall the app.</Text>
          ) : (
            <>
              <Text style={styles.kicker}>JW MANOR</Text>
              <Text style={styles.title}>Varmint Ridge</Text>
              <ActivityIndicator color="#C19A50" />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  web: { flex: 1, backgroundColor: "transparent" },
  boot: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  kicker: { color: "#C19A50", letterSpacing: 2, fontSize: 13 },
  title: { color: "#F3E6C4", fontSize: 32, textAlign: "center" },
});
