/* =====================================================================
   v5 core: nicknames and conversation flags (pin / archive / mute)
   Shared by the feature files (app-v5-*.js).
   - nickOf(uid) → nickname I gave to this person ("" if none)
   - nickSet(uid, name)
   - dispName(uid, fallback) → nickname or fallback name
   - convHas(id, flag) / convToggle(id, flag)   id = "peer:<uid>" | "group:<id>" | "staff:<uid>"; flag = "pin" | "arch" | "mute"
   Saved in my own student document (synced between my devices) and in localStorage (offline).
   ===================================================================== */
const V5={};
function v5PrefsLocal(){try{return JSON.parse(localStorage.getItem("ec_v5p_"+(S.uid||"x"))||"{}")||{}}catch(e){return{}}}
function v5Prefs(){const loc=v5PrefsLocal(),me=S.mode==="student"&&S.me?S.me:null;
  return{nicks:{...(loc.nicks||{}),...((me&&me.nicks)||{})},conv:{...(loc.conv||{}),...((me&&me.conv)||{})}}}
function v5PrefsSave(p){try{localStorage.setItem("ec_v5p_"+(S.uid||"x"),JSON.stringify(p))}catch(e){}
  if(S.mode==="student"&&S.me&&S.db&&!isParent(S.me)){S.me.nicks=p.nicks;S.me.conv=p.conv;write(()=>S.db.doc("students/"+S.uid).update({nicks:p.nicks,conv:p.conv})).catch(()=>{})}}
function nickOf(uid){return(v5Prefs().nicks||{})[uid]||""}
function dispName(uid,fallback){return nickOf(uid)||fallback||""}
function nickSet(uid,name){const p=v5Prefs();name=String(name||"").trim().slice(0,30);if(name)p.nicks[uid]=name;else delete p.nicks[uid];v5PrefsSave(p);render()}
function convHas(id,flag){return!!((v5Prefs().conv||{})[id]||{})[flag]}
function convToggle(id,flag){const p=v5Prefs(),c={...(p.conv[id]||{})};if(c[flag])delete c[flag];else c[flag]=Date.now();if(Object.keys(c).length)p.conv[id]=c;else delete p.conv[id];v5PrefsSave(p);render()}
