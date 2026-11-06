/* ---- Pool : le moteur (physique, règles du 8-ball, ordinateur) ----
   Aucun dessin ici : tout se joue sur des nombres, pour pouvoir tester sans écran.
   Table verticale de 400 x 800 unités, 16 billes de rayon 10,5, 6 poches.
   L'écran (app-v5-zzzzzzzft-pool.js) dessine ce que ce moteur calcule.
   Billes : 0 = blanche, 1-7 = pleines, 8 = noire, 9-15 = rayées. */
(function (root) {
  "use strict";

  /* ---------- la table ---------- */
  var W = 400, H = 800, R = 10.5;
  var HEAD_Y = H * 0.73;                         // la ligne de départ (la « cuisine » est en dessous)
  var FOOT = { x: W / 2, y: H * 0.27 };          // la pointe du triangle
  var GC = 30, GS = 26;                          // ouverture des poches de coin / de côté (bout des bandes)
  var POCKETS = [
    { x: 3, y: 3, r: 25 }, { x: W - 3, y: 3, r: 25 },
    { x: -2, y: H / 2, r: 23 }, { x: W + 2, y: H / 2, r: 23 },
    { x: 3, y: H - 3, r: 25 }, { x: W - 3, y: H - 3, r: 25 }
  ];
  var SEGS = [                                   // les bandes (les bouts font office de « becs » de poche)
    [GC, 0, W - GC, 0], [GC, H, W - GC, H],
    [0, GC, 0, H / 2 - GS], [0, H / 2 + GS, 0, H - GC],
    [W, GC, W, H / 2 - GS], [W, H / 2 + GS, W, H - GC]
  ];

  /* ---------- réglages de la physique (par seconde) ---------- */
  var SUB = 1 / 360;           // pas de calcul
  var MAXV = 2300;             // vitesse du coup à pleine puissance
  var MINV = 140;              // vitesse du coup le plus doux
  var FR1 = 62, FR2 = 0.5;     // frottement du tapis : constant + proportionnel à la vitesse
  var E_BALL = 0.95;           // rebond bille contre bille
  var E_RAIL = 0.74;           // rebond sur la bande
  var T_RAIL = 0.93;           // vitesse conservée le long de la bande
  var STOPV = 7;               // en dessous, la bille s'arrête
  var KFOLLOW = 0.55;          // effet rétro / coulé : part de la vitesse d'impact rendue à la blanche
  var KSIDE = 0.2;             // effet latéral sur la bande

  /* ---------- hasard (graine, pour les tests) ---------- */
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* groupes : 0 = pleines, 1 = rayées, 2 = la noire, -1 = la blanche */
  function gid(id) { return id === 0 ? -1 : id === 8 ? 2 : id < 8 ? 0 : 1; }

  /* ---------- la simulation ---------- */
  function newBall(id, x, y) { return { id: id, x: x, y: y, vx: 0, vy: 0, on: true, pocket: -1, tp: 0, sp: 0, rx: 0, ry: 0 }; }

  function makeSim() {
    var S = { balls: [], shot: false, first: null, rail: false, potted: [], shotDir: { x: 0, y: -1 }, ev: [], quiet: false, t: 0 };
    for (var i = 0; i < 16; i++) S.balls.push(newBall(i, -100, -100));
    return S;
  }

  /* le triangle : la noire au milieu, une pleine et une rayée dans les coins du fond */
  function rack(S, rng) {
    var ids = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
    var corners = [];
    var si = -1, ti = -1;
    for (i = 0; i < ids.length && (si < 0 || ti < 0); i++) { if (ids[i] < 8 && si < 0) si = i; else if (ids[i] > 8 && ti < 0) ti = i; }
    corners = [ids[si], ids[ti]]; if (rng() < 0.5) corners.reverse();
    var rest = ids.filter(function (v) { return v !== corners[0] && v !== corners[1]; });
    var order = [], k = 0;
    var d = 2 * R + 0.25, rowH = Math.sqrt(3) / 2 * d;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c <= r; c++) {
        var id;
        if (r === 4 && c === 0) id = corners[0];
        else if (r === 4 && c === 4) id = corners[1];
        else if (r === 2 && c === 1) id = 8;
        else id = rest[k++];
        S.balls[id].x = FOOT.x + (c - r / 2) * d;
        S.balls[id].y = FOOT.y - r * rowH;
        S.balls[id].on = true; S.balls[id].vx = 0; S.balls[id].vy = 0;
      }
    }
    var cue = S.balls[0];
    cue.x = W / 2; cue.y = H * 0.82; cue.on = true; cue.vx = cue.vy = 0;
  }

  function stopped(S) {
    for (var i = 0; i < 16; i++) { var b = S.balls[i]; if (b.on && (b.vx !== 0 || b.vy !== 0)) return false; }
    return true;
  }

  function addEv(S, e) { if (!S.quiet) S.ev.push(e); }

  function segHit(S, b, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = ((b.x - ax) * dx + (b.y - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    var cx = ax + dx * t, cy = ay + dy * t;
    var ex = b.x - cx, ey = b.y - cy, d2 = ex * ex + ey * ey;
    if (d2 >= R * R) return;
    var d = Math.sqrt(d2), nx, ny;
    if (d < 1e-6) { nx = dx === 0 ? (b.x < W / 2 ? 1 : -1) : 0; ny = dy === 0 ? (b.y < H / 2 ? 1 : -1) : 0; d = 0; } else { nx = ex / d; ny = ey / d; }
    b.x = cx + nx * R; b.y = cy + ny * R;
    var vn = b.vx * nx + b.vy * ny;
    if (vn >= 0) return;
    var tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty;
    var nvn = -vn * E_RAIL, nvt = vt * T_RAIL;
    if (b.id === 0 && b.sp) {                      // l'effet latéral : la blanche file d'un côté après la bande
      var rx = -S.shotDir.y, ry = S.shotDir.x;      // la droite du tireur
      var sgn = (rx * tx + ry * ty) >= 0 ? 1 : -1;
      nvt += sgn * b.sp * KSIDE * -vn;
      b.sp *= 0.5;
    }
    b.vx = nvn * nx + nvt * tx; b.vy = nvn * ny + nvt * ty;
    if (S.first !== null) S.rail = true;
    if (-vn > 8) addEv(S, { t: "rail", s: -vn, x: b.x, y: b.y });
  }

  function step(S, dt) {
    var B = S.balls, i, j, b, o;
    S.t += dt;
    for (i = 0; i < 16; i++) {
      b = B[i]; if (!b.on) continue;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > 0) {
        var dec = (FR1 + FR2 * sp) * dt;
        if (sp <= STOPV || dec >= sp) { b.vx = 0; b.vy = 0; }
        else { var k = (sp - dec) / sp; b.vx *= k; b.vy *= k; }
        var mx = b.vx * dt, my = b.vy * dt;
        b.x += mx; b.y += my; b.rx += mx; b.ry += my;
        if (b.sp) b.sp *= 1 - 0.5 * dt;
        if (b.tp) b.tp *= 1 - 0.35 * dt;
      }
    }
    /* bille contre bille */
    for (i = 0; i < 16; i++) {
      b = B[i]; if (!b.on) continue;
      for (j = i + 1; j < 16; j++) {
        o = B[j]; if (!o.on) continue;
        var dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R) continue;
        var d = Math.sqrt(d2), nx, ny;
        if (d < 1e-6) { nx = 1; ny = 0; d = 0; } else { nx = dx / d; ny = dy / d; }
        var ov = (2 * R - d) / 2;
        b.x -= nx * ov; b.y -= ny * ov; o.x += nx * ov; o.y += ny * ov;
        var vn = (o.vx - b.vx) * nx + (o.vy - b.vy) * ny;
        if (vn >= 0) continue;
        var jm = -(1 + E_BALL) * vn / 2;
        b.vx -= jm * nx; b.vy -= jm * ny; o.vx += jm * nx; o.vy += jm * ny;
        var cueB = i === 0 ? b : j === 0 ? o : null;
        if (cueB) {
          if (S.first === null && S.shot) S.first = i === 0 ? o.id : b.id;
          if (cueB.tp) {                             // coulé / rétro : la blanche avance ou recule après l'impact
            var f = cueB.tp * KFOLLOW * -vn;
            cueB.vx += S.shotDir.x * f; cueB.vy += S.shotDir.y * f; cueB.tp = 0;
          }
        }
        if (-vn > 10) addEv(S, { t: "ball", s: -vn, x: (b.x + o.x) / 2, y: (b.y + o.y) / 2 });
      }
    }
    /* bandes */
    for (i = 0; i < 16; i++) {
      b = B[i]; if (!b.on) continue;
      for (j = 0; j < 6; j++) segHit(S, b, SEGS[j][0], SEGS[j][1], SEGS[j][2], SEGS[j][3]);
    }
    /* poches */
    for (i = 0; i < 16; i++) {
      b = B[i]; if (!b.on) continue;
      var pk = -1;
      for (j = 0; j < 6; j++) {
        var ddx = b.x - POCKETS[j].x, ddy = b.y - POCKETS[j].y;
        if (ddx * ddx + ddy * ddy < POCKETS[j].r * POCKETS[j].r) { pk = j; break; }
      }
      if (pk < 0 && (b.x < -14 || b.x > W + 14 || b.y < -14 || b.y > H + 14)) {  // sécurité : une bille sortie tombe dans la poche la plus proche
        var bd = 1e9; for (j = 0; j < 6; j++) { var q = (b.x - POCKETS[j].x) * (b.x - POCKETS[j].x) + (b.y - POCKETS[j].y) * (b.y - POCKETS[j].y); if (q < bd) { bd = q; pk = j; } }
      }
      if (pk >= 0) {
        b.on = false; b.pocket = pk;
        var spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        addEv(S, { t: "pocket", id: b.id, pk: pk, x: b.x, y: b.y, vx: b.vx, vy: b.vy, s: spd });
        b.vx = 0; b.vy = 0;
        if (S.shot) S.potted.push(b.id);
      }
    }
  }

  /* un coup : angle en radians (0 = vers la droite, -PI/2 = vers le haut), puissance 0..1, effet -1..1 */
  function shoot(S, angle, power, sx, sy) {
    var cue = S.balls[0];
    var v = MINV + Math.max(0, Math.min(1, power)) * (MAXV - MINV);
    S.shotDir = { x: Math.cos(angle), y: Math.sin(angle) };
    cue.vx = S.shotDir.x * v; cue.vy = S.shotDir.y * v;
    cue.sp = Math.max(-1, Math.min(1, sx || 0)); cue.tp = Math.max(-1, Math.min(1, sy || 0));
    S.shot = true; S.first = null; S.rail = false; S.potted = [];
    addEv(S, { t: "cue", s: v });
  }

  /* trajectoire prévue (pour la ligne de visée) : où la blanche touche, quelle bille, et vers où elles partent */
  function predict(S, angle) {
    var cue = S.balls[0], dx = Math.cos(angle), dy = Math.sin(angle);
    var best = 1e9, hit = null, i;
    for (i = 1; i < 16; i++) {
      var o = S.balls[i]; if (!o.on) continue;
      var fx = o.x - cue.x, fy = o.y - cue.y, proj = fx * dx + fy * dy;
      if (proj <= 0) continue;
      var perp2 = fx * fx + fy * fy - proj * proj, rr = 4 * R * R;
      if (perp2 >= rr) continue;
      var t = proj - Math.sqrt(rr - perp2);
      if (t < best) { best = t; hit = o; }
    }
    var wall = 1e9, wx = 0, wy = 0;
    if (dx > 1e-9) { var t1 = (W - R - cue.x) / dx; if (t1 < wall) { wall = t1; wx = -1; wy = 0; } }
    if (dx < -1e-9) { var t2 = (R - cue.x) / dx; if (t2 < wall) { wall = t2; wx = 1; wy = 0; } }
    if (dy > 1e-9) { var t3 = (H - R - cue.y) / dy; if (t3 < wall) { wall = t3; wx = 0; wy = -1; } }
    if (dy < -1e-9) { var t4 = (R - cue.y) / dy; if (t4 < wall) { wall = t4; wx = 0; wy = 1; } }
    var res = { dx: dx, dy: dy };
    if (hit && best < wall) {
      res.hit = hit.id; res.t = best;
      res.gx = cue.x + dx * best; res.gy = cue.y + dy * best;
      res.tx = hit.x; res.ty = hit.y;
      var nx = hit.x - res.gx, ny = hit.y - res.gy, nl = Math.sqrt(nx * nx + ny * ny) || 1;
      res.nx = nx / nl; res.ny = ny / nl;                     // direction de la bille touchée
      var cross = dx * res.ny - dy * res.nx;                  // la blanche part sur le côté opposé
      var px = -res.ny, py = res.nx; if (px * dx + py * dy < 0) { px = -px; py = -py; }
      res.cx = px; res.cy = py;                               // direction de la blanche après l'impact
      res.cut = Math.abs(cross);                              // 0 = plein centre, 1 = effleuré
    } else {
      res.hit = null; res.t = wall;
      res.gx = cue.x + dx * wall; res.gy = cue.y + dy * wall;
      var vn = dx * wx + dy * wy;
      res.rx = dx - 2 * vn * wx; res.ry = dy - 2 * vn * wy;   // la direction après le rebond
    }
    return res;
  }

  /* ---------- la partie : règles du 8-ball ---------- */
  function newGame(seed) {
    var rng = mulberry(seed == null ? (Date.now() & 0xffffff) : seed);
    var G = { S: makeSim(), rng: rng, turn: 0, group: [null, null], hand: true, kitchen: true, breakShot: true,
      over: false, winner: -1, last: null, shotActive: false, settle: 0, remainBefore: 0, wasOpen: true, shots: 0, acc: 0 };
    rack(G.S, rng);
    return G;
  }

  function ballsLeft(G, p) {
    var g = G.group[p]; if (g == null) return -1;
    var n = 0; for (var i = 1; i < 16; i++) if (i !== 8 && G.S.balls[i].on && gid(i) === g) n++;
    return n;
  }

  /* les billes que le joueur a le droit de toucher en premier */
  function targets(G, p) {
    var S = G.S, out = [], i;
    var g = G.group[p];
    if (g == null) { for (i = 1; i < 16; i++) if (i !== 8 && S.balls[i].on) out.push(i); return out; }
    var n = ballsLeft(G, p);
    if (n > 0) { for (i = 1; i < 16; i++) if (i !== 8 && S.balls[i].on && gid(i) === g) out.push(i); return out; }
    return S.balls[8].on ? [8] : [];
  }

  function canPlace(G, x, y) {
    var S = G.S;
    if (x < R + 2 || x > W - R - 2 || y < R + 2 || y > H - R - 2) return false;
    if (G.kitchen && y < HEAD_Y) return false;
    for (var i = 1; i < 16; i++) { var o = S.balls[i]; if (!o.on) continue; if ((o.x - x) * (o.x - x) + (o.y - y) * (o.y - y) < (2 * R + 1) * (2 * R + 1)) return false; }
    return true;
  }
  function place(G, x, y) {
    if (!canPlace(G, x, y)) return false;
    var c = G.S.balls[0]; c.x = x; c.y = y; c.vx = c.vy = 0; c.on = true; return true;
  }
  /* le premier endroit libre, pour remettre la blanche ou la noire */
  function freeSpot(G, x, y, ignoreKitchen) {
    var save = G.kitchen; if (ignoreKitchen) G.kitchen = false;
    var out = null;
    for (var r = 0; r < 300 && !out; r += 6) {
      for (var a = 0; a < 12 && !out; a++) {
        var px = x + Math.cos(a * Math.PI / 6) * r, py = y + Math.sin(a * Math.PI / 6) * r;
        if (canPlace(G, px, py)) out = { x: px, y: py };
      }
    }
    G.kitchen = save;
    return out || { x: x, y: y };
  }

  /* le joueur tire */
  function takeShot(G, angle, power, sx, sy) {
    var S = G.S;
    G.wasOpen = G.group[G.turn] == null;
    G.remainBefore = ballsLeft(G, G.turn);
    G.hand = false;
    S.ev = []; G.shotActive = true; G.settle = 0; G.shots++;
    shoot(S, angle, power, sx, sy);
  }

  /* la fin du coup : fautes, billes rentrées, changement de joueur */
  function resolve(G) {
    var S = G.S, p = G.turn, o = 1 - p;
    var pot = S.potted.slice(), cuePot = !S.balls[0].on;
    var wasOpen = G.wasOpen, cleared = !wasOpen && G.remainBefore === 0;
    var res = { player: p, potted: pot.filter(function (id) { return id > 0; }), scratch: cuePot, foul: false, reason: "", first: S.first, keep: false,
      win: -1, assigned: false, breakShot: G.breakShot, respotted8: false };
    var objPot = res.potted;

    if (cuePot) { res.foul = true; res.reason = "Scratch"; }
    else if (S.first === null) { res.foul = true; res.reason = "No ball hit"; }
    else {
      var fg = gid(S.first);
      if (wasOpen) { if (S.first === 8) { res.foul = true; res.reason = "You hit the 8 first"; } }
      else if (cleared) { if (S.first !== 8) { res.foul = true; res.reason = "Hit the 8 ball first"; } }
      else if (fg !== G.group[p]) { res.foul = true; res.reason = "Wrong ball first"; }
    }
    if (!res.foul && pot.length === 0 && !S.rail) { res.foul = true; res.reason = "No ball reached a cushion"; }

    var eight = objPot.indexOf(8) >= 0;
    if (eight) {
      if (G.breakShot) { res.respotted8 = true; }
      else if (!wasOpen && cleared && !res.foul) res.win = p;
      else { res.win = o; res.reason = res.reason || "The 8 ball went in too early"; if (!res.foul) res.reason = "The 8 ball went in too early"; }
    }

    if (res.respotted8) {
      var spot = freeSpot(G, FOOT.x, FOOT.y, true);
      var e8 = S.balls[8]; e8.x = spot.x; e8.y = spot.y; e8.on = true; e8.vx = e8.vy = 0; e8.pocket = -1;
      objPot = objPot.filter(function (id) { return id !== 8; }); res.potted = objPot;
    }

    if (res.win < 0 && !res.foul) {
      if (wasOpen && !G.breakShot && objPot.length) {                   // la table s'ouvre : la première bille rentrée choisit les groupes
        var first = null; for (var k = 0; k < objPot.length; k++) if (objPot[k] !== 8) { first = objPot[k]; break; }
        if (first != null) { G.group[p] = gid(first); G.group[o] = 1 - gid(first); res.assigned = true; }
      }
      if (G.breakShot) res.keep = objPot.length > 0;
      else if (wasOpen && !res.assigned) res.keep = false;
      else res.keep = objPot.some(function (id) { return gid(id) === G.group[p] || id === 8; });
      if (res.assigned) res.keep = objPot.some(function (id) { return gid(id) === G.group[p]; });
    }

    if (cuePot) {                                                       // la blanche revient sur la table, au bon endroit pour être placée
      var c = S.balls[0]; c.on = true; c.pocket = -1; c.vx = c.vy = 0; c.x = W / 2; c.y = H * 0.82;
    }
    if (res.win >= 0) { G.over = true; G.winner = res.win; }
    else if (res.foul) { G.turn = o; G.hand = true; G.kitchen = false; }
    else if (!res.keep) { G.turn = o; }
    G.breakShot = false;
    G.shotActive = false; S.shot = false;
    G.last = res;
    return res;
  }

  /* fait avancer la partie de dt secondes ; renvoie le compte rendu du coup s'il vient de se terminer */
  function advance(G, dt) {
    var S = G.S, out = null;
    if (!G.shotActive) return null;
    G.acc += Math.min(dt, 0.05);
    while (G.acc >= SUB) {
      G.acc -= SUB;
      step(S, SUB);
      if (stopped(S)) { G.settle += SUB; if (G.settle > 0.18) { out = resolve(G); G.acc = 0; break; } } else G.settle = 0;
    }
    return out;
  }

  function cloneGame(G) {
    var S = G.S, T = makeSim();
    for (var i = 0; i < 16; i++) { var a = S.balls[i], b = T.balls[i]; b.x = a.x; b.y = a.y; b.vx = a.vx; b.vy = a.vy; b.on = a.on; b.pocket = a.pocket; b.tp = a.tp; b.sp = a.sp; }
    T.shot = S.shot; T.first = S.first; T.rail = S.rail; T.potted = S.potted.slice(); T.shotDir = { x: S.shotDir.x, y: S.shotDir.y }; T.quiet = true;
    return { S: T, rng: G.rng, turn: G.turn, group: G.group.slice(), hand: G.hand, kitchen: G.kitchen, breakShot: G.breakShot, over: G.over, winner: G.winner,
      last: null, shotActive: false, settle: 0, remainBefore: G.remainBefore, wasOpen: G.wasOpen, shots: G.shots, acc: 0 };
  }

  /* joue un coup sur une copie, jusqu'au bout (pour l'ordinateur et pour les tests) */
  function simulate(G, angle, power, sx, sy) {
    var C = cloneGame(G), n = 0;
    takeShot(C, angle, power, sx, sy);
    while (C.shotActive && n < 4000000) {
      step(C.S, SUB * 2); n++;
      if (stopped(C.S)) { C.settle += SUB * 2; if (C.settle > 0.18) resolve(C); } else C.settle = 0;
      if (n > 6000) break;
    }
    if (C.shotActive) resolve(C);
    return C;
  }

  /* ---------- l'ordinateur ---------- */
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    var cx = ax + dx * t, cy = ay + dy * t; return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }
  function pathClear(S, ax, ay, bx, by, skip1, skip2, gap) {
    for (var i = 0; i < 16; i++) {
      if (i === skip1 || i === skip2) continue;
      var o = S.balls[i]; if (!o.on) continue;
      if (segDist(o.x, o.y, ax, ay, bx, by) < gap) return false;
    }
    return true;
  }

  var LEVELS = {
    easy: { sigma: 1.9 * Math.PI / 180, top: 4, powerNoise: 0.22, spins: false, evalN: 3, pick: 0.45, blunder: 0.22 },
    medium: { sigma: 0.5 * Math.PI / 180, top: 5, powerNoise: 0.07, spins: false, evalN: 6, pick: 0.12, blunder: 0 },
    hard: { sigma: 0.12 * Math.PI / 180, top: 8, powerNoise: 0.02, spins: true, evalN: 14, pick: 0, blunder: 0 }
  };

  /* distance parcourue par une bille lancée à la vitesse v (frottement du tapis) */
  function rollDist(v) { var d = 0, dt = 1 / 120; while (v > STOPV && d < 20000) { d += v * dt; v -= (FR1 + FR2 * v) * dt; } return d; }
  /* vitesse restante après avoir roulé la distance d */
  function speedAfter(v, d) { var t = 0, dt = 1 / 120; while (v > STOPV && t < d) { t += v * dt; v -= (FR1 + FR2 * v) * dt; } return v > STOPV ? v : 0; }
  /* la puissance (0..1) pour que la bille touchée atteigne la poche, avec un peu de marge */
  function powerToPot(d1, d2, cos) {
    var need = d2 * 1.12 + 26;
    for (var v = 260; v <= MAXV; v += 40) {
      var vc = speedAfter(v, d1); if (vc <= 0) continue;
      var vo = vc * 0.975 * Math.max(0.2, cos);
      if (rollDist(vo) >= need) return Math.max(0.05, Math.min(0.95, (v - MINV) / (MAXV - MINV)));
    }
    return 0.95;
  }

  /* tous les coups « on rentre cette bille dans cette poche » possibles depuis la position actuelle */
  function potShots(G, p) {
    var S = G.S, cue = S.balls[0], out = [];
    var tg = targets(G, p);
    for (var a = 0; a < tg.length; a++) {
      var t = S.balls[tg[a]];
      for (var k = 0; k < 6; k++) {
        var pk = POCKETS[k];
        var px = pk.x, py = pk.y;
        if (k === 0 || k === 1 || k === 4 || k === 5) { px += (px < W / 2 ? 9 : -9); py += (py < H / 2 ? 9 : -9); }   // viser le fond du coin
        var vx = px - t.x, vy = py - t.y, vl = Math.sqrt(vx * vx + vy * vy); vx /= vl; vy /= vl;
        var gx = t.x - vx * 2 * R, gy = t.y - vy * 2 * R;
        if (gx < R || gx > W - R || gy < R || gy > H - R) continue;
        var cx = gx - cue.x, cy = gy - cue.y, cl = Math.sqrt(cx * cx + cy * cy); if (cl < 1) continue;
        var cos = (cx * vx + cy * vy) / cl;                                  // 1 = plein centre
        if (cos < 0.3) continue;
        if (k === 2 || k === 3) { var nx = k === 2 ? -1 : 1; if (vx * nx < 0.35) continue; }     // poche de côté : pas trop en biais
        else { var dgx = (pk.x < W / 2 ? -1 : 1), dgy = (pk.y < H / 2 ? -1 : 1); if ((vx * dgx + vy * dgy) / 1.4142 < 0.45) continue; }
        if (!pathClear(S, cue.x, cue.y, gx, gy, 0, t.id, 2 * R - 1.2)) continue;
        if (!pathClear(S, t.x, t.y, px, py, t.id, 0, 2 * R - 1.2)) continue;
        var d1 = cl, d2 = vl;
        out.push({ id: t.id, pocket: k, angle: Math.atan2(cy, cx), cos: cos, d1: d1, d2: d2,
          score: cos * cos * (1 / (1 + d1 / 900)) * (1 / (1 + d2 / 500)) });
      }
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  function outcomeScore(G, C, p) {
    var r = C.last, s = 0;
    if (!r) return 0;
    if (r.win === p) return 5000;
    if (r.win >= 0) return -5000;
    if (r.foul) s -= 300 + (r.scratch ? 60 : 0);
    var mine = 0, theirs = 0;
    r.potted.forEach(function (id) { if (G.group[p] == null || gid(id) === G.group[p] || id === 8) mine++; else theirs++; });
    s += mine * 200 - theirs * 120;
    if (!r.foul && r.keep) s += 120;
    if (r.assigned) s += 40;
    /* la blanche devrait rester loin des bords et près d'une bille à jouer */
    if (!r.foul && r.keep) {
      var cue = C.S.balls[0], best = 1e9, tg = targets(C, p);
      tg.forEach(function (id) { var o = C.S.balls[id]; if (!o.on) return; var d = Math.hypot(o.x - cue.x, o.y - cue.y); if (d < best) best = d; });
      if (best < 1e9) s += Math.max(0, 60 - best / 12);
    }
    return s;
  }

  /* où poser la blanche quand on a la main : on essaie une grille et on garde le meilleur point de départ */
  function chooseHand(G, level) {
    var p = G.turn, L = LEVELS[level] || LEVELS.medium, best = null, bs = -1e9, S = G.S;
    var save = { x: S.balls[0].x, y: S.balls[0].y };
    if (G.breakShot) { return { x: W / 2 + (G.rng() - 0.5) * 60, y: H * 0.84 }; }
    var cands = [];
    for (var gx = 0; gx < 8; gx++) for (var gy = 0; gy < 12; gy++) {
      var x = 40 + gx * (W - 80) / 7, y = 40 + gy * (H - 80) / 11;
      if (!canPlace(G, x, y)) continue;
      cands.push({ x: x, y: y });
    }
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i]; S.balls[0].x = c.x; S.balls[0].y = c.y;
      var shots = potShots(G, p), sc = shots.length ? shots[0].score * 100 + Math.min(shots.length, 4) * 6 : 0;
      sc += G.rng() * (level === "easy" ? 40 : 2);
      if (sc > bs) { bs = sc; best = c; }
    }
    S.balls[0].x = save.x; S.balls[0].y = save.y;
    return best || freeSpot(G, W / 2, H * 0.8, false);
  }

  /* le coup de l'ordinateur : { angle, power, sx, sy } */
  function chooseShot(G, level) {
    var L = LEVELS[level] || LEVELS.medium, p = G.turn, S = G.S, cue = S.balls[0], rng = G.rng;
    if (G.breakShot) {
      var tgt = S.balls[1]; for (var q = 1; q < 16; q++) if (S.balls[q].on && S.balls[q].y > tgt.y) tgt = S.balls[q];
      return { angle: Math.atan2(tgt.y - cue.y, tgt.x - cue.x) + gauss(rng) * L.sigma * 0.6, power: level === "easy" ? 0.72 : 0.95, sx: 0, sy: 0 };
    }
    var cands = [], shots = potShots(G, p), i;
        for (i = 0; i < shots.length && i < L.top; i++) {
      var s = shots[i], p0 = powerToPot(s.d1, s.d2, s.cos);
      var pw = [p0];
      if (level === "hard") pw = [p0, Math.min(0.95, p0 * 1.18), Math.max(0.1, p0 * 0.85)];
      var spins = L.spins ? [[0, 0], [0, 0.4], [0, -0.4]] : [[0, 0]];
      for (var a = 0; a < pw.length; a++) for (var b = 0; b < spins.length; b++)
        cands.push({ angle: s.angle, power: pw[a], sx: spins[b][0], sy: spins[b][1], base: s.score * 100 });
    }
    /* pas de coup à rentrer : on touche une bille autorisée sans faire de faute (jeu de sécurité) */
    if (!cands.length || (L.blunder && rng() < L.blunder)) {
      var tg = targets(G, p);
      tg.forEach(function (id) {
        var o = S.balls[id]; if (!o.on) return;
        var ang = Math.atan2(o.y - cue.y, o.x - cue.x);
        if (!pathClear(S, cue.x, cue.y, o.x, o.y, 0, id, 2 * R - 1)) { for (var off = -0.5; off <= 0.5; off += 0.25) cands.push({ angle: ang + off, power: 0.45, sx: 0, sy: 0, base: 0 }); }
        else [0.4, 0.55, 0.7].forEach(function (pw2) { cands.push({ angle: ang, power: pw2, sx: 0, sy: 0, base: 0 }); });
      });
    }
    if (!cands.length) {
      var ang0 = rng() * Math.PI * 2; cands.push({ angle: ang0, power: 0.5, sx: 0, sy: 0, base: 0 });
    }
    var scored = [];
    var budget = L.evalN * (level === "hard" ? 3 : 1);
    for (i = 0; i < cands.length && i < budget; i++) {
      var c = cands[i], C = simulate(G, c.angle, c.power, c.sx, c.sy);
      scored.push({ c: c, s: outcomeScore(G, C, p) + c.base * 0.1 });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    var pick = scored[0];
    if (L.pick && scored.length > 1 && rng() < L.pick) pick = scored[Math.min(scored.length - 1, 1 + Math.floor(rng() * 2))];
    var ch = pick.c;
    return { angle: ch.angle + gauss(rng) * L.sigma, power: Math.max(0.1, Math.min(1, ch.power * (1 + gauss(rng) * L.powerNoise))), sx: ch.sx, sy: ch.sy };
  }

  root.ZPoolSim = {
    W: W, H: H, R: R, HEAD_Y: HEAD_Y, FOOT: FOOT, POCKETS: POCKETS, SEGS: SEGS, MAXV: MAXV, SUB: SUB,
    mulberry: mulberry, gid: gid, makeSim: makeSim, rack: rack, step: step, stopped: stopped, shoot: shoot, predict: predict,
    newGame: newGame, takeShot: takeShot, advance: advance, resolve: resolve, cloneGame: cloneGame, simulate: simulate,
    canPlace: canPlace, place: place, freeSpot: freeSpot, targets: targets, ballsLeft: ballsLeft,
    potShots: potShots, powerToPot: powerToPot, chooseShot: chooseShot, chooseHand: chooseHand, LEVELS: LEVELS
  };
})(typeof window !== "undefined" ? window : globalThis);
