/* =====================================================================
   v5 · Classmates chat: the message goes at once, the translation after.
   - The message is sent as written, right away, and shown at once.
   - When the English version is ready, the sent message is updated with
     it (the other person sees the translation a moment later).
   - Only one redraw on send and one when the server confirms it.
   ===================================================================== */
(function () {
  var _orig = v4TextSend;
  var TRANSLATE_MS = 15000;

  function scrollEnd() {
    CHAT_STICK.on = true;
    var cs = document.getElementById("chatScroll");
    if (cs) cs.scrollTop = cs.scrollHeight;
  }

  // translate in the background, then update the message that was sent
  function translateLater(msgId, orig) {
    (async function () {
      try {
        var r = await Promise.race([
          v4Check(orig),
          new Promise(function (res) { setTimeout(function () { res(null); }, TRANSLATE_MS); })
        ]);
        if (!r) return;
        var packed = v4Pack(orig, r.en, r.k);
        await window.__peer.edit(msgId, packed);
        var row = PR.inbox.find(function (x) { return x.id === msgId; });
        if (row) { row.body = packed; render(); }
      } catch (e) {}
    })();
  }

  v4TextSend = async function (kind, f) {
    if (kind !== "peer") return _orig.apply(this, arguments);
    var id = V4IN(kind), inp = document.getElementById(id), orig = ((inp && inp.value) || "").trim();
    if (!orig) return;
    if (!navigator.onLine) { toast("No network: try again when you are online.", "x"); return; }
    var tgt = f.dataset.s, hadFocus = document.activeElement === inp;
    if (inp) inp.value = "";
    delete S.drafts[id];
    var reply = v4TakeReply(kind);
    var tmpId = "tmp" + Date.now() + Math.random().toString(36).slice(2, 6);
    PR.inbox.unshift({ id: tmpId, sender: S.uid, receiver: tgt, body: orig, att: null, meta: reply || null,
      created_at: new Date().toISOString(), read_at: null, pending: true });
    render(); scrollEnd();

    var msgId = null;
    try {
      msgId = await window.__peer.send(tgt, orig, null, reply || null);
    } catch (e) {
      PR.inbox = PR.inbox.filter(function (x) { return x.id !== tmpId; });
      S.drafts[id] = orig;
      toast((e && e.message) || "Could not send", "x");
      render();
      return;
    }
    var row = PR.inbox.find(function (x) { return x.id === tmpId; });
    if (row && msgId) { row.id = msgId; delete row.pending; }
    render(); scrollEnd();
    if (hadFocus) { var n = document.getElementById(id); if (n) n.focus({ preventScroll: true }); }

    if (msgId && v4NeedFix(orig)) translateLater(msgId, orig);
  };
})();
