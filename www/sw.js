/* Ma Classe d'Anglais — cache hors-ligne des fichiers de l'application */
const V = "mca-v4";
const CORE = ["./", "index.html", "config.js", "claude-shim.js", "manifest.webmanifest", "vendor/three.min.js", "vendor/supabase.js", "icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && !k.startsWith("mca-files")).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method === "GET" && /(^|\.)cdn\.jsdelivr\.net$/.test(u.hostname) && /supabase/.test(u.pathname)) {   // librairie de connexion : cache d'abord, pour démarrer sans réseau
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
    return;
  }
  if (e.request.method === "GET" && /\.supabase\.co$/.test(u.hostname) && /\/storage\/v1\/object\/(public|sign)\//.test(u.pathname)) {   // sujets d'épreuves, images, PDF : gardés après la 1re ouverture
    e.respondWith(caches.open(V).then((ca) => ca.match(e.request).then((r) => r || fetch(e.request).then((res) => { if (res.ok) ca.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;          // Supabase, Gemini, polices : toujours en ligne
  const isStatic = /\/(img|vendor|icons)\//.test(u.pathname);
  if (isStatic) {                                                                    // images 3D : cache d'abord
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; })));
  } else {                                                                           // page et scripts : réseau d'abord
    const net = fetch(e.request).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return res; });
    const slow = new Promise((resolve) => setTimeout(() => caches.match(e.request).then((r) => resolve(r || null)), 3500));   // réseau trop lent : on ouvre la copie gardée
    e.respondWith(Promise.race([net.catch(() => null), slow]).then((r) => r || net.catch(() => caches.match(e.request))));
  }
});
