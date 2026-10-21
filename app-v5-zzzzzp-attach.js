/* =====================================================================
   v5 · The attach button opens a sheet of options (like the usual
   messaging apps): Galerie, Caméra, Localisation, Contact, Document,
   Sondage, Événement, Images d'IA.
   - Galerie, Caméra and Document send a file through the existing picker.
   - Localisation sends your position as a map link.
   - Contact, Sondage, Événement and Images d'IA are shown, and say
     "bientôt" for now: they are not built yet.
   ===================================================================== */
(function () {
  var OPTS = [
    { a: "gallery", label: "Galerie", c: "#2F7BFF", ic: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>' },
    { a: "camera", label: "Caméra", c: "#FF2D6F", ic: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>' },
    { a: "loc", label: "Localisation", c: "#22C55E", ic: '<path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>' },
    { a: "contact", label: "Contact", c: "#0EA5E9", ic: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4"/>', soon: 1 },
    { a: "doc", label: "Document", c: "#A855F7", ic: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 14h6M9 17h4"/>' },
    { a: "poll", label: "Sondage", c: "#F59E0B", ic: '<path d="M5 6h10M5 12h14M5 18h7"/>', soon: 1 },
    { a: "event", label: "Événement", c: "#EF4444", ic: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><rect x="9" y="13" width="3" height="3" fill="currentColor"/>', soon: 1 },
    { a: "ai", label: "Images d'IA", c: "#3B82F6", ic: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 16l4-5 3 3 2-2 3 4"/><path d="M18 3v4M16 5h4"/>', soon: 1 }
  ];

  var ctx = null; // { kind, target, input }
  var sheet = null;

  function build() {
    sheet = document.createElement("div");
    sheet.id = "zzAttach";
    sheet.innerHTML =
      '<div class="zz-ab" data-x="1"></div>' +
      '<div class="zz-ap" role="dialog" aria-label="Envoyer">' +
        '<div class="zz-agrip"></div>' +
        '<div class="zz-agrid">' + OPTS.map(function (o) {
          return '<button type="button" class="zz-at" data-a="' + o.a + '">' +
            '<span class="zz-ac" style="color:' + o.c + '"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + o.ic + '</svg></span>' +
            '<span class="zz-al">' + o.label + '</span></button>';
        }).join("") + '</div></div>';
    document.body.appendChild(sheet);
    sheet.addEventListener("click", onSheet);
  }

  function open(form, input) {
    if (!sheet) build();
    ctx = { kind: input.id.slice(4), target: form.dataset.s, input: input };
    sheet.classList.add("open");
  }
  function close() { if (sheet) sheet.classList.remove("open"); }

  function pick(accept, withCamera) {
    var inp = ctx.input;
    inp.setAttribute("accept", accept);
    if (withCamera) inp.setAttribute("capture", "environment");
    else inp.removeAttribute("capture");
    inp.click();
  }

  function sendLocation() {
    var k = ctx.kind, t = ctx.target;
    if (!navigator.geolocation) { toast("Localisation indisponible sur cet appareil.", "x"); return; }
    toast("Recherche de votre position…", "check");
    navigator.geolocation.getCurrentPosition(function (p) {
      var url = "https://maps.google.com/?q=" + p.coords.latitude.toFixed(6) + "," + p.coords.longitude.toFixed(6);
      Promise.resolve(v4Deliver(k, t, "📍 Ma position : " + url, null, null)).catch(function () {
        toast("Envoi impossible.", "x");
      });
    }, function () {
      toast("Autorisez la localisation pour l'envoyer.", "x");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  function onSheet(e) {
    var t = e.target;
    if (t.dataset && t.dataset.x) { close(); return; }
    var b = t.closest && t.closest(".zz-at");
    if (!b) return;
    var a = b.dataset.a;
    close();
    if (a === "gallery") pick("image/*,video/*");
    else if (a === "camera") pick("image/*", true);
    else if (a === "doc") pick("application/pdf,audio/*,.doc,.docx,.ppt,.pptx,.txt");
    else if (a === "loc") sendLocation();
    else toast("Bientôt disponible.", "x");
  }

  // the attach button: open the sheet instead of the plain file picker
  document.addEventListener("click", function (e) {
    if (!e.isTrusted) return; // our own input.click() must not reopen the sheet
    var l = e.target && e.target.closest && e.target.closest(".v4att label.iconbtn");
    if (!l) return;
    var inp = l.querySelector('input[type="file"]');
    var form = l.closest("form.v4bar");
    if (!inp || !form) return;
    e.preventDefault();
    e.stopPropagation();
    open(form, inp);
  }, true);

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  var st = document.createElement("style");
  st.id = "zzzzzpAttach";
  st.textContent = `
#zzAttach{position:fixed;inset:0;z-index:9996;display:none}
#zzAttach.open{display:block}
#zzAttach .zz-ab{position:absolute;inset:0;background:rgba(0,0,0,.45)}
#zzAttach .zz-ap{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#1B1D24;color:#EDEEF3;border-radius:22px 22px 0 0;padding:10px 14px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -12px 40px rgba(0,0,0,.45);animation:zzAttUp .22s ease-out}
@keyframes zzAttUp{from{transform:translateY(100%)}to{transform:none}}
#zzAttach .zz-agrip{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 16px}
#zzAttach .zz-agrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px}
#zzAttach .zz-at{display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:0;color:inherit;cursor:pointer;padding:4px 0;font:inherit;-webkit-tap-highlight-color:transparent}
#zzAttach .zz-ac{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);transition:transform .12s}
#zzAttach .zz-at:active .zz-ac{transform:scale(.94)}
#zzAttach .zz-al{font:600 .8rem/1.2 system-ui,sans-serif;color:#D8DAE4;text-align:center;white-space:nowrap}
`;
  document.head.appendChild(st);
})();
