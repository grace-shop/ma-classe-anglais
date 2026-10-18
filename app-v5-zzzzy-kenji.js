/* =====================================================================
   v5 · The helper is now Kenji: a Japanese man with glasses, the
   studious type. He reacts to each answer and says it out loud.
   Tap him to hear the last line again.
   ===================================================================== */
(function () {
  var last = "";

  function kenjiSVG() {
    return '<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="146" rx="44" ry="5" fill="#000" opacity=".18"/>' +
      // suit and shirt
      '<path d="M18 150 L18 120 Q20 99 44 95 L76 95 Q100 99 102 120 L102 150 Z" fill="#2B3A55"/>' +
      '<path d="M50 95 L60 116 L70 95 Z" fill="#F4F6FA"/>' +
      '<path d="M57 102 L63 102 L65 118 L60 125 L55 118 Z" fill="#7F1D2B"/>' +
      // neck and head
      '<rect x="52" y="80" width="16" height="18" rx="6" fill="#E9B98F"/>' +
      '<ellipse cx="60" cy="54" rx="26" ry="28" fill="#F2C7A0"/>' +
      '<ellipse cx="34" cy="57" rx="5" ry="6" fill="#E6B08A"/>' +
      '<ellipse cx="86" cy="57" rx="5" ry="6" fill="#E6B08A"/>' +
      // neat black hair with a side parting
      '<path d="M33 52 Q30 22 60 20 Q90 22 87 52 Q84 36 72 33 Q56 36 44 31 Q36 38 33 52 Z" fill="#1B1B22"/>' +
      // eyebrows and eyes
      '<path d="M40 44 Q49 40 57 44" stroke="#1B1B22" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M63 44 Q71 40 80 44" stroke="#1B1B22" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="49" cy="55" r="2.3" fill="#1B1B22"/><circle cx="71" cy="55" r="2.3" fill="#1B1B22"/>' +
      // round glasses
      '<g fill="rgba(255,255,255,.14)" stroke="#23232B" stroke-width="2.4">' +
      '<circle cx="49" cy="56" r="9.5"/><circle cx="71" cy="56" r="9.5"/>' +
      '<path d="M58.5 55 Q60 53 61.5 55" fill="none"/></g>' +
      '<path d="M39.5 54 L32 52" stroke="#23232B" stroke-width="2.2"/>' +
      '<path d="M80.5 54 L88 52" stroke="#23232B" stroke-width="2.2"/>' +
      // mouth: a thoughtful half smile, moves while he speaks
      '<path class="kz-mo" d="M52 74 Q60 79 68 74" stroke="#7A3B3B" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  function talk(text, mood) {
    var box = document.getElementById("mas");
    if (!box) return;
    box.classList.add("kz-talk");
    clearTimeout(box._kzT);
    var ms = Math.min(9000, Math.max(1800, String(text).length * 75));
    box._kzT = setTimeout(function () { box.classList.remove("kz-talk"); }, ms);
    try { speak(String(text).replace(/[^\x20-\x7E]/g, "").trim() || "Well done", "en"); } catch (e) {}
  }

  var _ms = masShow;
  masShow = function (text, mood) {
    var old = document.getElementById("mas");
    if (old && !old.dataset.kenji) old.remove();   // redraw the old helper
    var before = MAS.last;
    _ms.apply(this, arguments);
    var box = document.getElementById("mas");
    if (!box) return;
    if (!box.dataset.kenji) {
      box.dataset.kenji = "1";
      var g = box.querySelector(".mas-girl");
      g.innerHTML = kenjiSVG();
      g.onclick = function () { if (last) talk(last, "happy"); };
    }
    if (MAS.last !== before) { last = text; talk(text, mood); }
  };

  var st = document.createElement("style");
  st.id = "zzzzyKenji";
  st.textContent = `
.mas .kz-mo{transform-origin:60px 74px;transition:transform .15s}
.mas.kz-talk .kz-mo{animation:kzTalk .3s ease-in-out infinite alternate}
@keyframes kzTalk{from{transform:scaleY(1)}to{transform:scaleY(2.6)}}
`;
  document.head.appendChild(st);
})();
