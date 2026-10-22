/* =====================================================================
   v5 · Battle Royale: the room stays yours, and you can chat in it.
   - The room (and its code) is kept on this phone. Leaving for the
     messages and coming back shows the SAME code, not a new room.
   - Opening another challenge while a battle is open takes you back to
     your battle instead of making a new room.
   - "Discussion" panel inside the open arena (battle or hub): you choose
     WHO you write to (everyone in the battle, or one friend), and you see
     the conversation with that person. Messages also reach their messagerie,
     marked with the room.
   ===================================================================== */
(function () {
  var KEY = "mca_btroom";
  var me = function () { return (typeof S !== "undefined" ? S : undefined) && S.uid || ""; };

  function roomOpen() {
    return !!((typeof BT !== "undefined" ? BT : undefined) && BT.room && BT.room.id);
  }

  // ---- 1 · keep the room on this phone ----
  function saveRoom() {
    try {
      if (roomOpen()) localStorage.setItem(KEY, JSON.stringify({ room: BT.room, uid: me() }));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }
  function restoreRoom() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s || !s.room || !(typeof BT !== "undefined" ? BT : undefined) || BT.room) return;
      if (s.uid && me() && s.uid !== me()) return;   // another account on this phone
      BT.room = s.room;
      if (typeof btPoll === "function") btPoll();   // reloads the same room from the server
    } catch (e) {}
  }

  // ---- 2 · do not make a second room while one is open ----
  var _rch = typeof btRoyaleCh === "function" ? btRoyaleCh : null;
  btRoyaleCh = async function (i) {
    if (roomOpen() && BT.on) {
      toast("Ta bataille est déjà ouverte. Code : " + (BT.room.code || ""), "check");
      if (typeof btClick === "function") btClick({ dataset: { ar: "bt-back" } });
      return;
    }
    return _rch ? _rch.apply(this, arguments) : undefined;
  };

  // ---- 3 · the discussion panel ----
  var panel = null, open = false;
  var allSel = true;          // true: the whole battle; otherwise the people in pick
  var pick = [];              // uids chosen (friends or players)
  var sheet = null, sheetQ = "";

  function nameOf(uid) {
    if (uid === me()) return "Vous";
    var x = ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).find(function (d) { return d.uid === uid; });
    if (x && x.name) return x.name;
    var pl = BT.st && (BT.st.players || []).find(function (p) { return p.uid === uid; });
    return pl && pl.name ? pl.name : "Camarade";
  }
  function initial(n) { return String(n || "?").trim().charAt(0).toUpperCase() || "?"; }

  // the battle players first, then your friends (search and pick any of them)
  function people() {
    var out = [], seen = {};
    ((BT.st && BT.st.players) || []).forEach(function (p) {
      if (!p.uid || p.uid === me() || seen[p.uid]) return;
      seen[p.uid] = 1; out.push({ uid: p.uid, name: p.name || nameOf(p.uid), where: "Dans la bataille" });
    });
    ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).forEach(function (d) {
      if (!d.uid || d.uid === me() || seen[d.uid]) return;
      if (!(typeof frState === "function" && frState(d.uid) === "friends")) return;
      seen[d.uid] = 1; out.push({ uid: d.uid, name: d.name || "Ami", where: "Ami" });
    });
    return out.sort(function (a, b) { return (a.where === b.where ? 0 : a.where === "Ami" ? 1 : -1) || String(a.name).localeCompare(String(b.name)); });
  }

  // who the messages go to now
  function targets() {
    if (allSel) return ((BT.st && BT.st.players) || []).map(function (p) { return p.uid; }).filter(function (u) { return u && u !== me(); });
    return pick.slice();
  }

  function roomMessages() {
    var id = BT.room && BT.room.id;
    if (!id || !(typeof PR !== "undefined" ? PR : undefined)) return [];
    var seen = {}, out = [];
    (PR.inbox || []).forEach(function (m) {
      if (!m || !m.meta || m.meta.room !== id) return;
      var k = m.sender + "|" + m.receiver + "|" + m.body + "|" + Math.floor(+new Date(m.created_at) / 2000);
      if (seen[k]) return;
      seen[k] = 1;
      out.push(m);
    });
    return out.sort(function (a, b) { return +new Date(a.created_at) - +new Date(b.created_at); });
  }

  // the conversation with the people chosen (or the whole battle)
  function thread() {
    var rows = roomMessages();
    if (allSel) return rows;
    return rows.filter(function (m) {
      return (m.sender === me() && pick.indexOf(m.receiver) >= 0) || (pick.indexOf(m.sender) >= 0 && m.receiver === me());
    });
  }

  function esc2(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function label() {
    if (allSel) return "Toute la bataille";
    if (pick.length === 1) return nameOf(pick[0]);
    return pick.length + " camarades";
  }

  function paintTo() {
    if (!panel) return;
    panel.querySelector(".zz-bcto-btn b").textContent = label();
    var hint = panel.querySelector(".zz-bcto");
    hint.textContent = allSel ? "Tu écris à toute la bataille" : "Tu écris à " + pick.map(nameOf).join(", ");
  }

  function paintList() {
    if (!panel) return;
    var list = panel.querySelector(".zz-bcl");
    var rows = thread();
    var sig = (allSel ? "all" : pick.join(",")) + "|" + rows.map(function (m) { return m.id + ":" + m.body; }).join("|");
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    var stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    list.innerHTML = rows.length
      ? rows.map(function (m) {
          var mine = m.sender === me();
          var who = mine ? "Toi" : nameOf(m.sender);
          if (allSel || pick.length > 1) who += mine ? " → " + nameOf(m.receiver) : "";
          return '<div class="zz-bcm ' + (mine ? "mine" : "") + '"><small>' + esc2(who) + '</small>' + esc2(m.body) + '</div>';
        }).join("")
      : '<p class="zz-bce">' + (allSel ? "Dis bonjour à tes camarades de bataille." : "Pas encore de message. Écris-lui !") + '</p>';
    if (stick || !list.dataset.once) { list.scrollTop = list.scrollHeight; list.dataset.once = "1"; }
  }

  function send(text) {
    var txt = String(text || "").trim();
    if (!txt || !roomOpen()) return;
    var to = targets();
    if (!to.length) { toast(allSel ? "Pas encore d'autres joueurs dans la bataille. Choisis un ami." : "Choisis une personne.", "x"); return; }
    var meta = { room: BT.room.id };
    // show it at once as sent (a sending message is not sent a second time)
    to.forEach(function (u) {
      var tmpId = "tmp" + Date.now() + Math.random().toString(36).slice(2, 6);
      PR.inbox.unshift({ id: tmpId, sender: me(), receiver: u, body: txt, att: null, meta: meta,
        created_at: new Date().toISOString(), read_at: null, pending: true });
      Promise.resolve(window.__peer && __peer.send(u, txt, null, meta)).then(function (msgId) {
        PR.inbox = PR.inbox.filter(function (x) { return x.id !== tmpId && x.id !== msgId; });
        if (msgId) PR.inbox.unshift({ id: msgId, sender: me(), receiver: u, body: txt, att: null, meta: meta,
          created_at: new Date().toISOString(), read_at: null });
        paintList();
      }).catch(function () {
        PR.inbox = PR.inbox.filter(function (x) { return x.id !== tmpId; });
        toast("Message non envoyé. Réessaie.", "x");
        paintList();
      });
    });
    paintList();
  }

  // ---- the chooser: a bottom sheet with search and multi-select ----
  function paintSheet() {
    if (!sheet) return;
    var q = sheetQ.trim().toLowerCase();
    var all = people().filter(function (p) { return !q || String(p.name).toLowerCase().indexOf(q) >= 0; });
    var box = sheet.querySelector(".zz-rcl");
    var html = "";
    if (!q) {
      html += '<button type="button" class="zz-rci' + (allSel ? " on" : "") + '" data-all="1"><span class="zz-rca zz-rcall">★</span><span class="zz-rcn">Toute la bataille</span><span class="zz-rcc"></span></button>';
    }
    var groups = {};
    all.forEach(function (p) { (groups[p.where] = groups[p.where] || []).push(p); });
    ["Dans la bataille", "Ami"].forEach(function (g) {
      if (!groups[g] || !groups[g].length) return;
      html += '<div class="zz-rcg">' + (g === "Ami" ? "Tes amis" : g) + '</div>';
      html += groups[g].map(function (p) {
        var on = !allSel && pick.indexOf(p.uid) >= 0;
        return '<button type="button" class="zz-rci' + (on ? " on" : "") + '" data-uid="' + esc2(p.uid) + '"><span class="zz-rca">' + esc2(initial(p.name)) + '</span><span class="zz-rcn">' + esc2(p.name) + '</span><span class="zz-rcc"></span></button>';
      }).join("");
    });
    box.innerHTML = html || '<p class="zz-rce">' + (q ? "Aucun camarade trouvé." : "Ajoute des amis pour leur écrire ici.") + '</p>';
    var n = pick.length;
    sheet.querySelector(".zz-rcok").textContent = allSel ? "Valider" : "Valider (" + n + ")";
  }

  function openSheet() {
    closeSheet();
    sheet = document.createElement("div");
    sheet.id = "zzRcp";
    sheet.innerHTML = '<div class="zz-rcb" data-x="1"></div><div class="zz-rcs">' +
      '<div class="zz-rcgrip"></div><div class="zz-rch">Écrire à</div>' +
      '<label class="zz-rcq"><span aria-hidden="true">🔍</span><input type="search" placeholder="Chercher un ami…" aria-label="Chercher un ami"></label>' +
      '<div class="zz-rcl"></div>' +
      '<button type="button" class="zz-rcok">Valider</button></div>';
    document.body.appendChild(sheet);
    sheet.querySelector(".zz-rcq input").addEventListener("input", function () { sheetQ = this.value; paintSheet(); });
    sheet.addEventListener("click", function (e) {
      if (e.target.dataset && e.target.dataset.x) return closeSheet();
      if (e.target.closest(".zz-rcok")) { closeSheet(); paintTo(); paintList(); return; }
      var b = e.target.closest(".zz-rci");
      if (!b) return;
      if (b.dataset.all) { allSel = true; pick = []; }
      else {
        allSel = false;
        var u = b.dataset.uid, i = pick.indexOf(u);
        if (i >= 0) pick.splice(i, 1); else pick.push(u);
        if (!pick.length) allSel = true;
      }
      paintSheet();
      paintTo();
    });
    paintSheet();
    // the sheet can be dismissed from the bottom grip too
    setTimeout(function () { var i = sheet && sheet.querySelector(".zz-rcq input"); if (i) i.focus({ preventScroll: true }); }, 250);
  }
  function closeSheet() { if (sheet) { sheet.remove(); sheet = null; sheetQ = ""; } paintTo(); paintList(); }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "zzBc";
    panel.innerHTML =
      '<button type="button" class="zz-bct" aria-expanded="false">💬 Discussion</button>' +
      '<div class="zz-bcbox" hidden>' +
        '<button type="button" class="zz-bcto-btn"><span>À</span><b>Toute la bataille</b><i aria-hidden="true">▾</i></button>' +
        '<div class="zz-bcto">Tu écris à toute la bataille</div>' +
        '<div class="zz-bcl"></div>' +
        '<form class="zz-bcf"><input id="zzBci" maxlength="300" autocomplete="off" placeholder="Écris ton message…" aria-label="Message"><button type="submit">Envoyer</button></form>' +
      '</div>';
    document.body.appendChild(panel);
    panel.querySelector(".zz-bct").addEventListener("click", function () {
      open = !open;
      panel.querySelector(".zz-bcbox").hidden = !open;
      this.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { paintTo(); paintList(); }
    });
    panel.querySelector(".zz-bcto-btn").addEventListener("click", openSheet);
    panel.querySelector(".zz-bcf").addEventListener("submit", function (e) {
      e.preventDefault();
      var i = panel.querySelector("#zzBci");
      if (!i) return;
      var said = i.value;
      // leave the field and replace it by an empty one: the phone keyboard
      // puts back the text it was writing when the same field keeps the focus
      try { i.blur(); } catch (x) {}
      var fresh = i.cloneNode(false);
      fresh.value = "";
      i.parentNode.replaceChild(fresh, i);
      send(said);
    });
    return panel;
  }

  function syncPanel() {
    var ar = document.getElementById("arena");
    // shown in the open arena while a battle room is yours (in the battle or on the hub)
    var show = roomOpen() && !!ar && !ar.hidden;
    if (show && !BT.st && typeof btSync === "function" && !BT.syncing) { try { btSync(); } catch (e) {} }
    if (!show) { if (panel) panel.style.display = "none"; return; }
    var pn = ensurePanel();
    if (pn.parentNode !== ar) ar.appendChild(pn);   // inside the open arena: no layer can cover it
    pn.style.display = "";
    if (open) { paintTo(); paintList(); }
  }

  // ---- timers: save the room, refresh the panel ----
  setInterval(function () {
    try { saveRoom(); syncPanel(); } catch (e) {}
  }, 1500);

  var st = document.createElement("style");
  st.id = "zzzzzyBattleChat";
  st.textContent = `
#zzBc{position:fixed;right:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:9980;width:min(340px,calc(100vw - 24px));font:600 .85rem system-ui,sans-serif;color:#EDEEF3}
#zzBc .zz-bct{margin-left:auto;display:block;border:1px solid rgba(94,234,212,.5);background:rgba(10,14,30,.9);color:#5EEAD4;border-radius:999px;padding:9px 14px;cursor:pointer;font:700 .85rem system-ui,sans-serif;box-shadow:0 8px 20px -8px rgba(0,0,0,.6)}
#zzBc .zz-bcbox{margin-top:8px;background:rgba(12,15,32,.97);border:1px solid rgba(94,234,212,.3);border-radius:18px;padding:10px;box-shadow:0 12px 30px -10px rgba(0,0,0,.6)}
#zzBc .zz-bcbox[hidden]{display:none}
#zzBc .zz-bcto{font-size:.72rem;opacity:.7;margin:0 2px 8px}
#zzBc .zz-bcto-btn{display:flex;align-items:center;gap:8px;width:100%;margin-bottom:4px;border-radius:14px;border:1px solid rgba(94,234,212,.35);background:rgba(94,234,212,.08);color:#fff;padding:9px 12px;font:700 .9rem system-ui,sans-serif;cursor:pointer;text-align:left}
#zzBc .zz-bcto-btn span{color:#9FF5DA;font-weight:800}
#zzBc .zz-bcto-btn b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zzBc .zz-bcto-btn i{font-style:normal;opacity:.7}
#zzRcp{position:fixed;inset:0;z-index:10001;font:600 .95rem system-ui,sans-serif;color:#EDEEF3}
#zzRcp .zz-rcb{position:absolute;inset:0;background:rgba(0,0,0,.5)}
#zzRcp .zz-rcs{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;max-height:82vh;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#1E1B33,#14121F);border-radius:24px 24px 0 0;padding:10px 14px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -12px 40px -10px rgba(0,0,0,.7)}
#zzRcp .zz-rcgrip{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 4px}
#zzRcp .zz-rch{font:800 1.15rem system-ui,sans-serif;padding:0 4px}
#zzRcp .zz-rcq{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:0 12px}
#zzRcp .zz-rcq input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:#fff;padding:11px 0;font:600 1rem system-ui,sans-serif}
#zzRcp .zz-rcl{overflow-y:auto;display:flex;flex-direction:column;gap:4px;min-height:120px;padding-right:2px}
#zzRcp .zz-rcg{font:800 .72rem system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#A78BFA;padding:12px 6px 4px}
#zzRcp .zz-rci{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 10px;border-radius:16px;border:1px solid transparent;background:transparent;color:inherit;cursor:pointer;font:700 .98rem system-ui,sans-serif;transition:background .15s}
#zzRcp .zz-rci:active{background:rgba(255,255,255,.06)}
#zzRcp .zz-rci.on{background:rgba(167,139,250,.14);border-color:rgba(167,139,250,.45)}
#zzRcp .zz-rca{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#C4B5FD,#8B5CF6);color:#0B0D18;display:flex;align-items:center;justify-content:center;font-weight:900;flex:none;box-shadow:0 4px 12px -4px rgba(139,92,246,.6)}
#zzRcp .zz-rcall{background:linear-gradient(135deg,#5EEAD4,#38BDF8);box-shadow:0 4px 12px -4px rgba(56,189,248,.6)}
#zzRcp .zz-rcn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zzRcp .zz-rcc{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.35);flex:none;position:relative;transition:all .15s}
#zzRcp .zz-rci.on .zz-rcc{background:#A78BFA;border-color:#A78BFA;box-shadow:0 0 0 3px rgba(167,139,250,.25)}
#zzRcp .zz-rci.on .zz-rcc::after{content:"";position:absolute;left:7px;top:3px;width:5px;height:10px;border:solid #0B0D18;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
#zzRcp .zz-rce{opacity:.7;text-align:center;padding:22px 0}
#zzRcp .zz-rcok{border:0;border-radius:16px;background:linear-gradient(135deg,#C4B5FD,#8B5CF6);color:#0B0D18;padding:13px;font:800 1rem system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 24px -10px rgba(139,92,246,.8)}
#zzBc .zz-bcl{max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
#zzBc .zz-bcm{background:rgba(255,255,255,.07);border-radius:14px;padding:7px 10px;max-width:86%;align-self:flex-start;word-break:break-word;line-height:1.35}
#zzBc .zz-bcm.mine{background:rgba(94,234,212,.18);align-self:flex-end}
#zzBc .zz-bcm small{display:block;color:#9FF5DA;font-size:.7rem;margin-bottom:2px}
#zzBc .zz-bce{opacity:.65;margin:6px 0;text-align:center}
#zzBc .zz-bcf{display:flex;gap:6px}
#zzBc .zz-bcf input{flex:1;min-width:0;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;padding:10px 14px;font:500 .95rem system-ui,sans-serif;outline:none}
#zzBc .zz-bcf button{border:0;border-radius:999px;background:#5EEAD4;color:#0B0D18;padding:0 14px;font:800 .85rem system-ui,sans-serif;cursor:pointer}
`;
  document.head.appendChild(st);

  // start: restore the room once the arena data exists
  setTimeout(restoreRoom, 1200);
})();
