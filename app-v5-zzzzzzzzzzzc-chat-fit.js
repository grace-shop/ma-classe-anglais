/* =====================================================================
   v5 · Chat on any phone, and the message field empties after sending.
   1. The message field is emptied after sending (the text does not come back).
   2. On narrow or short screens the chat header stays on one line: smaller
      avatar and buttons, the name cut with « … » instead of wrapping.
   ===================================================================== */

/* 1 · after sending, the field is emptied and the draft is forgotten */
document.addEventListener("submit", function (e) {
  var f = e.target && e.target.dataset && e.target.dataset.f;
  var id = { chat: "chatInput", peerchat: "peerInput", staffchat: "staffInput" }[f];
  if (!id) return;
  var inp = document.getElementById(id);
  var text = inp ? (inp.value || "").trim() : "";
  if (!text) return;
  [60, 400, 1200].forEach(function (ms) {
    setTimeout(function () {
      var el = document.getElementById(id);
      if (!el) return;
      /* only if the text is still there: a failed send keeps the text on purpose (it is in S.drafts) */
      var kept = (typeof S !== "undefined" && S.drafts && S.drafts[id] === text);
      if ((el.value || "").trim() === text && !kept) {
        el.value = "";
        try {
          var pre = "mca_draft:" + id + "|";
          for (var i = localStorage.length - 1; i >= 0; i--) {
            var k = localStorage.key(i);
            if (k && k.indexOf(pre) === 0) localStorage.removeItem(k);
          }
        } catch (x) {}
      }
    }, ms);
  });
}, true);

/* 2 · fit the header of a conversation to the screen */
(function () {
  var st = document.createElement("style");
  st.textContent = [
    "@media (max-width:420px),(max-height:780px){",
    "  .glass.chat>:first-child{flex-wrap:nowrap!important;gap:6px!important;padding:8px 10px!important;min-width:0}",
    "  .glass.chat>:first-child>*{min-width:0}",
    "  .glass.chat>:first-child h2,.glass.chat>:first-child h3,.glass.chat>:first-child b{font-size:1.1rem!important;line-height:1.15!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "  .glass.chat>:first-child .eyebrow{font-size:.6rem!important;letter-spacing:.12em!important}",
    "  .glass.chat>:first-child img,.glass.chat>:first-child .avatar{width:40px!important;height:40px!important}",
    "  .glass.chat>:first-child button{flex:none;min-width:0!important;width:38px!important;height:38px!important;padding:0!important}",
    "  .glass.chat>:first-child .chip{font-size:.62rem!important;padding:2px 8px!important}",
    "  .chatbar{gap:6px!important;padding:8px!important}",
    "}"
  ].join("\n");
  document.head.appendChild(st);
})();
