/* ---- the ringtones are at the top of "Settings & security": the call ringtone and the notification sound,
   each with its default marked, and a preview for every one ---- */
(function () {
  if (typeof secView !== "function" || typeof rtPickersHTML !== "function") return;
  var _sec = secView;
  secView = function () {
    var h = _sec();
    var open = false;
    try { open = localStorage.getItem("ec_rt_fold") === "open"; } catch (e) {}
    var head = '<button type="button" class="rt-fold" data-rt-fold="1" aria-expanded="' + open + '">' +
      '<span class="rt-fold-t">🎵 Ringtones</span><span class="rt-chev">' + (open ? "▾" : "▸") + "</span></button>";
    var body = open ? '<p class="small muted" style="margin:0">Choose the ringtone for calls and the sound for messages. The default is marked. Tap “Preview” to hear it.</p>' + rtPickersHTML() : "";
    var card = '<div class="glass card sec rt-top">' + head + body + "</div>";
    return card + h;
  };
})();

/* click on the title to fold or unfold the ringtones (folded by default, to keep the page short) */
document.addEventListener("click", function (e) {
  var b = e.target.closest && e.target.closest("[data-rt-fold]");
  if (!b) return;
  e.preventDefault();
  var open = false;
  try { open = localStorage.getItem("ec_rt_fold") === "open"; } catch (x) {}
  try { localStorage.setItem("ec_rt_fold", open ? "closed" : "open"); } catch (x) {}
  render();
}, false);
(function () {
  var st = document.createElement("style");
  st.textContent = ".rt-fold{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;background:none;border:0;color:inherit;font:inherit;font-size:1.15rem;font-weight:700;padding:2px 0;cursor:pointer;text-align:left}.rt-fold:focus-visible{outline:2px solid #a78bfa;outline-offset:4px;border-radius:8px}.rt-chev{font-size:1.1rem;opacity:.75}";
  document.head.appendChild(st);
})();
