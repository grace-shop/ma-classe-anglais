/* ---- Pool : l'écran du jeu de billard (8-ball) ----
   Le moteur (physique, règles, ordinateur) est dans app-v5-zzzzzzzfs-poolsim.js.
   Ici : la table, les billes qui roulent vraiment (rendues comme des sphères), la queue,
   la ligne de visée, la barre de puissance, l'effet, deux joueurs sur le même écran ou contre l'ordinateur.
   Aucun fichier d'image ni de son : tout est dessiné et synthétisé. */
(function () {
  "use strict";
  var P = window.ZPoolSim;
  if (!P) return;

  var W = P.W, H = P.H, R = P.R;
  var FR = 34;                       // largeur du cadre autour du tapis
  var CUSH = 12;                     // largeur de la bande
  var TW = W + FR * 2, TH = H + FR * 2;
  var KEY = "ec_pool_v1";
  var INV2PI = 1 / (Math.PI * 2), INVPI = 1 / Math.PI;
  var COLORS = [null, "#f6c90e", "#2056d8", "#e3262d", "#5d2f93", "#f47b13", "#0f8d4d", "#8f2424", "#15171c"];
  function col(id) { return COLORS[id > 8 ? id - 8 : id]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var ST = { host: null, raf: 0, last: 0, playing: false, G: null, phase: "menu", mode: "ai", level: "medium", names: ["You", "Computer"] };

  /* ---------- réglages mémorisés ---------- */
  function saved() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  (function () { var s = saved(); if (s.mode === "ai" || s.mode === "two") ST.mode = s.mode; if (P.LEVELS[s.level]) ST.level = s.level; })();
  function remember() { var s = saved(); s.mode = ST.mode; s.level = ST.level; save(s); }

  /* ====================================================================
     LES BILLES : une texture « sphère » par bille, tournée à chaque image
     ==================================================================== */
  var TEX = null;
  function makeTextures() {
    if (TEX) return;
    TEX = [];
    var tw = 320, th = 160;
    for (var id = 0; id < 16; id++) {
      var c = document.createElement("canvas"); c.width = tw; c.height = th;
      var g = c.getContext("2d");
      g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, tw, th);
      if (id >= 1 && id <= 8) { g.fillStyle = col(id); g.fillRect(0, 0, tw, th); }
      if (id > 8) { g.fillStyle = col(id); g.fillRect(0, th * (0.5 - 0.62 / Math.PI), tw, th * (1.24 / Math.PI)); }
      if (id > 0) {
        [0, tw / 2, tw].forEach(function (x) {
          g.fillStyle = "#f7f4ec"; g.beginPath(); g.arc(x, th / 2, 22, 0, 7); g.fill();
          g.fillStyle = "#14161c"; g.font = "bold " + (id > 9 ? 24 : 29) + "px Arial, Helvetica, sans-serif";
          g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(id), x, th / 2 + 1.5);
        });
      } else {
        g.fillStyle = "#d8363a";
        [0, tw / 4, tw / 2, tw * 3 / 4, tw].forEach(function (x) { g.beginPath(); g.arc(x, th / 2, 5.5, 0, 7); g.fill(); });
      }
      TEX.push({ w: tw, h: th, d: g.getImageData(0, 0, tw, th).data });
    }
  }

  /* un « dessinateur » de billes pour un rayon donné en pixels : la forme, la lumière et le reflet sont calculés une fois */
  function Spr(rpx) {
    this.r = rpx;
    var D = this.D = Math.ceil(rpx * 2 + 4), N = D * D, c = D / 2;
    this.nx = new Float32Array(N); this.ny = new Float32Array(N); this.nz = new Float32Array(N);
    this.sh = new Float32Array(N); this.sp = new Float32Array(N);
    this.al = new Uint8ClampedArray(N); this.ins = new Uint8Array(N);
    var L = [-0.42, -0.52, 0.74], ll = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]);
    L = [L[0] / ll, L[1] / ll, L[2] / ll];
    var Hh = [L[0], L[1], L[2] + 1], hl = Math.sqrt(Hh[0] * Hh[0] + Hh[1] * Hh[1] + Hh[2] * Hh[2]);
    Hh = [Hh[0] / hl, Hh[1] / hl, Hh[2] / hl];
    for (var j = 0; j < D; j++) for (var i = 0; i < D; i++) {
      var idx = j * D + i, x = (i + 0.5 - c) / rpx, y = (j + 0.5 - c) / rpx, r2 = x * x + y * y, rr = Math.sqrt(r2);
      var cov = clamp((1 - rr) * rpx + 0.5, 0, 1);
      if (cov <= 0) continue;
      if (r2 > 1) { var k = 1 / rr; x *= k; y *= k; r2 = 1; }
      var z = Math.sqrt(Math.max(0, 1 - r2));
      this.ins[idx] = 1; this.al[idx] = Math.round(cov * 255);
      this.nx[idx] = x; this.ny[idx] = y; this.nz[idx] = z;
      var dif = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
      this.sh[idx] = (0.34 + 0.74 * dif) * (0.66 + 0.34 * Math.pow(z, 0.45));
      var nh = Math.max(0, x * Hh[0] + y * Hh[1] + z * Hh[2]);
      this.sp[idx] = Math.pow(nh, 70) * 0.85 + Math.pow(nh, 9) * 0.1;
    }
    this.img = new ImageData(D, D);
  }
  Spr.prototype.render = function (id, M, cv) {
    makeTextures();
    var T = TEX[id], d = T.d, tw = T.w, th = T.h, o = this.img.data, D = this.D, N = D * D;
    var nx = this.nx, ny = this.ny, nz = this.nz, sh = this.sh, sp = this.sp, al = this.al, ins = this.ins;
    var m0 = M[0], m1 = M[1], m2 = M[2], m3 = M[3], m4 = M[4], m5 = M[5], m6 = M[6], m7 = M[7], m8 = M[8];
    for (var i = 0; i < N; i++) {
      var q = i * 4;
      if (!ins[i]) { o[q + 3] = 0; continue; }
      var x = nx[i], y = ny[i], z = nz[i];
      var lx = m0 * x + m3 * y + m6 * z, ly = m1 * x + m4 * y + m7 * z, lz = m2 * x + m5 * y + m8 * z;
      if (ly > 1) ly = 1; else if (ly < -1) ly = -1;
      var u = (Math.atan2(lx, lz) * INV2PI + 0.5) * tw - 0.5, v = (Math.asin(ly) * INVPI + 0.5) * th - 0.5;
      var u0 = Math.floor(u), v0 = Math.floor(v), fu = u - u0, fv = v - v0, u1 = u0 + 1, v1 = v0 + 1;
      if (u0 < 0) u0 += tw; if (u0 >= tw) u0 -= tw; if (u1 < 0) u1 += tw; if (u1 >= tw) u1 -= tw;
      if (v0 < 0) v0 = 0; if (v0 >= th) v0 = th - 1; if (v1 < 0) v1 = 0; if (v1 >= th) v1 = th - 1;
      var a = (v0 * tw + u0) * 4, b = (v0 * tw + u1) * 4, c = (v1 * tw + u0) * 4, e = (v1 * tw + u1) * 4;
      var w00 = (1 - fu) * (1 - fv), w10 = fu * (1 - fv), w01 = (1 - fu) * fv, w11 = fu * fv;
      var s = sh[i], hi = sp[i] * 255;
      var r = (d[a] * w00 + d[b] * w10 + d[c] * w01 + d[e] * w11) * s + hi;
      var g = (d[a + 1] * w00 + d[b + 1] * w10 + d[c + 1] * w01 + d[e + 1] * w11) * s + hi;
      var bl = (d[a + 2] * w00 + d[b + 2] * w10 + d[c + 2] * w01 + d[e + 2] * w11) * s + hi;
      o[q] = r > 255 ? 255 : r; o[q + 1] = g > 255 ? 255 : g; o[q + 2] = bl > 255 ? 255 : bl; o[q + 3] = al[i];
    }
    cv.getContext("2d").putImageData(this.img, 0, 0);
  };

  function ident() { return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]); }
  /* fait tourner la bille comme si elle roulait de (dx,dy) sur le tapis */
  function roll(M, dx, dy) {
    var d = Math.sqrt(dx * dx + dy * dy); if (d < 1e-4) return false;
    var th = d / R, ax = -dy / d, ay = dx / d, c = Math.cos(th), s = Math.sin(th), t = 1 - c;
    var r00 = t * ax * ax + c, r01 = t * ax * ay, r02 = s * ay, r10 = r01, r11 = t * ay * ay + c, r12 = -s * ax, r20 = -s * ay, r21 = s * ax, r22 = c;
    var a = M[0], b = M[1], cc = M[2], dd = M[3], e = M[4], f = M[5], g = M[6], h = M[7], i = M[8];
    M[0] = r00 * a + r01 * dd + r02 * g; M[1] = r00 * b + r01 * e + r02 * h; M[2] = r00 * cc + r01 * f + r02 * i;
    M[3] = r10 * a + r11 * dd + r12 * g; M[4] = r10 * b + r11 * e + r12 * h; M[5] = r10 * cc + r11 * f + r12 * i;
    M[6] = r20 * a + r21 * dd + r22 * g; M[7] = r20 * b + r21 * e + r22 * h; M[8] = r20 * cc + r21 * f + r22 * i;
    return true;
  }
  function ortho(M) {
    var l = Math.sqrt(M[0] * M[0] + M[1] * M[1] + M[2] * M[2]); M[0] /= l; M[1] /= l; M[2] /= l;
    var p = M[0] * M[3] + M[1] * M[4] + M[2] * M[5]; M[3] -= p * M[0]; M[4] -= p * M[1]; M[5] -= p * M[2];
    l = Math.sqrt(M[3] * M[3] + M[4] * M[4] + M[5] * M[5]); M[3] /= l; M[4] /= l; M[5] /= l;
    M[6] = M[1] * M[5] - M[2] * M[4]; M[7] = M[2] * M[3] - M[0] * M[5]; M[8] = M[0] * M[4] - M[1] * M[3];
  }
  function randOrient() {
    var M = ident(), a = Math.random() * 6.28, c = Math.cos(a), s = Math.sin(a);
    M[0] = c; M[1] = -s; M[3] = s; M[4] = c;
    roll(M, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
    return M;
  }

  /* petites images de billes pour l'en-tête (numéro bien en face) */
  var ICONS = null;
  function icon(id) {
    if (!ICONS) ICONS = {};
    if (ICONS[id]) return ICONS[id];
    var sp = new Spr(15), cv = document.createElement("canvas"); cv.width = cv.height = sp.D;
    sp.render(id, ident(), cv);
    return (ICONS[id] = cv.toDataURL());
  }

  /* ====================================================================
     LA TABLE : dessinée une fois, puis recopiée à chaque image
     ==================================================================== */
  function rrPath(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h - r);
    g.arcTo(x + w, y + h, x + w - r, y + h, r); g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  var PKV = [                                   // les poches telles qu'on les dessine (centre, rayon)
    { x: -3, y: -3, r: 30 }, { x: W + 3, y: -3, r: 30 }, { x: -10, y: H / 2, r: 28 }, { x: W + 10, y: H / 2, r: 28 },
    { x: -3, y: H + 3, r: 30 }, { x: W + 3, y: H + 3, r: 30 }
  ];
  function buildTable() {
    var c = document.createElement("canvas"); c.width = ST.cw; c.height = ST.ch;
    var g = c.getContext("2d"), k = ST.k, i;
    g.setTransform(k, 0, 0, k, FR * k, FR * k);
    /* le cadre */
    var fg = g.createLinearGradient(-FR, -FR, W + FR, H + FR);
    fg.addColorStop(0, "#5a6172"); fg.addColorStop(0.45, "#2c303b"); fg.addColorStop(1, "#12151c");
    rrPath(g, -FR, -FR, TW, TH, 30); g.fillStyle = fg; g.fill();
    g.lineWidth = 1.4; g.strokeStyle = "rgba(255,255,255,.26)"; rrPath(g, -FR + 1.6, -FR + 1.6, TW - 3.2, TH - 3.2, 28); g.stroke();
    g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.2; rrPath(g, -CUSH - 5, -CUSH - 5, W + CUSH * 2 + 10, H + CUSH * 2 + 10, 9); g.stroke();
    g.fillStyle = "#0b1020"; rrPath(g, -CUSH - 4, -CUSH - 4, W + CUSH * 2 + 8, H + CUSH * 2 + 8, 8); g.fill();
    /* le tapis */
    var fl = g.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, H * 0.72);
    fl.addColorStop(0, "#2f8cff"); fl.addColorStop(0.55, "#1f70e2"); fl.addColorStop(1, "#1152bb");
    g.fillStyle = fl; g.fillRect(-3, -3, W + 6, H + 6);
    for (i = 0; i < 2600; i++) {                // le grain du tapis
      g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,20,80,.05)";
      g.fillRect(Math.random() * W, Math.random() * H, 1.1, 1.1);
    }
    var ins = [[0, 0, W, 18, 0, 1], [0, H - 18, W, 18, 0, -1]];
    ins.forEach(function (r) {                  // l'ombre au bord du tapis
      var gr = g.createLinearGradient(0, r[5] > 0 ? 0 : H, 0, r[5] > 0 ? 18 : H - 18);
      gr.addColorStop(0, "rgba(0,12,50,.38)"); gr.addColorStop(1, "rgba(0,12,50,0)"); g.fillStyle = gr; g.fillRect(r[0], r[1], r[2], r[3]);
    });
    [[0, 1], [W, -1]].forEach(function (s) {
      var gr = g.createLinearGradient(s[0], 0, s[0] + s[1] * 18, 0);
      gr.addColorStop(0, "rgba(0,12,50,.38)"); gr.addColorStop(1, "rgba(0,12,50,0)"); g.fillStyle = gr; g.fillRect(s[1] > 0 ? 0 : W - 18, 0, 18, H);
    });
    g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, P.HEAD_Y); g.lineTo(W, P.HEAD_Y); g.stroke();
    g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.arc(P.FOOT.x, P.FOOT.y, 2.2, 0, 7); g.fill();
    g.beginPath(); g.arc(W / 2, P.HEAD_Y, 2.2, 0, 7); g.fill();
    /* les bandes */
    var nrm = [[0, -1], [0, 1], [-1, 0], [-1, 0], [1, 0], [1, 0]];
    P.SEGS.forEach(function (sg, n) {
      var ax = sg[0], ay = sg[1], bx = sg[2], by = sg[3], nx = nrm[n][0], ny = nrm[n][1];
      var dx = bx - ax, dy = by - ay, dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
      var t = CUSH * 0.95;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by);
      g.lineTo(bx - dx * t + nx * CUSH, by - dy * t + ny * CUSH); g.lineTo(ax + dx * t + nx * CUSH, ay + dy * t + ny * CUSH); g.closePath();
      var gr = g.createLinearGradient(ax, ay, ax + nx * CUSH, ay + ny * CUSH);
      gr.addColorStop(0, "#63c4ff"); gr.addColorStop(0.35, "#2f8fe8"); gr.addColorStop(1, "#1a63c2");
      g.fillStyle = gr; g.fill();
      g.strokeStyle = "rgba(210,240,255,.85)"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.strokeStyle = "rgba(0,20,70,.45)"; g.lineWidth = 1; g.beginPath(); g.moveTo(ax + dx * t + nx * CUSH, ay + dy * t + ny * CUSH); g.lineTo(bx - dx * t + nx * CUSH, by - dy * t + ny * CUSH); g.stroke();
    });
    /* les repères sur le cadre */
    var dm = function (x, y) {
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
      g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(-2.6, -2.6 + 0.9, 5.2, 5.2);
      var pg = g.createLinearGradient(-3, -3, 3, 3); pg.addColorStop(0, "#fff"); pg.addColorStop(1, "#aeb8d0");
      g.fillStyle = pg; g.fillRect(-2.6, -2.6, 5.2, 5.2); g.restore();
    };
    var mid = -(CUSH + (FR - CUSH) / 2);
    [1, 2, 3, 5, 6, 7].forEach(function (n) { dm(mid, H * n / 8); dm(W - mid, H * n / 8); });
    [1, 2, 3].forEach(function (n) { dm(W * n / 4, mid); dm(W * n / 4, H - mid); });
    /* les poches */
    PKV.forEach(function (p) {
      var rim = g.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
      rim.addColorStop(0, "#9aa3b8"); rim.addColorStop(1, "#3b4152");
      g.fillStyle = rim; g.beginPath(); g.arc(p.x, p.y, p.r + 3.2, 0, 7); g.fill();
      var hg = g.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r);
      hg.addColorStop(0, "#000"); hg.addColorStop(0.8, "#04060b"); hg.addColorStop(1, "#141925");
      g.fillStyle = hg; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
    });
    ST.table = c;
  }

  /* ====================================================================
     SONS (synthétisés)
     ==================================================================== */
  var AC = null, lastSnd = {};
  function muted() { try { return localStorage.getItem("ec_game_mute") === "1"; } catch (e) { return false; } }
  function ctxA() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function tone(f, f2, dur, type, vol, when) {
    var c = ctxA(); if (!c) return;
    var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function burst(dur, type, freq, q, vol, when) {
    var c = ctxA(); if (!c) return;
    var len = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    var g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + (when || 0));
  }
  function snd(kind, a) {
    if (muted()) return;
    var now = Date.now(); if (lastSnd[kind] && now - lastSnd[kind] < (kind === "ball" ? 22 : 40)) return; lastSnd[kind] = now;
    a = clamp(a == null ? 0.5 : a, 0, 1);
    if (kind === "cue") { burst(0.06, "lowpass", 1500, 0.7, 0.5 + a * 0.5); tone(190, 90, 0.09, "sine", 0.25 + a * 0.25); tone(2400, 1600, 0.03, "triangle", 0.1 + a * 0.12); }
    else if (kind === "ball") { burst(0.03, "highpass", 3600, 1, 0.22 + a * 0.5); tone(1900 + a * 700, 1500, 0.04, "triangle", 0.07 + a * 0.16); }
    else if (kind === "rail") { tone(150, 80, 0.09, "sine", 0.1 + a * 0.28); burst(0.05, "lowpass", 900, 0.8, 0.15 + a * 0.28); }
    else if (kind === "pocket") { tone(110, 55, 0.22, "sine", 0.3); burst(0.2, "lowpass", 420, 1, 0.3); tone(520, 300, 0.08, "triangle", 0.08, 0.05); }
    else if (kind === "foul") { tone(220, 160, 0.16, "sawtooth", 0.07); tone(160, 110, 0.22, "sawtooth", 0.07, 0.14); }
    else if (kind === "win") { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f * 1.01, 0.34, "triangle", 0.14, i * 0.13); }); }
    else if (kind === "turn") { tone(660, 880, 0.08, "sine", 0.08); }
  }

  /* ====================================================================
     LES PAGES : menu, partie, fin de partie
     ==================================================================== */
  var SVG_SND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var SVG_SND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  function sndBtn() { var off = muted(); return '<button class="zg-snd' + (off ? " off" : "") + '" data-zp="snd" aria-label="' + (off ? "Sound on" : "Sound off") + '">' + (off ? SVG_SND_OFF : SVG_SND_ON) + '</button>'; }

  function pic() {
    var balls = [[132, 44, "#f6c90e"], [146, 44, "#e3262d"], [139, 33, "#15171c"], [125, 33, "#2056d8"], [153, 33, "#f47b13"], [132, 22, "#5d2f93"], [146, 22, "#0f8d4d"], [139, 11, "#8f2424"]];
    return '<svg viewBox="0 0 200 104" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
      '<rect width="200" height="104" fill="#12151c"/><rect x="6" y="6" width="188" height="92" rx="12" fill="#2c303b"/>' +
      '<rect x="14" y="14" width="172" height="76" rx="6" fill="#2a83f2"/><rect x="14" y="14" width="172" height="76" rx="6" fill="none" stroke="#63c4ff" stroke-width="3"/>' +
      '<circle cx="14" cy="14" r="8" fill="#04060b"/><circle cx="186" cy="14" r="8" fill="#04060b"/><circle cx="14" cy="90" r="8" fill="#04060b"/><circle cx="186" cy="90" r="8" fill="#04060b"/>' +
      '<circle cx="100" cy="12" r="6" fill="#04060b"/><circle cx="100" cy="92" r="6" fill="#04060b"/>' +
      balls.map(function (b) { return '<circle cx="' + (b[0] + 8) + '" cy="' + (b[1] + 22) + '" r="6.4" fill="' + b[2] + '"/><circle cx="' + (b[0] + 6.4) + '" cy="' + (b[1] + 20) + '" r="1.8" fill="#fff" opacity=".55"/>'; }).join("") +
      '<circle cx="52" cy="52" r="6.4" fill="#f7f4ec"/><circle cx="50.4" cy="50" r="1.8" fill="#fff"/>' +
      '<path d="M16 76 L46 56" stroke="#e8c38c" stroke-width="3" stroke-linecap="round"/><path d="M8 82 L22 72" stroke="#262b4a" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M58 50 L120 18" stroke="#fff" stroke-width="1.2" opacity=".7" stroke-dasharray="3 3"/></svg>';
  }

  function menu(h) {
    stop();
    ST.host = h; ST.phase = "menu";
    var ai = ST.mode === "ai";
    h.className = "zg-page pool menu";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="hub" aria-label="Back">‹ Back</button><div><b>Pool</b><small>8-ball · 2 players or the computer</small></div>' + sndBtn() + '</div>' +
      '<div class="zp-menu">' +
        '<div class="zp-hero">' + pic() + '</div>' +
        '<div class="zg-label">Who do you play against?</div>' +
        '<div class="seg"><button type="button" class="' + (ai ? "on" : "") + '" data-zp="mode" data-v="ai">The computer</button><button type="button" class="' + (ai ? "" : "on") + '" data-zp="mode" data-v="two">Two players</button></div>' +
        (ai ? '<div class="zg-label">Level</div><div class="seg">' +
          ["easy", "medium", "hard"].map(function (l) { return '<button type="button" class="' + (ST.level === l ? "on" : "") + '" data-zp="level" data-v="' + l + '">' + l[0].toUpperCase() + l.slice(1) + '</button>'; }).join("") + '</div>' : '') +
        '<p class="zp-how">' + (ai ? '<b>You</b> break first. ' : '<b>Pass the phone</b> after each turn. ') +
          'Drag on the table to aim: the further from the white ball, the finer the aim. Pull the bar on the right down and let go to shoot. Tap the white ball on the right to add spin. Pot all your balls (solids 1–7 or stripes 9–15). Then tap the pocket where the black 8 will go, and shoot.</p>' +
        '<button class="zg-big alt2" data-zp="start">Play</button>' +
        '<button class="zg-big alt" data-zp="classmate">Play a classmate online</button>' +
      '</div>';
  }

  var HUD_NAMES = ["You", "Computer"];
  function buildGame(h) {
    var G = ST.G;
    var sub = ST.mode === "ai" ? "vs computer · " + ST.level : ST.mode === "online" ? "vs " + ST.match.oppName + " · online" : "2 players";
    h.className = "zg-page pool play";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zp="menu" aria-label="Menu">‹ Menu</button><div><b>Pool</b><small>8-ball · ' + esc(sub) + '</small></div>' +
        (ST.mode === "online" ? "" : '<button class="zg-snd" data-zp="restart" aria-label="Restart" title="Restart">↻</button>') + sndBtn() + '</div>' +
      '<div class="zp-hud">' + [0, 1].map(function (p) {
        return '<div class="zp-pl p' + p + '" data-zp-pl="' + p + '"><div class="zp-av">' + (ST.mode === "ai" && p === 1 ? robot() : esc(ST.names[p].charAt(0).toUpperCase())) + '</div>' +
          '<div class="zp-nm"><b>' + esc(ST.names[p]) + '</b><small data-zp-grp="' + p + '">Open table</small><div class="zp-balls" data-zp-balls="' + p + '"></div></div></div>';
      }).join("") + '</div>' +
      '<div class="zp-status" data-zp-status></div>' +
      '<div class="zp-stage"><div class="zp-board"><canvas class="zp-cv"></canvas><div class="zp-msg" data-zp-msg></div></div>' +
        '<div class="zp-side"><div class="zp-spin" data-zp-spin aria-label="Spin"><i class="zp-dot"></i></div>' +
        '<div class="zp-pw" data-zp-pw aria-label="Power"><div class="zp-track"></div><div class="zp-fill"></div><div class="zp-knob"><b>0</b></div></div></div></div>' +
      '<div class="zp-tray" data-zp-tray></div>';
    ST.cv = h.querySelector(".zp-cv"); ST.board = h.querySelector(".zp-board");
    ST.elStatus = h.querySelector("[data-zp-status]"); ST.elMsg = h.querySelector("[data-zp-msg]");
    ST.elSpin = h.querySelector("[data-zp-spin]"); ST.elPw = h.querySelector("[data-zp-pw]"); ST.elTray = h.querySelector("[data-zp-tray]");
    ST.elKnob = ST.elPw.querySelector(".zp-knob"); ST.elFill = ST.elPw.querySelector(".zp-fill");
  }
  function robot() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4M9 13h.01M15 13h.01M9.5 16.5h5"/></svg>';
  }

  /* ====================================================================
     LA PARTIE
     ==================================================================== */
  function layout() {
    if (!ST.board || !ST.cv) return;
    var bw = ST.board.clientWidth, bh = ST.board.clientHeight;
    if (!bw || !bh) return;
    var css = Math.min(bw / TW, bh / TH);
    var lite = document.documentElement.getAttribute("data-lite") === "1";
    var dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2.5);
    var k = css * dpr;
    if (ST.k && Math.abs(ST.k - k) < 0.001 && ST.cvCss === css) return;
    ST.css = css; ST.cvCss = css; ST.k = k; ST.dpr = dpr;
    ST.cw = Math.round(TW * k); ST.ch = Math.round(TH * k);
    ST.cv.width = ST.cw; ST.cv.height = ST.ch;
    ST.cv.style.width = (TW * css) + "px"; ST.cv.style.height = (TH * css) + "px";
    ST.ctx = ST.cv.getContext("2d");
    buildTable();
    ST.spr = new Spr(Math.max(8, Math.round(R * k)));
    ST.sU = ST.spr.D / k;                               // taille d'une bille à l'écran, en unités de la table
    var sc = document.createElement("canvas"); var sd = Math.ceil(R * 3.4 * k); sc.width = sc.height = sd;
    var sg = sc.getContext("2d"), rg = sg.createRadialGradient(sd / 2, sd / 2, R * k * 0.35, sd / 2, sd / 2, sd / 2);
    rg.addColorStop(0, "rgba(0,10,40,.5)"); rg.addColorStop(1, "rgba(0,10,40,0)"); sg.fillStyle = rg; sg.fillRect(0, 0, sd, sd);
    ST.shadow = sc; ST.shU = sd / k;
    ST.VB.forEach(function (vb) { vb.dirty = true; if (!vb.cv || vb.cv.width !== ST.spr.D) { vb.cv = document.createElement("canvas"); vb.cv.width = vb.cv.height = ST.spr.D; } });
  }

  function newViews() {
    makeTextures();
    ST.VB = [];
    for (var i = 0; i < 16; i++) ST.VB.push({ M: randOrient(), cv: null, dirty: true, px: 0, py: 0, n: 0 });
    var b0 = ST.VB[0].M; b0[0] = 1; b0[1] = 0; b0[2] = 0; b0[3] = 0; b0[4] = 1; b0[5] = 0; b0[6] = 0; b0[7] = 0; b0[8] = 1; roll(b0, 0.3, -3.2);
    syncPrev();
  }
  function syncPrev() { var B = ST.G.S.balls; for (var i = 0; i < 16; i++) { ST.VB[i].px = B[i].x; ST.VB[i].py = B[i].y; } }

  function startGame() {
    var h = ST.host; if (!h) return;
    var e = document.getElementById("zgend"); if (e) e.remove();
    stopLoop();
    ST.names = ST.mode === "ai" ? ["You", "Computer"] : ["Player 1", "Player 2"];
    ST.G = P.newGame();
    ST.potAnim = []; ST.tray = []; ST.parts = []; ST.evi = 0; ST.msgT = 0; ST.msgText = ""; ST.t = 0; ST.endT = 0; ST.cueFade = 0;
    ST.power = 0; ST.sx = 0; ST.sy = 0; ST.strike = null; ST.ai = null; ST.dragCue = null; ST.aimDrag = null; ST.pwDrag = false; ST.k = 0;
    buildGame(h);
    newViews();
    ST.playing = true;
    layout();
    ST.aim = defaultAim();
    updateHud(); updateTray(); setSpinUi(); setPowerUi(0);
    beginTurnText(true);
    ST.phase = "aim";
    ST.last = 0; ST.raf = requestAnimationFrame(frame);
    if (!ST.ro && window.ResizeObserver) { ST.ro = new ResizeObserver(function () { layout(); }); }
    if (ST.ro) { try { ST.ro.disconnect(); ST.ro.observe(ST.board); } catch (e2) {} }
    bindInputs();
  }

  function humanTurn() {
    if (ST.mode === "two") return true;
    if (ST.mode === "online") return ST.G.turn === ST.you;
    return ST.G.turn === 0;
  }
  // le joueur a rentré toutes ses billes : il doit annoncer la poche de la noire
  function needCall() { var G = ST.G; return !!G && !G.over && !G.breakShot && G.group[G.turn] != null && P.ballsLeft(G, G.turn) === 0; }
  var POCKET_NAMES = ["top left", "top right", "middle left", "middle right", "bottom left", "bottom right"];
  function pocketAt(w) { var best = -1, bd = 1e9; PKV.forEach(function (p, k) { var d = Math.hypot(w.x - p.x, w.y - p.y); if (d < p.r + 12 && d < bd) { bd = d; best = k; } }); return best; }
  function tryStrike() {
    var G = ST.G;
    if (!canAct() || ST.power <= 0.04) return false;
    if (needCall() && G.call == null) { say("Tap a pocket to call the 8 ball first", "bad", 2); return false; }
    strike(ST.power, ST.sx, ST.sy, ST.aim); return true;
  }
  function canAct() { return ST.playing && ST.phase === "aim" && humanTurn() && !ST.G.over; }

  function defaultAim() {
    var G = ST.G, cue = G.S.balls[0], tg = P.targets(G, G.turn), best = null, bd = 1e9;
    tg.forEach(function (id) { var b = G.S.balls[id]; if (!b.on) return; var d = Math.hypot(b.x - cue.x, b.y - cue.y); if (d < bd) { bd = d; best = b; } });
    return best ? Math.atan2(best.y - cue.y, best.x - cue.x) : -Math.PI / 2;
  }

  function say(text, tone, secs) {
    if (!ST.elMsg) return;
    ST.msgText = text; ST.msgT = secs || 2.4;
    ST.elMsg.textContent = text; ST.elMsg.className = "zp-msg show" + (tone ? " " + tone : "");
  }
  function status(text) { if (ST.elStatus) ST.elStatus.textContent = text; }

  function groupName(g) { return g === 0 ? "Solids" : g === 1 ? "Stripes" : "Open table"; }
  function updateHud() {
    var G = ST.G, h = ST.host; if (!h) return;
    for (var p = 0; p < 2; p++) {
      var el = h.querySelector('[data-zp-pl="' + p + '"]'); if (!el) continue;
      el.classList.toggle("on", G.turn === p && !G.over);
      var left = P.ballsLeft(G, p), g = G.group[p];
      var sm = h.querySelector('[data-zp-grp="' + p + '"]');
      sm.textContent = g == null ? "Open table" : (left === 0 ? "Black 8" : groupName(g) + " · " + left + " left");
      var bx = h.querySelector('[data-zp-balls="' + p + '"]'), html = "", i;
      if (g == null) { for (i = 0; i < 7; i++) html += '<i class="zp-bi blank"></i>'; }
      else {
        for (i = 1; i <= 7; i++) { var id = g === 0 ? i : i + 8; html += '<i class="zp-bi' + (G.S.balls[id].on ? "" : " out") + '" style="background-image:url(' + icon(id) + ')"></i>'; }
        html += '<i class="zp-bi eight' + (left === 0 && G.S.balls[8].on ? "" : (G.S.balls[8].on ? " dim" : " out")) + '" style="background-image:url(' + icon(8) + ')"></i>';
      }
      bx.innerHTML = html;
    }
  }
  function updateTray() {
    if (!ST.elTray) return;
    ST.elTray.innerHTML = ST.tray.map(function (id) { return '<i class="zp-bi" style="background-image:url(' + icon(id) + ')"></i>'; }).join("") || '<span>Potted balls appear here</span>';
  }
  function beginTurnText(first) {
    var G = ST.G, nm = ST.names[G.turn];
    if (G.over) return;
    if (!humanTurn()) { status(ST.mode === "ai" ? "Computer is thinking…" : "Waiting for " + nm + "…"); return; }
    if (needCall()) { status("Tap a pocket to call the 8 ball"); return; }
    if (ST.mode === "online") status(G.hand ? "Place the white ball, then aim" : first ? "Break! Drag to aim, pull the bar to shoot" : "Your shot");
    else if (ST.mode === "ai") status(G.hand ? "Drag the white ball where you want it, then aim" : first ? "Break! Drag to aim, pull the bar to shoot" : "Your shot");
    else status(nm + (G.hand ? " · place the white ball, then aim" : first ? " · break shot" : " · your shot"));
  }

  function beginTurn() {
    var G = ST.G;
    ST.power = 0; ST.sx = 0; ST.sy = 0; setSpinUi(); setPowerUi(0);
    ST.aim = defaultAim();
    updateHud();
    if (G.over) return;
    ST.cueFade = 0;
    G.call = null;
    if (humanTurn()) { ST.phase = "aim"; ST.ai = null; }
    else if (ST.mode === "ai") { ST.phase = "ai"; ST.ai = { step: "think", t: 0 }; }
    else { ST.phase = "wait"; ST.ai = null; }
    beginTurnText(false);
    if (ST.mode === "two" || (ST.mode === "online" && humanTurn())) snd("turn");
  }

  function strike(power, sx, sy, angle) {
    ST.phase = "strike"; ST.strikeT = 0; ST.strike = { p: power, sx: sx, sy: sy, a: angle };
  }

  function onShotEnd(res) {
    if (ST.mode === "online" && res.player !== ST.you && ST.remote) { ST.G = P.des(ST.remote.auth); ST.remote = null; }   // on prend l'état officiel
    var G = ST.G, who = res.player, nm = ST.names;
    ST.phase = "turn"; ST.strike = null;
    syncPrev();
    updateHud();
    if (ST.mode === "online" && res.player === ST.you) pushState();
    if (G.over) {
      var humanWon = ST.mode === "two" || (ST.mode === "online" ? G.winner === ST.you : G.winner === 0);
      snd(humanWon ? "win" : "foul");
      ST.phase = "over"; ST.endT = 1.1; spawnConfetti();
      say(res.reason ? res.reason : "", "bad", 3);
      status(nm[G.winner] + (G.winner === 0 && ST.mode === "ai" ? " win!" : " wins!"));
      return;
    }
    var msg = "", tone = "ok";
    if (res.respotted8) { msg = "The 8 ball is put back"; }
    else if (res.foul) { msg = "Foul · " + res.reason; tone = "bad"; snd("foul"); }
    else if (res.assigned) { msg = nm[who] + (ST.mode === "ai" && who === 0 ? ": " : " has ") + groupName(G.group[who]).toLowerCase(); }
    else if (res.keep && res.potted.length) { msg = res.potted.length > 1 ? "Great shot!" : "Nice shot!"; }
    if (msg) say(msg, tone, 2.6);
    if (res.foul && G.hand) { var nx = G.turn; say(msg + " · ball in hand for " + (nx === ST.you || (ST.mode === "ai" && nx === 0) ? "you" : nm[nx]), "bad", 3); }
    beginTurn();
  }

  /* ---------- l'ordinateur ---------- */
  function aiUpdate(dt) {
    var G = ST.G, A = ST.ai; if (!A) return;
    A.t += dt;
    var cue = G.S.balls[0];
    if (A.step === "think") {
      if (A.t < 0.9) return;
      if (G.hand) {
        var hnd = P.chooseHand(G, ST.level);
        A.hand = { x0: cue.x, y0: cue.y, x1: hnd.x, y1: hnd.y }; A.step = "hand"; A.t = 0;
      } else aiPlan();
    } else if (A.step === "hand") {
      var k = ease(Math.min(1, A.t / 0.6));
      cue.x = A.hand.x0 + (A.hand.x1 - A.hand.x0) * k; cue.y = A.hand.y0 + (A.hand.y1 - A.hand.y0) * k;
      if (A.t >= 0.6) {
        if (!P.place(G, A.hand.x1, A.hand.y1)) { var f = P.freeSpot(G, A.hand.x1, A.hand.y1, false); P.place(G, f.x, f.y); }
        syncPrev(); ST.aim = defaultAim(); aiPlan();
      }
    } else if (A.step === "aim") {
      var k2 = ease(Math.min(1, A.t / A.dur));
      ST.aim = A.from + (A.to - A.from) * k2;
      if (A.t >= A.dur) { A.step = "pull"; A.t = 0; }
    } else if (A.step === "pull") {
      var pd = A.fast ? 0.12 : 0.5;
      var k3 = Math.min(1, A.t / pd);
      ST.power = A.sh.power * ease(k3); setPowerUi(ST.power);
      if (A.t >= pd + 0.12) { ST.ai = null; strike(A.sh.power, A.sh.sx, A.sh.sy, A.sh.angle); }
    }
  }
  function aiPlan() {
    var G = ST.G, A = ST.ai, sh;
    if (needCall()) {
      var ps = P.potShots(G, G.turn).filter(function (q) { return q.id === 8; });
      if (ps.length) { G.call = ps[0].pocket; sh = { angle: ps[0].angle, power: clamp((P.powerToPot(ps[0].d1, ps[0].d2, ps[0].cos) || 0.8), 0.25, 1), sx: 0, sy: 0 }; }
      else {
        var b8 = G.S.balls[8], bk = 1e9; G.call = 0;
        P.POCKETS.forEach(function (pk, k) { var q = (pk.x - b8.x) * (pk.x - b8.x) + (pk.y - b8.y) * (pk.y - b8.y); if (q < bk) { bk = q; G.call = k; } });
        sh = P.chooseShot(G, ST.level);
      }
    } else sh = P.chooseShot(G, ST.level);
    var from = ST.aim, to = sh.angle, d = to - from;
    while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    A.sh = sh; A.from = from; A.to = from + d; A.dur = 0.45 + 0.5 * Math.min(1, Math.abs(d) / Math.PI);
    ST.sx = sh.sx; ST.sy = sh.sy; setSpinUi();
    A.step = "aim"; A.t = 0;
    status("Computer is aiming…");
  }

  /* ---------- la boucle ---------- */
  function frame(t) {
    ST.raf = requestAnimationFrame(frame);
    if (!ST.playing) return;
    var dt = ST.last ? Math.min(0.05, (t - ST.last) / 1000) : 0.016; ST.last = t;
    try { update(dt); draw(); } catch (e) { ST.err = e; }
  }
  function update(dt) {
    var G = ST.G; if (!G) return;
    if (ST.mode === "online" && ST.phase === "aim" && humanTurn()) {
      ST.bcT = (ST.bcT || 0) + dt;
      if (ST.bcT >= 0.12) { ST.bcT = 0; sendBc("aim", { a: ST.aim, p: ST.power, sx: ST.sx, sy: ST.sy }); }
    }
    if (ST.pending && (ST.phase === "wait" || ST.phase === "aim")) { var pr = ST.pending; ST.pending = null; onRow(pr); G = ST.G; }
    ST.t += dt;
    if (ST.msgT > 0) { ST.msgT -= dt; if (ST.msgT <= 0 && ST.elMsg) ST.elMsg.className = "zp-msg"; }
    if (ST.phase === "ai") aiUpdate(dt);
    if (ST.phase === "strike") {
      ST.strikeT += dt;
      var T = 0.085, k = Math.min(1, ST.strikeT / T);
      ST.power = ST.strike.p * (1 - ease(k)); ST.thrust = k;
      if (k >= 1) {
        var s = ST.strike;
        ST.lastShot = { a: s.a, p: s.p, sx: s.sx, sy: s.sy, call: G.call, hp: G.hand ? { x: G.S.balls[0].x, y: G.S.balls[0].y } : null };
        if (ST.mode === "online") pushShot(G);   // en direct : l'autre voit le coup au moment où je tire
        P.takeShot(G, s.a, s.p, s.sx, s.sy);
        ST.evi = 0; ST.phase = "roll"; ST.cueFade = 1; ST.pwDrag = false;
        ST.power = 0; setPowerUi(0);
        status(ST.mode === "ai" && !humanTurn() ? "Computer plays" : "…");
      }
    }
    if (ST.phase === "roll") {
      var res = P.advance(G, dt);
      pumpEvents();
      if (res) onShotEnd(res);
    }
    if (ST.cueFade > 0 && ST.phase !== "strike") ST.cueFade = Math.max(0, ST.cueFade - dt * 4);
    if (ST.phase === "over") { ST.endT -= dt; if (ST.endT <= 0 && !document.getElementById("zgend")) showEnd(); }
    for (var i = ST.potAnim.length - 1; i >= 0; i--) {
      var a = ST.potAnim[i]; a.t += dt;
      if (a.t >= a.dur) { ST.potAnim.splice(i, 1); ST.tray.push(a.id); updateTray(); updateHud(); }
    }
    for (i = ST.parts.length - 1; i >= 0; i--) {
      var p = ST.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.rot += p.vr * dt; p.life -= dt;
      if (p.life <= 0 || p.y > H + FR) ST.parts.splice(i, 1);
    }
  }
  function pumpEvents() {
    var ev = ST.G.S.ev;
    for (; ST.evi < ev.length; ST.evi++) {
      var e = ev[ST.evi];
      if (e.t === "cue") snd("cue", e.s / P.MAXV);
      else if (e.t === "ball") snd("ball", clamp(e.s / 900, 0, 1));
      else if (e.t === "rail") snd("rail", clamp(e.s / 700, 0, 1));
      else if (e.t === "pocket") {
        snd("pocket", 0.5);
        var pk = PKV[e.pk]; var tx = pk.x + (pk.x < 0 ? 6 : pk.x > W ? -6 : 0), ty = pk.y + (pk.y < 0 ? 6 : pk.y > H ? -6 : 0);
        ST.potAnim.push({ id: e.id, x0: e.x, y0: e.y, x1: tx, y1: ty, t: 0, dur: 0.3, vx: e.vx, vy: e.vy });
      }
    }
  }

  /* ---------- le dessin ---------- */
  function drawBall(g, id, x, y, scale, dark) {
    var vb = ST.VB[id], sU = ST.sU;
    if (vb.dirty) { ST.spr.render(id, vb.M, vb.cv); vb.dirty = false; }
    var s = sU * scale;
    g.drawImage(vb.cv, x - s / 2, y - s / 2, s, s);
    if (dark) { g.globalAlpha = dark; g.fillStyle = "#000"; g.beginPath(); g.arc(x, y, R * scale, 0, 7); g.fill(); g.globalAlpha = 1; }
  }
  function draw() {
    var g = ST.ctx, G = ST.G, S = G.S, k = ST.k, B = S.balls, i;
    if (!g || !ST.table) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(ST.table, 0, 0);
    g.setTransform(k, 0, 0, k, FR * k, FR * k);
    /* le triangle de départ / la zone où poser la blanche */
    var aiming = ST.phase === "aim" && humanTurn() && !G.over;
    if (G.hand && (aiming || (ST.ai && ST.ai.step === "hand"))) {
      var pulse = 0.55 + 0.45 * Math.sin(ST.t * 5);
      if (G.kitchen) { g.fillStyle = "rgba(255,255,255," + (0.07 * pulse) + ")"; g.fillRect(0, P.HEAD_Y, W, H - P.HEAD_Y); }
    }
    /* les mises à jour de rotation des billes */
    for (i = 0; i < 16; i++) {
      var b = B[i], vb = ST.VB[i]; if (!b.on) continue;
      var dx = b.x - vb.px, dy = b.y - vb.py;
      if (dx * dx + dy * dy > 1600) { vb.px = b.x; vb.py = b.y; }
      else if (roll(vb.M, dx, dy)) { vb.dirty = true; vb.px = b.x; vb.py = b.y; if ((++vb.n & 127) === 0) ortho(vb.M); }
    }
    /* les ombres, puis les billes */
    for (i = 0; i < 16; i++) { var s0 = B[i]; if (s0.on) g.drawImage(ST.shadow, s0.x + 2.2 - ST.shU / 2, s0.y + 3.4 - ST.shU / 2, ST.shU, ST.shU); }
    for (i = 15; i >= 1; i--) if (B[i].on) drawBall(g, i, B[i].x, B[i].y, 1);
    if (B[0].on) {
      if (G.hand && aiming) { g.strokeStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(ST.t * 6)) + ")"; g.lineWidth = 1.6; g.beginPath(); g.arc(B[0].x, B[0].y, R + 5, 0, 7); g.stroke(); }
      drawBall(g, 0, B[0].x, B[0].y, 1);
    }
    /* les billes qui tombent dans la poche */
    ST.potAnim.forEach(function (a) {
      var k2 = a.t / a.dur, e2 = k2 * k2, x = a.x0 + (a.x1 - a.x0) * e2 + a.vx * 0.0006 * (1 - e2), y = a.y0 + (a.y1 - a.y0) * e2 + a.vy * 0.0006 * (1 - e2);
      drawBall(g, a.id, x, y, 1 - 0.42 * k2, 0.75 * k2);
    });
    if (ST.dragCue && ST.dragCue.bad) { g.strokeStyle = "rgba(255,80,80,.9)"; g.lineWidth = 2; g.beginPath(); g.arc(ST.dragCue.x, ST.dragCue.y, R + 1, 0, 7); g.stroke(); }
    if (aiming && needCall()) {
      var pulse2 = 0.5 + 0.5 * Math.sin(ST.t * 6);
      PKV.forEach(function (p, k) {
        g.beginPath(); g.arc(p.x, p.y, p.r - 2, 0, 7);
        g.lineWidth = k === G.call ? 3.2 : 2;
        g.strokeStyle = k === G.call ? "rgba(255,206,60,.95)" : "rgba(255,255,255," + (0.25 + 0.35 * pulse2) + ")";
        g.stroke();
      });
    }
    /* la visée et la queue */
    if ((ST.phase === "aim" && humanTurn()) || ST.phase === "ai" || ST.phase === "strike") {
      if (B[0].on && !(ST.ai && ST.ai.step === "hand") && !(ST.dragCue)) { drawGuide(g); drawCue(g, 1); }
    } else if (ST.mode === "online" && ST.phase === "wait" && ST.remoteAim && Date.now() - ST.remoteAim.t < 1500) { drawGuide(g, ST.remoteAim); drawCue(g, 1, ST.remoteAim); }
    else if (ST.cueFade > 0) drawCue(g, ST.cueFade);
    /* les confettis */
    ST.parts.forEach(function (p) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life); g.fillStyle = p.c; g.fillRect(-3, -1.8, 6, 3.6); g.restore();
    });
    g.globalAlpha = 1;
  }

  function drawGuide(g, o) {
    var G = ST.G, S = G.S, cue = S.balls[0], a = o ? o.a : ST.aim, pr = P.predict(S, a);
    var legal = true;
    if (pr.hit != null) { legal = P.targets(G, G.turn).indexOf(pr.hit) >= 0; }
    var aimCol = legal ? "255,255,255" : "255,120,120";
    g.lineCap = "round";
    g.strokeStyle = "rgba(" + aimCol + ",.78)"; g.lineWidth = 1.5; g.setLineDash([]);
    g.beginPath(); g.moveTo(cue.x + pr.dx * R, cue.y + pr.dy * R); g.lineTo(pr.gx, pr.gy); g.stroke();
    g.strokeStyle = "rgba(" + aimCol + ",.9)"; g.lineWidth = 1.4;
    g.beginPath(); g.arc(pr.gx, pr.gy, R - 0.5, 0, 7); g.stroke();
    if (pr.hit != null) {
      g.strokeStyle = "rgba(255,255,255,.62)"; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(pr.tx, pr.ty); g.lineTo(pr.tx + pr.nx * 80, pr.ty + pr.ny * 80); g.stroke();
      g.strokeStyle = "rgba(190,225,255,.55)"; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(pr.gx, pr.gy); g.lineTo(pr.gx + pr.cx * 42, pr.gy + pr.cy * 42); g.stroke();
      if (!legal) { g.strokeStyle = "rgba(255,90,90,.95)"; g.lineWidth = 2; var q = 5; g.beginPath(); g.moveTo(pr.tx - q, pr.ty - q); g.lineTo(pr.tx + q, pr.ty + q); g.moveTo(pr.tx + q, pr.ty - q); g.lineTo(pr.tx - q, pr.ty + q); g.stroke(); }
    } else {
      g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(pr.gx, pr.gy); g.lineTo(pr.gx + pr.rx * 55, pr.gy + pr.ry * 55); g.stroke();
    }
  }

  /* la queue : un bâton effilé derrière la blanche, qui recule avec la puissance */
  function drawCue(g, alpha, o) {
    var cue = ST.G.S.balls[0], a = o ? o.a : ST.aim, dx = Math.cos(a), dy = Math.sin(a);
    var pw = o ? o.p : ST.power, sxx = o ? o.sx : ST.sx;
    var pull = pw * 80, gap = R + 4 + pull;
    var off = sxx * R * 0.5, rx = -dy, ry = dx;
    var tx = cue.x - dx * gap + rx * off, ty = cue.y - dy * gap + ry * off, L = 330;
    g.save(); g.globalAlpha = alpha;
    g.translate(tx, ty); g.rotate(Math.atan2(dy, dx));
    // l'ombre
    g.fillStyle = "rgba(0,10,40,.28)"; g.beginPath(); g.moveTo(-1, 3.2); g.lineTo(-L, 4.2 + 2.6); g.lineTo(-L, 4.2 - 2.6 + 4); g.lineTo(-1, 3.2 + 2.2); g.closePath(); g.fill();
    // le bois
    var gr = g.createLinearGradient(0, -3, 0, 3);
    gr.addColorStop(0, "#f6dcae"); gr.addColorStop(0.5, "#d9a566"); gr.addColorStop(1, "#a7733b");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -1.5); g.lineTo(-L, -3.4); g.lineTo(-L, 3.4); g.lineTo(0, 1.5); g.closePath(); g.fill();
    // le manche (partie foncée avec un liseré)
    var bg = g.createLinearGradient(0, -3.4, 0, 3.4); bg.addColorStop(0, "#3a4268"); bg.addColorStop(0.5, "#242a48"); bg.addColorStop(1, "#14172b");
    g.fillStyle = bg; g.beginPath(); g.moveTo(-L * 0.52, -2.5); g.lineTo(-L, -3.4); g.lineTo(-L, 3.4); g.lineTo(-L * 0.52, 2.5); g.closePath(); g.fill();
    g.fillStyle = "#63c4ff"; g.fillRect(-L * 0.52 - 1, -2.5, 2.4, 5);
    g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(-L * 0.9, -2.6, L * 0.34, 1);
    // la virole et le procédé
    g.fillStyle = "#e9f1ff"; g.beginPath(); g.moveTo(-0.5, -1.55); g.lineTo(-7, -1.8); g.lineTo(-7, 1.8); g.lineTo(-0.5, 1.55); g.closePath(); g.fill();
    g.fillStyle = "#3f7fd0"; g.beginPath(); g.moveTo(0.6, -1.45); g.lineTo(-1.2, -1.55); g.lineTo(-1.2, 1.55); g.lineTo(0.6, 1.45); g.closePath(); g.fill();
    g.restore();
  }

  function spawnConfetti() {
    var cols = ["#f6c90e", "#e3262d", "#2f8cff", "#0f8d4d", "#f47b13", "#ffffff", "#c06bff"];
    for (var i = 0; i < 140; i++) ST.parts.push({ x: Math.random() * W, y: -FR + Math.random() * 30, vx: (Math.random() - 0.5) * 90, vy: 40 + Math.random() * 130, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, life: 2.6 + Math.random() * 2, c: cols[i % cols.length] });
  }

  function showEnd() {
    var G = ST.G, nm = ST.names, w = G.winner, r = G.last && G.last.reason;
    var you = (ST.mode === "ai" && w === 0) || (ST.mode === "online" && w === ST.you), lose = (ST.mode === "ai" && w === 1) || (ST.mode === "online" && w !== ST.you);
    var el = document.createElement("div"); el.id = "zgend"; el.className = "zg-end";
    el.innerHTML = '<div class="zg-endcard"><div class="zp-trophy">' +
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="#f6c90e" stroke="#a87800" stroke-width="2"/><path d="M20 12h-8c0 10 4 14 10 15M44 12h8c0 10-4 14-10 15" fill="none" stroke="#f6c90e" stroke-width="3"/><rect x="28" y="34" width="8" height="10" fill="#d9a800"/><rect x="20" y="44" width="24" height="7" rx="2" fill="#a87800"/><path d="M26 14c0 6 2 9 4 10" stroke="#fff6c8" stroke-width="2" fill="none" stroke-linecap="round"/></svg></div>' +
      '<b>' + (you ? "You win!" : (lose && ST.mode === "ai") ? "The computer wins" : esc(nm[w]) + " wins!") + '</b>' +
      '<small>' + (r ? esc(r) : (you ? "Great game." : "Good game.")) + '</small>' +
      (ST.mode === "online" ? '<button class="zg-big" data-zp="restartOnline">Play again</button>' : '<button class="zg-big" data-zp="restart">Play again</button>') +
      '<button class="zg-big alt" data-zp="menu">Menu</button>' +
      '<button class="zg-big alt2" data-zg="close">Quit</button></div>';
    ST.host.appendChild(el);
  }

  /* ====================================================================
     LES COMMANDES
     ==================================================================== */
  function toWorld(e) {
    var r = ST.cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * TW - FR, y: (e.clientY - r.top) / r.height * TH - FR };
  }
  function cueScreen() {
    var r = ST.cv.getBoundingClientRect(), c = ST.G.S.balls[0];
    return { x: r.left + (c.x + FR) / TW * r.width, y: r.top + (c.y + FR) / TH * r.height };
  }
  function setPowerUi(p) {
    if (!ST.elKnob) return;
    var tr = ST.elPw.clientHeight, ph = ST.elKnob.offsetHeight || 40, y = p * (tr - ph);
    ST.elKnob.style.transform = "translateY(" + y + "px)";
    ST.elKnob.firstChild.textContent = Math.round(p * 100);
    ST.elFill.style.height = Math.max(0, y + ph / 2) + "px";
    ST.elPw.classList.toggle("hot", p > 0.75);
  }
  function setSpinUi() {
    if (!ST.elSpin) return;
    var d = ST.elSpin.firstChild, r = ST.elSpin.clientWidth / 2 - 7;
    d.style.transform = "translate(" + (ST.sx * r) + "px," + (-ST.sy * r) + "px)";
  }

  var bound = false;
  function bindInputs() {
    if (bound) return; bound = true;
    var cv = ST.cv;
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onUp, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
  }
  function unbind() {
    if (!bound) return; bound = false;
    document.removeEventListener("pointerdown", onDown, true);
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("pointerup", onUp, true);
    document.removeEventListener("pointercancel", onUp, true);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onResize);
  }
  function onResize() { ST.k = 0; layout(); setPowerUi(ST.power); }

  function onDown(e) {
    if (!ST.playing || !e.target || !e.target.closest) return;
    var cvEl = e.target.closest(".zp-cv"), pw = e.target.closest("[data-zp-pw]"), sp = e.target.closest("[data-zp-spin]");
    if (!cvEl && !pw && !sp) return;
    e.preventDefault();
    ctxA();
    if (!canAct()) return;
    var G = ST.G;
    if (sp) { ST.spinDrag = e.pointerId; try { sp.setPointerCapture(e.pointerId); } catch (x) {} spinFrom(e); return; }
    if (pw) { ST.pwDrag = e.pointerId; try { pw.setPointerCapture(e.pointerId); } catch (x) {} powerFrom(e); return; }
    var w = toWorld(e), c = G.S.balls[0];
    if (needCall()) { var pk = pocketAt(w); if (pk >= 0) { G.call = pk; say("Called: " + POCKET_NAMES[pk], "ok", 2); return; } }
    if (G.hand && Math.hypot(w.x - c.x, w.y - c.y) < R * 2.6) {
      ST.dragCue = { id: e.pointerId, x: c.x, y: c.y, bad: false, dx: c.x - w.x, dy: c.y - w.y };
      try { cvEl.setPointerCapture(e.pointerId); } catch (x) {}
      return;
    }
    ST.aimDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { cvEl.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function spinFrom(e) {
    var r = ST.elSpin.getBoundingClientRect(), rad = r.width / 2;
    var x = (e.clientX - (r.left + rad)) / (rad - 7), y = (e.clientY - (r.top + rad)) / (rad - 7), m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    if (m < 0.12) { x = 0; y = 0; }
    ST.sx = x; ST.sy = -y; setSpinUi();
  }
  function powerFrom(e) {
    var r = ST.elPw.getBoundingClientRect(), ph = ST.elKnob.offsetHeight || 40;
    var p = clamp((e.clientY - r.top - ph / 2) / (r.height - ph), 0, 1);
    ST.power = p; setPowerUi(p);
  }
  function onMove(e) {
    if (!ST.playing) return;
    if (ST.spinDrag === e.pointerId) { spinFrom(e); return; }
    if (ST.pwDrag === e.pointerId) { powerFrom(e); return; }
    var G = ST.G;
    if (ST.dragCue && ST.dragCue.id === e.pointerId) {
      var w = toWorld(e), x = w.x + ST.dragCue.dx, y = w.y + ST.dragCue.dy, c = G.S.balls[0];
      x = clamp(x, R + 3, W - R - 3); y = clamp(y, R + 3, H - R - 3);
      var ok = P.canPlace(G, x, y);
      ST.dragCue.x = x; ST.dragCue.y = y; ST.dragCue.bad = !ok;
      if (ok) { c.x = x; c.y = y; }
      else {                                            // on essaie de glisser le long d'un obstacle
        if (P.canPlace(G, x, c.y)) { c.x = x; } else if (P.canPlace(G, c.x, y)) { c.y = y; }
      }
      ST.VB[0].px = c.x; ST.VB[0].py = c.y;
      return;
    }
    if (ST.aimDrag && ST.aimDrag.id === e.pointerId) {
      var d = ST.aimDrag, dx = e.clientX - d.x, dy = e.clientY - d.y, cs = cueScreen();
      var rx = d.x - cs.x, ry = d.y - cs.y, r2 = Math.max(rx * rx + ry * ry, 64 * 64);
      ST.aim += (rx * dy - ry * dx) / r2;
      d.x = e.clientX; d.y = e.clientY;
    }
  }
  function onUp(e) {
    if (!ST.playing) return;
    if (ST.spinDrag === e.pointerId) { ST.spinDrag = null; return; }
    if (ST.pwDrag === e.pointerId) {
      ST.pwDrag = false;
      if (!tryStrike()) { ST.power = 0; setPowerUi(0); }
      return;
    }
    if (ST.dragCue && ST.dragCue.id === e.pointerId) {
      ST.dragCue = null; ST.G.S.balls[0].on = true; syncPrev();
      return;
    }
    if (ST.aimDrag && ST.aimDrag.id === e.pointerId) ST.aimDrag = null;
  }
  function onKey(e) {
    if (!ST.playing || !canAct()) return;
    var step = e.shiftKey ? 0.02 : 0.003;
    if (e.code === "ArrowLeft") { ST.aim -= step; e.preventDefault(); }
    else if (e.code === "ArrowRight") { ST.aim += step; e.preventDefault(); }
    else if (e.code === "ArrowUp") { ST.power = clamp(ST.power - 0.04, 0, 1); setPowerUi(ST.power); e.preventDefault(); }
    else if (e.code === "ArrowDown") { ST.power = clamp(ST.power + 0.04, 0, 1); setPowerUi(ST.power); e.preventDefault(); }
    else if (e.code === "Space" || e.code === "Enter") { tryStrike(); e.preventDefault(); }
  }

  /* ---------- les clics (menu, boutons) ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-zp]");
    if (!b) return;
    var h = document.getElementById("zgame");
    if (!h || !h.classList.contains("pool")) return;
    e.preventDefault();
    var a = b.getAttribute("data-zp");
    if (a === "mode") { ST.mode = b.getAttribute("data-v"); remember(); menu(h); }
    else if (a === "level") { ST.level = b.getAttribute("data-v"); remember(); menu(h); }
    else if (a === "start" || a === "restart") startGame();
    else if (a === "restartOnline") restartOnline();
    else if (a === "classmate") { if (window.zgOnlineStart) window.zgOnlineStart({ game: "pool", cols: [0, 1] }); }
    else if (a === "menu") { var en = document.getElementById("zgend"); if (en) en.remove(); menu(h); }
    else if (a === "snd") {
      try { localStorage.setItem("ec_game_mute", muted() ? "0" : "1"); } catch (x) {}
      var off = muted(); b.className = "zg-snd" + (off ? " off" : ""); b.innerHTML = off ? SVG_SND_OFF : SVG_SND_ON;
      if (!off) ctxA();
    }
  }, true);

  /* ====================================================================
     EN LIGNE (un camarade) : chaque coup est envoyé à la base ; l'autre
     téléphone rejoue le même coup, puis prend l'état officiel envoyé.
     ==================================================================== */
  function newState() { return P.ser(P.newGame(Math.floor(Math.random() * 1e9))); }
  function oppName() { return ST.match ? ST.match.oppName : "Classmate"; }

  // on rejoue le coup de l'autre joueur (même animation que l'ordinateur)
  function playRemote(sh) {
    var G = ST.G;
    var fast = !!(ST.remoteAim && Date.now() - ST.remoteAim.t < 3000);   // son bâton est déjà affiché : on joue tout de suite
    if (ST.remoteAim) { ST.aim = ST.remoteAim.a; ST.remoteAim = null; }
    if (sh.hp) P.place(G, sh.hp.x, sh.hp.y);
    G.call = sh.call == null ? null : sh.call;
    var d = sh.a - ST.aim; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    ST.phase = "ai"; ST.power = 0;
    ST.ai = { step: "aim", t: 0, from: ST.aim, to: ST.aim + d, fast: fast, dur: fast ? 0.05 : 0.5 + 0.5 * Math.min(1, Math.abs(d) / Math.PI), sh: { power: sh.p, sx: sh.sx, sy: sh.sy, angle: sh.a } };
    ST.sx = sh.sx; ST.sy = sh.sy; setSpinUi();
    status(oppName() + " is shooting…");
  }

  function sendPlay(body, status) {
    var M = ST.match, sb = window.__sb; if (!M || !sb) return;
    var bad = function () { say("The move could not be sent. Check the connection.", "bad", 3); };
    try {
      var q = sb.rpc("game_play", { p_id: M.id, p_state: body, p_status: status });
      if (q && q.then) q.then(function (r) { if (r && r.error) bad(); }, bad);
    } catch (e) { bad(); }
  }
  // envoi direct sur le canal (le délai de la base n'intervient pas)
  function sendBc(event, payload) { try { var M = ST.match; if (M && M.ch) M.ch.send({ type: "broadcast", event: event, payload: payload }); } catch (e) {} }
  // visée de l'autre : je montre mon bâton pendant que je vise
  function onAim(p) {
    if (!p || ST.mode !== "online" || !ST.playing) return;
    if (!ST.aimSeen) { ST.aimSeen = 1; say("Live: aim received", "ok", 2); }
    if (ST.phase !== "wait") return;
    ST.remoteAim = { a: p.a, p: p.p, sx: p.sx, t: Date.now() };
  }
  // tir de l'autre : je le rejoue tout de suite ; la base confirmera le même numéro de version
  function onShotBc(p) {
    if (!p || ST.mode !== "online" || !ST.playing || !ST.match) return;
    if (ST.phase !== "wait" || humanTurn() || p.v !== ST.v + 1 || !p.sh) return;
    ST.v = p.v; playRemote(p.sh);
  }
  // je tire : l'autre joue le coup tout de suite (état d'avant le tir + le tir)
  function pushShot(G) {
    if (!ST.match || !window.__sb) return;
    ST.v += 1;
    sendBc("shot", { v: ST.v, sh: ST.lastShot });
    sendPlay({ st: { g: P.ser(G), sh: ST.lastShot }, v: ST.v, cols: [0, 1] }, "playing");
  }
  // mon tir est fini : état officiel (done = fin de coup, pas un départ)
  function pushState() {
    if (!ST.match || !window.__sb) return;
    ST.v += 1;
    sendPlay({ st: { g: P.ser(ST.G), sh: null, done: true }, v: ST.v, cols: [0, 1] }, ST.G.over ? "over" : "playing");
  }

  // une nouvelle version de la partie arrive (direct ou par la vérification régulière)
  function onRow(row) {
    if (!ST.playing || ST.mode !== "online" || !ST.match || !row || row.id !== ST.match.id) return;
    var st = row.state || {}, G = ST.G;
    var hasShot = !!(st.st && st.st.sh);
    if (row.status === "over" && !hasShot && !st.done && !G.over) {                       // l'autre joueur a quitté la partie
      G.over = true; G.winner = ST.you; G.last = { reason: oppName() + " left the game" };
      ST.phase = "over"; ST.endT = 0.8; say(oppName() + " left the game", "bad", 4);
      status("You win by forfeit"); updateHud();
      return;
    }
    if (!(st.v && st.v > ST.v && st.st && st.st.g)) return;
    // partie terminée chez moi et l'autre relance (« Rejouer ») : je démarre tout de suite
    if (ST.phase === "over" && !hasShot && !st.done && row.status === "playing") {
      ST.v = st.v; ST.remote = null; ST.pending = null;
      var en = document.getElementById("zgend"); if (en) en.remove();
      ST.G = P.des(st.st.g); syncPrev(); ST.aim = defaultAim(); ST.ai = null;
      ST.tray = []; ST.potAnim = []; ST.parts = []; updateHud(); updateTray(); setPowerUi(0);
      beginTurn(); beginTurnText(true);
      return;
    }
    if (ST.phase !== "wait" && ST.phase !== "aim") { ST.pending = row; return; }
    var consecutive = st.v === ST.v + 1 && hasShot && ST.phase === "wait" && !humanTurn();
    ST.v = st.v;
    if (consecutive) { ST.remote = null; playRemote(st.st.sh); return; }
    ST.remote = null; ST.G = P.des(st.st.g); syncPrev(); ST.aim = defaultAim();
    if (!ST.G.S.potted.length && !ST.G.over) { var en = document.getElementById("zgend"); if (en) en.remove(); ST.tray = []; ST.potAnim = []; ST.parts = []; updateTray(); }
    if (ST.G.over) { ST.phase = "over"; ST.endT = 0.9; updateHud(); return; }
    beginTurn(); beginTurnText(false);
  }

  // on s'abonne aux mises à jour de la partie (direct + vérification toutes les 0,9 s)
  // rejoint le canal de la partie ; si la connexion tombe, on se reconnecte (le même nom pour les deux joueurs)
  function joinChannel(M) {
    var sb = window.__sb;
    try {
      M.ch = sb.channel("pool-" + M.id)
        .on("broadcast", { event: "aim" }, function (m) { try { onAim(m && m.payload); } catch (e) {} })
        .on("broadcast", { event: "shot" }, function (m) { try { onShotBc(m && m.payload); } catch (e) {} })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_matches", filter: "id=eq." + M.id }, function (pl) { try { onRow(pl && pl.new); } catch (e) {} })
        .subscribe(function (st) {
          try { if (ST.match === M) say("Live connection: " + st, st === "SUBSCRIBED" ? "ok" : "bad", 4); } catch (e) {}
          if (st === "SUBSCRIBED") { M.tries = 0; return; }
          if ((st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") && ST.match === M && ST.playing && (M.tries || 0) < 20) {
            M.tries = (M.tries || 0) + 1;
            setTimeout(function () {
              if (ST.match !== M || !ST.playing) return;
              try { if (M.ch) sb.removeChannel(M.ch); } catch (e) {}
              joinChannel(M);
            }, Math.min(8000, 1000 * M.tries));
          }
        });
    } catch (e) { M.ch = null; }
  }
  function subscribe() {
    var M = ST.match, sb = window.__sb;
    joinChannel(M);
    M.poll = setInterval(async function () {
      if (ST.match !== M || !ST.playing) return;
      try { var r = await sb.from("game_matches").select("*").eq("id", M.id).single(); if (r && r.data && ST.match === M) onRow(r.data); } catch (e) {}
    }, 900);
  }

  function openOnline(h, opts) {
    stop();
    var sb = window.__sb;
    if (!sb || !opts || !opts.st || !opts.st.g) { return; }
    ST.lastLocal = ST.mode; ST.mode = "online";
    ST.host = h;
    ST.match = { id: opts.id, oppName: opts.oppName || "Classmate", poll: 0, ch: null };
    ST.you = +opts.you ? 1 : 0;
    ST.names = ST.you === 0 ? ["You", ST.match.oppName] : [ST.match.oppName, "You"];
    ST.G = P.des(opts.st.g); ST.v = +opts.v || 1; ST.remote = null; ST.pending = null; ST.lastShot = null;
    ST.potAnim = []; ST.tray = []; ST.parts = []; ST.evi = 0; ST.msgT = 0; ST.msgText = ""; ST.t = 0; ST.endT = 0; ST.cueFade = 0;
    ST.power = 0; ST.sx = 0; ST.sy = 0; ST.strike = null; ST.ai = null; ST.dragCue = null; ST.aimDrag = null; ST.pwDrag = false; ST.spinDrag = null; ST.k = 0;
    var en = document.getElementById("zgend"); if (en) en.remove();
    buildGame(h);
    newViews(); syncPrev();
    ST.playing = true;
    layout();
    ST.aim = defaultAim();
    updateHud(); updateTray(); setSpinUi(); setPowerUi(0);
    beginTurn(); beginTurnText(ST.G.breakShot);
    if (ST.G.over) { ST.phase = "over"; ST.endT = 0.3; }
    ST.last = 0; ST.raf = requestAnimationFrame(frame);
    if (!ST.ro && window.ResizeObserver) { ST.ro = new ResizeObserver(function () { layout(); }); }
    if (ST.ro) { try { ST.ro.disconnect(); ST.ro.observe(ST.board); } catch (e2) {} }
    bindInputs();
    subscribe();
  }

  // « Rejouer » en ligne : même camarade, partie à zéro, sans nouvelle invitation.
  // La graine dépend de la version : les deux téléphones partent de la même table.
  function restartOnline() {
    var M = ST.match, sb = window.__sb; if (!M || !sb) return;
    var en = document.getElementById("zgend"); if (en) en.remove();
    ST.v += 1;
    ST.G = P.des(P.ser(P.newGame(ST.v * 7919 + 13)));
    ST.remote = null; ST.pending = null; ST.lastShot = null; ST.potAnim = []; ST.tray = []; ST.parts = [];
    ST.evi = 0; ST.power = 0; ST.sx = 0; ST.sy = 0; ST.strike = null; ST.ai = null; ST.dragCue = null; ST.aimDrag = null; ST.pwDrag = false; ST.spinDrag = null;
    newViews(); syncPrev();
    ST.aim = defaultAim(); updateHud(); updateTray(); setSpinUi(); setPowerUi(0);
    beginTurn(); beginTurnText(true);
    var body = { st: { g: P.ser(ST.G), sh: null }, v: ST.v, cols: [0, 1] };
    try { var q = sb.rpc("game_play", { p_id: M.id, p_state: body, p_status: "playing" }); if (q && q.then) q.then(function (r) { if (r && r.error) say("The game could not be restarted. Check the connection.", "bad", 3); }, function () {}); } catch (e) {}
  }

  function stopLoop() { cancelAnimationFrame(ST.raf); ST.raf = 0; }
  function stop() {
    var M = ST.match;
    if (M) {
      if (M.poll) clearInterval(M.poll);
      if (M.ch && window.__sb) { try { window.__sb.removeChannel(M.ch); } catch (e) {} }
      // on quitte une partie en cours : l'autre joueur gagne par forfait
      if (ST.playing && ST.G && !ST.G.over && window.__sb) {
        try { var q = window.__sb.rpc("game_play", { p_id: M.id, p_state: { st: { g: P.ser(ST.G) }, v: ST.v + 1, cols: [0, 1] }, p_status: "over" }); if (q && q.then) q.then(function () {}, function () {}); } catch (e) {}
      }
      ST.match = null;
    }
    if (ST.mode === "online") ST.mode = ST.lastLocal || "ai";
    stopLoop(); unbind(); ST.playing = false; ST.phase = "menu";
    if (ST.ro) { try { ST.ro.disconnect(); } catch (e) {} }
    ST.dragCue = ST.aimDrag = null; ST.pwDrag = false; ST.spinDrag = null;
  }
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('[data-zg="hub"],[data-zg="close"]')) { stop(); var en = document.getElementById("zgend"); if (en && e.target.closest('[data-zg="hub"]')) en.remove(); } }, true);

  /* ---------- les styles ---------- */
  (function () {
    if (document.getElementById("zpcss")) return;
    var s = document.createElement("style"); s.id = "zpcss";
    s.textContent = [
      ".pv-pool{background:#12151c}.pv-pool svg{width:100%;height:100%;display:block}",
      ".zg-hub .zg-card.wide{grid-column:1/-1}.zg-hub .zg-card.wide .pv{height:128px}",
      "#zgame.pool{background:radial-gradient(ellipse at 50% 20%,#15264a,#070b17 78%)}",
      "#zgame.pool.menu{overflow:auto}",
      "#zgame.pool.play{overflow:hidden;display:flex;flex-direction:column;height:100%;box-sizing:border-box}",
      ".zp-menu{padding:6px 16px 28px;display:grid;gap:10px;max-width:520px;margin:0 auto}",
      ".zp-hero{border-radius:20px;overflow:hidden;height:150px;box-shadow:0 14px 30px rgba(0,0,0,.45),0 0 0 2px rgba(255,255,255,.08)}.zp-hero svg{width:100%;height:100%;display:block}",
      ".zp-how{font-size:13px;line-height:1.5;opacity:.8;margin:4px 0 6px}",
      "#zgame.pool.play .zg-head{flex:none;position:relative;padding-bottom:6px}",
      ".zp-hud{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:2px 10px 0}",
      ".zp-pl{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:16px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.08);transition:background .25s,box-shadow .25s,transform .25s;min-width:0}",
      ".zp-pl.on{background:linear-gradient(135deg,rgba(80,170,255,.28),rgba(80,110,255,.16));box-shadow:inset 0 0 0 2px #5cc0ff,0 0 18px rgba(80,170,255,.35)}",
      ".zp-av{flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#fff;background:linear-gradient(160deg,#ff9aa8,#d8467a);box-shadow:0 3px 0 rgba(0,0,0,.35)}",
      ".zp-pl.p1 .zp-av{background:linear-gradient(160deg,#7ad0ff,#3b6fe0)}.zp-av svg{width:22px;height:22px}",
      ".zp-nm{min-width:0;flex:1}.zp-nm b{display:block;font-size:14px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zp-nm small{display:block;font-size:11px;opacity:.7;margin:1px 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".zp-balls{display:flex;gap:2px;flex-wrap:nowrap}",
      ".zp-bi{display:block;box-sizing:border-box;padding:0;margin:0;min-width:0;width:15px;height:15px;flex:none;font-style:normal;border-radius:50%;background-size:cover;background-position:center;transition:opacity .3s,filter .3s,transform .3s}",
      ".zp-bi.blank{background:rgba(255,255,255,.13)}.zp-bi.out{opacity:.22;filter:grayscale(1);transform:scale(.8)}.zp-bi.dim{opacity:.55}.zp-bi.eight{margin-left:3px}",
      ".zp-status{flex:none;text-align:center;font-size:13px;font-weight:600;padding:7px 12px 5px;opacity:.9;min-height:18px}",
      ".zp-stage{flex:1 1 auto;min-height:0;display:flex;gap:6px;padding:0 8px 4px}",
      ".zp-board{flex:1;min-width:0;position:relative;display:flex;align-items:center;justify-content:center}",
      ".zp-cv{display:block;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;border-radius:16px;box-shadow:0 14px 34px rgba(0,0,0,.55)}",
      ".zp-msg{position:absolute;left:50%;top:9%;transform:translate(-50%,-8px);max-width:86%;padding:9px 16px;border-radius:999px;background:rgba(10,14,30,.86);backdrop-filter:blur(4px);font-weight:700;font-size:14px;text-align:center;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;box-shadow:0 6px 18px rgba(0,0,0,.4)}",
      ".zp-msg.show{opacity:1;transform:translate(-50%,0)}.zp-msg.bad{background:rgba(150,28,40,.92)}",
      ".zp-side{flex:none;width:54px;display:flex;flex-direction:column;align-items:center;gap:10px;padding:2px 0}",
      ".zp-spin{flex:none;position:relative;width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#fff,#e6e2d6 60%,#b9b4a4);box-shadow:0 4px 0 rgba(0,0,0,.4),0 0 0 3px rgba(255,255,255,.16);touch-action:none;display:flex;align-items:center;justify-content:center}",
      ".zp-dot{position:absolute;width:13px;height:13px;border-radius:50%;background:#e23a3a;box-shadow:0 0 0 2px #fff,0 2px 4px rgba(0,0,0,.4);left:calc(50% - 6.5px);top:calc(50% - 6.5px);transition:transform .08s}",
      ".zp-pw{flex:1 1 auto;min-height:120px;width:44px;position:relative;touch-action:none;border-radius:22px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}",
      ".zp-track{position:absolute;inset:6px 15px;border-radius:10px;background:rgba(0,0,0,.45);box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}",
      ".zp-fill{position:absolute;left:15px;right:15px;top:6px;height:0;border-radius:10px;background:linear-gradient(#4cf08a,#f6e04a 55%,#ff5238);background-attachment:local;max-height:calc(100% - 12px)}",
      ".zp-knob{position:absolute;left:-3px;right:-3px;top:0;height:38px;border-radius:14px;background:linear-gradient(#ffffff,#cfd6e8);box-shadow:0 4px 0 #6c7690,0 8px 14px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#1a2036;font-weight:800;font-size:13px;will-change:transform}",
      ".zp-pw.hot .zp-knob{background:linear-gradient(#fff2ef,#ffb4a8)}",
      ".zp-tray{flex:none;display:flex;align-items:center;gap:4px;min-height:34px;margin:0 10px 8px;padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.07);overflow:hidden}",
      ".zp-tray span{font-size:12px;opacity:.55}.zp-tray .zp-bi{width:21px;height:21px}.zp-dot{padding:0}",
      ".zp-trophy svg{width:74px;height:74px;display:block;margin:0 auto}"
    ].join("\n");
    document.head.appendChild(s);
  })();

  window.ZPool = {
    open: menu, pic: pic, stop: stop, openOnline: openOnline, newState: newState,
    debug: { st: function () { return ST; }, strike: strike, start: startGame, sim: P }
  };
})();
