/* =====================================================================
   v5 · Battle Royale: the room stays yours, and you can chat in it.
   - The room (and its code) is kept on this phone. Leaving for the
     messages and coming back shows the SAME code, not a new room.
   - Opening another challenge while a battle is open takes you back to
     your battle instead of making a new room.
   - "Discussion" panel while you play: write to the other players of the
     room without leaving the battle. Messages go to each player's messages
     (marked with the room), so they also read them in the battle.
   ===================================================================== */
(function () {
  var KEY = "mca_btroom";

  function isRoyale() {
    return !!((typeof BT !== "undefined" ? BT : undefined) && BT.room && (BT.room.kind === "royale" || (BT.st && BT.st.kind === "royale")));
  }

  // ---- 1 · keep the room on this phone ----
  function saveRoom() {
    try {
      if ((typeof BT !== "undefined" ? BT : undefined) && BT.room && BT.room.id) localStorage.setItem(KEY, JSON.stringify({ room: BT.room, uid: ((typeof S !== "undefined" ? S : undefined) && S.uid) || "" }));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }
  function restoreRoom() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s || !s.room || !(typeof BT !== "undefined" ? BT : undefined) || BT.room) return;
      if (s.uid && (typeof S !== "undefined" ? S : undefined) && S.uid && s.uid !== S.uid) return;   // another account on this phone
      BT.room = s.room;
      if (typeof btPoll === "function") btPoll();   // reloads the same room from the server
    } catch (e) {}
  }

  // ---- 2 · do not make a second room while one is open ----
  var _rch = typeof btRoyaleCh === "function" ? btRoyaleCh : null;
  btRoyaleCh = async function (i) {
    if ((typeof BT !== "undefined" ? BT : undefined) && BT.room && BT.room.id && BT.on) {
      toast("Ta bataille est déjà ouverte. Code : " + (BT.room.code || ""), "check");
      if (typeof btClick === "function") btClick({ dataset: { ar: "bt-back" } });
      return;
    }
    return _rch ? _rch.apply(this, arguments) : undefined;
  };

  // ---- 3 · the discussion panel ----
  var panel = null;
  var open = false;

  function nameOf(uid) {
    if ((typeof S !== "undefined" ? S : undefined) && uid === S.uid) return "Vous";
    var x = ((typeof PR !== "undefined" ? PR : undefined) && PR.dir || []).find(function (d) { return d.uid === uid; });
    if (x && x.name) return x.name;
    var pl = BT.st && (BT.st.players || []).find(function (p) { return p.uid === uid; });
    return pl && pl.name ? pl.name : "Camarade";
  }

  function roomMessages() {
    var id = BT.room && BT.room.id;
    if (!id || !(typeof PR !== "undefined" ? PR : undefined)) return [];
    var seen = {}, out = [];
    (PR.inbox || []).forEach(function (m) {
      if (!m || !m.meta || m.meta.room !== id) return;
      // one copy per message (sent to several players)
      var k = m.sender + "|" + m.body + "|" + Math.floor(+new Date(m.created_at) / 2000);
      if (seen[k]) return;
      seen[k] = 1;
      out.push(m);
    });
    return out.sort(function (a, b) { return +new Date(a.created_at) - +new Date(b.created_at); });
  }

  function paintList() {
    if (!panel) return;
    var list = panel.querySelector(".zz-bcl");
    var rows = roomMessages();
    var sig = rows.map(function (m) { return m.id + ":" + m.body; }).join("|");
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    var stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    list.innerHTML = rows.length
      ? rows.map(function (m) {
          var mine = (typeof S !== "undefined" ? S : undefined) && m.sender === S.uid;
          return '<div class="zz-bcm ' + (mine ? "mine" : "") + '"><small>' + esc(nameOf(m.sender)) + '</small>' + esc(m.body) + '</div>';
        }).join("")
      : '<p class="zz-bce">Dis bonjour à tes camarades de bataille.</p>';
    if (stick || !list.dataset.once) { list.scrollTop = list.scrollHeight; list.dataset.once = "1"; }
  }

  function send(text) {
    var txt = String(text || "").trim();
    if (!txt || !BT.room) return;
    var st = BT.st || {};
    var others = (st.players || []).map(function (p) { return p.uid; }).filter(function (u) { return u && u !== S.uid; });
    if (!others.length) { toast("Pas encore d'autres joueurs dans la bataille.", "x"); return; }
    var meta = { room: BT.room.id };
    others.forEach(function (u) {
      Promise.resolve(window.__peer && __peer.send(u, txt, null, meta)).catch(function () {});
    });
    // show it at once
    if ((typeof PR !== "undefined" ? PR : undefined)) PR.inbox.unshift({ id: "tmp" + Date.now(), sender: S.uid, receiver: others[0], body: txt, meta: meta, created_at: new Date().toISOString() });
    paintList();
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "zzBc";
    panel.innerHTML =
      '<button type="button" class="zz-bct" aria-expanded="false">💬 Discussion</button>' +
      '<div class="zz-bcbox" hidden>' +
        '<div class="zz-bcl"></div>' +
        '<form class="zz-bcf"><input id="zzBci" maxlength="300" autocomplete="off" placeholder="Écris à tes camarades…" aria-label="Message de la bataille"><button type="submit">Envoyer</button></form>' +
      '</div>';
    document.body.appendChild(panel);
    panel.querySelector(".zz-bct").addEventListener("click", function () {
      open = !open;
      panel.querySelector(".zz-bcbox").hidden = !open;
      this.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) paintList();
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
    var show = isRoyale() && !!document.getElementById("arena");
    if (!show) { if (panel) panel.style.display = "none"; return; }
    ensurePanel().style.display = "";
    if (open) paintList();
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
