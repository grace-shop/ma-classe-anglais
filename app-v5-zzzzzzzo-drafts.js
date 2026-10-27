/* ---- Drafts: a message typed but not sent is kept for each conversation, and comes back when you return.
   Stored on this phone only. Sending (or clearing the field) removes the draft. ---- */
(function () {
  var IDS = ["chatInput", "peerInput", "staffInput"];
  var PREFIX = "mca_draft:";

  function where() {
    try {
      var v = (typeof S !== "undefined" && S.view) || null;
      return v ? v.type + ":" + v.id : "home";
    } catch (e) { return "home"; }
  }
  function key(id) { return PREFIX + id + "|" + where(); }
  function get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function set(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el || IDS.indexOf(el.id) < 0) return;
    set(key(el.id), el.value.trim() ? el.value : "");
  }, true);

  // sending clears the draft: the field is emptied by code, so no input event is fired for it
  var FORM_INPUT = { chat: "chatInput", peerchat: "peerInput", staffchat: "staffInput" };
  document.addEventListener("submit", function (e) {
    var id = FORM_INPUT[e.target && e.target.id];
    if (id) set(key(id), "");
  }, true);

  // when a chat input appears empty, fill it with its saved draft
  function restore() {
    IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.value !== "" || el.__draftDone === where()) return;
      var d = get(key(id));
      el.__draftDone = where();
      if (d) el.value = d;
    });
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; restore(); });
  }).observe(document.body, { childList: true, subtree: true });

  window.mcaDrafts = { clearAll: function () {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k); }); } catch (e) {}
  } };
})();
