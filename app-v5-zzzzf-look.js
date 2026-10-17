/* =====================================================================
   v5 · Navigation look (videos 3 and 4)
   - PC: glassy dark sidebar on the left, labels visible, active item lit.
   - Phone: "liquid" dark pill at the bottom, white bubble over the active icon.
   - Top bar: dark glass pill, same family as the bottom bar.
   CSS only: no markup or behaviour changes.
   ===================================================================== */
(function () {
  if (document.getElementById("zzzzflook")) return;
  var st = document.createElement("style");
  st.id = "zzzzflook";
  st.textContent = `
:root{--lk-ink:#0C0E1A;--lk-glass:linear-gradient(160deg,rgba(40,44,78,.55),rgba(12,14,28,.72));--lk-line:rgba(255,255,255,.12);--lk-txt:#C9CEE8;--lk-acc:#7F8CFF}

/* ---------- PC sidebar (video 3) ---------- */
@media (min-width:1100px){
  body nav.tabs{left:16px!important;top:50%!important;width:208px!important;max-width:208px!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:4px!important;padding:16px 12px!important;border-radius:26px!important;background:var(--lk-glass)!important;border:1px solid var(--lk-line)!important;box-shadow:0 30px 60px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12)!important;backdrop-filter:blur(22px) saturate(1.3)!important;-webkit-backdrop-filter:blur(22px) saturate(1.3)!important;max-height:calc(100vh - 40px)!important;overflow:auto}
  body nav.tabs::before{content:"MENU";display:block;font:700 .66rem/1 Manrope,system-ui,sans-serif;letter-spacing:.18em;color:#7C84AA;padding:6px 10px 10px}
  body nav.tabs button{flex-direction:row!important;justify-content:flex-start;gap:12px!important;padding:11px 12px!important;border-radius:14px!important;font-size:.92rem!important;font-weight:600;color:var(--lk-txt)!important;background:none!important;box-shadow:none!important;width:100%!important;text-align:left}
  body nav.tabs button:hover{background:rgba(255,255,255,.06)!important;color:#fff!important}
  body nav.tabs button svg{width:20px!important;height:20px!important;flex:0 0 auto}
  body nav.tabs button[aria-current="true"]{color:#fff!important;background:linear-gradient(90deg,rgba(127,140,255,.28),rgba(127,140,255,.06))!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 8px 22px -10px rgba(127,140,255,.6)!important}
  body nav.tabs .count{top:50%!important;right:12px!important;transform:translateY(-50%)}
  body .wrap{margin-left:max(250px,calc((100vw - 1180px)/2))!important;max-width:min(1180px,calc(100vw - 300px))!important}
  body header.top{border-radius:0 0 22px 22px}
}

/* ---------- Phone bottom bar: liquid pill (video 4) ---------- */
@media (max-width:1099px){
  body nav.tabs{position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;width:calc(100% - 28px)!important;max-width:460px!important;margin:0!important;padding:10px 12px!important;border-radius:999px!important;background:#0B0D18!important;border:0!important;box-shadow:0 18px 40px -12px rgba(0,0,0,.6)!important;justify-content:space-between!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  body nav.tabs button{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0!important;padding:0!important;height:50px;border-radius:0!important;background:none!important;box-shadow:none!important;color:#8A90B5!important;font-size:0!important;position:relative;overflow:visible}
  body nav.tabs button svg{width:22px!important;height:22px!important;transition:transform .25s}
  body nav.tabs button[aria-current="true"]{color:#fff!important;background:none!important}
  body nav.tabs button[aria-current="true"]::before{content:"";position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:50px;height:50px;border-radius:50%;background:#fff;box-shadow:0 10px 22px rgba(0,0,0,.35);z-index:-1}
  body nav.tabs button[aria-current="true"] svg{color:#0B0D18;transform:translateY(-30px)}
  body nav.tabs button[aria-current="true"]::after{content:attr(data-label);position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:.66rem;font-weight:700;white-space:nowrap;color:#fff}
  body nav.tabs .count{top:4px!important;right:calc(50% - 20px)!important}
  body header.top{margin:8px 14px 0!important;border-radius:999px!important;background:#0B0D18!important;color:#fff;padding:10px 16px!important;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)!important}
  body header.top *{color:inherit}
}
`;
  document.head.appendChild(st);
  /* The phone bubble shows the label of the active tab, so copy each label onto its button. */
  function labelTabs() {
    document.querySelectorAll("nav.tabs button").forEach(function (b) {
      var t = Array.prototype.filter.call(b.childNodes, function (n) { return !(n.classList && n.classList.contains("count")); })
        .map(function (n) { return n.textContent; }).join("").trim();
      if (t && b.dataset.label !== t) b.dataset.label = t;
    });
  }
  var nav = document.getElementById("tabs");
  if (nav) { new MutationObserver(labelTabs).observe(nav, { childList: true, subtree: true, characterData: true }); labelTabs(); }
})();
