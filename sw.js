/* Ma Classe d'Anglais — cache hors-ligne des fichiers de l'application */
const V = "mca-v5";
const CORE = ["./", "index.html", "config.js", "claude-shim.js", "manifest.webmanifest", "vendor/three.min.js", "icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method === "GET" && /(^|\.)cdn\.jsdelivr\.net$/.test(u.hostname) && /supabase/.test(u.pathname)) {   // librairie de connexion : cache d'abord, pour démarrer sans réseau
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
    return;
  }
  if (e.request.method === "GET" && /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)) {   // polices : gardées pour le hors-ligne
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; }).catch(() => r)));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;          // Supabase, Gemini, polices : toujours en ligne
  const isStatic = /\/(img|vendor|icons)\//.test(u.pathname);
  if (isStatic) {                                                                    // images 3D : cache d'abord
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
  } else {                                                                           // page et scripts : réseau d'abord
    e.respondWith(fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; }).catch(() => caches.match(e.request).then((r) => r || (e.request.mode === "navigate" ? caches.match("index.html").then((i) => i) : undefined))));
  }
});
