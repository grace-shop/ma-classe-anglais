/* =====================================================================
   English Classes — adaptateur « application autonome »
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
    if (e && (e.code === "42501" || /row-level security|permission denied/i.test(m))) return { code: "invalid_argument", message: "Access denied" };
    if (e && e.code === "23514") return { code: "quota_exceeded", message: m };
    return { code: "unavailable", message: m || "Network error" };
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
        if (err) console.warn("write dropped", it.path, err.message);
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
    const build = () => {
      let q = sb.from("docs").select("path,id,data").eq("col", col);
      for (const [f, op, v] of o.where || []) {
        const c = "data->>" + f, s = String(v);
        if (op === "==" || op === "eq") q = q.eq(c, s); else if (op === "!=" || op === "ne") q = q.neq(c, s);
        else if (op === ">" || op === "gt") q = q.gt(c, s); else if (op === ">=" || op === "gte") q = q.gte(c, s);
        else if (op === "<" || op === "lt") q = q.lt(c, s); else if (op === "<=" || op === "lte") q = q.lte(c, s);
      }
      return o.order ? q.order("data->" + o.order[0], { ascending: o.order[1] !== "desc", nullsFirst: false }).order("path") : q.order("path");
    };
    // sans limite demandée : on lit par paquets de 1000 (plus de plafond à 1000 élèves)
    const PAGE = 1000, want = o.limit ? Math.min(o.limit, 50000) : 50000;
    const all = async () => {
      let rows = [];
      for (let from = 0; from < want; from += PAGE) {
        const to = Math.min(from + PAGE, want) - 1;
        const { data, error } = await build().range(from, to);
        if (error) return { data: null, error };
        rows = rows.concat(data || []);
        if (!data || data.length < to - from + 1) break;
      }
      return { data: rows, error: null };
    };
    const ck = "r:" + uidKey() + ":" + col + "|" + JSON.stringify(o);
    const cached0 = await idb.get(ck);
    const { data, error } = await (cached0 ? Promise.race([all(), new Promise((r) => setTimeout(() => r({ data: cached0, error: null, stale: true }), 6000))]) : all());
    if (error) { const m = mapErr(error); if (m.code === "unavailable") { const c = await idb.get(ck); if (c) return c; } throw m; }
    idb.set(ck, data || []); return data || [];
  }
  async function getRow(path) {
    const ck = "d:" + uidKey() + ":" + path;
    const cached0 = await idb.get(ck);
    const q0 = sb.from("docs").select("path,id,data").eq("path", path).maybeSingle();
    const { data, error } = await (cached0 !== undefined ? Promise.race([q0, new Promise((r) => setTimeout(() => r({ data: cached0, error: null }), 6000))]) : q0);
    if (error) { const m = mapErr(error); if (m.code === "unavailable") { const c = await idb.get(ck); if (c !== undefined) return withQueued(path, c); } throw m; }
    idb.set(ck, data || null); return withQueued(path, data);
  }
  async function putDoc(path, data) {
    const clean = JSON.parse(JSON.stringify(data ?? {}));
    if (!navigator.onLine) return queueWrite("s", path, clean);
    const { error } = await sb.from("docs").upsert({ path, data: clean }, { onConflict: "path" });
    if (error) { const m = mapErr(error); if (isNet(m)) return queueWrite("s", path, clean); throw m; }
  }
  function listen(filter, refresh, onError, live) {
    let stopped = false, timer = null, poll = null, pending = [];
    const run = () => { if (!stopped) refresh().catch((e) => onError && onError(e)); };
    if (filter.path) { if (!runners.has(filter.path)) runners.set(filter.path, new Set()); runners.get(filter.path).add(run); }
    run();
    // Grandes classes : pour une collection simple, on applique seulement le document qui a changé
    // (au lieu de tout retélécharger à chaque mouvement d'un élève), regroupé toutes les 0,4 s.
    const flush = () => { const ev = pending; pending = []; if (stopped) return; if (!live || ev.some((p) => !p || !live.apply(p))) run(); else live.emit(); };
    const ch = sb.channel("l-" + rid(10)).on("postgres_changes",
      { event: "*", schema: "public", table: "docs", filter: filter.path ? `path=eq.${filter.path}` : `col=eq.${filter.col}` },
      (payload) => { pending.push(payload); clearTimeout(timer); timer = setTimeout(flush, live ? 400 : 150); })
      .subscribe((st) => { if ((st === "CHANNEL_ERROR" || st === "TIMED_OUT") && !poll) poll = setInterval(run, 20000); });
    const wake = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", wake); addEventListener("online", run);
    return () => { stopped = true; if (filter.path && runners.get(filter.path)) runners.get(filter.path).delete(run); clearInterval(poll); clearTimeout(timer); document.removeEventListener("visibilitychange", wake); removeEventListener("online", run); sb.removeChannel(ch); };
  }
  // liste vivante pour une collection sans filtre ni limite
  function liveList(col, next) {
    let rows = null;
    return {
      set: (r) => { rows = r.slice(); next(snapOf(rows)); },
      apply: (p) => {
        if (!rows) return false;
        const t = p.eventType, n = p.new || {}, o = p.old || {};
        if (t === "DELETE") { const path = o.path; if (!path) return false; rows = rows.filter((r) => r.path !== path); return true; }
        if (!n.path || n.data === undefined || n.col !== col) return false;          // contenu incomplet : on relit tout
        const row = { path: n.path, id: n.id || n.path.split("/").pop(), data: n.data };
        const i = rows.findIndex((r) => r.path === row.path);
        if (i >= 0) rows[i] = row; else { rows.push(row); rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)); }
        return true;
      },
      emit: () => { if (rows) { idb.set("r:" + uidKey() + ":" + col + "|{}", rows); next(snapOf(rows.slice())); } },
    };
  }
  function query(col, o = {}) {
    return {
      orderBy: (f, dir = "asc") => query(col, { ...o, order: [f, dir] }),
      limit: (n) => query(col, { ...o, limit: n }),
      where: (f, op, v) => query(col, { ...o, where: [...(o.where || []), [f, op, v]] }),
      doc: (id) => docRef(col + "/" + (id || rid())),
      add: async (data) => { const id = rid(); await putDoc(col + "/" + id, data); return docRef(col + "/" + id); },
      get: async () => snapOf(await fetchRows(col, o)),
      onSnapshot: (next, err) => {
        const simple = !o.where && !o.order && !o.limit, L = simple ? liveList(col, next) : null;
        return listen({ col }, () => fetchRows(col, o).then((r) => (L ? L.set(r) : next(snapOf(r)))), err, L);
      },
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
    me: async () => ({ id: session.user.id, name: meta().full_name || meta().name || (session.user.email || "").split("@")[0] || "User", avatarUrl: meta().avatar_url || meta().picture || "", email: window.__isTelEmail(session.user.email) ? window.__telOf(session.user.email) : (session.user.email || "") }),
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
  window.__peer = {
    dir: async () => { const { data, error } = await sb.rpc("peer_directory"); if (error) throw new Error(mapErr(error).message); return data || []; },
    send: async (to, body, att, meta) => { const args = { p_to: to, p_body: body || "" }; if (att || meta) args.p_att = att || null; if (meta) args.p_meta = meta; const { data, error } = await sb.rpc("send_peer_message", args); if (error) throw new Error(/function .*send_peer_message|p_att|schema cache/i.test(error.message || "") ? "The teacher must first run the file supabase/messagerie.sql in Supabase." : (error.message || "Could not send")); return data; },
    read: async (from) => { const { error } = await sb.rpc("mark_peer_read", { p_from: from }); if (error) throw new Error(error.message); },
    inbox: async () => { const { data, error } = await sb.from("peer_messages").select("*").order("created_at", { ascending: false }).limit(400); if (error) throw new Error(mapErr(error).message); return data || []; },
    all: async () => { const { data, error } = await sb.from("peer_messages").select("*").order("created_at", { ascending: false }).limit(300); if (error) throw new Error(mapErr(error).message); return data || []; },
    del: async (id) => { const { error } = await sb.rpc("delete_peer_message", { p_id: id }); if (error) throw new Error(/delete_peer_message|schema cache/i.test(error.message || "") ? "The teacher must first run the new file supabase/messagerie.sql in Supabase." : (error.message || "Could not delete")); },
    react: async (id, e) => { const { error } = await sb.rpc("react_peer_message", { p_id: id, p_e: e || "" }); if (error) throw new Error(/react_peer_message|schema cache/i.test(error.message || "") ? "The teacher must first run the new file supabase/messagerie.sql in Supabase." : (error.message || "Could not react")); },
    openOnce: async (id) => { const { data, error } = await sb.rpc("open_peer_once", { p_id: id }); if (error) throw new Error(error.message || "Could not open"); return data || null; },
    archive: async () => { const { data, error } = await sb.from("peer_archive").select("*").order("created_at", { ascending: false }).limit(300); if (error) return []; return data || []; },
    listenUpd: (fn) => {
      try {
        const ch = sb.channel("peeru-" + rid(8)).on("postgres_changes", { event: "UPDATE", schema: "public", table: "peer_messages" }, (p) => { try { fn(p.new); } catch (e) {} }).subscribe();
        return () => { try { sb.removeChannel(ch); } catch (e) {} };
      } catch (e) { return () => {}; }
    },
    hide: async (id, on) => { const { error } = await sb.from("peer_messages").update({ hidden: !!on }).eq("id", id); if (error) throw new Error(mapErr(error).message); },
    listen: (fn) => {
      try {
        const ch = sb.channel("peer-" + rid(8)).on("postgres_changes", { event: "INSERT", schema: "public", table: "peer_messages" }, (p) => { try { fn(p.new); } catch (e) {} }).subscribe();
        return () => { try { sb.removeChannel(ch); } catch (e) {} };
      } catch (e) { return () => {}; }
    },
  };
  /* ---------------- Community : publications et stories (tables posts, stories… voir supabase/communaute.sql) ---------------- */
  const feedErr = (error, def) => new Error(/create_post|create_story|toggle_like|add_comment|feed_ok|relation .*(posts|stories)|schema cache/i.test((error && error.message) || "") ? "The teacher must first run the file supabase/communaute.sql in Supabase." : ((error && error.message) || def));
  window.__feed = {
    posts: async (before) => { let q = sb.from("posts").select("*").order("created_at", { ascending: false }).limit(30); if (before) q = q.lt("created_at", before); const { data, error } = await q; if (error) throw feedErr(error, "Cannot load posts"); return data || []; },
    likes: async (ids) => { if (!ids.length) return []; const { data, error } = await sb.from("post_likes").select("*").in("post_id", ids); if (error) return []; return data || []; },
    comments: async (ids) => { if (!ids.length) return []; const { data, error } = await sb.from("post_comments").select("*").in("post_id", ids).order("created_at", { ascending: true }).limit(1000); if (error) return []; return data || []; },
    create: async (body, media) => { const { data, error } = await sb.rpc("create_post", { p_body: body || "", p_media: media && media.length ? media : null }); if (error) throw feedErr(error, "Could not publish"); return data; },
    del: async (id) => { const { error } = await sb.rpc("delete_post", { p_id: id }); if (error) throw feedErr(error, "Could not delete"); },
    like: async (id, e) => { const { data, error } = await sb.rpc("toggle_like", { p_post: id, p_e: e || "❤️" }); if (error) throw feedErr(error, "Could not like"); return data; },
    comment: async (id, body) => { const { data, error } = await sb.rpc("add_comment", { p_post: id, p_body: body }); if (error) throw feedErr(error, "Could not comment"); return data; },
    delComment: async (id) => { const { error } = await sb.rpc("delete_comment", { p_id: id }); if (error) throw feedErr(error, "Could not delete"); },
    stories: async () => { const { data, error } = await sb.from("stories").select("*").order("created_at", { ascending: true }).limit(500); if (error) throw feedErr(error, "Cannot load stories"); return data || []; },
    storyViews: async () => { const { data, error } = await sb.from("story_views").select("*").limit(3000); if (error) return []; return data || []; },
    story: async (media, body, bg) => { const { data, error } = await sb.rpc("create_story", { p_media: media || null, p_body: body || "", p_bg: bg || "" }); if (error) throw feedErr(error, "Could not publish the story"); return data; },
    viewStory: async (id) => { await sb.rpc("view_story", { p_id: id }); },
    delStory: async (id) => { const { error } = await sb.rpc("delete_story", { p_id: id }); if (error) throw feedErr(error, "Could not delete"); },
  };
  /* ---------------- pièces jointes des messageries (vocaux, photos, fichiers) : dossier privé « chat » ---------------- */
  const CHATURL = {};
  window.__chatFiles = {
    upload: async (blob, name) => {
      const type = String(blob.type || "application/octet-stream").split(";")[0];
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf", "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/aac": "aac", "video/mp4": "mp4", "text/plain": "txt",
        "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx", "application/vnd.ms-powerpoint": "ppt", "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx" })[type] || (String(name || "").split(".").pop() || "bin").slice(0, 5);
      const path = `${session.user.id}/${Date.now().toString(36)}-${rid(8)}.${ext}`;
      const { error } = await sb.storage.from("chat").upload(path, blob, { contentType: type, upsert: false });
      if (error) throw { code: "upload_failed", message: /bucket not found/i.test(error.message || "") ? "The teacher must first run the file supabase/messagerie.sql in Supabase." : /mime|type/i.test(error.message || "") ? "This type of file is not allowed." : /size|large/i.test(error.message || "") ? "File too big (10 MB maximum)." : error.message };
      return { p: path, t: type, n: String(name || "file").slice(0, 80), s: blob.size };
    },
    url: async (path) => {
      const c = CHATURL[path]; if (c && c.until > Date.now()) return c.url;
      const { data, error } = await sb.storage.from("chat").createSignedUrl(path, 21600);
      if (error) throw error;
      CHATURL[path] = { url: data.signedUrl, until: Date.now() + 5 * 3600e3 }; return data.signedUrl;
    },
  };
  window.__avatarUpload = async (blob) => {
    const path = `${session.user.id}/photo-${Date.now().toString(36)}.jpg`;
    const { error } = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error(/bucket not found/i.test(error.message || "") ? "The teacher must first run the file supabase/messagerie.sql in Supabase." : /row-level security/i.test(error.message || "") ? "Sending refused: the teacher must first approve your registration." : "Could not send the photo: " + error.message);
    return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };
  window.__resetPwd = async (uid) => {
    const { data: { session: s } } = await sb.auth.getSession();
    const res = await fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/ai", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (s ? s.access_token : ""), apikey: CFG.supabaseAnonKey }, body: JSON.stringify({ action: "reset_password", uid }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.password) throw new Error((out.error && out.error.message) || (res.status === 404 ? "First update the “ai” function in Supabase (new code on GitHub)." : "Password reset is not possible right now."));
    return out.password;
  };
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
    if (opts.signal && opts.signal.aborted) throw { code: "cancelled", message: "Cancelled" };
    const body = { input, json, modelTier: opts.modelTier || "default" };
    if (opts.images && opts.images.length) body.images = await Promise.all(opts.images.slice(0, 4).map(blobToB64));
    const { data: { session: s } } = await sb.auth.getSession();
    let res;
    const tctl = new AbortController(); let timedOut = false;
    const tmr = setTimeout(() => { timedOut = true; tctl.abort(); }, 60000);
    if (opts.signal) opts.signal.addEventListener("abort", () => tctl.abort(), { once: true });
    try {
      res = await fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/ai", {
        method: "POST", signal: tctl.signal,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (s ? s.access_token : ""), apikey: CFG.supabaseAnonKey },
        body: JSON.stringify(body),
      });
    } catch (e) { clearTimeout(tmr); if (timedOut) { window.__lastAIErr = "Nova is taking too long to answer. Check your connection and try again."; throw { code: "upstream_error", message: window.__lastAIErr }; } window.__lastAIErr = e && e.name === "AbortError" ? null : (navigator.onLine === false ? "No Internet connection." : "Nova cannot be reached. Teacher: in Supabase, check that the “ai” function is deployed and that “Verify JWT” is turned off."); throw e && e.name === "AbortError" ? { code: "cancelled", message: "Cancelled" } : { code: "upstream_error", message: navigator.onLine === false ? "No Internet connection." : "Nova cannot be reached: the “ai” server is not ready yet (teacher: see the guide, Nova step)." }; }
    const out = await res.json().catch(() => ({})); clearTimeout(tmr);
    if (!res.ok || out.error) { window.__lastAIErr = (out.error && out.error.message) || (res.status === 404 ? "The Nova server (“ai” function) was not found in Supabase." : res.status === 401 ? "Nova refused the connection: in Supabase, turn off “Verify JWT” for the “ai” function." : "Nova had an error (" + res.status + ")."); } else window.__lastAIErr = null;
    if (!res.ok || out.error) throw { code: (out.error && out.error.code) || "upstream_error", message: (out.error && out.error.message) || "Error " + res.status };
    if (opts.onText) { try { opts.onText({ text: out.text, delta: out.text }); } catch (e) {} }
    return { text: out.text, truncated: !!out.truncated, modelTierApplied: body.modelTier };
  }
  function parseJSON(t) {
    const s = String(t || "").trim(); const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    const src = fence ? fence[1] : s; const i = src.search(/[\[{]/);
    return JSON.parse(i >= 0 ? src.slice(i) : src);
  }
  const sampleApi = (input, opts) => callAI(input, opts, false);
  sampleApi.json = async (input, opts) => { const r = await callAI(input, opts, true); try { return parseJSON(r.text); } catch (e) { throw { code: "invalid_json", message: "Unreadable answer", text: r.text }; } };
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
  const IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const STANDALONE = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  window.__isIOS = IOS; window.__standaloneApp = STANDALONE;
  if (!isNative() && !STANDALONE && CFG.apkUrl) window.__appDownload = { apk: CFG.apkUrl, canInstall: false, ios: IOS };
  /* ---------------- mises à jour : l'application propose elle-même la nouvelle version ---------------- */
  const UPD = { shown: false };
  const updBox = (title, text, btnLabel, onGo, later = true) => {
    if (document.getElementById("updBox")) return;
    const d = document.createElement("div"); d.id = "updBox";
    d.style.cssText = "position:fixed;inset:0;z-index:9600;background:rgba(5,7,20,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Manrope,system-ui,sans-serif";
    d.innerHTML = `<div style="width:min(420px,100%);background:#141831;color:#F1F3FB;border:1px solid #2E3560;border-radius:24px;padding:24px 20px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:grid;gap:14px;text-align:center;justify-items:center">
      <img src="icons/icon-192.png" alt="" style="width:72px;height:72px;border-radius:20px;box-shadow:0 12px 30px rgba(70,80,220,.5)">
      <b style="font-size:1.2rem">${title}</b><div id="updTxt" style="color:#C4CAE4;line-height:1.5;font-size:.95rem">${text}</div>
      <div id="updBar" style="display:none;width:100%;height:8px;border-radius:99px;background:#2A3050;overflow:hidden"><i style="display:block;height:100%;width:0;background:linear-gradient(90deg,#8EA0FF,#6FE3F0);transition:width .2s"></i></div>
      <button id="updGo" style="width:100%;font:inherit;font-weight:800;border:0;border-radius:14px;padding:14px;background:linear-gradient(135deg,#8EA0FF,#B49BFF 55%,#6FE3F0);color:#06091c;cursor:pointer">${btnLabel}</button>
      ${later ? `<button id="updLater" style="font:inherit;font-weight:700;border:0;background:none;color:#93ABFF;cursor:pointer;padding:6px">Later</button>` : ""}</div>`;
    document.body.appendChild(d);
    d.querySelector("#updGo").onclick = () => onGo(d);
    const l = d.querySelector("#updLater"); if (l) l.onclick = () => d.remove();
  };
  const setUpd = (txt, pct) => { const t = document.getElementById("updTxt"); if (t && txt) t.innerHTML = txt; const b = document.getElementById("updBar"); if (b && pct != null) { b.style.display = "block"; b.firstElementChild.style.width = Math.round(pct) + "%"; } };
  async function installApk(url) {
    const FS = plug("Filesystem"), FO = plug("FileOpener"), BR = plug("Browser"), H = plug("CapacitorHttp");
    const viaBrowser = (msg) => { setUpd(msg || "The download opens in the browser: then open the file and tap “Update”.", null); if (BR) BR.open({ url }); else location.href = url; };
    if (!(FS && FS.downloadFile && FO)) return viaBrowser();
    try {
      // GitHub redirige le lien vers son serveur de fichiers : on récupère d'abord l'adresse finale
      let finalUrl = url;
      if (H && H.request) { try { const r = await H.request({ url, method: "GET", headers: { Range: "bytes=0-0" } }); if (r && r.url && /^https:/.test(r.url)) finalUrl = r.url; } catch (e) {} }
      setUpd("Downloading the new version…", 2);
      let h = null; try { h = await FS.addListener("progress", (p) => { if (p && p.contentLength) setUpd(null, 2 + (p.bytes / p.contentLength) * 95); }); } catch (e) {}
      try { await FS.deleteFile({ path: "english-classes-maj.apk", directory: "CACHE" }); } catch (e) {}
      const r = await FS.downloadFile({ url: finalUrl, path: "english-classes-maj.apk", directory: "CACHE", progress: true });
      try { h && h.remove(); } catch (e) {}
      // vérification : un vrai fichier d'application pèse plusieurs Mo
      let size = 0; try { const st = await FS.stat({ path: "english-classes-maj.apk", directory: "CACHE" }); size = st.size || 0; } catch (e) {}
      if (size && size < 2000000) throw new Error("fichier incomplet");
      setUpd("Tap “Update” on the Android screen. Your data is kept.", 100);
      await FO.open({ filePath: r.path || r.uri, contentType: "application/vnd.android.package-archive", openWithDefault: true });
    } catch (e) { viaBrowser("The direct download did not work: it opens in the browser. Then open the downloaded file and tap “Update”."); }
  }
  async function checkNativeUpdate(manual) {
    if (!isNative()) return;
    try {
      const local = await (await fetch("version.json", { cache: "no-store" })).json().catch(() => ({ build: 0 }));
      const H = plug("CapacitorHttp"), url = "https://github.com/grace-shop/ma-classe-anglais/releases/latest/download/apk-version.json?t=" + Date.now();
      let remote = null;
      if (H && H.get) { const r = await H.get({ url, headers: { "Cache-Control": "no-cache" } }); remote = typeof r.data === "string" ? JSON.parse(r.data) : r.data; }
      else remote = await (await fetch(url, { cache: "no-store" })).json();
      if (!remote || !remote.build) return;
      if (remote.build > (local.build || 0)) {
        if (UPD.shown && !manual) return; UPD.shown = true;
        updBox("New version available", "An update of English Classes is ready: new features and fixes. It installs in one click, <b>without uninstalling</b>, and you keep all your work.", "Update now", () => installApk(remote.apk || CFG.apkUrl));
      } else if (manual) updBox("You are up to date", "You already have the latest version of English Classes.", "OK", (d) => d.remove(), false);
    } catch (e) { if (manual) updBox("Could not check", "Check your Internet connection and try again.", "OK", (d) => d.remove(), false); }
  }
  window.__checkUpdate = (manual) => (isNative() ? checkNativeUpdate(manual) : (window.__swCheck ? window.__swCheck(manual) : null));
  if (isNative()) { setTimeout(() => checkNativeUpdate(false), 6000); setInterval(() => checkNativeUpdate(false), 3 * 3600e3); document.addEventListener("visibilitychange", () => { if (!document.hidden) checkNativeUpdate(false); }); }
  /* site web : quand une nouvelle version est en ligne, on propose de recharger */
  if (!isNative() && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
    let reloading = false;
    const offer = () => { if (UPD.shown) return; UPD.shown = true; updBox("New version available", "English Classes has been improved. Tap the button to get the new version.", "Update now", () => { reloading = true; location.replace(location.pathname + "?v=" + Date.now() + location.hash); }); };
    const watch = (reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => { const w = reg.installing; if (w) w.addEventListener("statechange", () => { if (w.state === "activated" && navigator.serviceWorker.controller && !reloading) offer(); }); });
    };
    navigator.serviceWorker.getRegistration().then(watch).catch(() => {});
    const fresh = (b) => { reloading = true; location.replace(location.pathname + "?v=" + b + location.hash); };
    const offer2 = (b) => { if (UPD.shown) return; UPD.shown = true; updBox("New version available", "English Classes has been improved. Tap the button to get the new version.", "Update now", () => fresh(b)); };
    const t0 = Date.now();
    window.__swCheck = async (manual) => { try {
      const reg = await navigator.serviceWorker.getRegistration(); if (reg) { reg.update().catch(() => {}); watch(reg); }
      const v = await (await fetch("version.json?t=" + Date.now(), { cache: "no-store" })).json();
      const pb = window.__pageBuild || 0, cur = pb || (window.__appBuild != null ? window.__appBuild : v.build); window.__appBuild = cur;
      if (v.build > cur) {
        let tried = ""; try { tried = sessionStorage.getItem("ec_upd") || ""; } catch (e) {}
        if (pb && Date.now() - t0 < 20000 && tried !== String(v.build)) { try { sessionStorage.setItem("ec_upd", String(v.build)); } catch (e) {} fresh(v.build); }   // old copy opened: load the new one at once
        else offer2(v.build);
      } else if (manual) updBox("You are up to date", "You already have the latest version of English Classes.", "OK", (d) => d.remove(), false);
    } catch (e) {} };
    window.__swCheck(false);
    setInterval(() => window.__swCheck(false), 30 * 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) window.__swCheck(false); });
  }
  /* guide d'installation sur iPhone / iPad (Safari → Partager → Sur l'écran d'accueil) */
  window.__iosGuide = () => {
    if (document.getElementById("iosGuide")) return;
    const share = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4FA3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-5px"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>';
    const plus = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-5px"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    const notSafari = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|WhatsApp/i.test(navigator.userAgent);
    const d = document.createElement("div"); d.id = "iosGuide";
    d.style.cssText = "position:fixed;inset:0;z-index:9500;background:rgba(5,7,20,.72);display:flex;align-items:flex-end;justify-content:center;padding:12px;font-family:Manrope,system-ui,sans-serif";
    d.innerHTML = `<div style="width:min(440px,100%);background:#141831;color:#F1F3FB;border:1px solid #2E3560;border-radius:24px;padding:22px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 30px 80px rgba(0,0,0,.6);display:grid;gap:14px">
      <div style="display:flex;gap:12px;align-items:center"><img src="icons/apple-touch-icon.png" alt="" style="width:52px;height:52px;border-radius:13px"><div><b style="font-size:1.1rem">Install English Classes on iPhone</b><div style="color:#AEB6D8;font-size:.85rem">Free · 30 seconds · icon on your home screen</div></div></div>
      ${notSafari ? `<div style="background:#3E2E12;color:#FFD27A;border-radius:12px;padding:10px 12px;font-size:.88rem">First open this site in <b>Safari</b> (copy the address and paste it in Safari), then follow the steps.</div>` : ""}
      <ol style="margin:0;padding-left:22px;display:grid;gap:10px;line-height:1.45">
        <li>Tap the <b>Share</b> button ${share} at the bottom of the screen (at the top on iPad).</li>
        <li>Scroll down and choose <b>“Add to Home Screen”</b> ${plus}.</li>
        <li>Tap <b>“Add”</b> at the top right.</li>
        <li>Open <b>English Classes</b> from your home screen: it opens in full screen, like a real app.</li></ol>
      <button id="iosGuideOk" style="font:inherit;font-weight:800;border:0;border-radius:14px;padding:13px;background:linear-gradient(135deg,#8EA0FF,#B49BFF 55%,#6FE3F0);color:#06091c;cursor:pointer">Got it</button></div>`;
    d.addEventListener("click", (e) => { if (e.target === d || e.target.id === "iosGuideOk") d.remove(); });
    document.body.appendChild(d);
  };
  let deferredPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; if (window.__appDownload) { window.__appDownload.canInstall = true; try { window.render && window.render(); } catch (err) {} } });
  window.__pwaInstall = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; if (window.__appDownload) window.__appDownload.canInstall = false; };
  window.__appLogout = async () => {
    try { await Promise.race([sb.auth.signOut({ scope: "local" }), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
    try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (/^sb-.+-auth-token/.test(k)) localStorage.removeItem(k); } } catch (e) {}
    session = null; mode = "in"; note = null;
    location.replace(location.pathname + "#connexion"); setTimeout(() => location.reload(), 50);
  };

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
#authGate .dlc{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:12px 12px 12px 12px;border-radius:20px;text-decoration:none;color:#F1F3FB;background:linear-gradient(#141831,#141831) padding-box,linear-gradient(120deg,#6C80FF,#B07CFF 50%,#4FD1E8) border-box;border:1.5px solid transparent;box-shadow:0 14px 40px -18px rgba(108,128,255,.9);overflow:hidden;transition:transform .18s,box-shadow .25s}
#authGate .dlc::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.10) 45%,transparent 60%);transform:translateX(-100%);animation:dlShine 3.6s ease-in-out infinite;pointer-events:none}
@keyframes dlShine{60%,100%{transform:translateX(100%)}}
#authGate .dlc:hover{transform:translateY(-2px);box-shadow:0 18px 48px -16px rgba(108,128,255,1)}
#authGate .dlc img{width:46px;height:46px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
#authGate .dlc b{display:block;font-size:1rem}#authGate .dlc small{display:block;color:#AEB6D8;font-size:.8rem;margin-top:2px}
#authGate .dlc .go{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;background:linear-gradient(135deg,#6C80FF,#9A7CFF 55%,#4FD1E8);color:#06091c;font-weight:800;font-size:.88rem;white-space:nowrap}
@media (max-width:440px){#authGate .dlc{grid-template-columns:auto 1fr}#authGate .dlc .go{grid-column:1/-1;justify-content:center;padding:11px 14px}}
@media (prefers-reduced-motion:reduce){#authGate .dlc::after{animation:none}}
#authGate .warn{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,rgba(255,196,87,.14),rgba(255,120,90,.10));border:1px solid rgba(255,196,87,.45);color:#FFE4B0;font-size:.88rem;line-height:1.45}
#authGate .warn b{color:#FFD27A}#authGate .warn svg{color:#FFC457;margin-top:1px}
#authGate .idsw{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:12px;background:#151A30;border:1px solid #2A3050}#authGate .idsw button{border:0;background:none;color:#AEB6D8;font-weight:700;cursor:pointer;padding:8px 6px;font-size:.86rem;border-radius:9px}#authGate .idsw button[aria-pressed=true]{background:#2A3260;color:#fff}
#authGate .pw{position:relative;display:block}#authGate .pw input{padding-right:52px}
#authGate .pw .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:42px;height:42px;padding:0;display:grid;place-items:center;border:0;border-radius:12px;background:transparent;color:#AFC0FF;cursor:pointer}
#authGate .pw .eye.on{color:#fff;background:#2A3260}#authGate button:disabled{opacity:.5}`;
  let gate = null, mode = "in", note = null;
  /* connexion par e-mail OU par numéro de téléphone (le numéro devient un identifiant interne, sans SMS) */
  const TEL_DOMAIN = "tel.english-classes.app";
  let idMode = "email"; try { idMode = localStorage.getItem("mca_idmode") === "tel" ? "tel" : "email"; } catch (e) {}
  const telDigits = (v) => { let d = String(v || "").replace(/[^0-9]/g, ""); if (d.startsWith("00")) d = d.slice(2); if (d.length === 8) d = "228" + d; return d; };
  const telOk = (d) => /^[0-9]{10,15}$/.test(d);
  const telEmail = (v) => telDigits(v) + "@" + TEL_DOMAIN;
  window.__isTelEmail = (e) => String(e || "").toLowerCase().endsWith("@" + TEL_DOMAIN);
  window.__telOf = (e) => { const d = String(e || "").split("@")[0]; return d.startsWith("228") && d.length === 11 ? "+228 " + d.slice(3).replace(/(\d\d)(?=\d)/g, "$1 ") : "+" + d; };
  const loginId = () => { const raw = ((document.getElementById("agE") || {}).value || "").trim(); if (idMode !== "tel") return { email: raw }; const d = telDigits(raw); return telOk(d) ? { email: telEmail(raw) } : { err: "Invalid number: write your phone number, for example 90 12 34 56." }; };
  const G = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  function drawGate() {
    if (!gate) { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); gate = document.createElement("div"); gate.id = "authGate"; document.body.appendChild(gate); }
    const sp = document.getElementById("splash"); if (sp) sp.style.display = "none";
    const reset = mode === "newpass";
    gate.innerHTML = `<div class="box" role="dialog" aria-labelledby="agT"><div class="logo" style="background:none;padding:0;overflow:hidden"><img src="icons/logo-3d.png" alt="English Classes" style="width:100%;height:100%;display:block" onerror="this.outerHTML='E'"></div><div><h1 id="agT">English Classes</h1><p>${reset ? "Choose your new password." : "Log in to find your class, your lessons and your progress."}</p></div>
    ${note ? `<div class="msg ${note.ok ? "ok" : "err"}">${esc(note.t)}</div>` : ""}
    ${reset ? `<form data-f="newpass"><label>New password<span class="pw"><input id="agP" type="password" minlength="6" required autocomplete="new-password"><button type="button" class="eye" data-x="eye" aria-label="Show password" title="Show password"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label><button class="p" type="submit">Save</button></form>` : `
    ${CFG.googleEnabled === false ? "" : `<button class="g" data-x="google">${G}Continue with Google</button><div class="or">or with your e-mail</div>`}
    <div class="tabs"><button data-x="in" aria-pressed="${mode === "in"}">Log in</button><button data-x="up" aria-pressed="${mode === "up"}">Create an account</button></div>
    <form data-f="${mode}">${mode === "up" ? `<label>First and last name<input id="agN" required maxlength="60" autocomplete="name" placeholder="E.g. Ama Kossi"></label>` : ""}
    <div class="idsw" role="group" aria-label="Log in with"><button type="button" data-x="idEmail" aria-pressed="${idMode !== "tel"}">E-mail</button><button type="button" data-x="idTel" aria-pressed="${idMode === "tel"}">Phone</button></div>
    ${idMode === "tel" ? `<label>Phone number<input id="agE" type="tel" inputmode="tel" required autocomplete="tel" placeholder="90 12 34 56" maxlength="20"></label>` : `<label>E-mail<input id="agE" type="email" required autocomplete="email" placeholder="your.email@gmail.com"></label>`}
    <label>Password<span class="pw"><input id="agP" type="password" required minlength="6" autocomplete="${mode === "up" ? "new-password" : "current-password"}" placeholder="At least 6 characters"><button type="button" class="eye" data-x="eye" aria-label="Show password" title="Show password"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>
    <div class="warn" role="note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/></svg><div>${mode === "up" ? `<b>Important: never forget your password.</b> Choose one you will remember and write it down in a safe place. Do not give it to anyone, not even a classmate: this is a safety rule. It protects your marks, your messages and your progress.` : `<b>Your password is secret.</b> Never forget it and never give it to anyone, not even a classmate or someone who says they are from the school. This is a safety rule.`}</div></div>
    <button class="p" type="submit">${mode === "up" ? "Create my account" : "Log in"}</button></form>
    ${mode === "in" ? `<button class="l" data-x="forgot">Forgot password?</button>` : ""}`}
    ${!isNative() && !window.__standaloneApp && window.__isIOS ? `<a class="dlc" href="#" data-x="ios"><img src="icons/icon-192.png" alt=""><span><b>iPhone app</b><small>Free · installs from Safari in 30 seconds</small></span><span class="go"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>Install</span></a>` : ""}
    ${!isNative() && !window.__standaloneApp && !window.__isIOS && CFG.apkUrl ? `<a class="dlc" href="${esc(CFG.apkUrl)}" rel="noopener"><img src="icons/icon-192.png" alt=""><span><b>Android app</b><small>Free · full screen · works even offline</small></span><span class="go"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Download</span></a>` : ""}</div>`;
  }
  function showGate() { drawGate(); }
  function hideGate() { if (gate) { gate.remove(); gate = null; } const sp = document.getElementById("splash"); if (sp) sp.style.display = ""; }
  const say = (t, ok) => { note = { t, ok }; drawGate(); };
  const frErr = (m) => /Invalid login/i.test(m) ? "Wrong e-mail or password." : /already registered|already exists/i.test(m) ? (idMode === "tel" ? "An account already exists with this number: please log in." : "An account already exists with this e-mail: please log in.") : /Email not confirmed/i.test(m) ? "First confirm your e-mail with the link you received." : /Password should/i.test(m) ? "The password must have at least 6 characters." : /rate limit/i.test(m) ? "Too many tries. Wait a few minutes." : m;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest("#authGate [data-x]"); if (!b) return; e.preventDefault();
    const x = b.dataset.x;
    if (x === "eye") { const inp = b.parentNode.querySelector("input"); const show = inp.type === "password"; inp.type = show ? "text" : "password"; b.classList.toggle("on", show); b.setAttribute("aria-label", show ? "Hide password" : "Show password"); inp.focus(); return; }
    if (x === "in" || x === "up") { mode = x; note = null; drawGate(); return; }
    if (x === "ios") { window.__iosGuide(); return; }
    if (x === "idEmail" || x === "idTel") { idMode = x === "idTel" ? "tel" : "email"; try { localStorage.setItem("mca_idmode", idMode); } catch (e) {} note = null; drawGate(); const f = document.getElementById("agE"); if (f) f.focus(); return; }
    if (x === "google") {
      const native = isNative(), redirectTo = native ? CFG.nativeRedirect : location.origin + location.pathname;
      const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: native } });
      if (error) return say(frErr(error.message));
      if (native && data && data.url && plug("Browser")) plug("Browser").open({ url: data.url });
      return;
    }
    if (x === "forgot") {
      if (idMode === "tel") return say("With a phone number, ask your teacher to reset your password: she can do it from your profile, in her space.");
      const email = (document.getElementById("agE") || {}).value || "";
      if (!email) return say("First write your e-mail, then tap “Forgot password”.");
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: isNative() ? CFG.nativeRedirect : location.origin + location.pathname });
      return error ? say(frErr(error.message)) : say("A link to change your password has just been sent to " + email + ".", true);
    }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest && e.target.closest("#authGate form"); if (!f) return; e.preventDefault(); e.stopImmediatePropagation();
    const v = (id) => ((document.getElementById(id) || {}).value || "").trim();
    const btn = f.querySelector("button"); if (btn) btn.disabled = true;
    try {
      const id = f.dataset.f === "newpass" ? {} : loginId();
      if (id.err) { say(id.err); return; }
      if (f.dataset.f === "in") { const { error } = await sb.auth.signInWithPassword({ email: id.email, password: v("agP") }); if (error) say(idMode === "tel" && /Invalid login/i.test(error.message) ? "Wrong number or password." : frErr(error.message)); }
      else if (f.dataset.f === "up") {
        const { data, error } = await sb.auth.signUp({ email: id.email, password: v("agP"), options: { data: { full_name: v("agN"), ...(idMode === "tel" ? { phone: "+" + telDigits(v("agE")) } : {}) }, emailRedirectTo: isNative() ? CFG.nativeRedirect : location.origin + location.pathname } });
        if (error) say(frErr(error.message)); else if (!data.session) { mode = "in"; say(idMode === "tel" ? "Account created! Now log in with your number and your password." : "Account created! Open the confirmation e-mail, then log in.", true); }
      } else if (f.dataset.f === "newpass") { const { error } = await sb.auth.updateUser({ password: v("agP") }); if (error) say(frErr(error.message)); else { mode = "in"; note = null; hideGate(); location.reload(); } }
    } finally { if (btn) btn.disabled = false; }
  }, true);

  /* ---------------- contenu de départ (première connexion de la prof principale) ---------------- */
  async function offerStarterContent() {
    if (member.level !== "owner") return;
    const { count, error: cErr } = await sb.from("docs").select("path", { count: "exact", head: true }).eq("col", "lessons");
    if (cErr || count) return;
    let content; try { content = await (await fetch("content.json", { cache: "no-store" })).json(); } catch (e) { return; }
    const total = Object.values(content).reduce((n, c) => n + Object.keys(c).length, 0);
    const box = document.createElement("div"); box.id = "authGate";
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    box.innerHTML = `<div class="box"><div class="logo" style="background:none;padding:0;overflow:hidden"><img src="icons/logo-3d.png" alt="English Classes" style="width:100%;height:100%;display:block" onerror="this.outerHTML='E'"></div><h1>Welcome!</h1><p>Your database is empty. Install the starter content: ${Object.keys(content.lessons || {}).length} lessons from the Togolese curriculum, ${Object.keys(content.quizzes || {}).length} quizzes, ${Object.keys(content.decks || {}).length} vocabulary lists and ${Object.keys(content.epreuves || {}).length} exam papers with answer keys?</p><div class="msg ok" id="agProg" hidden></div><button class="p" id="agGo">Install the content (${total} items)</button><button class="l" id="agSkip">Later</button></div>`;
    document.body.appendChild(box);
    await new Promise((done) => {
      box.querySelector("#agSkip").onclick = () => { box.remove(); done(); };
      box.querySelector("#agGo").onclick = async () => {
        const go = box.querySelector("#agGo"), pr = box.querySelector("#agProg"); go.disabled = true; pr.hidden = false;
        const rows = []; const now = Date.now(); let k = 0;
        for (const [col, docs] of Object.entries(content)) for (const [id, data] of Object.entries(docs)) rows.push({ path: col + "/" + id, data: { ...data, createdAt: data.createdAt || now - (k++) * 1000 } });
        for (let i = 0; i < rows.length; i += 50) {
          const { error } = await sb.from("docs").upsert(rows.slice(i, i + 50), { onConflict: "path" });
          if (error) { pr.className = "msg err"; pr.textContent = "Error: " + error.message; go.disabled = false; return; }
          pr.textContent = `Installing… ${Math.min(i + 50, rows.length)} / ${rows.length}`;
        }
        pr.textContent = "Content installed!"; try { localStorage.setItem("mca_prog_togo-2026-10", "1"); } catch (e) {} setTimeout(() => { box.remove(); done(); }, 700);
      };
    });
  }

  /* ---------------- démarrage ---------------- */
  async function loadMember() {
    const mk = "mca_member_" + session.user.id;
    let got = null;
    try {
      const r = await Promise.race([sb.from("members").select("level,email").eq("uid", session.user.id).maybeSingle(), new Promise((res) => setTimeout(() => res({ timeout: true }), 5000))]);
      if (r && !r.timeout && !r.error) got = r.data || { level: "interact" };
    } catch (e) {}
    if (got) { try { localStorage.setItem(mk, JSON.stringify(got)); } catch (e) {} member = got; return; }
    let saved = null; try { saved = JSON.parse(localStorage.getItem(mk) || "null"); } catch (e) {}
    member = saved || { level: "interact" };
  }
  let started = false;
  function brandAI() { const el = document.getElementById("aiSub"); if (el) el.textContent = "AI assistant powered by Gemini"; }
  async function afterLogin() {
    if (started) return; started = true;
    hideGate(); brandAI(); await loadMember(); await offerStarterContent().catch(() => {}); resolveReady();
  }
  async function boot() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || /VOTRE/.test(CFG.supabaseUrl)) {
      const sp = document.getElementById("splash"); if (sp) sp.style.display = "none";
      document.body.insertAdjacentHTML("beforeend", `<div style="position:fixed;inset:0;z-index:300;display:grid;place-items:center;background:radial-gradient(120% 80% at 50% -10%,#1A2150 0%,#0E1120 45%,#090B16 100%);color:#F1F3FB;font-family:Manrope,system-ui,sans-serif;padding:20px"><div style="max-width:440px;display:grid;gap:14px;padding:28px 24px;border-radius:26px;background:rgba(23,27,46,.9);border:1px solid #2A3050"><div style="width:62px;height:62px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(120deg,#4A5FD0,#93ABFF);font:italic 1.7rem Georgia,serif">En</div><h2 style="margin:0;font:400 1.9rem Georgia,serif">English Classes</h2><p style="margin:0;color:#C4CAE4;line-height:1.55">The app is installed; now it must be connected to its database. Teacher: follow steps 1 to 6 of the guide (Supabase project, then the <b>SUPABASE_URL</b> and <b>SUPABASE_ANON_KEY</b> variables on GitHub).</p><p style="margin:0;color:#8D94B5;font-size:.9rem">Students: come back a little later, your class opens soon.</p></div></div>`);
      return;
    }
    if (!window.supabase) { try { await loadScript(CFG.supabaseJs || "vendor/supabase.js"); } catch (e) { await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"); } }
    let devId = ""; try { devId = localStorage.getItem("mca_dev") || ""; if (!devId) { devId = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("mca_dev", devId); } } catch (e) {}
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }, global: { headers: devId ? { "x-device-id": devId } : {} } });
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
    if (!session) {                                    // jeton expiré et réseau coupé : on garde la session enregistrée
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (/^sb-.+-auth-token$/.test(k)) { const st = JSON.parse(localStorage.getItem(k) || "null"); if (st && st.user && st.user.id) { session = st; break; } }
        }
      } catch (e) {}
    }
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
