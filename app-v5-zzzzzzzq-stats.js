/* ---- Student statistics on the profile page: points, messages sent, active days.
   Computed on the phone from data the app already has; nothing new is stored on the server. ---- */
(function () {
  if (typeof profileView !== "function") return;
  var _pf = profileView;
  profileView = function () {
    var h = _pf();
    try {
      if (!S || S.mode !== "student" || !S.uid) return h;
      var me = S.uid, sent = 0, days = {}, first = null;
      (PR.inbox || []).forEach(function (m) {
        if (m.sender !== me || m.deleted_at || !m.created_at) return;
        sent++;
        var d = new Date(m.created_at), key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
        days[key] = 1;
        if (!first || d < first) first = d;
      });
      var activeDays = Object.keys(days).length;
      var xp = (S.me && S.me.xp) || 0;
      var since = first ? first.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) : "—";
      var card = '<div class="glass card stats-card"><h3 style="margin:0 0 10px">Your statistics</h3>' +
        '<div class="stats-grid">' +
        '<div><b>' + xp + '</b><span class="small muted">points</span></div>' +
        '<div><b>' + sent + '</b><span class="small muted">messages sent</span></div>' +
        '<div><b>' + activeDays + '</b><span class="small muted">active days</span></div>' +
        '<div><b>' + esc(since) + '</b><span class="small muted">first message</span></div>' +
        '</div></div>';
      var i = h.indexOf('<div class="section"', 10);
      return i > 0 ? h.slice(0, i) + card + h.slice(i) : card + h;
    } catch (e) { return h; }
  };
})();
