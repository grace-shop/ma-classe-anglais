/* =====================================================================
   Ma Classe d'Anglais — adaptateur « application autonome »
   L'application a été écrite pour Claude (window.claude.use(...)).
   Ce fichier fournit exactement les mêmes fonctions, mais branchées sur
   Supabase (base de données, comptes, fichiers, présence) et sur le
   serveur IA « ai » (Gemini). L'application elle-même ne change pas.
   ===================================================================== */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG || {};
  window.__STANDALONE = true;
  if (CFG.threeUrl) window.__THREE_URL = CFG.threeUrl;

  let sb = null, session = null, member = { level: "interact" };
  let resolveReady; const ready = new Promise((r) => (resolveReady = r));
  const rid = (n = 20) => { const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", b = new Uint8Array(n); crypto.getRandomValues(b); return Array.from(b, (x) => a[x % a.length]).join(""); };
  const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const plug = (n) => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]) || null;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  /* ---------------- erreurs ---------------- */
  function mapErr(e) {
    const m = String((e && (e.message || e.details)) || e || "");
    if (e && (e.code === "42501" || /row-level security|permission denied/i.test(m))) return { code: "invalid_argument", message: "Accès refusé" };
    if (e && e.code === "23514") return { code: "quota_exceeded", message: m };
    return { code: "unavailable", message: m || "Erreur réseau" };
  }


  /* ---------------- mode hors-ligne : cache de lecture + file d'attente d'écriture ---------------- */
  const idb = (() => {
    let p = null;
    const open = () => p || (p = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error("no idb"));
      const r = indexedDB.open("mca", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("kv"); d.createObjectStore("outbox", { keyPath: "k" }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = async (store, mode, fn) => {
      const d = await open();
      return new Promise((res, rej) => { const t = d.transaction(store, mode), rq = fn(t.objectStore(store)); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
    };
    return {
      get: (k) => tx("kv", "readonly", (s) => s.get(k)).catch(() => undefined),
      set: (k, v) => tx("kv", "readwrite", (s) => s.put(v, k)).catch(() => {}),
      all: () => tx("outbox", "readonly", (s) => s.getAll()).then((x) => x || []).catch(() => []),
      put: (v) => tx("outbox", "readwrite", (s) => s.put(v)),
      del: (k) => tx("outbox", "readwrite", (s) => s.delete(k)).catch(() => {}),
    };
  })();
  window.__outbox = { put: idb.put, all: idb.all, del: idb.del };

  const uidKey = () => (session && session.user && session.user.id) || "anon";
  const QK = "mca_q";
  const qRead = () => { try { return JSON.parse(localStorage.getItem(QK) || "[]"); } catch (e) { return []; } };
  const qWrite = (a) => { try { localStorage.setItem(QK, JSON.stringify(a.slice(-300))); } catch (e) {} try { window.dispatchEvent(new Event("mca-queue")); } catch (e) {} };
  window.__queueLen = () => qRead().filter((x) => x.u === uidKey()).length;
  const isNet = (e) => !navigator.onLine || (e && e.code === "unavailable");
  const runners = new Map(); // chemin -> fonctions de rafraîchissement des écouteurs
  const pokeRunners = (path) => { const s = runners.get(path); if (s) s.forEach((f) => { try { f(); } catch (e) {} }); };
  function deepMerge(a, b) {
    if (!a || typeof a !== "object" || Array.isArray(a) || !b || typeof b !== "object" || Array.isArray(b)) return b;
    const r = { ...a };
    for (const k of Object.keys(b)) r[k] = (r[k] && typeof r[k] === "object" && !Array.isArray(r[k]) && b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) ? deepMerge(r[k], b[k]) : b[k];
    return r;
  }
  // Affichage immédiat : on applique par-dessus les données les écritures encore en attente
  function withQueued(path, row) {
    const items = qRead().filter((x) => x.path === path && x.u === uidKey());
    if (!items.length) return row;
    let data = row ? row.data : undefined;
    for (const it of items) data = it.op === "s" ? it.patch : deepMerge(data || {}, it.patch);
    return { path, id: path.split("/").pop(), data };
  }
  let flushing = false;
  async function flushQueue() {
    if (flushing || !sb || !session || !navigator.onLine) return;
    flushing = true;
    try {
      let q = qRead();
      for (const it of q.filter((x) => x.u === uidKey())) {
        let err = null;
        if (it.op === "s") { const { error } = await sb.from("docs").upsert({ path: it.path, data: it.patch }, { onConflict: "path" }); err = error; }
        else { const { error } = await sb.rpc("doc_update", { p_path: it.path, p_patch: it.patch }); err = error; }
        if (err && isNet(mapErr(err))) break;           // toujours pas de réseau : on réessaiera
        q = qRead().filter((x) => x.id !== it.id);
        if (err) console.warn("écriture abandonnée", it.path, err.message);
        qWrite(q); pokeRunners(it.path);
      }
    } finally { flushing = false; }
  }
  addEventListener("online", () => { flushQueue(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) flushQueue(); });
  setInterval(flushQueue, 30000);
  function queueWrite(op, path, patch) {
    const q = qRead(); q.push({ id: rid(8), u: uidKey(), op, path, patch, at: Date.now() });
    qWrite(q); pokeRunners(path);
  }

  /* ---------------- base de données (même API que Claude) ---------------- */
  function snapOf(rows) {
    const docs = rows.map((r) => ({ id: r.id, exists: true, data: () => r.data, ref: docRef(r.path) }));
    return { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn) };
  }
  async function fetchRows(col, o) {
    let q = sb.from("docs").select("path,id,data").eq("col", col);
    for (const [f, op, v] of o.where || []) {
      const c = "data->>" + f, s = String(v);
      if (op === "==" || op === "eq") q = q.eq(c, s); else if (op === "!=" || op === "ne") q = q.neq(c, s);
      else if (op === ">" || op === "gt") q = q.gt(c, s); else if (op === ">=" || op === "gte") q = q.gte(c, s);
      else if (op === "<" || op === "lt") q = q.lt(c, s); else if (op === "<=" || op === "lte") q = q.lte(c, s);
    }
    q = o.order ? q.order("data->" + o.order[0], { ascending: o.order[1] !== "desc", nullsFirst: false }) : q.order("path");
    q = q.limit(Math.min(o.limit || 1000, 1000));
    const ck = "r:" + uidKey() + ":" + col + "|" + JSON.stringify(o);
    const { data, error } = await q;
    if (error) { const m = mapErr(error); if (m.code === "unavailable") { const c = await idb.get(ck); if (c) return c; } throw m; }
    idb.set(ck, data || []); return data || [];
  }
  async function getRow(path) {
    const ck = "d:" + uidKey() + ":" + path;
    const { data, error } = await sb.from("docs").select("path,id,data").eq("path", path).maybeSingle();
    if (error) { const m = mapErr(error); if (m.code === "unavailable") { const c = await idb.get(ck); if (c !== undefined) return withQueued(path, c); } throw m; }
    idb.set(ck, data || null); return withQueued(path, data);
  }
  async function putDoc(path, data) {
    const clean = JSON.parse(JSON.stringify(data ?? {}));
    if (!navigator.onLine) return queueWrite("s", path, clean);
    const { error } = await sb.from("docs").upsert({ path, data: clean }, { onConflict: "path" });
    if (error) { const m = mapErr(error); if (isNet(m)) return queueWrite("s", path, clean); throw m; }
  }
  function listen(filter, refresh, onError) {
    let stopped = false, timer = null, poll = null;
    const run = () => { if (!stopped) refresh().catch((e) => onError && onError(e)); };
    if (filter.path) { if (!runners.has(filter.path)) runners.set(filter.path, new Set()); runners.get(filter.path).add(run); }
    run();
    const ch = sb.channel("l-" + rid(10)).on("postgres_changes",
      { event: "*", schema: "public", table: "docs", filter: filter.path ? `path=eq.${filter.path}` : `col=eq.${filter.col}` },
      () => { clearTimeout(timer); timer = setTimeout(run, 150); })
      .subscribe((st) => { if ((st === "CHANNEL_ERROR" || st === "TIMED_OUT") && !poll) poll = setInterval(run, 20000); });
    const wake = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", wake); addEventListener("online", run);
    return () => { stopped = true; if (filter.path && runners.get(filter.path)) runners.get(filter.path).delete(run); clearInterval(poll); clearTimeout(timer); document.removeEventListener("visibilitychange", wake); removeEventListener("online", run); sb.removeChannel(ch); };
  }
  function query(col, o = {}) {
    return {
      orderBy: (f, dir = "asc") => query(col, { ...o, order: [f, dir] }),
      limit: (n) => query(col, { ...o, limit: n }),
      where: (f, op, v) => query(col, { ...o, where: [...(o.where || []), [f, op, v]] }),
      doc: (id) => docRef(col + "/" + (id || rid())),
      add: async (data) => { const id = rid(); await putDoc(col + "/" + id, data); return docRef(col + "/" + id); },
      get: async () => snapOf(await fetchRows(col, o)),
      onSnapshot: (next, err) => listen({ col }, () => fetchRows(col, o).then((r) => next(snapOf(r))), err),
    };
  }
  function docRef(path) {
    const id = path.split("/").pop();
    const snap = (row) => ({ id, exists: !!row, data: () => (row ? row.data : undefined), ref: docRef(path) });
    return {
      id, path,
      get: async () => snap(await getRow(path)),
      set: (data) => putDoc(path, data),
      update: async (patch) => {
        const clean = JSON.parse(JSON.stringify(patch ?? {}));
        if (!navigator.onLine) return queueWrite("u", path, clean);
        const { error } = await sb.rpc("doc_update", { p_path: path, p_patch: clean });
        if (error) { const m = mapErr(error); if (isNet(m)) return queueWrite("u", path, clean); throw m; }
      },
      delete: async () => { const { error } = await sb.from("docs").delete().eq("path", path); if (error) throw mapErr(error); },
      onSnapshot: (next, err) => listen({ path }, () => getRow(path).then((r) => next(snap(r))), err),
      collection: (sub) => query(path + "/" + sub),
    };
  }
  const dbApi = { collection: (p) => query(p), doc: (p) => docRef(p) };

  /* ---------------- utilisateur ---------------- */
  const meta = () => (session && session.user && session.user.user_metadata) || {};
  const userApi = {
    id: async () => session.user.id,
    me: async () => ({ id: session.user.id, name: meta().full_name || meta().name || (session.user.email || "").split("@")[0] || "Utilisateur", avatarUrl: meta().avatar_url || meta().picture || "", email: session.user.email || "" }),
    isOwner: async () => member.level === "owner",
    canEdit: async () => member.level === "admin" || member.level === "owner",
    can: async (n) => (n === "data.write" ? true : null),
    profiles: async () => ({}),
  };

  /* ---------------- fichiers ---------------- */
  const publicUrl = (id) => sb.storage.from("assets").getPublicUrl(id).data.publicUrl;
  window.__blobURL = (id) => (sb ? publicUrl(id) : "");
  const assetsApi = {
    upload: async (blob, opts = {}) => {
      const type = opts.type || blob.type || "application/octet-stream";
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[type] || "bin";
      const path = `${session.user.id}/${Date.now().toString(36)}-${rid(6)}.${ext}`;
      const { error } = await sb.storage.from("assets").upload(path, blob, { contentType: type, upsert: false });
      if (error) throw { code: "upload_failed", message: error.message };
      return { id: path, url: publicUrl(path), sizeBytes: blob.size, contentType: type };
    },
    list: async () => ({ assets: [], usage: {} }),
    delete: async (id) => { await sb.storage.from("assets").remove([id]); },
  };

  /* ---------------- copies d'élèves (photos / PDF des devoirs et épreuves) ---------------- */
  window.__grade = async (body) => {
    const { data, error } = await sb.functions.invoke("grade", { body });
    if (error) {
      let msg = error.message || "erreur";
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) {}
      throw new Error(msg);
    }
    return data;
  };
  window.__copies = {
    upload: async (file) => {
      const type = file.type || "application/octet-stream";
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[type] || "jpg";
      const path = `${session.user.id}/${Date.now().toString(36)}-${rid(6)}.${ext}`;
      const { error } = await sb.storage.from("copies").upload(path, file, { contentType: type, upsert: false });
      if (error) throw { code: "upload_failed", message: error.message };
      return { p: path, n: String(file.name || "photo").slice(0, 60), t: type, s: file.size };
    },
    url: async (path) => {
      const { data, error } = await sb.storage.from("copies").createSignedUrl(path, 21600);
      if (error) throw error;
      return data.signedUrl;
    },
    blob: async (path) => {
      const { data, error } = await sb.storage.from("copies").download(path);
      if (error) throw error;
      return data;
    },
  };

  /* ---------------- téléchargements ---------------- */
  const downloadsApi = {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.csv$/i.test(filename) ? "text/csv;charset=utf-8" : /\.html?$/i.test(filename) ? "text/html;charset=utf-8" : "application/octet-stream" });
      const FS = plug("Filesystem"), SH = plug("Share");
      if (isNative() && FS && SH) {
        const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.readAsDataURL(blob); });
        const w = await FS.writeFile({ path: filename, data: b64, directory: "CACHE" });
        await SH.share({ title: filename, url: w.uri });
        return {};
      }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); return {};
    },
  };

  /* ---------------- présence (qui est en ligne) ---------------- */
  let roomCh = null, roomReady = false, pendingState = null; const peerFns = [];
  function roomApi() {
    if (!roomCh) {
      roomCh = sb.channel("room-main", { config: { presence: { key: session.user.id + "-" + rid(4) } } });
      roomCh.on("presence", { event: "sync" }, () => { const list = Object.values(roomCh.presenceState()).flat(); peerFns.forEach((f) => { try { f(list); } catch (e) {} }); });
      roomCh.subscribe((st) => { if (st === "SUBSCRIBED") { roomReady = true; if (pendingState) roomCh.track(pendingState); } });
    }
    return {
      presence: (state) => { pendingState = state; if (roomReady) roomCh.track(state); },
      onPeers: (fn) => { peerFns.push(fn); },
      emit: () => {}, on: () => {}, join: () => roomApi(), leave: () => {},
    };
  }

  /* ---------------- IA Nova (serveur « ai » → Gemini) ---------------- */
  const blobToB64 = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res({ mime: b.type || "image/jpeg", data: String(r.result).split(",")[1] }); r.readAsDataURL(b); });
  async function callAI(input, opts = {}, json = false) {
    if (opts.signal && opts.signal.aborted) throw { code: "cancelled", message: "Annulé" };
    const body = { input, json, modelTier: opts.modelTier || "default" };
    if (opts.images && opts.images.length) body.images = await Promise.all(opts.images.slice(0, 4).map(blobToB64));
    const { data: { session: s } } = await sb.auth.getSession();
    let res;
    try {
      res = await fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/ai", {
        method: "POST", signal: opts.signal,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (s ? s.access_token : ""), apikey: CFG.supabaseAnonKey },
        body: JSON.stringify(body),
      });
    } catch (e) { window.__lastAIErr = e && e.name === "AbortError" ? null : (navigator.onLine === false ? "Pas de connexion à Internet." : "Nova est injoignable. Professeure : dans Supabase, vérifie que la fonction « ai » est déployée et que « Verify JWT » est désactivé."); throw e && e.name === "AbortError" ? { code: "cancelled", message: "Annulé" } : { code: "upstream_error", message: navigator.onLine === false ? "Pas de connexion à Internet." : "Nova est injoignable : le serveur « ai » n'est pas encore prêt (professeure : voir le guide, étape Nova)." }; }
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) { window.__lastAIErr = (out.error && out.error.message) || (res.status === 404 ? "Le serveur de Nova (fonction « ai ») est introuvable dans Supabase." : res.status === 401 ? "Nova refuse la connexion : dans Supabase, désactive « Verify JWT » pour la fonction « ai »." : "Nova a rencontré une erreur (" + res.status + ")."); } else window.__lastAIErr = null;
    if (!res.ok || out.error) throw { code: (out.error && out.error.code) || "upstream_error", message: (out.error && out.error.message) || "Erreur " + res.status };
    if (opts.onText) { try { opts.onText({ text: out.text, delta: out.text }); } catch (e) {} }
    return { text: out.text, truncated: !!out.truncated, modelTierApplied: body.modelTier };
  }
  function parseJSON(t) {
    const s = String(t || "").trim(); const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    const src = fence ? fence[1] : s; const i = src.search(/[\[{]/);
    return JSON.parse(i >= 0 ? src.slice(i) : src);
  }
  const sampleApi = (input, opts) => callAI(input, opts, false);
  sampleApi.json = async (input, opts) => { const r = await callAI(input, opts, true); try { return parseJSON(r.text); } catch (e) { throw { code: "invalid_json", message: "Réponse illisible", text: r.text }; } };
  sampleApi.limits = async () => ({ images: { maxCount: 4 }, inputBytes: 4000000 });

  /* ---------------- le pont attendu par l'application ---------------- */
  window.claude = {
    use: async (name) => {
      await ready;
      switch (name) {
        case "db": return dbApi;
        case "user": return userApi;
        case "assets": return member.level === "admin" || member.level === "owner" ? assetsApi : null;
        case "downloads": return downloadsApi;
        case "room": return roomApi();
        case "sample": return CFG.aiEnabled === false ? null : sampleApi;
        default: return null;
      }
    },
  };
  if (!isNative() && CFG.apkUrl) window.__appDownload = { apk: CFG.apkUrl, canInstall: false };
  let deferredPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; if (window.__appDownload) { window.__appDownload.canInstall = true; try { window.render && window.render(); } catch (err) {} } });
  window.__pwaInstall = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; if (window.__appDownload) window.__appDownload.canInstall = false; };
  window.__appLogout = async () => { try { await sb.auth.signOut(); } catch (e) {} location.reload(); };

  /* ---------------- écran de connexion ---------------- */
  const CSS = `#authGate{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;overflow:auto;background:radial-gradient(120% 80% at 50% -10%,#1A2150 0%,#0E1120 45%,#090B16 100%);color:#F1F3FB;font-family:Manrope,"Segoe UI",system-ui,sans-serif}
#authGate .box{width:min(420px,100%);display:grid;gap:16px;padding:28px 24px;border-radius:26px;background:rgba(23,27,46,.9);border:1px solid #2A3050;box-shadow:0 30px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(201,211,255,.1)}
#authGate .logo{width:62px;height:62px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(120deg,#4A5FD0,#93ABFF);font:italic 1.7rem "Instrument Serif",Georgia,serif;color:#fff;box-shadow:0 10px 30px rgba(74,95,208,.45)}
#authGate h1{font:400 2rem "Instrument Serif",Georgia,serif;margin:0}#authGate p{margin:0;color:#C4CAE4;line-height:1.5}
#authGate button,#authGate input{font:inherit;width:100%;border-radius:14px;padding:12px 14px}
#authGate input{background:#171B2E;border:1px solid #3B4366;color:#F1F3FB}#authGate input:focus{outline:none;border-color:#93ABFF;box-shadow:0 0 0 4px rgba(147,171,255,.15)}
#authGate label{display:grid;gap:6px;font-weight:700;font-size:.9rem}
#authGate .g{display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f1f1f;border:0;font-weight:700;cursor:pointer}
#authGate .p{background:linear-gradient(135deg,#DCE3FF,#AFC0FF);color:#0E1120;border:0;font-weight:800;cursor:pointer}
#authGate .l{background:none;border:0;color:#93ABFF;font-weight:700;cursor:pointer;padding:4px;width:auto}
#authGate .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:14px;background:#1D2238}
#authGate .tabs button{border:0;background:none;color:#C4CAE4;font-weight:700;cursor:pointer;padding:9px 6px;white-space:nowrap;font-size:.92rem}#authGate .tabs button[aria-pressed=true]{background:linear-gradient(135deg,#3A4CB4,#5D72DE);color:#fff}
#authGate .or{display:flex;align-items:center;gap:10px;color:#8D94B5;font-size:.85rem}#authGate .or::before,#authGate .or::after{content:"";flex:1;height:1px;background:#2A3050}
#authGate .msg{padding:10px 12px;border-radius:12px;font-size:.92rem}#authGate .msg.err{background:#3E1E27;color:#FFB3BF}#authGate .msg.ok{background:#163327;color:#8BE8BC}
#authGate form{display:grid;gap:12px}
#authGate .dl{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:14px;border:1px dashed #3B4366;color:#8BE8BC;font-weight:700;text-decoration:none}#authGate .dl:hover{border-color:#8BE8BC}
#authGate .pw{position:relative;display:block}#authGate .pw input{padding-right:52px}
#authGate .pw .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:42px;height:42px;padding:0;display:grid;place-items:center;border:0;border-radius:12px;background:transparent;color:#AFC0FF;cursor:pointer}
#authGate .pw .eye.on{color:#fff;background:#2A3260}#authGate button:disabled{opacity:.5}`;
  let gate = null, mode = "in", note = null;
  const G = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  function drawGate() {
    if (!gate) { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); gate = document.createElement("div"); gate.id = "authGate"; document.body.appendChild(gate); }
    const sp = document.getElementById("splash"); if (sp) sp.style.display = "none";
    const reset = mode === "newpass";
    gate.innerHTML = `<div class="box" role="dialog" aria-labelledby="agT"><div class="logo">En</div><div><h1 id="agT">Ma Classe d'Anglais</h1><p>${reset ? "Choisis ton nouveau mot de passe." : "Connecte-toi pour retrouver ta classe, tes leçons et ta progression."}</p></div>
    ${note ? `<div class="msg ${note.ok ? "ok" : "err"}">${esc(note.t)}</div>` : ""}
    ${reset ? `<form data-f="newpass"><label>Nouveau mot de passe<span class="pw"><input id="agP" type="password" minlength="6" required autocomplete="new-password"><button type="button" class="eye" data-x="eye" aria-label="Afficher le mot de passe" title="Afficher le mot de passe"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label><button class="p" type="submit">Enregistrer</button></form>` : `
    ${CFG.googleEnabled === false ? "" : `<button class="g" data-x="google">${G}Continuer avec Google</button><div class="or">ou avec ton e-mail</div>`}
    <div class="tabs"><button data-x="in" aria-pressed="${mode === "in"}">Se connecter</button><button data-x="up" aria-pressed="${mode === "up"}">Créer un compte</button></div>
    <form data-f="${mode}">${mode === "up" ? `<label>Prénom et nom<input id="agN" required maxlength="60" autocomplete="name" placeholder="Ex. Ama Kossi"></label>` : ""}
    <label>E-mail<input id="agE" type="email" required autocomplete="email" placeholder="ton.email@gmail.com"></label>
    <label>Mot de passe<span class="pw"><input id="agP" type="password" required minlength="6" autocomplete="${mode === "up" ? "new-password" : "current-password"}" placeholder="6 caractères minimum"><button type="button" class="eye" data-x="eye" aria-label="Afficher le mot de passe" title="Afficher le mot de passe"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>
    <button class="p" type="submit">${mode === "up" ? "Créer mon compte" : "Se connecter"}</button></form>
    ${mode === "in" ? `<button class="l" data-x="forgot">Mot de passe oublié ?</button>` : ""}`}
    ${!isNative() && CFG.apkUrl ? `<a class="dl" href="${esc(CFG.apkUrl)}" rel="noopener"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Télécharger l'application Android</a>` : ""}</div>`;
  }
  function showGate() { drawGate(); }
  function hideGate() { if (gate) { gate.remove(); gate = null; } const sp = document.getElementById("splash"); if (sp) sp.style.display = ""; }
  const say = (t, ok) => { note = { t, ok }; drawGate(); };
  const frErr = (m) => /Invalid login/i.test(m) ? "E-mail ou mot de passe incorrect." : /already registered|already exists/i.test(m) ? "Un compte existe déjà avec cet e-mail : connecte-toi." : /Email not confirmed/i.test(m) ? "Confirme d'abord ton e-mail grâce au lien reçu." : /Password should/i.test(m) ? "Le mot de passe doit contenir au moins 6 caractères." : /rate limit/i.test(m) ? "Trop d'essais. Attends quelques minutes." : m;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest("#authGate [data-x]"); if (!b) return; e.preventDefault();
    const x = b.dataset.x;
    if (x === "eye") { const inp = b.parentNode.querySelector("input"); const show = inp.type === "password"; inp.type = show ? "text" : "password"; b.classList.toggle("on", show); b.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe"); inp.focus(); return; }
    if (x === "in" || x === "up") { mode = x; note = null; drawGate(); return; }
    if (x === "google") {
      const native = isNative(), redirectTo = native ? CFG.nativeRedirect : location.origin + location.pathname;
      const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: native } });
      if (error) return say(frErr(error.message));
      if (native && data && data.url && plug("Browser")) plug("Browser").open({ url: data.url });
      return;
    }
    if (x === "forgot") {
      const email = (document.getElementById("agE") || {}).value || "";
      if (!email) return say("Écris d'abord ton e-mail, puis touche « Mot de passe oublié ».");
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: isNative() ? CFG.nativeRedirect : location.origin + location.pathname });
      return error ? say(frErr(error.message)) : say("Un lien pour changer ton mot de passe vient d'être envoyé à " + email + ".", true);
    }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest && e.target.closest("#authGate form"); if (!f) return; e.preventDefault(); e.stopImmediatePropagation();
    const v = (id) => ((document.getElementById(id) || {}).value || "").trim();
    const btn = f.querySelector("button"); if (btn) btn.disabled = true;
    try {
      if (f.dataset.f === "in") { const { error } = await sb.auth.signInWithPassword({ email: v("agE"), password: v("agP") }); if (error) say(frErr(error.message)); }
      else if (f.dataset.f === "up") {
        const { data, error } = await sb.auth.signUp({ email: v("agE"), password: v("agP"), options: { data: { full_name: v("agN") }, emailRedirectTo: isNative() ? CFG.nativeRedirect : location.origin + location.pathname } });
        if (error) say(frErr(error.message)); else if (!data.session) { mode = "in"; say("Compte créé ! Ouvre l'e-mail de confirmation, puis connecte-toi.", true); }
      } else if (f.dataset.f === "newpass") { const { error } = await sb.auth.updateUser({ password: v("agP") }); if (error) say(frErr(error.message)); else { mode = "in"; note = null; hideGate(); location.reload(); } }
    } finally { if (btn) btn.disabled = false; }
  }, true);

  /* ---------------- contenu de départ (première connexion de la prof principale) ---------------- */
  async function offerStarterContent() {
    if (member.level !== "owner") return;
    const { count } = await sb.from("docs").select("path", { count: "exact", head: true }).eq("col", "lessons");
    if (count) return;
    let content; try { content = await (await fetch("content.json", { cache: "no-store" })).json(); } catch (e) { return; }
    const total = Object.values(content).reduce((n, c) => n + Object.keys(c).length, 0);
    const box = document.createElement("div"); box.id = "authGate";
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    box.innerHTML = `<div class="box"><div class="logo">En</div><h1>Bienvenue !</h1><p>Votre base est vide. Installer le contenu de départ : ${Object.keys(content.lessons || {}).length} leçons du programme togolais, ${Object.keys(content.quizzes || {}).length} quiz, ${Object.keys(content.decks || {}).length} listes de vocabulaire et ${Object.keys(content.epreuves || {}).length} épreuves avec corrigés ?</p><div class="msg ok" id="agProg" hidden></div><button class="p" id="agGo">Installer le contenu (${total} éléments)</button><button class="l" id="agSkip">Plus tard</button></div>`;
    document.body.appendChild(box);
    await new Promise((done) => {
      box.querySelector("#agSkip").onclick = () => { box.remove(); done(); };
      box.querySelector("#agGo").onclick = async () => {
        const go = box.querySelector("#agGo"), pr = box.querySelector("#agProg"); go.disabled = true; pr.hidden = false;
        const rows = []; const now = Date.now(); let k = 0;
        for (const [col, docs] of Object.entries(content)) for (const [id, data] of Object.entries(docs)) rows.push({ path: col + "/" + id, data: { ...data, createdAt: data.createdAt || now - (k++) * 1000 } });
        for (let i = 0; i < rows.length; i += 50) {
          const { error } = await sb.from("docs").upsert(rows.slice(i, i + 50), { onConflict: "path" });
          if (error) { pr.className = "msg err"; pr.textContent = "Erreur : " + error.message; go.disabled = false; return; }
          pr.textContent = `Installation… ${Math.min(i + 50, rows.length)} / ${rows.length}`;
        }
        pr.textContent = "Contenu installé !"; setTimeout(() => { box.remove(); done(); }, 700);
      };
    });
  }

  /* ---------------- démarrage ---------------- */
  async function loadMember() {
    const { data } = await sb.from("members").select("level,email").eq("uid", session.user.id).maybeSingle();
    member = data || { level: "interact" };
  }
  let started = false;
  function brandAI() { const el = document.getElementById("aiSub"); if (el) el.textContent = "Assistant IA propulsé par Gemini"; }
  async function afterLogin() {
    if (started) return; started = true;
    hideGate(); brandAI(); await loadMember(); await offerStarterContent().catch(() => {}); resolveReady();
  }
  async function boot() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || /VOTRE/.test(CFG.supabaseUrl)) {
      const sp = document.getElementById("splash"); if (sp) sp.style.display = "none";
      document.body.insertAdjacentHTML("beforeend", `<div style="position:fixed;inset:0;z-index:300;display:grid;place-items:center;background:radial-gradient(120% 80% at 50% -10%,#1A2150 0%,#0E1120 45%,#090B16 100%);color:#F1F3FB;font-family:Manrope,system-ui,sans-serif;padding:20px"><div style="max-width:440px;display:grid;gap:14px;padding:28px 24px;border-radius:26px;background:rgba(23,27,46,.9);border:1px solid #2A3050"><div style="width:62px;height:62px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(120deg,#4A5FD0,#93ABFF);font:italic 1.7rem Georgia,serif">En</div><h2 style="margin:0;font:400 1.9rem Georgia,serif">Ma Classe d'Anglais</h2><p style="margin:0;color:#C4CAE4;line-height:1.55">L'application est installée, il reste à la relier à sa base de données. Professeure : suivez les étapes 1 à 6 du guide (projet Supabase, puis variables <b>SUPABASE_URL</b> et <b>SUPABASE_ANON_KEY</b> sur GitHub).</p><p style="margin:0;color:#8D94B5;font-size:.9rem">Élèves : revenez un peu plus tard, votre classe ouvre bientôt.</p></div></div>`);
      return;
    }
    if (!window.supabase) { try { await loadScript(CFG.supabaseJs || "vendor/supabase.js"); } catch (e) { await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"); } }
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" } });
    const App = plug("App");
    if (isNative() && App) App.addListener("appUrlOpen", async ({ url }) => {
      if (!CFG.nativeRedirect || !url.startsWith(CFG.nativeRedirect)) return;
      const u = new URL(url), code = u.searchParams.get("code");
      if (code) { const { error } = await sb.auth.exchangeCodeForSession(code); if (error) say(frErr(error.message)); }
      try { plug("Browser") && plug("Browser").close(); } catch (e) {}
    });
    sb.auth.onAuthStateChange((ev, s) => {
      session = s;
      if (ev === "PASSWORD_RECOVERY") { mode = "newpass"; note = null; showGate(); return; }
      if (s && mode !== "newpass") afterLogin();
    });
    const { data } = await sb.auth.getSession(); session = data.session;
    if (session) afterLogin(); else showGate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

/* =====================================================================
   Voix native Android : micro (reconnaissance vocale) + lecture à haute voix
   À coller tout à la fin de www/claude-shim.js
   ===================================================================== */
(function () {
  "use strict";
  var cap = window.Capacitor;
  if (!(cap && cap.isNativePlatform && cap.isNativePlatform())) return; // navigateur : rien à changer
  var P = cap.Plugins || {};

  // 1) MICRO : dans l'APK, le WebView expose une fausse "webkitSpeechRecognition" qui répond
  //    toujours "bloqué". On la masque pour que l'application utilise le plugin natif.
  if (P.SpeechRecognition) {
    try { window.SpeechRecognition = undefined; } catch (e) {}
    try { window.webkitSpeechRecognition = undefined; } catch (e) {}
  }

  // 2) VOIX : on branche speechSynthesis sur le moteur de synthèse vocale d'Android.
  var TTS = P.TextToSpeech;
  if (!TTS) return;

  var queue = Promise.resolve();
  var token = 0;
  var pending = [];
  var timer = null;

  function Utter(text) {
    this.text = text; this.lang = "en-US"; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null;
  }
  var synth = window.speechSynthesis || {};
  synth.getVoices = function () { return []; };
  synth.addEventListener = function () {};
  synth.removeEventListener = function () {};

  // L'application découpe le texte en petites phrases. On les regroupe en UN SEUL appel
  // pour éviter une pause (démarrage du moteur) entre chaque phrase.
  synth.speak = function (u) {
    pending.push(u);
    if (timer) return;
    var my = token;
    timer = setTimeout(function () {
      var batch = pending; pending = []; timer = null;
      var text = batch.map(function (x) { return String(x.text || ""); }).join(" ").trim();
      if (!text) return;
      var first = batch[0];
      queue = queue.then(function () {
        if (my !== token) return;
        return TTS.speak({
          text: text,
          lang: first.lang || "en-US",
          rate: first.rate || 1.0,
          pitch: first.pitch || 1.0,
          volume: 1.0,
          category: "playback"
        }).catch(function (e) { console.warn("TTS :", e); });
      });
    }, 0);
  };
  synth.cancel = function () {
    token++; pending = [];
    if (timer) { clearTimeout(timer); timer = null; }
    try { TTS.stop(); } catch (e) {}
  };
  synth.pause = function () {};
  synth.resume = function () {};
  try { window.speechSynthesis = synth; } catch (e) {
    try { Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); } catch (e2) {}
  }
  window.SpeechSynthesisUtterance = Utter;
})();
