/* =====================================================================
   v5 · Jeux : la logique (règles et IA), sans affichage.
   · Échecs : coups légaux, roque, prise en passant, promotion, échec et mat,
     pat, règle des 50 coups ; IA à recherche (minimax élagué) à 3 niveaux.
   · Ludo : 2 à 4 joueurs, 6 pour sortir, captures, arrivée exacte ; IA gloutonne
     avec évaluation.
   · Moulin à 3 pions : placement puis déplacement, vol, moulin = retirer un pion adverse ;
     IA à recherche complète (l'arbre est petit).
   Tout est fonction pure : l'état est copié à chaque coup.
   ===================================================================== */
(function () {
  var ZG = window.ZG = window.ZG || {};

  /* ---------------- Échecs ---------------- */
  var CH = {};
  CH.start = function () {
    var back = "RNBQKBNR".split("");
    var b = new Array(64).fill("");
    for (var c = 0; c < 8; c++) {
      b[c] = back[c].toLowerCase(); b[8 + c] = "p";
      b[48 + c] = "P"; b[56 + c] = back[c];
    }
    return { b: b, turn: "w", cr: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0, full: 1 };
  };
  CH.white = function (p) { return p && p === p.toUpperCase(); };
  CH.side = function (p) { return !p ? "" : (CH.white(p) ? "w" : "b"); };
  var KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var DI = [[-1, -1], [-1, 1], [1, -1], [1, 1]], OR = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  function rc(i) { return [i >> 3, i & 7]; }
  function idx(r, c) { return r * 8 + c; }
  function on(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  // is square sq attacked by side s ("w" or "b")?
  CH.attacked = function (st, sq, s) {
    var r0 = rc(sq)[0], c0 = rc(sq)[1], i, r, c, p;
    var pr = s === "w" ? 1 : -1; // a white pawn attacks upward (row - 1), so it sits one row below
    for (i = 0; i < 2; i++) {
      r = r0 + pr; c = c0 + (i ? 1 : -1);
      if (on(r, c) && st.b[idx(r, c)] === (s === "w" ? "P" : "p")) return true;
    }
    for (i = 0; i < 8; i++) { r = r0 + KN[i][0]; c = c0 + KN[i][1]; if (on(r, c) && st.b[idx(r, c)] === (s === "w" ? "N" : "n")) return true; }
    for (i = 0; i < 8; i++) { r = r0 + KG[i][0]; c = c0 + KG[i][1]; if (on(r, c) && st.b[idx(r, c)] === (s === "w" ? "K" : "k")) return true; }
    var sl = function (dirs, types) {
      for (var d = 0; d < dirs.length; d++) {
        r = r0 + dirs[d][0]; c = c0 + dirs[d][1];
        while (on(r, c)) {
          p = st.b[idx(r, c)];
          if (p) { if (CH.side(p) === s && types.indexOf(p.toLowerCase()) >= 0) return true; break; }
          r += dirs[d][0]; c += dirs[d][1];
        }
      }
      return false;
    };
    return sl(DI, ["b", "q"]) || sl(OR, ["r", "q"]);
  };
  CH.inCheck = function (st, s) {
    var k = s === "w" ? "K" : "k", sq = st.b.indexOf(k);
    return sq < 0 ? false : CH.attacked(st, sq, s === "w" ? "b" : "w");
  };

  // moves ignoring whether the king is left in check
  CH.pseudo = function (st, s) {
    var out = [], i, r, c, p, to, rr, cc, dir;
    for (i = 0; i < 64; i++) {
      p = st.b[i];
      if (!p || CH.side(p) !== s) continue;
      r = rc(i)[0]; c = rc(i)[1]; var t = p.toLowerCase();
      if (t === "p") {
        dir = s === "w" ? -1 : 1;
        var start = s === "w" ? 6 : 1, last = s === "w" ? 0 : 7;
        rr = r + dir;
        if (on(rr, c) && !st.b[idx(rr, c)]) {
          out.push({ f: i, t: idx(rr, c), p: p, c: "", promo: rr === last });
          if (r === start && !st.b[idx(r + 2 * dir, c)]) out.push({ f: i, t: idx(r + 2 * dir, c), p: p, c: "" });
        }
        for (var d = -1; d <= 1; d += 2) {
          cc = c + d; rr = r + dir;
          if (!on(rr, cc)) continue;
          to = idx(rr, cc);
          if (st.b[to] && CH.side(st.b[to]) !== s) out.push({ f: i, t: to, p: p, c: st.b[to], promo: rr === last });
          else if (to === st.ep) out.push({ f: i, t: to, p: p, c: s === "w" ? "p" : "P", ep: true });
        }
      } else if (t === "n") {
        for (var k = 0; k < 8; k++) { rr = r + KN[k][0]; cc = c + KN[k][1]; if (!on(rr, cc)) continue; to = idx(rr, cc); if (CH.side(st.b[to]) !== s) out.push({ f: i, t: to, p: p, c: st.b[to] }); }
      } else if (t === "k") {
        for (var k2 = 0; k2 < 8; k2++) { rr = r + KG[k2][0]; cc = c + KG[k2][1]; if (!on(rr, cc)) continue; to = idx(rr, cc); if (CH.side(st.b[to]) !== s) out.push({ f: i, t: to, p: p, c: st.b[to] }); }
        // castling
        var row = s === "w" ? 7 : 0, kingHome = idx(row, 4);
        if (i === kingHome && !CH.attacked(st, i, s === "w" ? "b" : "w")) {
          var ks = s === "w" ? "K" : "k", qs = s === "w" ? "Q" : "q";
          if (st.cr[ks] && !st.b[idx(row, 5)] && !st.b[idx(row, 6)] && st.b[idx(row, 7)] === (s === "w" ? "R" : "r") &&
              !CH.attacked(st, idx(row, 5), s === "w" ? "b" : "w") && !CH.attacked(st, idx(row, 6), s === "w" ? "b" : "w"))
            out.push({ f: i, t: idx(row, 6), p: p, c: "", castle: "k" });
          if (st.cr[qs] && !st.b[idx(row, 1)] && !st.b[idx(row, 2)] && !st.b[idx(row, 3)] && st.b[idx(row, 0)] === (s === "w" ? "R" : "r") &&
              !CH.attacked(st, idx(row, 3), s === "w" ? "b" : "w") && !CH.attacked(st, idx(row, 2), s === "w" ? "b" : "w"))
            out.push({ f: i, t: idx(row, 2), p: p, c: "", castle: "q" });
        }
      } else {
        var dirs = t === "b" ? DI : t === "r" ? OR : KG.filter(function (x) { return true; });
        var rays = t === "q" ? DI.concat(OR) : dirs;
        for (var e = 0; e < rays.length; e++) {
          rr = r + rays[e][0]; cc = c + rays[e][1];
          while (on(rr, cc)) {
            to = idx(rr, cc);
            if (!st.b[to]) out.push({ f: i, t: to, p: p, c: "" });
            else { if (CH.side(st.b[to]) !== s) out.push({ f: i, t: to, p: p, c: st.b[to] }); break; }
            rr += rays[e][0]; cc += rays[e][1];
          }
        }
      }
    }
    return out;
  };

  CH.make = function (st, m) {
    var b = st.b.slice(), s = CH.side(m.p), n = { b: b, turn: st.turn === "w" ? "b" : "w", cr: { K: st.cr.K, Q: st.cr.Q, k: st.cr.k, q: st.cr.q }, ep: -1, half: 0, full: st.full + (st.turn === "b" ? 1 : 0) };
    var p = m.p;
    if (m.ep) b[m.t + (s === "w" ? 8 : -8)] = "";
    b[m.t] = p; b[m.f] = "";
    if (m.castle) {
      var row = s === "w" ? 7 : 0;
      if (m.castle === "k") { b[idx(row, 5)] = b[idx(row, 7)]; b[idx(row, 7)] = ""; }
      else { b[idx(row, 3)] = b[idx(row, 0)]; b[idx(row, 0)] = ""; }
    }
    if (m.promo) b[m.t] = s === "w" ? "Q" : "q";
    if (p.toLowerCase() === "p" && Math.abs(m.t - m.f) === 16) n.ep = (m.t + m.f) / 2;
    if (p.toLowerCase() === "p" || m.c) n.half = 0; else n.half = st.half + 1;
    // castling rights
    if (p === "K") { n.cr.K = false; n.cr.Q = false; }
    if (p === "k") { n.cr.k = false; n.cr.q = false; }
    var corner = { 0: "q", 7: "k", 56: "Q", 63: "K" };
    if (corner[m.f]) n.cr[corner[m.f]] = false;
    if (corner[m.t]) n.cr[corner[m.t]] = false;
    return n;
  };

  CH.legal = function (st) {
    var s = st.turn, ps = CH.pseudo(st, s), out = [];
    for (var i = 0; i < ps.length; i++) {
      var n = CH.make(st, ps[i]);
      if (!CH.inCheck(n, s)) out.push(ps[i]);
    }
    return out;
  };
  // "play", "mate", "stale", "draw" (50 moves)
  CH.status = function (st) {
    var moves = CH.legal(st);
    if (!moves.length) return CH.inCheck(st, st.turn) ? "mate" : "stale";
    if (st.half >= 100) return "draw";
    return "play";
  };

  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  // piece-square bonuses (from white's side, rank 8 at the top)
  var PST = {
    p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
  };
  CH.eval = function (st) {
    var sc = 0;
    for (var i = 0; i < 64; i++) {
      var p = st.b[i]; if (!p) continue;
      var t = p.toLowerCase(), w = CH.white(p);
      var v = VAL[t] + PST[t][w ? i : 63 - i];
      sc += w ? v : -v;
    }
    return sc;
  };
  // best move for the side to move, searching "depth" half-moves; returns null when there is no move
  CH.best = function (st, depth) {
    var moves = CH.legal(st);
    if (!moves.length) return null;
    var pri = function (m) { return (m.c ? VAL[m.c.toLowerCase()] * 10 : 0) + (m.promo ? 800 : 0); };
    moves.sort(function (a, b) { return pri(b) - pri(a); });
    var best = null, bestScore = -Infinity, sign = st.turn === "w" ? 1 : -1;
    var nodes = 0;
    function neg(s, d, alpha, beta) {
      nodes++;
      if (d === 0) return sign_of(s) * CH.eval(s);
      var ms = CH.legal(s);
      if (!ms.length) return CH.inCheck(s, s.turn) ? -100000 + (depth - d) : 0;
      ms.sort(function (a, b) { return pri(b) - pri(a); });
      var best2 = -Infinity;
      for (var i = 0; i < ms.length; i++) {
        var v = -neg(CH.make(s, ms[i]), d - 1, -beta, -alpha);
        if (v > best2) best2 = v;
        if (v > alpha) alpha = v;
        if (alpha >= beta) break;
      }
      return best2;
    }
    function sign_of(s) { return s.turn === "w" ? 1 : -1; }
    for (var i = 0; i < moves.length; i++) {
      var n = CH.make(st, moves[i]);
      var v = -neg(n, depth - 1, -Infinity, Infinity);
      if (v > bestScore) { bestScore = v; best = moves[i]; }
    }
    return best;
  };

  /* ---------------- Ludo ---------------- */
  // progress: -1 in the base, 0..50 on the track (0 = own start), 51..55 home column, 56 arrived
  var LU = {};
  LU.SAFE_OFF = [0]; // own start squares are safe
  // corners: which corner of the board each player uses (0 red, 1 green, 2 yellow, 3 blue)
  LU.start = function (n, corners) {
    var toks = [];
    for (var k = 0; k < n; k++) toks.push([-1, -1, -1, -1]);
    var cor = (corners && corners.length >= n) ? corners.slice(0, n) : [0, 1, 2, 3].slice(0, n);
    var names = ["red", "green", "yellow", "blue"];
    return { n: n, corner: cor, colors: cor.map(function (c) { return names[c]; }), tok: toks, turn: 0, dice: 0, rolled: false, sixes: 0, winner: -1, log: "" };
  };
  LU.global = function (k, p) { return (k * 13 + p) % 52; };
  LU.moves = function (st, dice) {
    var k = st.turn, out = [];
    if (st.forfeit) return out; // third six in a row: the turn is lost
    for (var t = 0; t < 4; t++) {
      var p = st.tok[k][t];
      if (p === 56) continue;
      if (p === -1) { if (dice === 6) out.push({ t: t, to: 0 }); continue; }
      if (p + dice <= 56) out.push({ t: t, to: p + dice });
    }
    return out;
  };
  // safe squares: the start of each colour and the star 8 squares after it (8, 21, 34, 47 on the track)
  LU.isSafe = function (g) { return g % 13 === 0 || g % 13 === 8; };
  LU.apply = function (st, mv) {
    var s = JSON.parse(JSON.stringify(st)), k = s.turn, dice = s.dice;
    delete s.last_captured;
    var p = s.tok[k][mv.t];
    s.tok[k][mv.t] = mv.to;
    var info = { captured: false, finished: mv.to === 56, entered: p === -1 };
    if (mv.to <= 50) {
      var g = LU.global(s.corner[k], mv.to);
      // start squares and star squares are safe: no capture there
      var safe = LU.isSafe(g);
      if (!safe) {
        for (var o = 0; o < s.n; o++) {
          if (o === k) continue;
          for (var u = 0; u < 4; u++) {
            var op = s.tok[o][u];
            if (op >= 0 && op <= 50 && LU.global(s.corner[o], op) === g) { s.tok[o][u] = -1; info.captured = true; s.last_captured = s.last_captured || []; s.last_captured.push(o); }
          }
        }
      }
    }
    if (info.finished && s.tok[k].every(function (x) { return x === 56; })) s.winner = k;
    s.rolled = false;
    // a six, or a capture, gives another roll; the third six in a row loses the turn
    s.sixes = dice === 6 ? (st.sixes || 0) + 1 : 0;
    var again = (dice === 6 || info.captured) && s.winner < 0 && s.sixes < 3;
    if (!again) { s.turn = (s.turn + 1) % s.n; s.sixes = 0; }
    s.dice = 0; s.extra = again; s.forfeit = false;
    s.last = info;
    return s;
  };
  // no legal move: the turn passes
  LU.pass = function (st) {
    var s = JSON.parse(JSON.stringify(st));
    s.turn = (s.turn + 1) % s.n; s.dice = 0; s.rolled = false; s.extra = false; s.last = null; s.sixes = 0; s.forfeit = false;
    return s;
  };
  LU.roll = function (st, value) {
    var s = JSON.parse(JSON.stringify(st));
    s.dice = value; s.rolled = true;
    s.forfeit = value === 6 && (st.sixes || 0) >= 2; // third six in a row
    return s;
  };
  // the best move for the side to move (dice already rolled)
  LU.pick = function (st) {
    var ms = LU.moves(st, st.dice);
    if (!ms.length) return null;
    var k = st.turn, best = null, bs = -Infinity;
    ms.forEach(function (m) {
      var n = LU.apply(st, m), sc = 0;
      if (n.last.finished) sc += 1000;
      if (n.last.captured) sc += 300;
      if (st.tok[k][m.t] === -1) sc += 120;
      if (m.to <= 50 && LU.global(st.corner[k], m.to) % 13 === 0) sc += 15;
      sc += m.to; // advancing
      if (m.to === 56) sc += 500;
      if (sc > bs) { bs = sc; best = m; }
    });
    return best;
  };
  LU.rollDice = function () { return 1 + Math.floor(Math.random() * 6); };

  /* ---------------- Moulin à 3 pions ---------------- */
  var MO = {};
  MO.LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  MO.ADJ = (function () {
    var a = []; for (var i = 0; i < 9; i++) a.push([]);
    // only neighbours along a line: a piece can never jump over the middle point
    MO.LINES.forEach(function (L) { for (var i = 0; i < 2; i++) { var x = L[i], y = L[i + 1]; if (a[x].indexOf(y) < 0) a[x].push(y); if (a[y].indexOf(x) < 0) a[y].push(x); } });
    return a;
  })();
  MO.start = function () { return { b: [0, 0, 0, 0, 0, 0, 0, 0, 0], hand: [3, 3], turn: 1, pending: false, winner: 0 }; };
  MO.mill = function (b, p, at) {
    // does the piece p on point at complete a line?
    return MO.LINES.some(function (L) { return L.indexOf(at) >= 0 && L.every(function (x) { return b[x] === p; }); });
  };
  MO.moves = function (st) {
    var p = st.turn, out = [];
    if (st.pending) {
      var opp = 3 - p;
      for (var i = 0; i < 9; i++) if (st.b[i] === opp) out.push({ rem: i });
      // a piece in a mill is safe if another one can be taken
      var safe = out.filter(function (m) { return !MO.inMill(st.b, m.rem); });
      return safe.length ? safe : out;
    }
    var from = []; for (var j = 0; j < 9; j++) if (st.b[j] === p) from.push(j);
    var empty = []; for (var e = 0; e < 9; e++) if (!st.b[e]) empty.push(e);
    if (st.hand[p - 1] > 0) return empty.map(function (to) { return { to: to, from: -1 }; });
    // pas de vol (règle demandée) : pas à pas, voisin libre uniquement
    var flying = false; // pas de vol : un pion ne bouge que vers un voisin libre
    from.forEach(function (f) {
      (flying ? empty : MO.ADJ[f].filter(function (x) { return !st.b[x]; })).forEach(function (to) { out.push({ from: f, to: to }); });
    });
    return out;
  };
  MO.inMill = function (b, at) { var p = b[at]; return p && MO.LINES.some(function (L) { return L.indexOf(at) >= 0 && L.every(function (x) { return b[x] === p; }); }); };
  MO.apply = function (st, m) {
    var s = { b: st.b.slice(), hand: st.hand.slice(), turn: st.turn, pending: false, winner: 0 };
    var p = s.turn;
    if (st.pending) {
      s.b[m.rem] = 0;
      s.turn = 3 - p;
    } else {
      if (m.from < 0) { s.hand[p - 1]--; s.b[m.to] = p; }
      else { s.b[m.from] = 0; s.b[m.to] = p; }
      if (MO.mill(s.b, p, m.to)) {
        var opp = 3 - p;
        var hasTake = s.b.some(function (x, i) { return x === opp; });
        if (hasTake) {
          // si retirer un pion fait perdre l'adversaire, la victoire est annoncée tout de suite
          var oppTotal = s.b.filter(function (x) { return x === opp; }).length + s.hand[opp - 1];
          if (oppTotal - 1 >= 3) { s.pending = true; return s; }
          for (var z = 0; z < 9; z++) if (s.b[z] === opp) { s.b[z] = 0; break; }
        }
      }
      s.turn = 3 - p;
    }
    // a side with two pieces (and nothing in hand) has lost
    // a side with fewer than three pieces (on the board and in hand) has lost
    var counts = [0, 0, 0];
    s.b.forEach(function (x) { if (x) counts[x]++; });
    [1, 2].forEach(function (q) { if (counts[q] + s.hand[q - 1] < 3) s.winner = 3 - q; });
    // the side to move with no move has lost
    if (!s.winner && MO.moves(s).length === 0) s.winner = 3 - s.turn;
    return s;
  };
  // minimax with alpha-beta; the search is complete enough for this small board
  MO.score = function (st, depth) {
    if (st.winner) return st.winner === 1 ? 1000 + depth : -1000 - depth;
    if (depth === 0) return 0;
    var ms = MO.moves(st), best = null;
    if (!ms.length) return st.turn === 1 ? -1000 : 1000;
    var sc = st.turn === 1 ? -Infinity : Infinity;
    for (var i = 0; i < ms.length; i++) {
      var v = MO.score(MO.apply(st, ms[i]), depth - 1);
      if (st.turn === 1) sc = Math.max(sc, v); else sc = Math.min(sc, v);
    }
    return sc;
  };
  MO.best = function (st, depth) {
    var ms = MO.moves(st), bestM = null, bs = st.turn === 1 ? -Infinity : Infinity;
    for (var i = 0; i < ms.length; i++) {
      var v = MO.score(MO.apply(st, ms[i]), depth - 1);
      if (st.turn === 1 ? v > bs : v < bs) { bs = v; bestM = ms[i]; }
    }
    return bestM;
  };

  ZG.chess = CH; ZG.ludo = LU; ZG.morris = MO;
})();

/* ---- tic-tac-toe (morpion) : pure rules + computer ---- */
(function () {
  var ZG = window.ZG = window.ZG || {};
  var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function check(b) {
    for (var k = 0; k < LINES.length; k++) {
      var L = LINES[k], p = b[L[0]];
      if (p && p === b[L[1]] && p === b[L[2]]) return { p: p, line: L };
    }
    if (b.every(function (x) { return x; })) return { p: 0, draw: true };
    return null;
  }
  function start() { return { b: [0,0,0,0,0,0,0,0,0], turn: 1, win: null }; }
  function moves(st) {
    if (st.win) return [];
    var out = []; for (var i = 0; i < 9; i++) if (!st.b[i]) out.push({ at: i });
    return out;
  }
  function apply(st, m) {
    var b = st.b.slice(); b[m.at] = st.turn;
    return { b: b, turn: st.turn === 1 ? 2 : 1, win: check(b) };
  }
  // best score for the side to move: +1 win, 0 draw, -1 loss
  function negamax(b, turn) {
    var w = check(b);
    if (w) return w.draw ? 0 : (w.p === turn ? 1 : -1);
    var best = -2;
    for (var i = 0; i < 9; i++) if (!b[i]) {
      b[i] = turn;
      var s = -negamax(b, turn === 1 ? 2 : 1);
      b[i] = 0;
      if (s > best) best = s;
    }
    return best;
  }
  // level: 0 easy (random), 1 medium (sometimes random), 2 hard (perfect)
  function best(st, level) {
    var ms = moves(st);
    if (!ms.length) return null;
    if (level === 0 || (level === 1 && Math.random() < 0.35)) return ms[Math.floor(Math.random() * ms.length)];
    var b = st.b.slice(), bestM = ms[0], bestS = -2;
    ms.forEach(function (m) {
      b[m.at] = st.turn;
      var s = -negamax(b, st.turn === 1 ? 2 : 1);
      b[m.at] = 0;
      if (s > bestS) { bestS = s; bestM = m; }
    });
    return bestM;
  }
  ZG.ttt = { LINES: LINES, start: start, moves: moves, apply: apply, best: best, check: check };
})();
