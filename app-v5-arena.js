/* =====================================================================
   v5 · Arena: games and exercises to practise English.
   Six modes: Quiz Blitz, Guess the Word, Fill the Gap, Word Order,
   Flashcards and Beat the Clock. Countdowns, lives, streaks, bests.
   Opens from the floating "Arena" button. Only this viewer's best scores
   are kept on the device (a convenience, not shared data).
   ===================================================================== */

const AR_Q=[
 {q:"She ___ to school every day.",o:["go","goes","going","gone"],a:1,e:"With he, she and it, the verb takes -s or -es."},
 {q:"I have lived here ___ 2015.",o:["since","for","from","during"],a:0,e:"Use since with a point in time (2015)."},
 {q:"They ___ football right now.",o:["play","are playing","plays","played"],a:1,e:"Right now means the present continuous."},
 {q:"The plural of 'child' is:",o:["childs","childrens","children","childes"],a:2,e:"Child is irregular: children."},
 {q:"We ___ dinner when the phone rang.",o:["ate","were eating","eat","have eaten"],a:1,e:"Past continuous for the action in progress, interrupted by the past simple."},
 {q:"This is the ___ book I have ever read.",o:["good","better","best","most good"],a:2,e:"The + superlative: the best."},
 {q:"If it rains, we ___ at home.",o:["stay","will stay","stayed","would stayed"],a:1,e:"First conditional: if + present, will + verb."},
 {q:"Which word means 'happy'?",o:["sad","joyful","angry","tired"],a:1,e:"Joyful is a synonym of happy."},
 {q:"Which word is a verb?",o:["quick","happiness","run","beautiful"],a:2,e:"Run is an action word: a verb."},
 {q:"I'm looking forward to ___ you.",o:["see","seeing","to see","seen"],a:1,e:"Look forward to + -ing."},
 {q:"There isn't ___ milk in the fridge.",o:["some","any","a","many"],a:1,e:"Any is used in negative sentences."},
 {q:"He asked me where ___.",o:["do I live","I live","live I","I do live"],a:1,e:"In reported questions, the subject comes before the verb."},
 {q:"The opposite of 'expensive' is:",o:["costly","cheap","rich","big"],a:1,e:"Cheap is the opposite of expensive."},
 {q:"She's ___ than her sister.",o:["tall","taller","tallest","more tall"],a:1,e:"Short adjectives: add -er for comparisons."},
 {q:"The meeting has been ___ to Monday.",o:["moved","moving","move","moves"],a:0,e:"Passive: has been + past participle."},
 {q:"'To give up' means:",o:["to start","to stop trying","to win","to forget"],a:1,e:"Give up = stop trying."},
 {q:"I wish I ___ taller.",o:["am","were","was","be"],a:1,e:"After wish, use were for all persons in formal English."},
 {q:"Which sentence is correct?",o:["He don't like tea.","He doesn't like tea.","He not like tea.","He doesn't likes tea."],a:1,e:"With he, use doesn't + base verb."},
 {q:"Thank you ___ your help.",o:["for","to","with","by"],a:0,e:"Thank you for + noun."},
 {q:"The past of 'buy' is:",o:["buyed","bought","buy","buying"],a:1,e:"Buy is irregular: buy, bought, bought."},
 {q:"Which word is a noun?",o:["run","bright","school","quickly"],a:2,e:"School is a thing: a noun."},
 {q:"I've never ___ to Paris.",o:["be","been","was","go"],a:1,e:"Present perfect: have/has + past participle (been)."},
 {q:"Synonym of 'big':",o:["small","large","thin","short"],a:1,e:"Large means big."},
 {q:"A place where you borrow books is a ___.",o:["bakery","library","pharmacy","station"],a:1,e:"A library lends books."},
 {q:"She ___ her homework yet.",o:["didn't finish","hasn't finished","doesn't finish","isn't finish"],a:1,e:"Yet goes with the present perfect in negatives."},
 {q:"What time ___ it?",o:["is","are","do","was"],a:0,e:"Asking the time: What time is it?"},
 {q:"He is ___ student in the class.",o:["a","an","the","-"],a:0,e:"Student starts with a consonant sound: a."},
 {q:"Antonym of 'ancient':",o:["old","modern","long","dark"],a:1,e:"Ancient means very old; modern is the opposite."},
 {q:"The keys are ___ the table.",o:["in","on","at","into"],a:1,e:"On a surface: on the table."}
];

const AR_F=[
 {s:"Yesterday I ___ to the market.",a:["went"],h:"past of 'go'"},
 {s:"She has ___ her essay.",a:["finished"],h:"past participle of 'finish'"},
 {s:"They ___ spicy food.",a:["don't like","do not like"],h:"negative present"},
 {s:"I ___ a student since 2020.",a:["have been","I've been"],h:"present perfect of 'be'"},
 {s:"If I ___ time, I will help you.",a:["have","get"],h:"first conditional"},
 {s:"The book ___ by a famous author.",a:["was written","was written by"],h:"passive, past"},
 {s:"We are ___ about the trip.",a:["excited"],h:"adjective from 'excite'"},
 {s:"This road is ___ than that one.",a:["better"],h:"comparative of 'good'"},
 {s:"He can ___ very well.",a:["swim"],h:"base verb after can"},
 {s:"My sister ___ at home now.",a:["isn't","is not"],h:"negative of 'is'"},
 {s:"How many ___ do you need?",a:["apples"],h:"plural of 'apple'"},
 {s:"She ___ English fluently.",a:["speaks"],h:"he / she form"},
 {s:"I'm sorry I'm late. I ___ for an hour.",a:["waited","have waited"],h:"past simple or present perfect"},
 {s:"Don't forget ___ the door.",a:["to lock"],h:"forget + to + verb"},
 {s:"They ___ to Lomé last year.",a:["moved"],h:"past of 'move'"}
];

const AR_O=[
 {w:["goes","She","to","school","every","day"],a:"She goes to school every day"},
 {w:["am","I","a","student"],a:"I am a student"},
 {w:["Is","your","brother","tall"],a:"Is your brother tall"},
 {w:["yesterday","we","the","watched","movie"],a:"We watched the movie yesterday"},
 {w:["much","don't","I","have","money"],a:"I don't have much money"},
 {w:["has","She","already","eaten"],a:"She has already eaten"},
 {w:["in","The","is","kitchen","cat","the"],a:"The cat is in the kitchen"}
];

const AR_C=[
 ["resilient","able to recover quickly","She is resilient after the storm."],
 ["curious","wanting to know more","Kids are curious about everything."],
 ["ambitious","wanting to succeed a lot","He is ambitious and works hard."],
 ["generous","happy to give and share","My grandmother is very generous."],
 ["reliable","you can trust it","This bus is reliable."],
 ["improve","make something better","I want to improve my English."],
 ["confident","sure of yourself","She feels confident when she speaks."],
 ["journey","a trip from one place to another","The journey took five hours."],
 ["homework","school work to do at home","I finished my homework early."],
 ["borrow","take something and give it back later","Can I borrow your pen?"],
 ["remember","keep something in your mind","I remember my first day at school."],
 ["enormous","very, very big","The elephant is enormous."],
 ["whisper","speak very quietly","Please whisper in the library."],
 ["delicious","very good to eat","This soup is delicious!"]
];

