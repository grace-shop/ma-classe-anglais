/* =====================================================================
   v5 · Chat on any phone, and the message field empties after sending.
   1. The message field is emptied after sending (the text does not come back).
   2. On narrow or short screens the chat header stays on one line: smaller
      avatar and buttons, the name cut with « … » instead of wrapping.
   ===================================================================== */

/* 1 · after sending, the message field is emptied and its draft is forgotten.
   The check is made after the send handlers have read the field (they run first),
   and only when the message really went into the conversation (so a failed send keeps its text). */
(function () {
  var MAP = { chat: "chatInput", peerchat: "peerInput", staffchat: "staffInput" };
  function clearField(id, text) {
    var el = document.getElementById(id);
    if (!el || (el.value || "").trim() !== text) return;
    el.value = "";
    try {
      var pre = "mca_draft:" + id + "|";
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf(pre) === 0) localStorage.removeItem(k);
      }
    } catch (x) {}
    try { if (S.drafts && S.drafts[id] === text) delete S.drafts[id]; } catch (x) {}
  }
  function sentOk(id, text) {
    if (id !== "peerInput") return true;            // teacher chats: the field is emptied by their own handler
    try { return PR.inbox.some(function (m) { return m.sender === S.uid && (m.body || "") === text; }); } catch (x) { return false; }
  }
  document.addEventListener("submit", function (e) {
    var f = e.target && e.target.dataset && e.target.dataset.f;
    var id = MAP[f];
    if (!id) return;
    var inp = document.getElementById(id);
    var text = inp ? (inp.value || "").trim() : "";
    if (!text) return;
    [0, 40, 200, 600, 1500, 3000].forEach(function (ms) {
      setTimeout(function () { if (sentOk(id, text)) clearField(id, text); }, ms);
    });
  }, true);
})();

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
