/* =====================================================================
   v5 · Jeux : pages plein écran (portrait).
   Hub (4 jeux) -> réglages -> choix de la couleur -> partie.
   Échecs et moulin : plateau en bois, pièces 3D. Ludo : plateau classique,
   pions 3D, un dé 3D par joueur (l'IA aussi). Morpion : tableau à la craie.
   Sons synthétisés (aucun fichier audio). Captures affichées à côté des joueurs.
   Fin de partie : feux d'artifice et trophée pour le gagnant.
   Les règles et l'IA : app-v5-zzzzzzze-game-engines.js.
   Le jeu à distance : app-v5-zzzzzzzg-games-online.js.
   ===================================================================== */
(function () {
  var ZG = window.ZG;
  var G = null;               // partie en cours
  var PLACE = null;           // "arena" | "battle"
  var SEL = { game: "chess", diff: "medium", players: 2 };
  var TIMER = 0;
  var PICKCB = null, PICKBACK = null;

  var NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", ttt: "Tic-tac-toe" };
  var GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
  // pièces en SVG (style Staunton) : la couleur vient du CSS (.w clair / .b foncé)
  // pièces classiques (silhouettes Staunton) sur 45 x 45 ; la couleur vient du CSS (.w / .b)
  var BASE = '<rect class="pb" x="7" y="36" width="31" height="4" rx="1.5"/><rect class="pb" x="5" y="40" width="35" height="3" rx="1.5"/>';
  var CHESS_SHAPES = {
    K: '<path d="M16.5 33 C16.5 27 14.5 24 15.5 21 L29.5 21 C30.5 24 28.5 27 28.5 33 Z"/><rect x="15" y="19" width="15" height="3" rx="1.5"/><path d="M16.5 19 C16.5 13.5 19 11.5 22.5 11 C26 11.5 28.5 13.5 28.5 19 Z"/><rect x="21" y="3" width="3" height="7" rx=".6"/><rect x="18.5" y="5" width="8" height="2.4" rx=".6"/>',
    Q: '<path d="M14 34 C15 27 16.5 23 16.5 20 L28.5 20 C28.5 23 30 27 31 34 Z"/><rect x="14.5" y="18" width="16" height="3" rx="1.5"/><path d="M14.5 18 L10 9 L15.5 13 L17.5 6 L22.5 11.5 L27.5 6 L29.5 13 L35 9 L30.5 18 Z"/><circle cx="10" cy="8.2" r="2"/><circle cx="17.5" cy="5.2" r="2"/><circle cx="22.5" cy="9.5" r="2.1"/><circle cx="27.5" cy="5.2" r="2"/><circle cx="35" cy="8.2" r="2"/>',
    B: '<path d="M12.5 34 C14 28 16.5 25 17.5 21.5 L27.5 21.5 C28.5 25 31 28 32.5 34 Z"/><rect x="15.5" y="19.5" width="14" height="3" rx="1.5"/><path d="M22.5 4 C28 8.5 28.5 13 25 17.5 L20 17.5 C16.5 13 17 8.5 22.5 4 Z"/><circle cx="22.5" cy="3" r="1.6"/><path class="slit" d="M20.8 12.5 L24.4 8.6" />',
    R: '<path d="M14.5 33 L13.5 17 L31.5 17 L30.5 33 Z"/><rect x="12" y="14" width="21" height="3.6" rx="1.2"/><path d="M12 14 L12 6.5 L16.5 6.5 L16.5 10 L20.5 10 L20.5 6.5 L24.5 6.5 L24.5 10 L28.5 10 L28.5 6.5 L33 6.5 L33 14 Z"/>',
    N: '<path d="M11 35 C11 31 12.6 27.6 13.4 24.6 C12.2 23.6 9.2 22.6 7.6 20.6 C6.2 18.8 5.4 16.6 5.8 14.4 C6.2 12.6 7.8 11.2 9.6 10.6 L11.2 3.4 C12.8 4.4 14.2 5.6 15.4 7.4 C23 7.4 31.6 11.8 35 21.4 C37.4 28 38.6 32 39.4 35.6 L11 35 Z"/><circle class="eye" cx="11.6" cy="15.2" r="1.3"/><path class="slit" d="M24 14 C28 17.6 30.6 21.6 31.4 26.4" fill="none"/>',
    P: '<circle cx="22.5" cy="13.5" r="5.2"/><rect x="16.5" y="19" width="12" height="3" rx="1.5"/><path d="M16 33 C16 27 18.5 23.5 19.5 22 L25.5 22 C26.5 23.5 29 27 29 33 Z"/>'
  };
  function chessPieceSVG(letter, white) {
    var k = letter.toUpperCase();
    return '<svg viewBox="0 0 45 45" aria-hidden="true">' + (CHESS_SHAPES[k] || '') + BASE + '</svg>';
  }
  var DIFF = { easy: { chess: 1, morris: 1, ttt: 0 }, medium: { chess: 2, morris: 3, ttt: 1 }, hard: { chess: 3, morris: 5, ttt: 2 } };
  // couleurs de pions choisissables
  var CORNER = [
    { id: 0, name: "Red", hex: "#E5303A", dark: "#8E1219" },
    { id: 1, name: "Green", hex: "#1FB35B", dark: "#0C6B33" },
    { id: 2, name: "Yellow", hex: "#F5C518", dark: "#9A7400" },
    { id: 3, name: "Blue", hex: "#1E88E5", dark: "#0B4F95" }
  ];
  var DISC = [
    { id: 0, name: "White", hex: "#f6f6f6", dark: "#8f8f8f" },
    { id: 1, name: "Black", hex: "#262626", dark: "#000" },
    { id: 2, name: "Red", hex: "#E5303A", dark: "#8E1219" },
    { id: 3, name: "Blue", hex: "#1E88E5", dark: "#0B4F95" },
    { id: 4, name: "Green", hex: "#1FB35B", dark: "#0C6B33" },
    { id: 5, name: "Gold", hex: "#F5C518", dark: "#9A7400" }
  ];
  var CHESS_SIDE = [{ id: "w", name: "White", hex: "#f4efe2", dark: "#a79f8b" }, { id: "b", name: "Black", hex: "#2a2320", dark: "#000" }];
  var LUDO_TRACK = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
  // lanes of each corner (indexed by corner), bases, quadrant origins
  var LUDO_HOMES = [[[7,1],[7,2],[7,3],[7,4],[7,5]], [[1,7],[2,7],[3,7],[4,7],[5,7]], [[7,13],[7,12],[7,11],[7,10],[7,9]], [[13,7],[12,7],[11,7],[10,7],[9,7]]];
  var LUDO_BASE = [[[2,2],[2,3],[3,2],[3,3]], [[2,11],[2,12],[3,11],[3,12]], [[11,11],[11,12],[12,11],[12,12]], [[11,2],[11,3],[12,2],[12,3]]];
  var LUDO_QUAD = [[0,0],[0,9],[9,9],[9,0]];
  var LUDO_STAR = {}; [8, 21, 34, 47].forEach(function (g) { LUDO_STAR[g] = 1; });
  var CELL = 100 / 15;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function host() {
    var h = document.getElementById("zgame");
    if (!h) { h = document.createElement("div"); h.id = "zgame"; document.body.appendChild(h); }
    return h;
  }
  function css() {
    if (document.getElementById("zgcss")) return;
    var s = document.createElement("style"); s.id = "zgcss"; s.textContent = STYLE; document.head.appendChild(s);
  }

  /* ---- sons (synthétisés) ---- */
  var AC = null;
  function ac() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function muted() { try { return localStorage.getItem("ec_game_mute") === "1"; } catch (e) { return false; } }
  function setMuted(v) { try { localStorage.setItem("ec_game_mute", v ? "1" : "0"); } catch (e) {} }
  // speaker button in every game header: taps switch the game sounds off or on
  function msgBtn() {
    return '<button class="zg-snd" data-zg="msg" aria-label="Message your opponent">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></button>';
  }
  function msgOpp() {
    if (!G || !G.oppUid) return;
    var u = G.oppUid;
    close();
    try {
      if (typeof S !== "undefined" && S.mode === "student" && typeof peerStart === "function") {
        S.view = { type: "peer", id: u }; PR.with = u; peerStart(); peerMarkRead(u); scrollTo(0, 0); render();
      }
    } catch (err) {}
  }
  function sndBtn() {
    var off = muted();
    return '<button class="zg-snd' + (off ? " off" : "") + '" data-zg="snd" aria-label="' + (off ? "Turn game sounds on" : "Turn game sounds off") + '" aria-pressed="' + off + '">' +
      (off ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
           : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>') + '</button>';
  }
  function noise(dur, type, freq, q, vol, when) {
    if (muted()) return;
    var c = ac(); if (!c) return;
    var len = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    var g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(c.currentTime + (when || 0));
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    if (muted()) return;
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (when || 0);
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  var SFX = {
    move: function () { noise(0.06, "bandpass", 1900, 5, 0.9); tone(700, 0.05, "triangle", 0.08); },
    capture: function () { noise(0.14, "lowpass", 900, 1, 1.2); tone(220, 0.18, "sine", 0.25, 0, 110); },
    check: function () { tone(880, 0.2, "square", 0.05); tone(660, 0.25, "square", 0.05, 0.22); },
    tok: function () { tone(520, 0.13, "sine", 0.25, 0, 300); noise(0.035, "bandpass", 2400, 3, 0.5); },
    dice: function () { for (var i = 0; i < 12; i++) noise(0.035, "bandpass", 1800 + Math.random() * 1800, 2, 0.8, i * 0.06); },
    chime: function () { tone(659, 0.4, "sine", 0.18); tone(988, 0.5, "sine", 0.14, 0.12); },
    pop: function () { tone(900, 0.08, "sine", 0.1, 0, 200); noise(0.05, "highpass", 2000, 1, 0.4); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.4, "triangle", 0.2, i * 0.14); }); }
  };

  /* ---- fermer / retour ---- */
  function close() {
    clearTimeout(TIMER); TIMER = 0; stopFire();
    var h = document.getElementById("zgame"); if (h) h.remove();
    var m = document.getElementById("zgmenu"); if (m) m.remove();
    G = null; PICKCB = null;
  }
  function back() { G = null; clearTimeout(TIMER); TIMER = 0; stopFire(); hub(PLACE || "arena"); }

  /* ---- hub : les 4 jeux ---- */
  function hub(place) {
    css();
    PLACE = place || "arena";
    G = null; clearTimeout(TIMER); TIMER = 0; stopFire();
    var h = host();
    h.className = "zg-page hub";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="close" aria-label="Close">Quitter</button><div><b>Games</b><small>' + (PLACE === "battle" ? "Battle Royale" : "Arena") + '</small></div>' + sndBtn() + '</div>' +
      '<div class="zg-hub">' +
        card("chess", "Chess", "Castling, en passant, promotion", '<div class="pv pv-chess"><i class="w"></i><i class="b"></i><i class="b"></i><i class="w"></i></div>') +
        card("ludo", "Ludo", "2 to 4 players", '<div class="pv pv-ludo"><i class="red"></i><i class="green"></i><i class="blue"></i><i class="yellow"></i></div>') +
        card("morris", "Three men's morris", "Mills, step by step", '<div class="pv pv-morris"><b></b><b class="bk"></b><b></b></div>') +
        card("ttt", "Tic-tac-toe", "Three in a row", '<div class="pv pv-ttt"><span>✕</span><span>○</span><span>✕</span></div>') +
      '</div>' +
      (PLACE === "battle" ? '<div class="zg-inbox" id="zgInboxHost"></div>' : "");
    if (PLACE === "battle" && window.zgInboxInto) window.zgInboxInto(document.getElementById("zgInboxHost"));
  }
  function card(id, name, desc, preview) {
    return '<button class="zg-card" data-zgh="' + id + '">' + preview + '<b>' + esc(name) + '</b><small>' + esc(desc) + '</small></button>';
  }

  /* ---- réglages ---- */
  function setup(game) {
    SEL.game = game;
    var h = host(), battle = PLACE === "battle";
    h.className = "zg-page setup";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="hub" aria-label="Back">‹ Back</button><div><b>' + esc(NAMES[game]) + '</b><small>' + (battle ? "Battle Royale" : "Arena") + '</small></div>' + sndBtn() + '</div>' +
      '<div class="zg-setup">' +
        (game === "ludo" ? '<div class="zg-label">Players on this phone</div><div class="seg">' + [2, 3, 4].map(function (n) { return '<button class="' + (SEL.players === n ? "on" : "") + '" data-zgs="players" data-v="' + n + '">' + n + '</button>'; }).join("") + '</div>' : "") +
        (game === "ttt" ? "" : '<div class="zg-label">Level</div><div class="seg">' + [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(function (d) { return '<button class="' + (SEL.diff === d[0] ? "on" : "") + '" data-zgs="diff" data-v="' + d[0] + '">' + d[1] + '</button>'; }).join("") + '</div>') +
        '<button class="zg-big" data-zgs="ai">Play against the computer<small>Works offline</small></button>' +
        '<button class="zg-big alt" data-zgs="local">Two players on this phone<small>Works offline · pass the phone</small></button>' +
        (battle ? '<button class="zg-big alt2" data-zgs="online">Play a classmate remotely<small>Send an invitation · they accept in Battle Royale</small></button>' : "") +
      '</div>';
  }

  /* ---- choix des couleurs (avant chaque partie) ---- */
  function choosePage(title, sub, opts, taken, onPick) {
    css();
    PICKCB = onPick;
    var h = host();
    h.className = "zg-page pick";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="back-setup" aria-label="Back">‹ Back</button><div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div>' + sndBtn() + '</div>' +
      '<div class="zg-pick"><div class="zg-swatches">' + opts.map(function (o, i) {
        var off = taken.indexOf(o.id) >= 0;
        return '<button class="zg-sw" ' + (off ? "disabled" : "") + ' data-zgc="' + i + '" style="--c:' + o.hex + ';--d:' + o.dark + '"><span class="ball"></span>' + esc(o.name) + '</button>';
      }).join("") + '</div><div class="zg-info">Pick the colour of your pawns. The other players get the colours left.</div></div>';
    PICKOPTS = opts;
  }
  var PICKOPTS = [];

  // lance le choix des couleurs puis appelle done(cols)
  function chooseFlow(game, mode, n, done) {
    var cols = [];
    if (game === "ttt") return done(cols); // X and O: nothing to choose
    function step(i) {
      if (game === "chess") {
        if (i === 1) { cols[1] = cols[0] === "w" ? "b" : "w"; return done(cols); }
        choosePage(mode === "local" ? "Player 1" : "Your side", "Choose White or Black", CHESS_SIDE, [], function (id) { cols[0] = id; step(1); });
        return;
      }
      var palette = game === "ludo" ? CORNER : DISC;
      var need = mode === "online" ? 1 : (game === "ludo" ? n : 2);
      if (i >= need) return done(cols);
      if (mode === "ai" && i === 1) {
        var rest = palette.filter(function (o) { return cols.indexOf(o.id) < 0; });
        cols[1] = rest[Math.floor(Math.random() * rest.length)].id;
        if (game === "ludo") { for (var k = 2; k < need; k++) { var r2 = palette.filter(function (o) { return cols.indexOf(o.id) < 0; }); cols[k] = r2[0].id; } }
        return done(cols);
      }
      var label = mode === "local" ? "Player " + (i + 1) : "Your pawns";
      choosePage(label, "Choose a colour", palette, cols, function (id) { cols[i] = id; step(i + 1); });
    }
    step(0);
  }

  /* ---- démarrer une partie ---- */
  function startGame(game, mode, diff, players) {
    var n = game === "ludo" ? (mode === "ai" ? 2 : players) : 2;
    chooseFlow(game, mode, n, function (cols) {
      open({ game: game, mode: mode, diff: diff, players: n, cols: cols });
    });
  }

  function open(opts) {
    css();
    clearTimeout(TIMER); TIMER = 0; stopFire();
    G = { game: opts.game, mode: opts.mode, diff: opts.diff || "medium", you: opts.you == null ? 0 : opts.you, sel: null, busy: false, over: false,
      id: opts.id || null, v: opts.v || 1, oppName: opts.oppName || "Classmate", oppUid: opts.oppUid || null, anim: false, last: null, rolling: false, rollAnim: null,
      cols: opts.cols || null, caps: [[], []], lastDie: [1, 1, 1, 1] };
    if (opts.game === "chess" && opts.you == null && G.cols) G.you = G.cols[0] === "b" ? 1 : 0;
    if (opts.st) G.st = opts.st;
    else if (opts.game === "chess") G.st = ZG.chess.start();
    else if (opts.game === "morris") G.st = ZG.morris.start();
    else if (opts.game === "ttt") G.st = ZG.ttt.start();
    else {
      G.n = opts.players || 2;
      var corners = G.cols && G.cols.length ? G.cols.filter(function (x) { return typeof x === "number"; }) : null;
      G.st = ZG.ludo.start(G.n, corners);
    }
    if (opts.game === "ludo") G.n = G.st.n;
    host().className = "zg-page game " + opts.game;
    host().removeAttribute("data-zgshown");
    paint();
    schedule();
  }

  // côté qui joue : 0 = premier joueur
  function sideOfTurn(st) {
    st = st || G.st;
    if (G.game === "chess") return st.turn === "w" ? 0 : 1;
    if (G.game === "morris" || G.game === "ttt") return st.turn - 1;
    return st.turn;
  }
  function isMyTurn() {
    if (G.mode === "online") return sideOfTurn() === G.you;
    return !isAiTurn();
  }
  function isAiTurn() {
    if (G.mode !== "ai") return false;
    if (G.game === "chess") return G.st.turn !== (G.you === 0 ? "w" : "b");
    if (G.game === "morris" || G.game === "ttt") return G.st.turn !== (G.you === 0 ? 1 : 2);
    return G.st.turn !== G.you;
  }
  function refreshSnd() {
    document.querySelectorAll("[data-zg=\"snd\"]").forEach(function (el) { el.outerHTML = sndBtn(); });
  }
  function humanTurn() { return G && !G.over && !G.rolling && isMyTurn() && !isAiTurn(); }

  function schedule() {
    clearTimeout(TIMER); TIMER = 0;
    if (!G || G.over) return;
    if (isAiTurn()) TIMER = setTimeout(aiMove, G.game === "ttt" ? 150 : 520);
  }

  // un coup est joué : on enregistre les captures, on joue le son, on rafraîchit
  function commit(next, mover, extra) {
    var prev = G.st, caps = diffCaps(prev, next, mover);
    caps.forEach(function (c) { (G.caps[mover] = G.caps[mover] || []).push(c); });
    G.st = next;
    G.sel = null;
    if (extra) Object.keys(extra).forEach(function (k) { G[k] = extra[k]; });
    if (caps.length) SFX.capture(); else if (G.game !== "ludo") SFX.move();
    if (G.game === "chess" && ZG.chess.inCheck(next, next.turn) && !caps.length) SFX.check();
    return caps;
  }
  function colourOf(side) {
    if (G.game === "ludo") { var c = G.st.corner ? G.st.corner[side] : side; return CORNER[c] || CORNER[0]; }
    if (G.game === "chess") { var cid = G.cols ? G.cols[side] : (side === 0 ? "w" : "b"); return CHESS_SIDE[cid === "b" ? 1 : 0]; }
    var id = G.cols ? G.cols[side] : side;
    return DISC[typeof id === "number" ? id : side] || DISC[side];
  }
  // pièces prises par le joueur qui vient de jouer
  function diffCaps(prev, next, mover) {
    var out = [];
    if (G.game === "chess") {
      var mc = prev.turn; // "w" or "b"
      var cnt = function (b) { var m = {}; b.forEach(function (p) { if (p) m[p] = (m[p] || 0) + 1; }); return m; };
      var a = cnt(prev.b), z = cnt(next.b);
      Object.keys(a).forEach(function (p) {
        var isWhite = ZG.chess.white(p);
        if ((mc === "w") === isWhite) return; // only the opponent's pieces
        var d = a[p] - (z[p] || 0);
        for (var i = 0; i < d; i++) out.push({ kind: "chess", p: p });
      });
    } else if (G.game === "morris") {
      var opp = prev.turn === 1 ? 2 : 1;
      var ca = 0, cz = 0;
      prev.b.forEach(function (v) { if (v === opp) ca++; });
      next.b.forEach(function (v) { if (v === opp) cz++; });
      for (var j = 0; j < ca - cz; j++) out.push({ kind: "morris", col: colourOf(opp - 1) });
    } else if (G.game === "ludo") {
      for (var o = 0; o < prev.n; o++) {
        if (o === prev.turn) continue;
        for (var t = 0; t < 4; t++) if (prev.tok[o][t] >= 0 && next.tok[o][t] === -1) out.push({ kind: "ludo", col: colourOf(o) });
      }
    }
    return out;
  }

  function aiMove() {
    TIMER = 0;
    if (!G || G.over) return;
    var d = DIFF[G.diff] || DIFF.medium;
    var mover = sideOfTurn();
    if (G.game === "chess") {
      var m = ZG.chess.best(G.st, d.chess);
      if (m) { G.last = { f: m.f, t: m.t }; commit(ZG.chess.make(G.st, m), mover); }
    } else if (G.game === "morris") {
      var mm = ZG.morris.best(G.st, d.morris);
      if (mm) { G.last = mm.from != null ? { f: mm.from, t: mm.to } : { f: null, t: mm.to }; commit(ZG.morris.apply(G.st, mm), mover); }
    } else if (G.game === "ttt") {
      var tm = ZG.ttt.best(G.st, d.ttt);
      if (tm) { G.last = { f: null, t: tm.at }; G.anim = true; commit(ZG.ttt.apply(G.st, tm), mover); SFX.pop(); }
    } else if (G.game === "ludo") {
      if (!G.st.dice) { rollAnimated(function () { TIMER = setTimeout(aiMove, 450); }); return; }
      var lm = ZG.ludo.pick(G.st);
      if (!lm) { G.st = ZG.ludo.pass(G.st); afterMove(); return; }
      ludoApply(lm.t);
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
  function sendMove() { if (G && G.mode === "online" && window.zgPush) window.zgPush(G); }
  // le coup de l'autre joueur (à distance)
  function adopt(st, v, cols) {
    if (!G) return;
    var mover = sideOfTurn(G.st);
    var caps = diffCaps(G.st, st, mover);
    caps.forEach(function (c) { (G.caps[mover] = G.caps[mover] || []).push(c); });
    if (caps.length) SFX.capture(); else SFX.move();
    G.st = st; G.v = v; G.sel = null; G.anim = true;
    if (cols) G.cols = cols;
    var end = endInfo();
    if (end) { G.over = true; paint(); showEnd(end); return; }
    paint();
  }

  /* ---- fin de partie ---- */
  function endInfo() {
    if (G.game === "chess") {
      var s = ZG.chess.status(G.st);
      if (s === "play") return null;
      if (s === "mate") return { winner: G.st.turn === "w" ? 1 : 0, text: "Checkmate" };
      return { winner: -1, text: s === "stale" ? "Stalemate: a draw" : "Draw: 50 moves" };
    }
    if (G.game === "morris") {
      if (!G.st.winner) return null;
      return { winner: G.st.winner === 1 ? 0 : 1, text: "Three in the mill or no more moves" };
    }
    if (G.game === "ttt") {
      var w = G.st.win;
      if (!w) return null;
      if (w.draw) return { winner: -1, text: "Nobody made three in a row" };
      return { winner: w.p - 1, text: "Three in a row" };
    }
    if (G.game === "ludo") {
      if (G.st.winner < 0) return null;
      return { winner: G.st.winner, text: "All four tokens home" };
    }
    return null;
  }
  function winnerName(w) {
    if (G.mode === "ai") return w === G.you ? "You" : "The computer";
    if (G.mode === "online") return w === G.you ? "You" : G.oppName;
    return G.game === "ludo" ? "Player " + (w + 1) : "Player " + (w + 1);
  }
  function showEnd(end) {
    var old = document.getElementById("zgend"); if (old) old.remove();
    var w = end.winner, msg, win = w >= 0;
    if (!win) msg = "Draw";
    else if (G.mode === "ai") msg = w === G.you ? "You win!" : "The computer wins";
    else if (G.mode === "online") msg = w === G.you ? "You win!" : G.oppName + " wins";
    else msg = winnerName(w) + " wins!";
    var el = document.createElement("div");
    el.id = "zgend"; el.className = "zg-end";
    el.innerHTML = '<div class="zg-endcard">' +
      (win ? '<div class="zg-trophy">' + TROPHY + '</div>' : '') +
      '<b>' + esc(msg) + '</b><small>' + esc(end.text) + '</small>' +
      (G.mode === "online" ? '' : '<button class="zg-big" data-zg="again">Play again</button>') +
      '<button class="zg-big alt" data-zg="hub">Other games</button>' +
      '<button class="zg-big alt2" data-zg="close">Quit</button></div>';
    host().appendChild(el);
    if (win) { SFX.win(); fireworks(); }
  }
  var TROPHY = '<svg viewBox="0 0 120 130" width="96" height="104"><defs><linearGradient id="zgTg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".35" stop-color="#f5c518"/><stop offset=".7" stop-color="#c98f00"/><stop offset="1" stop-color="#ffe27a"/></linearGradient></defs><path d="M28 14h64v30c0 22-14 36-32 36S28 66 28 44z" fill="url(#zgTg)" stroke="#8a5d00" stroke-width="2"/><path d="M28 24H12c0 18 8 30 20 32M92 24h16c0 18-8 30-20 32" fill="none" stroke="#c98f00" stroke-width="7" stroke-linecap="round"/><rect x="54" y="80" width="12" height="24" fill="#c98f00"/><rect x="34" y="104" width="52" height="14" rx="4" fill="url(#zgTg)" stroke="#8a5d00" stroke-width="2"/><path d="M40 22c0 14 4 24 10 30" stroke="#fff" stroke-width="5" opacity=".7" fill="none" stroke-linecap="round"/></svg>';

  /* feux d'artifice : canvas plein écran */
  var FIRE = null;
  function fireworks() {
    stopFire();
    var cv = document.createElement("canvas");
    cv.id = "zgfx"; cv.width = window.innerWidth; cv.height = window.innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d"), parts = [], colours = ["#FACC15", "#F472B6", "#60A5FA", "#34D399", "#A78BFA", "#FB923C", "#FFFFFF"];
    var t0 = Date.now(), last = 0;
    function burst() {
      var x = 40 + Math.random() * (cv.width - 80), y = 60 + Math.random() * (cv.height * 0.5), col = colours[Math.floor(Math.random() * colours.length)];
      for (var i = 0; i < 46; i++) {
        var a = (Math.PI * 2 * i) / 46, s = 2 + Math.random() * 4;
        parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: Math.random() < 0.2 ? colours[6] : col });
      }
      SFX.pop();
    }
    function frame() {
      if (!document.getElementById("zgfx")) return;
      var now = Date.now();
      if (now - last > 420 && now - t0 < 4200) { burst(); last = now; }
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.vy += 0.07; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      parts = parts.filter(function (p) { return p.life > 0; });
      if (now - t0 < 6000 || parts.length) FIRE = requestAnimationFrame(frame); else stopFire();
    }
    burst();
    FIRE = requestAnimationFrame(frame);
  }
  function stopFire() {
    if (FIRE) cancelAnimationFrame(FIRE); FIRE = null;
    var c = document.getElementById("zgfx"); if (c) c.remove();
  }

  /* ---- dessin ---- */
  function paint() {
    if (!G) return;
    var h = host();
    var anim = G.anim; G.anim = false;
    var body = G.game === "chess" ? chessHTML(anim) : G.game === "morris" ? morrisHTML(anim) : G.game === "ttt" ? tttHTML(anim) : ludoHTML();
    var sub = G.mode === "ai" ? "vs computer · " + G.diff : G.mode === "online" ? "vs " + esc(G.oppName) + " · online" : (G.game === "ludo" ? G.n + " players · this phone" : "2 players · this phone");
    var old = flipSnapshot(h);
    var sameGame = h.getAttribute("data-zgshown") === G.game && h.querySelector(".zg-head") && h.querySelector(".zg-body");
    if (sameGame) {
      // même partie : on ne remplace que le statut et le plateau (pas de clignotement, réponse immédiate)
      var st0 = h.querySelector(".zg-status"), sm = h.querySelector(".zg-head small");
      if (st0) st0.textContent = statusText();
      if (sm) sm.innerHTML = sub;
      h.querySelector(".zg-body").innerHTML = body;
    } else {
      h.className = "zg-page game " + G.game;
      h.setAttribute("data-zgshown", G.game);
      h.innerHTML =
        '<div class="zg-head"><button class="zg-x" data-zg="back" aria-label="Back">‹ Back</button><div><b>' + esc(NAMES[G.game]) + '</b><small>' + sub + '</small></div>' + (G.mode === "online" && G.oppUid ? msgBtn() : "") + sndBtn() + '</div>' +
        '<div class="zg-status">' + esc(statusText()) + '</div><div class="zg-body">' + body + '</div>';
    }
    if (old) flipRun(h, old);
    if (G.game === "morris") morrisSlide(h);
    if (G.rollAnim) { runRollAnim(h, G.rollAnim); G.rollAnim = null; }
  }

  function statusText() {
    if (G.over) return "Game over";
    if (G.mode === "online" && !isMyTurn()) return "Waiting for " + G.oppName + "…";
    if (G.game === "chess") {
      var t = G.st.turn === "w" ? "White" : "Black";
      if (ZG.chess.inCheck(G.st, G.st.turn)) return t + " is in check";
      return isAiTurn() ? "The computer is thinking…" : t + " to play";
    }
    if (G.game === "morris") {
      var p = G.st.turn;
      if (G.st.pending) return isAiTurn() ? "The computer takes a piece" : "Mill! Tap a piece to take";
      if (isAiTurn()) return "The computer is thinking…";
      if (G.st.hand[p - 1] > 0) return "Place a piece (" + G.st.hand[p - 1] + " left)";
      return "Move a piece" + (G.sel != null ? " — tap where it goes" : "");
    }
    if (G.game === "ttt") {
      if (G.st.win) return G.st.win.draw ? "Draw" : (G.st.win.p === 1 ? "X wins" : "O wins");
      if (isAiTurn()) return "The computer is thinking…";
      return (G.st.turn === 1 ? "X" : "O") + " to play";
    }
    if (isAiTurn()) return "The computer is playing…";
    if (G.rolling) return "Rolling…";
    if (G.st.dice) return "Player " + (G.st.turn + 1) + ": choose a token";
    return "Player " + (G.st.turn + 1) + ": roll your dice";
  }

  // captures alignées à côté du joueur qui les a prises
  function capsHTML(side) {
    var list = G.caps[side] || [];
    if (!list.length) return '<div class="zgcap empty">no captures yet</div>';
    return '<div class="zgcap">' + list.map(function (c) {
      if (c.kind === "chess") {
        var w = ZG.chess.white(c.p);
        return '<span class="cg ' + (w ? "w" : "b") + '">' + chessPieceSVG(c.p, w) + '</span>';
      }
      return '<i class="cd" style="--c:' + c.col.hex + ';--d:' + c.col.dark + '"></i>';
    }).join("") + '</div>';
  }

  /* échecs */
  function chessHTML(anim) {
    var st = G.st, legal = ZG.chess.legal(st);
    var targets = G.sel != null ? legal.filter(function (m) { return m.f === G.sel; }) : [];
    var last = G.last, rows = "";
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var i = r * 8 + c, p = st.b[i];
      var cls = "zgc-sq " + ((r + c) % 2 ? "dk" : "lt");
      if (i === G.sel) cls += " sel";
      var tg = targets.filter(function (m) { return m.t === i; });
      if (tg.length) cls += " to" + (tg[0].c || (st.b[i] && ZG.chess.white(st.b[i]) !== ZG.chess.white(st.b[G.sel])) ? " cap" : "");
      if (last && last.t === i) cls += " lastt";
      if (last && last.f === i) cls += " lastf";
      var piece = "";
      if (p) {
        var w = ZG.chess.white(p), mv = anim && last && last.t === i && last.f != null;
        var sty = mv ? ' style="--fx:' + ((last.f % 8) - c) * 100 + '%;--fy:' + (Math.floor(last.f / 8) - r) * 100 + '%"' : "";
        piece = '<span class="zgp ' + (w ? "w" : "b") + (mv ? " mv" : "") + '"' + sty + '>' + chessPieceSVG(p, w) + '</span>';
      }
      var co = (c === 0 ? '<em class="zgc-rk">' + (8 - r) + '</em>' : '') + (r === 7 ? '<em class="zgc-fl">' + "abcdefgh".charAt(c) + '</em>' : '');
      rows += '<button class="' + cls + '" data-zgsq="' + i + '">' + co + piece + '</button>';
    }
    var mySide = G.mode === "ai" || G.mode === "online" ? G.you : 0;
    return '<div class="zgp-row">' + playerChip(1 - mySide, nameForSide(1 - mySide), "b") + '</div>' +
      '<div class="zgc-frame"><div class="zgc-board">' + rows + '</div></div>' +
      '<div class="zgp-row">' + playerChip(mySide, nameForSide(mySide), "w") + '</div>' +
      '<div class="zg-info">Tap a piece, then tap where it goes. Castling, en passant and promotion (to a queen) are included.</div>';
  }
  function nameForSide(side) {
    if (G.mode === "ai") return side === G.you ? "You" : "Computer";
    if (G.mode === "online") return side === G.you ? "You" : G.oppName;
    if (G.game === "chess") { var p1 = G.cols && G.cols[0] === "b" ? 1 : 0; return "Player " + (side === p1 ? 1 : 2); }
    return "Player " + (side + 1);
  }
  // avatar du joueur : son personnage 3D (moi), un robot (ordinateur) ou son initiale
  function avatarHTML(side, colHex) {
    var isMe = (G.mode === "ai" || G.mode === "online") && side === G.you;
    if (isMe) { try { return avtHTML((S.me && S.me.avt) || AV_DEF, 44, false); } catch (e) {} }
    if (G.mode === "ai") return '<span class="zgpa-ini zgpa-bot" style="--c:' + colHex + '">🤖</span>';
    var nm = nameForSide(side);
    return '<span class="zgpa-ini" style="--c:' + colHex + '">' + esc(nm.charAt(0)) + '</span>';
  }
  // carte joueur : avatar, nom, un chiffre en direct, et les pièces prises
  function profCard(side, name, stat, colHex) {
    var on = (sideOfTurn() === side && !G.over) ? " on" : "";
    return '<div class="zg-pl' + on + '" style="--c:' + colHex + '">' +
      '<div class="zgpa">' + avatarHTML(side, colHex) + '</div>' +
      '<div class="zgpi"><b>' + esc(name) + '</b><small>' + stat + '</small></div>' +
      '<div class="zgpcap">' + capsHTML(side) + '</div></div>';
  }
  var MAT = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0 };
  function chessStat(side) {
    var mine = side === 0 ? "w" : "b", sc = 0;
    G.st.b.forEach(function (p) { if (!p) return; var v = MAT[{ p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 }[p.toLowerCase()]] || 0; sc += ZG.chess.white(p) === (mine === "w") ? v : -v; });
    return sc > 0 ? "Material +" + sc : sc < 0 ? "Material " + sc : "Material even";
  }
  function playerChip(side, name, tag) {
    var col = colourOf(side).hex, stat = "";
    if (G.game === "chess") stat = chessStat(side);
    else if (G.game === "morris") stat = G.st.b.filter(function (x) { return x === side + 1; }).length + " on board · " + G.st.hand[side] + " to place";
    else if (G.game === "ttt") stat = side === 0 ? "plays ✕" : "plays ○";
    return profCard(side, name, stat, col);
  }

  /* moulin à 3 pions */
  function morrisPoint(i) { return { x: 15 + (i % 3) * 35, y: 15 + Math.floor(i / 3) * 35 }; }
  function morrisHTML(anim) {
    var st = G.st, human = !isAiTurn(), mv = ZG.morris.moves(st), last = G.last;
    var lines = ZG.morris.LINES.map(function (L) {
      var a = morrisPoint(L[0]), b = morrisPoint(L[2]);
      return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" class="ln"/>' +
             '<line x1="' + a.x + '" y1="' + (a.y + 0.6) + '" x2="' + b.x + '" y2="' + (b.y + 0.6) + '" class="ln2"/>';
    }).join("");
    var svg = '<svg class="zgm-lines" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>';
    var hits = "", discs = "";
    for (var i = 0; i < 9; i++) {
      var p = morrisPoint(i), v = st.b[i], cls = "";
      if (G.sel === i) cls += " sel";
      if (human) {
        if (st.pending) { if (mv.some(function (m) { return m.rem === i; })) cls += " rem"; }
        else if (G.sel != null && mv.some(function (m) { return m.from === G.sel && m.to === i; })) cls += " to";
      }
      hits += '<button class="zgm-pt' + cls + '" style="left:' + p.x + '%;top:' + p.y + '%" data-zgsq="' + i + '" aria-label="point ' + i + '"></button>';
      if (v) {
        var moving = anim && last && last.t === i && last.f != null;
        var from = moving ? morrisPoint(last.f) : p, col = colourOf(v - 1);
        discs += '<div class="zgm-disc' + (moving ? " zgm-mv" : "") + '" data-x="' + p.x + '" data-y="' + p.y + '" style="left:' + from.x + '%;top:' + from.y + '%;--c:' + col.hex + ';--d:' + col.dark + '"></div>';
      }
    }
    var mySide = G.mode === "ai" || G.mode === "online" ? G.you : 0;
    return '<div class="zgp-row">' + playerChip(1 - mySide, nameForSide(1 - mySide), "") + '</div>' +
      '<div class="zgm-frame"><div class="zgm-board">' + svg + discs + hits + '</div></div>' +
      '<div class="zgp-row">' + playerChip(mySide, nameForSide(mySide), "") + '</div>' +
      '<div class="zg-hand"><span>' + nameForSide(0) + ': ' + st.hand[0] + ' to place</span><span>' + nameForSide(1) + ': ' + st.hand[1] + ' to place</span></div>' +
      '<div class="zg-info">Place your pieces, then slide them along a line. Three in a line is a mill: take one of the other side\'s pieces. Pieces only step to a neighbouring empty point, one line at a time.</div>';
  }
  function morrisSlide(h) {
    h.querySelectorAll(".zgm-mv").forEach(function (el) {
      var x = el.getAttribute("data-x"), y = el.getAttribute("data-y");
      requestAnimationFrame(function () {
        el.style.transition = "left .34s cubic-bezier(.3,1.4,.6,1), top .34s cubic-bezier(.3,1.4,.6,1)";
        el.style.left = x + "%"; el.style.top = y + "%";
      });
      SFX.move();
    });
  }

  /* morpion */
  var TTT_LINE_CELL = function (i) { return [(i % 3) * 33.3 + 16.7, Math.floor(i / 3) * 33.3 + 16.7]; };
  function tttHTML(anim) {
    var st = G.st, human = !isAiTurn(), ms = ZG.ttt.moves(st), last = G.last;
    var cells = "";
    for (var i = 0; i < 9; i++) {
      var v = st.b[i], cls = "zgt-c";
      if (human && !st.win && ms.some(function (m) { return m.at === i; })) cls += " free";
      var mark = "";
      if (v === 1) mark = '<svg viewBox="0 0 100 100" class="zgt-x' + (anim && last && last.t === i ? " draw" : "") + '"><path pathLength="100" d="M18 18 L82 82 M82 18 L18 82"/></svg>';
      if (v === 2) mark = '<svg viewBox="0 0 100 100" class="zgt-o' + (anim && last && last.t === i ? " draw" : "") + '"><ellipse pathLength="100" cx="50" cy="50" rx="31" ry="31"/></svg>';
      cells += '<button class="' + cls + '" data-zgsq="' + i + '" aria-label="cell ' + i + '">' + mark + '</button>';
    }
    var strike = "";
    if (st.win && !st.win.draw) {
      var a = TTT_LINE_CELL(st.win.line[0]), b = TTT_LINE_CELL(st.win.line[2]);
      strike = '<svg class="zgt-strike" viewBox="0 0 100 100"><line pathLength="100" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/></svg>';
    }
    var grid = '<svg class="zgt-grid" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="33.3" y1="3" x2="33.3" y2="97"/><line x1="66.6" y1="3" x2="66.6" y2="97"/><line x1="3" y1="33.3" x2="97" y2="33.3"/><line x1="3" y1="66.6" x2="97" y2="66.6"/></svg>';
    var mySide = G.mode === "ai" || G.mode === "online" ? G.you : 0;
    return '<div class="zgp-row">' + playerChip(1 - mySide, nameForSide(1 - mySide), "") + '</div>' +
      '<div class="zgt-frame"><div class="zgt-board' + (human || st.win ? '' : ' thinking') + '">' + grid + cells + strike + '</div></div>' +
      '<div class="zgp-row">' + playerChip(mySide, nameForSide(mySide), "") + '</div>' +
      '<div class="zg-info">Get three of your marks in a row, across, down or diagonally.</div>' +
      '<button class="zg-big alt" data-zg="again">New game</button>';
  }

  /* ---- ludo ---- */
  function ludoCell(c, p) {
    if (p < 0) return null;
    if (p <= 50) return LUDO_TRACK[(c * 13 + p) % 52];
    if (p <= 55) return LUDO_HOMES[c][p - 51];
    return [7, 7];
  }
  function ludoHTML() {
    var st = G.st, n = st.n, human = !isAiTurn();
    var moves = st.dice && !G.rolling ? ZG.ludo.moves(st, st.dice) : [];
    var holes = "";
    for (var hc = 0; hc < 4; hc++) for (var ht = 0; ht < 4; ht++) {
      var hp = homeDot(hc, ht);
      holes += '<i class="zgl-hole" style="left:' + (hp[0] * CELL - HOLE / 2) + '%;top:' + (hp[1] * CELL - HOLE / 2) + '%;width:' + HOLE + '%;height:' + HOLE + '%;--c:' + CORNER[hc].hex + ';--d:' + CORNER[hc].dark + '"></i>';
    }
    var quads = LUDO_QUAD.map(function (q, c) {
      return '<div class="zgl-quad" style="top:' + q[0] * CELL + '%;left:' + q[1] * CELL + '%;background:' + CORNER[c].hex + ';--c:' + CORNER[c].hex + '"><div class="zgl-in"></div></div>';
    }).join("");
    var cells = "";
    LUDO_TRACK.forEach(function (rc, g) {
      // case de départ de chaque couleur : pleine couleur avec une flèche ; étoile = case sûre
      var start = g % 13 === 0 ? " start" : "";
      var col = g % 13 === 0 ? CORNER[g / 13].hex : "";
      cells += cellDiv(rc[0], rc[1], "track" + (LUDO_STAR[g] ? " star" : "") + start, col);
    });
    LUDO_HOMES.forEach(function (list, c) { list.forEach(function (rc) { cells += cellDiv(rc[0], rc[1], "home", CORNER[c].hex); }); });
    var toks = "", qdice = "";
    for (var qk = 0; qk < n; qk++) {
      var qc = st.corner[qk], qname = G.mode === "ai" ? (qk === G.you ? "You" : "Computer") : (G.mode === "online" ? (qk === G.you ? "You" : G.oppName) : "Player " + (qk + 1));
      var inBase = st.tok[qk].filter(function (x) { return x < 0; }).length;
      var qdie = cubeHTML("q" + qk, st.dice && st.turn === qk && !G.rolling ? st.dice : G.lastDie[qk], "sm", st.turn === qk && human && !st.dice && !G.rolling);
      qdice += '<div class="zgl-qdie zgl-q' + qc + '">' + qdie + '</div><div class="zgl-qlbl zgl-q' + qc + '" style="--c:' + CORNER[qc].hex + '">' + esc(qname) + ' · <b>' + inBase + '</b> in base</div>';
    }
    for (var k = 0; k < n; k++) {
      var c = st.corner[k];
      for (var t = 0; t < 4; t++) {
        var p = st.tok[k][t], rc = p < 0 ? LUDO_BASE[c][t] : ludoCell(c, p);
        if (!rc) continue;
        var can = human && st.turn === k && st.dice && !G.rolling && moves.some(function (m) { return m.t === t; });
        var ctr = pawnCentre(c, t, p, rc); // centre in cell units
        var lft = ctr[0] * CELL - PAW_W / 2;
        var tp = ctr[1] * CELL - PAW_H / 2;
        toks += pawnHTML("T" + k + t, CORNER[c], lft, tp, can ? t : -1);
      }
    }
    var turnK = st.turn, tc = st.corner[turnK];
    var arrow = !G.over ? '<div class="zgl-turn" style="' + arrowPos(tc) + '"></div>' : "";
    var board = '<div class="zgl-frame"><div class="zgl-board">' + quads + cells + holes + '<div class="zgl-center"></div>' + toks + qdice + arrow + '</div></div>';
    var panels = '<div class="zgl-players">' + Array.from({ length: n }).map(function (_, k) {
      var c = st.corner[k], col = CORNER[c];
      var home = st.tok[k].filter(function (x) { return x === 56; }).length;
      var name = G.mode === "ai" ? (k === G.you ? "You" : "Computer") : (G.mode === "online" ? (k === G.you ? "You" : G.oppName) : "Player " + (k + 1));
      var on = st.turn === k && !G.over ? " on" : "";
      return profCard(k, name, home + " / 4 home", col.hex);
    }).join("") + '</div>';
    var action;
    if (human && !st.dice && !G.rolling) action = '<button class="zg-big ludo-roll" data-zg="roll">Roll your dice</button>';
    else if (human && st.dice && !G.rolling && !moves.length) action = '<button class="zg-big alt" data-zg="pass">No move — pass</button>';
    else action = '<div class="zg-info">' + (human && st.dice && !G.rolling ? "Tap a glowing pawn to move it." : (isAiTurn() ? "The computer rolls its own dice." : "")) + '</div>';
    return board + panels + '<div class="zgl-act">' + action + '</div>' +
      '<div class="zg-info">Roll a six to bring a pawn out. Land on an opponent to send it back. A six gives another turn. The star squares are safe.</div>';
  }
  function arrowPos(c) {
    var pos = [["top:3%;left:3%"], ["top:3%;left:91%"], ["top:91%;left:91%"], ["top:91%;left:3%"]];
    return pos[c][0];
  }
  // taille d'un pion (en % du plateau) : il tient dans une case et dans un trou de la maison
  var PAW_W = 4.8, PAW_H = 6.6, HOLE = 7.4;
  // centre du triangle de chaque couleur au milieu du plateau (le carré central fait 3 cases)
  var CENTRE_SPOT = [[6.85, 7.5], [7.5, 6.85], [8.15, 7.5], [7.5, 8.15]];
  // où se trouve le pion, au centre exact de sa case (en unités de case)
  function pawnCentre(c, t, p, rc) {
    if (p < 0) { var d = homeDot(c, t); return [d[0], d[1]]; }     // trou de la maison
    if (p === 56) { var s = CENTRE_SPOT[c]; return [s[0] + (t - 1.5) * 0.2, s[1]]; } // arrivé : triangle de sa couleur
    return [rc[1] + 0.5, rc[0] + 0.5];                             // case du parcours ou du couloir
  }
  // les quatre points de chaque maison (carré blanc, un par pion) : x = colonne, y = ligne en lignes de grille
  var HOME_DOTS = [[2, 2], [4, 2], [2, 4], [4, 4]];
  function homeDot(c, t) {
    var q = LUDO_QUAD[c], d = HOME_DOTS[t];
    return [q[1] + d[0], q[0] + d[1]];
  }
  function cellDiv(r, c, cls, col) {
    return '<div class="zgl-cell ' + cls + '" style="top:' + r * CELL + '%;left:' + c * CELL + '%;width:' + CELL + '%;height:' + CELL + '%;' + (col ? "background:" + col : "") + '"></div>';
  }
  // pion en forme de goutte (comme sur la vidéo) : tête ronde + pied effilé, contour blanc
  var PAWN_SVG = '<svg viewBox="0 0 20 28" aria-hidden="true"><path d="M7.4 13.2 C6.6 16.2 4.2 18.6 3.6 22.2 C3.1 25 4.6 26.6 7.4 26.6 L12.6 26.6 C15.4 26.6 16.9 25 16.4 22.2 C15.8 18.6 13.4 16.2 12.6 13.2 Z" fill="var(--c)" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/><circle cx="10" cy="8.2" r="6.3" fill="var(--c)" stroke="#fff" stroke-width="1.3"/><ellipse cx="7.6" cy="6" rx="1.9" ry="1.3" fill="#fff" opacity=".8"/><path d="M5.6 22.8 C6.4 23.4 7.4 23.8 8.4 23.9" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1" stroke-linecap="round"/></svg>';
  function pawnHTML(fid, col, left, top, goIdx) {
    return '<div class="zgpw' + (goIdx >= 0 ? " go" : "") + '" data-fid="' + fid + '" ' + (goIdx >= 0 ? 'data-zgtok="' + goIdx + '"' : "") +
      ' style="left:' + left + '%;top:' + top + '%;--c:' + col.hex + ';--d:' + col.dark + '">' + PAWN_SVG + '</div>';
  }

  /* dé 3D : un cube par joueur */
  var FINAL = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
  function pips(v) {
    var P = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v];
    var out = "";
    for (var i = 0; i < 9; i++) out += '<i class="' + (P.indexOf(i) >= 0 ? "p" : "") + '"></i>';
    return out;
  }
  function cubeHTML(id, v, size, rollable) {
    var f = FINAL[v] || FINAL[1];
    return '<div class="zgcube-wrap ' + (size || "") + (rollable ? " rollable" : "") + '"' + (rollable ? ' data-zgroll="1"' : "") + '>' +
      '<div class="zgcube" data-cube="' + id + '" style="transform:rotateX(' + f[0] + 'deg) rotateY(' + f[1] + 'deg)">' +
      '<div class="zgcf f1">' + pips(1) + '</div><div class="zgcf f6">' + pips(6) + '</div>' +
      '<div class="zgcf f3">' + pips(3) + '</div><div class="zgcf f4">' + pips(4) + '</div>' +
      '<div class="zgcf f2">' + pips(2) + '</div><div class="zgcf f5">' + pips(5) + '</div></div></div>';
  }
  // le dé tourne en 3D puis s'arrête sur sa face
  function runRollAnim(h, ra) {
    var el = h.querySelector('[data-cube="q' + ra.p + '"]');
    if (!el || !el.animate) return;
    var f = FINAL[ra.v];
    el.animate([
      { transform: "rotateX(" + (f[0] + 1080) + "deg) rotateY(" + (f[1] + 1080) + "deg) translateY(0)", easing: "cubic-bezier(.45,0,.9,.6)" },
      { transform: "rotateX(" + (f[0] + 540) + "deg) rotateY(" + (f[1] + 540) + "deg) translateY(-22px)", offset: 0.55, easing: "cubic-bezier(.1,.7,.4,1)" },
      { transform: "rotateX(" + (f[0] + 16) + "deg) rotateY(" + (f[1] - 12) + "deg) translateY(0)", offset: 0.85, easing: "ease-out" },
      { transform: "rotateX(" + f[0] + "deg) rotateY(" + f[1] + "deg) translateY(0)" }
    ], { duration: 650, easing: "linear" });
  }

  // le pion qui avance : petit saut et son à l'arrivée
  function flipSnapshot(h) {
    var m = {};
    h.querySelectorAll("[data-fid]").forEach(function (el) { var r = el.getBoundingClientRect(); m[el.getAttribute("data-fid")] = { x: r.left, y: r.top }; });
    return m;
  }
  function flipRun(h, old) {
    h.querySelectorAll("[data-fid]").forEach(function (el) {
      var prev = old[el.getAttribute("data-fid")]; if (!prev) return;
      var r = el.getBoundingClientRect(), dx = prev.x - r.left, dy = prev.y - r.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      if (el.animate) {
        var lud = G && G.game === "ludo";
        var a = el.animate([
          { transform: "translate(" + dx + "px," + dy + "px)" },
          { transform: "translate(" + dx / 2 + "px," + (dy / 2 - 14) + "px)", offset: 0.5 },
          { transform: "translate(0,0)" }
        ], { duration: lud ? 240 : 420, easing: lud ? "ease-in-out" : "cubic-bezier(.3,.7,.4,1)" });
        a.onfinish = function () { SFX.tok(); };
      }
    });
  }

  /* lancer le dé d'un joueur */
  function rollAnimated(done) {
    var p = G.st.turn;
    G.rolling = true;
    var val = ZG.ludo.rollDice();
    G.lastDie[p] = val;
    G.rollAnim = { p: p, v: val };
    SFX.dice();
    paint();
    setTimeout(function () {
      if (!G) return;
      G.rolling = false; G.lastDie[p] = val;
      G.st = ZG.ludo.roll(G.st, val);
      if (G.mode !== "ai" || G.you === p) sendMove();
      paint();
      if (done) done();
      else ludoAfterRoll();
    }, 650);
  }
  function ludoRoll() {
    if (!humanTurn() || G.st.dice) return;
    rollAnimated(function () {
      var m = ZG.ludo.moves(G.st, G.st.dice);
      if (!m.length) { G.st = ZG.ludo.pass(G.st); afterMove(); }
      else if (m.length === 1) { setTimeout(function () { if (G && !G.over && G.st.dice && humanTurn()) ludoApply(m[0].t); }, 380); }
    });
  }
  function ludoAfterRoll() { schedule(); }
  function ludoApply(t) {
    var st = G.st, mv = ZG.ludo.moves(st, st.dice).filter(function (m) { return m.t === t; })[0];
    if (!mv) return;
    var mover = st.turn;
    var next = ZG.ludo.apply(st, mv);
    var caps = diffCaps(st, next, mover);
    caps.forEach(function (c) { (G.caps[mover] = G.caps[mover] || []).push(c); });
    var k = st.turn, p0 = st.tok[k][t], p1 = next.tok[k][t];
    var path = [];
    if (p0 < 0) path.push(p1); else for (var q = p0 + 1; q <= p1; q++) path.push(q);
    if (path.length <= 1) {
      if (caps.length) SFX.capture();
      stepFx(k, t, p0, p1);
      G.st = next; G.sel = null; G.anim = true;
      afterMove();
      return;
    }
    // le pion avance case par case (pas de saut)
    G.rolling = true; G.sel = null;
    var i = 0;
    (function walk() {
      if (!G || G.over) return;
      var s2 = JSON.parse(JSON.stringify(st));
      s2.tok[k][t] = path[i];
      G.st = s2; G.anim = true; paint(); SFX.move();
      stepFx(k, t, i === 0 ? p0 : path[i - 1], path[i]);
      i++;
      if (i < path.length) { setTimeout(walk, 250); return; }
      G.rolling = false;
      if (caps.length) SFX.capture();
      G.st = next; G.anim = true;
      afterMove();
    })();
  }
  // un pion qui rentre chez lui : un carillon et de petites étincelles qui brillent pendant 1 seconde
  // a pawn leaves its base, lands on a safe square, or goes into its home lane: a sound and sparkles for 1 second
  function stepFx(k, t, from, to) {
    var st = G && G.st; if (!st) return;
    if (from < 0 && to === 0) return fx(k, t, "out");
    if (to === 51 || to === 56) return fx(k, t, "home");
    if (to >= 0 && to <= 50) { var g = (st.corner[k] * 13 + to) % 52; if (LUDO_STAR[g] || g % 13 === 0) return fx(k, t, "safe"); }
  }
  function fx(k, t, kind) {
    try {
      if (kind === "home") SFX.chime(); else if (kind === "safe") SFX.pop(); else SFX.tok();
      var el = document.querySelector('[data-fid="T' + k + t + '"]');
      if (!el || !el.parentNode) return;
      var x = parseFloat(el.style.left) + PAW_W / 2, y = parseFloat(el.style.top) + PAW_H / 2;
      var col = kind === "safe" ? "#FFD54A" : (el.style.getPropertyValue("--c") || "#fff");
      for (var i = 0; i < 12; i++) {
        var a = (i / 12) * Math.PI * 2, d = 6 + (i % 3) * 3;
        var sp = document.createElement("i");
        sp.className = "zgl-spark";
        sp.style.cssText = "left:" + x + "%;top:" + y + "%;--c:" + col + ";--dx:" + (Math.cos(a) * d).toFixed(1) + "%;--dy:" + (Math.sin(a) * d).toFixed(1) + "%;animation-delay:" + (i % 2 ? 0 : 0.08) + "s";
        el.parentNode.appendChild(sp);
        setTimeout(function (n) { return function () { n.remove(); }; }(sp), 1100);
      }
    } catch (e) {}
  }
  function ludoPlay(t) { if (humanTurn() && G.st.dice && !G.rolling) ludoApply(t); }

  /* ---- coups du joueur ---- */
  function chessTap(sq) {
    var st = G.st, legal = ZG.chess.legal(st);
    var p = st.b[sq], mine = p && (ZG.chess.white(p) ? "w" : "b") === st.turn;
    if (G.sel != null) {
      var m = legal.filter(function (x) { return x.f === G.sel && x.t === sq; })[0];
      if (m) { G.last = { f: m.f, t: m.t }; G.anim = true; commit(ZG.chess.make(st, m), sideOfTurn(st)); afterMove(); return; }
    }
    G.sel = mine ? sq : null;
    paint();
  }
  function morrisTap(i) {
    var st = G.st, mv = ZG.morris.moves(st), mover = sideOfTurn(st);
    if (st.pending) {
      var r = mv.filter(function (m) { return m.rem === i; })[0];
      if (r) { G.last = { f: null, t: i }; G.anim = true; commit(ZG.morris.apply(st, r), mover); afterMove(); }
      return;
    }
    if (st.hand[st.turn - 1] > 0) {
      var pl = mv.filter(function (m) { return m.to === i; })[0];
      if (pl) { G.last = { f: null, t: i }; G.anim = true; commit(ZG.morris.apply(st, pl), mover); afterMove(); }
      return;
    }
    if (G.sel != null) {
      var mo = mv.filter(function (m) { return m.from === G.sel && m.to === i; })[0];
      if (mo) { G.last = { f: G.sel, t: i }; G.anim = true; commit(ZG.morris.apply(st, mo), mover); afterMove(); return; }
    }
    G.sel = st.b[i] === st.turn ? i : null;
    paint();
  }
  function tttTap(i) {
    if (!humanTurn()) return; // un seul coup humain puis l'ordinateur répond
    var st = G.st, ok = ZG.ttt.moves(st).some(function (m) { return m.at === i; });
    if (!ok) return;
    G.last = { f: null, t: i }; G.anim = true;
    commit(ZG.ttt.apply(st, { at: i }), sideOfTurn(st));
    SFX.pop();
    afterMove();
  }

  /* ---- événements (tout passe par #zgame, fin de partie comprise) ---- */
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b;
    if ((b = t.closest("[data-zgc]"))) {
      e.preventDefault();
      var o = PICKOPTS[+b.getAttribute("data-zgc")];
      if (o && PICKCB) { var cb = PICKCB; PICKCB = null; cb(o.id); }
      return;
    }
    if ((b = t.closest("[data-zgh]"))) { e.preventDefault(); setup(b.getAttribute("data-zgh")); return; }
    if ((b = t.closest("[data-zgs]"))) {
      e.preventDefault();
      var a = b.getAttribute("data-zgs");
      if (a === "players") { SEL.players = +b.getAttribute("data-v"); setup(SEL.game); return; }
      if (a === "diff") { SEL.diff = b.getAttribute("data-v"); setup(SEL.game); return; }
      if (a === "online") {
        var g = SEL.game;
        chooseFlow(g, "online", 2, function (cols) { if (window.zgOnlineStart) window.zgOnlineStart({ game: g, diff: SEL.diff, players: 2, cols: cols }); });
        return;
      }
      startGame(SEL.game, a === "ai" ? "ai" : "local", SEL.diff, SEL.players);
      return;
    }
    if ((b = t.closest("[data-zgroll]"))) {
      e.preventDefault();
      if (G && G.game === "ludo") ludoRoll();
      return;
    }
    if ((b = t.closest("[data-zg]"))) {
      e.preventDefault();
      var x = b.getAttribute("data-zg");
      if (x === "close") { close(); return; }
      if (x === "snd") { setMuted(!muted()); if (G) refreshSnd(); else hub(PLACE || "arena"); return; }
      if (x === "hub") { hub(PLACE || "arena"); return; }
      if (x === "back-setup") { setup(SEL.game); return; }
      if (x === "back") { if (G && G.mode === "online") { close(); return; } back(); return; }
      if (!G) return;
      if (x === "msg") { msgOpp(); return; }
      if (x === "again") {
        var keep = { game: G.game, mode: G.mode, diff: G.diff, you: G.you, players: G.n, cols: G.cols };
        open(keep); return;
      }
      if (x === "roll") { ludoRoll(); return; }
      if (x === "pass") { G.st = ZG.ludo.pass(G.st); afterMove(); return; }
      return;
    }
    if (!G || !humanTurn()) return;
    var sq = t.closest("[data-zgsq]");
    if (sq) {
      e.preventDefault();
      var i = +sq.getAttribute("data-zgsq");
      if (G.game === "chess") chessTap(i); else if (G.game === "morris") morrisTap(i); else if (G.game === "ttt") tttTap(i);
      return;
    }
    var tk = t.closest("[data-zgtok]");
    if (tk) { e.preventDefault(); ludoPlay(+tk.getAttribute("data-zgtok")); }
  }

  /* ---- entrée depuis l'Arena ou Battle Royale ---- */
  function menu(place) {
    css();
    PLACE = place === "battle" ? "battle" : "arena";
    hub(PLACE);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('[data-ar="games"],[data-ar="games-battle"]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    menu(b.getAttribute("data-ar") === "games-battle" ? "battle" : "arena");
  }, true);
  document.addEventListener("click", function (e) {
    var h = document.getElementById("zgame");
    if (h && h.contains(e.target)) onClick(e);
  }, false);

  // choix de couleur pour un coup à distance (accepter une invitation)
  function pickFor(game, taken, done) {
    css();
    var palette = game === "ludo" ? CORNER : game === "morris" ? DISC : CHESS_SIDE;
    choosePage("Your colour", "Choose a colour", palette, taken, function (id) { done(id); });
  }

  var STYLE = `
#zgame{position:fixed;inset:0;z-index:10075;overflow:auto;-webkit-overflow-scrolling:touch;color:#fff;background:#0a0c18;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:env(safe-area-inset-bottom,0px)}
#zgame.hub,#zgame.pick,#zgame.setup{background:linear-gradient(170deg,#141a33,#0a0c18 70%)}
#zgame.game.chess,#zgame.game.morris{background:radial-gradient(ellipse at 50% 15%,#8a4a22,#4a220e 60%,#24110a)}
#zgame.game.ludo{background:repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 14px,transparent 14px 28px),linear-gradient(170deg,#1f63d6,#0c3c97 55%,#072863)}
#zgame.game.ttt{background:radial-gradient(ellipse at 50% 25%,#4a2a16,#1c0e07 75%)}
.zg-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 10px;background:linear-gradient(#0a0c18f2,#0a0c18d9);backdrop-filter:blur(6px)}
.zg-head b{display:block;font-size:20px}
.zg-head small{opacity:.7;font-size:12px}
.zg-x{height:40px;padding:0 14px;border-radius:14px;border:0;background:#2b3046;color:#fff;font-size:15px;font-weight:800;box-shadow:0 4px 0 #14172a;cursor:pointer;white-space:nowrap}
.zg-x:active{transform:translateY(3px);box-shadow:0 1px 0 #14172a}
.zg-hub{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px 16px 24px}
.zg-card{border:0;border-radius:22px;padding:12px 12px 14px;background:linear-gradient(160deg,#252b48,#131629);color:#fff;text-align:left;box-shadow:0 8px 0 #06070e,0 16px 28px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);cursor:pointer;transition:transform .12s,box-shadow .12s}
.zg-card:active{transform:translateY(5px);box-shadow:0 3px 0 #06070e,0 6px 12px rgba(0,0,0,.4)}
.zg-card b{display:block;margin-top:10px;font-size:15px}
.zg-card small{display:block;opacity:.7;font-size:12px;margin-top:2px}
.pv{height:104px;border-radius:14px;overflow:hidden;box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -4px 0 rgba(0,0,0,.25)}
.pv-chess{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;background:#5a2a10}
.pv-chess i.w{background:linear-gradient(135deg,#f5e1bf,#e4c293)}
.pv-chess i.b{background:linear-gradient(135deg,#b97443,#8a4c22)}
.pv-ludo{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;padding:6px;background:#0c3c97}
.pv-ludo i{border-radius:8px}
.pv-ludo .red{background:#E5303A}.pv-ludo .green{background:#1FB35B}.pv-ludo .yellow{background:#F5C518}.pv-ludo .blue{background:#1E88E5}
.pv-morris{background:radial-gradient(circle at 40% 30%,#e2b27a,#b47b3f 70%);display:flex;align-items:center;justify-content:center;gap:10px}
.pv-morris b{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff,#c9c9c9);box-shadow:0 4px 0 rgba(0,0,0,.35)}
.pv-morris b.bk{background:radial-gradient(circle at 34% 28%,#8a8a8a,#0e0e0e 75%)}
.pv-ttt{background:radial-gradient(ellipse at 40% 35%,#2f5a4c,#1b3b33 70%);display:flex;gap:10px;align-items:center;justify-content:center;font-size:28px;font-weight:800}
.pv-ttt span:nth-child(1),.pv-ttt span:nth-child(3){color:#f5e27a}.pv-ttt span:nth-child(2){color:#a9a6ef}
.zg-setup{padding:12px 16px 30px;display:grid;gap:12px}
.zg-label{font-size:13px;opacity:.7;margin-top:6px}
.seg{display:flex;gap:8px}
.seg button{flex:1;padding:12px 8px;border-radius:14px;border:0;background:rgba(255,255,255,.08);color:#fff;font-weight:700;box-shadow:0 4px 0 #07080f;cursor:pointer}
.seg button.on{background:linear-gradient(#a78bfa,#7c5cf0);box-shadow:0 4px 0 #4b35a3}
.zg-big{display:block;width:100%;border:0;border-radius:18px;padding:16px;font-size:17px;font-weight:800;color:#fff;background:linear-gradient(#9a7bff,#6a4bf0);box-shadow:0 7px 0 #4b35a3,0 14px 24px rgba(0,0,0,.4);cursor:pointer;text-align:center;transition:transform .1s,box-shadow .1s;font-family:inherit}
.zg-big:active{transform:translateY(5px);box-shadow:0 2px 0 #4b35a3,0 6px 10px rgba(0,0,0,.4)}
.zg-big small{display:block;font-weight:500;font-size:12px;opacity:.85;margin-top:3px}
.zg-big.alt{background:linear-gradient(#3e4462,#262a40);box-shadow:0 7px 0 #14172a,0 14px 24px rgba(0,0,0,.4)}
.zg-big.alt:active{box-shadow:0 2px 0 #14172a,0 6px 10px rgba(0,0,0,.4)}
.zg-big.alt2{background:linear-gradient(#22c262,#0f8a40);box-shadow:0 7px 0 #0a5a2a,0 14px 24px rgba(0,0,0,.4)}
.zg-big.ludo-roll{background:linear-gradient(#ffd23f,#f0a500);box-shadow:0 7px 0 #a86f00,0 14px 24px rgba(0,0,0,.4);color:#2a1800}
.zg-pick{padding:14px 16px 30px;display:grid;gap:14px}
.zg-swatches{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.zg-sw{border:0;border-radius:24px;padding:16px 10px 14px;background:linear-gradient(160deg,#252b48,#131629);color:#fff;font-weight:800;font-size:15px;font-family:inherit;box-shadow:0 7px 0 #06070e,0 14px 24px rgba(0,0,0,.4);cursor:pointer}
.zg-sw:active{transform:translateY(4px)}
.zg-sw:disabled{opacity:.25;cursor:default}
.zg-sw .ball{display:block;width:72px;height:72px;margin:0 auto 10px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff 0 6%,var(--c) 24%,var(--c) 60%,var(--d) 100%);box-shadow:0 7px 10px rgba(0,0,0,.45)}
.zg-status{margin:10px 16px 0;padding:13px 16px;border-radius:16px;background:rgba(8,12,26,.6);text-align:center;font-weight:800;font-size:17px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 4px 0 rgba(0,0,0,.3)}
.zg-body{padding:12px 14px 30px;display:grid;gap:12px;justify-items:center}
.zg-info{font-size:13px;opacity:.85;text-align:center;max-width:360px;line-height:1.4}
.zg-hand{display:flex;gap:18px;font-weight:700;font-size:14px}
.zgp-row{width:100%;max-width:430px;display:flex;justify-content:center}
.zg-pl{width:100%;box-sizing:border-box;padding:8px 12px;border-radius:16px;background:rgba(0,0,0,.35);font-size:13px;display:flex;flex-direction:column;gap:4px;align-items:center}
.zg-pl b{font-size:13px}
.zg-pl.on{outline:2px solid #facc15}
.zgcap{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;min-height:18px;align-items:center}
.zgcap.empty{font-size:11px;opacity:.5}
.zgcap .cg{font-size:17px;line-height:1}
.zgcap .cg.w{color:#fff;text-shadow:0 1px 0 #999,0 2px 3px rgba(0,0,0,.5)}
.zgcap .cg.b{color:#1d1410;text-shadow:0 1px 0 #666,0 2px 3px rgba(0,0,0,.5)}
.zgcap .cd{display:inline-block;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff 0 6%,var(--c) 30%,var(--c) 65%,var(--d) 100%);box-shadow:0 2px 2px rgba(0,0,0,.45)}
.zgc-frame{width:min(94vw,430px);padding:14px;border-radius:20px;background:linear-gradient(135deg,#9a4a20,#5a200b 50%,#84391a);box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.4),0 22px 40px rgba(0,0,0,.6),0 8px 0 #3a1505}
.zgc-board{display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;border-radius:6px;overflow:hidden;box-shadow:inset 0 0 0 2px #3a1505}
.zgc-sq{position:relative;border:0;padding:0;font-size:min(10vw,40px);line-height:1;cursor:pointer;background:none}
.zgc-sq.lt{background:linear-gradient(135deg,#f5e1bf,#e4c293)}
.zgc-sq.dk{background:linear-gradient(135deg,#b97443,#8a4c22)}
.zgc-sq.sel{box-shadow:inset 0 0 0 3px #facc15}
.zgc-sq.to{box-shadow:inset 0 0 0 999px rgba(60,200,110,.25)}
.zgc-sq.cap{box-shadow:inset 0 0 0 999px rgba(230,60,60,.35)}
.zgc-sq.lastt::after,.zgc-sq.lastf::after{content:"";position:absolute;inset:0;background:rgba(250,204,21,.3);pointer-events:none}
.zgp{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(10vw,40px);line-height:1;transition:transform .2s;z-index:1}
.zgp.w{color:#fff;text-shadow:0 1px 0 #dcdcdc,0 2px 0 #bcbcbc,0 3px 0 #9a9a9a,0 6px 8px rgba(0,0,0,.6)}
.zgp.b{color:#1d1410;text-shadow:0 1px 0 #666,0 2px 0 #333,0 -1px 0 #7a5a3a,0 6px 8px rgba(0,0,0,.65)}
.zgc-sq.sel .zgp{transform:translateY(-6px) scale(1.12)}
.zgp.mv{animation:zgslide .36s cubic-bezier(.3,1.3,.5,1)}
@keyframes zgslide{from{transform:translate(var(--fx),var(--fy))}to{transform:none}}
.zgm-frame{width:min(94vw,420px);aspect-ratio:1;padding:24px;box-sizing:border-box;border-radius:22px;background:linear-gradient(140deg,#e2b27a,#b47b3f 45%,#c98f50);box-shadow:inset 0 3px 0 rgba(255,255,255,.35),inset 0 -4px 0 rgba(0,0,0,.25),0 22px 40px rgba(0,0,0,.6),0 8px 0 #6b4220}
.zgm-board{position:relative;width:100%;height:100%}
.zgm-lines{position:absolute;inset:0;width:100%;height:100%}
.ln{stroke:#3b2110;stroke-width:1.3;stroke-linecap:round}
.ln2{stroke:rgba(255,255,255,.35);stroke-width:.4}
.zgm-pt{position:absolute;width:14%;height:14%;transform:translate(-50%,-50%);border:0;padding:0;background:transparent;border-radius:50%;cursor:pointer;z-index:2}
.zgm-pt::after{content:"";position:absolute;left:38%;top:38%;width:24%;height:24%;border-radius:50%;background:#3b2110}
.zgm-pt.sel::after{background:#facc15;left:30%;top:30%;width:40%;height:40%;box-shadow:0 0 0 3px rgba(250,204,21,.4)}
.zgm-pt.to::after{background:#2ecc71;left:30%;top:30%;width:40%;height:40%}
.zgm-pt.rem{box-shadow:0 0 0 4px #e74c3c}
.zgm-disc{position:absolute;width:15%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:1;background:radial-gradient(circle at 34% 28%,#fff 0 4%,var(--c) 30%,var(--c) 70%,var(--d) 100%);box-shadow:0 6px 0 rgba(0,0,0,.35),0 12px 14px rgba(0,0,0,.45)}
.zgt-frame{width:min(92vw,400px);padding:16px;box-sizing:border-box;border-radius:24px;background:linear-gradient(135deg,#b06a30,#6a3a18 50%,#94531f);box-shadow:inset 0 3px 0 rgba(255,255,255,.25),0 20px 40px rgba(0,0,0,.6),0 8px 0 #4a2610}
.zgt-board{position:relative;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);aspect-ratio:1;border-radius:12px;background:radial-gradient(ellipse at 40% 35%,#2f5a4c,#1b3b33 70%,#142d27);box-shadow:inset 0 0 40px rgba(0,0,0,.45)}
.zgt-grid{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.zgt-grid line{stroke:#e9f3ea;stroke-width:1.6;stroke-linecap:round;opacity:.9}
.zgt-c{position:relative;border:0;padding:0;background:none;cursor:default;display:grid;place-items:center}
.zgt-c.free{cursor:pointer}
.zgt-x,.zgt-o{width:62%;height:62%;overflow:visible}
.zgt-x path,.zgt-o ellipse{fill:none;stroke-linecap:round}
.zgt-x path{stroke:#f5e27a;stroke-width:10;filter:drop-shadow(0 0 2px rgba(245,226,122,.6))}
.zgt-o ellipse{stroke:#a9a6ef;stroke-width:9;filter:drop-shadow(0 0 2px rgba(169,166,239,.6))}
.zgt-x.draw path,.zgt-o.draw ellipse{stroke-dasharray:100;stroke-dashoffset:100;animation:zgdraw .42s ease-out forwards}
@keyframes zgdraw{to{stroke-dashoffset:0}}
.zgt-strike{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.zgt-strike line{stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;animation:zgdraw .5s ease-out forwards;filter:drop-shadow(0 0 3px #fff)}
.zgl-frame{width:min(96vw,440px);padding:14px;box-sizing:border-box;border-radius:20px;background:linear-gradient(135deg,#7a3314,#4a1a08 45%,#8a3d1a 70%,#3d1405);box-shadow:inset 0 0 0 2px rgba(255,220,160,.25),inset 0 0 0 5px #5a2410,inset 0 0 0 7px rgba(212,160,90,.5),0 18px 34px rgba(0,0,0,.55)}
.zgl-board{position:relative;width:100%;aspect-ratio:1;background:#fff;border-radius:8px;overflow:hidden;box-shadow:inset 0 0 0 3px #0b1640}
.zgl-quad{position:absolute;width:40%;height:40%}
.zgl-in{position:absolute;left:16.67%;top:16.67%;width:66.67%;height:66.67%;background:#fff;border-radius:14px;box-shadow:inset 0 3px 0 rgba(0,0,0,.08)}
.zgl-cell{position:absolute;box-sizing:border-box;border:1px solid #b9c3d6;background:#fff}
.zgl-cell.home{border-color:rgba(0,0,0,.12)}
.zgl-cell.safe::after{content:"★";position:absolute;inset:0;display:grid;place-items:center;color:#7d8aa3;font-size:70%}
.zgl-center{position:absolute;left:40%;top:40%;width:20%;height:20%;background:conic-gradient(from -45deg,#1FB35B 0 90deg,#F5C518 90deg 180deg,#1E88E5 180deg 270deg,#E5303A 270deg 360deg)}
.zgpw{position:absolute;width:4.8%;height:6.6%;pointer-events:none;z-index:3;transform-origin:50% 100%}
.zgpw .hd{position:absolute;left:18%;top:0;width:64%;height:56%;border-radius:50%;background:radial-gradient(circle at 36% 30%,#fff 0 7%,var(--c) 28%,var(--c) 62%,var(--d) 100%);box-shadow:0 2px 2px rgba(0,0,0,.45)}
.zgpw .bd{position:absolute;left:8%;bottom:0;width:84%;height:50%;border-radius:45% 45% 50% 50%/25% 25% 75% 75%;background:linear-gradient(90deg,var(--d),var(--c) 30%,#fff 44%,var(--c) 58%,var(--d));box-shadow:0 3px 3px rgba(0,0,0,.45)}
.zgpw.go{pointer-events:auto;cursor:pointer;animation:zgbob 1s infinite}
@keyframes zgbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.zgl-turn{position:absolute;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:14px solid #facc15;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4));animation:zgarrow .9s infinite;z-index:4}
@keyframes zgarrow{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
.zgl-players{width:100%;max-width:440px;display:grid;grid-template-columns:1fr 1fr;gap:8px;box-sizing:border-box}
.zgl-card{background:rgba(0,0,0,.32);border-radius:16px;padding:8px;display:grid;gap:6px;justify-items:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.zgl-card.on{outline:2px solid #facc15;background:rgba(0,0,0,.45)}
.zgl-ct{display:flex;align-items:center;gap:6px;font-size:13px;width:100%}
.zgl-ct i{width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:inset -2px -2px 3px rgba(0,0,0,.35)}
.zgl-ct b{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zgl-ct span{opacity:.8;font-size:12px}
.zgl-cr{display:flex;justify-content:center}
.zgl-cc{min-height:18px;width:100%}
.zgl-act{width:100%;max-width:440px;box-sizing:border-box}
.zgcube-wrap{width:58px;height:58px;perspective:340px;display:inline-block;margin:6px}
.zgcube-wrap.sm{width:42px;height:42px;margin:2px}
.zgcube-wrap.rollable{cursor:pointer}
.zgcube-wrap.rollable .zgcube{animation:zgglow 1.2s infinite}
@keyframes zgglow{0%,100%{filter:drop-shadow(0 0 0 rgba(255,210,63,0))}50%{filter:drop-shadow(0 0 8px rgba(255,210,63,.9))}}
.zgcube{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .2s}
.zgcf{position:absolute;inset:0;border-radius:14%;background:linear-gradient(145deg,#ffffff,#e4e4e4);box-shadow:inset 0 -3px 0 rgba(0,0,0,.12),inset 0 0 0 1px rgba(0,0,0,.05);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:16%;box-sizing:border-box;backface-visibility:hidden}
.zgcf i{border-radius:50%}
.zgcf i.p{background:radial-gradient(circle at 35% 30%,#777,#111 70%)}
.zgcube-wrap:not(.sm) .zgcf{}
.f1{transform:translateZ(calc(58px / 2))}.f6{transform:rotateY(180deg) translateZ(calc(58px / 2))}.f3{transform:rotateY(90deg) translateZ(calc(58px / 2))}.f4{transform:rotateY(-90deg) translateZ(calc(58px / 2))}.f2{transform:rotateX(90deg) translateZ(calc(58px / 2))}.f5{transform:rotateX(-90deg) translateZ(calc(58px / 2))}
.zgcube-wrap.sm .f1{transform:translateZ(21px)}.zgcube-wrap.sm .f6{transform:rotateY(180deg) translateZ(21px)}.zgcube-wrap.sm .f3{transform:rotateY(90deg) translateZ(21px)}.zgcube-wrap.sm .f4{transform:rotateY(-90deg) translateZ(21px)}.zgcube-wrap.sm .f2{transform:rotateX(90deg) translateZ(21px)}.zgcube-wrap.sm .f5{transform:rotateX(-90deg) translateZ(21px)}
.zg-menu{position:fixed;inset:0;z-index:10090;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.zg-menu .sheet{background:#16181f;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));width:100%;max-width:520px;display:grid;gap:10px;max-height:86vh;overflow:auto;box-sizing:border-box}
.zg-menu h3{margin:0 0 4px;font-size:1.1rem}
.zg-menu .opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:0;color:#fff;text-align:left;font:700 15px system-ui,sans-serif;cursor:pointer}
.zg-menu .opt small{display:block;font-weight:500;opacity:.7;font-size:12px;margin-top:2px}
.zg-inbox{padding:4px 16px 30px;display:grid;gap:8px}
.zg-inbox .opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:0;color:#fff;text-align:left;font:700 15px system-ui,sans-serif;cursor:pointer}
.zg-inbox .opt small{display:block;font-weight:500;opacity:.8;font-size:12px}
.zg-btn{border:0;border-radius:14px;padding:12px 18px;background:#8b6cff;color:#fff;font-weight:800;box-shadow:0 5px 0 #4b35a3;cursor:pointer;min-width:120px}
.zg-btn.ghost{background:#2b3046;box-shadow:0 5px 0 #14172a}
#zgame .zg-end,.zg-end{position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;overflow:auto}
.zg-end>div,.zg-endcard{background:linear-gradient(#262b44,#161a2c);border-radius:24px;padding:22px;display:grid;gap:12px;width:min(88vw,340px);text-align:center;box-shadow:0 14px 0 #0b0d18,0 30px 50px rgba(0,0,0,.6);animation:zgpop .35s cubic-bezier(.3,1.4,.6,1);box-sizing:border-box}
.zg-end b{font-size:22px}
.zg-trophy{justify-self:center;animation:zgtrophy 1.1s cubic-bezier(.3,1.5,.5,1) both}
.zg-trophy svg{filter:drop-shadow(0 8px 10px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(250,204,21,.55))}
@keyframes zgtrophy{0%{transform:translateY(-40px) scale(.4) rotate(-12deg);opacity:0}60%{transform:translateY(6px) scale(1.08) rotate(3deg);opacity:1}100%{transform:none}}
@keyframes zgpop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
#zgfx{position:fixed;inset:0;width:100%;height:100%;z-index:10110;pointer-events:none}
.zgt-board.thinking{opacity:.62;filter:saturate(.7);transition:opacity .2s}
.zgt-board.thinking .zgt-c{cursor:default}
/* ---- échecs : plateau en bois, pièces réalistes, points bleus, captures agrandies ---- */
.zgc-frame{background:linear-gradient(135deg,#7a3314,#4a1a08 45%,#8a3d1a 70%,#3d1405);box-shadow:inset 0 0 0 2px rgba(255,220,160,.25),inset 0 0 0 5px #5a2410,inset 0 0 0 7px rgba(212,160,90,.5),0 18px 34px rgba(0,0,0,.55)}
.zgc-board{box-shadow:inset 0 0 0 2px #2a0e03,0 0 0 1px rgba(0,0,0,.4)}
.zgc-sq.lt{background:repeating-linear-gradient(88deg,rgba(120,70,30,.05) 0 2px,transparent 2px 7px),repeating-linear-gradient(2deg,rgba(255,255,255,.05) 0 1px,transparent 1px 5px),linear-gradient(135deg,#f0dcb4,#dcbc8a)}
.zgc-sq.dk{background:repeating-linear-gradient(88deg,rgba(40,15,0,.12) 0 2px,transparent 2px 6px),repeating-linear-gradient(2deg,rgba(255,220,170,.06) 0 1px,transparent 1px 4px),linear-gradient(135deg,#9a5a2c,#6e3a18)}
.zgc-sq.to::before{content:"";position:absolute;left:50%;top:50%;width:30%;height:30%;margin:-15% 0 0 -15%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8fd0ff,#2f7de1 60%,#1a57b0);box-shadow:0 1px 3px rgba(0,0,0,.5);z-index:2;pointer-events:none}
.zgc-sq.to{box-shadow:none}
.zgc-sq.cap{box-shadow:inset 0 0 0 4px rgba(47,125,225,.95)}
.zgc-sq.cap::before{display:none}
.zgc-sq.lastt::after,.zgc-sq.lastf::after{background:rgba(250,204,21,.28)}
.zgp{font-size:0;line-height:0;padding:7%;box-sizing:border-box;filter:drop-shadow(0 3px 2px rgba(0,0,0,.55))}
.zgp svg{width:100%;height:100%;overflow:visible;display:block}
.zgp svg *{stroke-width:1.1;stroke-linejoin:round;stroke-linecap:round}
.zgp.w svg{fill:#fbf7ee;stroke:#6b5a44}
.zgp.w svg .eye,.zgp.w svg .slit{fill:none}
.zgp.w svg .slit{stroke:#6b5a44;fill:none}
.zgp.b svg{fill:#2a1a10;stroke:#0c0604}
.zgp.b svg .eye{fill:#c9a878;stroke:none}
.zgp.b svg .slit{stroke:#c9a878;fill:none}
.zgp.w svg rect,.zgp.b svg rect{fill:inherit}
.zgp.w svg rect:last-child,.zgp.b svg rect:last-child{fill:inherit}
.zgp.w svg{filter:drop-shadow(0 0 0 transparent)}
.zgcap .cg{width:34px;height:34px;padding:2px;box-sizing:border-box;display:inline-block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
.zgcap .cg svg{width:100%;height:100%;display:block}
.zgcap .cg.w svg{fill:#fbf7ee;stroke:#6b5a44;stroke-width:1.1}
.zgcap .cg.b svg{fill:#2a1a10;stroke:#0c0604;stroke-width:1.1}
.zgcap{gap:6px;min-height:38px}
/* ---- ludo : plateau proche des vidéos de référence ---- */
.zgl-board{background:#fff}
.zgl-cell{border:1px solid #2b2b2b;box-sizing:border-box}
.zgl-cell.track{border-color:#2b2b2b}
.zgl-cell.safe::after{content:"★";color:#2b2b2b;font-size:75%;background:none}
.zgl-cell.start{box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.zgl-cell.start::after{content:"➤";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:72%;text-shadow:0 1px 1px rgba(0,0,0,.45);transform:rotate(var(--arrow,0deg))}
.zgl-in{background:#fff;box-shadow:inset 0 0 0 2px #2b2b2b;border-radius:6px;left:16.67%;top:16.67%;width:66.67%;height:66.67%}
.zgl-in::before,.zgl-in::after{content:"";position:absolute;width:20%;height:20%;border-radius:50%;background:var(--c)}
.zgl-in::before{left:12%;top:12%;box-shadow:0 0 0 0 transparent}
.zgl-in::after{right:12%;bottom:12%}
.zgl-in{position:absolute}
.zgl-in{background:radial-gradient(circle at 26% 26%,var(--c) 0 9%,transparent 10%) ,radial-gradient(circle at 74% 26%,var(--c) 0 9%,transparent 10%),radial-gradient(circle at 26% 74%,var(--c) 0 9%,transparent 10%),radial-gradient(circle at 74% 74%,var(--c) 0 9%,transparent 10%),#fff}
.zgl-in::before,.zgl-in::after{display:none}
.zgpw .hd{box-shadow:0 0 0 1.5px #fff,0 1px 3px rgba(0,0,0,.5)}
.zgpw .bd{box-shadow:0 0 0 1.5px #fff,0 2px 3px rgba(0,0,0,.45)}
.zgl-qdie{position:absolute;z-index:5;transform:scale(.74);transform-origin:center;pointer-events:auto}
.zgl-qdie .zgcube-wrap{margin:0}
.zgl-qdie.zgl-q0{top:1%;left:1%}.zgl-qdie.zgl-q1{top:1%;right:1%}.zgl-qdie.zgl-q2{bottom:1%;right:1%}.zgl-qdie.zgl-q3{bottom:1%;left:1%}
.zgl-qlbl{position:absolute;z-index:5;font:700 9px/1.2 system-ui,sans-serif;color:#fff;background:var(--c);padding:2px 6px;border-radius:9px;white-space:nowrap;transform:translateX(-50%);box-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none}
.zgl-qlbl.zgl-q0{top:35%;left:20%}.zgl-qlbl.zgl-q1{top:35%;left:80%}
.zgl-qlbl.zgl-q2{top:61%;left:80%}.zgl-qlbl.zgl-q3{top:61%;left:20%}
.zgl-cell.safe::after{content:"☆";color:#2b2b2b;font-size:80%;font-weight:700;background:none}
.zgl-cell.start::after{content:"➤";font-size:70%}
/* ---- échecs : pièces classiques et plateau comme la photo de référence ---- */
.zgc-frame{background:linear-gradient(145deg,#5b2a14,#2e1408 55%,#6b3018);box-shadow:inset 0 0 0 1px rgba(255,220,170,.22),inset 0 0 0 4px #3e1b0b,inset 0 0 0 6px rgba(214,170,110,.45),0 18px 34px rgba(0,0,0,.55)}
.zgc-sq.lt{background:#f0d9b5}
.zgc-sq.dk{background:#b58863}
.zgc-sq.lt .zgc-rk,.zgc-sq.lt .zgc-fl{color:#b58863}
.zgc-sq.dk .zgc-rk,.zgc-sq.dk .zgc-fl{color:#f0d9b5}
.zgc-rk,.zgc-fl{position:absolute;font:700 clamp(8px,2.4vw,10px)/1 system-ui,sans-serif;font-style:normal;z-index:2;pointer-events:none}
.zgc-rk{left:3px;top:2px}.zgc-fl{right:3px;bottom:2px}
.zgp{filter:drop-shadow(0 3px 2px rgba(0,0,0,.42))}
.zgp svg *{stroke-linejoin:round;stroke-linecap:round;stroke-width:1.1}
.zgp.w svg path,.zgp.w svg circle,.zgp.w svg rect{fill:#fdfbf6;stroke:#6e6256}
.zgp.w svg .pb{fill:#ece4d0;stroke:#6e6256}
.zgp.w svg .eye{fill:#3b3026;stroke:none}
.zgp.w svg .slit{fill:none;stroke:#b7a68a;stroke-width:1.3}
.zgp.b svg path,.zgp.b svg circle,.zgp.b svg rect{fill:#3b2d24;stroke:#0c0806}
.zgp.b svg .pb{fill:#2a1f19;stroke:#0c0806}
.zgp.b svg .eye{fill:#e2c99c;stroke:none}
.zgp.b svg .slit{fill:none;stroke:#8a6d48;stroke-width:1.3}
.zgcap .cg{width:34px;height:34px}
.zgcap .cg.w svg path,.zgcap .cg.w svg circle,.zgcap .cg.w svg rect{fill:#fdfbf6;stroke:#6e6256}
.zgcap .cg.b svg path,.zgcap .cg.b svg circle,.zgcap .cg.b svg rect{fill:#3b2d24;stroke:#0c0806}
/* ---- cartes joueurs (avatar, nom, chiffre en direct, pièces prises) ---- */
.zgp-row{width:100%;max-width:430px;display:flex;justify-content:center}
.zg-pl{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:6px 12px;width:100%;max-width:430px;box-sizing:border-box;padding:10px 12px;border-radius:20px;color:#fff;background:linear-gradient(145deg,rgba(255,255,255,.13),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 12px 26px rgba(0,0,0,.32);transition:box-shadow .25s,border-color .25s}
.zg-pl.on{border-color:var(--c,#facc15);box-shadow:0 0 0 2px var(--c,#facc15),0 0 24px -4px var(--c,#facc15)}
.zgpa{width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none;background:#1a1d2e;box-shadow:0 0 0 2px var(--c,#888),0 5px 12px rgba(0,0,0,.45)}
.zgpa svg{display:block}
.zgpa-ini{display:grid;place-items:center;width:100%;height:100%;font-weight:800;font-size:18px;color:#fff;background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.55),transparent 42%),var(--c,#6366f1)}
.zgpa-bot{font-size:24px;background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.5),transparent 42%),linear-gradient(145deg,#2b3150,#121528)}
.zgpi{display:flex;flex-direction:column;min-width:0;flex:1}
.zgpi b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zgpi small{font-size:12px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zgpcap{flex-basis:100%;display:flex;justify-content:center;min-height:0}
.zgpcap:empty{display:none}
.zgpcap .zgcap{min-height:34px}
.zgpcap .zgcap.empty{display:none}

.zgpw svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))}
.zgl-cell.safe::after,.zgl-cell.star::after{content:"☆";position:absolute;inset:0;display:grid;place-items:center;color:#1f2937;font-size:85%;font-weight:700;background:none}
.zgl-cell.star{background:#fff}
.zgpw::before{content:"";position:absolute;left:12%;right:12%;bottom:-6%;height:24%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(0,0,0,0));z-index:-1;pointer-events:none}
.zgpw{filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.zgl-qlbl b{font-weight:900;margin:0 1px}
.zgl-qlbl{padding:3px 8px;box-shadow:0 2px 0 rgba(0,0,0,.25),0 0 0 1.5px rgba(255,255,255,.9)}
.zgl-qdie .zgcube-wrap{box-shadow:0 6px 10px rgba(0,0,0,.35)}
.zgl-spark{position:absolute;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px var(--c),0 0 2px #fff;pointer-events:none;z-index:6;opacity:0;animation:zgsparkle 1s ease-out forwards}
@keyframes zgsparkle{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}}
@media (prefers-reduced-motion:reduce){.zgl-spark{display:none}}
.zgl-pwrap{position:relative}.zgl-players{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.zgl-pwrap{min-width:0}.zgl-pwrap .zg-pl{padding-right:58px;min-width:0}.zgl-pwrap .zgpi{min-width:0}.zgl-pwrap .zgpi small{white-space:normal;line-height:1.35}.zgl-pwrap .zgpi b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.zgl-pdie{position:absolute;right:4px;top:50%;transform:translateY(-50%) scale(.5);transform-origin:center;pointer-events:auto;z-index:2}
.zgl-pdie .zgcube-wrap{margin:0}
.zgl-hole{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 45%,var(--d) 0 55%,#000 100%);box-shadow:inset 0 2px 3px rgba(0,0,0,.45),0 0 0 1.5px #fff;pointer-events:none;z-index:1}
.zg-snd{width:40px;height:40px;flex:none;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 10px rgba(0,0,0,.25)}
.zg-snd svg{width:20px;height:20px}.zg-snd.off{opacity:.6}
.zg-head{display:flex;align-items:center;gap:12px}.zg-head>div:nth-child(2){flex:1;min-width:0}
.zgc-frame{background:linear-gradient(160deg,#0c1a3f,#06102a 60%,#0b1c46);box-shadow:0 0 0 2px #3EE6FF,0 0 18px rgba(62,230,255,.55),0 0 46px rgba(62,230,255,.22),inset 0 0 22px rgba(62,230,255,.14)}
.zgc-board{border-radius:12px;box-shadow:inset 0 0 0 2px #3EE6FF}
.zgc-sq.lt{background:linear-gradient(135deg,#eaf6ff,#bfe0fb)}
.zgc-sq.dk{background:linear-gradient(135deg,#1a3a7a,#0b1d47)}
.zgc-sq.lt .zgc-rk,.zgc-sq.lt .zgc-fl{color:#1b3f86}
.zgc-sq.dk .zgc-rk,.zgc-sq.dk .zgc-fl{color:#7fdcff}
.zgc-sq.sel{box-shadow:inset 0 0 0 3px #3EE6FF,inset 0 0 14px rgba(62,230,255,.6)}
.zgc-sq.to::before{background:radial-gradient(circle at 35% 30%,#e6fbff,#3EE6FF 60%,#0aa9c9);box-shadow:0 0 8px rgba(62,230,255,.9)}
.zgc-sq.cap{box-shadow:inset 0 0 0 4px #3EE6FF,inset 0 0 14px rgba(62,230,255,.5)}
.zgc-sq.lastt::after,.zgc-sq.lastf::after{background:rgba(62,230,255,.16)}
.zgp.w{text-shadow:none}.zgp.b{text-shadow:none}
.zgp.w svg{fill:#13285e;stroke:#ffffff;stroke-width:1.3px;filter:drop-shadow(0 0 3px rgba(255,255,255,.75))}
.zgp.b svg{fill:#060f2b;stroke:#3EE6FF;stroke-width:1.3px;filter:drop-shadow(0 0 4px rgba(62,230,255,.95))}
.zgp.w svg .slit{stroke:#9fd8ff}
.zgp.b svg .eye{fill:#3EE6FF;stroke:none}
.zgp.b svg .slit{stroke:#3EE6FF}
.zgc-sq,.zgcube-wrap,.zgpw,[data-zg],[data-zgroll],[data-zgc]{touch-action:manipulation}
`;

  window.ZGUI = { open: open, menu: menu, close: close, adopt: adopt, current: function () { return G; }, pickFor: pickFor };
})();
