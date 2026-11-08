/* JW Manor Homestead Games menu cache. No ads. No remote calls.
   Saved on this device: this menu and its manifest only. Games are not saved. */
const CACHE = "manor-games-hub-6";
const ASSETS = ["./index.html", "./manifest.webmanifest"];

function menuIndex() {
  return new URL("./index.html", self.location).href;
}

function rootPath() {
  return new URL("./", self.location).pathname;
}

function isMenuDocument(url) {
  const root = rootPath();
  return url.pathname === root || url.pathname === root + "index.html";
}

function isPrecached(url) {
  const root = rootPath();
  return url.pathname === root + "index.html" || url.pathname === root + "manifest.webmanifest";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function fromNetworkOrCache(request, url) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && !fresh.redirected) {
      const cache = await caches.open(CACHE);
      await cache.put(request, fresh.clone());
      if (isMenuDocument(url) && request.url !== menuIndex()) {
        await cache.put(menuIndex(), fresh.clone());
      }
      return fresh;
    }
  } catch (e) {}
  const cached = await caches.match(isMenuDocument(url) ? menuIndex() : request);
  if (cached) return cached;
  return null;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    if (isMenuDocument(url) || isPrecached(url)) {
      const saved = await fromNetworkOrCache(request, url);
      if (saved) return saved;
    } else {
      try {
        return await fetch(request);
      } catch (e) {}
    }
    if (request.mode === "navigate") {
      return new Response(
        "<!DOCTYPE html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Not saved</title><p>This page is not saved on this device. The games menu can open offline. This page cannot.</p>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
      );
    }
    return new Response("", { status: 503, headers: { "Cache-Control": "no-store" } });
  })());
});