const AR_G=[
 {w:"library",h:"You borrow books here."},
 {w:"teacher",h:"They teach you in class."},
 {w:"airport",h:"Planes take off here."},
 {w:"hospital",h:"Doctors and nurses work here."},
 {w:"umbrella",h:"You use it when it rains."},
 {w:"kitchen",h:"You cook food here."},
 {w:"football",h:"Eleven players in each team."},
 {w:"calendar",h:"It shows the days and months."},
 {w:"dictionary",h:"It gives the meaning of words."},
 {w:"bicycle",h:"Two wheels and pedals."}
];

/* ---- levels: easy / medium / hard. Existing items are tagged by order, new items carry their level ---- */
AR_Q.forEach((q,i)=>{if(!q.lv)q.lv=i<12?1:i<22?2:3});
AR_F.forEach((x,i)=>{if(!x.lv)x.lv=i<5?1:i<10?2:3});
AR_O.forEach((x,i)=>{if(!x.lv)x.lv=i<3?1:i<5?2:3});
AR_G.forEach((x,i)=>{if(!x.lv)x.lv=i<5?1:i<10?2:3});
AR_Q.push(
 {lv:2,q:"By the time we arrived, the film ___.",o:["already started","has already started","had already started","already starts"],a:2,e:"Past perfect: an action finished before another past action."},
 {lv:2,q:"She suggested ___ to the cinema.",o:["to go","going","go","went"],a:1,e:"Suggest + -ing."},
 {lv:2,q:"I'd rather you ___ tell him now.",o:["didn't","don't","won't","aren't"],a:0,e:"'I'd rather you + past simple' expresses a wish about the present."},
 {lv:2,q:"The team ___ won the match celebrated all night.",o:["who","which","whose","where"],a:0,e:"Who refers to people in a relative clause."},
 {lv:2,q:"Neither my brother nor my sisters ___ coming.",o:["is","are","was","be"],a:1,e:"With neither...nor, the verb agrees with the nearer subject: sisters, so are."},
 {lv:2,q:"He ___ have finished the report; it is still on his desk.",o:["mustn't","can't","shouldn't","needn't"],a:1,e:"Can't have + past participle: a strong deduction that something was impossible."},
 {lv:2,q:"The more you practise, ___ you become.",o:["the better","the best","good","better"],a:0,e:"The more..., the better."},
 {lv:2,q:"I'm used to ___ early.",o:["get up","getting up","to get up","got up"],a:1,e:"Be used to + -ing."},
 {lv:2,q:"Hardly ___ I sat down when the bell rang.",o:["had","have","did","was"],a:0,e:"Hardly + had + subject + past participle, when..."},
 {lv:2,q:"Choose the correct word: 'The information was ___.'",o:["useless","uselessly","use","usefulness"],a:0,e:"An adjective comes after was."},
 {lv:2,q:"If I had studied harder, I ___ the exam.",o:["would pass","will pass","pass","passed"],a:0,e:"Third conditional: would + have + past participle."},
 {lv:2,q:"Which word is an adverb?",o:["quickly","quick","quickness","quicken"],a:0,e:"Quickly describes how something is done."},
 {lv:3,q:"Had I known about the traffic, I ___ earlier.",o:["would leave","would have left","will leave","left"],a:1,e:"Inverted third conditional: would have + past participle."},
 {lv:3,q:"The report, ___ was published last week, is controversial.",o:["which","who","whom","whose"],a:0,e:"Which refers to things in a non-defining relative clause."},
 {lv:3,q:"She denied ___ the money.",o:["to take","taking","take","took"],a:1,e:"Deny + -ing."},
 {lv:3,q:"It's high time we ___ going.",o:["were","are","be","have been"],a:0,e:"It's high time + past simple, for something that should happen now."},
 {lv:3,q:"Not only ___ fast, but he is also accurate.",o:["is he","he is","he's","is"],a:0,e:"After 'not only', the subject and verb are inverted."},
 {lv:3,q:"I'd have told you if I ___ known.",o:["had","have","would","did"],a:0,e:"Third conditional: if + had + past participle."},
 {lv:3,q:"The suspect is believed ___ the city.",o:["to have left","to leave","leaving","having left"],a:0,e:"Passive reporting: is believed to have + past participle."},
 {lv:3,q:"Despite ___ tired, she finished the marathon.",o:["being","to be","be","been"],a:0,e:"Despite + -ing."},
 {lv:3,q:"The results were ___ than expected.",o:["more encouraging","encouragingest","most encouraging","encouraginger"],a:0,e:"Long adjectives form the comparative with more."},
 {lv:3,q:"He ___ to have been a doctor before he became a writer.",o:["seems","seem","seemed","seeming"],a:0,e:"Seems to have + past participle."},
 {lv:3,q:"Scarcely ___ we arrived when it started to rain.",o:["had","did","have","were"],a:0,e:"Scarcely + had + subject + past participle, when..."},
 {lv:3,q:"Which word is a synonym of 'reluctant'?",o:["eager","hesitant","confident","generous"],a:1,e:"Reluctant means unwilling; hesitant is close in meaning."}
);
AR_F.push(
 {lv:2,s:"If I ___ earlier, I would have helped.",a:["had known","had known about it"],h:"third conditional: know"},
 {lv:2,s:"She wishes she ___ French.",a:["could speak","spoke"],h:"wish + past"},
 {lv:2,s:"The letter ___ yesterday.",a:["was sent"],h:"passive, past"},
 {lv:2,s:"Neither of them ___ to the party.",a:["came"],h:"past simple of 'come'"},
 {lv:2,s:"He ___ here since 2019.",a:["has worked","has been working"],h:"present perfect"},
 {lv:3,s:"By next year, I ___ my degree.",a:["will have finished"],h:"future perfect"},
 {lv:3,s:"The homework ___ by the teacher right now.",a:["is being checked"],h:"passive, present continuous"},
 {lv:3,s:"I'd ___ stay at home tonight.",a:["rather"],h:"a preference"},
 {lv:3,s:"Hardly anyone ___ the question.",a:["understood"],h:"past simple of 'understand'"},
 {lv:3,s:"Make sure you ___ on time.",a:["arrive"],h:"base verb after 'make sure'"}
);
AR_O.push(
 {lv:2,w:["wish","I","could","speak","French","better"],a:"I wish I could speak French better"},
 {lv:2,w:["if","you","study","you","will","pass"],a:"If you study, you will pass"},
 {lv:3,w:["was","The","written","book","by","a","famous","author"],a:"The book was written by a famous author"},
 {lv:3,w:["ever","Have","been","you","to","London"],a:"Have you ever been to London"}
);
AR_G.push(
 {lv:3,w:"encyclopedia",h:"A big book full of facts about everything."},
 {lv:3,w:"hurricane",h:"A very strong storm with powerful winds."},
 {lv:3,w:"mirror",h:"You look at your reflection in it."},
 {lv:3,w:"volcano",h:"A mountain that can erupt with lava."},
 {lv:3,w:"orchestra",h:"A large group of musicians playing together."},
 {lv:3,w:"pharmacy",h:"You buy medicine here."}
);
const AR_LV={easy:1,medium:2,hard:3};
function arLv(){return AR_LV[AR.level||"easy"]||1}
function arPool(arr,n){const L=arLv();let p=arr.filter(x=>(x.lv||1)===L);if(p.length<n)p=arr.filter(x=>(x.lv||1)<=L);return arShuf(p)}

