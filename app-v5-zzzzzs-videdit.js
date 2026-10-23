/* v5 · Vidéo : rognage, texte, dessin et autocollants.
   L'éditeur de photo travaille sur une image extraite de la vidéo. La vidéo
   d'origine part telle quelle ; les modifications voyagent avec le message et
   sont dessinées par-dessus pendant la lecture (rien n'est réencodé). */
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
function zzVidEditParse(s){try{var o=JSON.parse(s);return o&&o.crop?o:null}catch(x){return null}}
// plays the original video; the crop and the objects are drawn over it, frame by frame
function zzVidPlayEdited(p,t,edit){
  var ov=document.getElementById("vplayer");if(ov)ov.remove();
  ov=document.createElement("div");ov.id="vplayer";ov.className="v4onceview";
  ov.innerHTML='<div class="v4spin"></div><button type="button" class="iconbtn" aria-label="Close">'+ic("x")+'</button>';
  document.body.appendChild(ov);
  var v=null,raf=0;
  var close=function(){cancelAnimationFrame(raf);if(v){v.pause();v.removeAttribute("src");v.load()}ov.remove()};
  ov.querySelector("button").onclick=close;
  srcURL({k:"m",id:p,t:t}).then(function(u){
    v=document.createElement("video");v.playsInline=true;v.preload="auto";v.src=u;v.style.display="none";
    var cv=document.createElement("canvas");
    cv.style.cssText="max-width:100vw;max-height:86vh;width:100%;background:#000;object-fit:contain";
    var c=edit.crop,full=document.createElement("canvas");full.width=edit.W;full.height=edit.H;
    var octx=cv.getContext("2d"),kx=1,ky=1,outW=2,outH=2;
    function fit(){var sx=v.videoWidth/edit.W,sy=v.videoHeight/edit.H;var k=Math.min(1,720/(c.w*sx));
      outW=Math.max(2,Math.round(c.w*sx*k));outH=Math.max(2,Math.round(c.h*sy*k));cv.width=outW;cv.height=outH;kx=outW/c.w;ky=outH/c.h}
    function draw(){window.__zzPaintTo(full,v,edit.W,edit.H,edit.objs);octx.clearRect(0,0,outW,outH);octx.drawImage(full,-c.x*kx,-c.y*ky,edit.W*kx,edit.H*ky)}
    function loop(){draw();if(!v.paused&&!v.ended)raf=requestAnimationFrame(loop)}
    v.onloadedmetadata=function(){fit();draw()};
    v.onseeked=function(){draw()};
    v.onplay=function(){cancelAnimationFrame(raf);loop()};
    v.onpause=function(){cancelAnimationFrame(raf);draw()};
    v.onended=function(){cancelAnimationFrame(raf);draw()};
    cv.onclick=function(){if(v.paused||v.ended){if(v.ended)v.currentTime=0;v.play().catch(function(){})}else v.pause()};
    ov.querySelector(".v4spin").replaceWith(cv);
    ov.appendChild(v);
    v.play().catch(function(){});
  }).catch(function(){
    ov.querySelector(".v4spin").replaceWith(Object.assign(document.createElement("p"),{textContent:navigator.onLine?"Cannot play this video.":"No network: the video needs internet."}));
  });
}
