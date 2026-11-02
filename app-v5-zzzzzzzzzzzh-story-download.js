/* Stories: download the current photo/video, and a reply that never depends on the viewer index. */
(function () {
  var _html = fStoryHTML;
  fStoryHTML = function () {
    var h = _html();
    var c = typeof fCur === "function" ? fCur() : null;
    if (!h || !c || !c.s || !c.s.media) return h;
    var btn = '<button type="button" class="iconbtn" data-zzdl="1" onclick="zzDownloadStory(event)" aria-label="Download" title="Download">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>';
    return h.replace('<button type="button" class="iconbtn" data-v4="fSvClose"', btn + '<button type="button" class="iconbtn" data-v4="fSvClose"');
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