const AR_MODES=[
 {id:"quiz",t:"Quiz Blitz",d:"10 questions · 15 s each",ic:"bolt",max:400},
 {id:"guess",t:"Guess the Word",d:"Letters, lives and a clock",ic:"search",max:240},
 {id:"fill",t:"Fill the Gap",d:"Type the right word or form",ic:"pen",max:320},
 {id:"order",t:"Word Order",d:"Build the sentence, tile by tile",ic:"shuffle",max:300},
 {id:"cards",t:"Flashcards",d:"Flip, learn, repeat",ic:"cards",max:14},
 {id:"clock",t:"Beat the Clock",d:"60 seconds: how many can you get?",ic:"timer",max:30}
];

const AR_I={
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
 cards:'<rect x="3" y="6" width="13" height="14" rx="2"/><path d="M8 3h11v14"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
 back:'<path d="M15 6l-6 6 6 6"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>'
};
const arIc=(n,cls)=>`<svg class="ar-ic ${cls||""}" viewBox="0 0 24 24" aria-hidden="true">${AR_I[n]||""}</svg>`;
const arEsc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arNorm=s=>String(s||"").toLowerCase().replace(/’/g,"'").replace(/[.!?,]/g,"").replace(/\s+/g," ").trim();
const arShuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let AR={mode:null,level:"easy",boardMode:"quiz",best:{},iv:null,tl:0,tot:0,locked:false,qs:[],items:[],i:0,score:0,streak:0,word:null,guessed:[],lives:6,pool:[],ans:[],deck:[],known:0,total:0};
try{AR.best=JSON.parse(localStorage.getItem("ar_best")||"{}")||{};AR.level=localStorage.getItem("ar_level")||"easy"}catch(e){AR.best={}}

