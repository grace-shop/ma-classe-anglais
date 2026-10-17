/* v5 · Grammar and vocabulary bank (www/banque-grammaire.json).
   About 150 multiple-choice questions: 60 grammar (src "grammar2") and
   90 vocabulary (src "vocab2"), across levels 1 to 3. They are added to
   AR_Q so the Arena and Battle Royale can use them. Never throws. */
(function banqueGrammaireLoad(){
  try{
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
    fetch("banque-grammaire.json",{cache:"no-store"}).then(r=>r.json()).then(list=>{
      if(!Array.isArray(list))return;
      window.__grammaire=(window.__grammaire||0)+add(list);
    }).catch(()=>{});
  }catch(e){}
})();
