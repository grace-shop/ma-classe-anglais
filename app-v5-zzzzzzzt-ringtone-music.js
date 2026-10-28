/* =====================================================================
   Ringtones, prettier, and your own music as the call ringtone.
   - Each tone is a card with its name, a short description and a preview button.
   - "Choose a music file" lets you pick an audio file from the phone (up to 3 MB, first 30 s).
     It is kept on this phone and used as the call ring (in the app, through the same audio path).
     Notification sounds stay the built-in ones: Android only accepts its own sound files there.
   ===================================================================== */
(function () {
  if (typeof RT_CALL === "undefined" || typeof RT_NOTIF === "undefined") return;

  var DB = "mca_media", STORE = "kv", KEY = "custom_call", MAX = 3 * 1024 * 1024, CLIP = 30;

  /* ---- storage of the picked file ---- */
  function open() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbPut(v) {
    return open().then(function (db) { return new Promise(function (res, rej) {
      var t = db.transaction(STORE, "readwrite"); t.objectStore(STORE).put(v, KEY);
      t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); };
    }); });
  }
  function idbGet() {
    return open().then(function (db) { return new Promise(function (res, rej) {
      var q = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { rej(q.error); };
    }); });
  }
  function idbDel() {
    return open().then(function (db) { return new Promise(function (res) {
      var t = db.transaction(STORE, "readwrite"); t.objectStore(STORE).delete(KEY); t.oncomplete = res; t.onerror = res;
    }); });
  }

  /* ---- decoding: an OfflineAudioContext decodes without a user gesture ---- */
  function decode(arr) {
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new OAC(1, 1, 44100);
    return ctx.decodeAudioData(arr);
  }
  var customBuf = null, customName = "";
  function useCustom(buf, name) {
    customBuf = buf; customName = name;
    var len = Math.min(buf.duration, CLIP);
    var tone = { id: "custom", name: "My music", desc: customName, period: len,
      play: function (c, t) {
        try {
          var src = c.createBufferSource(), g = c.createGain();
          src.buffer = buf; g.gain.value = 0.9;
          src.connect(g).connect(c.destination);
          src.start(t, 0, len); src.stop(t + len + 0.05);
        } catch (e) {}
      } };
    var i = RT_CALL.findIndex(function (x) { return x.id === "custom"; });
    if (i >= 0) RT_CALL[i] = tone; else RT_CALL.push(tone);
  }
  function removeCustom() {
    var i = RT_CALL.findIndex(function (x) { return x.id === "custom"; });
    if (i >= 0) RT_CALL.splice(i, 1);
    customBuf = null; customName = "";
  }
  // load the saved file at start-up
  idbGet().then(function (v) { if (v && v.arr) return decode(v.arr.slice(0)).then(function (b) { useCustom(b, v.name || "My music"); }); }).catch(function () {});

  /* ---- the file picker ---- */
  document.addEventListener("click", function (e) {
    var up = e.target.closest && e.target.closest("[data-rt-upload]");
    var rm = e.target.closest && e.target.closest("[data-rt-remove]");
    if (rm) {
      e.preventDefault(); e.stopPropagation();
      idbDel().then(function () { removeCustom(); if (rtGet("call") === "custom") rtSet("call", RT_DEF.call); render(); });
      return;
    }
    if (!up) return;
    e.preventDefault(); e.stopPropagation();
    var input = document.createElement("input");
    input.type = "file"; input.accept = "audio/*";
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      if (f.size > MAX) { try { toast("This file is too big (3 MB at most)."); } catch (x) {} return; }
      f.arrayBuffer().then(function (arr) {
        return decode(arr.slice(0)).then(function (buf) {
          return idbPut({ name: f.name.replace(/\.[^.]+$/, ""), arr: arr }).then(function () {
            useCustom(buf, f.name.replace(/\.[^.]+$/, ""));
            rtSet("call", "custom");
            try { toast("Ringtone saved."); } catch (x) {}
            render();
          });
        });
      }).catch(function () { try { toast("This file cannot be read as a ringtone."); } catch (x) {} });
    };
    input.click();
  }, true);

  /* ---- the prettier picker (same data attributes, so the existing preview and choice still work) ---- */
  var ICON = { call: "📞", notif: "🔔" };
  function row(kind, t, cur) {
    var on = t.id === cur, isDef = t.id === RT_DEF[kind];
    return '<div class="rt-card' + (on ? " on" : "") + '">' +
      '<button type="button" class="rt-pick" data-rt-pick="' + kind + '" data-id="' + t.id + '" aria-pressed="' + on + '">' +
        '<span class="rt-dot">' + (on ? "✓" : "") + "</span>" +
        '<span class="rt-txt"><b>' + esc(t.name) + "</b>" +
        '<small>' + (t.desc ? esc(t.desc) : (isDef ? "Default" : "")) + "</small></span></button>" +
      '<button type="button" class="rt-play" data-rt-play="' + kind + '" data-id="' + t.id + '" aria-label="Preview ' + esc(t.name) + '">▶ Preview</button>' +
      "</div>";
  }
  function group(kind, title) {
    var cur = rtGet(kind);
    var rows = RT_LIST[kind].map(function (t) { return row(kind, t, cur); }).join("");
    var extra = "";
    if (kind === "call") {
      extra = customBuf
        ? '<div class="rt-own"><button type="button" class="rt-btn ghost" data-rt-upload="1">Change my music</button>' +
          '<button type="button" class="rt-btn ghost" data-rt-remove="1">Remove</button></div>'
        : '<button type="button" class="rt-btn" data-rt-upload="1">＋ Choose a music file as my ringtone</button>';
    }
    return '<div class="rt-group"><div class="rt-title"><span>' + ICON[kind] + "</span><b>" + title + "</b></div>" + rows + extra + "</div>";
  }
  rtPickersHTML = function () {
    return '<div class="rt-wrap">' + group("call", "Call ringtone") + group("notif", "Notification sound") + "</div>";
  };

  var CSS = [
    ".rt-wrap{display:grid;gap:18px;margin-top:8px}",
    ".rt-group{display:grid;gap:8px;padding:12px;border-radius:18px;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(160,140,255,.25);box-shadow:0 0 18px rgba(140,110,255,.12)}",
    ".rt-title{display:flex;align-items:center;gap:8px;margin:2px 4px 4px;font-size:1.02rem}",
    ".rt-card{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.08);transition:box-shadow .2s,border-color .2s}",
    ".rt-card.on{border-color:rgba(190,150,255,.7);box-shadow:0 0 0 1px rgba(190,150,255,.35),0 0 18px rgba(170,120,255,.35)}",
    ".rt-pick{flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;color:inherit;text-align:left;padding:4px;cursor:pointer;font:inherit}",
    ".rt-dot{width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:.8rem;border:1.5px solid rgba(190,150,255,.6);color:#e9d8ff}",
    ".rt-card.on .rt-dot{background:linear-gradient(135deg,#c084fc,#5eead4);color:#120a22;border-color:transparent;box-shadow:0 0 12px rgba(192,132,252,.7)}",
    ".rt-txt{display:grid;min-width:0}.rt-txt b{font-weight:700}.rt-txt small{opacity:.7}",
    ".rt-play{flex:none;padding:7px 12px;border-radius:999px;border:1px solid rgba(190,150,255,.55);background:rgba(120,80,220,.18);color:#f2e9ff;font:inherit;font-size:.85rem;cursor:pointer;box-shadow:0 0 12px rgba(160,110,255,.25)}",
    ".rt-own{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}",
    ".rt-btn{padding:10px 14px;border-radius:14px;border:1px solid rgba(94,234,212,.6);background:linear-gradient(135deg,rgba(94,234,212,.22),rgba(192,132,252,.22));color:#fff;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 0 16px rgba(94,234,212,.25)}",
    ".rt-btn.ghost{background:transparent;box-shadow:none;border-color:rgba(255,255,255,.2);font-weight:600}"
  ].join("");
  var st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
})();