/* ---------- shell ---------- */
{const st=document.createElement("style");st.id="arcss";st.textContent=`
@keyframes arGrid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes arOrb{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(24px,-18px,0) scale(1.08)}}
@keyframes arIn{from{opacity:0;transform:translateY(16px) rotateX(-8deg)}to{opacity:1;transform:none}}
@keyframes arFall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(540deg);opacity:0}}
@keyframes arPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes arShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes arFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#arena{position:fixed;inset:0;z-index:9800;color:#EAF0FF;overflow:auto;background:radial-gradient(120% 70% at 50% -10%,#1E2766 0%,#0B0E20 50%,#06070F 100%);-webkit-overflow-scrolling:touch;perspective:1200px}
#arena[hidden]{display:none!important}
#arena::before{content:"";position:fixed;inset:-64px 0 0;pointer-events:none;background-image:linear-gradient(rgba(94,234,212,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(129,140,248,.09) 1px,transparent 1px);background-size:64px 64px;transform:rotateX(62deg) translateY(-30%);transform-origin:50% 0;animation:arGrid 6s linear infinite;opacity:.6;mask-image:linear-gradient(transparent,#000 40%)}
.ar-orb{position:fixed;border-radius:50%;filter:blur(40px);pointer-events:none;animation:arOrb 12s ease-in-out infinite}
.ar-orb.o1{width:260px;height:260px;left:-80px;top:-60px;background:rgba(94,234,212,.35)}
.ar-orb.o2{width:300px;height:300px;right:-120px;top:30%;background:rgba(129,140,248,.4);animation-delay:-4s}
.ar-orb.o3{width:220px;height:220px;left:20%;bottom:-80px;background:rgba(244,114,182,.28);animation-delay:-8s}
.ar-body{position:relative;z-index:1;max-width:520px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 18px calc(env(safe-area-inset-bottom,0px) + 28px);min-height:100%;box-sizing:border-box;display:grid;gap:16px;align-content:start}
.ar-top{display:flex;align-items:center;gap:12px}
.ar-top b{flex:1;font-size:1.05rem;font-weight:800;letter-spacing:.01em;text-shadow:0 2px 16px rgba(94,234,212,.35)}
.ar-top>span{font-size:.85rem;font-weight:800;color:#8EF6E4;font-variant-numeric:tabular-nums}
.ar-glass{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.04));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 12px 24px -12px #000;flex:none}
.ar-ic{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ar-hero{text-align:center;padding:6px 0 4px;animation:arIn .6s cubic-bezier(.2,.8,.2,1) both}
.ar-hero h1{font-family:var(--f-display,Georgia,serif);font-weight:400;font-size:2.6rem;margin:6px 0 4px;line-height:1.05;background:linear-gradient(120deg,#8EF6E4,#A5B4FC 50%,#F9A8D4);-webkit-background-clip:text;background-clip:text;color:transparent}
.ar-hero p{margin:0;color:#B9C3E6;font-size:.95rem}
.ar-kicker{margin:0;font-size:.72rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#9FB4FF}
.ar-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ar-mode{position:relative;display:grid;gap:10px;justify-items:start;text-align:left;padding:16px;border-radius:24px;border:1px solid rgba(160,172,255,.2);background:linear-gradient(170deg,rgba(40,48,110,.7),rgba(14,17,40,.85));color:#EAF0FF;cursor:pointer;font:inherit;box-shadow:0 22px 40px -24px #000,inset 0 1px 0 rgba(255,255,255,.1);transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .3s;animation:arIn .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}
.ar-mode:hover{transform:translateY(-4px) rotateX(4deg);border-color:rgba(94,234,212,.5);box-shadow:0 30px 50px -22px rgba(0,0,0,.9),0 0 0 1px rgba(94,234,212,.25),0 0 40px -10px rgba(94,234,212,.5)}
.ar-mode:active{transform:scale(.97)}
.ar-mode b{font-size:1rem;font-weight:800}
.ar-mode small{color:#AEB8DC;font-size:.8rem;line-height:1.35}
.ar-mode .ar-best{font-size:.74rem;font-weight:800;color:#FDE68A;background:rgba(253,230,138,.12);border:1px solid rgba(253,230,138,.3);border-radius:999px;padding:3px 9px}
.ar-badge{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;color:#06201C;background:radial-gradient(circle at 30% 25%,#fff,#8EF6E4 30%,#5EEAD4 60%,#818CF8);box-shadow:inset 0 -6px 10px rgba(20,30,90,.3),inset 0 2px 5px rgba(255,255,255,.7),0 16px 26px -12px rgba(94,234,212,.9);animation:arFloat 4s ease-in-out infinite}
.ar-badge .ar-ic{width:26px;height:26px;stroke:#06201C}
.ar-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.4)}
.ar-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#5EEAD4,#818CF8,#F472B6);box-shadow:0 0 16px rgba(94,234,212,.7);transition:width .5s cubic-bezier(.2,.8,.2,1)}
.ar-ring-wrap{display:grid;place-items:center;margin:4px 0}
.ar-ring{position:relative;width:96px;height:96px}
.ar-ring svg{width:96px;height:96px;transform:rotate(-90deg);filter:drop-shadow(0 0 12px rgba(94,234,212,.5))}
.ar-ring circle{fill:none;stroke-width:6;stroke-linecap:round}
.ar-track{stroke:rgba(255,255,255,.1)}
.ar-arc{stroke:url(#arGrad);stroke:#5EEAD4;stroke-dasharray:138.2;transition:stroke .3s}
.ar-arc.hot{stroke:#F472B6;filter:drop-shadow(0 0 10px rgba(244,114,182,.8))}
.ar-ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:1.7rem;font-weight:900;font-variant-numeric:tabular-nums;text-shadow:0 0 18px rgba(94,234,212,.6)}
.ar-card{position:relative;display:grid;gap:12px;padding:22px 18px;border-radius:28px;background:linear-gradient(170deg,rgba(40,48,110,.72),rgba(12,15,36,.9));border:1px solid rgba(160,172,255,.2);box-shadow:0 30px 60px -28px #000,inset 0 1px 0 rgba(255,255,255,.1);animation:arIn .5s cubic-bezier(.2,.8,.2,1) both}
.ar-card h2{margin:0;font-size:1.45rem;line-height:1.3;font-weight:800;text-align:center}
.ar-hint{margin:0;text-align:center;color:#C9D2F2;font-size:.95rem}
.ar-opts{display:grid;gap:10px}
.ar-opt{position:relative;padding:15px 16px;border-radius:18px;border:1px solid rgba(160,172,255,.22);background:linear-gradient(170deg,rgba(255,255,255,.1),rgba(255,255,255,.02));color:#EAF0FF;font:inherit;font-weight:700;font-size:1rem;text-align:left;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 10px 20px -14px #000;transition:transform .2s,border-color .2s,background .2s,box-shadow .2s;animation:arIn .45s cubic-bezier(.2,.8,.2,1) both}
.ar-opt:nth-child(2){animation-delay:.05s}.ar-opt:nth-child(3){animation-delay:.1s}.ar-opt:nth-child(4){animation-delay:.15s}
.ar-opt:not(:disabled):hover{transform:translateX(4px);border-color:rgba(94,234,212,.6);background:linear-gradient(170deg,rgba(94,234,212,.2),rgba(129,140,248,.1))}
.ar-opt:disabled{cursor:default}
.ar-opt.ok{border-color:#5EEAD4;background:linear-gradient(170deg,rgba(94,234,212,.35),rgba(94,234,212,.1));box-shadow:0 0 0 1px #5EEAD4,0 0 26px -6px rgba(94,234,212,.9);animation:arPop .4s ease both}
.ar-opt.bad{border-color:#F472B6;background:linear-gradient(170deg,rgba(244,114,182,.3),rgba(244,114,182,.08));animation:arShake .4s ease both}
.ar-note{padding:14px 16px;border-radius:18px;font-size:.95rem;line-height:1.45;animation:arPop .4s ease both}
.ar-note.good{background:rgba(94,234,212,.14);border:1px solid rgba(94,234,212,.45)}
.ar-note.bad{background:rgba(244,114,182,.12);border:1px solid rgba(244,114,182,.45)}
.ar-go{height:52px;padding:0 22px;border:0;border-radius:18px;font:inherit;font-weight:900;font-size:1rem;color:#06201C;cursor:pointer;background:linear-gradient(120deg,#5EEAD4,#B8FFF2 40%,#818CF8);background-size:200% 100%;box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 16px 26px -14px rgba(94,234,212,.95);transition:transform .2s,filter .2s}
.ar-go:hover{transform:translateY(-1px);filter:brightness(1.05)}
.ar-go:active{transform:translateY(2px)}
.ar-round-wrap{display:flex;justify-content:center;margin:8px 0}
.ar-round{width:112px;height:112px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:1.15rem;color:#06201C;cursor:pointer;background:radial-gradient(circle at 35% 30%,#E9FFFA,#5EEAD4 45%,#818CF8);box-shadow:0 8px 0 #2b3a8f,0 16px 26px rgba(0,0,0,.35),inset 0 2px 0 rgba(255,255,255,.6)}
.ar-round:active{transform:translateY(5px);box-shadow:0 3px 0 #2b3a8f,0 6px 10px rgba(0,0,0,.35)}
.ar-go.ghost{background:rgba(255,255,255,.08);color:#EAF0FF;box-shadow:inset 0 1px 0 rgba(255,255,255,.15);border:1px solid rgba(160,172,255,.25)}
.ar-inrow{display:flex;gap:10px;align-items:center}
.ar-in{flex:1;min-width:0;height:52px;padding:0 16px;border-radius:18px;border:1px solid rgba(160,172,255,.35);background:rgba(8,10,28,.7);color:#fff;font:inherit;font-size:1.05rem;font-weight:700;outline:none;box-shadow:inset 0 2px 8px rgba(0,0,0,.4)}
.ar-in:focus{border-color:#5EEAD4;box-shadow:0 0 0 3px rgba(94,234,212,.2),inset 0 2px 8px rgba(0,0,0,.4)}
.ar-blank{display:inline-block;min-width:3.2ch;border-bottom:3px solid #5EEAD4;margin:0 4px;color:#8EF6E4}
.ar-slots{display:flex;gap:7px;justify-content:center;flex-wrap:wrap}
.ar-slot{min-width:34px;height:44px;display:grid;place-items:center;border-radius:12px;border-bottom:3px solid #5EEAD4;font-size:1.4rem;font-weight:900;background:rgba(255,255,255,.05);text-transform:uppercase;animation:arPop .35s ease both}
.ar-lives{display:flex;gap:6px;justify-content:center}
.ar-lives i{width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#F472B6,#FB7185);box-shadow:0 0 10px rgba(244,114,182,.7)}
.ar-lives i.off{background:rgba(255,255,255,.12);box-shadow:none}
.ar-keys{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}
.ar-key{height:42px;border-radius:12px;border:1px solid rgba(160,172,255,.2);background:linear-gradient(170deg,rgba(255,255,255,.1),rgba(255,255,255,.02));color:#EAF0FF;font:inherit;font-weight:800;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 6px 12px -8px #000;transition:transform .15s}
.ar-key:not(:disabled):hover{transform:translateY(-2px);border-color:#5EEAD4}
.ar-key:disabled{opacity:.35;cursor:default}
.ar-key.hit{background:linear-gradient(170deg,#5EEAD4,#818CF8);color:#06201C;opacity:1}
.ar-key.miss{background:rgba(244,114,182,.25);color:#fff;opacity:.6}
.ar-chips{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;min-height:52px}
.ar-chip{padding:11px 15px;border-radius:14px;border:1px solid rgba(160,172,255,.3);background:linear-gradient(170deg,rgba(255,255,255,.12),rgba(255,255,255,.03));color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 10px 18px -12px #000;animation:arPop .35s ease both}
.ar-chip:hover{border-color:#5EEAD4}
.ar-answer{min-height:76px;border-radius:20px;border:1px dashed rgba(94,234,212,.5);background:rgba(94,234,212,.05);padding:10px}
.ar-answer .ar-chips{min-height:56px}
.ar-scene{perspective:1200px}
.ar-card3d{position:relative;min-height:280px;border-radius:30px;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1);cursor:pointer;animation:arIn .5s cubic-bezier(.2,.8,.2,1) both}
.ar-card3d.flip{transform:rotateY(180deg)}
.ar-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:30px;display:grid;place-content:center;justify-items:center;gap:12px;padding:24px;text-align:center;border:1px solid rgba(160,172,255,.3);box-shadow:0 30px 60px -28px #000,inset 0 1px 0 rgba(255,255,255,.15)}
.ar-face.front{background:linear-gradient(160deg,rgba(94,234,212,.22),rgba(40,48,110,.9) 55%,rgba(14,17,40,.95))}
.ar-face.back{transform:rotateY(180deg);background:linear-gradient(160deg,rgba(244,114,182,.22),rgba(40,48,110,.9) 55%,rgba(14,17,40,.95))}
.ar-face h2{margin:0;font-size:2.2rem;font-weight:900;text-shadow:0 0 24px rgba(94,234,212,.5)}
.ar-face p{margin:0;color:#D6DCF5;font-size:1rem}
.ar-face small{color:#9FB4FF}
.ar-end{text-align:center;display:grid;gap:14px;justify-items:center;padding-top:10px;animation:arIn .6s cubic-bezier(.2,.8,.2,1) both;position:relative}
.ar-end h2{font-family:var(--f-display,Georgia,serif);font-weight:400;font-size:2.2rem;margin:0}
.ar-trophy{width:110px;height:110px;border-radius:32px;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,#FFF7D6,#FBBF24 35%,#F59E0B 70%,#B45309);box-shadow:inset 0 -10px 16px rgba(120,53,15,.35),inset 0 4px 8px rgba(255,255,255,.7),0 26px 40px -14px rgba(251,191,36,.7);animation:arFloat 3.5s ease-in-out infinite}
.ar-trophy .ar-ic{width:54px;height:54px;stroke:#451A03;stroke-width:1.8}
.ar-score{display:grid;gap:2px}
.ar-score b{font-size:3.6rem;font-weight:900;font-variant-numeric:tabular-nums;background:linear-gradient(120deg,#8EF6E4,#A5B4FC,#F9A8D4);-webkit-background-clip:text;background-clip:text;color:transparent}
.ar-score small{color:#AEB8DC;letter-spacing:.14em;text-transform:uppercase;font-size:.75rem;font-weight:800}
.ar-stars{font-size:1.9rem;letter-spacing:.2em;color:#FBBF24;text-shadow:0 0 18px rgba(251,191,36,.6)}
.ar-confetti{position:absolute;left:0;right:0;top:0;height:300px;overflow:hidden;pointer-events:none;z-index:0}
.ar-confetti i{position:absolute;top:-10px;width:9px;height:14px;border-radius:3px;animation:arFall 2.6s linear infinite}
.ar-fab{position:fixed;left:14px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:57;display:flex;align-items:center;gap:9px;padding:8px 16px 8px 8px;border-radius:999px;border:1px solid rgba(160,172,255,.3);background:linear-gradient(160deg,rgba(40,48,110,.85),rgba(12,15,36,.92));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#EAF0FF;font:inherit;font-weight:800;font-size:.9rem;cursor:pointer;box-shadow:0 18px 34px -14px #000,0 0 26px -8px rgba(94,234,212,.5),inset 0 1px 0 rgba(255,255,255,.15)}
.ar-fab .ar-badge{width:38px;height:38px;border-radius:13px}
.ar-fab .ar-badge .ar-ic{width:20px;height:20px}
@media (min-width:761px){.ar-fab{bottom:24px;left:24px}}
@media (min-width:521px){.ar-body{padding-top:calc(env(safe-area-inset-top,0px) + 30px)}}
@media (prefers-reduced-motion:reduce){#arena *,#arena::before,.ar-orb{animation:none!important;transition:none!important}}
`;document.head.appendChild(st)}

