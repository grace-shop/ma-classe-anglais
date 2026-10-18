/* =====================================================================
   v5 · In a classmate chat, the name sits on the top edge of the message
   frame and stays still: only the messages scroll inside the frame.
   The page itself no longer scrolls when the messages reach the top or
   the bottom (scroll chaining is switched off).
   ===================================================================== */
(function () {
  function fit() {
    var f = document.querySelector(".glass.chat");
    if (!f || !f.parentElement) { document.documentElement.classList.remove("zz-chatlock"); return; }
    var sec = f.parentElement;
    var row = f.classList.contains("zz-framed") ? f.querySelector(":scope > .zz-cname") : null;
    for (var i = 0; !row && i < sec.children.length; i++) {
      var c = sec.children[i];
      if (c.classList.contains("row") && c.querySelector("h2") && c.nextElementSibling === f) { row = c; break; }
    }
    if (!row) { document.documentElement.classList.remove("zz-chatlock"); return; }  // not a classmate chat
    document.documentElement.classList.add("zz-chatlock");   // the page does not scroll: the name stays still
    if (!f.classList.contains("zz-framed")) {
      f.classList.add("zz-framed");
      row.classList.add("zz-cname");
      f.insertBefore(row, f.firstChild);
    }
    // the height is set once per screen width: a system banner (microphone,
    // notifications) that changes the window height must not resize the chat
    if (f.dataset.zzw === String(window.innerWidth) && f.style.height) return;
    var bar = sec.querySelector("form.v4bar");
    var bh = bar && !f.contains(bar) ? bar.getBoundingClientRect().height : 0;
    var top = f.getBoundingClientRect().top;
    var h = Math.max(260, Math.round(window.innerHeight - top - bh - 14));
    f.dataset.zzw = String(window.innerWidth);
    f.style.height = h + "px";
  }

  // Every redraw of the screen (a sent message, a new message) rebuilds the
  // chat. Frame it right away, before the browser paints, so the name and the
  // frame never show in their unstyled state, and keep the scroll position.
  var _render = render;
  render = function () {
    var box = document.getElementById("chatScroll");
    var pos = box ? box.scrollTop : 0;
    var out = _render.apply(this, arguments);
    try { fit(); } catch (e) {}
    var nb = document.getElementById("chatScroll");
    if (nb && box && nb !== box) nb.scrollTop = pos;
    return out;
  };

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
html.zz-chatlock,html.zz-chatlock body{overflow:hidden!important;height:100%;overscroll-behavior:none}
.glass.chat.zz-framed ~ p.hint{display:none!important}
.glass.chat.zz-framed{display:flex;flex-direction:column;overflow:hidden}
.glass.chat.zz-framed > .zz-cname{flex:none;margin:0!important;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:12px}
.glass.chat.zz-framed > .zz-cname h2{margin:0}
.glass.chat.zz-framed > #chatScroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
`;
  document.head.appendChild(st);
  schedule();
})();
