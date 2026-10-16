/* =====================================================================
   v5 · Démarrage : si l'écran reste bloqué sur « Connecting to the class… »
   (réseau lent, données qui ne arrivent pas), on affiche un message clair
   avec un bouton pour réessayer, au lieu d'une attente sans fin.
   Arena : rien ne flotte ni ne se redessine sous le doigt, la liste défile
   calmement et Battle Royale ne déborde plus sur le côté.
   ===================================================================== */
{
  setTimeout(()=>{
    try{
      const m=document.getElementById("main");
      if(!m||!/Connecting to the class/.test(m.textContent||""))return;
      m.innerHTML=`<div class="empty" style="display:grid;gap:12px;justify-items:center;padding:28px 16px;text-align:center">
        <p style="margin:0">We could not load your class. Check your internet connection, then try again.</p>
        <button class="btn" type="button" data-a="retryBoot">Try again</button></div>`;
    }catch(e){}
  },12000);
  document.addEventListener("click",e=>{
    const b=e.target&&e.target.closest&&e.target.closest('[data-a="retryBoot"]');
    if(b){e.preventDefault();location.reload()}
  },true);
  const st=document.createElement("style");st.id="zzzvsteady";st.textContent=`
#arena .ar-mode,#arena .ar-card,#arena .ar-row,#arena .ar-fab,#arena .ar-trophy,#arena .ar-confetti i{animation:none!important}
#arena{overflow-x:hidden}
#arena .ar-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#arena .ar-mode,#arena .ar-card{min-width:0}`;
  document.head.appendChild(st);
}