function arRoot(){let r=document.getElementById("arena");if(r)return r;
  r=document.createElement("div");r.id="arena";r.hidden=true;r.setAttribute("role","dialog");r.setAttribute("aria-label","Arena");
  r.innerHTML=`<div class="ar-orb o1"></div><div class="ar-orb o2"></div><div class="ar-orb o3"></div><div class="ar-body" id="arBody"></div>`;
  document.body.appendChild(r);
  r.addEventListener("click",arClick);
  r.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.id==="arIn"){e.preventDefault();if(AR.mode==="fill"&&!AR.locked)arFillAns(e.target.value)}if(e.key==="Escape")arClose()});
  return r}
function arFab(){if(document.getElementById("arFab"))return;const b=document.createElement("button");b.id="arFab";b.className="ar-fab";b.type="button";b.setAttribute("aria-label","Open the Arena");
  b.innerHTML=`<span class="ar-badge">${arIc("trophy")}</span><span>Arena</span>`;b.addEventListener("click",arOpen);document.body.appendChild(b)}
function arOpen(){arRoot().hidden=false;document.body.style.overflow="hidden";arHome()}
function arClose(){arStopT();const r=document.getElementById("arena");if(r)r.hidden=true;document.body.style.overflow="";AR.mode=null}
function arSet(h){const b=document.getElementById("arBody");if(b){b.innerHTML=h;const r=document.getElementById("arena");if(r)r.scrollTop=0}}
function arTop(title,right){return`<div class="ar-top"><button class="ar-back" data-ar="home" aria-label="Back to the Arena">${arIc("back")}<span>Back</span></button><b>${arEsc(title)}</b><span>${arEsc(right||"")}</span></div>`}
function arBar(p){return`<div class="ar-bar"><i style="width:${Math.max(0,Math.min(100,Math.round(p*100)))}%"></i></div>`}
function arRing(){return`<div class="ar-ring"><svg viewBox="0 0 48 48"><circle class="ar-track" cx="24" cy="24" r="22"/><circle id="arRing" class="ar-arc" cx="24" cy="24" r="22" style="stroke-dashoffset:0"/></svg><b id="arNum">0</b></div>`}

