/* ---- the chat keeps its place while a photo, video or document is open, and while its menu is open ----
   Opening the menu of a photo or video must not send the chat back to its last message, and closing the
   viewer must not either. The sheet of options is raised above the viewer. */
(function () {
  var lastOpen = 0, savedY = null;
  function viewerOpen() { return !!(document.getElementById("zzal") || document.getElementById("docv")); }
  function sheetOpen() { var h = document.getElementById("v4sheets"); return !!(h && h.innerHTML); }
  // while a viewer is on screen, remember where the chat was
  setInterval(function () {
    var cs = document.getElementById("chatScroll");
    if (viewerOpen()) { lastOpen = Date.now(); if (cs) savedY = cs.scrollTop; }
  }, 120);
  function keep() {
    var cs = document.getElementById("chatScroll");
    if (!cs || savedY == null) return;
    if (viewerOpen() || sheetOpen() || Date.now() - lastOpen < 1500) {
      if (Math.abs(cs.scrollTop - savedY) > 2) cs.scrollTop = savedY;
    }
  }
  if (typeof render === "function") {
    var _render = render;
    render = function () { var r = _render.apply(this, arguments); keep(); return r; };
  }
  if (typeof v4ChatLayout === "function") {
    var _layout = v4ChatLayout;
    v4ChatLayout = function () { var r = _layout.apply(this, arguments); keep(); return r; };
  }
  var st = document.createElement("style");
  st.textContent = "#v4sheets .v4sheet-bg{z-index:10060!important}#v4sheets .v4sheet{z-index:10061!important}";
  document.head.appendChild(st);
})();
