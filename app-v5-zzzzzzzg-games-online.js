/* =====================================================================
   v5 · Jeux à distance : invitation d'un camarade (Battle Royale), puis
   chaque coup est envoyé à la base (supabase/jeux.sql) et l'autre joueur
   le reçoit en quelques secondes. Les invitations et parties en cours sont
   listées dans le menu Jeux de Battle Royale.
   ===================================================================== */
(function () {
  var ZGUI = window.ZGUI;
  if (!ZGUI) return;
  var ZG = window.ZG;
  var POLL_MS = 1400;

  function sb() { return window.__sb; }
  function me() { return (typeof S !== "undefined" && S.uid) || ""; }
  function nameOf(uid) {
    var x = ((typeof PR !== "undefined" && PR.dir) || []).find(function (d) { return d.uid === uid; });
    return x ? x.name : "Classmate";
  }
  function note(msg, icon) { try { toast(msg, icon || "check"); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fail(err) {
    var m = (err && err.message) || "";
    if (/game_matches|game_invite|game_play|game_list|game_respond|schema cache|does not exist/i.test(m)) return "The games need supabase/jeux.sql to be run in Supabase once.";
    if (/classmate who accepts/i.test(m)) return "You can only play with a classmate who accepts messages.";
    return m || "Could not connect. Try again.";
  }

  // a new game for two: the state every player will see
  function initial(game) {
    if (game === "chess") return { st: ZG.chess.start(), v: 1 };
    if (game === "morris") return { st: ZG.morris.start(), v: 1 };
    return { st: ZG.ludo.start(2), v: 1 };
  }

  /* ---- sending the moves of the game on screen ---- */
  window.zgPush = async function (G) {
    if (!G || !G.id || !sb()) return;
    var next = (G.v || 1) + 1;
    var r = await sb().rpc("game_play", { p_id: G.id, p_state: { st: G.st, v: next }, p_status: G.over ? "over" : "playing" });
    if (r && r.error) { note("The move could not be sent. Check the connection.", "x"); return; }
    G.v = next;
  };

  /* ---- reading the other player's moves while a game is open ---- */
  var lastSeen = {};
  setInterval(async function () {
    var G = ZGUI.current && ZGUI.current();
    if (!G || G.mode !== "online" || !G.id || !sb() || G.over) return;
    try {
      var r = await sb().from("game_matches").select("*").eq("id", G.id).single();
      var row = r && r.data;
      if (!row) return;
      if (row.status === "over" && row.state && row.state.st) { if (!G.over) ZGUI.adopt(row.state.st, row.state.v); return; }
      if (row.status === "declined") { note(G.oppName + " declined", "x"); ZGUI.close(); return; }
      if (row.state && row.state.v > G.v) ZGUI.adopt(row.state.st, row.state.v);
    } catch (e) {}
  }, POLL_MS);

  /* ---- waiting for the answer to my invitation ---- */
  function waitCard(id, game, name) {
    var old = document.getElementById("zgwait"); if (old) old.remove();
    var el = document.createElement("div");
    el.id = "zgwait"; el.className = "zg-end";
    el.innerHTML = '<div><b>Invitation sent</b><small style="opacity:.75">Waiting for ' + esc(name) + ' to accept…</small><button class="zg-btn ghost" data-zgw="cancel">Cancel</button></div>';
    document.body.appendChild(el);
    var stop = false;
    el.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest('[data-zgw="cancel"]')) { stop = true; el.remove(); }
    });
    (async function loop() {
      while (!stop && document.getElementById("zgwait")) {
        await new Promise(function (res) { setTimeout(res, 1500); });
        if (stop || !document.getElementById("zgwait")) break;
        try {
          var r = await sb().from("game_matches").select("*").eq("id", id).single();
          var row = r && r.data;
          if (!row) continue;
          if (row.status === "playing") {
            el.remove();
            ZGUI.open({ game: game, mode: "online", you: 0, id: id, v: row.state.v, st: row.state.st, oppName: name });
            return;
          }
          if (row.status === "declined") { el.remove(); note(name + " declined the invitation", "x"); return; }
        } catch (e) {}
      }
    })();
  }

  /* ---- choosing a classmate ---- */
  window.zgOnlineStart = function (sel) {
    var friends = ((typeof PR !== "undefined" && PR.dir) || []).filter(function (x) {
      return typeof frState === "function" ? frState(x.uid) === "friends" : true;
    });
    var old = document.getElementById("zgpick"); if (old) old.remove();
    var el = document.createElement("div");
    el.id = "zgpick"; el.className = "zg-menu";
    el.innerHTML = '<div class="sheet"><h3>Invite a classmate</h3>' +
      (friends.length ? friends.map(function (f) {
        return '<button class="opt" data-zgp="' + esc(f.uid) + '" data-n="' + esc(f.name) + '"><span>👤</span><span>' + esc(f.name) + '</span></button>';
      }).join("") : '<p class="small" style="opacity:.8">Add a classmate as a friend first.</p>') +
      '<button class="opt" data-zgp="" ><span>✕</span><span>Cancel</span></button></div>';
    document.body.appendChild(el);
    el.addEventListener("click", async function (e) {
      var b = e.target.closest && e.target.closest("[data-zgp]");
      if (!b) { if (e.target === el) el.remove(); return; }
      e.preventDefault(); e.stopPropagation();
      var uid = b.getAttribute("data-zgp");
      if (!uid) { el.remove(); return; }
      var name = b.getAttribute("data-n") || "Classmate";
      el.remove();
      if (!sb()) { note("Connect to play remotely.", "x"); return; }
      var init = initial(sel.game);
      var r = await sb().rpc("game_invite", { p_to: uid, p_kind: sel.game, p_state: init });
      if (r.error) { note(fail(r.error), "x"); return; }
      waitCard(r.data, sel.game, name);
    }, true);
  };

  /* ---- invitations and games in progress (in the Battle Royale games menu) ---- */
  window.zgInboxInto = async function (sheet) {
    if (!sheet || !sb()) return;
    var box = document.createElement("div");
    box.id = "zgInbox"; box.style.display = "grid"; box.style.gap = "8px";
    sheet.insertBefore(box, sheet.lastElementChild);
    var r = await sb().rpc("game_list");
    if (!r || r.error || !r.data || !r.data.length) { box.remove(); return; }
    var uid = me();
    var names = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris" };
    box.innerHTML = '<h3 style="margin:6px 0 0;font-size:.95rem">Invitations and games</h3>' + r.data.map(function (g) {
      var other = g.host === uid ? g.guest : g.host, nm = nameOf(other);
      if (g.status === "invited" && g.guest === uid) {
        return '<div class="opt" style="cursor:default"><span>📨</span><span>' + esc(nm) + ' invites you to ' + esc(names[g.kind]) +
          '<small><button class="zg-btn" style="min-width:0;padding:8px 14px;margin-top:6px" data-zgi="accept" data-id="' + g.id + '">Accept</button> ' +
          '<button class="zg-btn ghost" style="min-width:0;padding:8px 14px;margin-top:6px" data-zgi="decline" data-id="' + g.id + '">Decline</button></small></span></div>';
      }
      if (g.status === "invited") {
        return '<div class="opt" style="cursor:default"><span>⏳</span><span>Waiting for ' + esc(nm) + ' · ' + esc(names[g.kind]) + '</span></div>';
      }
      return '<button class="opt" data-zgi="resume" data-id="' + g.id + '"><span>▶</span><span>' + esc(names[g.kind]) + ' with ' + esc(nm) + '<small>Your turn when the badge says so · tap to open</small></span></button>';
    }).join("");
    box.addEventListener("click", async function (e) {
      var b = e.target.closest && e.target.closest("[data-zgi]");
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var a = b.getAttribute("data-zgi"), id = b.getAttribute("data-id");
      var row = r.data.filter(function (g) { return g.id === id; })[0];
      if (!row) return;
      if (a === "decline") { var d = await sb().rpc("game_respond", { p_id: id, p_accept: false }); if (d.error) note(fail(d.error), "x"); else { note("Declined", "x"); box.remove(); } return; }
      if (a === "accept") {
        var ac = await sb().rpc("game_respond", { p_id: id, p_accept: true });
        if (ac.error) { note(fail(ac.error), "x"); return; }
        var sheetEl = document.getElementById("zgmenu"); if (sheetEl) sheetEl.remove();
        ZGUI.open({ game: row.kind, mode: "online", you: 1, id: id, v: row.state.v, st: row.state.st, oppName: nameOf(row.host) });
        return;
      }
      if (a === "resume") {
        var sheetEl2 = document.getElementById("zgmenu"); if (sheetEl2) sheetEl2.remove();
        var mine = row.host === uid ? 0 : 1;
        ZGUI.open({ game: row.kind, mode: "online", you: mine, id: id, v: row.state.v, st: row.state.st, oppName: nameOf(other(row, uid)) });
      }
    }, true);
    function other(row, u) { return row.host === u ? row.guest : row.host; }
  };
})();