/* ---------- countdown ---------- */
function arStopT(){if(AR.iv){clearInterval(AR.iv);AR.iv=null}}
function arTick(){const n=document.getElementById("arNum"),c=document.getElementById("arRing");
  if(n)n.textContent=Math.ceil(AR.tl);
  if(c){c.style.strokeDashoffset=(138.2*(1-(AR.tot?AR.tl/AR.tot:0))).toFixed(1);c.classList.toggle("hot",AR.tl<=5)}}
function arTimer(sec,onEnd){arStopT();AR.tl=sec;AR.tot=sec;const t0=Date.now();arTick();
  AR.iv=setInterval(()=>{const left=Math.max(0,sec-(Date.now()-t0)/1000);AR.tl=left;arTick();if(left<=0){arStopT();onEnd()}},100)}

/* ---------- screens ---------- */
function arHome(){arStopT();AR.mode=null;
  const cards=AR_MODES.map((m,i)=>`<button class="ar-mode" style="--d:${(i*0.07).toFixed(2)}s" data-ar="start" data-m="${m.id}">
      <span class="ar-badge" style="width:48px;height:48px;border-radius:16px">${arIc(m.ic)}</span>
      <b>${arEsc(m.t)}</b><small>${arEsc(m.d)}</small>
      ${AR.best[m.id]!=null?`<span class="ar-best">Best ${AR.best[m.id]}</span>`:""}</button>`).join("");
  arSet(`<div class="ar-top"><button class="ar-glass" data-ar="close" aria-label="Close">${arIc("x")}</button><b>Arena</b><span></span></div>
    <div class="ar-hero"><p class="ar-kicker">Practise · Play · Progress</p><h1>The English Arena</h1><p>Eight ways to train your English. Beat the clock and climb the board.</p></div>
    <div class="ar-grid">${cards}</div>
    <button class="ar-go bt-entry" data-ar="bt-hub">Battles · duels, group battles, royale, daily challenge</button>
    <div class="ar-round-wrap"><button class="ar-round" data-ar="games" aria-label="Game">Game</button></div>
    <div class="ar-tools">
      <div class="ar-seg" role="group" aria-label="Level">${["easy","medium","hard"].map(l=>`<button class="${AR.level===l?"on":""}" data-ar="level" data-l="${l}" aria-pressed="${AR.level===l}">${l[0].toUpperCase()+l.slice(1)}</button>`).join("")}</div>
      <button class="ar-go" data-ar="board">Class board</button>
    </div>`)}
function arPlay(mode){AR.mode=mode;if(mode==="quiz"||mode==="odd"||mode==="traps"){AR.qs=arPool(mode==="odd"?AR_ODD:mode==="traps"?AR_TRAP:AR_Q,10).slice(0,10);AR.i=0;AR.score=0;AR.streak=0;return arQuiz()}
  if(mode==="guess"){const w=arPool(AR_G,1)[0];AR.word=w;AR.guessed=[];AR.lives=6;arTimer(90,()=>arGuessEnd(false));return arGuess()}
  if(mode==="fill"){AR.items=arPool(AR_F,8).slice(0,8);AR.i=0;AR.score=0;return arFill()}
  if(mode==="order"){AR.items=arPool(AR_O,6).slice(0,6);AR.i=0;AR.score=0;return arOrder()}
  if(mode==="cards"){AR.deck=arShuf(AR_C);AR.total=AR.deck.length;AR.known=0;return arCards()}
  if(mode==="clock"){AR.qs=arPool(AR_Q,20).concat(arPool(AR_Q,20));AR.i=0;AR.score=0;arTimer(60,()=>arEnd("clock",AR.score,30));return arClock()}}

/* quiz */
function arQuiz(){if(AR.i>=AR.qs.length)return arEnd(AR.mode,AR.score,AR.qs.length*40);
  const q=AR.qs[AR.i];AR.locked=false;
  arSet(arTop(AR.mode==="odd"?"Odd One Out":AR.mode==="traps"?"Grammar Traps":"Quiz Blitz",`${AR.i+1} / ${AR.qs.length} · ${AR.score} pts`)+arBar(AR.i/AR.qs.length)+
    `<div class="ar-ring-wrap">${arRing()}</div>
     <div class="ar-card"><p class="ar-kicker">Question ${AR.i+1}</p><h2>${arEsc(q.q)}</h2></div>
     <div class="ar-opts">${q.o.map((o,k)=>`<button class="ar-opt" data-ar="qa" data-k="${k}">${arEsc(o)}</button>`).join("")}</div>
     <div id="arFb"></div>`);
  arTimer(15,()=>arQAnswer(-1))}
function arQAnswer(k){if(AR.locked)return;AR.locked=true;arStopT();const q=AR.qs[AR.i];const ok=k===q.a;
  if(ok){AR.streak++;AR.score+=10+Math.round(AR.tl)*2}else AR.streak=0;
  document.querySelectorAll(".ar-opt").forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add("ok");else if(j===k)b.classList.add("bad")});
  const fb=document.getElementById("arFb");
  if(fb)fb.innerHTML=`<div class="ar-note ${ok?"good":"bad"}"><b>${ok?"Correct!":(k<0?"Time's up!":"Not quite.")}</b> ${arEsc(q.e)}</div><div style="height:12px"></div><button class="ar-go" data-ar="next" style="width:100%">Next →</button>`}
function arNext(){if(AR.mode==="quiz"||AR.mode==="odd"||AR.mode==="traps"){AR.i++;arQuiz()}else if(AR.mode==="fill"){AR.i++;arFill()}else if(AR.mode==="order"){AR.i++;arOrder()}}

/* guess the word */
function arGuess(){const w=AR.word.w;const lost=AR.guessed.filter(c=>!w.includes(c)).length;AR.lives=Math.max(0,6-lost);
  if(AR.lives<=0)return;
  arSet(arTop("Guess the Word",`${AR.lives} lives`)+
    `<div class="ar-ring-wrap">${arRing()}</div>
     <div class="ar-card"><p class="ar-kicker">Hint</p><p class="ar-hint">${arEsc(AR.word.h)}</p>
       <div class="ar-slots">${[...w].map(ch=>`<span class="ar-slot">${AR.guessed.includes(ch)?arEsc(ch):""}</span>`).join("")}</div>
       <div class="ar-lives">${Array.from({length:6},(_,k)=>`<i class="${k<AR.lives?"":"off"}"></i>`).join("")}</div></div>
     <div class="ar-keys">${"abcdefghijklmnopqrstuvwxyz".split("").map(c=>{const hit=AR.guessed.includes(c);const cls=hit?(w.includes(c)?"hit":"miss"):"";return`<button class="ar-key ${cls}" data-ar="letter" data-l="${c}" ${hit?"disabled":""}>${c.toUpperCase()}</button>`}).join("")}</div>`);
  if(!AR.iv)arTimer(90,()=>arGuessEnd(false));else arTick()}
function arLetter(l){if(!AR.word||AR.guessed.includes(l))return;AR.guessed.push(l);const w=AR.word.w;
  if(!w.includes(l)){const lost=AR.guessed.filter(c=>!w.includes(c)).length;if(6-lost<=0){arGuessEnd(false);return}}
  if([...w].every(c=>AR.guessed.includes(c))){arGuessEnd(true);return}
  arGuess()}
