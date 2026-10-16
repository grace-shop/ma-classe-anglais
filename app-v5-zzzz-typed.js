/* =====================================================================
   v5 · Battles: questions where the student types the answer.
   - "Type it": write the missing word (from the gap sentences).
   - "Put it in order": type the sentence whose words are shuffled.
   - The server checks the typed text (supabase/battle-typed.sql, to run
     first). Capitals, punctuation and extra spaces do not matter.
   - Choice questions keep working as before.
   ===================================================================== */
let TYPED_Q=[];
fetch("typed-jeux.json",{cache:"no-store"}).then(r=>r.json()).then(l=>{TYPED_Q=l}).catch(()=>{});

ROYALE_CH.push(
 {t:"Type it: easy",     d:"Write the missing word",      lv:"easy",   kind:"typed", n:10},
 {t:"Type it: medium",   d:"Write the missing word",      lv:"medium", kind:"typed", n:12},
 {t:"Type it: hard",     d:"Write the missing word",      lv:"hard",   kind:"typed", n:12},
 {t:"Put it in order",   d:"Type the sentence, words in order", lv:"medium", kind:"order", n:8},
 {t:"Put it in order: hard", d:"Type the sentence, words in order", lv:"hard", kind:"order", n:8}
);

const _rp=royalePool;
royalePool=function(kind,lv){
  if(kind==="typed"||kind==="order"){
    const want=kind==="typed"?"type":"order";
    const same=TYPED_Q.filter(x=>x.type===want&&x.lv===lv);
    return same.length>=5?same:TYPED_Q.filter(x=>x.type===want);
  }
  return _rp(kind,lv);
};

const _rq=royaleQs;
royaleQs=function(ch,rnd){
  if(ch.kind==="typed"||ch.kind==="order"){
    const p=royalePool(ch.kind,AR_LV[ch.lv]).slice();
    for(let i=p.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
    return p.slice(0,ch.n).map(x=>({q:x.q,e:x.e,type:x.type,accept:x.accept,lv:x.lv,src:x.src}));
  }
  return _rq(ch,rnd);
};

function btTypedCard(q,res,locked,cur,next){
  const fb=res?`<div class="ar-note ${res.ok?"good":"bad"} bt-fb"><b>${res.ok?"Correct!"+(res.pts?" +"+res.pts:""):"Not quite."}</b>${res.ok?"":" Answer: <b>"+arEsc(res.answer||"")+"</b>."} ${arEsc((res&&res.e)||q.e||"")}</div>`:"";
  const nx=res&&next?`<div style="height:12px"></div><button class="ar-go" data-ar="bt-next" style="width:100%">${cur+1>=next?"See the board":"Next →"}</button>`:"";
  const box=`<div class="ar-inrow"><input id="btTypeIn" class="ar-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" ${locked||res?"disabled":""} value="${res?arEsc(res.text||""):""}"><button class="ar-go" data-ar="bt-type" ${locked||res?"disabled":""}>Check</button></div>`;
  return `<div class="ar-card"><p class="ar-kicker">Question ${cur+1}</p><h2>${arEsc(q.q)}</h2></div>${box}${fb}${nx}`;
}

const _qc=btQCard;
btQCard=function(q,res,locked,cur,next){
  if(q.type==="type"||q.type==="order")return btTypedCard(q,res,locked,cur,next);
  return _qc(q,res,locked,cur,next);
};

/* one answer for both kinds: a choice number, or the typed text */
async function btSend(choice,text){const st=BT.st;if(!st||!BT.on)return;
  const solo=st.kind==="challenge",cur=solo?BT.ci:BT.cur;
  if(cur==null||cur<0||cur>=st.qs.length||BT.res[cur]||st.answered.includes(cur))return;
  st.answered=st.answered.concat([cur]);BT.key="";btDraw();
  try{const r=await btRpc("arena_answer_v3",{p_room:st.id,p_idx:cur,p_choice:choice,p_text:text});
    BT.res[cur]={k:choice,text:text||"",ok:!!r.ok,pts:r.pts||0,correct:r.correct,answer:r.answer,e:r.e};BT.err=""}
  catch(e){BT.err=btMsg(e);st.answered=st.answered.filter(x=>x!==cur)}
  BT.key="";btDraw();btSync()}
async function btAnswer(k){const st=BT.st;if(!st)return;const cur=st.kind==="challenge"?BT.ci:BT.cur;
  if(cur!=null&&st.qs[cur]&&(st.qs[cur].type==="type"||st.qs[cur].type==="order"))return;
  return btSend(k,null)}
async function btAnswerText(){const st=BT.st;if(!st||!BT.on)return;
  const txt=String((document.getElementById("btTypeIn")||{}).value||"").trim();
  if(!txt){BT.err="Type your answer first.";BT.key="";btDraw();return}
  return btSend(null,txt)}

const _btClick3=btClick;
btClick=function(b){if(b.dataset.ar==="bt-type")return btAnswerText();return _btClick3(b)};
