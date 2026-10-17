/* v5 · Battle Royale challenges for the grammar and vocabulary bank.
   The lead merges this list into ROYALE_CH. Kinds: "grammar2", "vocab2". */
window.ROYALE_NEW=[
 {t:"Grammar: easy",   d:"Tenses, articles and prepositions", lv:"easy",   kind:"grammar2", n:12},
 {t:"Vocabulary: easy",d:"Everyday words",                    lv:"easy",   kind:"vocab2",   n:12},
 {t:"Grammar: medium", d:"Modals, conditionals and passive",  lv:"medium", kind:"grammar2", n:15},
 {t:"Vocabulary: medium",d:"Health, work and travel",         lv:"medium", kind:"vocab2",   n:15},
 {t:"Grammar: hard",   d:"Reported speech and relative clauses", lv:"hard", kind:"grammar2", n:15},
 {t:"Vocabulary: hard",d:"Money, media and technology",       lv:"hard",   kind:"vocab2",   n:15}
];

/* merge the new challenges into the Battle Royale list, and let them draw their own questions */
ROYALE_CH.push(...(window.ROYALE_NEW||[]));
{const _rp=royalePool;
 royalePool=function(kind,lv){
   if(kind==="grammar2"||kind==="vocab2"){
     const same=AR_Q.filter(x=>x.src===kind&&(x.lv||1)===lv);
     return same.length>=8?same:AR_Q.filter(x=>x.src===kind);
   }
   return _rp(kind,lv);
 };}
