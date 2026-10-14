/* =====================================================================
   v5 · Une seule vidéo à la fois dans toute l'application.
   Dès qu'une vidéo ou un son démarre (publication, vidéo intégrée), les
   autres s'arrêtent. Dès qu'une vidéo YouTube (lecteur intégré) démarre,
   les vidéos de l'application s'arrêtent, et les autres YouTube aussi.
   Dans l'autre sens, une vidéo de l'application met en pause le YouTube.
   ===================================================================== */
{
  const YT_SRC=/youtube|youtu\.be|vimeo/i;
  // met en pause tout ce qui joue, sauf « except » (un média) et « keepWin » (la fenêtre d'un lecteur qui vient de démarrer)
  const pauseAll=(except,keepWin)=>{
    document.querySelectorAll("video,audio").forEach(m=>{
      if(m!==except&&!m.paused) try{m.pause()}catch(e){}
    });
    document.querySelectorAll("iframe").forEach(f=>{
      if(!YT_SRC.test(f.getAttribute("src")||"")) return;
      const w=f.contentWindow; if(!w||w===keepWin) return;
      try{w.postMessage(JSON.stringify({event:"command",func:"pauseVideo",args:""}),"*")}catch(e){}
    });
  };
  // « play » ne remonte pas dans le document : on écoute en phase de capture
  document.addEventListener("play",e=>{
    const t=e.target;
    if(t&&(t.tagName==="VIDEO"||t.tagName==="AUDIO")) pauseAll(t,null);
  },true);
  // messages venant d'un lecteur YouTube : il vient de démarrer (état 1 = lecture)
  window.addEventListener("message",e=>{
    let d=e.data;
    if(typeof d==="string"){try{d=JSON.parse(d)}catch(err){return}}
    if(!d||typeof d!=="object") return;
    const playing=(d.event==="infoDelivery"&&d.info&&d.info.playerState===1)||(d.event==="onStateChange"&&d.info===1);
    if(playing) pauseAll(null,e.source);
  });
}
