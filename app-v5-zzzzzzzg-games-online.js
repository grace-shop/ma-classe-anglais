/* =====================================================================
   v5 · Jeux à distance : invitation d'un camarade (Battle Royale), puis
   chaque coup (et chaque couleur choisie) est envoyé à la base
   (supabase/jeux.sql). Invitations et parties en cours : menu Jeux de
   Battle Royale.
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

  // la partie de départ, avec les couleurs de l'hôte (cols[0]) ; le second joueur choisit à l'acceptation
  function initial(game, cols) {
    if (game === "chess") return { st: ZG.chess.start(), v: 1, cols: [cols[0], cols[0] === "w" ? "b" : "w"] };
    if (game === "morris") return { st: ZG.morris.start(), v: 1, cols: [cols[0], cols[0] === 0 ? 1 : 0] };
    if (game === "ttt") return { st: ZG.ttt.start(), v: 1, cols: [0, 1] };
    var other = [0, 1, 2, 3].filter(function (c) { return c !== cols[0]; })[0];
    return { st: ZG.ludo.start(2, [cols[0], other]), v: 1, cols: [cols[0], other] };
  }
  // côté du joueur 0 de la partie (chess : blanc = 0, noir = 1)
  function hostYou(game, cols) { return game === "chess" ? (cols[0] === "b" ? 1 : 0) : 0; }

  /* ---- envoyer mes coups et mes couleurs ---- */
  window.zgPush = async function (G) {
    if (!G || !G.id || !sb()) return;
    var next = (G.v || 1) + 1;
    var r = await sb().rpc("game_play", { p_id: G.id, p_state: { st: G.st, v: next, cols: G.cols }, p_status: G.over ? "over" : "playing" });
    if (r && r.error) { note("The move could not be sent. Check the connection.", "x"); return; }
    G.v = next;
  };

  /* ---- lire les coups de l'autre joueur pendant la partie ---- */
  setInterval(async function () {
    var G = ZGUI.current && ZGUI.current();
    if (!G || G.mode !== "online" || !G.id || !sb() || G.over) return;
    try {
      var r = await sb().from("game_matches").select("*").eq("id", G.id).single();
      var row = r && r.data;
      if (!row) return;
      if (row.status === "declined") { note(G.oppName + " declined", "x"); ZGUI.close(); return; }
      if (row.state && row.state.v > G.v) ZGUI.adopt(row.state.st, row.state.v, row.state.cols);
      else if (row.status === "over" && row.state && !G.over) ZGUI.adopt(row.state.st, row.state.v, row.state.cols);
    } catch (e) {}
  }, POLL_MS);

  /* ---- en attente de la réponse à mon invitation ---- */
  function waitCard(id, game, name, cols) {
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
            ZGUI.open({ game: game, mode: "online", you: hostYou(game, row.state.cols), id: id, v: row.state.v, st: row.state.st, cols: row.state.cols, oppName: name });
            return;
          }
          if (row.status === "declined") { el.remove(); note(name + " declined the invitation", "x"); return; }
        } catch (e) {}
      }
    })();
  }

  /* ---- choisir le camarade (les couleurs sont choisies avant, dans la page de jeu) ---- */
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
      '<button class="opt" data-zgp=""><span>✕</span><span>Cancel</span></button></div>';
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
      var cols = sel.cols || (sel.game === "chess" ? ["w", "b"] : [0, 1]);
      var init = initial(sel.game, cols);
      var r = await sb().rpc("game_invite", { p_to: uid, p_kind: sel.game, p_state: init });
      if (r.error) { note(fail(r.error), "x"); return; }
      waitCard(r.data, sel.game, name, init.cols);
    }, true);
  };

  /* ---- invitations et parties en cours (menu Battle Royale) ---- */
  window.zgInboxInto = async function (box0) {
    if (!box0 || !sb()) return;
    var box = document.createElement("div");
    box.id = "zgInbox"; box.style.display = "grid"; box.style.gap = "8px";
    box0.appendChild(box);
    var r = await sb().rpc("game_list");
    if (!r || r.error || !r.data || !r.data.length) { box.remove(); return; }
    var uid = me();
    var names = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", ttt: "Tic-tac-toe" };
    function other(row) { return row.host === uid ? row.guest : row.host; }
    box.innerHTML = '<div class="zg-label" style="margin:6px 0 0">Invitations and games</div>' + r.data.map(function (g) {
      var nm = nameOf(other(g));
      if (g.status === "invited" && g.guest === uid) {
        return '<div class="opt" style="cursor:default"><span>📨</span><span>' + esc(nm) + ' invites you to ' + esc(names[g.kind]) +
          '<small><button class="zg-btn" style="min-width:0;padding:8px 14px;margin-top:6px" data-zgi="accept" data-id="' + g.id + '">Accept</button> ' +
          '<button class="zg-btn ghost" style="min-width:0;padding:8px 14px;margin-top:6px" data-zgi="decline" data-id="' + g.id + '">Decline</button></small></span></div>';
      }
      if (g.status === "invited") return '<div class="opt" style="cursor:default"><span>⏳</span><span>Waiting for ' + esc(nm) + ' · ' + esc(names[g.kind]) + '</span></div>';
      return '<button class="opt" data-zgi="resume" data-id="' + g.id + '"><span>▶</span><span>' + esc(names[g.kind]) + ' with ' + esc(nm) + '<small>Tap to open</small></span></button>';
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
        var hostCols = row.state.cols;
        var openAs = function (cols, st) {
          ZGUI.open({ game: row.kind, mode: "online", you: row.kind === "chess" ? (hostCols[0] === "b" ? 0 : 1) : 1, id: id, v: row.state.v, st: st, cols: cols, oppName: nameOf(row.host) });
          ZGUI.current().v = row.state.v;
          // mon choix part vers l'hôte avec le premier coup de la partie
          if (window.zgPush) window.zgPush(ZGUI.current());
        };
        if (row.kind === "chess") { openAs([hostCols[0], hostCols[0] === "w" ? "b" : "w"], row.state.st); return; }
        if (row.kind === "ttt") { openAs([0, 1], row.state.st); return; }
        var taken = [hostCols[0]];
        ZGUI.pickFor(row.kind, taken, function (mine) {
          var cols = [hostCols[0], mine];
          var st = row.kind === "ludo" ? ZG.ludo.start(2, cols) : row.state.st;
          openAs(cols, st);
        });
        return;
      }
      if (a === "resume") {
        var mine2 = row.host === uid ? hostYou(row.kind, row.state.cols) : 1 - hostYou(row.kind, row.state.cols);
        ZGUI.open({ game: row.kind, mode: "online", you: mine2, id: id, v: row.state.v, st: row.state.st, cols: row.state.cols, oppName: nameOf(other(row)) });
      }
    }, true);
  };
})();
