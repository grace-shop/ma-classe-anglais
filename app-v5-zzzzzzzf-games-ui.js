/* =====================================================================
   v5 · Jeux : pages plein écran (portrait) pour les jeux.
   Hub (4 jeux) -> réglages (IA / deux joueurs / à distance) -> partie.
   Échecs et moulin : plateau en bois, pièces 3D. Ludo : plateau classique
   bleu. Morpion : tableau noir à la craie. Les règles et l'IA sont dans
   app-v5-zzzzzzze-game-engines.js ; le jeu à distance dans
   app-v5-zzzzzzzg-games-online.js.
   ===================================================================== */
(function () {
  var ZG = window.ZG;
  var G = null;               // partie en cours
  var PLACE = null;           // "arena" | "battle" : d'où vient le joueur
  var SEL = { game: "chess", diff: "medium", players: 2 };
  var TIMER = 0;

  var STYLE = `
#zgame{position:fixed;inset:0;z-index:10075;overflow:auto;-webkit-overflow-scrolling:touch;color:#fff;background:#0a0c18;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:env(safe-area-inset-bottom,0px)}
#zgame.hub{background:linear-gradient(170deg,#141a33,#0a0c18 70%)}
#zgame.game.chess,#zgame.game.morris{background:radial-gradient(ellipse at 50% 15%,#8a4a22,#4a220e 60%,#24110a)}
#zgame.game.ludo{background:repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 14px,transparent 14px 28px),linear-gradient(170deg,#1f63d6,#0c3c97 55%,#072863)}
#zgame.game.ttt{background:radial-gradient(ellipse at 50% 25%,#4a2a16,#1c0e07 75%)}
.zg-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 10px;background:linear-gradient(#0a0c18f2,#0a0c18d9);backdrop-filter:blur(6px)}
.zg-head b{display:block;font-size:20px;letter-spacing:.2px}
.zg-head small{opacity:.7;font-size:12px}
.zg-x{height:40px;min-width:70px;padding:0 14px;border-radius:14px;border:0;background:#2b3046;color:#fff;font-size:20px;font-weight:700;box-shadow:0 4px 0 #14172a;cursor:pointer}
.zg-x:active{transform:translateY(3px);box-shadow:0 1px 0 #14172a}
.zg-hub{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px 16px 24px}
.zg-card{border:0;border-radius:22px;padding:12px 12px 14px;background:linear-gradient(160deg,#252b48,#131629);color:#fff;text-align:left;box-shadow:0 8px 0 #06070e,0 16px 28px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);cursor:pointer;transition:transform .12s,box-shadow .12s}
.zg-card:active{transform:translateY(5px);box-shadow:0 3px 0 #06070e,0 6px 12px rgba(0,0,0,.4)}
.zg-card b{display:block;margin-top:10px;font-size:15px}
.zg-card small{display:block;opacity:.7;font-size:12px;margin-top:2px}
.pv{height:104px;border-radius:14px;display:grid;place-items:center;overflow:hidden;box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -4px 0 rgba(0,0,0,.25)}
.pv-chess{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;background:#5a2a10;padding:0}
.pv-chess i{display:block;width:100%;height:100%}
.pv-chess i.w{background:linear-gradient(135deg,#f5e1bf,#e4c293)}
.pv-chess i.b{background:linear-gradient(135deg,#b97443,#8a4c22)}
.pv-ludo{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;padding:6px;background:#0c3c97}
.pv-ludo i{border-radius:8px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}
.pv-ludo .red{background:#E5303A}.pv-ludo .green{background:#1FB35B}.pv-ludo .yellow{background:#F5C518}.pv-ludo .blue{background:#1E88E5}
.pv-morris{background:radial-gradient(circle at 40% 30%,#d9a86a,#b47b3f 70%);gap:10px;grid-template-columns:repeat(3,auto)}
.pv-morris b{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff,#c9c9c9);box-shadow:0 4px 0 rgba(0,0,0,.35)}
.pv-morris b.bk{background:radial-gradient(circle at 34% 28%,#8a8a8a,#0e0e0e 75%)}
.pv-ttt{background:radial-gradient(ellipse at 40% 35%,#2f5a4c,#1b3b33 70%);display:flex;gap:10px;align-items:center;justify-content:center;font-size:28px;font-weight:800}
.pv-ttt span:nth-child(1){color:#f5e27a}.pv-ttt span:nth-child(2){color:#a9a6ef}.pv-ttt span:nth-child(3){color:#f5e27a}
.zg-setup{padding:12px 16px 30px;display:grid;gap:12px}
.zg-label{font-size:13px;opacity:.7;margin-top:6px}
.seg{display:flex;gap:8px}
.seg button{flex:1;padding:12px 8px;border-radius:14px;border:0;background:rgba(255,255,255,.08);color:#fff;font-weight:700;box-shadow:0 4px 0 #07080f;cursor:pointer}
.seg button.on{background:linear-gradient(#a78bfa,#7c5cf0);box-shadow:0 4px 0 #4b35a3}
.zg-big{display:block;width:100%;border:0;border-radius:18px;padding:16px;font-size:17px;font-weight:800;color:#fff;background:linear-gradient(#9a7bff,#6a4bf0);box-shadow:0 7px 0 #4b35a3,0 14px 24px rgba(0,0,0,.4);cursor:pointer;text-align:center;transition:transform .1s,box-shadow .1s}
.zg-big:active{transform:translateY(5px);box-shadow:0 2px 0 #4b35a3,0 6px 10px rgba(0,0,0,.4)}
.zg-big small{display:block;font-weight:500;font-size:12px;opacity:.85;margin-top:3px}
.zg-big.alt{background:linear-gradient(#3e4462,#262a40);box-shadow:0 7px 0 #14172a,0 14px 24px rgba(0,0,0,.4)}
.zg-big.alt:active{box-shadow:0 2px 0 #14172a,0 6px 10px rgba(0,0,0,.4)}
.zg-big.alt2{background:linear-gradient(#22c262,#0f8a40);box-shadow:0 7px 0 #0a5a2a,0 14px 24px rgba(0,0,0,.4)}
.zg-big.ludo-roll{background:linear-gradient(#ffd23f,#f0a500);box-shadow:0 7px 0 #a86f00,0 14px 24px rgba(0,0,0,.4);color:#2a1800}
.zg-status{margin:10px 16px 0;padding:13px 16px;border-radius:16px;background:rgba(8,12,26,.6);text-align:center;font-weight:800;font-size:17px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 4px 0 rgba(0,0,0,.3)}
.zg-body{padding:12px 14px 30px;display:grid;gap:12px;justify-items:center}
.zg-info{font-size:13px;opacity:.85;text-align:center;max-width:360px;line-height:1.4}
.zg-hand{display:flex;gap:18px;font-weight:700;font-size:14px}
.zg-players{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.zg-pl{padding:8px 12px;border-radius:999px;background:rgba(0,0,0,.35);font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px}
.zg-pl i{width:12px;height:12px;border-radius:50%;display:inline-block}
.zg-pl.on{outline:2px solid #facc15}
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
.zgm-disc{position:absolute;width:15%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:1;box-shadow:0 6px 0 rgba(0,0,0,.35),0 12px 14px rgba(0,0,0,.45)}
.zgm-disc.w{background:radial-gradient(circle at 34% 28%,#ffffff 0,#f4f4f4 35%,#c9c9c9 75%,#9d9d9d)}
.zgm-disc.b{background:radial-gradient(circle at 34% 28%,#8a8a8a 0,#2a2a2a 30%,#0e0e0e 75%,#000)}
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
.zgl-frame{width:min(96vw,440px);padding:10px;box-sizing:border-box;border-radius:16px;background:#0a1e4f;box-shadow:0 18px 36px rgba(0,0,0,.55),0 6px 0 #061333,inset 0 0 0 2px rgba(255,255,255,.2)}
.zgl-board{position:relative;width:100%;aspect-ratio:1;background:#fff;border-radius:8px;overflow:hidden;box-shadow:inset 0 0 0 3px #0b1640}
.zgl-quad{position:absolute;width:40%;height:40%}
.zgl-in{position:absolute;left:16.67%;top:16.67%;width:66.67%;height:66.67%;background:#fff;border-radius:14px;box-shadow:inset 0 3px 0 rgba(0,0,0,.08)}
.zgl-cell{position:absolute;box-sizing:border-box;border:1px solid #b9c3d6;background:#fff}
.zgl-cell.home{border-color:rgba(0,0,0,.12)}
.zgl-cell.safe::after{content:"★";position:absolute;inset:0;display:grid;place-items:center;color:#7d8aa3;font-size:70%}
.zgl-center{position:absolute;left:40%;top:40%;width:20%;height:20%;background:conic-gradient(from -45deg,#1FB35B 0 90deg,#F5C518 90deg 180deg,#1E88E5 180deg 270deg,#E5303A 270deg 360deg);box-shadow:inset 0 0 0 1px #fff}
.zgl-tok{position:absolute;width:5.6%;height:5.6%;pointer-events:none;z-index:3;border-radius:50% 50% 46% 46%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff 0 6%,var(--tc) 22%,var(--tc) 55%,var(--td) 100%);box-shadow:0 2px 0 var(--td),0 5px 5px rgba(0,0,0,.5)}
.zgl-tok.go{pointer-events:auto;cursor:pointer;animation:zgpulse 1s infinite}
@keyframes zgpulse{0%,100%{box-shadow:0 2px 0 var(--td),0 0 0 0 rgba(255,255,255,.9)}50%{box-shadow:0 2px 0 var(--td),0 0 0 5px rgba(255,255,255,.25)}}
.zgl-turn{position:absolute;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:14px solid #facc15;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4));animation:zgbob .9s infinite;z-index:4}
@keyframes zgbob{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
.zgl-row{display:flex;gap:14px;align-items:center;justify-content:center;width:100%;max-width:440px;box-sizing:border-box}
.zgl-act{flex:1;display:grid;gap:8px;min-width:0}
.zgd{width:72px;height:72px;flex:0 0 72px;border-radius:16px;background:linear-gradient(145deg,#ffffff,#e4e4e4);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12),0 8px 0 #9b9b9b,0 14px 20px rgba(0,0,0,.45);padding:9px;box-sizing:border-box}
.zgd.roll{animation:zgroll .6s linear}
@keyframes zgroll{0%{transform:rotate(0) scale(1)}25%{transform:rotate(180deg) scale(1.15)}50%{transform:rotate(360deg) scale(.95)}75%{transform:rotate(540deg) scale(1.1)}100%{transform:rotate(720deg) scale(1)}}
.zgd-face{width:100%;height:100%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr)}
.zgd-face i{border-radius:50%}
.zgd-face i.p{background:radial-gradient(circle at 35% 30%,#666,#111 70%)}
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
.zg-end{position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.zg-end>div,.zg-endcard{background:linear-gradient(#262b44,#161a2c);border-radius:24px;padding:22px;display:grid;gap:12px;width:min(88vw,340px);text-align:center;box-shadow:0 14px 0 #0b0d18,0 30px 50px rgba(0,0,0,.6);animation:zgpop .35s cubic-bezier(.3,1.4,.6,1);box-sizing:border-box}
.zg-end b{font-size:22px}
@keyframes zgpop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
`;

  var NAMES = { chess: "Chess", ludo: "Ludo", morris: "Three men's morris", ttt: "Tic-tac-toe" };
  var GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
  var DIFF = { easy: { chess: 1, morris: 1, ttt: 0 }, medium: { chess: 2, morris: 3, ttt: 1 }, hard: { chess: 3, morris: 5, ttt: 2 } };
  var LUDO_COLOURS = ["red", "green", "yellow", "blue"];
  var LUDO_HEX = { red: "#E5303A", green: "#1FB35B", yellow: "#F5C518", blue: "#1E88E5" };
  var LUDO_DARK = { red: "#8E1219", green: "#0C6B33", yellow: "#9A7400", blue: "#0B4F95" };
  var LUDO_TRACK = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
  var LUDO_HOMES = [[[7,1],[7,2],[7,3],[7,4],[7,5]], [[1,7],[2,7],[3,7],[4,7],[5,7]], [[7,13],[7,12],[7,11],[7,10],[7,9]], [[13,7],[12,7],[11,7],[10,7],[9,7]]];
  var LUDO_BASE = [[[2,2],[2,3],[3,2],[3,3]], [[2,11],[2,12],[3,11],[3,12]], [[11,11],[11,12],[12,11],[12,12]], [[11,2],[11,3],[12,2],[12,3]]];
  var LUDO_SAFE = {}; [0, 13, 26, 39].forEach(function (g) { LUDO_SAFE[g] = 1; });
  var CELL = 100 / 15;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function host() {
    var h = document.getElementById("zgame");
    if (!h) { h = document.createElement("div"); h.id = "zgame"; document.body.appendChild(h); }
    return h;
  }
  function css() {
    if (document.getElementById("zgcss")) return;
    var s = document.createElement("style"); s.id = "zgcss";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ---- fermer ---- */
  function close() {
    clearTimeout(TIMER); TIMER = 0;
    var h = document.getElementById("zgame"); if (h) h.remove();
    var e = document.getElementById("zgend"); if (e) e.remove();
    var m = document.getElementById("zgmenu"); if (m) m.remove();
    G = null;
  }
  // retour au hub du lieu d'où l'on vient
  function back() { G = null; clearTimeout(TIMER); TIMER = 0; var e = document.getElementById("zgend"); if (e) e.remove(); hub(PLACE || "arena"); }

  /* ---- le hub : les 4 jeux ---- */
  function hub(place) {
    css();
    PLACE = place || "arena";
    G = null; clearTimeout(TIMER); TIMER = 0;
    var h = host();
    var sub = PLACE === "battle" ? "Battle Royale" : "Arena";
    h.className = "zg-page hub";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="close" aria-label="Close">×</button><div><b>Games</b><small>' + sub + '</small></div></div>' +
      '<div class="zg-hub">' +
        card("chess", "Chess", "Castling, en passant, promotion", '<div class="pv pv-chess">' + [0,1,2,3].map(function (i) { return '<i class="' + (i % 2 ? "b" : "w") + '"></i>'; }).join("") + '</div>') +
        card("ludo", "Ludo", "2 to 4 players", '<div class="pv pv-ludo"><i class="red"></i><i class="green"></i><i class="blue"></i><i class="yellow"></i></div>') +
        card("morris", "Three men's morris", "Mills and flying", '<div class="pv pv-morris"><b></b><b class="w"></b><b class="bk"></b></div>') +
        card("ttt", "Tic-tac-toe", "Three in a row", '<div class="pv pv-ttt"><span>✕</span><span>○</span><span>✕</span></div>') +
      '</div>' +
      (PLACE === "battle" ? '<div class="zg-inbox" id="zgInboxHost"></div>' : "");
    if (PLACE === "battle" && window.zgInboxInto) window.zgInboxInto(document.getElementById("zgInboxHost"));
  }
  function card(id, name, desc, preview) {
    return '<button class="zg-card" data-zgh="' + id + '">' + preview + '<b>' + esc(name) + '</b><small>' + esc(desc) + '</small></button>';
  }

  /* ---- réglages d'un jeu ---- */
  function setup(game) {
    SEL.game = game;
    var h = host();
    var battle = PLACE === "battle";
    h.className = "zg-page setup";
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="hub" aria-label="Back">‹</button><div><b>' + esc(NAMES[game]) + '</b><small>' + (battle ? "Battle Royale" : "Arena") + '</small></div></div>' +
      '<div class="zg-setup">' +
        (game === "ludo" ? '<div class="zg-label">Players</div><div class="seg">' + [2, 3, 4].map(function (n) { return '<button class="' + (SEL.players === n ? "on" : "") + '" data-zgs="players" data-v="' + n + '">' + n + '</button>'; }).join("") + '</div>' : "") +
        '<div class="zg-label">Level</div><div class="seg">' + [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(function (d) { return '<button class="' + (SEL.diff === d[0] ? "on" : "") + '" data-zgs="diff" data-v="' + d[0] + '">' + d[1] + '</button>'; }).join("") + '</div>' +
        '<button class="zg-big" data-zgs="ai">Play against the computer<small>Works offline</small></button>' +
        '<button class="zg-big alt" data-zgs="local">Two players on this phone<small>Works offline · pass the phone</small></button>' +
        (battle ? '<button class="zg-big alt2" data-zgs="online">Play a classmate remotely<small>Send an invitation · they accept in Battle Royale</small></button>' : "") +
      '</div>';
  }

  /* ---- démarrer ---- */
  function open(opts) {
    css();
    clearTimeout(TIMER); TIMER = 0;
    G = { game: opts.game, mode: opts.mode, diff: opts.diff || "medium", you: opts.you == null ? 0 : opts.you, sel: null, busy: false, over: false,
      id: opts.id || null, v: opts.v || 1, oppName: opts.oppName || "Classmate", anim: false, last: null, rolling: false };
    if (opts.st) G.st = opts.st;
    else if (opts.game === "chess") G.st = ZG.chess.start();
    else if (opts.game === "morris") G.st = ZG.morris.start();
    else if (opts.game === "ttt") G.st = ZG.ttt.start();
    else { G.n = opts.players || 2; G.st = ZG.ludo.start(G.n); }
    if (opts.game === "ludo" && !G.n) G.n = G.st.n || 2;
    host().className = "zg-page game " + opts.game;
    paint();
    schedule();
  }

  // côté qui joue : 0 = premier joueur
  function sideOfTurn() {
    if (G.game === "chess") return G.st.turn === "w" ? 0 : 1;
    if (G.game === "morris" || G.game === "ttt") return G.st.turn - 1;
    return G.st.turn;
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
  function humanTurn() { return G && !G.over && !G.rolling && isMyTurn() && !isAiTurn(); }

  function schedule() {
    clearTimeout(TIMER); TIMER = 0;
    if (!G || G.over) return;
    if (isAiTurn()) TIMER = setTimeout(aiMove, 480);
  }

  function aiMove() {
    TIMER = 0;
    if (!G || G.over) return;
    var d = DIFF[G.diff] || DIFF.medium;
    if (G.game === "chess") {
      var m = ZG.chess.best(G.st, d.chess);
      if (m) { G.last = { f: m.f, t: m.t }; G.anim = true; G.st = ZG.chess.make(G.st, m); }
    } else if (G.game === "morris") {
      var mm = ZG.morris.best(G.st, d.morris);
      if (mm) { G.last = mm.from != null ? { f: mm.from, t: mm.to } : { f: null, t: mm.to }; G.anim = true; G.st = ZG.morris.apply(G.st, mm); }
    } else if (G.game === "ttt") {
      var tm = ZG.ttt.best(G.st, d.ttt);
      if (tm) { G.last = { f: null, t: tm.at }; G.anim = true; G.st = ZG.ttt.apply(G.st, tm); }
    } else if (G.game === "ludo") {
      if (!G.st.dice) { rollAnimated(function () { TIMER = setTimeout(aiMove, 500); }, true); return; }
      var lm = ZG.ludo.pick(G.st);
      if (!lm) { G.st = ZG.ludo.pass(G.st); afterMove(); return; }
      G.st = ZG.ludo.apply(G.st, lm); afterMove(); return;
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
  function adopt(st, v) {
    if (!G) return;
    G.st = st; G.v = v; G.sel = null; G.anim = true;
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
  function showEnd(end) {
    var old = document.getElementById("zgend"); if (old) old.remove();
    var w = end.winner, msg;
    if (w < 0) msg = "Draw";
    else if (G.mode === "ai") msg = w === G.you ? "You win!" : "The computer wins";
    else if (G.mode === "online") msg = w === G.you ? "You win!" : G.oppName + " wins";
    else msg = "Player " + (w + 1) + " wins!";
    var el = document.createElement("div");
    el.id = "zgend"; el.className = "zg-end";
    el.innerHTML = '<div class="zg-endcard"><b>' + esc(msg) + '</b><small>' + esc(end.text) + '</small>' +
      (G.mode === "online" ? '' : '<button class="zg-big" data-zg="again">Play again</button>') +
      '<button class="zg-big alt" data-zg="hub">Other games</button></div>';
    document.body.appendChild(el);
  }

  /* ---- dessin ---- */
  function paint() {
    if (!G) return;
    var h = host();
    var anim = G.anim; G.anim = false;
    var body = G.game === "chess" ? chessHTML(anim) : G.game === "morris" ? morrisHTML(anim) : G.game === "ttt" ? tttHTML(anim) : ludoHTML();
    var sub = G.mode === "ai" ? "vs computer · " + G.diff : G.mode === "online" ? "vs " + esc(G.oppName) + " · online" : "2 players · this phone";
    var old = flipSnapshot(h);
    h.className = "zg-page game " + G.game;
    h.innerHTML =
      '<div class="zg-head"><button class="zg-x" data-zg="back" aria-label="Back">‹</button><div><b>' + esc(NAMES[G.game]) + '</b><small>' + sub + '</small></div></div>' +
      '<div class="zg-status">' + esc(statusText()) + '</div><div class="zg-body">' + body + '</div>';
    if (old) flipRun(h, old);
    if (G.game === "morris") morrisSlide(h);
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
    return "Player " + (G.st.turn + 1) + ": roll the dice";
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
      if (tg.length) cls += " to" + (tg[0].c ? " cap" : "");
      if (last && last.t === i) cls += " lastt";
      if (last && last.f === i) cls += " lastf";
      var piece = "";
      if (p) {
        var w = ZG.chess.white(p), mv = anim && last && last.t === i && last.f != null;
        var st2 = mv ? ' style="--fx:' + ((last.f % 8) - c) * 100 + '%;--fy:' + (Math.floor(last.f / 8) - r) * 100 + '%"' : "";
        piece = '<span class="zgp ' + (w ? "w" : "b") + (mv ? " mv" : "") + '"' + st2 + '>' + GLYPH[p.toUpperCase()] + '</span>';
      }
      rows += '<button class="' + cls + '" data-zgsq="' + i + '">' + piece + '</button>';
    }
    return '<div class="zgc-frame"><div class="zgc-board">' + rows + '</div></div>' +
      '<div class="zg-info">Tap a piece, then tap where it goes. Castling, en passant and promotion (to a queen) are included.</div>' +
      '<button class="zg-big alt" data-zg="again">New game</button>';
  }

  /* moulin à 3 pions */
  function morrisPoint(i) { return { x: 15 + (i % 3) * 35, y: 15 + Math.floor(i / 3) * 35 }; }
  function morrisHTML() {
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
        var moving = G.anim && last && last.t === i && last.f != null;
        var from = moving ? morrisPoint(last.f) : p;
        discs += '<div class="zgm-disc ' + (v === 1 ? "w" : "b") + (moving ? " zgm-mv" : "") + '" data-x="' + p.x + '" data-y="' + p.y + '" style="left:' + from.x + '%;top:' + from.y + '%"></div>';
      }
    }
    var hand = '<div class="zg-hand"><span>You: ' + st.hand[0] + ' to place</span><span>' + (G.mode === "ai" ? "Computer" : "Player 2") + ': ' + st.hand[1] + ' to place</span></div>';
    return '<div class="zgm-frame"><div class="zgm-board">' + svg + discs + hits + '</div></div>' + hand +
      '<div class="zg-info">Place your pieces, then slide them along a line. Three in a line is a mill: take one of the other side\'s pieces. With three pieces you can fly to any empty point.</div>' +
      '<button class="zg-big alt" data-zg="again">New game</button>';
  }
  // le pion qui vient de bouger glisse vers sa nouvelle place
  function morrisSlide(h) {
    h.querySelectorAll(".zgm-mv").forEach(function (el) {
      var x = el.getAttribute("data-x"), y = el.getAttribute("data-y");
      requestAnimationFrame(function () {
        el.style.transition = "left .34s cubic-bezier(.3,1.4,.6,1), top .34s cubic-bezier(.3,1.4,.6,1)";
        el.style.left = x + "%"; el.style.top = y + "%";
      });
    });
  }

  /* morpion */
  var TTT_LINE = { 0: [[0,0],[1,0],[2,0]], 1: [[0,1],[1,1],[2,1]], 2: [[0,2],[1,2],[2,2]] };
  function tttHTML(anim) {
    var st = G.st, human = !isAiTurn(), ms = ZG.ttt.moves(st), last = G.last;
    var cells = "";
    for (var i = 0; i < 9; i++) {
      var v = st.b[i], cls = "zgt-c";
      if (human && !st.win && ms.some(function (m) { return m.at === i; })) cls += " free";
      if (v) cls += " used";
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
    return '<div class="zgt-frame"><div class="zgt-board">' + grid + cells + strike + '</div></div>' +
      '<div class="zg-info">Get three of your marks in a row, across, down or diagonally.</div>' +
      '<button class="zg-big alt" data-zg="again">New game</button>';
  }
  function TTT_LINE_CELL(i) { return [(i % 3) * 33.3 + 16.7, Math.floor(i / 3) * 33.3 + 16.7]; }

  /* ludo */
  function ludoHTML() {
    var st = G.st, n = G.n, human = !isAiTurn();
    var moves = st.dice && !G.rolling ? ZG.ludo.moves(st, st.dice) : [];
    var quads = [[0,0,"red"],[0,9,"green"],[9,9,"yellow"],[9,0,"blue"]].map(function (q) {
      var c = LUDO_HEX[q[2]];
      return '<div class="zgl-quad" style="top:' + q[0] * CELL + '%;left:' + q[1] * CELL + '%;background:' + c + '"><div class="zgl-in"></div></div>';
    }).join("");
    var cells = "";
    LUDO_TRACK.forEach(function (rc, g) { cells += cellDiv(rc[0], rc[1], "track" + (LUDO_SAFE[g] ? " safe" : "")); });
    LUDO_HOMES.forEach(function (list, k) { list.forEach(function (rc) { cells += cellDiv(rc[0], rc[1], "home", LUDO_HEX[LUDO_COLOURS[k]]); }); });
    var toks = "";
    for (var pl = 0; pl < n; pl++) for (var t = 0; t < 4; t++) {
      var p = st.tok[pl][t], rc = p < 0 ? LUDO_BASE[pl][t] : ludoCell(pl, p);
      if (!rc) continue;
      var can = human && st.turn === pl && st.dice && !G.rolling && moves.some(function (m) { return m.t === t; });
      var shared = countAt(st, pl, p);
      toks += '<div class="zgl-tok' + (can ? " go" : "") + '" data-fid="T' + pl + t + '" ' + (can ? 'data-zgtok="' + t + '"' : "") +
        ' style="left:' + (rc[1] * CELL + 0.55) + '%;top:' + (rc[0] * CELL + 0.55) + '%;--tc:' + LUDO_HEX[LUDO_COLOURS[pl]] + ';--td:' + LUDO_DARK[LUDO_COLOURS[pl]] + '"' +
        (shared > 1 ? ' data-stack="1"' : "") + '></div>';
    }
    var arrow = !G.over ? '<div class="zgl-turn" style="' + turnPos(st.turn) + '"></div>' : "";
    var board = '<div class="zgl-frame"><div class="zgl-board">' + quads + cells + '<div class="zgl-center"></div>' + toks + arrow + '</div></div>';
    var players = '<div class="zg-players">' + LUDO_COLOURS.slice(0, n).map(function (cl, i) {
      var home = st.tok[i].filter(function (x) { return x === 56; }).length;
      return '<span class="zg-pl' + (st.turn === i && !G.over ? " on" : "") + '"><i style="background:' + LUDO_HEX[cl] + '"></i>' + (G.mode === "ai" ? (i === G.you ? "You" : "Computer") : "Player " + (i + 1)) + ' · ' + home + '/4</span>';
    }).join("") + '</div>';
    var die = '<div class="zgd' + (G.rolling ? " roll" : "") + '">' + dieFaces(st.dice && !G.rolling ? st.dice : 0) + '</div>';
    var action;
    if (human && !st.dice && !G.rolling) action = '<button class="zg-big ludo-roll" data-zg="roll">Roll the dice</button>';
    else if (human && st.dice && !G.rolling && !moves.length) action = '<button class="zg-big alt" data-zg="pass">No move — pass</button>';
    else action = '<div class="zg-info">' + (isAiTurn() ? "" : (human && st.dice ? "Tap a glowing token to move it." : "")) + '</div>';
    return board + '<div class="zgl-row">' + die + '<div class="zgl-act">' + action + '</div></div>' + players +
      '<div class="zg-info">Roll a six to bring a token out. Land on an opponent to send it back. A six gives another turn. The star squares are safe.</div>' +
      '<button class="zg-big alt" data-zg="again">New game</button>';
  }
  function cellDiv(r, c, cls, col) {
    return '<div class="zgl-cell ' + cls + '" style="top:' + r * CELL + '%;left:' + c * CELL + '%;width:' + CELL + '%;height:' + CELL + '%;' + (col ? "background:" + col : "") + '"></div>';
  }
  function turnPos(pl) {
    return "top:" + (pl === 2 || pl === 3 ? 90 : 3) + "%;left:" + (pl === 1 || pl === 2 ? 90 : 3) + "%";
  }
  function countAt(st, pl, p) { var n = 0; for (var q = 0; q < st.n; q++) for (var t = 0; t < 4; t++) if (st.tok[q][t] === p) n++; return n; }
  function ludoCell(k, p) { return p < 0 ? null : p <= 50 ? LUDO_TRACK[(k * 13 + p) % 52] : LUDO_HOMES[k][p - 51] || null; }
  function dieFaces(v) {
    var pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v] || [];
    var out = "";
    for (var i = 0; i < 9; i++) out += '<i class="' + (pips.indexOf(i) >= 0 ? "p" : "") + '"></i>';
    return '<div class="zgd-face">' + out + '</div>';
  }

  /* ---- animation : les jetons glissent vers leur nouvelle case ---- */
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
      el.style.transition = "none"; el.style.transform = "translate(" + dx + "px," + dy + "px)";
      requestAnimationFrame(function () {
        el.style.transition = "transform .42s cubic-bezier(.3,1.3,.5,1)"; el.style.transform = "";
      });
    });
  }

  /* ---- le dé : roule puis s'arrête sur la valeur ---- */
  function rollAnimated(done, aiRoll) {
    G.rolling = true; paint();
    var val = ZG.ludo.rollDice();
    setTimeout(function () {
      if (!G) return;
      G.rolling = false;
      G.st = ZG.ludo.roll(G.st, val);
      if (!aiRoll) sendMove();
      paint();
      if (done) done(); else ludoAfterRoll();
    }, 650);
  }
  function ludoRoll() {
    if (!humanTurn() || G.st.dice) return;
    rollAnimated(null, false);
    setTimeout(function () { if (G && G.st.dice) { var m = ZG.ludo.moves(G.st, G.st.dice); if (!m.length) { G.st = ZG.ludo.pass(G.st); afterMove(); } else if (m.length === 1) ludoPlay(m[0].t); } }, 800);
  }
  function ludoAfterRoll() { schedule(); }
  function ludoPlay(t) {
    var st = G.st, mv = ZG.ludo.moves(st, st.dice).filter(function (m) { return m.t === t; })[0];
    if (!mv) return;
    G.anim = true;
    G.st = ZG.ludo.apply(st, mv);
    afterMove();
  }

  /* ---- les coups du joueur ---- */
  function chessTap(sq) {
    var st = G.st, legal = ZG.chess.legal(st);
    var p = st.b[sq], mine = p && (ZG.chess.white(p) ? "w" : "b") === st.turn;
    if (G.sel != null) {
      var m = legal.filter(function (x) { return x.f === G.sel && x.t === sq; })[0];
      if (m) { G.last = { f: m.f, t: m.t }; G.anim = true; G.st = ZG.chess.make(st, m); afterMove(); return; }
    }
    G.sel = mine ? sq : null;
    paint();
  }
  function morrisTap(i) {
    var st = G.st, mv = ZG.morris.moves(st);
    if (st.pending) {
      var r = mv.filter(function (m) { return m.rem === i; })[0];
      if (r) { G.last = { f: null, t: i }; G.anim = true; G.st = ZG.morris.apply(st, r); afterMove(); }
      return;
    }
    if (st.hand[st.turn - 1] > 0) {
      var pl = mv.filter(function (m) { return m.to === i; })[0];
      if (pl) { G.last = { f: null, t: i }; G.anim = true; G.st = ZG.morris.apply(st, pl); afterMove(); }
      return;
    }
    if (G.sel != null) {
      var mo = mv.filter(function (m) { return m.from === G.sel && m.to === i; })[0];
      if (mo) { G.last = { f: G.sel, t: i }; G.anim = true; G.st = ZG.morris.apply(st, mo); G.sel = null; afterMove(); return; }
    }
    G.sel = st.b[i] === st.turn ? i : null;
    paint();
  }
  function tttTap(i) {
    var st = G.st, ok = ZG.ttt.moves(st).some(function (m) { return m.at === i; });
    if (!ok) return;
    G.last = { f: null, t: i }; G.anim = true;
    G.st = ZG.ttt.apply(st, { at: i });
    afterMove();
  }

  /* ---- événements ---- */
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b;
    if ((b = t.closest("[data-zgh]"))) { e.preventDefault(); setup(b.getAttribute("data-zgh")); return; }
    if ((b = t.closest("[data-zgs]"))) {
      e.preventDefault();
      var a = b.getAttribute("data-zgs");
      if (a === "players") { SEL.players = +b.getAttribute("data-v"); setup(SEL.game); return; }
      if (a === "diff") { SEL.diff = b.getAttribute("data-v"); setup(SEL.game); return; }
      if (a === "online") { if (window.zgOnlineStart) window.zgOnlineStart({ game: SEL.game, diff: SEL.diff, players: SEL.players }); return; }
      open({ game: SEL.game, mode: a === "ai" ? "ai" : "local", diff: SEL.diff, players: SEL.players });
      return;
    }
    if ((b = t.closest("[data-zg]"))) {
      e.preventDefault();
      var x = b.getAttribute("data-zg");
      if (x === "close") { close(); return; }
      if (x === "hub") { hub(PLACE || "arena"); return; }
      if (x === "back") { if (G && G.mode === "online") { close(); return; } back(); return; }
      if (!G) return;
      if (x === "again") { if (G.mode === "online") { close(); return; } var keep = { game: G.game, mode: G.mode, diff: G.diff, you: G.you, players: G.n }; open(keep); return; }
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

  /* ---- ouvrir le hub d'un lieu ---- */
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

  window.ZGUI = { open: open, menu: menu, close: close, adopt: adopt, current: function () { return G; } };
})();
