/* ---- the Practice tabs (Quiz, Picture games, Exam papers, Pronunciation) follow the chosen theme ---- */
(function () {
  var st = document.createElement("style");
  st.textContent = [
    ".prac-seg{background:var(--surface2,transparent)!important;border:1px solid var(--line,transparent)!important}",
    ".prac-seg button{color:var(--muted)!important;background:transparent!important;box-shadow:none!important}",
    ".prac-seg button:hover{color:var(--fg)!important}",
    ":root .prac-seg button[aria-pressed=\"true\"]{background:var(--grad)!important;color:var(--on-ink,#fff)!important;box-shadow:0 8px 18px -8px var(--ink,#000)!important}",
    ":root .prac-seg button[aria-pressed=\"true\"] svg{color:var(--on-ink,#fff)}",
    ".prac-seg button:focus-visible{outline:2px solid var(--ink,currentColor);outline-offset:2px}"
  ].join("");
  document.head.appendChild(st);
})();
