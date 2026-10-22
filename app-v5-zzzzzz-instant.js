/* =====================================================================
   v5 · Send at once, translate after.
   - Teacher messages (My teacher): the text is sent as written, right
     away. The English version is added to the same message a moment later.
   - Classmates: a voice message or a photo appears at once while it is
     uploading, then it is sent. No waiting before the bubble shows.
   ===================================================================== */
(function () {
  var TRANSLATE_MS = 15000;

  // ---- 1 · My teacher: send first, translate after ----
  var prevText = v4TextSend;
  v4TextSend = async function (kind, f) {
    if (kind !== "chat") return prevText.apply(this, arguments);
    var id = V4IN(kind), inp = document.getElementById(id), orig = ((inp && inp.value) || "").trim();
    if (!orig) return;
    var tgt = f.dataset.s, hadFocus = document.activeElement === inp;
    if (inp) inp.value = "";
    delete S.drafts[id];
    var reply = v4TakeReply(kind);
    var from = S.mode === "teacher" ? "teacher" : "student", at = Date.now();
    render();
    var ref;
    try {
      ref = await write(function () {
        return S.db.collection("students/" + tgt + "/msgs").add({ from: from, text: orig, at: at, ...(reply && reply.re ? { re: reply.re } : {}) });
      });
      await write(function () {
        return S.db.doc("students/" + tgt).update(from === "teacher"
          ? { lastMsgAt: at, lastMsgFrom: "teacher", lastMsgText: orig.slice(0, 80), teacherReadAt: at }
          : { lastMsgAt: at, lastMsgFrom: "student", lastMsgText: orig.slice(0, 80), studentReadAt: at, lastActive: at, activity: "Wrote to the teacher" });
      });
      if (from === "student" && typeof presence === "function") presence("Writing a message");
    } catch (e) {
      S.drafts[id] = orig;
      toast((e && e.message) || "Could not send", "x");
      render();
      return;
    }
    render();
    if (hadFocus) { var n = document.getElementById(id); if (n) n.focus({ preventScroll: true }); }
    // the English version is added to the same message, a moment later
    if (from === "student" && ref && v4NeedFix(orig)) {
      (async function () {
        try {
          var r = await Promise.race([
            v4Check(orig),
            new Promise(function (res) { setTimeout(function () { res(null); }, TRANSLATE_MS); })
          ]);
          if (!r) return;
          var packed = v4Pack(orig, r.en, r.k);
          await write(function () { return S.db.doc("students/" + tgt + "/msgs/" + ref.id).update({ text: packed }); });
        } catch (e) {}
      })();
    }
  };

  // ---- 2 · classmates: the voice message or photo shows at once ----
  var prevFile = v4SendFile;
  v4SendFile = async function (kind, target, file, name, k, dur, opt) {
    if (kind !== "peer" || !file || !target) return prevFile.apply(this, arguments);
    opt = opt || {};
    var kk = k || (/^image\//.test(file.type) ? "img" : "file");
    var key = "tmp:" + Date.now() + Math.random().toString(36).slice(2, 6);
    V4.obj[key] = URL.createObjectURL(file);
    var tmpId = "tmpf" + Date.now() + Math.random().toString(36).slice(2, 5);
    var att = { k: kk, p: key, t: file.type || "application/octet-stream", n: name || file.name || "file", s: file.size, ...(dur ? { d: dur } : {}) };
    PR.inbox.unshift({ id: tmpId, sender: S.uid, receiver: target, body: opt.caption ? String(opt.caption) : "", att: att, meta: null, created_at: new Date().toISOString(), read_at: null, pending: true });
    render();
    try {
      return await prevFile.apply(this, arguments);
    } finally {
      PR.inbox = PR.inbox.filter(function (x) { return x.id !== tmpId; });
      render();
    }
  };
})();
