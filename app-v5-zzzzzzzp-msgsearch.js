/* ---- Search in messages: the search box of the classmates list also finds the text of messages.
   Matching messages show under the list, newest first; tapping one opens that conversation. ---- */
(function () {
  if (typeof peersView !== "function") return;
  var _pv = peersView;
  peersView = function () {
    var h = _pv();
    var q = ((S.drafts && S.drafts.peer_q) || "").trim().toLowerCase();
    if (!q || q.length < 2) return h;
    var me = S.uid, hits = [];
    for (var i = PR.inbox.length - 1; i >= 0 && hits.length < 30; i--) {
      var m = PR.inbox[i];
      if (m.deleted_at || !m.body) continue;
      var text = (typeof v4Plain === "function" ? v4Plain(m.body) : m.body);
      if (String(text).toLowerCase().indexOf(q) < 0) continue;
      var other = m.sender === me ? m.receiver : m.sender;
      hits.push({ uid: other, text: String(text).slice(0, 120), at: m.created_at, out: m.sender === me });
    }
    if (!hits.length) return h + '<div class="glass card small msg-hits"><p class="hint" style="margin:0">No message contains “' + esc(q) + "”.</p></div>";
    var rows = hits.map(function (x) {
      var nm = (typeof peerName === "function" ? peerName(x.uid) : "Classmate") || "Classmate";
      var when = x.at ? new Date(x.at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
      return '<div class="it click" data-a="openPeer" data-id="' + esc(x.uid) + '" tabindex="0">' +
        '<div class="txt"><b>' + esc(nm) + '</b> <span class="small muted">' + (x.out ? "You" : "") + " · " + esc(when) + "</span>" +
        '<p class="small" style="margin:2px 0 0">' + esc(x.text) + "</p></div></div>";
    }).join("");
    return h + '<div class="glass card msg-hits"><h3 style="margin:0 0 8px">Messages</h3><div class="glass list">' + rows + "</div></div>";
  };
})();
