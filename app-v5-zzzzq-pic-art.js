/* =====================================================================
   v5 · Picture questions show the 3D picture of the word.
   When a question only has a generic symbol (✨, 🌟, ❓, 📷…) or no 3D
   image, the picture is taken from the word list (dog, farmer, school…),
   so the glowing 3D image matches the answer.
   ===================================================================== */
(function () {
  var GENERIC = new Set(["✨", "🌟", "⭐", "❓", "❔", "📷", "🎨", "💼", "🎯", "🧩", "💡", "🔹", "🎲", "📝", "🎓"]);
  var index = null;

  function buildIndex() {
    var lists = [];
    try { Object.keys(PIC_NOUNS).forEach(function (k) { lists.push(PIC_NOUNS[k]); }); } catch (e) {}
    ["PIC_ACTIONS", "PIC_JOBS", "PIC_FEEL", "PIC_WEATHER", "PIC_PLACES", "PIC_COLORS"].forEach(function (n) {
      try { lists.push(eval(n)); } catch (e) {}
    });
    var out = [];
    lists.forEach(function (str) {
      if (typeof str !== "string") return;
      str.split(";").forEach(function (row) {
        var f = row.split("|");
        if (f.length < 2 || !f[0].trim()) return;
        var names = f[1].toLowerCase().split("/").map(function (s) { return s.trim(); }).filter(Boolean);
        names.forEach(function (name) { out.push({ emo: f[0].trim(), name: name }); });
      });
    });
    // longest names first, so "police officer" wins over "officer"
    out.sort(function (a, b) { return b.name.length - a.name.length; });
    return out;
  }

  function lookup(text) {
    if (!index) index = buildIndex();
    var w = " " + String(text || "").toLowerCase().replace(/[^a-z\s]/g, " ") + " ";
    for (var i = 0; i < index.length; i++) {
      var n = index[i].name;
      if (w.indexOf(" " + n + " ") !== -1 || w.indexOf(" " + n + "s ") !== -1) return index[i].emo;
    }
    return null;
  }

  function has3D(emo) {
    try { return EMO_SET.has(emoCode(emo)); } catch (e) { return false; }
  }

  var _ps = picStage;
  picStage = function (x, done, ok) {
    if (x && !x.picId && (!x.pic || GENERIC.has(x.pic) || !has3D(x.pic))) {
      var hit = lookup(x.say || x.answer || (x.accept && x.accept[0]) || "");
      if (hit) x = Object.assign({}, x, { pic: hit });
    }
    var html = _ps(x, done, ok);
    // no real picture: show nothing rather than a generic sparkle
    if (/data-i3="sparkle"/.test(html)) return "";
    return html;
  };
})();

/* Emoji without a hand-made icon used to fall back to a generic sparkle.
   Use the real glossy 3D picture of the emoji when one exists. */
(function () {
  var _E = E;
  E = function (str, cls) {
    cls = cls || "";
    return segG(String(str || "")).map(function (g) {
      var base = g.replace(/️/g, "");
      var mapped = ICO3_MAP[g] || ICO3_MAP[base] || ICO3_MAP[base.charAt(0)];
      if (mapped || !/\p{Extended_Pictographic}/u.test(g)) return _E(g, cls);
      var c;
      try { c = emoCode(g); } catch (e) { return _E(g, cls); }
      if (EMO_SET.has(c)) {
        return '<img class="e3d ' + cls + '" src="img/' + c + '.webp" alt="' + esc(g) + '" draggable="false" decoding="async" onerror="this.outerHTML=this.alt">';
      }
      return _E(g, cls);
    }).join("");
  };
})();
