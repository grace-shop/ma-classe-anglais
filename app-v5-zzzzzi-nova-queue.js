/* =====================================================================
   v5 · Talk with Nova: a message written while Nova is still answering
   is no longer lost. It is kept, shown right away, and sent with the
   next question as soon as Nova has answered.
   ===================================================================== */
(function () {
  var _send = talkSend;
  talkSend = function (text) {
    var T = S.talk;
    text = String(text || "").trim();
    if (T && T.busy && text) {
      T.turns.push({ role: "me", text: text.slice(0, 600), queued: true });
      T.queued = true;
      render();
      return;
    }
    return _send.apply(this, arguments);
  };

  var _ask = talkAsk;
  talkAsk = async function (start) {
    var r = await _ask.apply(this, arguments);
    var T = S.talk;
    if (T && !T.busy && T.queued) {
      T.queued = false;
      for (var i = 0; i < T.turns.length; i++) delete T.turns[i].queued;
      _ask.call(this, false);
    }
    return r;
  };
})();
