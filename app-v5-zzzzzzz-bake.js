/* =====================================================================
   v5 · Vidéo modifiée : les textes, dessins, autocollants et le rognage
   sont gravés dans le fichier envoyé (ainsi les autres les voient, et le
   téléchargement les garde). La vidéo est rejouée une fois, en temps réel,
   et enregistrée avec ses modifications (comme la découpe).
   ===================================================================== */
function zzBake(file,edit,onp){
  return new Promise(function(resolve,reject){
    if(!window.MediaRecorder||!window.__zzPaintTo)return reject(new Error("nobake"));
    var v=document.createElement("video");v.playsInline=true;v.preload="auto";v.volume=0;v.src=URL.createObjectURL(file);
    var c=edit.crop,full=document.createElement("canvas");full.width=edit.W;full.height=edit.H;
    var out=document.createElement("canvas"),octx=out.getContext("2d");
    var kx=1,ky=1,rec=null,parts=[],raf=0,finished=false,t0=0,limit=0;
    function fit(){var sx=v.videoWidth/edit.W,sy=v.videoHeight/edit.H;var k=Math.min(1,720/(c.w*sx));
      out.width=Math.max(2,Math.round(c.w*sx*k));out.height=Math.max(2,Math.round(c.h*sy*k));kx=out.width/c.w;ky=out.height/c.h}
    function draw(){window.__zzPaintTo(full,v,edit.W,edit.H,edit.objs);octx.clearRect(0,0,out.width,out.height);octx.drawImage(full,-c.x*kx,-c.y*ky,edit.W*kx,edit.H*ky)}
    function frame(){if(finished)return;draw();if(onp&&v.duration)onp(Math.min(1,v.currentTime/v.duration));if(!v.ended)raf=requestAnimationFrame(frame)}
    function stop(){if(finished)return;finished=true;cancelAnimationFrame(raf);try{v.pause()}catch(e){}
      if(rec&&rec.state!=="inactive")rec.stop();else finish()}
    function finish(){
      var type=(rec&&(rec.mimeType||"")||"video/webm").split(";")[0];
      try{URL.revokeObjectURL(v.src)}catch(e){}
      if(!parts.length)return reject(new Error("empty"));
      resolve(new File(parts,"edit-"+Date.now()+(/mp4/.test(type)?".mp4":".webm"),{type:type}));
    }
    v.onerror=function(){finished=true;reject(new Error("video"))};
    v.onloadedmetadata=function(){
      fit();
      var stream=out.captureStream(30);
      var cap=v.captureStream||v.mozCaptureStream;
      if(cap){try{cap.call(v).getAudioTracks().forEach(function(t){stream.addTrack(t)})}catch(e){}}
      var types=["video/webm;codecs=vp8,opus","video/webm","video/mp4"];
      var mime=types.find(function(t){return MediaRecorder.isTypeSupported(t)})||"";
      rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      rec.ondataavailable=function(ev){if(ev.data&&ev.data.size)parts.push(ev.data)};
      rec.onstop=finish;
      limit=(v.duration||60)*1000+4000;
      rec.start(500);
      v.onended=stop;
      v.play().then(function(){t0=Date.now();frame()}).catch(function(){stop()});
      setTimeout(stop,limit);
    };
    v.load();
  });
}
// the edited video is baked before it is sent; if baking is not possible, the video goes with its edit as before
async function zzBakeFile(file,edit,label){
  try{return await zzBake(file,edit,function(p){zzProg((label||"Preparing the video")+" "+Math.round(p*100)+" %")})}
  catch(e){return null}
  finally{zzProgEnd()}
}
async function zzBakeThenSend(P,cap){
  V4.pre=null;render();
  const baked=await zzBakeFile(P.file,P.edit,"Preparing the video");
  if(baked)return v4SendFile(P.kind,P.target,baked,baked.name,undefined,null,{caption:cap});
  return v4SendFile(P.kind,P.target,P.file,P.file.name,undefined,null,{caption:cap,edit:P.edit});
}
async function zzBakeEntries(entries){
  const out=[];
  for(const en of entries){
    if(!en.edit){out.push(en);continue}
    const baked=await zzBakeFile(en.file,en.edit,"Preparing the video");
    out.push(baked?{file:baked,edit:null}:en);
  }
  return out;
}
