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
  var panel = null, open = false, to = "all";

  function nameOf(uid) {
    if (uid === me()) return "Vous";
    var x = ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).find(function (d) { return d.uid === uid; });
    if (x && x.name) return x.name;
    var pl = BT.st && (BT.st.players || []).find(function (p) { return p.uid === uid; });
    return pl && pl.name ? pl.name : "Camarade";
  }

  // who can be written to: the players of this battle, then your friends
  function recipients() {
    var out = [], seen = {};
    var players = (BT.st && BT.st.players) || [];
    players.forEach(function (p) {
      if (!p.uid || p.uid === me() || seen[p.uid]) return;
      seen[p.uid] = 1; out.push({ uid: p.uid, name: p.name || nameOf(p.uid), where: "Dans la bataille" });
    });
    ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).forEach(function (d) {
      if (!d.uid || d.uid === me() || seen[d.uid]) return;
      var friend = typeof frState === "function" ? frState(d.uid) === "friends" : false;
      if (!friend) return;
      seen[d.uid] = 1; out.push({ uid: d.uid, name: d.name || "Ami", where: "Ami" });
    });
    return out;
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

  // the messages of the chosen person (or of the whole battle)
  function thread() {
    var rows = roomMessages();
    if (to === "all") return rows;
    return rows.filter(function (m) {
      return (m.sender === me() && m.receiver === to) || (m.sender === to && m.receiver === me());
    });
  }

  function esc2(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function paintTo() {
    if (!panel) return;
    var sel = panel.querySelector("#zzBcTo");
    var list = recipients();
    if (to !== "all" && !list.some(function (r) { return r.uid === to; })) to = "all";
    var opts = '<option value="all">Toute la bataille</option>';
    var groups = { "Dans la bataille": [], "Ami": [] };
    list.forEach(function (r) { groups[r.where].push(r); });
    Object.keys(groups).forEach(function (g) {
      if (!groups[g].length) return;
      opts += '<optgroup label="' + esc2(g === "Ami" ? "Tes amis" : g) + '">' +
        groups[g].map(function (r) { return '<option value="' + esc2(r.uid) + '"' + (r.uid === to ? " selected" : "") + '>' + esc2(r.name) + '</option>'; }).join("") +
        '</optgroup>';
    });
    if (sel.dataset.sig !== opts + to) { sel.dataset.sig = opts + to; sel.innerHTML = opts; sel.value = to; }
    var hint = panel.querySelector(".zz-bcto");
    hint.textContent = to === "all" ? "Tu écris à toute la bataille" : "Tu écris à " + nameOf(to);
  }

  function paintList() {
    if (!panel) return;
    var list = panel.querySelector(".zz-bcl");
    var rows = thread();
    var sig = to + "|" + rows.map(function (m) { return m.id + ":" + m.body; }).join("|");
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    var stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    list.innerHTML = rows.length
      ? rows.map(function (m) {
          var mine = m.sender === me();
          var who = mine ? "Toi" : nameOf(m.sender);
          if (to === "all") who += mine ? " → " + nameOf(m.receiver) : "";
          return '<div class="zz-bcm ' + (mine ? "mine" : "") + '"><small>' + esc2(who) + '</small>' + esc2(m.body) + '</div>';
        }).join("")
      : '<p class="zz-bce">' + (to === "all" ? "Dis bonjour à tes camarades de bataille." : "Pas encore de message avec " + esc2(nameOf(to)) + ". Écris-lui !") + '</p>';
    if (stick || !list.dataset.once) { list.scrollTop = list.scrollHeight; list.dataset.once = "1"; }
  }

  function send(text) {
    var txt = String(text || "").trim();
    if (!txt || !roomOpen()) return;
    var targets;
    if (to === "all") {
      targets = ((BT.st && BT.st.players) || []).map(function (p) { return p.uid; }).filter(function (u) { return u && u !== me(); });
      if (!targets.length) { toast("Pas encore d'autres joueurs dans la bataille. Choisis un ami dans la liste.", "x"); return; }
    } else {
      targets = [to];
    }
    var meta = { room: BT.room.id };
    targets.forEach(function (u) {
      Promise.resolve(window.__peer && __peer.send(u, txt, null, meta)).catch(function () {});
      if (typeof PR !== "undefined") PR.inbox.unshift({ id: "tmp" + Date.now() + u, sender: me(), receiver: u, body: txt, meta: meta, created_at: new Date().toISOString() });
    });
    paintList();
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "zzBc";
    panel.innerHTML =
      '<button type="button" class="zz-bct" aria-expanded="false">💬 Discussion</button>' +
      '<div class="zz-bcbox" hidden>' +
        '<label class="zz-bcto-row"><span>À</span><select id="zzBcTo" aria-label="Écrire à"></select></label>' +
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
    panel.querySelector("#zzBcTo").addEventListener("change", function () {
      to = this.value; paintTo(); paintList();
    });
    panel.querySelector(".zz-bcf").addEventListener("submit", function (e) {
      e.preventDefault();
      var i = panel.querySelector("#zzBci");
      send(i.value);
      i.value = "";
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
#zzBc .zz-bcto-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
#zzBc .zz-bcto-row span{color:#9FF5DA;font-weight:800}
#zzBc #zzBcTo{flex:1;min-width:0;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;padding:8px 10px;font:600 .9rem system-ui,sans-serif}
#zzBc #zzBcTo option,#zzBc #zzBcTo optgroup{background:#12152a;color:#fff}
#zzBc .zz-bcto{font-size:.72rem;opacity:.7;margin:0 2px 8px}
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
