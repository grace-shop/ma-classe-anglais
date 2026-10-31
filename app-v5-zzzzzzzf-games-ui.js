/* =====================================================================
   v5 · Jeux : pages plein écran (portrait).
   Hub (4 jeux) -> réglages -> choix de la couleur -> partie.
   Échecs et moulin : plateau en bois, pièces 3D. Ludo : plateau classique,
   pions 3D, un dé 3D par joueur (l'IA aussi). 
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

  var NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", rope: "Rope Bros" };
  var GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
  /* Pièces d'échecs : silhouettes classiques à contour fin (jeu "cburnett" de Colin M. L. Burnett,
     licence BSD / GPL v2+). F = couleur de remplissage, D = couleur des traits de détail. */
  var G0 = ' stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
  var PIECES = {
    P: function (F) {
      return '<path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="' + F + '"' + G0 + '/>';
    },
    R: function (F, D, white) {
      return '<g fill="' + F + '" fill-rule="evenodd"' + G0 + '>' +
        '<path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/>' +
        '<path d="M34 14l-3 3H14l-3-3"/>' +
        '<path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/>' +
        '<path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>' +
        '<path d="M11 14h23" fill="none" stroke="' + D + '" stroke-linejoin="miter"/>' +
        (white ? '' : '<path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17" fill="none" stroke="' + D + '" stroke-width="1" stroke-linejoin="miter"/>') +
        '</g>';
    },
    B: function (F, D) {
      return '<g fill="none" fill-rule="evenodd"' + G0 + '>' +
        '<g fill="' + F + '" stroke-linecap="butt">' +
        '<path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>' +
        '<path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>' +
        '<path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g>' +
        '<path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="' + D + '" stroke-linejoin="miter"/></g>';
    },
    N: function (F, D) {
      return '<g fill="none" fill-rule="evenodd"' + G0 + '>' +
        '<path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="' + F + '"/>' +
        '<path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="' + F + '"/>' +
        '<path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="' + D + '" stroke="' + D + '"/></g>';
    },
    Q: function (F, D) {
      return '<g fill="' + F + '"' + G0 + '>' +
        '<path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/>' +
        '<path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" stroke-linecap="butt"/>' +
        '<path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/>' +
        '<path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" stroke="' + D + '"/></g>';
    },
    K: function (F, D) {
      return '<g fill="none"' + G0 + '>' +
        '<path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>' +
        '<path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="' + F + '" stroke-linecap="butt" stroke-linejoin="miter"/>' +
        '<path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="' + F + '"/>' +
        '<path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="' + D + '"/></g>';
    }
  };
  function chessPieceSVG(letter, white) {
    var k = letter.toUpperCase(), fn = PIECES[k];
    if (!fn) return "";
    return '<svg viewBox="0 0 45 45" aria-hidden="true">' + fn(white ? "#f4f2ee" : "#383a3e", white ? "#000" : "#e9e9e9", white) + '</svg>';
  }
  var DIFF = { easy: { chess: 1, morris: 1, ludo: 0 }, medium: { chess: 2, morris: 3, ludo: 1 }, hard: { chess: 3, morris: 5, ludo: 2 } };
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
        card("rope", "Rope Bros", "Two friends, one rope", '<div class="pv pv-rope">' + (window.ZRope && window.ZRope.pic ? window.ZRope.pic() : "") + '</div>') +
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
        ('<div class="zg-label">Level</div><div class="seg">' + [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(function (d) { return '<button class="' + (SEL.diff === d[0] ? "on" : "") + '" data-zgs="diff" data-v="' + d[0] + '">' + d[1] + '</button>'; }).join("") + '</div>') +
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
        cols[1] = game === "ludo" && need === 2 ? (cols[0] + 2) % 4 : rest[Math.floor(Math.random() * rest.length)].id;
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
    if (G.game === "morris") return st.turn - 1;
    return st.turn;
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
  function refreshSnd() {
    document.querySelectorAll("[data-zg=\"snd\"]").forEach(function (el) { el.outerHTML = sndBtn(); });
  }
  function humanTurn() { return G && !G.over && !G.rolling && isMyTurn() && !isAiTurn(); }

  function schedule() {
    clearTimeout(TIMER); TIMER = 0;
    if (!G || G.over) return;
    if (isAiTurn()) TIMER = setTimeout(aiMove, 520);
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
    } else if (G.game === "ludo") {
      if (!G.st.dice) { rollAnimated(function () { TIMER = setTimeout(aiMove, 450); }); return; }
      var lm = ZG.ludo.pick(G.st, d.ludo);
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
      (G.mode === "online" ? '<button class="zg-big" data-zg="rematch">Play again</button>' : '<button class="zg-big" data-zg="again">Play again</button>') +
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
    var body = G.game === "chess" ? chessHTML(anim) : G.game === "morris" ? morrisHTML(anim) : ludoHTML();
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
    if (isAiTurn()) return "The computer is playing…";
    if (G.rolling) return "Rolling…";
    if (G.mode === "local") return G.st.dice ? "Player " + (G.st.turn + 1) + ": choose a pawn" : "Player " + (G.st.turn + 1) + ": roll your dice";
    return G.st.dice ? "Your turn · tap a glowing pawn" : "Your turn · tap your dice";
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
      if (p && p.toUpperCase() === "K" && ZG.chess.white(p) === (st.turn === "w") && ZG.chess.inCheck(st, st.turn)) cls += " chk";
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

  /* ---- ludo ---- */
  // The board is turned so that the person holding the phone always sits at the bottom left,
  // like in the Ludo apps. ROT = number of quarter turns (clockwise) applied to the whole board.
  var ROT = 0;
  function rotPt(x, y) { for (var i = 0; i < ROT; i++) { var nx = 15 - y; y = x; x = nx; } return [x, y]; }
  // top-left corner (x = column, y = row, in cell units) of a logical cell once the board is turned
  function cellTL(r, c) { var p = rotPt(c + 0.5, r + 0.5); return [p[0] - 0.5, p[1] - 0.5]; }
  function ludoRot() {
    if (!G || G.game !== "ludo" || G.mode === "local" || !G.st || !G.st.corner) return 0;
    var c = G.st.corner[G.you];
    return c == null ? 0 : (3 - c + 4) % 4;
  }
  function ludoCell(c, p) {
    if (p < 0) return null;
    if (p <= 50) return LUDO_TRACK[(c * 13 + p) % 52];
    if (p <= 55) return LUDO_HOMES[c][p - 51];
    return [7, 7];
  }
  function cellAt(tl, cls, style) {
    return '<div class="zgl-cell ' + cls + '" style="left:' + (tl[0] * CELL).toFixed(3) + '%;top:' + (tl[1] * CELL).toFixed(3) + '%;' + (style || "") + '"></div>';
  }
  // direction of travel (degrees) at track square g, seen on the turned board
  function arrowDeg(g) {
    var a = LUDO_TRACK[g], b = LUDO_TRACK[(g + 1) % 52];
    var pa = rotPt(a[1] + 0.5, a[0] + 0.5), pb = rotPt(b[1] + 0.5, b[0] + 0.5);
    return Math.round(Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180 / Math.PI);
  }
  // logical side of the centre occupied by each corner's triangle: 0 top, 1 right, 2 bottom, 3 left
  var CENTRE_SIDE = [3, 0, 1, 2];
  var CENTRE_TRI = ["M0 0 L100 0 L50 50Z", "M100 0 L100 100 L50 50Z", "M100 100 L0 100 L50 50Z", "M0 100 L0 0 L50 50Z"];
  function ludoCentreSVG() {
    var out = '<svg class="zgl-center" viewBox="0 0 100 100" preserveAspectRatio="none">';
    for (var c = 0; c < 4; c++) out += '<path d="' + CENTRE_TRI[(CENTRE_SIDE[c] + ROT) % 4] + '" fill="' + CORNER[c].hex + '"/>';
    return out + '<path d="M0 0L100 100M100 0L0 100" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" fill="none"/></svg>';
  }
  function ludoPanel(k, mineTurn) {
    var st = G.st, c = st.corner[k], hex = CORNER[c].hex;
    var vc = (c + ROT) % 4, left = vc === 0 || vc === 3;
    var on = st.turn === k && !G.over;
    var canRoll = on && mineTurn && !st.dice && !G.rolling;
    var val = st.dice && st.turn === k && !G.rolling ? st.dice : G.lastDie[k];
    var home = st.tok[k].filter(function (x) { return x === 56; }).length;
    var av = '<div class="zgl-av"><div class="zgpa" style="--c:' + hex + '">' + avatarHTML(k, hex) + '</div><div class="zgpi"><b>' + esc(nameForSide(k)) + '</b><small>' + home + ' / 4 home</small></div></div>';
    var die = '<div class="zgl-dbox' + (on ? " on" : "") + (canRoll ? " roll" : "") + '">' + cubeHTML("q" + k, val, "sm", canRoll) + '</div>';
    return { vc: vc, html: '<div class="zgl-pl ' + (left ? "l" : "r") + (on ? " on" : "") + '" style="--c:' + hex + '">' + (left ? av + die : die + av) + '</div>' };
  }
  function ludoHTML() {
    var st = G.st, n = st.n;
    ROT = ludoRot();
    var mineTurn = isMyTurn() && !isAiTurn();
    var moves = st.dice && !G.rolling ? ZG.ludo.moves(st, st.dice) : [];
    // the four yards, each with its four round places
    var quads = LUDO_QUAD.map(function (q, c) {
      var a = rotPt(q[1], q[0]), b = rotPt(q[1] + 6, q[0] + 6);
      return '<div class="zgl-quad" style="left:' + (Math.min(a[0], b[0]) * CELL).toFixed(3) + '%;top:' + (Math.min(a[1], b[1]) * CELL).toFixed(3) + '%;--c:' + CORNER[c].hex + '"><div class="zgl-in"></div></div>';
    }).join("");
    var holes = "";
    for (var hc = 0; hc < 4; hc++) for (var ht = 0; ht < 4; ht++) {
      var hp = homeDot(hc, ht);
      holes += '<i class="zgl-hole" style="left:' + (hp[0] * CELL - HOLE / 2).toFixed(3) + '%;top:' + (hp[1] * CELL - HOLE / 2).toFixed(3) + '%;width:' + HOLE + '%;height:' + HOLE + '%;--c:' + CORNER[hc].hex + '"></i>';
    }
    // the white path, the coloured start squares (with an arrow), the stars and the coloured home lanes
    var cells = "";
    LUDO_TRACK.forEach(function (rc, g) {
      var tl = cellTL(rc[0], rc[1]);
      if (g % 13 === 0) cells += cellAt(tl, "track start", "background-color:" + CORNER[g / 13].hex + ";--arrow:" + arrowDeg(g) + "deg");
      else cells += cellAt(tl, "track" + (LUDO_STAR[g] ? " star" : ""));
    });
    LUDO_HOMES.forEach(function (list, c) { list.forEach(function (rc) { cells += cellAt(cellTL(rc[0], rc[1]), "home", "background-color:" + CORNER[c].hex); }); });
    // squares a pawn can reach with this roll
    var tgts = "";
    if (mineTurn && st.dice && !G.rolling) {
      var kc = st.corner[st.turn];
      moves.forEach(function (m) {
        if (m.to >= 56) return;
        var rc = ludoCell(kc, m.to), tl = cellTL(rc[0], rc[1]);
        tgts += '<i class="zgl-tgt" style="left:' + (tl[0] * CELL).toFixed(3) + '%;top:' + (tl[1] * CELL).toFixed(3) + '%;--c:' + CORNER[kc].hex + '"></i>';
      });
    }
    // pawns: pawns sharing one square are set side by side so every one of them stays visible
    var items = [], groups = {};
    for (var k = 0; k < n; k++) {
      var c = st.corner[k];
      for (var t = 0; t < 4; t++) {
        var p = st.tok[k][t], rc2 = p < 0 ? LUDO_BASE[c][t] : ludoCell(c, p);
        if (!rc2) continue;
        var can = mineTurn && st.turn === k && st.dice && !G.rolling && moves.some(function (m) { return m.t === t; });
        var ctr = pawnCentre(c, t, p, rc2);
        var it = { k: k, t: t, c: c, ctr: ctr, can: can, dx: 0, dy: 0, s: 1 };
        items.push(it);
        if (p >= 0 && p < 56) { var key = ctr[0].toFixed(2) + "," + ctr[1].toFixed(2); (groups[key] = groups[key] || []).push(it); }
      }
    }
    Object.keys(groups).forEach(function (key) {
      var g = groups[key], m = g.length;
      if (m < 2) return;
      g.forEach(function (it, i) {
        if (m === 2) { it.dx = (i ? 0.24 : -0.24); it.s = 0.88; }
        else if (m === 3) { it.dx = [-0.28, 0.28, 0][i]; it.dy = [0.06, 0.06, -0.2][i]; it.s = 0.8; }
        else { it.dx = (i % 2 ? 0.24 : -0.24); it.dy = (i < 2 ? -0.2 : 0.2); it.s = 0.72; }
      });
    });
    var toks = items.map(function (it) {
      var w = PAW_W * it.s, h = PAW_H * it.s, x = it.ctr[0] + it.dx, y = it.ctr[1] + it.dy;
      return pawnHTML("T" + it.k + it.t, CORNER[it.c], x * CELL - w / 2, y * CELL - h / 2, w, h, 3 + Math.floor(y), it.can ? it.t : -1);
    }).join("");
    // the players: the two top corners above the board, the two bottom corners below it
    var panels = [];
    for (var q = 0; q < n; q++) panels.push(ludoPanel(q, mineTurn));
    var top = panels.filter(function (x) { return x.vc <= 1; }).sort(function (a, b) { return a.vc - b.vc; });
    var bot = panels.filter(function (x) { return x.vc >= 2; }).sort(function (a, b) { return b.vc - a.vc; });
    var rowOf = function (list) { return '<div class="zgl-row' + (list.length > 1 ? " two" : "") + '">' + list.map(function (x) { return x.html; }).join("") + '</div>'; };
    var board = '<div class="zgl-frame"><div class="zgl-board">' + quads + cells + holes + ludoCentreSVG() + tgts + toks + '</div></div>';
    var action;
    if (mineTurn && st.dice && !G.rolling && !moves.length) action = '<button class="zg-big alt" data-zg="pass">No move — pass</button>';
    else action = '<div class="zg-info">' + (mineTurn && st.dice && !G.rolling ? "Tap a glowing pawn to move it." : (isAiTurn() ? "The computer rolls its own dice." : "")) + '</div>';
    return rowOf(top) + board + rowOf(bot) + '<div class="zgl-act">' + action + '</div>' +
      '<div class="zg-info">Roll a six to bring a pawn out. Land on an opponent to send it back. A six, a capture or a pawn reaching home gives another turn. Stars and coloured squares are safe.</div>';
  }
  // size of a pawn (% of the board): it fits in a square and in a round place of the yard
  var PAW_W = 5.6, PAW_H = 7.8, HOLE = 9;
  // where a pawn that reached home waits: in the triangle of its colour (logical cell units, spread along the triangle)
  var CENTRE_SPOT = [[6.8, 7.5], [7.5, 6.8], [8.2, 7.5], [7.5, 8.2]];
  // centre of the pawn on the turned board, in cell units
  function pawnCentre(c, t, p, rc) {
    if (p < 0) return homeDot(c, t);                                  // round place of its yard
    if (p === 56) {                                                   // arrived: triangle of its colour
      var s = CENTRE_SPOT[c], off = (t - 1.5) * 0.2;
      return rotPt(s[0] + (c % 2 === 0 ? 0 : off), s[1] + (c % 2 === 0 ? off : 0));
    }
    return rotPt(rc[1] + 0.5, rc[0] + 0.5);                           // square of the path or of the home lane
  }
  // the four round places of each yard (one per pawn): x = column, y = row of the grid lines
  var HOME_DOTS = [[2, 2], [4, 2], [2, 4], [4, 4]];
  function homeDot(c, t) {
    var q = LUDO_QUAD[c], d = HOME_DOTS[t];
    return rotPt(q[1] + d[0], q[0] + d[1]);
  }
  // pawn shaped like a game piece: round head, flared foot, white outline
  var PAWN_SVG = '<svg viewBox="0 0 20 28" aria-hidden="true"><path d="M7.4 13.2 C6.6 16.2 4.2 18.6 3.6 22.2 C3.1 25 4.6 26.6 7.4 26.6 L12.6 26.6 C15.4 26.6 16.9 25 16.4 22.2 C15.8 18.6 13.4 16.2 12.6 13.2 Z" fill="var(--c)" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/><circle cx="10" cy="8.2" r="6.3" fill="var(--c)" stroke="#fff" stroke-width="1.3"/><ellipse cx="7.6" cy="6" rx="1.9" ry="1.3" fill="#fff" opacity=".8"/><path d="M5.6 22.8 C6.4 23.4 7.4 23.8 8.4 23.9" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1" stroke-linecap="round"/></svg>';
  function pawnHTML(fid, col, left, top, w, h, z, goIdx) {
    return '<div class="zgpw' + (goIdx >= 0 ? " go" : "") + '" data-fid="' + fid + '" ' + (goIdx >= 0 ? 'data-zgtok="' + goIdx + '"' : "") +
      ' style="left:' + left.toFixed(3) + '%;top:' + top.toFixed(3) + '%;width:' + w.toFixed(3) + '%;height:' + h.toFixed(3) + '%;z-index:' + z + ';--c:' + col.hex + ';--d:' + col.dark + '">' + PAWN_SVG + '</div>';
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
        var a = lud ? el.animate([
          { transform: "translate(" + dx + "px," + dy + "px)" },
          { transform: "translate(0,0)" }
        ], { duration: 220, easing: "ease-out" }) : el.animate([
          { transform: "translate(" + dx + "px," + dy + "px)" },
          { transform: "translate(" + dx / 2 + "px," + (dy / 2 - 14) + "px)", offset: 0.5 },
          { transform: "translate(0,0)" }
        ], { duration: 420, easing: "cubic-bezier(.3,.7,.4,1)" });
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
      var x = parseFloat(el.style.left) + parseFloat(el.style.width) / 2, y = parseFloat(el.style.top) + parseFloat(el.style.height) / 2;
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
    if ((b = t.closest("[data-zgh]"))) {
      e.preventDefault();
      var gid = b.getAttribute("data-zgh");
      if (gid === "rope" && window.ZRope) { G = null; clearTimeout(TIMER); TIMER = 0; window.ZRope.open(host()); return; }
      setup(gid); return;
    }
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
      if (G.game === "chess") chessTap(i); else if (G.game === "morris") morrisTap(i);
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
@keyframes zgdraw{to{stroke-dashoffset:0}}
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
/* ---- échecs : plateau en bois, pièces réalistes, points bleus, captures agrandies ---- */
/* ---- échecs : pièces classiques et plateau comme la photo de référence ---- */
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

@keyframes zgsparkle{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}}
.zg-snd{width:40px;height:40px;flex:none;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 10px rgba(0,0,0,.25)}
.zg-snd svg{width:20px;height:20px}.zg-snd.off{opacity:.6}
.zg-head{display:flex;align-items:center;gap:12px}.zg-head>div:nth-child(2){flex:1;min-width:0}
/* ---- ludo : plateau en croix comme les applications Ludo ---- */
#zgame.game.ludo{background:radial-gradient(ellipse at 50% 0%,#2257c9 0,#123a8f 38%,#071a4d 100%)}
#zgame.game.ludo::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:repeating-conic-gradient(from 45deg at 50% 50%,rgba(255,255,255,.04) 0 25%,transparent 0 50%) 0 0/44px 44px}
#zgame.game.ludo .zg-body{padding:8px 6px 26px;gap:8px}
.zgl-row{width:100%;max-width:470px;min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;box-sizing:border-box;padding:0 4px}
.zgl-pl{display:flex;align-items:center;gap:8px;min-width:0;padding:4px 6px;border-radius:18px;transition:background .2s,box-shadow .2s}
.zgl-pl.l{margin-right:auto}.zgl-pl.r{margin-left:auto}
.zgl-pl.on{background:rgba(255,255,255,.1);box-shadow:0 0 0 2px var(--c),0 0 18px -2px var(--c)}
.zgl-av{display:flex;align-items:center;gap:8px;min-width:0}
.zgl-av .zgpa{width:42px;height:42px}
.zgl-av .zgpi b{font-size:14px;max-width:84px}
.zgl-av .zgpi small{font-size:11px}
.zgl-dbox{position:relative;flex:none;width:60px;height:60px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(160deg,#25407f,#0e1c46);box-shadow:inset 0 0 0 2px rgba(120,170,255,.35),0 4px 10px rgba(0,0,0,.4)}
.zgl-dbox.on{box-shadow:inset 0 0 0 2px #8fe6ff,0 0 16px rgba(120,220,255,.6)}
.zgl-dbox .zgcube-wrap{margin:0}
.zgl-dbox:not(.on) .zgcube-wrap{opacity:.55}
.zgl-dbox.roll::after{content:"";position:absolute;top:50%;width:0;height:0;margin-top:-11px;border-top:11px solid transparent;border-bottom:11px solid transparent}
.zgl-pl.l .zgl-dbox.roll::after{right:-21px;border-right:15px solid #ffd23f;animation:zglpl .8s ease-in-out infinite}
.zgl-pl.r .zgl-dbox.roll::after{left:-21px;border-left:15px solid #ffd23f;animation:zglpr .8s ease-in-out infinite}
@keyframes zglpl{50%{transform:translateX(5px)}}
@keyframes zglpr{50%{transform:translateX(-5px)}}
.zgl-frame{width:100%;max-width:470px;padding:0;box-sizing:border-box;border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,.5)}
.zgl-board{position:relative;width:100%;aspect-ratio:1;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 0 0 3px #0b1c4d}
.zgl-quad{position:absolute;width:40%;height:40%;background:var(--c)}
.zgl-in{position:absolute;left:16.67%;top:16.67%;width:66.67%;height:66.67%;background:#fff;border-radius:6px;box-shadow:inset 0 0 0 2px rgba(0,0,0,.18)}
.zgl-hole{position:absolute;z-index:1;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.5),transparent 38%),var(--c);box-shadow:inset 0 -3px 4px rgba(0,0,0,.28),0 0 0 1.5px rgba(0,0,0,.22)}
.zgl-cell{position:absolute;box-sizing:border-box;width:6.6667%;height:6.6667%;border:1px solid #8a96ad;background-color:#fff}
.zgl-cell.home{border-color:rgba(255,255,255,.6)}
.zgl-cell.star{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 5.9 20.9l1.3-6.7-5-4.7 6.8-.8z' fill='none' stroke='%23596579' stroke-width='1.7' stroke-linejoin='round'/%3E%3C/svg%3E");background-position:center;background-size:70%;background-repeat:no-repeat}
.zgl-cell.start{border-color:rgba(0,0,0,.25)}
.zgl-cell.start::after{content:"";position:absolute;inset:0;transform:rotate(var(--arrow,0deg));background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 12h13M12 5l7 7-7 7' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/62% no-repeat}
.zgl-center{position:absolute;left:40%;top:40%;width:20%;height:20%;z-index:1;display:block}
.zgl-tgt{position:absolute;width:6.6667%;height:6.6667%;z-index:2;pointer-events:none;border-radius:50%;box-sizing:border-box;box-shadow:inset 0 0 0 3px #ffd23f;background:rgba(255,210,63,.28);animation:zgtgt 1s ease-in-out infinite}
@keyframes zgtgt{50%{transform:scale(.8);opacity:.65}}
.zgpw{position:absolute;pointer-events:none;transform-origin:50% 100%}
.zgpw svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
.zgpw::before{content:"";position:absolute;left:8%;right:8%;bottom:-6%;height:24%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));z-index:-1;pointer-events:none}
.zgpw.go{pointer-events:auto;cursor:pointer;animation:zgbob .7s ease-in-out infinite}
.zgpw.go::after{content:"";position:absolute;left:-40%;right:-40%;top:-12%;bottom:-12%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,64,.6),rgba(255,214,64,0));z-index:-1}
@keyframes zgbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12%)}}
.zgl-row.two .zgl-pl{gap:6px;padding:4px}
.zgl-row.two .zgl-av{gap:6px}
.zgl-row.two .zgl-av .zgpa{width:34px;height:34px}
.zgl-row.two .zgl-av .zgpi b{font-size:12px;max-width:56px}
.zgl-row.two .zgl-av .zgpi small{display:none}
.zgl-row.two .zgl-dbox{width:54px;height:54px}
.zgl-row.two .zgl-dbox .zgcube-wrap{transform:scale(.9)}
.zgl-act{width:100%;max-width:470px;box-sizing:border-box}
.zgl-spark{position:absolute;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px var(--c),0 0 2px #fff;pointer-events:none;z-index:6;opacity:0;animation:zgsparkle 1s ease-out forwards}
@media (prefers-reduced-motion:reduce){.zgl-spark{display:none}}
/* ---- échecs : plateau en bois à plat, pièces nettes, comme sur Lichess ---- */
#zgame.game.chess{background:#2b2926}
.zgc-frame{width:100%;max-width:430px;box-sizing:border-box;padding:0;border-radius:8px;background:none;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.zgc-board{display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;border-radius:6px;overflow:hidden}
.zgc-sq{position:relative;border:0;padding:0;line-height:1;cursor:pointer;background:none}
.zgc-sq.lt{background:url(data:image/jpeg;base64,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) 0 0/300% 300% #d59f65}
.zgc-sq.dk{background:url(data:image/jpeg;base64,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) 0 0/300% 300% #833c2b}
.zgc-board .zgc-sq:nth-child(9n+2){background-position:50% 0}.zgc-board .zgc-sq:nth-child(9n+3){background-position:100% 0}.zgc-board .zgc-sq:nth-child(9n+4){background-position:0 50%}.zgc-board .zgc-sq:nth-child(9n+5){background-position:50% 50%}.zgc-board .zgc-sq:nth-child(9n+6){background-position:100% 50%}.zgc-board .zgc-sq:nth-child(9n+7){background-position:0 100%}.zgc-board .zgc-sq:nth-child(9n+8){background-position:50% 100%}.zgc-board .zgc-sq:nth-child(9n+9){background-position:100% 100%}
.zgc-rk,.zgc-fl{position:absolute;font:700 clamp(9px,2.5vw,11px)/1 system-ui,sans-serif;font-style:normal;z-index:2;pointer-events:none}
.zgc-rk{left:3px;top:2px}.zgc-fl{right:3px;bottom:2px}
.zgc-sq.lt .zgc-rk,.zgc-sq.lt .zgc-fl{color:#833c2b}
.zgc-sq.dk .zgc-rk,.zgc-sq.dk .zgc-fl{color:#d59f65}
.zgc-sq.lastt::after,.zgc-sq.lastf::after{content:"";position:absolute;inset:0;background:rgba(239,171,75,.82);pointer-events:none}
.zgc-sq.sel::after{content:"";position:absolute;inset:0;background:rgba(255,196,64,.9);pointer-events:none}
.zgc-sq.chk::before{content:"";position:absolute;inset:0;background:radial-gradient(circle,#ff2a2a 0,rgba(235,40,40,.85) 25%,rgba(200,30,30,.35) 55%,transparent 75%);pointer-events:none}
.zgc-sq.to::before{content:"";position:absolute;left:50%;top:50%;width:32%;height:32%;margin:-16% 0 0 -16%;border-radius:50%;background:rgba(20,20,20,.26);pointer-events:none;z-index:3}
.zgc-sq.to{box-shadow:none}
.zgc-sq.cap::before{left:0;top:0;width:100%;height:100%;margin:0;border-radius:0;background:radial-gradient(circle,transparent 58%,rgba(20,20,20,.26) 60%,rgba(20,20,20,.26) 86%,transparent 88%)}
.zgp{position:absolute;inset:0;display:block;font-size:0;line-height:0;z-index:1;pointer-events:none}
.zgp svg{width:100%;height:100%;display:block;overflow:visible}
.zgp{transition:transform .2s}
.zgp.mv{animation:zgslide .36s cubic-bezier(.3,1.3,.5,1)}
.zgc-sq.sel .zgp{transform:scale(1.06)}
.zgcap .cg{width:30px;height:30px;display:inline-block}
.zgcap .cg svg{width:100%;height:100%;display:block}
.zgcap{gap:2px;min-height:32px}
.zgc-sq,.zgcube-wrap,.zgpw,[data-zg],[data-zgroll],[data-zgc]{touch-action:manipulation}
`;

  window.ZGUI = { open: open, menu: menu, close: close, adopt: adopt, current: function () { return G; }, pickFor: pickFor };
})();
