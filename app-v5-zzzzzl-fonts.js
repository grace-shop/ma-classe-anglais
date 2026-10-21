/* =====================================================================
   v5 · Chat fonts and a bigger text box.
   - An "Aa" button in the name row of a chat opens a list of fancy fonts.
     Each one shows a sample line. The choice is kept on this device only
     and applies to the message bubbles and the box where you type.
   - The text you type is bigger, so you can read what you write.
   ===================================================================== */
(function () {
  var KEY = "mca_chatfont";
  var FONTS = [
    { id: "", label: "Normal", css: "", sample: "Bonjour, ça va ?" },
    { id: "pacifico", label: "Pacifico", css: "'Pacifico', cursive", sample: "Bonjour, ça va ?" },
    { id: "dancing", label: "Dancing Script", css: "'Dancing Script', cursive", sample: "Bonjour, ça va ?" },
    { id: "lobster", label: "Lobster", css: "'Lobster', cursive", sample: "Bonjour, ça va ?" },
    { id: "greatvibes", label: "Great Vibes", css: "'Great Vibes', cursive", sample: "Bonjour, ça va ?" },
    { id: "satisfy", label: "Satisfy", css: "'Satisfy', cursive", sample: "Bonjour, ça va ?" },
    { id: "caveat", label: "Caveat", css: "'Caveat', cursive", sample: "Bonjour, ça va ?" },
    { id: "righteous", label: "Righteous", css: "'Righteous', cursive", sample: "Bonjour, ça va ?" },
    { id: "cinzel", label: "Cinzel", css: "'Cinzel', serif", sample: "Bonjour, ça va ?" },
    { id: "playfair", label: "Playfair Display", css: "'Playfair Display', serif", sample: "Bonjour, ça va ?" }
  ];

  function getChoice() {
    try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; }
  }
  function setChoice(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }
  function fontOf(id) {
    for (var i = 0; i < FONTS.length; i++) if (FONTS[i].id === id) return FONTS[i];
    return FONTS[0];
  }
  function apply() {
    var f = fontOf(getChoice());
    var root = document.documentElement;
    if (f.css) {
      root.style.setProperty("--zzf", f.css);
      root.classList.add("zz-cf");
    } else {
      root.style.removeProperty("--zzf");
      root.classList.remove("zz-cf");
    }
  }

  // load the font files (Google Fonts is already allowed by the page policy)
  (function loadFonts() {
    try {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@400..700&family=Lobster&family=Great+Vibes&family=Satisfy&family=Caveat:wght@400..700&family=Righteous&family=Cinzel:wght@400..700&family=Playfair+Display:wght@400..700&display=swap";
      document.head.appendChild(l);
    } catch (e) {}
  })();

  // ---- picker sheet ----
  var sheet = null;
  function openSheet() {
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = "zzFontSheet";
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-label", "Police d'écriture des messages");
      var list = FONTS.map(function (f) {
        return '<button type="button" class="zz-fopt" data-f="' + f.id + '">' +
          '<span class="zz-flab">' + f.label + '</span>' +
          '<span class="zz-fsam" style="font-family:' + (f.css || "inherit") + '">' + f.sample + '</span></button>';
      }).join("");
      sheet.innerHTML = '<div class="zz-fbox"><div class="zz-fhead">Police des messages</div>' +
        '<div class="zz-flist">' + list + '</div></div>';
      document.body.appendChild(sheet);
      sheet.addEventListener("click", function (e) {
        if (e.target === sheet) { closeSheet(); return; }
        var b = e.target.closest && e.target.closest(".zz-fopt");
        if (!b) return;
        setChoice(b.getAttribute("data-f") || "");
        apply();
        closeSheet();
      });
    }
    var cur = getChoice();
    sheet.querySelectorAll(".zz-fopt").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-f") === cur);
    });
    sheet.classList.add("open");
  }
  function closeSheet() { if (sheet) sheet.classList.remove("open"); }

  // ---- the "Aa" button in each chat's name row ----
  function addButton(f) {
    var row = f.querySelector(":scope > .zz-cname");
    if (!row || row.querySelector(".zz-fontbtn")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "zz-fontbtn";
    b.setAttribute("aria-label", "Police d'écriture des messages");
    b.title = "Police d'écriture";
    b.textContent = "Aa";
    var bg = row.querySelector(".zz-bgbtn");
    if (bg && bg.nextSibling) row.insertBefore(b, bg.nextSibling);
    else row.appendChild(b);
  }
  function scan() {
    document.querySelectorAll(".glass.chat.zz-framed").forEach(addButton);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".zz-fontbtn");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    openSheet();
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { scan(); } catch (e) {} });
  }).observe(document.body, { childList: true, subtree: true });

  var st = document.createElement("style");
  st.id = "zzzzzlFonts";
  st.textContent = `
/* the text you type: bigger, so it is easy to read */
html body .chatbar.v4bar input{font-size:19px!important;line-height:1.3}

/* chosen font, on message bubbles and the typing box */
html.zz-cf body .msg,html.zz-cf body .chatbar.v4bar input{font-family:var(--zzf)!important}
html.zz-cf body .msg{font-size:1.12em}

.zz-fontbtn{width:40px;height:40px;border-radius:50%;flex:none;margin-left:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:inherit;font:700 .9rem/1 system-ui,sans-serif;cursor:pointer}

#zzFontSheet{position:fixed;inset:0;z-index:9995;background:rgba(5,7,15,.55);display:none;align-items:flex-end;justify-content:center}
#zzFontSheet.open{display:flex}
#zzFontSheet .zz-fbox{width:100%;max-width:520px;max-height:78vh;display:flex;flex-direction:column;background:#141826;color:#F4F4F8;border-radius:18px 18px 0 0;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.5);font:600 .95rem/1.3 system-ui,sans-serif}
#zzFontSheet .zz-fhead{text-align:center;padding:4px 0 10px;opacity:.85}
#zzFontSheet .zz-flist{overflow-y:auto;display:flex;flex-direction:column;gap:8px}
#zzFontSheet .zz-fopt{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;text-align:left;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:inherit;cursor:pointer}
#zzFontSheet .zz-fopt.on{border-color:#6EE7C1;box-shadow:0 0 0 1px #6EE7C1 inset}
#zzFontSheet .zz-flab{font:600 .72rem/1 system-ui,sans-serif;opacity:.6;letter-spacing:.02em}
#zzFontSheet .zz-fsam{font-size:1.35rem;line-height:1.25}
`;
  document.head.appendChild(st);
  apply();
  try { scan(); } catch (e) {}
})();