function arGuessEnd(win){arStopT();const s=win?Math.round(AR.tl)*2+AR.lives*10:0;
  arEnd("guess",s,240,win?"You got it!":`The word was “${AR.word.w}”.`)}

/* fill the gap */
function arFill(){if(AR.i>=AR.items.length)return arEnd("fill",AR.score,AR.items.length*40);
  const it=AR.items[AR.i];AR.locked=false;
  arSet(arTop("Fill the Gap",`${AR.i+1} / ${AR.items.length} · ${AR.score} pts`)+arBar(AR.i/AR.items.length)+
    `<div class="ar-ring-wrap">${arRing()}</div>
     <div class="ar-card"><p class="ar-kicker">Type the missing word or form</p><h2>${arEsc(it.s).replace("___",'<span class="ar-blank"></span>')}</h2><p class="ar-hint">Hint: ${arEsc(it.h)}</p></div>
     <div class="ar-inrow"><input id="arIn" class="ar-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer"><button class="ar-go" data-ar="fillgo">Check</button></div>
     <div id="arFb"></div>`);
  arTimer(25,()=>arFillAns(null));setTimeout(()=>{const n=document.getElementById("arIn");if(n)n.focus()},60)}
function arFillAns(v){if(AR.locked)return;AR.locked=true;arStopT();const it=AR.items[AR.i];
  const ok=v!=null&&it.a.some(x=>arNorm(x)===arNorm(v));
  if(ok){AR.streak++;AR.score+=15+Math.round(AR.tl)}else AR.streak=0;
  const inp=document.getElementById("arIn");if(inp){inp.disabled=true;if(!ok)inp.style.animation="arShake .4s ease"}
  const fb=document.getElementById("arFb");
  if(fb)fb.innerHTML=`<div class="ar-note ${ok?"good":"bad"}"><b>${ok?"Correct!":(v==null?"Time's up!":"Not quite.")}</b> ${ok?"":"Answer: <b>"+arEsc(it.a[0])+"</b>"}</div><div style="height:12px"></div><button class="ar-go" data-ar="next" style="width:100%">Next →</button>`}

/* word order */
function arOrder(){if(AR.i>=AR.items.length)return arEnd("order",AR.score,AR.items.length*65);
  const it=AR.items[AR.i];AR.locked=false;AR.pool=arShuf(it.w);AR.ans=[];arTimer(45,()=>arOCheck(true));arDrawOrder()}
function arDrawOrder(){const it=AR.items[AR.i];
  arSet(arTop("Word Order",`${AR.i+1} / ${AR.items.length} · ${AR.score} pts`)+arBar(AR.i/AR.items.length)+
    `<div class="ar-ring-wrap">${arRing()}</div>
     <div class="ar-card"><p class="ar-kicker">Put the words in the right order</p>
       <div class="ar-answer"><div class="ar-chips">${AR.ans.map((w,k)=>`<button class="ar-chip" data-ar="unpick" data-k="${k}">${arEsc(w)}</button>`).join("")||`<span class="ar-hint">Tap the words below…</span>`}</div></div>
       <div class="ar-chips">${AR.pool.map((w,k)=>`<button class="ar-chip" data-ar="pick" data-k="${k}">${arEsc(w)}</button>`).join("")}</div>
       <div class="ar-inrow" style="justify-content:center"><button class="ar-go ghost" data-ar="oclear">Clear</button><button class="ar-go" data-ar="ocheck">Check</button></div>
     </div><div id="arFb"></div>`);
  arTick()}
function arPick(k){if(AR.locked)return;AR.ans.push(AR.pool.splice(k,1)[0]);arDrawOrder()}
function arUnpick(k){if(AR.locked)return;AR.pool.push(AR.ans.splice(k,1)[0]);arDrawOrder()}
function arOCheck(timeout){if(AR.locked)return;AR.locked=true;arStopT();const it=AR.items[AR.i];
  const ok=!timeout&&arNorm(AR.ans.join(" "))===arNorm(it.a);
  if(ok){AR.streak++;AR.score+=20+Math.round(AR.tl)*2}else AR.streak=0;
  const fb=document.getElementById("arFb");
  if(fb)fb.innerHTML=`<div class="ar-note ${ok?"good":"bad"}"><b>${ok?"Perfect!":(timeout?"Time's up!":"Not quite.")}</b> ${ok?"":"Correct order: <b>"+arEsc(it.a)+"</b>"}</div><div style="height:12px"></div><button class="ar-go" data-ar="next" style="width:100%">Next →</button>`}

/* flashcards */
function arCards(){if(!AR.deck.length)return arEnd("cards",AR.known,AR.total);
  const c=AR.deck[0];
  arSet(arTop("Flashcards",`${AR.known} / ${AR.total} learned`)+arBar(AR.known/AR.total)+
    `<div class="ar-scene"><div class="ar-card3d" id="arCard" data-ar="flip">
       <div class="ar-face front"><span class="ar-kicker">English</span><h2>${arEsc(c[0])}</h2><small>Tap to flip</small></div>
       <div class="ar-face back"><span class="ar-kicker">Meaning</span><h2>${arEsc(c[1])}</h2><p>${arEsc(c[2])}</p></div>
     </div></div>
     <div class="ar-inrow" style="justify-content:center"><button class="ar-go ghost" data-ar="again">Again</button><button class="ar-go" data-ar="know">I know it</button></div>`)}

/* beat the clock */
function arClock(){const q=AR.qs[AR.i%AR.qs.length];
  arSet(arTop("Beat the Clock",`${AR.score} correct`)+
    `<div class="ar-ring-wrap">${arRing()}</div>
     <div class="ar-card"><p class="ar-kicker">Fast! One tap, next question</p><h2>${arEsc(q.q)}</h2></div>
     <div class="ar-opts">${q.o.map((o,k)=>`<button class="ar-opt" data-ar="ck" data-k="${k}">${arEsc(o)}</button>`).join("")}</div>`);
  arTick()}
function arClockAns(k){const q=AR.qs[AR.i%AR.qs.length];if(k===q.a)AR.score++;AR.i++;arClock()}

