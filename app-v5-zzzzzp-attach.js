/* =====================================================================
   v5 · The attach button opens a sheet of options (like the usual
   messaging apps): Galerie, Caméra, Localisation, Contact, Document,
   Sondage, Événement, Images d'IA.
   - Galerie, Caméra and Document send a file through the existing picker.
   - Localisation sends your position as a map link.
   - Événement, Contact and Sondage open a short form and send a card.
     Poll votes are not recorded yet. Images d'IA says "bientôt".
   ===================================================================== */
(function () {
  var OPTS = [
    { a: "gallery", label: "Galerie", c: "#2F7BFF", ic: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>' },
    { a: "camera", label: "Caméra", c: "#FF2D6F", ic: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>' },
    { a: "loc", label: "Localisation", c: "#22C55E", ic: '<path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>' },
    { a: "contact", label: "Contact", c: "#0EA5E9", ic: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4"/>' },
    { a: "doc", label: "Document", c: "#A855F7", ic: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 14h6M9 17h4"/>' },
    { a: "poll", label: "Sondage", c: "#F59E0B", ic: '<path d="M5 6h10M5 12h14M5 18h7"/>' },
    { a: "event", label: "Événement", c: "#EF4444", ic: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><rect x="9" y="13" width="3" height="3" fill="currentColor"/>' },
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

  // ---- forms for Événement, Contact and Sondage ----
  var FORM = {
    event: { title: "Nouvel événement", fields: [
      { n: "title", l: "Titre", p: "Sortie de classe", req: 1 },
      { n: "date", l: "Date", p: "", t: "date" },
      { n: "time", l: "Heure", p: "", t: "time" },
      { n: "place", l: "Lieu", p: "Salle 3" }], ok: "Envoyer l'événement" },
    contact: { title: "Partager un contact", fields: [
      { n: "name", l: "Nom", p: "Nom du contact", req: 1 },
      { n: "tel", l: "Numéro", p: "+228 …", t: "tel", req: 1 }], ok: "Envoyer le contact", picker: true },
    poll: { title: "Nouveau sondage", fields: [
      { n: "q", l: "Question", p: "Quel jour on sort ?", req: 1 },
      { n: "o1", l: "Réponse 1", p: "Lundi", req: 1 },
      { n: "o2", l: "Réponse 2", p: "Samedi", req: 1 },
      { n: "o3", l: "Réponse 3 (facultatif)", p: "", opt: 1 }], ok: "Envoyer le sondage" }
  };

  var form = null;
  function openForm(type) {
    var F = FORM[type];
    if (!F) return;
    closeForm();
    form = document.createElement("div");
    form.id = "zzAttForm";
    form.innerHTML = '<div class="zz-ab" data-x="1"></div><div class="zz-ap zz-fp">' +
      '<div class="zz-agrip"></div><div class="zz-fh">' + F.title + '</div>' +
      '<form class="zz-ff">' + F.fields.map(function (f) {
        return '<label class="zz-fl"><span>' + f.l + '</span><input name="' + f.n + '" type="' + (f.t || "text") + '" placeholder="' + f.p + '" maxlength="200"' + (f.req ? ' required' : '') + '></label>';
      }).join("") +
      (F.picker ? '<button type="button" class="zz-fpick" data-pick="1">Choisir dans mes contacts</button>' : '') +
      '<div class="zz-fbtns"><button type="button" class="zz-fcancel" data-x="1">Annuler</button><button type="submit" class="zz-fok">' + F.ok + '</button></div>' +
      '</form></div>';
    document.body.appendChild(form);
    form.addEventListener("click", function (e) {
      if (e.target.dataset && e.target.dataset.x) return closeForm();
      if (e.target.closest && e.target.closest("[data-pick]")) return pickContact();
    });
    form.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      sendForm(type, new FormData(e.target));
    });
    form.classList.add("open");
    setTimeout(function () { var i = form.querySelector("input"); if (i) i.focus(); }, 50);
  }
  function closeForm() { if (form) { form.remove(); form = null; } }

  function pickContact() {
    if (!(navigator.contacts && navigator.contacts.select)) { toast("Choix de contact indisponible ici : saisis-le.", "x"); return; }
    navigator.contacts.select(["name", "tel"], { multiple: false }).then(function (r) {
      if (!r || !r[0] || !form) return;
      var n = form.querySelector('[name="name"]'), t = form.querySelector('[name="tel"]');
      if (n && r[0].name) n.value = r[0].name[0] || "";
      if (t && r[0].tel) t.value = r[0].tel[0] || "";
    }).catch(function () {});
  }

  function sendForm(type, fd) {
    var k = ctx && ctx.kind, t = ctx && ctx.target;
    var v = function (n) { return String(fd.get(n) || "").trim(); };
    var text = "";
    if (type === "event") {
      var when = [v("date"), v("time")].filter(Boolean).join(" à ");
      text = "📅 Événement : " + v("title") + (when ? "\n🗓 " + when : "") + (v("place") ? "\n📍 " + v("place") : "");
    } else if (type === "contact") {
      text = "👤 Contact : " + v("name") + "\n📞 " + v("tel");
    } else if (type === "poll") {
      var opts = ["o1", "o2", "o3"].map(v).filter(Boolean);
      if (opts.length < 2) { toast("Ajoute au moins 2 réponses.", "x"); return; }
      text = "📊 Sondage : " + v("q") + "\n" + opts.map(function (o, i) { return (i + 1) + ". " + o; }).join("\n");
    }
    if (!text || !k || !t) return;
    closeForm();
    Promise.resolve(v4Deliver(k, t, text, null, null)).catch(function () { toast("Envoi impossible.", "x"); });
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
    else if (a === "event" || a === "contact" || a === "poll") openForm(a);
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

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); closeForm(); } });

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
#zzAttForm{position:fixed;inset:0;z-index:9997;display:none}
#zzAttForm.open{display:block}
#zzAttForm .zz-ab{position:absolute;inset:0;background:rgba(0,0,0,.45)}
#zzAttForm .zz-ap{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#1B1D24;color:#EDEEF3;border-radius:22px 22px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -12px 40px rgba(0,0,0,.45);animation:zzAttUp .22s ease-out;max-height:86vh;overflow-y:auto}
#zzAttForm .zz-agrip{width:44px;height:5px;border-radius:99px;background:rgba(255,255,255,.28);margin:2px auto 14px}
#zzAttForm .zz-fh{font:700 1.05rem/1.2 system-ui,sans-serif;margin:0 0 12px}
#zzAttForm .zz-ff{display:flex;flex-direction:column;gap:10px}
#zzAttForm .zz-fl{display:flex;flex-direction:column;gap:5px;font:600 .8rem system-ui,sans-serif;color:#C9CCD8}
#zzAttForm .zz-fl input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:14px;color:#fff;padding:12px 14px;font:500 1rem system-ui,sans-serif;outline:none;width:100%;box-sizing:border-box}
#zzAttForm .zz-fl input:focus{border-color:rgba(127,190,255,.6)}
#zzAttForm .zz-fpick{align-self:flex-start;background:rgba(14,165,233,.15);border:1px solid rgba(14,165,233,.4);color:#7DD3FC;border-radius:999px;padding:7px 14px;font:700 .8rem system-ui,sans-serif;cursor:pointer}
#zzAttForm .zz-fbtns{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:6px}
#zzAttForm .zz-fbtns button{border-radius:16px;padding:13px;font:700 .95rem system-ui,sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,.16)}
#zzAttForm .zz-fcancel{background:transparent;color:#EDEEF3}
#zzAttForm .zz-fok{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
#zzAttach .zz-al{font:600 .8rem/1.2 system-ui,sans-serif;color:#D8DAE4;text-align:center;white-space:nowrap}
`;
  document.head.appendChild(st);
})();
