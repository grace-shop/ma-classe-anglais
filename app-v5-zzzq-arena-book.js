/* =====================================================================
   v5 · L'Arène suit le programme. Les questions des Leçons et de la
   Pratique (Seconde, Première, Terminale) sont lues dans www/content.json,
   le même modèle que l'application. Quand le modèle change (scripts/
   build-programmes.mjs), l'Arène s'y met à jour à l'ouverture suivante.
   Seconde = niveau facile, Première = moyen, Terminale = difficile.
   ===================================================================== */
{
  const LV={"2nde":1,"1re":2,"Tle":3};
  let done=false,busy=null;
  async function arBookLoad(){
    if(done)return 0;
    if(busy)return busy;
    busy=(async()=>{
      try{
        const j=await(await fetch("content.json",{cache:"no-store"})).json();
        const seen=new Set(AR_Q.map(x=>x.q));let n=0;
        for(const [id,q] of Object.entries(j.quizzes||{})){
          if(!q.prog||!/^bk/.test(id))continue;
          const lv=LV[q.classe]||2;
          for(const x of q.questions||[]){
            if(x.type==="type"||!Array.isArray(x.choices)||x.choices.length<2)continue;
            if(seen.has(x.q))continue;seen.add(x.q);
            AR_Q.push({lv:lv,q:x.q,o:x.choices.slice(),a:x.answer,e:`The correct answer is "${x.choices[x.answer]}" (${q.title||"programme"}).`});n++;
          }
        }
        done=true;return n;
      }catch(e){busy=null;return 0}
    })();
    return busy;
  }
  window.arBookLoad=arBookLoad;
  {const _o=arOpen;arOpen=function(){const r=_o.apply(this,arguments);arBookLoad();return r}}
}
