/* =====================================================================
   v5 · View once voice messages: the listener taps once, hears the
   message one time, and it then shows as opened (like view once photos).
   ===================================================================== */
(function () {
  var _mh = v4MsgHTML;
  v4MsgHTML = function (kind, m, c) {
    var h = _mh.apply(this, arguments);
    if (m && m.att && m.att.o && m.att.k === "voice" && !m.del) {
      h = h.replace("<b>Photo</b>", "<b>Voice message</b>").replace("Tap to view once", "Tap to listen once");
    }
    return h;
  };

  var _oo = v4OpenOnce;
  v4OpenOnce = async function (kind, id) {
    var c = V4.ctx[kind];
    var raw = c && c.list().find(function (x) { return x.id === id; });
    if (!raw || !raw.att || raw.att.k !== "voice") return _oo.apply(this, arguments);

    var att = null;
    try {
      if (kind === "peer") {
        att = await window.__peer.openOnce(id);
        raw.opened_at = new Date().toISOString();
        raw.att = { k: "voice", o: true, opened: true, d: raw.att.d };
      } else {
        att = raw.att.p ? Object.assign({}, raw.att) : null;
        raw.att = { k: "voice", o: true, opened: Date.now(), d: raw.att.d };
        write(function () { return S.db.doc(v4DocPath(kind, c, id)).update({ att: raw.att }); }).catch(function () {});
      }
    } catch (er) { toast(er.message || "Cannot open this message.", "x"); return; }
    render();
    if (!att || !att.p) { toast("This message was already listened to.", "eye"); return; }

    var ovl = document.createElement("div");
    ovl.className = "v4onceview";
    ovl.innerHTML = '<div class="v4spin"></div><button type="button" class="iconbtn" aria-label="Close">' + ic("x") + '</button><p>View once · you can listen one time</p>';
    document.body.appendChild(ovl);
    var url = null, audio = null;
    var close = function () { try { if (audio) audio.pause(); } catch (e) {} ovl.remove(); if (url) URL.revokeObjectURL(url); };
    ovl.querySelector("button").onclick = close;
    try {
      var r = await fetch(await srcURL({ k: "m", id: att.p, t: att.t }));
      var b = await r.blob();
      url = URL.createObjectURL(b);
      audio = new Audio(url);
      var play = document.createElement("button");
      play.type = "button"; play.className = "btn";
      play.innerHTML = ic("play") + "Listen";
      play.onclick = function () { audio.play().catch(function () {}); };
      ovl.querySelector(".v4spin").replaceWith(play);
      audio.play().catch(function () {});
    } catch (er) {
      ovl.querySelector(".v4spin").replaceWith(Object.assign(document.createElement("p"), { textContent: "Cannot load the message (network)." }));
    }
  };
})();
