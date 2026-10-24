/* =====================================================================
   v5 · Jeux : l'écran des jeux (échecs, ludo, moulin à 3 pions).
   · Contre l'IA (hors ligne, dans l'Arena) · à deux sur cet appareil (hors ligne).
   · À distance par invitation : voir le menu Battle Royale (game sessions).
   Les règles et l'IA sont dans app-v5-zzzzzzze-game-engines.js.
   ===================================================================== */
(function () {
  var ZG = window.ZG;
  var G = null;               // the game being played
  var TIMER = 0;

  var PIECES = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  var NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris" };
  var DIFF = { easy: { chess: 1, morris: 1 }, medium: { chess: 2, morris: 3 }, hard: { chess: 3, morris: 5 } };
  var LUDO_COL = { red: "#F87171", green: "#4ADE80", yellow: "#FACC15", blue: "#60A5FA" };

  /* ---- the screen ---- */
  function css() {
    if (document.getElementById("zgcss")) return;
    var st = document.createElement("style");
    st.id = "zgcss";
    st.textContent = `
#zgame{position:fixed;inset:0;z-index:10070;background:#0B0D12;color:#fff;display:flex;flex-direction:column;font:600 15px system-ui,sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}
.zg-top{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 8px}
.zg-top b{flex:1;font-size:1.05rem}
.zg-x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer}
.zg-status{margin:4px 14px 10px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.08);text-align:center;font-weight:700}
.zg-body{display:flex;flex-direction:column;align-items:center;gap:12px;padding:0 10px 24px}
.zg-chess{display:grid;grid-template-columns:repeat(8,1fr);width:min(96vw,420px);aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid rgba(255,255,255,.15)}
.zg-chess button{border:0;padding:0;margin:0;font-size:clamp(22px,7vw,34px);line-height:1;display:grid;place-items:center;cursor:pointer;color:#111;aspect-ratio:1}
.zg-chess button.l{background:#EDE3CF}.zg-chess button.d{background:#A77F5A}
.zg-chess button.pc-w{color:#fff;text-shadow:0 0 3px #000,0 0 3px #000,0 1px 0 #000}
.zg-chess button.pc-b{color:#111;text-shadow:0 0 2px rgba(255,255,255,.35)}
.zg-chess button.sel{box-shadow:inset 0 0 0 4px #A78BFA}
.zg-chess button.to::after{content:"";width:28%;height:28%;border-radius:50%;background:rgba(124,58,237,.55)}
.zg-chess button.to.cap{box-shadow:inset 0 0 0 4px rgba(239,68,68,.7)}
.zg-chess button.last{background-image:linear-gradient(rgba(250,204,21,.35),rgba(250,204,21,.35))}
.zg-mo{position:relative;width:min(86vw,340px);aspect-ratio:1}
.zg-mo svg{position:absolute;inset:0;width:100%;height:100%}
.zg-mo button{position:absolute;width:24%;height:24%;margin:-12%;border-radius:50%;border:0;background:rgba(255,255,255,.08);cursor:pointer;display:grid;place-items:center;font-size:34px}
.zg-mo button.pw{background:#F8FAFC;color:#111;box-shadow:0 4px 0 #94A3B8}
.zg-mo button.pb{background:#7C3AED;color:#fff;box-shadow:0 4px 0 #4C1D95}
.zg-mo button.sel{outline:3px solid #FACC15}
.zg-mo button.to{outline:3px dashed #A78BFA}
.zg-mo button.rem{outline:3px solid #EF4444}
.zg-hand{display:flex;gap:18px;font-size:14px;opacity:.9}
.zg-ludo{display:grid;grid-template-columns:repeat(15,1fr);grid-template-rows:repeat(15,1fr);width:min(96vw,460px);aspect-ratio:1;background:#111827;border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,.15);position:relative}
.zg-ludo .c{position:absolute;inset:0;border:0.5px solid rgba(255,255,255,.08);background:#1F2937}
.zg-ludo .c.t{background:#E5E7EB}
.zg-ludo .c.h{background:var(--hc)}
.zg-ludo .c.b{background:var(--bc)}
.zg-ludo .c.safe::before{content:"★";position:absolute;inset:0;display:grid;place-items:center;font-size:10px;color:#6B7280}
.zg-ludo .c.fin{background:#FFFFFF}
.zg-ludo .tok{position:absolute;inset:8%;border-radius:50%;border:2px solid #111;background:var(--tc);cursor:pointer;z-index:2;box-shadow:0 2px 0 rgba(0,0,0,.4)}
.zg-ludo .tok.go{outline:3px solid #fff}
.zg-ludo .tok.stack{inset:2%}
.zg-players{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.zg-pl{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13px}
.zg-pl i{width:12px;height:12px;border-radius:50%;display:inline-block}
.zg-pl.on{outline:2px solid #FACC15}
.zg-btn{padding:14px 20px;border-radius:16px;border:0;background:#A78BFA;color:#0B0D12;font:800 16px system-ui,sans-serif;cursor:pointer;min-width:180px}
.zg-btn.ghost{background:rgba(255,255,255,.12);color:#fff}
.zg-dice{width:56px;height:56px;border-radius:14px;background:#fff;color:#111;display:grid;place-items:center;font-size:30px;font-weight:900}
.zg-info{font-size:13px;opacity:.8;text-align:center;max-width:460px;padding:0 10px}
.zg-end{position:fixed;inset:0;z-index:10080;background:rgba(0,0,0,.6);display:grid;place-items:center}
.zg-end div{background:#16181F;border-radius:20px;padding:22px;width:min(88vw,340px);text-align:center;display:grid;gap:12px}
.zg-menu{position:fixed;inset:0;z-index:10075;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.zg-menu .sheet{background:#16181F;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));width:100%;max-width:520px;display:grid;gap:10px;max-height:86vh;overflow:auto}
.zg-menu h3{margin:0 0 4px;font-size:1.1rem}
.zg-menu .opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:0;color:#fff;text-align:left;font:700 15px system-ui,sans-serif;cursor:pointer}
.zg-menu .opt small{display:block;font-weight:500;opacity:.7;font-size:12px;margin-top:2px}
.zg-menu .seg{display:flex;gap:6px}
.zg-menu .seg button{flex:1;padding:10px;border-radius:12px;border:0;background:rgba(255,255,255,.08);color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer}
.zg-menu .seg button.on{background:#A78BFA;color:#0B0D12}
`;
    document.head.appendChild(st);
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function host() {
    var h = document.getElementById("zgame");
    if (!h) { h = document.createElement("div"); h.id = "zgame"; document.body.appendChild(h); }
    return h;
  }
  function close() {
    clearTimeout(TIMER); TIMER = 0;
    var h = document.getElementById("zgame"); if (h) h.remove();
    var e = document.getElementById("zgend"); if (e) e.remove();
    G = null;
  }

  /* ---- starting a game ---- */
  // opts: { game, mode: "ai"|"local", players (ludo: 2..4), diff, you }
  function open(opts) {
    css();
    G = { game: opts.game, mode: opts.mode, diff: opts.diff || "medium", you: opts.you == null ? 0 : opts.you, sel: null, busy: false, over: false,
      id: opts.id || null, v: opts.v || 1, oppName: opts.oppName || "Classmate" };
    if (opts.st) G.st = opts.st;
    else if (opts.game === "chess") G.st = ZG.chess.start();
    else if (opts.game === "morris") G.st = ZG.morris.start();
    else if (opts.game === "ludo") { G.n = opts.players || 2; G.st = ZG.ludo.start(G.n); }
    if (opts.game === "ludo" && !G.n) G.n = G.st.n;
    G.started = Date.now();
    paint();
    schedule();
  }

  // whose turn it is, as a side index (0 = first player, white, player 1)
  function sideOfTurn() {
    if (G.game === "chess") return G.st.turn === "w" ? 0 : 1;
    if (G.game === "morris") return G.st.turn - 1;
    return G.st.turn;
  }
  function isMyTurn() {
    if (G.mode === "online") return sideOfTurn() === G.you;
    return !isAiTurn();
  }
  function isAiTurn() {
    if (G.mode !== "ai") return false;
    if (G.game === "chess") return G.st.turn !== (G.you === 0 ? "w" : "b");
    if (G.game === "morris") return G.st.turn !== (G.you === 0 ? 1 : 2);
    return G.st.turn !== G.you;
  }

  function schedule() {
    clearTimeout(TIMER); TIMER = 0;
    if (!G || G.over) return;
    if (isAiTurn()) { TIMER = setTimeout(aiMove, 420); }
  }

  function aiMove() {
    TIMER = 0;
    if (!G || G.over) return;
    var d = DIFF[G.diff] || DIFF.medium;
    if (G.game === "chess") {
      var m = ZG.chess.best(G.st, d.chess);
      if (m) G.st = ZG.chess.make(G.st, m);
    } else if (G.game === "morris") {
      var mm = ZG.morris.best(G.st, d.morris);
      if (mm) G.st = ZG.morris.apply(G.st, mm);
    } else if (G.game === "ludo") {
      if (!G.st.dice) { G.st = ZG.ludo.roll(G.st, ZG.ludo.rollDice()); paint(); TIMER = setTimeout(aiMove, 650); return; }
      var lm = ZG.ludo.pick(G.st);
      if (!lm) { G.st = ZG.ludo.pass(G.st); afterMove(); return; }
      G.st = ZG.ludo.apply(G.st, lm);
      afterMove();
      return;
    }
    afterMove();
  }

  function afterMove() {
    G.sel = null;
    var end = endInfo();
    if (end) { G.over = true; sendMove(); paint(); showEnd(end); return; }
    sendMove(); paint(); schedule();
  }
  // online games: the new state goes to the other player
  function sendMove() { if (G && G.mode === "online" && window.zgPush) window.zgPush(G); }
  // the other player's move arrived
  function adopt(st, v) {
    if (!G) return;
    G.st = st; G.v = v; G.sel = null;
    var end = endInfo();
    if (end) { G.over = true; paint(); showEnd(end); return; }
    paint();
  }

  /* ---- results ---- */
  function endInfo() {
    if (G.game === "chess") {
      var s = ZG.chess.status(G.st);
      if (s === "play") return null;
      if (s === "mate") { var loser = G.st.turn; return { winner: loser === "w" ? 1 : 0, text: "Checkmate" }; }
      return { winner: -1, text: s === "stale" ? "Stalemate: a draw" : "Draw: 50 moves" };
    }
    if (G.game === "morris") {
      if (!G.st.winner) return null;
      return { winner: G.st.winner === 1 ? 0 : 1, text: "Three in the mill or no more moves" };
    }
    if (G.game === "ludo") {
      if (G.st.winner < 0) return null;
      return { winner: G.st.winner, text: "All four tokens home" };
    }
    return null;
  }
  function whoName(i) {
    if (G.mode === "ai") return i === G.you ? "You" : "The computer";
    return "Player " + (i + 1);
  }
  function showEnd(end) {
    var old = document.getElementById("zgend"); if (old) old.remove();
    var w = end.winner, msg;
    if (w < 0) msg = "Draw";
    else if (G.mode === "ai") msg = w === G.you ? "You win!" : "The computer wins";
    else if (G.mode === "online") msg = w === G.you ? "You win!" : G.oppName + " wins";
    else msg = whoName(w) + " wins!";
    var el = document.createElement("div");
    el.id = "zgend"; el.className = "zg-end";
    el.innerHTML = '<div><b style="font-size:1.2rem">' + esc(msg) + '</b><small style="opacity:.75">' + esc(end.text) + '</small>' +
      (G.mode === "online" ? '' : '<button class="zg-btn" data-zg="again">Play again</button>') + '<button class="zg-btn ghost" data-zg="close2">Close</button></div>';
    document.body.appendChild(el);
  }

  /* ---- drawing ---- */
  function paint() {
    if (!G) return;
    var h = host();
    var status = statusText();
    var body = G.game === "chess" ? chessHTML() : G.game === "morris" ? morrisHTML() : ludoHTML();
    var sub = G.mode === "ai" ? "vs computer · " + esc(G.diff) : G.mode === "online" ? "vs " + esc(G.oppName) + " · online" : "2 players · this phone";
    h.innerHTML = '<div class="zg-top"><button class="zg-x" data-zg="close" aria-label="Close">×</button><b>' + esc(NAMES[G.game]) + '</b>' +
      '<span style="font-size:12px;opacity:.7">' + sub + '</span></div>' +
      '<div class="zg-status">' + esc(status) + '</div><div class="zg-body">' + body + '</div>';
  }

  function statusText() {
    if (G.over) return "Game over";
    if (G.mode === "online" && !isMyTurn()) return "Waiting for " + G.oppName + "…";
    if (G.game === "chess") {
      var t = G.st.turn === "w" ? "White" : "Black";
      if (ZG.chess.inCheck(G.st, G.st.turn)) return t + " is in check";
      return (isAiTurn() ? "The computer is thinking…" : t + " to play");
    }
    if (G.game === "morris") {
      var p = G.st.turn;
      if (G.st.pending) return (isAiTurn() ? "The computer takes a piece" : "Mill! Tap a piece to take");
      if (isAiTurn()) return "The computer is thinking…";
      if (G.st.hand[p - 1] > 0) return "Place a piece (" + G.st.hand[p - 1] + " left)";
      return "Move a piece" + (G.sel != null ? " — tap where it goes" : "");
    }
    if (isAiTurn()) return "The computer is playing…";
    if (G.st.dice) return "Player " + (G.st.turn + 1) + ": choose a token";
    return "Player " + (G.st.turn + 1) + ": roll the dice";
  }

  /* chess */
  function chessHTML() {
    var st = G.st, legal = ZG.chess.legal(st), human = !isAiTurn();
    var targets = G.sel != null ? legal.filter(function (m) { return m.f === G.sel; }) : [];
    var last = G.last || null;
    var rows = "";
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var i = r * 8 + c, p = st.b[i], cls = ((r + c) % 2 ? "d" : "l");
      var tg = targets.filter(function (m) { return m.t === i; });
      if (i === G.sel) cls += " sel";
      if (tg.length) cls += " to" + (tg[0].c ? " cap" : "");
      if (last && (last.f === i || last.t === i)) cls += " last";
      if (p) cls += ZG.chess.white(p) ? " pc-w" : " pc-b";
      rows += '<button class="' + cls + '" data-zgsq="' + i + '" aria-label="square ' + i + '">' + (p ? PIECES[p] : "") + '</button>';
    }
    return '<div class="zg-chess" style="' + (human ? "" : "opacity:.85") + '">' + rows + '</div>' +
      '<div class="zg-info">Tap a piece, then tap where it goes. Castling, en passant and promotion (to a queen) are included.</div>' +
      '<button class="zg-btn ghost" data-zg="again">New game</button>';
  }

  /* morris */
  function morrisPoint(i) { return { x: 15 + (i % 3) * 35, y: 15 + Math.floor(i / 3) * 35 }; }
  function morrisHTML() {
    var st = G.st, human = !isAiTurn(), mv = ZG.morris.moves(st);
    var lines = ZG.morris.LINES.map(function (L) {
      var a = morrisPoint(L[0]), b = morrisPoint(L[2]);
      return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="rgba(255,255,255,.35)" stroke-width="1.6"/>';
    }).join("");
    var svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>';
    var pts = "";
    for (var i = 0; i < 9; i++) {
      var p = morrisPoint(i), v = st.b[i], cls = "";
      if (v === 1) cls += " pw"; else if (v === 2) cls += " pb";
      if (G.sel === i) cls += " sel";
      if (human) {
        if (st.pending) { if (mv.some(function (m) { return m.rem === i; })) cls += " rem"; }
        else if (G.sel != null && mv.some(function (m) { return m.from === G.sel && m.to === i; })) cls += " to";
      }
      pts += '<button class="' + cls + '" style="left:' + p.x + '%;top:' + p.y + '%" data-zgsq="' + i + '" aria-label="point ' + i + '">' + (v ? "●" : "") + '</button>';
    }
    var hand = '<div class="zg-hand"><span>You: ' + st.hand[0] + ' to place</span><span>Computer: ' + st.hand[1] + ' to place</span></div>';
    return '<div class="zg-mo">' + svg + pts + '</div>' + hand +
      '<div class="zg-info">Place your pieces, then slide them along a line. Three in a line is a mill: take one of the other side\'s pieces. With three pieces you can fly to any empty point.</div>' +
      '<button class="zg-btn ghost" data-zg="again">New game</button>';
  }

  /* ludo */
  var LUDO_TRACK = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
  var LUDO_HOME = [[7,1],[7,2],[7,3],[7,4],[7,5]], LUDO_HOME_COL = [[1,7],[2,7],[3,7],[4,7],[5,7]], LUDO_HOME_R = [[7,13],[7,12],[7,11],[7,10],[7,9]], LUDO_HOME_B = [[13,7],[12,7],[11,7],[10,7],[9,7]];
  var LUDO_HOMES = [LUDO_HOME, LUDO_HOME_COL, LUDO_HOME_R, LUDO_HOME_B];
  var LUDO_BASE = [[[2,2],[2,3],[3,2],[3,3]], [[2,11],[2,12],[3,11],[3,12]], [[11,11],[11,12],[12,11],[12,12]], [[11,2],[11,3],[12,2],[12,3]]];
  var LUDO_COLOURS = ["red", "green", "yellow", "blue"];
  var LUDO_SAFE = {}; [0, 13, 26, 39].forEach(function (g) { LUDO_SAFE[g] = 1; });
  function ludoCell(k, p) { return p < 0 ? null : p <= 50 ? LUDO_TRACK[(k * 13 + p) % 52] : LUDO_HOMES[k][p - 51] || null; }
  function ludoHTML() {
    var st = G.st, n = G.n, human = !isAiTurn();
    var moves = st.dice ? ZG.ludo.moves(st, st.dice) : [];
    var grid = {};
    function put(r, c, extra) { grid[r + "," + c] = (grid[r + "," + c] || "") + extra; }
    LUDO_TRACK.forEach(function (rc, g) { put(rc[0], rc[1], '<div class="c t' + (LUDO_SAFE[g] ? " safe" : "") + '"></div>'); });
    for (var k = 0; k < 4; k++) LUDO_HOMES[k].forEach(function (rc) { put(rc[0], rc[1], '<div class="c h" style="--hc:' + LUDO_COL[LUDO_COLOURS[k]] + '"></div>'); });
    for (var b = 0; b < 4; b++) LUDO_BASE[b].forEach(function (rc) { put(rc[0], rc[1], '<div class="c b" style="--bc:' + LUDO_COL[LUDO_COLOURS[b]] + '"></div>'); });
    put(7, 7, '<div class="c fin"></div>');
    // tokens
    for (var pl = 0; pl < n; pl++) for (var t = 0; t < 4; t++) {
      var p = st.tok[pl][t], rc = p < 0 ? LUDO_BASE[pl][t] : ludoCell(pl, p);
      if (!rc) continue;
      var can = human && st.turn === pl && st.dice && moves.some(function (m) { return m.t === t; });
      put(rc[0], rc[1], '<div class="tok' + (can ? " go" : "") + '" style="--tc:' + LUDO_COL[LUDO_COLOURS[pl]] + '" ' + (can ? 'data-zgtok="' + t + '"' : "") + '></div>');
    }
    var cells = "";
    for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) cells += '<div style="position:relative;grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + '">' + (grid[r + "," + c] || "") + '</div>';
    var board = '<div class="zg-ludo">' + cells + '</div>';
    var players = '<div class="zg-players">' + LUDO_COLOURS.slice(0, n).map(function (cl, i) {
      var home = st.tok[i].filter(function (x) { return x === 56; }).length;
      return '<span class="zg-pl' + (st.turn === i && !G.over ? " on" : "") + '"><i style="background:' + LUD_COL(cl) + '"></i>' + (G.mode === "ai" ? (i === G.you ? "You" : "Computer") : "Player " + (i + 1)) + ' · ' + home + '/4</span>';
    }).join("") + '</div>';
    var dice = st.dice ? '<div class="zg-dice">' + st.dice + '</div>' : '<div class="zg-dice" style="opacity:.25">?</div>';
    var action;
    if (human && !st.dice) action = '<button class="zg-btn" data-zg="roll">Roll the dice</button>';
    else if (human && st.dice && !moves.length) action = '<button class="zg-btn" data-zg="pass">No move — pass</button>';
    else action = '<div class="zg-info">' + (isAiTurn() ? "" : "Tap a glowing token to move it.") + '</div>';
    return board + '<div class="zg-row" style="display:flex;gap:14px;align-items:center">' + dice + action + '</div>' + players +
      '<div class="zg-info">Roll a six to bring a token out. Land on an opponent to send it back. A six gives another turn. The start squares are safe.</div>' +
      '<button class="zg-btn ghost" data-zg="again">New game</button>';
  }
  function LUD_COL(c) { return LUDO_COL[c]; }

  /* ---- what a tap does ---- */
  function humanTurn() { return G && !G.over && isMyTurn() && !G.busy; }

  function chessTap(sq) {
    var st = G.st, legal = ZG.chess.legal(st);
    var p = st.b[sq], mine = p && (ZG.chess.white(p) ? "w" : "b") === st.turn;
    if (G.sel != null) {
      var m = legal.filter(function (x) { return x.f === G.sel && x.t === sq; })[0];
      if (m) { G.last = { f: m.f, t: m.t }; G.st = ZG.chess.make(st, m); G.sel = null; afterMove(); return; }
    }
    G.sel = mine ? sq : null;
    paint();
  }
  function morrisTap(i) {
    var st = G.st, mv = ZG.morris.moves(st);
    if (st.pending) {
      var r = mv.filter(function (m) { return m.rem === i; })[0];
      if (r) { G.st = ZG.morris.apply(st, r); afterMove(); }
      return;
    }
    if (st.hand[st.turn - 1] > 0) {
      var pl = mv.filter(function (m) { return m.to === i; })[0];
      if (pl) { G.st = ZG.morris.apply(st, pl); afterMove(); }
      return;
    }
    if (G.sel != null) {
      var mo = mv.filter(function (m) { return m.from === G.sel && m.to === i; })[0];
      if (mo) { G.st = ZG.morris.apply(st, mo); G.sel = null; afterMove(); return; }
    }
    G.sel = st.b[i] === st.turn ? i : null;
    paint();
  }
  function ludoRoll() {
    if (!humanTurn() || G.st.dice) return;
    G.st = ZG.ludo.roll(G.st, ZG.ludo.rollDice());
    sendMove();
    ludoAfterRoll();
  }
  function ludoAfterRoll() {
    var moves = ZG.ludo.moves(G.st, G.st.dice);
    if (!moves.length) { setTimeout(function () { if (G && !G.over && G.st.dice && !ZG.ludo.moves(G.st, G.st.dice).length) { G.st = ZG.ludo.pass(G.st); afterMove(); } }, 900); }
    else if (moves.length === 1) { setTimeout(function () { if (G && !G.over && G.st.dice && humanTurn()) ludoPlay(moves[0].t); }, 450); }
    paint();
    schedule();
  }
  function ludoPlay(t) {
    var st = G.st, mv = ZG.ludo.moves(st, st.dice).filter(function (m) { return m.t === t; })[0];
    if (!mv) return;
    G.st = ZG.ludo.apply(st, mv);
    afterMove();
  }

  /* ---- events ---- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest("[data-zg]");
    if (b && G) {
      e.preventDefault(); e.stopPropagation();
      var a = b.getAttribute("data-zg");
      if (a === "close" || a === "close2") { close(); return; }
      if (a === "again" && G.mode === "online") { close(); return; }
      if (a === "again") { var keep = { game: G.game, mode: G.mode, diff: G.diff, you: G.you, players: G.n }; close(); open(keep); return; }
      if (a === "roll") { ludoRoll(); return; }
      if (a === "pass") { G.st = ZG.ludo.pass(G.st); afterMove(); return; }
      return;
    }
    var sq = t.closest && t.closest("[data-zgsq]");
    if (sq && G && humanTurn()) {
      e.preventDefault(); e.stopPropagation();
      var i = +sq.getAttribute("data-zgsq");
      if (G.game === "chess") chessTap(i); else if (G.game === "morris") morrisTap(i);
      return;
    }
    var tk = t.closest && t.closest("[data-zgtok]");
    if (tk && G && humanTurn()) { e.preventDefault(); e.stopPropagation(); ludoPlay(+tk.getAttribute("data-zgtok")); }
  }, true);

  /* ---- the menu: which game, which mode, which difficulty ---- */
  function menu(place) {
    css();
    var old = document.getElementById("zgmenu"); if (old) old.remove();
    var m = document.createElement("div");
    m.id = "zgmenu"; m.className = "zg-menu";
    var sel = { game: "chess", mode: "ai", diff: "medium", players: 2 };
    var canOnline = place === "battle";
    function html() {
      return '<div class="sheet"><h3>Games · ' + (place === "battle" ? "Battle Royale" : "Arena") + '</h3>' +
        '<div class="seg">' + [["chess", "Chess"], ["ludo", "Ludo"], ["morris", "Three men\'s morris"]].map(function (g) {
          return '<button class="' + (sel.game === g[0] ? "on" : "") + '" data-zgm="game" data-v="' + g[0] + '">' + g[1] + '</button>';
        }).join("") + '</div>' +
        (sel.game === "ludo" ? '<div class="seg">' + [2, 3, 4].map(function (n) { return '<button class="' + (sel.players === n ? "on" : "") + '" data-zgm="players" data-v="' + n + '">' + n + ' players</button>'; }).join("") + '</div>' : "") +
        '<div class="seg">' + [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(function (d) {
          return '<button class="' + (sel.diff === d[0] ? "on" : "") + '" data-zgm="diff" data-v="' + d[0] + '">' + d[1] + '</button>';
        }).join("") + '</div>' +
        '<button class="opt" data-zgm="start" data-mode="ai"><span>🤖</span><span>Play against the computer<small>Works offline · the computer searches the best moves</small></span></button>' +
        '<button class="opt" data-zgm="start" data-mode="local"><span>👥</span><span>Two players on this phone<small>Works offline · pass the phone</small></span></button>' +
        (canOnline ? '<button class="opt" data-zgm="online"><span>✉️</span><span>Play a classmate remotely<small>Send an invitation · they accept in Battle Royale</small></span></button>' : "") +
        '<button class="opt" data-zgm="cancel"><span>✕</span><span>Cancel</span></button></div>';
    }
    function paintMenu() { m.innerHTML = html(); if (canOnline && window.zgInboxInto) window.zgInboxInto(m.querySelector(".sheet")); }
    paintMenu();
    document.body.appendChild(m);
    m.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-zgm]");
      if (!b) { if (e.target === m) m.remove(); return; }
      e.preventDefault(); e.stopPropagation();
      var a = b.getAttribute("data-zgm");
      if (a === "game") sel.game = b.getAttribute("data-v");
      else if (a === "diff") sel.diff = b.getAttribute("data-v");
      else if (a === "players") sel.players = +b.getAttribute("data-v");
      else if (a === "cancel") { m.remove(); return; }
      else if (a === "start") { m.remove(); open({ game: sel.game, mode: b.getAttribute("data-mode"), diff: sel.diff, players: sel.players }); return; }
      else if (a === "online") { m.remove(); if (window.zgOnlineStart) window.zgOnlineStart(sel); else toast("Online games are not ready yet.", "x"); return; }
      paintMenu();
    }, true);
  }

  // the Arena and Battle Royale entries
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('[data-ar="games"],[data-ar="games-battle"]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    menu(b.getAttribute("data-ar") === "games-battle" ? "battle" : "arena");
  }, true);

  window.ZGUI = { open: open, menu: menu, close: close, adopt: adopt, current: function () { return G; } };
})();
