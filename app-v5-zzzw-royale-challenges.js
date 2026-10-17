/* =====================================================================
   v5 · Battle Royale: many challenges, each with its own questions.
   - The Battle Royale page lists 10 challenges (grammar, vocabulary, mixed,
     easy to hard, short to long). Each one draws its own questions from the
     Arena bank, so two challenges never play the same set.
   - "Random mix" keeps the old quick start.
   - Each challenge gets a room code, shown on every screen (see
     app-v5-zzzv-battle-nav.js), and returns to this page on Back.
   ===================================================================== */

/* difficulty colours, the same everywhere: easy green, medium amber, hard red */
(function lvColours(){
  if(document.getElementById("lvColourCss"))return;
  const s=document.createElement("style");s.id="lvColourCss";
  s.textContent=`
.lvt{font-weight:800;letter-spacing:.02em}
.lvt.lv-easy{color:#6EE7B7}.lvt.lv-medium{color:#FBBF24}.lvt.lv-hard{color:#F87171}
#arena .ar-seg button[data-l="easy"],#arena .bt-diff button[data-l="easy"]{color:#6EE7B7}
#arena .ar-seg button[data-l="medium"],#arena .bt-diff button[data-l="medium"]{color:#FBBF24}
#arena .ar-seg button[data-l="hard"],#arena .bt-diff button[data-l="hard"]{color:#F87171}
#arena .ar-seg button.on[data-l="easy"]{background:rgba(110,231,183,.18);color:#6EE7B7}
#arena .ar-seg button.on[data-l="medium"]{background:rgba(251,191,36,.18);color:#FBBF24}
#arena .ar-seg button.on[data-l="hard"]{background:rgba(248,113,113,.18);color:#F87171}`;
  document.head.appendChild(s);
})();
const ROYALE_CH=[
 {t:"Quick start",        d:"Warm up together",          lv:"easy",   kind:"all",     n:10},
 {t:"Grammar storm",      d:"Tenses, modals, passive",   lv:"medium", kind:"grammar", n:12},
 {t:"Grammar storm: hard",d:"Tricky forms and structures",lv:"hard",  kind:"grammar", n:15},
 {t:"Vocabulary sprint",  d:"Meanings and synonyms",     lv:"easy",   kind:"vocab",   n:12},
 {t:"Vocabulary sprint: hard",d:"Rare words, precise meanings",lv:"hard",kind:"vocab", n:15},
 {t:"Mixed bag",          d:"Everything, medium level",  lv:"medium", kind:"all",     n:15},
 {t:"Last one standing",  d:"One wrong answer and you are out",lv:"hard",kind:"all",  n:20},
 {t:"Medium showdown",    d:"Twenty questions, medium",  lv:"medium", kind:"all",     n:20},
 {t:"Easy marathon",      d:"Twenty-five easy questions",lv:"easy",   kind:"all",     n:25},
 {t:"Exam simulation",    d:"Long format, like the BAC", lv:"hard",   kind:"all",     n:30}
];
const ROYALE_GRAMMAR=/___|\.{4}|tense|passive|plural|comparative|superlative|past|present|conditional|question tag|reported|\bcan\b|should|must|\bwill\b|would/i;
const ROYALE_VOCAB=/\bmean|synonym|opposite|definition|word for|called|what is an? |what does/i;

function royalePool(kind,lv){
  const all=AR_Q.filter(x=>(x.lv||1)===lv);
  const pick=kind==="grammar"?all.filter(x=>ROYALE_GRAMMAR.test(x.q)):kind==="vocab"?all.filter(x=>ROYALE_VOCAB.test(x.q)):all;
  return pick.length>=8?pick:(all.length>=8?all:AR_Q.filter(x=>(x.lv||1)<=lv));
}
function royaleQs(ch,rnd){
  const p=royalePool(ch.kind,AR_LV[ch.lv]).slice();
  for(let i=p.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
  return p.slice(0,ch.n).map(it=>btPrep(it,rnd));
}

/* the page of the Battle Royale: its challenges, the random mix and the join box */
const _btKindPage=btKindPage;
btKindPage=function(k){
  if(k!=="royale")return _btKindPage(k);
  btStop();BT.on=false;BT.inHub=true;BT.key="";BTNAV.view="kind";BTNAV.kind="royale";
  const K=BT_KINDS.royale;
  const live=BT.room&&(!BT.st||!btFinished(BT.st))&&btKindOf()==="royale";
  const cards=ROYALE_CH.map((ch,i)=>`<button class="ar-mode bt-glow" style="--d:${(i*0.05).toFixed(2)}s" data-ar="bt-rch" data-i="${i}">
      <span class="ar-badge" style="width:44px;height:44px;border-radius:14px">${arIc(K.ic)}</span>
      <b>${arEsc(ch.t)}</b><small><span class="lvt lv-${ch.lv}">${arEsc(ch.lv[0].toUpperCase()+ch.lv.slice(1))}</span> · ${ch.n} questions · ${arEsc(ch.d)}</small></button>`).join("");
  arSet(arTop(K.t,"")+`<div class="bt-kpage"><div class="ar-hero"><p class="ar-kicker">${arEsc(K.d)}</p><h1>${arEsc(K.t)}</h1>
      <p>Pick a challenge. Each one has its own questions. Then share the code with your classmates.</p></div>
    ${live?`<button class="ar-go bt-entry" data-ar="bt-back" style="width:100%">Back to my battle</button>`:""}
    <div class="ar-grid">${cards}</div>
    <div class="ar-card"><p class="ar-kicker">Random mix</p><button class="ar-go" data-ar="bt-kind" data-m="royale" style="width:100%">Start a random Battle Royale</button></div>
    ${btJoinBox()}${btErr()}</div>`);
  BT.err="";
};

/* starting a challenge: a new room with the challenge's own questions */
async function btRoyaleCh(i){if(BT.busy)return;const ch=ROYALE_CH[i];if(!ch)return;
  if(!window.__sb){BT.err="Battles need internet.";return btKindPage("royale")}
  BT.busy=true;
  try{
    let qs=royaleQs(ch,Math.random);
    if(qs.length<5)qs=btQs(ch.n,Math.random,AR_LV[ch.lv]);
    const r=await btRpc("arena_create",{p_kind:"royale",p_mode:"quiz",p_qs:qs});
    BT.room={id:r.id,code:r.code,kind:"royale"};BT.st=null;BT.res={};BT.ci=null;BT.cur=null;BT.err="";
    btPoll()}
  catch(e){BT.err=btMsg(e);btKindPage("royale")}
  finally{BT.busy=false}}

const _btClick2=btClick;
btClick=function(b){if(b.dataset.ar==="bt-rch")return btRoyaleCh(+b.dataset.i);return _btClick2(b)};
