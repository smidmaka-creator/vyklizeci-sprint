// Service worker: nutný pro instalaci jako appka + start bez připojení.
// Strategie "síť první": když je internet, vždy čerstvá verze (obchází i HTTP cache
// GitHub Pages); bez internetu poslední známá. Supabase, CDN a fonty jdou vždy přímo na síť.
const CACHE = "vyklizeci-sprint-v2";
const CORE = ["./", "./index.html", "./app.js", "./db.js", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: "no-cache", credentials: "same-origin" }).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
