/* =====================================================================
   v5 · Retour : le bouton « retour » ramène à la page précédente (et non
   à l'accueil). Un historique garde les pages visitées. Sur Android, le
   bouton retour du téléphone fait la même chose.
   ===================================================================== */
{
  const HIST=[];let last=null,restoring=false;
  const snap=()=>({tab:S.tab,view:S.view?JSON.parse(JSON.stringify(S.view)):null,mode:S.mode});
  const keyOf=s=>JSON.stringify([s.tab,s.view,s.mode]);
  const _r=render;
  render=function(){
    const o=_r.apply(this,arguments);
    try{
      if(!restoring){
        const cur=snap(),k=keyOf(cur);
        if(last&&k!==last.k){HIST.push(last.s);if(HIST.length>40)HIST.shift()}
        last={k:k,s:cur};
      }
    }catch(e){}
    return o;
  };
  // rétablit la page précédente ; renvoie false s'il n'y en a pas
  // emoji / sticker panel open: back only closes it, and the conversation stays
  function closePanel(){
    if(typeof V4!=="undefined"&&V4.panel){V4.panel=null;render();return true}
    return false;
  }
  document.addEventListener("click",e=>{
    if(typeof V4!=="undefined"&&V4.panel&&e.target&&e.target.closest&&e.target.closest("#chatScroll"))closePanel();
  });
  function back(){
    if(closePanel())return true;
    if(!HIST.length)return false;
    const s=HIST.pop();
    restoring=true;
    try{S.tab=s.tab;S.view=s.view;S.mode=s.mode;S.run=null;S.deck=null;S.confirm=null;S.animate=true;
      if(typeof closeChat==="function"&&!(S.view&&S.view.type==="chat"))closeChat();
      render();window.scrollTo(0,0)}
    finally{restoring=false}
    last={k:keyOf(s),s:s};
    return true;
  }
  // le bouton « retour » de l'application (même avec un cadre d'Arena ouvert, l'Arena gère le sien)
  document.addEventListener("click",e=>{
    const b=e.target&&e.target.closest&&e.target.closest('[data-a="back"]');
    if(!b)return;
    if(back()){e.stopImmediatePropagation();e.preventDefault()}
  },true);
  // le bouton retour du téléphone (Android)
  try{
    const App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
    if(App&&App.addListener)App.addListener("backButton",()=>{
      if(window.ed5CancelCut&&window.ed5CancelCut())return;
      if(closePanel())return;
      /* Nova is open: back closes Nova, and nothing else */
      if(typeof AI!=="undefined"&&AI.open){AI.open=false;try{AI.ctl&&AI.ctl.abort()}catch(e){}renderAI();return}
      const dv=document.getElementById("docv"),vp=document.getElementById("vplayer"),za=document.getElementById("zzal");
      if(za){za.remove();return}
      if(dv){if(typeof closeDoc==="function")closeDoc();else dv.remove();return}
      if(vp){vp.remove();return}
      if(typeof F!=="undefined"&&F.sv){fCloseStory();return}
      const r=document.getElementById("arena");
      if(r&&!r.hidden){if(AR.mode||BT.on)arHome();else arClose();return}
      if(!back()&&S.view){S.view=null;S.animate=true;render()}
    });
  }catch(e){}
}
