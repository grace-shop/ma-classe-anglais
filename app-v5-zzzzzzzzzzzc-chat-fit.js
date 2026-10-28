/* =====================================================================
   v5 · Chat on any phone, and the message field empties after sending.
   1. The message field is emptied after sending (the text does not come back).
   2. On narrow or short screens the chat header stays on one line: smaller
      avatar and buttons, the name cut with « … » instead of wrapping.
   ===================================================================== */

/* 1 · after sending, the message field is emptied, and stays empty.
   The cause: the chat send handler (set up earlier) calls stopImmediatePropagation on the submit event,
   so the draft module never got it. The saved draft (mca_draft:…) was then put back in the new field
   every time the chat was redrawn. This module listens on window, which runs before the handlers,
   forgets the draft of the sent text, and empties the field once the send has read it. */
(function () {
  var MAP = { chat: "chatInput", peerchat: "peerInput", staffchat: "staffInput" };
  var pending = {};   // id -> { text, until }

  function currentKey(id) {
    try { var v = S.view; return "mca_draft:" + id + "|" + (v ? v.type + ":" + v.id : "home"); } catch (x) { return ""; }
  }
  function forget(id, text) {
    try {
      var k0 = currentKey(id);
      if (k0) localStorage.removeItem(k0);
      var pre = "mca_draft:" + id + "|";
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf(pre) === 0 && (localStorage.getItem(k) || "").trim() === text) localStorage.removeItem(k);
      }
    } catch (x) {}
    try { if (S.drafts && S.drafts[id] === text) delete S.drafts[id]; } catch (x) {}
  }
  function tidy(id) {
    var P = pending[id];
    if (!P) return;
    if (Date.now() > P.until) { delete pending[id]; return; }
    var el = document.getElementById(id);
    if (!el || (el.value || "").trim() !== P.text) return;
    var failed = false;
    try { failed = S.drafts && S.drafts[id] === P.text; } catch (x) {}
    if (failed) { delete pending[id]; return; }      // the send failed: the text is put back on purpose
    try { el.blur(); } catch (x) {}
    el.value = "";
    forget(id, P.text);
    delete pending[id];
  }

  window.addEventListener("submit", function (e) {
    var f = e.target && e.target.dataset && e.target.dataset.f;
    var id = MAP[f];
    if (!id) return;
    var inp = document.getElementById(id);
    var text = inp ? (inp.value || "").trim() : "";
    if (!text) return;
    forget(id, text);                                  // the draft goes now, so a redraw cannot bring it back
    pending[id] = { text: text, until: Date.now() + 6000 };
    [0, 30, 120, 300, 700, 1500, 3000, 5000].forEach(function (ms) {
      setTimeout(function () { tidy(id); }, ms);
    });
  }, true);

  // the field can be rebuilt after the send: clear it again if it comes back with the sent text
  new MutationObserver(function () {
    Object.keys(pending).forEach(tidy);
  }).observe(document.body, { childList: true, subtree: true });
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
