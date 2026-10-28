/* ---- Ringtones: a fold button (title + chevron) in Settings and on the profile page.
   Folded by default. Each place remembers its own state on this phone. ---- */
(function () {
  var CHEV = '<svg class="rt-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function keyOf(id) { return "ec_rt_fold" + (id === "1" ? "" : "_" + id); }
  window.rtFoldOpen = function (id) { try { return localStorage.getItem(keyOf(id)) === "open"; } catch (e) { return false; } };
  window.rtFoldHead = function (id, title, open) {
    return '<button type="button" class="rt-fold" data-rt-fold="' + id + '" aria-expanded="' + !!open + '">' +
      '<span class="rt-fold-t">' + title + "</span>" + CHEV + "</button>";
  };

  if (typeof secView === "function" && typeof rtPickersHTML === "function") {
    var _sec = secView;
    secView = function () {
      var h = _sec();
      var open = window.rtFoldOpen("1");
      var card = '<div class="glass card sec rt-top">' + window.rtFoldHead("1", "🎵 Ringtones", open) +
        (open ? '<p class="small muted" style="margin:6px 0 8px">Choose the ringtone for calls and the sound for messages. The default is marked. Tap “Preview” to hear it.</p>' + rtPickersHTML() : "") +
        "</div>";
      return card + h;
    };
  }

  /* one click handler for every fold button; capture phase so a parent cannot block it */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rt-fold]");
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var id = b.getAttribute("data-rt-fold"), k = keyOf(id);
    var open = false;
    try { open = localStorage.getItem(k) === "open"; } catch (x) {}
    try { localStorage.setItem(k, open ? "closed" : "open"); } catch (x) {}
    render();
  }, true);

  var st = document.createElement("style");
  st.textContent = ".rt-fold{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;background:none;border:0;color:inherit;font:inherit;font-size:1.15rem;font-weight:700;padding:4px 0;cursor:pointer;text-align:left}" +
    ".rt-fold:focus-visible{outline:2px solid #a78bfa;outline-offset:4px;border-radius:8px}" +
    ".rt-chev{flex:none;opacity:.85;transition:transform .25s ease}" +
    '.rt-fold[aria-expanded="true"] .rt-chev{transform:rotate(180deg)}';
  document.head.appendChild(st);
})();
