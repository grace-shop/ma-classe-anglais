/* =====================================================================
   v5 · English challenges in the Community, and reliable notifications.
   - A teacher can post a challenge, a word of the day, or a sentence to
     correct. It shows with a banner; students answer in the comments, and
     the English check corrects their answers as for any comment.
   - Every notification of the Community (comments, reactions, challenges…)
     is also sent as a phone notification, even when the app is closed.
   - The phone registers for notifications at start-up, not only when the
     classmates or the class page is opened.
   ===================================================================== */

/* 1 · the phone registers for notifications at start-up (and again if it was not ready) */
{let tries=0;const iv=setInterval(()=>{if(!S.uid||PUSH.started){if(PUSH.started)clearInterval(iv);return}
  if(document.visibilityState==="hidden"||tries>=6)return;tries++;pushStart()},20000)}
addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.uid&&!PUSH.started)pushStart()});

/* 2 · the teacher chooses the kind of post */
const FCH_KIND={challenge:"English challenge · reply in the comments",word:"Word of the day · use it in a comment",correct:"Correct this sentence · reply in the comments"};
{const _fv=feedView;feedView=function(e){let h=_fv(e);
  if(fStaff&&fStaff()&&typeof h==="string"){const at=h.indexOf('id="f_files"');
    if(at>0){const cut=h.lastIndexOf('<div class="row between">',at);
      if(cut>0)h=h.slice(0,cut)+`<label class="fch-pick"><span class="small muted">Post as</span><select id="f_chal" aria-label="Kind of post"><option value="">A normal post</option><option value="challenge">English challenge</option><option value="word">Word of the day</option><option value="correct">Correct this sentence</option></select></label>`+h.slice(cut)}}
  return h}}

/* 3 · publishing a challenge (text only) */
{const _fp=fPost;fPost=async function(){const sel=document.getElementById("f_chal");const kind=sel&&sel.value;
  if(!kind||!fStaff())return _fp.apply(this,arguments);
  if(F.busy)return;
  const ta=document.getElementById("f_text"),text=((ta&&ta.value)||"").trim();
  if(!text){toast("Write the challenge first.","x");return}
  if(F.files.length){toast("A challenge is text only: remove the photo or video.","x");return}
  if(!navigator.onLine){toast("No network: try again when you are online.","x");return}
  F.busy=true;render();
  try{await window.__feed.challenge(text,kind);if(ta)ta.value="";if(S.drafts)delete S.drafts.f_text;toast("Challenge posted! Students are told.","rocket");F.busy=false;await feedLoad()}
  catch(er){toast(er.message||"Could not post the challenge","x")}
  finally{F.busy=false;render()}}}

/* 4 · the banner of a challenge */
{const _fp2=fPostHTML;fPostHTML=function(p){let h=_fp2(p);
  if(p&&p.kind&&FCH_KIND[p.kind]&&!p.deleted_at){const banner=`<div class="fchal" role="note"><b>★ ${esc(FCH_KIND[p.kind])}</b></div>`;
    h=h.replace("</header>",()=>"</header>"+banner)}
  return h}}

/* 5 · how a challenge reads in the bell */
{const _nt=nTitle,_nb=nBody;
  nBody=function(n){if(n&&n.kind==="challenge")return`New challenge: “${n.body||""}”`;return _nb(n)};
  nTitle=function(n){if(n&&n.kind==="challenge")return"English challenge";return _nt(n)}}

{const st=document.createElement("style");st.id="zzzbchallenges";st.textContent=`
.fchal{margin:8px 0 6px;padding:8px 12px;border-radius:14px;background:linear-gradient(120deg,rgba(94,234,212,.18),rgba(129,140,248,.2));border:1px solid rgba(160,172,255,.32);font-size:.92rem}
.fch-pick{display:flex;align-items:center;gap:8px;margin:6px 0;white-space:nowrap}
.fch-pick select{border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:inherit;font:inherit;padding:6px 10px}
`;document.head.appendChild(st)}