/* end */
function arEnd(mode,score,max,msg){arStopT();AR.mode=null;
  const prev=AR.best[mode];if(prev==null||score>prev){AR.best[mode]=score;try{localStorage.setItem("ar_best",JSON.stringify(AR.best))}catch(e){}}
  arSubmit(mode,score);AR.boardMode=mode;
  const f=max?score/max:1;const stars=f>=0.85?3:f>=0.5?2:1;
  const names={quiz:"Quiz Blitz",guess:"Guess the Word",fill:"Fill the Gap",order:"Word Order",cards:"Flashcards",clock:"Beat the Clock",odd:"Odd One Out",traps:"Grammar Traps"};
  const label=mode==="cards"?"cards learned":mode==="clock"?"correct answers":"points";
  const conf=stars>=2?`<div class="ar-confetti">${Array.from({length:36},(_,k)=>`<i style="left:${(k*37)%100}%;animation-delay:${((k%7)*0.18).toFixed(2)}s;background:${["#5EEAD4","#818CF8","#F472B6","#FBBF24"][k%4]}"></i>`).join("")}</div>`:"";
  arSet(arTop(names[mode]||"Arena","")+
    `<div class="ar-end">${conf}<div class="ar-trophy">${arIc("trophy")}</div>
      <h2>${stars===3?"Brilliant!":stars===2?"Well done!":"Keep going!"}</h2>
      <div class="ar-score"><b>${score}</b><small>${label}</small></div>
      ${msg?`<p class="ar-hint">${arEsc(msg)}</p>`:""}
      <div class="ar-stars">${"★".repeat(stars)}${"☆".repeat(3-stars)}</div>
      <p class="ar-hint">Best: ${AR.best[mode]}</p>
      <div class="ar-inrow" style="justify-content:center;flex-wrap:wrap">
        <button class="ar-go" data-ar="start" data-m="${mode}">Play again</button>
        <button class="ar-go ghost" data-ar="board">Class board</button>
        <button class="ar-go ghost" data-ar="home">Arena</button></div></div>`)}

/* clicks */
function arClick(e){const b=e.target.closest&&e.target.closest("[data-ar]");if(!b)return;const a=b.dataset.ar;
  if(a.indexOf("bt-")===0)return btClick(b);
  if(a==="close")return arClose();
  if(a==="home")return arHome();
  if(a==="start")return arPlay(b.dataset.m);
  if(a==="qa")return arQAnswer(+b.dataset.k);
  if(a==="next")return arNext();
  if(a==="letter")return arLetter(b.dataset.l);
  if(a==="fillgo"){if(!AR.locked)arFillAns((document.getElementById("arIn")||{}).value||"");return}
  if(a==="pick")return arPick(+b.dataset.k);
  if(a==="unpick")return arUnpick(+b.dataset.k);
  if(a==="oclear"){if(AR.locked)return;AR.pool=AR.pool.concat(AR.ans);AR.ans=[];return arDrawOrder()}
  if(a==="ocheck"){if(!AR.locked)arOCheck(false);return}
  if(a==="flip"){const c=document.getElementById("arCard");if(c)c.classList.toggle("flip");return}
  if(a==="know"){AR.known++;AR.deck.shift();return arCards()}
  if(a==="again"){AR.deck.push(AR.deck.shift());return arCards()}
  if(a==="ck")return arClockAns(+b.dataset.k);
  if(a==="level"){AR.level=b.dataset.l;try{localStorage.setItem("ar_level",AR.level)}catch(e){}return arHome()}
  if(a==="board")return arBoardView(AR.boardMode||"quiz");
  if(a==="boardmode")return arBoardView(b.dataset.m)}

/* class board: one best score per student and game, shared through Supabase (see supabase/arena.sql) */
async function arSubmit(mode,score){try{const sb=window.__sb;if(!sb)return;
  const {error}=await sb.rpc("arena_submit",{p_mode:mode,p_score:Math.max(0,Math.min(100000,Math.round(score)))});if(error)throw error}
  catch(e){console.warn("arena submit",e)}}
async function arBoardView(mode){AR.boardMode=mode;const names={quiz:"Quiz Blitz",guess:"Guess the Word",fill:"Fill the Gap",order:"Word Order",cards:"Flashcards",clock:"Beat the Clock",odd:"Odd One Out",traps:"Grammar Traps"};
  const tabs=AR_MODES.map(m=>`<button class="${m.id===mode?"on":""}" data-ar="boardmode" data-m="${m.id}">${arEsc(m.t)}</button>`).join("");
  arSet(arTop("Class board","")+`<div class="ar-seg ar-seg-wrap">${tabs}</div><div class="ar-card" id="arBoard"><p class="ar-hint">Loading…</p></div>`);
  let rows=null,err="";
  try{const sb=window.__sb;if(!sb)throw new Error("offline");const {data,error}=await sb.rpc("arena_board",{p_mode:mode});if(error)throw error;rows=data||[]}
  catch(e){err="The class board is not set up yet. Ask your teacher to run supabase/arena.sql."}
  if(AR.boardMode!==mode)return;
  const box=document.getElementById("arBoard");if(!box)return;
  if(err){box.innerHTML=`<p class="ar-hint">${arEsc(err)}</p>`;return}
  if(!rows.length){box.innerHTML=`<p class="ar-kicker">${arEsc(names[mode]||"")}</p><p class="ar-hint">No scores yet. Be the first on the board!</p>`;return}
  box.innerHTML=`<p class="ar-kicker">${arEsc(names[mode]||"")} · top ${rows.length}</p>`+rows.map((r,i)=>`
    <div class="ar-row ${r.me?"me":""}"><span class="ar-rank r${i<3?i+1:""}">${i+1}</span><b>${arEsc(r.name||"Student")}</b><span class="ar-rs">${r.score}</span></div>`).join("")}

/* the entry point: a floating button once the app is up */
arRoot();arFab();

/* ---------- levels and class board styling ---------- */
{const st=document.createElement("style");st.id="arcss2";st.textContent=`
.ar-tools{display:grid;gap:12px;justify-items:center;margin-top:4px}
.ar-seg{display:inline-flex;padding:4px;border-radius:999px;background:rgba(8,10,28,.6);border:1px solid rgba(160,172,255,.22);gap:2px;flex-wrap:wrap;justify-content:center}
.ar-seg button{border:0;background:transparent;color:#AEB8DC;font:inherit;font-weight:800;font-size:.85rem;padding:9px 16px;border-radius:999px;cursor:pointer}
.ar-seg button.on{background:linear-gradient(120deg,#5EEAD4,#818CF8);color:#06201C;box-shadow:0 8px 18px -8px rgba(94,234,212,.9),inset 0 1px 0 rgba(255,255,255,.5)}
.ar-seg-wrap{width:100%;justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap}
.ar-seg-wrap button{white-space:nowrap}
.ar-row{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(160,172,255,.14);animation:arIn .4s cubic-bezier(.2,.8,.2,1) both}
.ar-row.me{border-color:rgba(94,234,212,.6);background:rgba(94,234,212,.1)}
.ar-rank{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;font-weight:900;background:rgba(255,255,255,.08);color:#C9D2F2}
.ar-rank.r1{background:linear-gradient(135deg,#FDE68A,#F59E0B);color:#451A03;box-shadow:0 0 16px rgba(251,191,36,.6)}
.ar-rank.r2{background:linear-gradient(135deg,#E5E7EB,#9CA3AF);color:#111827}
.ar-rank.r3{background:linear-gradient(135deg,#FDBA74,#B45309);color:#fff}
.ar-row b{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ar-rs{font-weight:900;font-variant-numeric:tabular-nums;color:#8EF6E4;font-size:1.1rem}
`;document.head.appendChild(st)}
