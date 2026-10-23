/* v5 · Actions sur les messages sélectionnés (discussion entre camarades) :
   Répondre (un seul message), Transférer (vers un camarade, les fichiers sont
   ré-envoyés), Supprimer (ses propres messages). */
(function () {
  function rowOf(id) {
    return (PR.inbox || []).find(function (x) { return String(x.id) === String(id); }) || null;
  }
  function textOfRow(r) { return String((r && r.body) || "").trim(); }

  function toastSafe(msg, icon) { try { toast(msg, icon || "check"); } catch (e) {} }

  // ---- reply to the one message selected ----
  function doReply(ids) {
    var r = rowOf(ids[0]);
    if (!r) return toastSafe("Ce message ne peut pas être cité.", "x");
    var t = textOfRow(r) || (r.att && r.att.k === "album" ? "Photos et vidéos" : (r.att && r.att.k === "img" ? "Photo" : "Message"));
    V4.reply = { kind: "peer", id: r.id, t: t.slice(0, 140), w: r.sender };
    window.zzSelClear && window.zzSelClear();
    render();
  }

  // ---- delete the own messages selected ----
  async function doDelete(ids) {
    var mine = ids.map(rowOf).filter(function (r) { return r && r.sender === S.uid && !r.deleted_at; });
    if (!mine.length) return toastSafe("Vous ne pouvez supprimer que vos messages.", "x");
    window.zzSelClear && window.zzSelClear();
    for (var i = 0; i < mine.length; i++) {
      var r = mine[i];
      try {
        await window.__peer.del(r.id);
        r.deleted_at = new Date().toISOString(); r.body = ""; r.att = null; r.meta = null;
      } catch (e) { toastSafe((e && e.message) || "Suppression impossible.", "x"); }
    }
    render();
  }

  // ---- forward: a fresh copy of each file, so the friend can open it ----
  async function copyFile(a) {
    var b = await srcBlob({ k: "m", id: a.p, t: a.t });
    var up = await window.__chatFiles.upload(b, a.n || "file");
    return { k: a.k, p: up.p, t: up.t, n: up.n, s: up.s, ...(a.e ? { e: a.e } : {}), ...(a.d ? { d: a.d } : {}) };
  }
  async function sendForward(to, r) {
    var a = r.att || null;
    var body = textOfRow(r);
    if (!a) return window.__peer.send(to, body, null, null);
    if (a.k === "album") {
      var items = [];
      for (var i = 0; i < a.items.length; i++) items.push(await copyFile(a.items[i]));
      try { return await window.__peer.send(to, body, { k: "album", items: items }, null); }
      catch (e) {
        if (!/Invalid (attachment|album)/i.test((e && e.message) || "")) throw e;
        var first = true;
        for (var j = 0; j < items.length; j++) {
          await window.__peer.send(to, first ? body : "", { k: items[j].k === "img" ? "img" : "file", p: items[j].p, t: items[j].t, n: items[j].n, s: items[j].s, ...(items[j].e ? { e: items[j].e } : {}) }, null);
          first = false;
        }
        return null;
      }
    }
    if (a.k === "sticker" && a.e) return window.__peer.send(to, body, a, null);
    if (a.k === "img" || a.k === "file" || a.k === "voice") return window.__peer.send(to, body, await copyFile(a), null);
    return window.__peer.send(to, body, a, null);
  }

  async function doForward(ids, to) {
    var rows = ids.map(rowOf).filter(Boolean);
    if (!rows.length) return toastSafe("Rien à transférer.", "x");
    toastSafe("Transfert en cours…", "clock");
    try {
      for (var i = 0; i < rows.length; i++) await sendForward(to, rows[i]);
      toastSafe("Transféré", "check");
    } catch (e) { toastSafe((e && e.message) || "Transfert impossible.", "x"); }
  }

  function pickFriend(ids) {
    var list = (typeof FR !== "undefined" && FR.list || []).filter(function (x) { return x.status === "accepted"; });
    var old = document.getElementById("zzfw"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "zzfw"; ov.className = "zzfw";
    var rowsHTML = list.length ? list.map(function (x) {
      var nm = (typeof nameOf === "function" ? nameOf(x.uid) : "Camarade");
      return '<button type="button" class="zzfw-i" data-uid="' + x.uid + '"><span class="zzfw-a">' + String(nm).slice(0, 1).toUpperCase() + '</span><b>' + String(nm).replace(/[<>&]/g, "") + '</b></button>';
    }).join("") : '<p class="zzfw-e">Ajoutez d\'abord un camarade pour lui transférer des messages.</p>';
    ov.innerHTML = '<div class="zzfw-b" data-x="1"></div><div class="zzfw-s"><div class="zzfw-g"></div><h3>Transférer à</h3><div class="zzfw-l">' + rowsHTML + '</div><button type="button" class="zzfw-c" data-x="1">Annuler</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.x) { ov.remove(); return; }
      var b = t.closest && t.closest(".zzfw-i");
      if (!b) return;
      ov.remove();
      window.zzSelClear && window.zzSelClear();
      doForward(ids, b.dataset.uid);
    });
  }

  window.zzSelAct = function (action, ids) {
    if (!ids || !ids.length) return;
    if (action === "reply") return doReply(ids);
    if (action === "del") return doDelete(ids);
    if (action === "fwd") return pickFriend(ids);
  };

  var st = document.createElement("style"); st.id = "zzSelAct";
  st.textContent = ".zz-sreply,.zz-sfwd,.zz-sdel{margin-left:6px}.zz-sreply[hidden]{display:none}" +
    ".zzfw{position:fixed;inset:0;z-index:10060;font:600 15px system-ui,sans-serif;color:#EDEEF3}" +
    ".zzfw-b{position:absolute;inset:0;background:rgba(0,0,0,.5)}" +
    ".zzfw-s{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#1B1D24;border-radius:22px 22px 0 0;padding:10px 14px calc(16px + env(safe-area-inset-bottom,0px));max-height:70vh;display:flex;flex-direction:column;gap:8px}" +
    ".zzfw-g{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 4px}" +
    ".zzfw-s h3{margin:0;font:700 1.05rem system-ui,sans-serif}" +
    ".zzfw-l{overflow-y:auto;display:flex;flex-direction:column;gap:6px}" +
    ".zzfw-i{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:9px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;cursor:pointer;font:600 .95rem system-ui,sans-serif}" +
    ".zzfw-a{width:38px;height:38px;border-radius:50%;background:#A78BFA;color:#0B0D18;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}" +
    ".zzfw-e{opacity:.7;text-align:center;padding:16px 0}" +
    ".zzfw-c{border:1px solid rgba(255,255,255,.2);background:transparent;color:#EDEEF3;border-radius:14px;padding:11px;font:700 .95rem system-ui,sans-serif;cursor:pointer}";
  document.head.appendChild(st);
})();
