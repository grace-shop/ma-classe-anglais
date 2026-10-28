/* =====================================================================
   v5 · Sending in a classmate or group chat without losing the keyboard.
   - While a message is sent, the screen only redraws the list of messages.
     The message bar is not rebuilt, so the keyboard stays open and the
     text field keeps the focus.
   - If the send fails, the text goes back into the field.
   ===================================================================== */
(function () {
  var quiet = false;

  // redraw only the messages of the open classmate or group chat
  function chatList() {
    var cs = document.getElementById("chatScroll");
    var v = S.view && S.view.type;
    if (!cs || !v) return false;
    if (v === "peer") {
      var id = S.view.id, me = S.uid;
      var msgs = PR.inbox.filter(function (m) { return (m.sender === me && m.receiver === id) || (m.sender === id && m.receiver === me); }).slice().reverse();
      cs.innerHTML = msgs.length ? v4MsgList("peer", msgs, v4Ctx("peer", id)) : "";
      return true;
    }
    if (v === "group") {
      var gid = S.view.id, L = GR.msgs[gid];
      if (!L) return false;
      cs.innerHTML = L.length ? grMsgList(gid, L, v4Ctx("group", gid)) : "";
      return true;
    }
    return false;
  }

  var _render = render;
  render = function () {
    if (quiet && chatList()) {
      var cs = document.getElementById("chatScroll");
      if (cs) cs.scrollTop = cs.scrollHeight;
      return;
    }
    return _render.apply(this, arguments);
  };

  var _send = v4TextSend;
  v4TextSend = async function (kind, f) {
    if (kind !== "peer" && kind !== "group") return _send.apply(this, arguments);
    var id = V4IN(kind);
    quiet = true;
    try {
      return await _send.apply(this, arguments);
    } finally {
      quiet = false;
      // a failed send gives the text back to the field
      var inp = document.getElementById(id);
      if (inp && !inp.value && S.drafts[id]) inp.value = S.drafts[id];
    }
  };
})();
