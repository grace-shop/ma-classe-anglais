/* =====================================================================
   v5 · Photo editor, before you send a photo.
   In the photo preview: "✏️ Edit" opens the editor.
   - Rogner: crop, free or 1:1, 4:5, 9:16.
   - Texte: your words, with a choice of fonts and colours, moved by a finger.
   - Flou: paint over a place (a face, an address) to blur it.
   - Marqueur: draw with a coloured brush.
   - Stickers: emoji, moved by a finger.
   - Annuler: undo the last change.
   The edited photo replaces the preview. HD keeps the full size.
   Videos are not edited here yet.
   ===================================================================== */
(function () {
  var FONTS = [
    { n: "Normal", f: "system-ui, sans-serif" },
    { n: "Pacifico", f: "'Pacifico', cursive" },
    { n: "Dancing", f: "'Dancing Script', cursive" },
    { n: "Lobster", f: "'Lobster', cursive" },
    { n: "Bangers", f: "'Bangers', cursive" },
    { n: "Playfair", f: "'Playfair Display', serif" },
    { n: "Cinzel", f: "'Cinzel', serif" },
    { n: "Permanent", f: "'Permanent Marker', cursive" }
  ];
  var COLORS = ["#FFFFFF", "#000000", "#EF4444", "#F59E0B", "#22C55E", "#38BDF8", "#A78BFA", "#EC4899"];
  var EMOJI = ["😀", "😍", "🥳", "😂", "👍", "❤️", "⭐", "🔥", "🎉", "📚", "🇹🇬", "✅"];

  var ed = null; // { img, W, H, objs:[], undo:[], tool, color, font, size, crop:{x,y,w,h}, ratio, drag, root, cv, ctx, scale }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // stored stickers (images): loaded once, drawn at their size, keep their ratio
  var SIMG = {};
  function simgLoad(o) {
    var key = o.p;
    if (SIMG[key]) return SIMG[key];
    var rec = { im: null, ok: false };
    SIMG[key] = rec;
    if (typeof srcBlob === "function") {
      srcBlob({ k: "m", id: o.p, t: o.mt }).then(function (b) {
        var im = new Image();
        im.onload = function () { rec.im = im; rec.ok = true; try { if (ed && ed.ctx) redraw(); } catch (x) {} };
        im.src = URL.createObjectURL(b);
      }).catch(function () {});
    }
    return rec;
  }
  function simgPaint(ctx, o) {
    var rec = simgLoad(o);
    if (!rec.ok) return;
    var w = o.size, h = o.size * rec.im.naturalHeight / rec.im.naturalWidth;
    ctx.drawImage(rec.im, o.x - w / 2, o.y - h / 2, w, h);
  }

  function snap() { ed.undo.push(clone(ed.objs)); if (ed.undo.length > 40) ed.undo.shift(); }

  // ---- drawing (in image coordinates) ----
  function paint(ctx, withCrop) {
    var W = ed.W, H = ed.H;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(ed.img, 0, 0, W, H);
    // blur strokes: the blurred picture, shown only where painted
    var blurs = ed.objs.filter(function (o) { return o.t === "blur"; });
    if (blurs.length) {
      var mask = document.createElement("canvas");
      mask.width = W; mask.height = H;
      var mc = mask.getContext("2d");
      blurs.forEach(function (o) { strokePath(mc, o, "#fff"); });
      var bl = document.createElement("canvas");
      bl.width = W; bl.height = H;
      var bc = bl.getContext("2d");
      bc.filter = "blur(" + Math.max(10, Math.round(W / 60)) + "px)";
      bc.drawImage(ed.img, 0, 0, W, H);
      bc.filter = "none";
      bc.globalCompositeOperation = "destination-in";
      bc.drawImage(mask, 0, 0);
      ctx.drawImage(bl, 0, 0);
    }
    ed.objs.forEach(function (o) {
      if (o.t === "stroke") strokePath(ctx, o, o.color);
      else if (o.t === "text") {
        ctx.font = "700 " + o.size + "px " + FONTS[o.font].f;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = Math.max(2, o.size / 9);
        ctx.strokeStyle = "rgba(0,0,0,.55)";
        ctx.strokeText(o.text, o.x, o.y);
        ctx.fillStyle = o.color;
        ctx.fillText(o.text, o.x, o.y);
      } else if (o.t === "simg") {
        simgPaint(ctx, o);
      } else if (o.t === "sticker") {
        ctx.font = o.size + "px serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(o.e, o.x, o.y);
      }
    });
    if (withCrop && ed.crop) {
      var c = ed.crop;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, W / 400);
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      var hl = Math.max(28, W / 14);
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(5, W / 120);
      ctx.beginPath();
      ctx.moveTo(c.x + c.w / 2 - hl / 2, c.y); ctx.lineTo(c.x + c.w / 2 + hl / 2, c.y);
      ctx.moveTo(c.x + c.w / 2 - hl / 2, c.y + c.h); ctx.lineTo(c.x + c.w / 2 + hl / 2, c.y + c.h);
      ctx.moveTo(c.x, c.y + c.h / 2 - hl / 2); ctx.lineTo(c.x, c.y + c.h / 2 + hl / 2);
      ctx.moveTo(c.x + c.w, c.y + c.h / 2 - hl / 2); ctx.lineTo(c.x + c.w, c.y + c.h / 2 + hl / 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function strokePath(ctx, o, color) {
    if (!o.pts || !o.pts.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = o.w;
    ctx.beginPath();
    ctx.moveTo(o.pts[0][0], o.pts[0][1]);
    for (var i = 1; i < o.pts.length; i++) ctx.lineTo(o.pts[i][0], o.pts[i][1]);
    if (o.pts.length === 1) ctx.lineTo(o.pts[0][0] + 0.01, o.pts[0][1]);
    ctx.stroke();
    ctx.restore();
  }

  function redraw() { paint(ed.ctx, true); }

  // ---- coordinates ----
  function toImg(e) {
    var r = ed.cv.getBoundingClientRect();
    return [(e.clientX - r.left) * ed.W / r.width, (e.clientY - r.top) * ed.H / r.height];
  }

  // a corner of the photo where a dragged text or sticker is thrown away
  function binCorner(o) {
    var zx = ed.W * 0.22, zy = ed.H * 0.16;
    var l = o.x < zx, r = o.x > ed.W - zx, t = o.y < zy, b = o.y > ed.H - zy;
    if (!(l || r) || !(t || b)) return "";
    return (t ? "t" : "b") + (l ? "l" : "r");
  }

  // show the red bin in that corner (or hide it when "")
  function setBin(c) {
    ed.binCorner = c;
    var el = ed.root && ed.root.querySelector(".zz-pebin");
    if (!el) return;
    el.hidden = !c;
    if (c) el.dataset.c = c; else delete el.dataset.c;
  }

  // the width of a text as it is drawn (for a finger to grab the whole text)
  function textWidth(o) {
    ed.ctx.font = "700 " + o.size + "px " + FONTS[o.font].f;
    return ed.ctx.measureText(o.text).width;
  }

  function hit(p) {
    var pad = 30;
    for (var i = ed.objs.length - 1; i >= 0; i--) {
      var o = ed.objs[i];
      if (o.t === "text") {
        var half = textWidth(o) / 2;
        if (Math.abs(p[0] - o.x) <= half + pad && Math.abs(p[1] - o.y) <= o.size * 0.7 + pad) return i;
      } else if (o.t === "simg") {
        if (Math.abs(p[0] - o.x) <= o.size / 2 + pad && Math.abs(p[1] - o.y) <= o.size / 2 + pad) return i;
      } else if (o.t === "sticker") {
        var d = Math.hypot(p[0] - o.x, p[1] - o.y);
        if (d < Math.max(40, o.size * 0.8)) return i;
      }
    }
    return -1;
  }

  // what a finger on the crop frame grabs: a corner (tl, tr, bl, br), an edge
  // (t, b, l, r), the inside (in: moves the frame), or nothing ("")
  function cornerHit(p) {
    var c = ed.crop, r = Math.max(44, ed.W / 10);
    var pts = [[c.x, c.y, "tl"], [c.x + c.w, c.y, "tr"], [c.x, c.y + c.h, "bl"], [c.x + c.w, c.y + c.h, "br"]];
    for (var i = 0; i < pts.length; i++) if (Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) < r) return pts[i][2];
    var inX = p[0] >= c.x - r && p[0] <= c.x + c.w + r, inY = p[1] >= c.y - r && p[1] <= c.y + c.h + r;
    if (inY && Math.abs(p[0] - c.x) < r) return "l";
    if (inY && Math.abs(p[0] - (c.x + c.w)) < r) return "r";
    if (inX && Math.abs(p[1] - c.y) < r) return "t";
    if (inX && Math.abs(p[1] - (c.y + c.h)) < r) return "b";
    if (p[0] > c.x && p[0] < c.x + c.w && p[1] > c.y && p[1] < c.y + c.h) return "in";
    return "";
  }

  function applyRatio() {
    var c = ed.crop, W = ed.W, H = ed.H;
    if (!ed.ratio) { ed.crop = { x: 0, y: 0, w: W, h: H }; return; }
    var rw = ed.ratio[0], rh = ed.ratio[1];
    var w = W, h = w * rh / rw;
    if (h > H) { h = H; w = h * rw / rh; }
    ed.crop = { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
  }

  // ---- pointer ----
  function down(e) {
    e.preventDefault();
    var p = toImg(e);
    ed.cv.setPointerCapture && ed.cv.setPointerCapture(e.pointerId);
    if (ed.tool === "crop") {
      var k = cornerHit(p);
      if (k === "in") ed.drag = { kind: "shift", sx: p[0], sy: p[1], c0: { x: ed.crop.x, y: ed.crop.y, w: ed.crop.w, h: ed.crop.h } };
      else ed.drag = k ? { kind: "corner", k: k } : null;
      return;
    }
    if (ed.tool === "stroke" || ed.tool === "blur") {
      snap();
      ed.drag = { kind: "paint", o: { t: ed.tool === "blur" ? "blur" : "stroke", color: ed.color, w: Math.max(6, ed.W / 60) * ed.size, pts: [p] } };
      ed.objs.push(ed.drag.o);
      redraw();
      return;
    }
    var i = hit(p);
    if (i >= 0) { snap(); ed.drag = { kind: "move", i: i, dx: p[0] - ed.objs[i].x, dy: p[1] - ed.objs[i].y, started: false }; }
    else ed.drag = null;
  }

  function move(e) {
    if (!ed.drag) return;
    e.preventDefault();
    var p = toImg(e), d = ed.drag;
    if (d.kind === "paint") { d.o.pts.push(p); redraw(); return; }
    if (d.kind === "move") {
      if (!d.started) { d.started = true; }
      var o = ed.objs[d.i];
      o.x = p[0] - d.dx; o.y = p[1] - d.dy;
      setBin(binCorner(o));
      redraw();
      return;
    }
    if (d.kind === "shift") {
      var nx = d.c0.x + (p[0] - d.sx), ny = d.c0.y + (p[1] - d.sy);
      nx = Math.max(0, Math.min(nx, ed.W - d.c0.w));
      ny = Math.max(0, Math.min(ny, ed.H - d.c0.h));
      ed.crop = { x: nx, y: ny, w: d.c0.w, h: d.c0.h };
      redraw();
      return;
    }
    if (d.kind === "corner") {
      var c = ed.crop, x2 = c.x + c.w, y2 = c.y + c.h;
      var nx = Math.max(0, Math.min(p[0], ed.W)), ny = Math.max(0, Math.min(p[1], ed.H));
      var left = c.x, top = c.y, right = x2, bottom = y2;
      if (d.k.indexOf("l") >= 0) left = Math.min(nx, right - 40);
      if (d.k.indexOf("r") >= 0) right = Math.max(nx, left + 40);
      if (d.k.indexOf("t") >= 0) top = Math.min(ny, bottom - 40);
      if (d.k.indexOf("b") >= 0) bottom = Math.max(ny, top + 40);
      if (ed.ratio) {
        var w = right - left, h = w * ed.ratio[1] / ed.ratio[0];
        bottom = top + h;
        if (bottom > ed.H) { bottom = ed.H; top = bottom - h; }
        right = left + w;
      }
      ed.crop = { x: left, y: top, w: right - left, h: bottom - top };
      redraw();
    }
  }

  function up() {
    if (!ed.drag) return;
    var d = ed.drag;
    ed.drag = null;
    if (d.kind === "paint") redraw();
    if (d.kind === "move") {
      // released over the red bin: the text or sticker is removed
      if (ed.binCorner && ed.objs[d.i]) { ed.objs.splice(d.i, 1); redraw(); }
      setBin("");
    }
    // crop changes are not undone: they are a frame, not a mark
  }

  // ---- the editor screen ----
  function open(url, done, tool) {
    close();
    var img = new Image();
    img.onload = function () {
      // work at most 2048 px wide: keeps every move smooth on a phone
      var sc = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
      var base = document.createElement("canvas");
      base.width = Math.max(1, Math.round(img.naturalWidth * sc));
      base.height = Math.max(1, Math.round(img.naturalHeight * sc));
      base.getContext("2d").drawImage(img, 0, 0, base.width, base.height);
      ed = { img: base, W: base.width, H: base.height, objs: [], undo: [], tool: "text", initTool: tool || "text", color: "#FFFFFF", font: 1, size: 1, crop: null, ratio: null, drag: null, done: done };
      ed.crop = { x: 0, y: 0, w: ed.W, h: ed.H };
      build();
      redraw();
    };
    img.onerror = function () { toast("Cette photo ne peut pas être modifiée.", "x"); };
    img.src = url;
  }

  function close() {
    if (ed && ed.root) ed.root.remove();
    ed = null;
  }

  function build() {
    var root = document.createElement("div");
    root.id = "zzPe";
    root.innerHTML =
      '<div class="zz-pebar"><button type="button" data-a="cancel">Annuler</button><b>Modifier la photo</b><button type="button" data-a="undo" aria-label="Annuler la dernière modification">↶</button><button type="button" class="ok" data-a="ok">Valider</button></div>' +
      '<div class="zz-pestage"><canvas></canvas><div class="zz-pebin" hidden aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></div></div>' +
      '<div class="zz-petools">' +
        '<button type="button" data-rot="-1" aria-label="Tourner à gauche">Tourner ↺</button>' +
        '<button type="button" data-rot="1" aria-label="Tourner à droite">Tourner ↻</button>' +
        '<button type="button" data-t="crop">Rogner</button>' +
        '<button type="button" data-t="text">Texte</button>' +
        '<button type="button" data-t="blur">Flou</button>' +
        '<button type="button" data-t="stroke">Marqueur</button>' +
        '<button type="button" data-t="sticker">Stickers</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="crop" hidden>' +
        '<button type="button" data-r="free">Libre</button><button type="button" data-r="1:1">1:1</button><button type="button" data-r="4:5">4:5</button><button type="button" data-r="9:16">9:16</button>' +
        '<button type="button" class="ok" data-a="cropok">Cadrage fait</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="text" hidden>' +
        '<input id="zzPeT" maxlength="60" placeholder="Écris ton texte" autocomplete="off">' +
        '<div class="zz-pesw">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="background:' + c + '" aria-label="Couleur"></button>'; }).join("") + '</div>' +
        '<div class="zz-pefonts">' + FONTS.map(function (f, i) { return '<button type="button" data-f="' + i + '" style="font-family:' + f.f + '">' + f.n + '</button>'; }).join("") + '</div>' +
        '<button type="button" class="ok" data-a="addtext">Ajouter le texte</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="stroke" hidden>' +
        '<div class="zz-pesw">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="background:' + c + '" aria-label="Couleur"></button>'; }).join("") + '</div>' +
        '<div class="zz-pesz"><button type="button" data-s="1">Fin</button><button type="button" data-s="2">Épais</button></div>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="blur" hidden><p>Passe le doigt sur ce qu\'il faut cacher : il devient flou.</p><div class="zz-pesz"><button type="button" data-s="1">Petit</button><button type="button" data-s="2">Grand</button></div></div>' +
      '<div class="zz-peopt" data-opt="sticker" hidden><div class="zz-pestab"><button type="button" data-tab="emo" aria-pressed="true">Emojis</button><button type="button" data-tab="mine" aria-pressed="false">Mes stickers</button></div>' +
        '<div class="zz-peemo" data-pane="emo">' + EMOJI.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join("") + '</div>' +
        '<div class="zz-peemo" data-pane="mine" hidden></div></div>';
    document.body.appendChild(root);
    ed.root = root;
    ed.cv = root.querySelector("canvas");
    ed.cv.width = ed.W; ed.cv.height = ed.H;
    ed.ctx = ed.cv.getContext("2d");
    ed.cv.addEventListener("pointerdown", down);
    ed.cv.addEventListener("pointermove", move);
    ed.cv.addEventListener("pointerup", up);
    ed.cv.addEventListener("pointercancel", up);
    root.addEventListener("click", function (e) { e.stopPropagation(); onClick(e); });
    markColor();
    root.querySelector('#zzPeT').addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addText(); } });
    showTool(ed.initTool || "text");
  }

  function markColor() {
    ed.root.querySelectorAll("[data-c]").forEach(function (x) { x.classList.toggle("on", x.dataset.c === ed.color); });
  }

  function showTool(t) {
    ed.tool = t;
    ed.root.querySelectorAll(".zz-petools button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
    ed.root.querySelectorAll(".zz-peopt").forEach(function (p) { p.hidden = p.dataset.opt !== t; });
    if (t === "crop") { applyRatio(); redraw(); }
    if (t === "text") setTimeout(function () { var i = ed.root.querySelector("#zzPeT"); if (i) i.focus(); }, 50);
  }

  function addText() {
    var txt = (ed.root.querySelector("#zzPeT").value || "").trim();
    if (!txt) { toast("Écris d'abord ton texte.", "x"); return; }
    snap();
    ed.objs.push({ t: "text", text: txt, x: ed.W / 2, y: ed.H / 2, color: ed.color, font: ed.font, size: Math.round(ed.W / 14) * (ed.size === 2 ? 1.5 : 1) });
    ed.root.querySelector("#zzPeT").value = "";
    redraw();
  }

  function onClick(e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b || !ed) return;
    if (b.dataset.a === "cancel") return close();
    if (b.dataset.a === "undo") { if (ed.undo.length) { ed.objs = ed.undo.pop(); redraw(); } return; }
    if (b.dataset.a === "ok") return finish();
    if (b.dataset.a === "addtext") return addText();
    if (b.dataset.a === "cropok") { showTool("text"); return; }
    if (b.dataset.rot) return turn(+b.dataset.rot);
    if (b.dataset.t) return showTool(b.dataset.t);
    if (b.dataset.r) {
      ed.ratio = b.dataset.r === "free" ? null : b.dataset.r.split(":").map(Number);
      applyRatio(); redraw(); return;
    }
    if (b.dataset.f !== undefined) { ed.font = +b.dataset.f; return; }
    if (b.dataset.c) { ed.color = b.dataset.c; markColor(); return; }
    if (b.dataset.s) { ed.size = +b.dataset.s; return; }
    if (b.dataset.tab) {
      var rt = b.closest(".zz-peopt");
      rt.querySelectorAll("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== b.dataset.tab; });
      rt.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      if (b.dataset.tab === "mine") fillMine(rt);
      return;
    }
    if (b.dataset.simg !== undefined) {
      var st = simgList()[+b.dataset.simg];
      if (st) {
        snap();
        ed.objs.push({ t: "simg", p: st.p, mt: st.t, x: ed.W / 2, y: ed.H / 2, size: Math.round(ed.W / 4) });
        redraw();
      }
      return;
    }
    if (b.dataset.e) {
      snap();
      ed.objs.push({ t: "sticker", e: b.dataset.e, x: ed.W / 2, y: ed.H / 2, size: Math.round(ed.W / 9) });
      redraw();
      return;
    }
  }

  // ---- turn the photo by a quarter turn (dir 1 = clockwise, -1 = counter-clockwise) ----
  function turnOnce() {
    var oldW = ed.W, oldH = ed.H;
    var rc = document.createElement("canvas");
    rc.width = oldH; rc.height = oldW;
    var g = rc.getContext("2d");
    g.translate(oldH, 0); g.rotate(Math.PI / 2); g.drawImage(ed.img, 0, 0);
    // a point (x, y) of the old photo is (oldH - y, x) after a clockwise turn
    function mp(p) { return [oldH - p[1], p[0]]; }
    function fix(list) {
      list.forEach(function (o) {
        if (o.pts) o.pts = o.pts.map(mp);
        else if (typeof o.x === "number") { var q = mp([o.x, o.y]); o.x = q[0]; o.y = q[1]; }
      });
    }
    fix(ed.objs);
    ed.undo.forEach(fix);
    ed.img = rc; ed.W = oldH; ed.H = oldW;
    ed.cv.width = ed.W; ed.cv.height = ed.H;
    ed.crop = { x: 0, y: 0, w: ed.W, h: ed.H };
    if (ed.ratio) applyRatio();
  }

  function turn(dir) {
    var n = dir < 0 ? 3 : 1;   // counter-clockwise = three clockwise turns
    for (var i = 0; i < n; i++) turnOnce();
    redraw();
  }

  // ---- finish: the new photo replaces the preview ----
  function finish() {
    var c = ed.crop || { x: 0, y: 0, w: ed.W, h: ed.H };
    var out = document.createElement("canvas");
    out.width = Math.round(c.w); out.height = Math.round(c.h);
    var octx = out.getContext("2d");
    var full = document.createElement("canvas");
    full.width = ed.W; full.height = ed.H;
    paint(full.getContext("2d"), false);
    octx.drawImage(full, -c.x, -c.y);
    window.__zzLastEdit = { W: ed.W, H: ed.H, crop: { x: c.x, y: c.y, w: c.w, h: c.h }, objs: clone(ed.objs) };
    out.toBlob(function (blob) {
      if (!blob) { toast("Photo non enregistrée.", "x"); return; }
      var file = new File([blob], "photo-modifiee.jpg", { type: "image/jpeg" });
      var done = ed.done;
      close();
      done && done(file);
    }, "image/jpeg", 0.92);
  }

  // open the editor on the photo of the preview sheet, with one tool ready
  function editPre(tool) {
    var P = (typeof V4 !== "undefined") && V4.pre;
    if (!P) return;
    if (P.video && typeof zzVidEdit === "function") { zzVidEdit(tool); return; }
    open(P.url, function (file) {
      var cur = (typeof V4 !== "undefined") && V4.pre;
      if (!cur) return;
      try { URL.revokeObjectURL(cur.url); } catch (x) {}
      cur.file = file;
      cur.url = URL.createObjectURL(file);
      cur.edited = true;
      if (typeof render === "function") render();
    }, tool);
  }

  // open the editor from the preview sheet
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('[data-v4="preEdit"]');
    if (b) {
      e.preventDefault(); e.stopImmediatePropagation();
      var P = (typeof V4 !== "undefined") && V4.pre;
      if (!P) return;
      open(P.url, function (file) {
        var cur = (typeof V4 !== "undefined") && V4.pre;
        if (!cur) return;
        try { URL.revokeObjectURL(cur.url); } catch (x) {}
        cur.file = file;
        cur.url = URL.createObjectURL(file);
        cur.edited = true;
        if (typeof render === "function") render();
      });
      return;
    }
    var pt = t.closest('[data-v4="preTool"]');
    if (pt) { e.preventDefault(); e.stopImmediatePropagation(); editPre(pt.dataset.tool); return; }
    var h = t.closest('[data-v4="preHd"]');
    if (h) {
      e.preventDefault(); e.stopImmediatePropagation();
      var Q = (typeof V4 !== "undefined") && V4.pre;
      if (Q) { Q.hd = !Q.hd; if (typeof render === "function") render(); }
    }
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzzuPhotoEdit";
  st.textContent = `
#zzPe{position:fixed;inset:0;z-index:10010;background:#07080F;color:#EDEEF3;display:flex;flex-direction:column;font:600 .85rem system-ui,sans-serif}
#zzPe .zz-pebar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px));background:#11131F}
#zzPe .zz-pebar b{font-size:.95rem}
#zzPe .zz-pebar button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:8px 14px;font:700 .85rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-pebar .ok{background:#A78BFA;color:#0B0D18}
#zzPe .zz-pestage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden}
#zzPe canvas{max-width:100%;max-height:100%;width:auto;height:auto;touch-action:none;border-radius:8px}
#zzPe .zz-pestage{position:relative}
#zzPe .zz-pebin{position:absolute;width:58px;height:58px;border-radius:50%;background:#E5484D;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(229,72,77,.45);pointer-events:none;z-index:2}
#zzPe .zz-pebin[hidden]{display:none}
#zzPe .zz-pebin[data-c="tl"]{top:12px;left:12px}
#zzPe .zz-pebin[data-c="tr"]{top:12px;right:12px}
#zzPe .zz-pebin[data-c="bl"]{bottom:12px;left:12px}
#zzPe .zz-pebin[data-c="br"]{bottom:12px;right:12px}
#zzPe .zz-petools{display:flex;gap:6px;justify-content:center;padding:8px;background:#11131F;flex-wrap:wrap}
#zzPe .zz-petools button{border:1px solid rgba(255,255,255,.2);background:transparent;color:#EDEEF3;border-radius:999px;padding:8px 12px;font:700 .8rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-petools button.on{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
#zzPe .zz-peopt{background:#11131F;padding:10px 12px;display:flex;flex-direction:column;gap:8px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))}
#zzPe .zz-peopt[hidden]{display:none}
#zzPe .zz-peopt p{margin:0;opacity:.8;font-weight:500}
#zzPe .zz-peopt button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#EDEEF3;border-radius:12px;padding:9px 12px;font:700 .85rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-peopt button.ok{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
#zzPe .zz-peopt input{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:12px;color:#fff;padding:10px 12px;font:600 1rem system-ui,sans-serif;outline:none}
#zzPe .zz-pesw,#zzPe .zz-pefonts,#zzPe .zz-pesz,#zzPe .zz-peemo{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#zzPe .zz-pesw button{width:30px;height:30px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.4)}
#zzPe .zz-pesw button.on{border-color:#fff;box-shadow:0 0 0 2px #A78BFA}
#zzPe .zz-peemo button{font-size:1.6rem;padding:4px 8px;border:0;background:transparent}
#zzPe .zz-pefonts button{font-size:1rem}
`;
  document.head.appendChild(st);

  // other files (the stickers) can open the editor too
  // the stored image stickers (videos are not used as stickers in the editor)
  function simgList() {
    return (window.zzMyStickers ? window.zzMyStickers() : []).filter(function (x) { return !/^video\//.test(x.t || ""); });
  }
  function fillMine(rt) {
    var pane = rt.querySelector('[data-pane="mine"]');
    if (!pane) return;
    var list = simgList();
    if (!list.length) { pane.innerHTML = '<p class="zz-pemp">Aucun sticker enregistré. Crée-en un depuis les stickers du chat.</p>'; return; }
    pane.innerHTML = list.map(function (x, i) {
      return '<button type="button" data-simg="' + i + '" aria-label="Sticker"><img data-zzsp="' + x.p + '" data-zzst="' + x.t + '" alt=""></button>';
    }).join("");
    pane.querySelectorAll("img[data-zzsp]").forEach(function (im) {
      if (typeof srcBlob !== "function") return;
      srcBlob({ k: "m", id: im.dataset.zzsp, t: im.dataset.zzst }).then(function (b) { im.src = URL.createObjectURL(b); }).catch(function () {});
    });
  }
  var zzPeSt = document.createElement("style");
  zzPeSt.id = "zzPeStickers";
  zzPeSt.textContent = ".zz-pestab{display:flex;gap:8px;margin-bottom:8px}.zz-pestab button{flex:1;padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font:700 .9rem system-ui,sans-serif;cursor:pointer}.zz-pestab button[aria-pressed=true]{background:#A78BFA;color:#0B0D18;border-color:transparent}.zz-peemo[data-pane=mine] button{padding:4px;aspect-ratio:auto}.zz-peemo[data-pane=mine] img{width:100%;height:auto;display:block;object-fit:contain}.zz-pemp{grid-column:1/-1;opacity:.7;text-align:center;margin:8px 0}";
  document.head.appendChild(zzPeSt);
  window.__zzPhotoEdit = { open: open };
  // draws src (a frame, at W x H) with the objects, onto canvas; nothing of the open editor changes
  window.__zzPaintTo = function (canvas, src, W, H, objs) {
    var keep = ed;
    ed = { img: src, W: W, H: H, objs: objs };
    try { paint(canvas.getContext("2d"), false); } finally { ed = keep; }
  };

  // drag: the canvas gets the pointer events above
  window.addEventListener("resize", function () { if (ed) redraw(); });
})();
