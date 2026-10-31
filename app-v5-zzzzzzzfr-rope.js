/* ---- Rope Bros : deux singes reliés par une corde élastique ----
   Un jeu de plateforme à deux, sur le même écran (ou seul avec deux pouces) :
   chaque joueur a sa croix (gauche, droite, saut). La corde tire le partenaire :
   il faut avancer ensemble, se tirer par-dessus les trous, sauter de planche en planche,
   monter sur les tortues, et arriver tous les deux au drapeau.
   Moteur (makeSim) séparé du dessin, pour pouvoir le tester sans écran. */
(function () {
  "use strict";

  /* ---------- réglages de la physique (unités du monde, par image à 60 i/s) ---------- */
  var R = 13;            // rayon d'un singe
  var GRAV = 0.55;       // gravité
  var FALL = 13;         // vitesse de chute maximale
  var RUN = 3.3;         // vitesse de course
  var ACC = 0.46;        // accélération
  var JUMP = 9.7;        // vitesse du saut
  var REST = 112;        // longueur de la corde au repos
  var KROPE = 0.05;      // raideur de la corde
  var CAP = 1.25;        // force maximale de la corde

  /* ---------- niveaux ----------
     y vers le bas ; le sol est à y = 300. solids : blocs pleins ; planks : planches (on monte à travers) ;
     turtles : tortues qui glissent sur l'eau ; water : eau (on y tombe, on revient là où on était bien posé). */
  var LEVELS = [
    { name: "The first gap",
      minX: -120, maxX: 920, start: { x: 40, y: 300 }, flag: { x: 840, y: 300 },
      solids: [{ x: -200, y: 300, w: 520, h: 400 }, { x: 380, y: 300, w: 600, h: 400 }],
      planks: [], turtles: [], water: [{ x: 320, y: 330, w: 60, h: 400 }] },

    { name: "Stepping planks",
      minX: -120, maxX: 1180, start: { x: 40, y: 300 }, flag: { x: 1100, y: 300 },
      solids: [{ x: -200, y: 300, w: 460, h: 400 }, { x: 600, y: 300, w: 700, h: 400 }],
      planks: [{ x: 290, y: 292, w: 56 }, { x: 392, y: 272, w: 56 }, { x: 494, y: 288, w: 56 }],
      turtles: [], water: [{ x: 260, y: 330, w: 340, h: 400 }] },

    { name: "The high wall",
      minX: -120, maxX: 1000, start: { x: 40, y: 300 }, flag: { x: 900, y: 170 },
      solids: [{ x: -200, y: 300, w: 560, h: 400 }, { x: 440, y: 170, w: 640, h: 530 }],
      planks: [{ x: 372, y: 246, w: 54 }], turtles: [], water: [] },

    { name: "Turtle lake",
      minX: -120, maxX: 1320, start: { x: 40, y: 300 }, flag: { x: 1240, y: 300 },
      solids: [{ x: -200, y: 300, w: 400, h: 400 }, { x: 800, y: 300, w: 700, h: 400 }],
      planks: [],
      turtles: [{ x: 280, y: 311, w: 92, amp: 34, sp: 0.021, ph: 0 }, { x: 440, y: 311, w: 92, amp: 34, sp: 0.021, ph: 2.1 }, { x: 600, y: 311, w: 92, amp: 34, sp: 0.021, ph: 4.2 }],
      water: [{ x: 200, y: 326, w: 600, h: 400 }] },

    { name: "Up and over",
      minX: -120, maxX: 1500, start: { x: 40, y: 300 }, flag: { x: 1420, y: 120 },
      solids: [{ x: -200, y: 300, w: 380, h: 400 }, { x: 560, y: 226, w: 240, h: 474 }, { x: 1010, y: 120, w: 700, h: 580 }],
      planks: [{ x: 214, y: 288, w: 54 }, { x: 306, y: 270, w: 54 }, { x: 398, y: 252, w: 54 }, { x: 830, y: 205, w: 54 }, { x: 920, y: 160, w: 54 }],
      turtles: [], water: [{ x: 180, y: 330, w: 380, h: 400 }, { x: 800, y: 330, w: 210, h: 400 }] }
  ];

  /* ---------- le moteur ---------- */
  function makeSim(L) {
    var S = { L: L, frame: 0, deaths: 0, done: false, doneAt: 0, ev: [], turtles: [], m: [] };
    S.turtles = (L.turtles || []).map(function (t) { return { bx: t.x, x: t.x, dx: 0, y: t.y, w: t.w, amp: t.amp, sp: t.sp, ph: t.ph, dir: 1 }; });
    function mk(id, x) {
      return { id: id, x: x, y: L.start.y - R, vx: 0, vy: 0, g: false, coy: 0, face: 1, dead: 0, inv: 0, jb: 0, drop: 0, held: false, sx: x, sy: L.start.y - R, stand: null };
    }
    S.m = [mk(0, L.start.x - 18), mk(1, L.start.x + 18)];

    function respawn(m) { m.x = m.sx; m.y = m.sy; m.vx = 0; m.vy = 0; m.inv = 60; m.g = false; }

    // un cercle contre un rectangle plein : on le repousse et on garde la vitesse le long de la surface
    function pushOut(m, r) {
      var cx = Math.max(r.x, Math.min(m.x, r.x + r.w)), cy = Math.max(r.y, Math.min(m.y, r.y + r.h));
      var dx = m.x - cx, dy = m.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) return false;
      var nx, ny, pen;
      if (d2 > 1e-6) { var d = Math.sqrt(d2); nx = dx / d; ny = dy / d; pen = R - d; }
      else { // le centre est dans le bloc : on sort par le côté le plus proche
        var l = m.x - r.x, rr = r.x + r.w - m.x, t = m.y - r.y, b = r.y + r.h - m.y, mn = Math.min(l, rr, t, b);
        if (mn === t) { nx = 0; ny = -1; pen = t + R; } else if (mn === l) { nx = -1; ny = 0; pen = l + R; }
        else if (mn === rr) { nx = 1; ny = 0; pen = rr + R; } else { nx = 0; ny = 1; pen = b + R; }
      }
      m.x += nx * pen; m.y += ny * pen;
      var vn = m.vx * nx + m.vy * ny;
      if (vn < 0) { m.vx -= vn * nx; m.vy -= vn * ny; }
      if (ny < -0.55) { m.g = true; m.stand = r; }
      return true;
    }

    // une planche ou une tortue : on la traverse en montant, on se pose dessus en descendant
    function landOn(m, top, x0, x1, prevBottom, owner) {
      if (m.vy < 0) return;
      var bottom = m.y + R;
      if (m.x < x0 - 3 || m.x > x1 + 3) return;
      if (prevBottom <= top + 3 && bottom >= top) { m.y = top - R; m.vy = 0; m.g = true; m.stand = owner; }
    }

    S.step = function (inp) {
      S.frame++;
      S.turtles.forEach(function (t) { var o = t.x; t.x = t.bx + Math.sin(S.frame * t.sp + t.ph) * t.amp; t.dx = t.x - o; });

      var A = S.m[0], B = S.m[1], i, m, I;
      // 1) les ordres des joueurs
      for (i = 0; i < 2; i++) {
        m = S.m[i]; I = (inp && inp[i]) || {};
        if (m.dead > 0) { m.dead--; if (m.dead === 0) respawn(m); continue; }
        if (m.inv > 0) m.inv--;
        var dir = (I.r ? 1 : 0) - (I.l ? 1 : 0);
        if (dir) { m.face = dir; if ((dir > 0 && m.vx < RUN) || (dir < 0 && m.vx > -RUN)) m.vx += dir * ACC * (m.g ? 1 : 0.75); }
        else if (m.g) m.vx *= 0.62;
        m.vx *= m.g ? 0.9 : 0.992;
        if (I.j && !m.held) m.jb = 7;
        m.held = !!I.j;
        if (m.jb > 0) m.jb--;
        // down: let go of a plank or a turtle and drop through it
        if (I.d && m.g && m.stand && m.stand.h === undefined) { m.drop = 16; m.g = false; m.coy = 0; m.y += 3; m.stand = null; }
        if (m.drop > 0) m.drop--;
        if (m.jb > 0 && (m.g || m.coy > 0)) { m.vy = -JUMP; m.g = false; m.coy = 0; m.jb = 0; S.ev.push({ t: "jump", i: i }); }
        if (!I.j && m.vy < -3.2) m.vy *= 0.86;   // saut court si on lâche
        m.vy = Math.min(FALL, m.vy + GRAV);
      }

      // 2) la corde tire : plus fort sur celui qui est en l'air que sur celui qui est bien posé
      if (A.dead === 0 && B.dead === 0) {
        var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        if (d > REST) {
          var nx = dx / d, ny = dy / d, f = Math.min((d - REST) * KROPE, CAP);
          var wA = A.g ? 0.35 : 1, wB = B.g ? 0.35 : 1;
          A.vx += nx * f * wA; A.vy += ny * f * wA;
          B.vx -= nx * f * wB; B.vy -= ny * f * wB;
          var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rv > 0) { var c = rv * 0.08; A.vx += nx * c * wA; A.vy += ny * c * wA; B.vx -= nx * c * wB; B.vy -= ny * c * wB; }
        }
      }

      // 3) déplacement et contacts
      for (i = 0; i < 2; i++) {
        m = S.m[i];
        if (m.dead > 0) continue;
        var wasStand = m.stand;
        m.x += m.vx; m.y += m.vy;
        var prevBottom = m.y - m.vy + R;
        // portée par une tortue qui bouge
        if (wasStand && wasStand.dx !== undefined && m.g) m.x += wasStand.dx;
        m.g = false; m.stand = null;
        for (var pass = 0; pass < 2; pass++) for (var k = 0; k < L.solids.length; k++) pushOut(m, L.solids[k]);
        if (!(m.drop > 0)) {
          for (k = 0; k < L.planks.length; k++) landOn(m, L.planks[k].y, L.planks[k].x, L.planks[k].x + L.planks[k].w, prevBottom, L.planks[k]);
          for (k = 0; k < S.turtles.length; k++) { var t = S.turtles[k]; landOn(m, t.y, t.x - t.w / 2, t.x + t.w / 2, prevBottom, t); }
        }
        if (m.g) m.coy = 6; else if (m.coy > 0) m.coy--;
        // dernier endroit sûr : bien posé sur le sol, loin du bord
        if (m.g && m.stand && m.stand.h !== undefined && m.x > m.stand.x + 26 && m.x < m.stand.x + m.stand.w - 26) { m.sx = m.x; m.sy = m.y; }
        // l'eau et le vide
        var out = m.y > 760;
        for (k = 0; k < L.water.length && !out; k++) { var w = L.water[k]; if (m.y > w.y && m.x > w.x && m.x < w.x + w.w) out = true; }
        if (out && m.inv === 0) { m.dead = 46; S.deaths++; S.ev.push({ t: "splash", x: m.x, y: Math.min(m.y, 330), i: i }); m.vx = m.vy = 0; }
        else if (out) { respawn(m); }
      }

      // 4) arrivée : les deux au drapeau
      if (!S.done && A.dead === 0 && B.dead === 0) {
        var F = L.flag, ok = true;
        S.m.forEach(function (q) { if (Math.abs(q.x - F.x) > 46 || Math.abs(q.y - (F.y - R)) > 46) ok = false; });
        if (ok) { S.done = true; S.doneAt = S.frame; S.ev.push({ t: "win" }); }
      }
    };
    return S;
  }


  /* ---------- le singe de l'ordinateur ----------
     À chaque décision, il essaie quelques gestes sur une copie du jeu (≈ 0,8 s d'avance, en supposant que
     l'autre singe garde son geste) et garde le meilleur : ne pas tomber, se rapprocher du drapeau, garder la corde souple. */
  function simClone(S) {
    var c = makeSim(S.L);
    c.frame = S.frame; c.deaths = S.deaths; c.done = S.done; c.doneAt = S.doneAt; c.ev = [];
    c.turtles = S.turtles.map(function (t) { return Object.assign({}, t); });
    c.m = S.m.map(function (m) {
      var q = Object.assign({}, m), ti = S.turtles.indexOf(m.stand);
      if (ti >= 0) q.stand = c.turtles[ti];
      return q;
    });
    return c;
  }
  var BOT_TRY = [{ r: 1 }, { r: 1, j: 1 }, { j: 1 }, {}, { l: 1 }, { l: 1, j: 1 }, { d: 1 }, { r: 1, d: 1 }];
  function botPick(S, i, other) {
    var best = null, bs = -1e9, F = S.L.flag;
    for (var c = 0; c < BOT_TRY.length; c++) {
      var g = BOT_TRY[c], T = simClone(S), d0 = S.deaths, k;
      for (k = 0; k < 48; k++) {
        var mine = { l: g.l, r: g.r, d: g.d && k < 4, j: g.j && k < 15 }, inp = [{}, {}];
        inp[i] = mine; inp[1 - i] = other || {};
        T.step(inp);
        if (T.done) break;
      }
      var me = T.m[i], you = T.m[1 - i];
      var sc = -Math.hypot(me.x - F.x, me.y - F.y) - 0.5 * Math.hypot(you.x - F.x, you.y - F.y) - (T.deaths - d0) * 600 - (me.dead > 0 ? 600 : 0);
      var rope = Math.hypot(me.x - you.x, me.y - you.y); if (rope > REST) sc -= (rope - REST) * 0.6;
      if (T.done) sc += 800;
      if (g.r) sc += 0.5;
      if (sc > bs) { bs = sc; best = g; }
    }
    return { l: !!best.l, r: !!best.r, j: !!best.j, d: !!best.d };
  }

  /* ---------- le dessin ---------- */
  var COL = [
    { body: "#d8463d", dark: "#9c2b25", name: "Red" },
    { body: "#2fb3b8", dark: "#1c7c82", name: "Blue" }
  ];

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function drawBack(ctx, cw, ch, camX, camY, sc, frame) {
    var g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, "#fde4d3"); g.addColorStop(1, "#f9c9a6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    // pagode lointaine (se déplace lentement)
    var px = ((-camX * 0.18) % 520) * sc;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = "#f4be98";
    for (var k = -1; k < 3; k++) {
      var bx = px + k * 520 * sc, by = ch * 0.62;
      ctx.fillRect(bx + 120 * sc, by - 170 * sc, 14 * sc, 170 * sc);
      ctx.fillRect(bx + 280 * sc, by - 170 * sc, 14 * sc, 170 * sc);
      ctx.fillRect(bx + 100 * sc, by - 150 * sc, 210 * sc, 14 * sc);
      ctx.beginPath(); ctx.moveTo(bx + 60 * sc, by - 150 * sc); ctx.quadraticCurveTo(bx + 205 * sc, by - 190 * sc, bx + 350 * sc, by - 150 * sc);
      ctx.lineTo(bx + 330 * sc, by - 168 * sc); ctx.quadraticCurveTo(bx + 205 * sc, by - 216 * sc, bx + 80 * sc, by - 168 * sc); ctx.closePath(); ctx.fill();
      ctx.fillRect(bx + 170 * sc, by - 232 * sc, 70 * sc, 14 * sc);
      ctx.beginPath(); ctx.moveTo(bx + 150 * sc, by - 232 * sc); ctx.quadraticCurveTo(bx + 205 * sc, by - 262 * sc, bx + 260 * sc, by - 232 * sc);
      ctx.lineTo(bx + 250 * sc, by - 244 * sc); ctx.quadraticCurveTo(bx + 205 * sc, by - 276 * sc, bx + 160 * sc, by - 244 * sc); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // nuages (deux couches)
    function cloud(x, y, s, a) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff";
      [[0, 0, 34], [30, -10, 28], [58, 2, 30], [-28, 4, 24], [84, 8, 20]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0] * s * sc, y + c[1] * s * sc, c[2] * s * sc, 0, 7); ctx.fill(); });
      ctx.restore();
    }
    var cx1 = ((-camX * 0.32 + frame * 0.05) % 700), cx2 = ((-camX * 0.5 + frame * 0.08) % 640);
    for (k = -1; k < 3; k++) { cloud((cx1 + k * 700) * sc, ch * 0.3, 1.1, 0.85); cloud((cx2 + k * 640 + 240) * sc, ch * 0.5, 0.8, 0.7); }
  }

  function drawMonkey(ctx, m, c, partner, frame) {
    if (m.dead > 0) return;
    // little arrow above the head, in the colour of the player
    var bob = Math.sin(frame * 0.12 + m.id) * 2;
    ctx.fillStyle = c.body; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(m.x - 6, m.y - R - 19 + bob); ctx.lineTo(m.x + 6, m.y - R - 19 + bob); ctx.lineTo(m.x, m.y - R - 9 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(m.x, m.y);
    if (m.inv > 0 && (frame >> 2) % 2) ctx.globalAlpha = 0.45;
    var sq = Math.max(-0.12, Math.min(0.16, m.vy * 0.012));
    ctx.scale(1 - sq * 0.5, 1 + sq);
    // queue
    ctx.strokeStyle = c.dark; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.beginPath();
    ctx.moveTo(-m.face * 10, 4); ctx.quadraticCurveTo(-m.face * 24, 6, -m.face * 21, -9); ctx.stroke();
    // oreilles
    ctx.fillStyle = c.dark; ctx.beginPath(); ctx.arc(-10.5, -4, 5.4, 0, 7); ctx.arc(10.5, -4, 5.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#f3c9a2"; ctx.beginPath(); ctx.arc(-10.5, -4, 2.8, 0, 7); ctx.arc(10.5, -4, 2.8, 0, 7); ctx.fill();
    // corps
    ctx.fillStyle = c.body; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = c.dark; ctx.stroke();
    // visage
    ctx.fillStyle = "#f6d2ae"; ctx.beginPath(); ctx.ellipse(m.face * 1.5, 2.5, 8.8, 7.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#2b1a12";
    ctx.beginPath(); ctx.arc(m.face * 1.5 - 3.6, 0.8, 1.7, 0, 7); ctx.arc(m.face * 1.5 + 3.6, 0.8, 1.7, 0, 7); ctx.fill();
    ctx.strokeStyle = "#2b1a12"; ctx.lineWidth = 1.2; ctx.beginPath();
    var open = m.g ? 0 : 1.2; ctx.arc(m.face * 1.5, 4.6, 2.2 + open, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // mains vers la corde
    if (partner && partner.dead === 0) {
      var ang = Math.atan2(partner.y - m.y, partner.x - m.x);
      ctx.fillStyle = "#f6d2ae"; ctx.beginPath(); ctx.arc(Math.cos(ang) * (R - 1), Math.sin(ang) * (R - 1), 3.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function drawRope(ctx, A, B) {
    if (A.dead > 0 || B.dead > 0) return;
    var d = Math.hypot(B.x - A.x, B.y - A.y), sag = d < REST ? (REST - d) * 0.95 + 5 : Math.max(2, 14 - (d - REST) * 0.2);
    var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + sag;
    ctx.strokeStyle = "#3b281c"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
  }

  function drawWorld(ctx, S, frame) {
    var L = S.L, k;
    // eau (derrière)
    L.water.forEach(function (w) {
      var g = ctx.createLinearGradient(0, w.y - 14, 0, w.y + 160);
      g.addColorStop(0, "rgba(120,222,214,.95)"); g.addColorStop(1, "rgba(60,180,190,.95)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h);
      ctx.lineTo(w.x, w.y);
      for (var x = 0; x <= w.w; x += 10) ctx.lineTo(w.x + x, w.y + Math.sin((w.x + x) * 0.07 + frame * 0.06) * 2.6);
      ctx.lineTo(w.x + w.w, w.y + w.h); ctx.closePath(); ctx.fill();
    });
    // blocs (sol herbeux)
    L.solids.forEach(function (s) {
      var g = ctx.createLinearGradient(0, s.y, 0, s.y + 240);
      g.addColorStop(0, "#a97c50"); g.addColorStop(1, "#5b3b22");
      ctx.fillStyle = g; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = "#5fb824"; ctx.fillRect(s.x, s.y - 1, s.w, 11);
      ctx.fillStyle = "#8ed12c"; ctx.fillRect(s.x, s.y - 1, s.w, 6);
      ctx.fillStyle = "rgba(60,30,10,.18)";
      for (var x = s.x + 14; x < s.x + s.w - 6; x += 46) { ctx.fillRect(x, s.y + 26 + ((x * 7) % 40), 3, 9); }
    });
    // planches
    L.planks.forEach(function (p) {
      ctx.fillStyle = "#7a4a2a"; rr(ctx, p.x, p.y, p.w, 9, 2.5); ctx.fill();
      ctx.fillStyle = "#a06a40"; ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 2.4);
      ctx.fillStyle = "#3d2414"; ctx.fillRect(p.x + 5, p.y + 9, 3, 3); ctx.fillRect(p.x + p.w - 8, p.y + 9, 3, 3);
    });
    // tortues
    S.turtles.forEach(function (t) {
      var dirv = t.dx >= 0 ? 1 : -1, x = t.x, y = t.y + 10, bob = Math.sin(frame * 0.07 + t.bx) * 1.2;
      ctx.fillStyle = "#6d4a35"; ctx.beginPath(); ctx.ellipse(x, y + 2 + bob, t.w / 2, 12, 0, 0, 7); ctx.fill();
      var g = ctx.createLinearGradient(0, y - 12, 0, y + 6); g.addColorStop(0, "#9a6a46"); g.addColorStop(1, "#6d4a35");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 2 + bob, t.w / 2 - 2, 11, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(40,20,8,.35)"; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(x - 14, y - 11 + bob); ctx.lineTo(x - 8, y - 1 + bob); ctx.moveTo(x + 6, y - 12 + bob); ctx.lineTo(x + 10, y - 1 + bob); ctx.moveTo(x - 30, y - 5 + bob); ctx.lineTo(x + 30, y - 5 + bob); ctx.stroke();
      ctx.fillStyle = "#b9c357"; ctx.beginPath(); ctx.ellipse(x + dirv * (t.w / 2 + 3), y - 1 + bob, 9, 6.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#2b1a12"; ctx.beginPath(); ctx.arc(x + dirv * (t.w / 2 + 6), y - 3 + bob, 1.6, 0, 7); ctx.fill();
    });
    // drapeau
    var F = L.flag;
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(F.x, F.y - 4, 46, 10, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#6a4326"; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(F.x, F.y); ctx.lineTo(F.x, F.y - 78); ctx.stroke();
    var wv = Math.sin(frame * 0.12) * 3;
    ctx.fillStyle = "#e0453a"; ctx.beginPath(); ctx.moveTo(F.x, F.y - 78); ctx.quadraticCurveTo(F.x + 20, F.y - 78 + wv, F.x + 36, F.y - 68); ctx.quadraticCurveTo(F.x + 20, F.y - 62 - wv, F.x, F.y - 56); ctx.closePath(); ctx.fill();
    // singes + corde
    drawRope(ctx, S.m[0], S.m[1]);
    drawMonkey(ctx, S.m[1], COL[1], S.m[0], frame);
    drawMonkey(ctx, S.m[0], COL[0], S.m[1], frame);
    // eau devant (un voile léger pour que les singes semblent y entrer)
    L.water.forEach(function (w) {
      ctx.fillStyle = "rgba(90,200,200,.35)"; ctx.fillRect(w.x, w.y + 6, w.w, w.h);
    });
  }


  /* ---------- le style (la page, le menu des niveaux, les boutons) ---------- */
  var zrStyle = document.createElement("style");
  zrStyle.id = "zrcss";
  zrStyle.textContent = [
    "#zgame.rope{background:linear-gradient(180deg,#ffd9bd,#f7b98f 55%,#e89a6c);color:#3a2418}",
    "#zgame.rope .zg-head{background:linear-gradient(#3a2418f2,#3a2418d9)}",
    "#zgame.rope .zg-head b,#zgame.rope .zg-head small{color:#fff}",
    ".pv-rope{background:linear-gradient(#ffd9bd,#f3a97a);display:flex;align-items:center;justify-content:center}",
    ".pv-rope svg{width:94%;height:auto}",
    ".zr-sel{padding:10px 16px 30px;display:grid;gap:14px}",
    ".zr-pic{display:flex;justify-content:center}.zr-pic svg{width:min(78vw,300px);height:auto}",
    ".zr-how{margin:0;font-size:14px;line-height:1.45;background:rgba(255,255,255,.6);padding:12px 14px;border-radius:16px}",
    ".zr-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".zr-lv{border:0;border-radius:18px;padding:12px 14px;background:linear-gradient(#fff6ec,#ffe2c9);color:#3a2418;text-align:left;box-shadow:0 6px 0 #c47a4a,0 12px 20px rgba(120,60,20,.25);cursor:pointer;font-family:inherit}",
    ".zr-lv:active{transform:translateY(4px);box-shadow:0 2px 0 #c47a4a}",
    ".zr-lv b{font-size:22px;display:block}.zr-lv span{display:block;font-weight:700;font-size:14px}.zr-lv small{opacity:.7;font-size:12px}",
    ".zr-lv.ok{background:linear-gradient(#f0ffe0,#cdf2a8)}",
    "#zgame.rope.play{display:flex;flex-direction:column}",
    ".zr-stage{position:relative;margin:8px 10px;border-radius:20px;overflow:hidden;flex:1 1 auto;min-height:240px;box-shadow:0 10px 24px rgba(120,60,20,.35),0 0 0 3px #3a2418}",
    "#zgame.rope.play .zg-head{flex:none}",
    ".zr-cv{width:100%;height:100%;display:block;touch-action:none}",
    ".zr-hud{position:absolute;left:12px;right:12px;top:8px;display:flex;justify-content:space-between;font-weight:800;font-size:14px;color:#3a2418;pointer-events:none;text-shadow:0 1px 0 rgba(255,255,255,.7)}",
    ".zr-stage{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
    ".zr-hint{flex:none;text-align:center;font-size:12.5px;font-weight:700;line-height:1.35;padding:2px 14px calc(12px + env(safe-area-inset-bottom,0px));color:#3a2418}",
    ".zr-pad{border-radius:20px;padding:8px;display:grid;gap:8px;background:rgba(58,36,24,.1)}",
    ".zr-pad.a{box-shadow:inset 0 0 0 3px #d8463d}.zr-pad.b{box-shadow:inset 0 0 0 3px #2fb3b8}",
    ".zr-who{font-weight:800;text-align:center;font-size:13px}",
    ".zr-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".zr-b{height:62px;border:0;border-radius:16px;font-size:26px;font-weight:800;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:inherit;cursor:pointer}",
    ".zr-pad.a .zr-b{background:linear-gradient(#ef6b62,#c8362d);box-shadow:0 5px 0 #8c2019}",
    ".zr-pad.b .zr-b{background:linear-gradient(#52cdd2,#239aa0);box-shadow:0 5px 0 #17686c}",
    ".zr-b.on{transform:translateY(4px);filter:brightness(1.12);box-shadow:0 1px 0 rgba(0,0,0,.4)}",
    ".zr-pads.one{grid-template-columns:1fr}",
    ".zr-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".zr-md{border:0;border-radius:14px;padding:11px 8px;font-weight:800;font-family:inherit;font-size:14px;background:rgba(255,255,255,.55);color:#3a2418;cursor:pointer}",
    ".zr-md.on{background:#3a2418;color:#fff}",
    ".zr-win{display:flex;justify-content:center}.zr-win svg{width:210px;height:auto}"
  ].join("\n");
  document.head.appendChild(zrStyle);

  /* ---------- l'écran de jeu ---------- */
  var ST = { ai: false, botIn: {}, botAt: 0, host: null, sim: null, level: 0, cv: null, ctx: null, raf: 0, keys: {}, kb: [{}, {}], touch: {}, sc: 1, dpr: 1, pad: [{}, {}], cam: { x: 0, y: 0, vw: 420 }, parts: [], t0: 0, last: 0, acc: 0, frame: 0, ended: false, ac: null };
  var KEY = "mca_ropebros";
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function esc2(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // petits bruits (sans fichier)
  function beep(f, d, type, vol) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ST.ac = ST.ac || new AC(); var ctx = ST.ac, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(f * 1.6, ctx.currentTime + d);
      g.gain.setValueAtTime(vol || 0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
    } catch (e) {}
  }

  function stop() { cancelAnimationFrame(ST.raf); ST.raf = 0; ST.sim = null; ST.keys = {}; ST.kb = [{}, {}]; ST.touch = {}; ST.pad = [{}, {}]; window.removeEventListener("keydown", onKey, true); window.removeEventListener("keyup", onKey, true); }


  /* ---------- à distance : chaque téléphone conduit son singe ----------
     Le téléphone de celui qui invite (singe rouge) calcule le jeu. L'invité (singe bleu) envoie ses touches
     et reçoit la position des singes 10 fois par seconde. Canal « broadcast » de Supabase Realtime. */
  var NET = null, REMOTE = false, MODE = "local";
  function netSend(o) {
    if (!NET || !NET.ch) return;
    try { var r = NET.ch.send({ type: "broadcast", event: "m", payload: o }); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  }
  function netToast(m) { try { toast(m, "x"); } catch (e) {} }
  function netClose(tell) {
    var N = NET; if (!N) return; NET = null;
    clearInterval(N.hiT);
    var sb = window.__sb;
    if (tell && N.ch) { try { N.ch.send({ type: "broadcast", event: "m", payload: { t: "bye" } }); } catch (e) {} }
    try { if (sb && N.ch && sb.removeChannel) setTimeout(function () { try { sb.removeChannel(N.ch); } catch (e) {} }, 250); } catch (e) {}
    // the match is over for both of them (it leaves the list of games in progress)
    try { if (sb && sb.rpc && N.id) { var q = sb.rpc("game_play", { p_id: N.id, p_state: { v: 2, cols: [0, 1], level: N.level }, p_status: "over" }); if (q && q.then) q.then(function () {}, function () {}); } } catch (e) {}
  }
  function netRin(N) { return Date.now() - N.rinAt < 1500 ? N.rin : {}; }

  function openOnline(h, opts) {
    netClose(false); stop();
    var sb = window.__sb;
    if (!sb || !sb.channel) { netToast("Connect to play remotely."); levelSelect(h); return; }
    var N = NET = { h: h, role: +opts.you ? 1 : 0, id: opts.id, name: opts.oppName || "Classmate",
      level: Math.max(0, Math.min(LEVELS.length - 1, +opts.level || 0)),
      ready: false, rin: {}, rinAt: 0, lastSeen: Date.now(), hiT: 0, snapAt: 0, ch: null, evq: [], sentKey: "", sentAt: 0, jl: false };
    h.className = "zg-page rope wait";
    h.innerHTML = '<div class="zg-head"><button class="zg-x" data-zr="leave" aria-label="Leave">‹ Leave</button><div><b>Rope Bros</b><small>With ' + esc2(N.name) + '</small></div></div>' +
      '<div class="zr-sel"><div class="zr-pic">' + monkeyPic() + '</div>' +
      '<p class="zr-how"><b>Connecting to ' + esc2(N.name) + '…</b><br>Each of you plays one monkey on your own phone: ' + (N.role === 0 ? "you are the red one" : "you are the blue one") + '. Stay on this screen.</p></div>';
    try {
      N.ch = sb.channel("rope-" + opts.id, { config: { broadcast: { self: false } } });
      N.ch.on("broadcast", { event: "m" }, function (m) { netRecv(N, (m && m.payload) || {}); });
      N.ch.subscribe(function (st) { if (st === "SUBSCRIBED") netSend({ t: "hi", r: N.role, k: 0 }); });
    } catch (e) { netClose(false); netToast("Could not connect. Try again."); levelSelect(h); return; }
    N.hiT = setInterval(function () {
      if (NET !== N) { clearInterval(N.hiT); return; }
      if (!document.body.contains(N.h)) { netClose(true); return; }          // the game screen was closed
      if (!N.ready) netSend({ t: "hi", r: N.role, k: 0 });
      else if (Date.now() - N.lastSeen > 9000) { var hh = N.h; netToast(N.name + " is no longer connected."); netClose(true); levelSelect(hh); }
    }, 700);
  }

  function netRecv(N, p) {
    if (NET !== N) return;
    N.lastSeen = Date.now();
    var t = p.t;
    if (t === "hi") {
      if (p.k !== 1) netSend({ t: "hi", r: N.role, k: 1 });                  // answer once; an answer is not answered again
      if (!N.ready) { N.ready = true; start(N.h, N.level); }
    } else if (t === "in" && N.role === 0) {
      N.rin = { l: !!p.l, r: !!p.r, j: !!p.j, d: !!p.d }; N.rinAt = Date.now();
    } else if (t === "st" && N.role === 1) {
      if (!N.ready) { N.ready = true; start(N.h, N.level); }
      netSnap(N, p);
    } else if (t === "lvl" && N.role === 1) {
      var e = document.getElementById("zgend"); if (e) e.remove();
      start(N.h, Math.max(0, Math.min(LEVELS.length - 1, +p.i || 0)));
    } else if (t === "bye") {
      var hh = N.h; netToast(N.name + " left the game."); netClose(false); levelSelect(hh);
    }
  }

  // host: the picture of the game, ten times a second
  function netSnapOut(S, N) {
    var r1 = function (v) { return Math.round(v * 10) / 10; }, r2 = function (v) { return Math.round(v * 100) / 100; };
    netSend({ t: "st", f: S.frame, d: S.deaths, o: S.done ? 1 : 0, a: S.done ? S.doneAt : 0,
      m: S.m.map(function (q) { return [r1(q.x), r1(q.y), r2(q.vx), r2(q.vy), q.g ? 1 : 0, q.face, q.dead, q.inv]; }),
      u: S.turtles.map(function (t) { return r1(t.x); }), e: N.evq.splice(0) });
  }
  // guest: take the picture of the game; the monkeys glide towards it
  function netSnap(N, p) {
    var S = ST.sim; if (!S || !p.m) return;
    N.snapAt = performance.now();
    S.frame = p.f || S.frame; S.deaths = p.d || 0; S.done = !!p.o; S.doneAt = p.a || 0;
    for (var i = 0; i < 2; i++) {
      var q = p.m[i], m = S.m[i]; if (!q) continue;
      var far = m.tx == null || Math.abs(q[0] - m.x) > 90 || Math.abs(q[1] - m.y) > 90 || (m.dead > 0) !== (q[6] > 0);
      m.tx = q[0]; m.ty = q[1]; m.vx = q[2]; m.vy = q[3]; m.g = !!q[4]; m.face = q[5] || 1; m.dead = q[6]; m.inv = q[7];
      if (far) { m.x = m.tx; m.y = m.ty; }
    }
    (p.u || []).forEach(function (x, k) { if (S.turtles[k]) S.turtles[k].x = x; });
    (p.e || []).forEach(function (ev) { S.ev.push(ev); });
  }
  // guest, once per image: glide, and tell the host which keys are down
  function netGuestFrame(S, N) {
    S.frame++;
    var age = Math.min(8, (performance.now() - N.snapAt) / 16.667);
    S.m.forEach(function (m) {
      if (m.tx == null || m.dead > 0) return;
      m.x += (m.tx + m.vx * age - m.x) * 0.35; m.y += (m.ty + m.vy * Math.min(age, 4) - m.y) * 0.35;
    });
    var me = ST.pad[N.role] || {}, now = Date.now();
    if (me.j) N.jl = true;                                                      // a very short tap is not lost
    var key = (me.l ? "l" : "") + (me.r ? "r" : "") + (me.d ? "d" : "") + (me.j || N.jl ? "j" : "");
    if ((key !== N.sentKey && now - N.sentAt > 70) || now - N.sentAt > 400) {
      netSend({ t: "in", l: !!me.l, r: !!me.r, d: !!me.d, j: !!(me.j || N.jl) });
      N.sentKey = key; N.sentAt = now; N.jl = false;
    }
  }

  function levelSelect(h) {
    stop();
    var sv = saved();
    h.className = "zg-page rope sel";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="hub" aria-label="Back">‹ Back</button><div><b>Rope Bros</b><small>Two friends, one rope</small></div></div>' +
      '<div class="zr-sel">' +
        '<div class="zr-pic">' + monkeyPic() + '</div>' +
        '<div class="zr-mode"><button type="button" class="zr-md' + (MODE === "ai" ? ' on' : '') + '" data-zr="mode" data-v="ai">With the computer</button><button type="button" class="zr-md' + (MODE === "local" ? ' on' : '') + '" data-zr="mode" data-v="local">Same phone</button><button type="button" class="zr-md' + (MODE === "remote" ? ' on' : '') + '" data-zr="mode" data-v="remote">With a classmate</button></div>' +
        (MODE === "ai" ? '<p class="zr-how"><b>With the computer:</b> you are the <b style="color:#d8463d">red</b> monkey, the computer plays the blue one and helps you through the rope. Touch your monkey to run, above it to jump, below it to drop.</p>' : '') +
        (REMOTE ? '<p class="zr-how"><b>Remotely:</b> pick a level, then a classmate. Each of you plays one monkey on your own phone (you are the red one). The rope pulls your friend: move together and reach the flag.</p>' : '') +
        '<p class="zr-how"' + (MODE !== "local" ? ' hidden' : '') + '>Play together on one phone: each of you touches your own monkey — on it to run, above it to jump, below it to drop, left of it to go back. The rope pulls your friend, so move together and bring both monkeys to the flag.</p>' +
        '<div class="zr-grid">' + LEVELS.map(function (L, i) {
          var done = sv.done && sv.done[i];
          return '<button class="zr-lv' + (done ? " ok" : "") + '" data-zr="lv" data-i="' + i + '"><b>' + (i + 1) + '</b><span>' + esc2(L.name) + '</span><small>' + (done ? "✓ " + done + "s" : "Play") + '</small></button>';
        }).join("") + '</div></div>';
  }

  function monkeyPic() {
    return '<svg viewBox="0 0 220 90" aria-hidden="true">' +
      '<path d="M52 52 Q110 100 168 52" fill="none" stroke="#3b281c" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="translate(46 44)"><circle cx="-14" cy="-6" r="7" fill="#9c2b25"/><circle cx="14" cy="-6" r="7" fill="#9c2b25"/><circle r="22" fill="#d8463d" stroke="#9c2b25" stroke-width="2"/><ellipse cx="2" cy="4" rx="14" ry="12" fill="#f6d2ae"/><circle cx="-4" cy="1" r="2.6" fill="#2b1a12"/><circle cx="9" cy="1" r="2.6" fill="#2b1a12"/><path d="M-1 9 q4 4 8 0" stroke="#2b1a12" fill="none" stroke-width="1.6"/></g>' +
      '<g transform="translate(174 44)"><circle cx="-14" cy="-6" r="7" fill="#1c7c82"/><circle cx="14" cy="-6" r="7" fill="#1c7c82"/><circle r="22" fill="#2fb3b8" stroke="#1c7c82" stroke-width="2"/><ellipse cx="-2" cy="4" rx="14" ry="12" fill="#f6d2ae"/><circle cx="-9" cy="1" r="2.6" fill="#2b1a12"/><circle cx="4" cy="1" r="2.6" fill="#2b1a12"/><path d="M-8 9 q4 4 8 0" stroke="#2b1a12" fill="none" stroke-width="1.6"/></g></svg>';
  }

  function start(h, i) {
    stop();
    ST.host = h; ST.level = i; ST.ended = false;
    ST.sim = makeSim(LEVELS[i]);
    ST.cam = { x: LEVELS[i].start.x - 160, y: 90, vw: 340 };
    ST.parts = []; ST.acc = 0; ST.last = 0; ST.frame = 0; ST.t0 = performance.now();
    var N = NET && NET.ready ? NET : null;
    ST.ai = MODE === "ai" && !N; ST.botIn = {}; ST.botAt = 0;
    h.className = "zg-page rope play";
    var hint = N
      ? 'You are the <b style="color:' + COL[N.role].dark + '">' + COL[N.role].name + '</b> monkey. Touch it to run, above it to jump, below it to drop, left of it to go back.'
      : ST.ai ? 'You are the <b style="color:#9c2b25">red</b> monkey. Touch it to run, above it to jump, below it to drop, left of it to go back. The computer plays the blue one.'
      : 'Touch your monkey to run, above it to jump, below it to drop, left of it to go back. <b style="color:#9c2b25">Red</b> and <b style="color:#1c7c82">Blue</b> each touch their own.';
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zr="' + (N ? "leave" : "menu") + '" aria-label="' + (N ? "Leave" : "Levels") + '">‹ ' + (N ? "Leave" : "Levels") + '</button><div><b>Rope Bros</b><small>Level ' + (i + 1) + ' · ' + esc2(LEVELS[i].name) + (N ? ' · with ' + esc2(N.name) : '') + '</small></div>' +
        (N && N.role === 1 ? '' : '<button class="zg-snd" data-zr="restart" aria-label="Restart" title="Restart">↻</button>') + '</div>' +
      '<div class="zr-stage"><canvas class="zr-cv"></canvas><div class="zr-hud"><span data-zr-time>0:00</span><span data-zr-deaths>💦 0</span></div></div>' +
      '<div class="zr-hint">' + hint + '</div>';
    ST.cv = h.querySelector(".zr-cv"); ST.ctx = ST.cv.getContext("2d");
    window.addEventListener("keydown", onKey, true); window.addEventListener("keyup", onKey, true);
    if (N && N.role === 0) netSend({ t: "lvl", i: i });
    ST.raf = requestAnimationFrame(loop);
  }

  // le clavier (pour jouer sur ordinateur) : rouge = Q D Z ou A D W, bleu = flèches
  function onKey(e) {
    var map = { KeyA: [0, "l"], KeyQ: [0, "l"], KeyD: [0, "r"], KeyW: [0, "j"], KeyZ: [0, "j"], KeyS: [0, "d"], ArrowLeft: [1, "l"], ArrowRight: [1, "r"], ArrowUp: [1, "j"], ArrowDown: [1, "d"] };
    var m = map[e.code]; if (!m) return;
    var who = NET && NET.ready ? NET.role : m[0];
    ST.kb[who][m[1]] = e.type === "keydown";
    e.preventDefault();
  }

  function resize() {
    var cv = ST.cv; if (!cv || !cv.parentNode) return false;
    var r = cv.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(100, Math.round(r.width * dpr)), hgt = Math.max(100, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; }
    ST.dpr = dpr;
    return true;
  }

  function loop(ts) {
    if (!ST.cv || !document.body.contains(ST.cv) || !ST.sim) { stop(); return; }
    ST.raf = requestAnimationFrame(loop);
    if (!resize()) return;
    if (!ST.last) ST.last = ts;
    ST.acc += Math.min(100, ts - ST.last); ST.last = ts;
    var S = ST.sim;
    while (ST.acc >= 16.667) {
      ST.acc -= 16.667; ST.frame++;
      var N = NET && NET.ready ? NET : null, pads = padNow();
      if (N && N.role === 1) netGuestFrame(S, N);                               // remote guest: the host runs the game
      else {
        if (ST.ai) { if (ST.frame - ST.botAt >= 5 || ST.botAt > ST.frame) { ST.botIn = botPick(S, 1, pads[0]); ST.botAt = ST.frame; } pads[1] = ST.botIn; }
        S.step(N ? [pads[0], netRin(N)] : pads);
      }
      S.ev.splice(0).forEach(function (ev) {
        if (N && N.role === 0) N.evq.push(ev);
        if (ev.t === "jump") beep(ev.i ? 520 : 440, 0.09, "triangle", 0.05);
        else if (ev.t === "splash") { beep(180, 0.3, "sine", 0.07); for (var q = 0; q < 14; q++) ST.parts.push({ x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 4, life: 40, c: "rgba(120,222,214,.9)" }); }
        else if (ev.t === "win") { [523, 659, 784, 1047].forEach(function (f, n) { setTimeout(function () { beep(f, 0.22, "triangle", 0.06); }, n * 110); }); for (var z = 0; z < 70; z++) ST.parts.push({ x: S.L.flag.x, y: S.L.flag.y - 60, vx: (Math.random() - 0.5) * 7, vy: -3 - Math.random() * 6, life: 90, c: ["#ffd23f", "#ff6b6b", "#4ecdc4", "#a06cd5"][z % 4] }); }
      });
      ST.parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--; });
      ST.parts = ST.parts.filter(function (p) { return p.life > 0; });
      if (S.done && !ST.ended && S.frame - S.doneAt > 50) { ST.ended = true; finish(); }
      if (N && N.role === 0 && ST.frame % 6 === 0) netSnapOut(S, N);
    }
    draw();
    var tEl = ST.host.querySelector("[data-zr-time]"), dEl = ST.host.querySelector("[data-zr-deaths]");
    if (tEl && !S.done) { var sec = Math.floor(S.frame / 60); tEl.textContent = Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); }
    if (dEl) dEl.textContent = "💦 " + S.deaths;
  }

  function draw() {
    var S = ST.sim, cv = ST.cv, ctx = ST.ctx, cw = cv.width, ch = cv.height, L = S.L;
    var A = S.m[0], B = S.m[1], c = ST.cam;
    // la caméra suit les deux singes (et s'éloigne s'ils s'écartent)
    var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    var wantVw = Math.max(330, Math.min(560, Math.abs(A.x - B.x) + 200));
    c.vw += (wantVw - c.vw) * 0.06;
    var sc = cw / c.vw, vh = ch / sc;
    var tx = Math.max(L.minX, Math.min(L.maxX - c.vw, mx - c.vw / 2)), ty = my - vh * 0.58;
    ty = Math.max(-140, Math.min(300 - vh * 0.5, ty));
    c.x += (tx - c.x) * 0.12; c.y += (ty - c.y) * 0.1;
    ST.sc = sc;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBack(ctx, cw, ch, c.x, c.y, sc, ST.frame);
    ctx.setTransform(sc, 0, 0, sc, -c.x * sc, -c.y * sc);
    drawWorld(ctx, S, ST.frame);
    ST.parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30)); ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    // a soft circle under each finger, in the colour of the monkey it moves
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var rc = cv.getBoundingClientRect(), nowT = Date.now();
    Object.keys(ST.touch).forEach(function (id) {
      var r = ST.touch[id]; if (r.end && nowT > r.end) return;
      ctx.globalAlpha = 0.32; ctx.fillStyle = COL[r.mi].body; ctx.beginPath(); ctx.arc((r.x - rc.left) * ST.dpr, (r.y - rc.top) * ST.dpr, 26 * ST.dpr, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.7; ctx.lineWidth = 2 * ST.dpr; ctx.strokeStyle = COL[r.mi].dark; ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function finish() {
    var S = ST.sim, secs = Math.round(S.frame / 60), sv = saved();
    sv.done = sv.done || {};
    if (!sv.done[ST.level] || secs < sv.done[ST.level]) sv.done[ST.level] = secs;
    save(sv);
    var last = ST.level >= LEVELS.length - 1;
    var el = document.createElement("div");
    el.id = "zgend"; el.className = "zg-end";
    el.innerHTML = '<div class="zg-endcard"><div class="zr-win">' + monkeyPic() + '</div><b>' + (last ? "You did it, bros!" : "Level complete!") + '</b>' +
      '<small>' + secs + ' seconds · ' + S.deaths + (S.deaths === 1 ? " splash" : " splashes") + '</small>' +
      (last ? "" : '<button class="zg-big" data-zr="next">Next level</button>') +
      '<button class="zg-big' + (last ? "" : " alt") + '" data-zr="restart">Play again</button>' +
      '<button class="zg-big alt" data-zr="menu">Levels</button>' +
      '<button class="zg-big alt2" data-zg="close">Quit</button></div>';
    ST.host.appendChild(el);
  }

  /* ---------- le toucher : on touche l'écran, par rapport à son singe ----------
     sur le singe = avancer · au-dessus = sauter · en dessous = descendre · à gauche = reculer */
  function monkeyXY(mi) {
    var S = ST.sim, cv = ST.cv; if (!S || !cv) return null;
    var m = S.m[mi], rc = cv.getBoundingClientRect(), k = ST.sc / ST.dpr;
    return { x: rc.left + (m.x - ST.cam.x) * k, y: rc.top + (m.y - ST.cam.y) * k };
  }
  function intent(r) {
    var p = monkeyXY(r.mi); if (!p) return;
    var u = Math.max(24, 13 * ST.sc / ST.dpr * 1.9), dx = r.x - p.x, dy = r.y - p.y;
    var hx = dx > 1.3 * u ? 1 : dx < -1.3 * u ? -1 : 0, up = dy < -u, down = dy > u;
    r.i = { l: hx < 0, r: hx > 0 || (hx === 0 && !up && !down), j: up, d: down && hx === 0 };
  }
  function nearest(x, y) {
    if (NET && NET.ready) return NET.role;
    if (ST.ai) return 0;
    var best = 0, bd = 1e9;
    for (var i = 0; i < 2; i++) { var p = monkeyXY(i); if (!p) continue; var d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } }
    return best;
  }
  function padNow() {
    var now = Date.now(), out = [{}, {}];
    [0, 1].forEach(function (i) { for (var k in ST.kb[i]) if (ST.kb[i][k]) out[i][k] = true; });
    Object.keys(ST.touch).forEach(function (id) {
      var r = ST.touch[id];
      if (r.end && now > r.end) { delete ST.touch[id]; return; }
      for (var k in r.i) if (r.i[k]) out[r.mi][k] = true;
    });
    ST.pad = out;
    return out;
  }
  document.addEventListener("pointerdown", function (e) {
    var st = e.target.closest && e.target.closest(".zr-stage");
    if (!st || !ST.sim) return;
    e.preventDefault();
    try { st.setPointerCapture(e.pointerId); } catch (x) {}
    var r = { mi: nearest(e.clientX, e.clientY), x: e.clientX, y: e.clientY, t0: Date.now(), end: 0, i: {} };
    intent(r); ST.touch[e.pointerId] = r;
  }, true);
  document.addEventListener("pointermove", function (e) {
    var r = ST.touch[e.pointerId]; if (!r || r.end) return;
    r.x = e.clientX; r.y = e.clientY; intent(r);
  }, true);
  function release(e) {
    var r = ST.touch[e.pointerId]; if (!r) return;
    r.end = Math.max(Date.now(), r.t0 + 170);                                   // a quick tap still counts
  }
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
  document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(".zr-stage")) e.preventDefault(); }, true);

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-zr]");
    if (!b) return;
    var a = b.getAttribute("data-zr"), h = document.getElementById("zgame");
    if (!h) return;
    e.preventDefault();
    var endCard = document.getElementById("zgend"); if (endCard && a !== "next-none") endCard.remove();
    if (a === "lv") { if (REMOTE && window.zgOnlineStart) window.zgOnlineStart({ game: "rope", level: +b.getAttribute("data-i") }); else start(h, +b.getAttribute("data-i")); }
    else if (a === "menu") levelSelect(h);
    else if (a === "restart") start(h, ST.level);
    else if (a === "next") start(h, Math.min(LEVELS.length - 1, ST.level + 1));
    else if (a === "mode") { MODE = b.getAttribute("data-v"); REMOTE = MODE === "remote"; levelSelect(h); }
    else if (a === "leave") { netClose(true); levelSelect(h); }
  }, true);

  // quitter le jeu (retour au menu des jeux ou fermeture) : la boucle s'arrête d'elle-même, on libère le clavier
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('[data-zg="hub"],[data-zg="close"]')) stop(); }, true);

  window.ZRope = { open: levelSelect, openOnline: openOnline, peek: function () { return { pad: ST.pad, touch: ST.touch, xy: monkeyXY }; }, start: start, makeSim: makeSim, levels: LEVELS, consts: { R: R, REST: REST }, stop: stop, pic: monkeyPic, botPick: botPick };
})();
