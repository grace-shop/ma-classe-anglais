/* =====================================================================
   v5 · In a classmate chat, the name sits on the top edge of the message
   frame and stays still: only the messages scroll inside the frame.
   The page itself no longer scrolls when the messages reach the top or
   the bottom (scroll chaining is switched off).
   ===================================================================== */
(function () {
  function fit() {
    var f = document.querySelector(".glass.chat");
    if (!f || !f.parentElement) return;
    var sec = f.parentElement;
    var row = null;
    for (var i = 0; i < sec.children.length; i++) {
      var c = sec.children[i];
      if (c.classList.contains("row") && c.querySelector("h2") && c.nextElementSibling === f) { row = c; break; }
    }
    if (!row) return;                       // not a classmate chat
    if (!f.classList.contains("zz-framed")) {
      f.classList.add("zz-framed");
      row.classList.add("zz-cname");
      f.insertBefore(row, f.firstChild);
    }
    var bar = sec.querySelector("form.v4bar");
    var bh = bar && !f.contains(bar) ? bar.getBoundingClientRect().height : 0;
    var top = f.getBoundingClientRect().top;
    var h = Math.max(260, Math.round(window.innerHeight - top - bh - 14));
    if (f.dataset.zzh !== String(h)) { f.dataset.zzh = String(h); f.style.height = h + "px"; }
  }

  var raf = 0;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { fit(); } catch (e) {} });
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);

  var st = document.createElement("style");
  st.id = "zzzzzNameFix";
  st.textContent = `
.glass.chat.zz-framed{display:flex;flex-direction:column;overflow:hidden}
.glass.chat.zz-framed > .zz-cname{flex:none;margin:0!important;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:12px}
.glass.chat.zz-framed > .zz-cname h2{margin:0}
.glass.chat.zz-framed > #chatScroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
`;
  document.head.appendChild(st);
  schedule();
})();
