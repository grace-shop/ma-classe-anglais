/* =====================================================================
   v5 · Big question bank, theme questions and new battle challenges.
   - www/banque-jeux.json (scripts/build-banque.mjs): about 1,200 questions
     made from the vocabulary decks, in English only:
       · "gap": the missing word in an example sentence;
       · "odd": the word that does not belong with three words of a theme.
   - www/questions-themes.json (scripts/build-themes.mjs): 96 questions written
     by hand, 12 per theme (health, environment, technology, work and jobs,
     food and cooking, family and society, travel and tourism, education).
   - All of them are added to the Arena bank, so Quiz Blitz uses them too.
   - Battle Royale: 5 game challenges (Fill the gap, Odd one out) and 8 theme
     challenges, one per theme. Each battle still uses the multiple-choice
     screen, so the battles need no server change to run these.
   ===================================================================== */
(function banqueLoad(){
  const add=(list)=>{
    const seen=new Set(AR_Q.map(x=>x.q+"|"+x.o.join("|")));
    let n=0;
    for(const it of list){
      const key=it.q+"|"+it.o.join("|");
      if(seen.has(key))continue;
      seen.add(key);AR_Q.push(it);n++;
    }
    return n;
  };
  for(const file of ["banque-jeux.json","questions-themes.json"]){
    fetch(file,{cache:"no-store"}).then(r=>r.json()).then(list=>{
      window.__banque=(window.__banque||0)+add(list);
    }).catch(()=>{});
  }
})();

const ROYALE_THEMES=["Health","Environment","Technology","Work and jobs","Food and cooking","Family and society","Travel and tourism","Education and school","Grammar","Vocabulary","Phrasal verbs"];
ROYALE_CH.push(
 {t:"Fill the gap: easy",  d:"Pick the missing word",    lv:"easy",   kind:"gap", n:12},
 {t:"Fill the gap: medium",d:"Pick the missing word",    lv:"medium", kind:"gap", n:15},
 {t:"Fill the gap: hard",  d:"Pick the missing word",    lv:"hard",   kind:"gap", n:15},
 {t:"Odd one out",         d:"Find the word that does not fit", lv:"medium", kind:"odd", n:12},
 {t:"Odd one out: hard",   d:"Find the word that does not fit", lv:"hard",   kind:"odd", n:15}
);
ROYALE_THEMES.forEach(th=>ROYALE_CH.push(
 {t:"Theme: "+th, d:"Questions about "+th.toLowerCase(), lv:"medium", kind:"theme:"+th, n:10}
));

/* the pools of the challenges: each kind reads its own questions */
function royalePool(kind,lv){
  if(kind.indexOf("theme:")===0){
    const name=kind.slice(6);
    const same=AR_Q.filter(x=>x.theme===name&&(x.lv||1)===lv);
    return same.length>=5?same:AR_Q.filter(x=>x.theme===name);
  }
  const all=AR_Q.filter(x=>(x.lv||1)===lv);
  const pick=kind==="gap"?all.filter(x=>x.src==="gap")
    :kind==="odd"?all.filter(x=>x.src==="odd")
    :kind==="grammar"?all.filter(x=>ROYALE_GRAMMAR.test(x.q))
    :kind==="vocab"?all.filter(x=>ROYALE_VOCAB.test(x.q)):all;
  return pick.length>=8?pick:(all.length>=8?all:AR_Q.filter(x=>(x.lv||1)<=lv));
}
