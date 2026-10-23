/* =====================================================================
   v5 · Sakura réagit aussi aux réponses à remplir et aux choix
   (les exercices « Write the answer » et les questions à choix).
   Une seule réaction par question, pour ne pas la répéter à chaque rendu.
   ===================================================================== */
{let lastKey="";
  function masCheck(){
    // not in the chats: a classmate writing « Correct! » does not make her cheer
    if(document.querySelector(".glass.chat,.pt-body,.msg"))return;
    const bad=document.querySelector(".answer-input.wrong,.choice.wrong");
    const good=!bad&&document.querySelector(".answer-input.right,.choice.right");
    if(!bad&&!good){lastKey="";return}
    const q=document.querySelector(".qtext");
    const key=(q?q.textContent:"")+"|"+(bad?"bad":"good");
    if(key===lastKey) return;
    lastKey=key;
    if(bad) masShow(MAS_BAD[Math.floor(Math.random()*MAS_BAD.length)],"bad");
    else masShow(masPick(),"happy");
  }
  let raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;try{masCheck()}catch(e){}})};
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
}
