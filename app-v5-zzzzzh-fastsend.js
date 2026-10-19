/* =====================================================================
   v5 · Classmates chat: a message appears at once when you send it.
   - The bubble is shown right away, as "sending".
   - The English check is given at most 4 seconds; if it is slower, the
     message goes out as written (the check is not waited for).
   - You can write the next message while one is still being sent.
   ===================================================================== */
(function () {
  var _orig = v4TextSend;
  var CHECK_MS = 4000;

  function scrollEnd() {
    CHAT_STICK.on = true;
    var cs = document.getElementById("chatScroll");
    if (cs) cs.scrollTop = cs.scrollHeight;
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

    var text = orig;
    try {
      if (v4NeedFix(orig)) {
        var r = await Promise.race([v4Check(orig), new Promise(function (res) { setTimeout(function () { res(null); }, CHECK_MS); })]);
        if (r) text = v4Pack(orig, r.en, r.k);
      }
    } catch (e) {}

    try { await v4Deliver(kind, tgt, text, null, reply); }
    catch (e) { toast((e && e.message) || "Could not send", "x"); S.drafts[id] = orig; }
    finally {
      PR.inbox = PR.inbox.filter(function (x) { return x.id !== tmpId; });
      render(); scrollEnd();
      if (hadFocus) { var n = document.getElementById(id); if (n) n.focus({ preventScroll: true }); }
    }
  };
})();
