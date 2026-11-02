/* A classmate's profile shows their current stories (last 24 h) with a button to view them. */
(function () {
  var asked = {};
  var _pv = personView;
  personView = function () {
    var h = _pv();
    var id = S.view && S.view.id;
    if (!id) return h;
    var now = Date.now();
    var list = (F.stories || []).filter(function (s) {
      return s.author === id && !s.deleted_at && now - new Date(s.created_at).getTime() < 864e5;
    });
    if (!list.length) {
      // the feed may not be loaded yet: load it once for this profile, then redraw
      if (!asked[id] && typeof feedLoad === "function" && !F.loaded && !F.loading) {
        asked[id] = 1;
        Promise.resolve(feedLoad()).then(function () { render(); }).catch(function () {});
      }
      return h;
    }
    var block = '<div class="glass card" style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<b>Stories · ' + list.length + '</b>' +
      '<button class="btn sm" data-v4="fOpenStory" data-id="' + esc(id) + '">' + ic("eye") + 'View stories</button></div>';
    var idx = h.lastIndexOf("</div>");
    return idx < 0 ? h : h.slice(0, idx) + block + h.slice(idx);
  };
})();
