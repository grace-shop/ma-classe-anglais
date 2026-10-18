/* =====================================================================
   v5 · Call screen under the status bar, chat backgrounds, and a lighter
   screen while you are in a chat (the 3D background stops; blur is off).
   - Call screen: its top row (name, minimise button) starts below the
     phone's status bar, so nothing is hidden under it.
   - Chat background: pick a fancy or plain theme, or your own photo.
     The choice is kept on this device.
   ===================================================================== */
(function () {
  var KEY = "mca_chatbg", PHOTO = "mca_chatbg_photo";

  var THEMES = [
    { id: "none", name: "Aucun", css: "" },
    { id: "aurore", name: "Aurore", css: "linear-gradient(160deg,#ff9a9e 0%,#fad0c4 35%,#c3a6ff 72%,#8ec5fc 100%)" },
    { id: "galaxie", name: "Galaxie", css: "radial-gradient(1.2px 1.2px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#fff,transparent),radial-gradient(1.6px 1.6px at 45% 85%,#fff,transparent),radial-gradient(1px 1px at 85% 15%,#fff,transparent),linear-gradient(180deg,#0b0b2b,#2a1b5c 60%,#120a33)" },
    { id: "foret", name: "Forêt", css: "linear-gradient(170deg,#0f3d2e,#1f7a5a 55%,#a8e6cf)" },
    { id: "ocean", name: "Océan", css: "linear-gradient(180deg,#38bdf8,#0c4a6e 72%)" },
    { id: "soleil", name: "Coucher de soleil", css: "linear-gradient(180deg,#ff7e5f,#feb47b 45%,#6a3093)" },
    { id: "rose", name: "Rose doux", css: "linear-gradient(180deg,#fff1f6,#ffd6e7)" },
    { id: "papier", name: "Papier", css: "#f6f1e4" },
    { id: "ardoise", name: "Ardoise", css: "#1e293b" },
    { id: "menthe", name: "Menthe", css: "#e6f7f1" },
    { id: "photo", name: "Ma photo", css: "" }
  ];

  function getKey() { try { return localStorage.getItem(KEY) || "none"; } catch (e) { return "none"; } }
  function getPhoto() { try { return localStorage.getItem(PHOTO) || ""; } catch (e) { return ""; } }
  function setKey(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function themeCss(id) {
    if (id === "photo") { var p = getPhoto(); return p ? "url(" + p + ") center/cover no-repeat" : ""; }
    var t = THEMES.filter(function (x) { return x.id === id; })[0];
    return t ? t.css : "";
  }

  function applyBg() {
    var box = document.getElementById("chatScroll");
    if (!box) return;
    var css = themeCss(getKey());
    box.style.background = css || "";
  }

  // ---- the button that opens the picker, in the chat's name row
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4c0-4.4-4-7.2-9-7.2z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7.5" r="1.1"/><circle cx="14.5" cy="7.5" r="1.1"/></svg>';

  function decorate() {
    var f = document.querySelector(".glass.chat");
    if (!f) { if (document.getElementById("zzBgSheet")) closeSheet(); setPerf(false); return; }
    setPerf(true);
    applyBg();
    if (f.querySelector(":scope > .zz-bgbtn") || f.querySelector(".zz-bgbtn")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "zz-bgbtn"; b.setAttribute("aria-label", "Fond de la conversation"); b.title = "Fond de la conversation";
    b.innerHTML = ICON;
    var row = f.querySelector(":scope > .zz-cname");
    if (row) row.appendChild(b);
    else { b.classList.add("zz-bgbtn-abs"); f.insertBefore(b, f.firstChild); }
  }

  // ---- the picker sheet
  function swatch(t) {
    if (t.id === "photo") { var p = getPhoto(); return p ? "background:url(" + p + ") center/cover" : "background:repeating-linear-gradient(45deg,#334155 0 6px,#1e293b 6px 12px)"; }
    return "background:" + (t.css || "#0b1020");
  }
  function openSheet() {
    closeSheet();
    var cur = getKey();
    var s = document.createElement("div");
    s.id = "zzBgSheet";
    s.innerHTML = '<div class="zbs-card" role="dialog" aria-label="Fond de la conversation">' +
      '<div class="zbs-title">Fond de la conversation</div>' +
      '<div class="zbs-grid">' + THEMES.map(function (t) {
        var on = t.id === cur ? " on" : "";
        var label = t.id === "photo" ? "Ma photo" : t.name;
        return '<button type="button" class="zbs-item' + on + '" data-bg="' + t.id + '"><span class="zbs-sw" style="' + swatch(t) + '"></span><span class="zbs-name">' + label + '</span></button>';
      }).join("") + '</div>' +
      '<div class="zbs-row"><button type="button" class="zbs-photo" data-act="pick">Prendre ou choisir une photo</button></div>' +
      '</div>';
    document.body.appendChild(s);
    s.addEventListener("click", function (e) {
      if (e.target === s) return closeSheet();
      var b = e.target.closest("[data-bg],[data-act]");
      if (!b) return;
      if (b.dataset.act === "pick") return pickPhoto();
      var id = b.dataset.bg;
      if (id === "photo" && !getPhoto()) return pickPhoto();
      setKey(id); applyBg(); closeSheet();
    });
  }
  function closeSheet() { var s = document.getElementById("zzBgSheet"); if (s) s.remove(); }

  function pickPhoto() {
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
            try { localStorage.setItem(PHOTO, data); } catch (e) { toast("Photo trop lourde, choisis-en une autre", "x"); return; }
            setKey("photo"); applyBg(); closeSheet(); toast("Fond mis à jour", "check");
          } catch (e) { toast("Cette photo ne peut pas être utilisée", "x"); }
        };
        img.onerror = function () { toast("Cette photo ne peut pas être utilisée", "x"); };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    };
    inp.click();
  }

  // ---- lighter screen while in a chat: the 3D background stops and the
  // (LITE) switch is used only while the chat is open; it is put back after
  var perfOn = false, prevLite = false;
  function setPerf(on) {
    if (on === perfOn) return;
    perfOn = on;
    try {
      if (on) {
        prevLite = !!LITE;
        LITE = true;
        var c = document.getElementById("bg3d"); if (c) c.style.display = "none";
      } else {
        LITE = prevLite;
        var c2 = document.getElementById("bg3d"); if (c2) c2.style.display = "";
        if (!LITE && typeof window.__bgResume === "function") window.__bgResume();
      }
    } catch (e) {}
  }

  // the picker button opens the sheet (a click anywhere else is left alone)
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".zz-bgbtn");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    openSheet();
  }, true);

  // ---- hook into the redraw and watch for a chat appearing
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

  // ---- styles
  var st = document.createElement("style");
  st.id = "zzzzzdFixes";
  st.textContent = `
/* top bar: sits at the very top, so the call buttons under it stay visible */
html body header.top{position:sticky!important;top:0!important;margin-top:0!important}

/* call screen: starts below the status bar, so the top row is never hidden */
#callScr:not(.zz-mini){padding-top:calc(env(safe-area-inset-top,0px) + 30px)!important}

/* chat: the picker button */
.zz-bgbtn{width:40px;height:40px;border-radius:50%;flex:none;margin-left:auto;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;padding:0}
.zz-bgbtn-abs{position:absolute;top:8px;right:8px;z-index:5}

/* picker */
#zzBgSheet{position:fixed;inset:0;z-index:9600;background:rgba(3,4,12,.6);display:flex;align-items:flex-end;justify-content:center}
#zzBgSheet .zbs-card{width:100%;max-width:520px;box-sizing:border-box;padding:16px 16px max(18px,env(safe-area-inset-bottom,0px));border-radius:22px 22px 0 0;background:#141a33;color:#fff;box-shadow:0 -10px 30px rgba(0,0,0,.5)}
#zzBgSheet .zbs-title{font:700 1.05rem/1.2 system-ui,sans-serif;margin:2px 4px 12px}
#zzBgSheet .zbs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#zzBgSheet .zbs-item{border:2px solid transparent;border-radius:14px;background:rgba(255,255,255,.04);padding:6px;cursor:pointer;color:#fff;display:flex;flex-direction:column;gap:6px;align-items:stretch}
#zzBgSheet .zbs-item.on{border-color:#6EE7C1}
#zzBgSheet .zbs-sw{display:block;height:64px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
#zzBgSheet .zbs-name{font:600 .78rem/1.2 system-ui,sans-serif;text-align:center}
#zzBgSheet .zbs-row{margin-top:14px}
#zzBgSheet .zbs-photo{width:100%;padding:12px;border-radius:14px;border:1px solid rgba(110,231,193,.5);background:rgba(110,231,193,.12);color:#9FF5DA;font:700 .92rem/1 system-ui,sans-serif;cursor:pointer}

/* chat: lighter drawing (no blur, no 3D background, no bubble animations) */
body:has(.glass.chat) .glass,body:has(.glass.chat) header.top,body:has(.glass.chat) nav.tabs{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
body:has(.glass.chat) .mg-p{display:none!important}
body:has(.glass.chat) .msgs *,body:has(.glass.chat) .msg{animation:none!important;transition:none!important}
`;
  document.head.appendChild(st);
  try { decorate(); } catch (e) {}
})();
