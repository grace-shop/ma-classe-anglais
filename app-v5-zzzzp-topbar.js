/* =====================================================================
   v5 · Top bar on phone: its buttons stay readable whatever the theme.
   The bar is always dark, so its buttons are dark glass with light icons
   (a light theme used to turn them white-on-white).
   ===================================================================== */
(function () {
  var st = document.createElement("style");
  st.id = "zzzzpTopbar";
  st.textContent = `
body header.top .iconbtn,
body header.top button.iconbtn,
:root[data-skin="nuit"] body header.top .iconbtn{background:var(--surface2)!important;border:1px solid var(--line)!important;color:var(--fg)!important;box-shadow:none!important}
body header.top .iconbtn svg,body header.top .iconbtn svg *{stroke:var(--fg)!important;color:var(--fg)!important}
body header.top .iconbtn:hover,body header.top .iconbtn:focus-visible{background:var(--line)!important}
body header.top .iconbtn .count,body header.top .iconbtn .badge{color:var(--on-ink)!important}
`;
  document.head.appendChild(st);
})();
