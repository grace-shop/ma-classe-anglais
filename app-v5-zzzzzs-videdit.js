/* v5 · Vidéo : rognage, texte, dessin et autocollants.
   L'éditeur de photo travaille sur une image extraite de la vidéo ; à l'envoi,
   la vidéo est réencodée image par image avec les mêmes modifications. */
function zzVidPoster(file){
  return new Promise(function (resolve, reject) {
    var v = document.createElement("video");
    var url = URL.createObjectURL(file);
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.onerror = function () { reject(new Error("Vidéo illisible.")); };
    v.onloadedmetadata = function () { v.currentTime = Math.min(0.1, (v.duration || 0) / 2); };
    v.onseeked = function () {
      var cv = document.createElement("canvas");
      cv.width = v.videoWidth; cv.height = v.videoHeight;
      cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
      cv.toBlob(function (b) { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error("Image non créée.")); }, "image/jpeg", 0.92);
    };
    v.src = url;
  });
}
// the editor opens on a frame of the video; its result is kept as the video's edit
function zzVidEdit(tool){
  var P = V4.pre;
  if (!P || !P.video) return;
  zzVidPoster(P.file).then(function (blob) {
    var url = URL.createObjectURL(blob);
    window.__zzPhotoEdit.open(url, function (still) {
      var cur = V4.pre;
      if (!cur) return;
      window.__zzLastEdit && (cur.edit = JSON.parse(JSON.stringify(window.__zzLastEdit)));
      if (cur.editUrl) { try { URL.revokeObjectURL(cur.editUrl); } catch (x) {} }
      cur.editUrl = URL.createObjectURL(still);
      render();
    }, tool);
  }).catch(function (e) { toast((e && e.message) || "Vidéo illisible.", "x"); });
}
// renders the video with the edit: crop, then the same objects on every frame
function zzVidRender(file, edit){
  return new Promise(function (resolve, reject) {
    var v = document.createElement("video");
    var url = URL.createObjectURL(file);
    v.playsInline = true; v.preload = "auto"; v.volume = 0;
    v.onerror = function () { reject(new Error("Vidéo illisible.")); };
    v.onloadedmetadata = function () {
      var c = edit.crop;
      var sx = v.videoWidth / edit.W, sy = v.videoHeight / edit.H;
      var k = Math.min(1, 720 / (c.w * sx));
      var outW = Math.max(2, Math.round(c.w * sx * k / 2) * 2);
      var outH = Math.max(2, Math.round(c.h * sy * k / 2) * 2);
      var kx = outW / c.w, ky = outH / c.h;
      var out = document.createElement("canvas"); out.width = outW; out.height = outH;
      var octx = out.getContext("2d");
      var full = document.createElement("canvas"); full.width = edit.W; full.height = edit.H;
      var mime = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(function (t) {
        try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; }
      }) || "";
      var tracks = out.captureStream(30).getVideoTracks().slice();
      try {
        var ast = v.captureStream ? v.captureStream() : v.mozCaptureStream();
        ast.getAudioTracks().forEach(function (t) { tracks.push(t); });
      } catch (e) {}
      var rec;
      try { rec = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime } : undefined); }
      catch (e) { URL.revokeObjectURL(url); reject(new Error("Modification de vidéo impossible sur cet appareil.")); return; }
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        URL.revokeObjectURL(url);
        resolve(new Blob(chunks, { type: (mime || "video/webm").split(";")[0] }));
      };
      function draw() {
        window.__zzPaintTo(full, v, edit.W, edit.H, edit.objs);
        octx.clearRect(0, 0, outW, outH);
        octx.drawImage(full, -c.x * kx, -c.y * ky, edit.W * kx, edit.H * ky);
      }
      function loop() { draw(); if (!v.ended && !v.paused) requestAnimationFrame(loop); }
      v.onended = function () { draw(); setTimeout(function () { try { rec.stop(); } catch (e) {} }, 150); };
      v.play().then(function () { rec.start(250); loop(); })
        .catch(function () { URL.revokeObjectURL(url); reject(new Error("Vidéo illisible.")); });
    };
    v.src = url;
  });
}
async function zzSendEditedVideo(P, cap){
  toast("Préparation de la vidéo…", "check");
  try {
    var blob = await zzVidRender(P.file, P.edit);
    var type = (blob.type || "video/webm");
    var ext = /mp4/.test(type) ? "mp4" : "webm";
    var f = new File([blob], "video-modifiee." + ext, { type: type });
    await v4SendFile(P.kind, P.target, f, f.name, undefined, null, { caption: cap });
  } catch (e) { toast((e && e.message) || "Vidéo non envoyée.", "x"); }
}
