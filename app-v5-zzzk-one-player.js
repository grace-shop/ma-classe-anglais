/* =====================================================================
   v5 · Une seule vidéo à la fois dans toute l'application.
   Dès qu'une vidéo ou un son démarre (publication, vidéo intégrée, lecteur
   d'un lien), les autres s'arrêtent. Les lecteurs YouTube, Vimeo ou TikTok
   intégrés (iframe) sont mis en pause aussi, quand ils acceptent la commande.
   ===================================================================== */
{
  const pauseOthers=(except)=>{
    document.querySelectorAll("video,audio").forEach(m=>{
      if(m!==except&&!m.paused) try{m.pause()}catch(e){}
    });
    document.querySelectorAll("iframe").forEach(f=>{
      const src=f.getAttribute("src")||"";
      if(!/youtube|youtu\.be|vimeo|tiktok/i.test(src)) return;
      try{f.contentWindow.postMessage(JSON.stringify({event:"command",func:"pauseVideo",args:""}),"*")}catch(e){}
      try{f.contentWindow.postMessage(JSON.stringify({method:"pause"}),"*")}catch(e){}
    });
  };
  // "play" ne remonte pas dans le document : on écoute en phase de capture
  document.addEventListener("play",e=>{
    const t=e.target;
    if(t&&(t.tagName==="VIDEO"||t.tagName==="AUDIO")) pauseOthers(t);
  },true);
  // si une autre vidéo de l'application était ouverte par le lecteur interne, on l'arrête aussi
  window.addEventListener("message",e=>{
    let d=e.data;
    if(typeof d==="string"){try{d=JSON.parse(d)}catch(err){return}}
    if(d&&d.event==="infoDelivery"&&d.info&&d.info.playerState===1) pauseOthers(null);
  });
}
