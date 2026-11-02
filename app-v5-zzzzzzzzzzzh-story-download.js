/* Stories: download the current photo/video, and a reply that never depends on the viewer index. */
(function () {
  var _html = fStoryHTML;
  fStoryHTML = function () {
    var h = _html();
    var c = typeof fCur === "function" ? fCur() : null;
    if (!h || !c || !c.s || !c.s.media) return h;
    var btn = '<button type="button" class="iconbtn" data-zzdl="1" onclick="zzDownloadStory(event)" aria-label="Download" title="Download">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>';
    var out = h.replace('<button type="button" class="iconbtn" data-v4="fSvClose"', btn + '<button type="button" class="iconbtn" data-v4="fSvClose"');
    // Diagnostic line: where does the media loading stop?
    var m = c.s.media, isV = typeof fIsVid === "function" && fIsVid(c.s);
    var info = "DIAG p=" + String(m.p || "").slice(-14) + " t=" + (m.t || "none") + " vid=" + isV +
      " obj=" + (m.p && V4.obj[m.p] ? "yes" : "no") +
      " svUrl=" + (F.svUrl && F.svUrl.id === c.s.id ? "yes" : "no") +
      " err=" + (F.svErr && F.svErr.id === c.s.id ? F.svErr.m : "none");
    var dbg = '<div style="position:absolute;top:70px;left:8px;right:8px;z-index:50;background:#000a;color:#ff0;font:12px monospace;padding:4px 6px;border-radius:6px;pointer-events:none">' + info.replace(/</g, "&lt;") + '</div>';
    return out.replace('<div class="fsv"', dbg + '<div class="fsv"');
  };

  function currentMediaUrl() {
    var c = fCur();
    if (!c || !c.s || !c.s.media) return null;
    var s = c.s;
    if (fIsVid(s)) return (F.svUrl && F.svUrl.id === s.id) ? { url: F.svUrl.url, ext: "mp4", kind: "video" } : null;
    var img = s.media.p ? V4.obj[s.media.p] : null;
    return img ? { url: img, ext: /\.png/i.test(img) ? "png" : "jpg", kind: "photo" } : null;
  }

  window.zzDownloadStory = async function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    var m = currentMediaUrl();
    if (!m) { toast("Wait for the status to load, then try again.", "x"); return; }
    try {
      var a = document.createElement("a");
      a.href = m.url;
      a.download = "status-" + Date.now() + "." + m.ext;
      document.body.appendChild(a); a.click(); a.remove();
      toast("Status saved", "send");
    } catch (err) {
      toast("Could not download this status.", "x");
    }
  };
})();
