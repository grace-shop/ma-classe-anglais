/* =====================================================================
   v5 · Chat backgrounds, shared with the other person (duo and group).
   - Tap the palette in a chat: you see the background as a preview, then
     "Partager" sends it. The other people in the chat see the same
     background, and a line tells them who changed it.
   - The change travels as a normal message. Its marker is made of
     invisible characters, so nothing extra shows on screen.
   - "Ma photo" is a background of your own: only you see it.
   - 20 backgrounds, each with its own 3D emoji.
   ===================================================================== */
(function () {
  var PHOTO_PFX = "mca_chatphoto_", MODE_PFX = "mca_chatmode_";

  function svgTile(s) { return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(s) + '")'; }
  var SPARK = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M30 8l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#ffffff" fill-opacity=".55"/><circle cx="8" cy="48" r="2" fill="#fff" fill-opacity=".7"/></svg>';
  var WAVE = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><path d="M0 15 Q30 0 60 15 T120 15 V30 H0Z" fill="#ffffff" fill-opacity=".12"/></svg>';
  var CLOUD = '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="90"><g fill="#ffffff" fill-opacity=".75"><ellipse cx="40" cy="50" rx="30" ry="16"/><ellipse cx="70" cy="42" rx="26" ry="20"/><ellipse cx="98" cy="54" rx="24" ry="14"/></g></svg>';
  var FLOWER = '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><g fill="#f9a8d4" fill-opacity=".55"><circle cx="20" cy="20" r="7"/><circle cx="28" cy="20" r="7"/><circle cx="20" cy="28" r="7"/><circle cx="28" cy="28" r="7"/></g><circle cx="70" cy="66" r="6" fill="#fde68a" fill-opacity=".7"/></svg>';
  var TREE = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><path d="M20 100 L38 60 L26 60 L46 30 L36 30 L54 6 L72 30 L62 30 L82 60 L70 60 L88 100Z" fill="#ffffff" fill-opacity=".12"/></svg>';
  var MOUNT = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" preserveAspectRatio="none"><path d="M0 200 L90 90 L150 150 L230 60 L320 140 L400 90 L400 200Z" fill="#1e1b4b" fill-opacity=".55"/></svg>';

  // id, name, 3D emoji, background (css value)
  var THEMES = [
    { id: "violet", name: "Violet", emo: "1f98b", css: "linear-gradient(160deg,#2b1055,#6d28d9 60%,#c4b5fd)" },
    { id: "aurore", name: "Aurore", emo: "2728", css: "linear-gradient(160deg,#ff9a9e,#fad0c4 35%,#c3a6ff 72%,#8ec5fc)" },
    { id: "galaxie", name: "Galaxie", emo: "1f319", css: "radial-gradient(1.2px 1.2px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#fff,transparent),radial-gradient(1.6px 1.6px at 45% 85%,#fff,transparent),linear-gradient(180deg,#0b0b2b,#2a1b5c 60%,#120a33)" },
    { id: "licorne", name: "Licorne", emo: "1f984", css: svgTile(SPARK) + " 0 0/60px 60px repeat,linear-gradient(160deg,#ffd6f0,#d6e4ff 60%,#fff3d6)" },
    { id: "ocean", name: "Océan", emo: "1f30a", css: svgTile(WAVE) + " 0 100%/120px 30px repeat-x,linear-gradient(180deg,#38bdf8,#0c4a6e)" },
    { id: "nuages", name: "Nuages", emo: "2601", css: svgTile(CLOUD) + " 0 0/140px 90px repeat,linear-gradient(180deg,#8ec5fc,#e0f2ff)" },
    { id: "fleurs", name: "Fleurs", emo: "1f338", css: svgTile(FLOWER) + " 0 0/90px 90px repeat,#fff7ed" },
    { id: "foret", name: "Forêt", emo: "1f333", css: svgTile(TREE) + " 0 0/120px 120px repeat,linear-gradient(170deg,#0f3d2e,#1f7a5a 60%,#a8e6cf)" },
    { id: "montagne", name: "Montagnes", emo: "1f30b", css: svgTile(MOUNT) + " 0 100%/100% 100% no-repeat,linear-gradient(180deg,#312e81,#f97316)" },
    { id: "coucher", name: "Coucher de soleil", emo: "1f31f", css: "radial-gradient(circle at 50% 110%,#fde68a,transparent 45%),linear-gradient(180deg,#ff7e5f,#feb47b 45%,#6a3093)" },
    { id: "or", name: "Or noir", emo: "1f451", css: "repeating-linear-gradient(45deg,rgba(212,175,55,.14) 0 1px,transparent 1px 14px),linear-gradient(160deg,#0b0b0b,#1c1708)" },
    { id: "diamant", name: "Diamant", emo: "1f48e", css: "linear-gradient(135deg,rgba(255,255,255,.12) 0 25%,transparent 25% 50%,rgba(255,255,255,.08) 50% 75%,transparent 75%),linear-gradient(160deg,#0f172a,#1e3a5f)" },
    { id: "marbre", name: "Marbre", emo: "1f3a8", css: "linear-gradient(120deg,#e5e7eb,#9ca3af 40%,#f3f4f6 60%,#6b7280)" },
    { id: "prestige", name: "Prestige", emo: "1f3c6", css: "linear-gradient(160deg,#4a0d1e,#7f1d1d 60%,#2a0610)" },
    { id: "papier", name: "Papier", emo: "1f4da", css: "#f6f1e4" },
    { id: "ardoise", name: "Ardoise", emo: "1f4a7", css: "#1e293b" },
    { id: "menthe", name: "Menthe", emo: "1f343", css: "linear-gradient(180deg,#e6f7f1,#b7ebd9)" },
    { id: "pastel", name: "Pastel", emo: "1f9f8", css: "linear-gradient(160deg,#fde2e4,#e2ece9 50%,#dfe7fd)" },
    { id: "sable", name: "Sable", emo: "1f3d6", css: "linear-gradient(180deg,#fef3c7,#fde68a)" },
    { id: "givre", name: "Givre", emo: "2744", css: "linear-gradient(180deg,#f8fafc,#dbeafe)" }
  ];
  var DEFAULT = { id: "none", name: "Par défaut", emo: "1f4ac" };
  var PHOTO = { id: "photo", name: "Ma photo", emo: "1f388" };

  function find(id) {
    if (id === "none") return DEFAULT;
    if (id === "photo") return PHOTO;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }

  // ---- the marker: invisible characters that encode the background id
  var Z = ["​", "‌", "‍", "⁠"];
  var RE = /﻿([​-‍⁠]+)﻿/;
  function enc(id) {
    var out = "";
    for (var i = 0; i < id.length; i++) {
      var n = id.charCodeAt(i) & 255;
      out += Z[(n >> 6) & 3] + Z[(n >> 4) & 3] + Z[(n >> 2) & 3] + Z[n & 3];
    }
    return "﻿" + out + "﻿";
  }
  function dec(s) {
    var id = "";
    for (var i = 0; i + 3 < s.length; i += 4) {
      var n = 0;
      for (var k = 0; k < 4; k++) n = (n << 2) | Z.indexOf(s.charAt(i + k));
      id += String.fromCharCode(n);
    }
    return id;
  }

  // ---- the conversation on screen
  function bar() { return document.querySelector("form.v4bar"); }
  function convTarget() { var b = bar(); return b ? b.dataset.s || "" : ""; }
  function convKind() {
    var b = bar(); if (!b) return null;
    var keys = Object.keys(V4KINDS);
    for (var i = 0; i < keys.length; i++) if (V4KINDS[keys[i]].form === b.dataset.f) return keys[i];
    return null;
  }
  function photoOf(t) { try { return localStorage.getItem(PHOTO_PFX + t) || ""; } catch (e) { return ""; } }
  function modeOf(t) { try { return localStorage.getItem(MODE_PFX + t) || ""; } catch (e) { return ""; } }
  function setMode(t, v) { try { if (v) localStorage.setItem(MODE_PFX + t, v); else localStorage.removeItem(MODE_PFX + t); } catch (e) {} }

  function cssFor(id, t) {
    if (id === "photo") { var p = photoOf(t); return p ? 'url("' + p + '") center/cover no-repeat' : ""; }
    if (id === "none") return "";
    var th = find(id);
    return th && th.css ? th.css : "";
  }

  // the background of the chat: the last shared change, unless my own photo is set
  var current = "none";
  function apply(box) {
    var t = convTarget();
    var id = modeOf(t) === "photo" && photoOf(t) ? "photo" : current;
    box.style.background = cssFor(id, t);
  }

  function tile(id, name, emo, sel) {
    return '<button type="button" class="zbs-item' + (sel ? " on" : "") + '" data-bg="' + id + '">' +
      '<span class="zbs-sw" style="background:' + (id === "photo" ? "repeating-linear-gradient(45deg,#334155 0 6px,#1e293b 6px 12px)" : (cssFor(id, convTarget()) || "#0b1020")) + '"></span>' +
      '<img class="e3d zbs-em" src="img/' + emo + '.webp" alt="" draggable="false" onerror="this.remove()">' +
      '<span class="zbs-name">' + name + '</span></button>';
  }

  // ---- decorate: find the changes in the chat, add the 3D emoji, set the background
  function decorate() {
    var f = document.querySelector(".glass.chat");
    var box = document.getElementById("chatScroll");
    if (!f || !box) { closeSheet(); return; }
    var last = null;
    box.querySelectorAll(".msg").forEach(function (m) {
      var mm = RE.exec(m.textContent || "");
      if (!mm) return;
      var id = dec(mm[1]);
      last = id;
      m.classList.add("zz-thmsg");
      if (!m.querySelector(".zz-thim")) {
        var th = find(id) || DEFAULT;
        var img = document.createElement("img");
        img.className = "e3d zz-thim"; img.alt = ""; img.draggable = false;
        img.src = "img/" + th.emo + ".webp";
        img.onerror = function () { img.remove(); };
        m.insertBefore(img, m.firstChild);
      }
    });
    current = last !== null ? last : "none";
    if (!document.getElementById("zzBgSheet")) apply(box);
    if (!f.querySelector(".zz-bgbtn")) addButton(f);
  }

  function addButton(f) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "zz-bgbtn"; b.setAttribute("aria-label", "Fond de la conversation"); b.title = "Fond de la conversation";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4c0-4.4-4-7.2-9-7.2z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7.5" r="1.1"/><circle cx="14.5" cy="7.5" r="1.1"/></svg>';
    var row = f.querySelector(":scope > .zz-cname");
    if (row) row.appendChild(b);
    else { b.classList.add("zz-bgbtn-abs"); f.insertBefore(b, f.firstChild); }
  }

  // ---- the picker: preview first, then share
  var pick = null; // the id being previewed

  function openSheet() {
    closeSheet();
    var t = convTarget();
    var mine = modeOf(t) === "photo" ? "photo" : current;
    pick = mine;
    var s = document.createElement("div");
    s.id = "zzBgSheet";
    s.innerHTML = '<div class="zbs-card" role="dialog" aria-label="Fond de la conversation">' +
      '<div class="zbs-title">Fond de la conversation</div>' +
      '<div class="zbs-sub">Touche un fond pour le voir. « Partager » l\'envoie aux autres de la conversation.</div>' +
      '<div class="zbs-grid">' + tile("none", DEFAULT.name, DEFAULT.emo, mine === "none") +
        THEMES.map(function (x) { return tile(x.id, x.name, x.emo, mine === x.id); }).join("") +
        tile("photo", PHOTO.name, PHOTO.emo, mine === "photo") + '</div>' +
      '<div class="zbs-row"><button type="button" class="zbs-btn ghost" data-act="cancel">Annuler</button>' +
      '<button type="button" class="zbs-btn" data-act="share">Partager</button></div>' +
      '</div>';
    document.body.appendChild(s);
    s.addEventListener("click", function (e) {
      if (e.target === s) return cancel();
      var b = e.target.closest("[data-bg],[data-act]");
      if (!b) return;
      if (b.dataset.act === "cancel") return cancel();
      if (b.dataset.act === "share") return share();
      var id = b.dataset.bg;
      if (id === "photo") return choosePhoto(); // always pick a new photo
      preview(id);
    });
  }

  function preview(id) {
    pick = id;
    var box = document.getElementById("chatScroll");
    if (box) box.style.background = cssFor(id, convTarget());
    document.querySelectorAll("#zzBgSheet .zbs-item").forEach(function (x) { x.classList.toggle("on", x.dataset.bg === id); });
  }

  function cancel() {
    closeSheet();
    var box = document.getElementById("chatScroll");
    if (box) apply(box);
  }

  function closeSheet() { var s = document.getElementById("zzBgSheet"); if (s) s.remove(); }

  function share() {
    var t = convTarget(), kind = convKind();
    var box = document.getElementById("chatScroll");
    if (pick === "photo") {
      setMode(t, "photo");
      closeSheet(); if (box) apply(box);
      toast("Ton fond est gardé : seulement pour toi", "check");
      return;
    }
    setMode(t, "");
    var who = (typeof callMyName === "function" && callMyName()) || "Quelqu'un";
    var label = pick === "none" ? "fond par défaut" : (find(pick) || {}).name || "";
    var text = who + " a changé le fond de la conversation : " + label + "." + enc(pick);
    if (!kind || !t) { toast("Ouvre une conversation pour changer le fond", "x"); return; }
    closeSheet();
    current = pick;
    if (box) apply(box);
    Promise.resolve(v4Deliver(kind, t, text, null, null)).catch(function () {
      toast("Le fond n'a pas pu être partagé", "x");
    });
    toast("Fond partagé", "check");
  }

  function choosePhoto() {
    var t = convTarget();
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = function () {
      var file = inp.files && inp.files[0];
      if (!file) return;
      var fr = new FileReader();
      fr.onload = function () {
        var img = new Image();
        img.onload = function () {
          try {
            var max = 900, sc = Math.min(1, max / Math.max(img.width, img.height));
            var c = document.createElement("canvas");
            c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            var data = c.toDataURL("image/jpeg", 0.8);
            try { localStorage.setItem(PHOTO_PFX + t, data); } catch (e) { toast("Photo trop lourde, choisis-en une autre", "x"); return; }
            preview("photo");
          } catch (e) { toast("Cette photo ne peut pas être utilisée", "x"); }
        };
        img.onerror = function () { toast("Cette photo ne peut pas être utilisée", "x"); };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    };
    inp.click();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".zz-bgbtn");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    openSheet();
  }, true);

  // ---- redraw hook and watcher
  var _r = render;
  render = function () {
    var out = _r.apply(this, arguments);
    try { decorate(); } catch (e) {}
    return out;
  };
  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { decorate(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzfChatBg";
  st.textContent = `
.zz-bgbtn{width:40px;height:40px;border-radius:50%;flex:none;margin-left:auto;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;padding:0}
.zz-bgbtn-abs{position:absolute;top:8px;right:8px;z-index:5}

/* the shared-change line: centred, with its 3D emoji */
.msg.zz-thmsg{background:transparent!important;box-shadow:none!important;border:0!important;float:none!important;width:100%!important;max-width:100%!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;text-align:center;margin:8px auto!important;padding:2px 8px!important;color:rgba(255,255,255,.85)!important;text-shadow:0 1px 3px rgba(0,0,0,.6);font-size:.7rem!important;line-height:1.25!important;opacity:.9}
.msg.zz-thmsg .zz-thim{display:inline-block;width:16px!important;height:16px!important;margin:0 0 2px!important;flex:none}
.msg.zz-thmsg *{font-size:inherit}
.msg.zz-thmsg .zz-thime{display:none}

#zzBgSheet{position:fixed;inset:0;z-index:9600;background:rgba(3,4,12,.6);display:flex;align-items:flex-end;justify-content:center}
#zzBgSheet .zbs-card{width:100%;max-width:520px;max-height:88vh;overflow:auto;box-sizing:border-box;padding:16px 16px max(18px,env(safe-area-inset-bottom,0px));border-radius:22px 22px 0 0;background:#141a33;color:#fff;box-shadow:0 -10px 30px rgba(0,0,0,.5)}
#zzBgSheet .zbs-title{font:700 1.05rem/1.2 system-ui,sans-serif;margin:2px 4px 4px}
#zzBgSheet .zbs-sub{font:500 .8rem/1.35 system-ui,sans-serif;color:#A9B8E0;margin:0 4px 12px}
#zzBgSheet .zbs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
#zzBgSheet .zbs-item{border:2px solid transparent;border-radius:14px;background:rgba(255,255,255,.04);padding:6px;cursor:pointer;color:#fff;display:flex;flex-direction:column;gap:5px;align-items:stretch;position:relative}
#zzBgSheet .zbs-item.on{border-color:#6EE7C1}
#zzBgSheet .zbs-sw{display:block;height:58px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
#zzBgSheet .zbs-em{position:absolute;top:4px;right:4px;width:34px;height:34px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))}
#zzBgSheet .zbs-name{font:600 .74rem/1.2 system-ui,sans-serif;text-align:center}
#zzBgSheet .zbs-row{display:flex;gap:10px;margin-top:14px}
#zzBgSheet .zbs-btn{flex:1;padding:12px;border-radius:14px;border:1px solid rgba(110,231,193,.5);background:rgba(110,231,193,.16);color:#9FF5DA;font:700 .92rem/1 system-ui,sans-serif;cursor:pointer}
#zzBgSheet .zbs-btn.ghost{border-color:rgba(255,255,255,.2);background:transparent;color:#fff}
`;
  document.head.appendChild(st);
  try { decorate(); } catch (e) {}
})();
