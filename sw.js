/* English Classes — offline cache of the app files */
const V = "mca-v6";
const CORE = ["./", "index.html", "config.js", "claude-shim.js", "manifest.webmanifest", "vendor/three.min.js", "vendor/supabase.js", "icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && !k.startsWith("mca-files")).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const keyOf = (u) => { const x = new URL(u); x.search = ""; x.hash = ""; return x.href; };   // "?v=123" and plain URL share one cached copy
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method === "GET" && /(^|\.)cdn\.jsdelivr\.net$/.test(u.hostname) && /supabase/.test(u.pathname)) {   // login library: cache first, to start without network
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
    return;
  }
  if (e.request.method === "GET" && /\.supabase\.co$/.test(u.hostname) && /\/storage\/v1\/object\/(public|sign)\//.test(u.pathname)) {   // exam papers, pictures, PDF: kept after the first opening
    e.respondWith(caches.open(V).then((ca) => ca.match(e.request).then((r) => r || fetch(e.request).then((res) => { if (res.ok) ca.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;          // Supabase, Gemini, fonts: always online
  if (/version\.json$/.test(u.pathname)) return;                                     // version check: always the server
  const isStatic = /\/(img|vendor|icons)\//.test(u.pathname);
  if (isStatic) {                                                                    // 3D pictures: cache first
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
    return;
  }
  // page and scripts: network first, never the browser's HTTP cache
  const key = keyOf(e.request.url), forced = u.searchParams.has("v");
  const net = fetch(e.request.url, { cache: "no-store", credentials: "same-origin" }).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((ca) => ca.put(key, c)); } return res; });
  const old = () => caches.match(key).then((r) => r || caches.match(e.request));
  if (forced) { e.respondWith(net.catch(old)); return; }                             // "?v=…": the user asked for the new version, wait for it
  const slow = new Promise((resolve) => setTimeout(() => old().then((r) => resolve(r || null)), 6000));   // network too slow: open the saved copy
  e.respondWith(Promise.race([net.catch(() => null), slow]).then((r) => r || net.catch(old)));
});

// tap on a notification: open the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ("focus" in c) return c.focus(); } return self.clients.openWindow("./"); }));
});
