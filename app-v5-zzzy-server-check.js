/* =====================================================================
   v5 · Battles: the answer is checked by the server (see
   supabase/battle-server-check.sql, to run first).
   - The phone sends the chosen option only. The server says if it is right,
     gives the points, and gives the explanation.
   - The correct option is shown only after the answer, or when the question
     is over. Nothing else is revealed before.
   ===================================================================== */
function btQCard(q,res,locked,cur,next){
  const corr=res&&res.correct!=null?res.correct:q.a;
  const ex=(res&&res.e)||q.e||"";
  const opts=q.o.map((t,k)=>{let c="ar-opt";if(res&&k===corr)c+=" ok";else if(res&&k===res.k&&!res.ok)c+=" bad";
    return `<button class="${c}" data-ar="bt-ans" data-k="${k}" ${locked||res?"disabled":""}>${arEsc(t)}</button>`}).join("");
  const fb=res?`<div class="ar-note ${res.ok?"good":"bad"} bt-fb"><b>${res.ok?"Correct!"+(res.pts?" +"+res.pts:""):"Not quite."}</b> ${arEsc(ex)}</div>`:"";
  const nx=res&&next?`<div style="height:12px"></div><button class="ar-go" data-ar="bt-next" style="width:100%">${cur+1>=next?"See the board":"Next →"}</button>`:"";
  return `<div class="ar-card"><p class="ar-kicker">Question ${cur+1}</p><h2>${arEsc(q.q)}</h2></div><div class="ar-opts">${opts}</div>${fb}${nx}`}

async function btAnswer(k){const st=BT.st;if(!st||!BT.on)return;
  const solo=st.kind==="challenge",cur=solo?BT.ci:BT.cur;
  if(cur==null||cur<0||cur>=st.qs.length||BT.res[cur]||st.answered.includes(cur))return;
  st.answered=st.answered.concat([cur]);BT.key="";btDraw();
  try{const r=await btRpc("arena_answer_v2",{p_room:st.id,p_idx:cur,p_choice:k});
    BT.res[cur]={k:k,ok:!!r.ok,pts:r.pts||0,correct:r.correct,e:r.e};BT.err=""}
  catch(e){BT.err=btMsg(e);st.answered=st.answered.filter(x=>x!==cur)}
  BT.key="";btDraw();btSync()}
