/* =====================================================================
   v5 · Beaucoup plus de questions pour l'Arena et les battles.
   Les questions sont fabriquées à partir de listes (verbes irréguliers,
   vocabulaire, pluriels, comparatifs, prépositions, formation des mots,
   phrasal verbs, conditionnels). Le tirage est déterministe : tous les
   téléphones ont la même banque, donc le défi du jour reste identique.
   ===================================================================== */
{
  let seed=20261015;
  const rnd=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296};
  const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const seen=new Set((typeof AR_Q!=="undefined"?AR_Q:[]).map(x=>x.q));
  const add=(lv,q,correct,pool,e)=>{
    if(seen.has(q))return;
    const d=shuf(pool.filter((x,i,arr)=>x!==correct&&arr.indexOf(x)===i)).slice(0,3);
    if(d.length<3)return;
    const o=shuf([correct,...d]);seen.add(q);
    AR_Q.push({lv:lv,q:q,o:o,a:o.indexOf(correct),e:e});
  };

  /* 1 · verbes irréguliers : prétérit et participe passé */
  const V=[
    ["go","went","gone","","Yesterday, we ___ to the beach.","The bus has already ___ away."],
    ["come","came","come","","Last night, my friends ___ to my house.","Ama has just ___ back from Lomé."],
    ["see","saw","seen","","This morning I ___ a big bird.","I have never ___ such a beautiful sunset."],
    ["take","took","taken","","She ___ a taxi to the station.","Who has ___ my pen?"],
    ["make","made","made","","They ___ a delicious soup for lunch.","This cake was ___ in ten minutes."],
    ["eat","ate","eaten","","We ___ fufu at my grandmother's house.","Have you ever ___ snails?"],
    ["drink","drank","drunk","","The children ___ all the water.","He has ___ too much coffee today."],
    ["write","wrote","written","","My sister ___ a long letter to Jack.","This poem was ___ by a Togolese poet."],
    ["read","read","read","","I ___ a good book last week.","She has already ___ the whole novel."],
    ["speak","spoke","spoken","","The teacher ___ slowly so that we understand.","Two languages are ___ in my family."],
    ["buy","bought","bought","","My father ___ a new bicycle.","We have ___ enough bread for the week."],
    ["bring","brought","brought","","Kofi ___ his lunch to school.","Who has ___ the keys?"],
    ["catch","caught","caught","","The fisherman ___ a huge fish.","The thief was ___ by the police."],
    ["teach","taught","taught","","Mr Mensah ___ us English last year.","She has ___ mathematics for ten years."],
    ["think","thought","thought","","I ___ about your idea all night.","I have ___ about it a lot."],
    ["find","found","found","","We ___ a wallet on the road.","The police have ___ the missing boy."],
    ["give","gave","given","","Grandmother ___ us some mangoes.","This gift was ___ to me by my teacher."],
    ["know","knew","known","","I ___ the answer as soon as you asked.","He has ___ her since childhood."],
    ["begin","began","begun","","The rain ___ at noon.","The lesson has already ___ ."],
    ["break","broke","broken","","The boy ___ the window with a ball.","My phone has been ___ since Monday."],
    ["choose","chose","chosen","","She ___ the blue dress.","You have been ___ for the final round."],
    ["drive","drove","driven","","My uncle ___ us to Kpalimé.","Have you ever ___ a truck?"],
    ["fly","flew","flown","","The birds ___ south in winter.","The plane has ___ to Paris today."],
    ["forget","forgot","forgotten","","I ___ my homework at home.","I have ___ her phone number."],
    ["grow","grew","grown","","The maize ___ very fast this year.","My little brother has ___ a lot."],
    ["hear","heard","heard","","We ___ a strange noise at night.","I have ___ that news before."],
    ["hold","held","held","","She ___ her baby carefully.","The meeting was ___ in the big hall."],
    ["keep","kept","kept","","He ___ the receipt in his wallet.","They have ___ their promise."],
    ["lose","lost","lost","","I ___ my way in the market.","She has ___ her umbrella again."],
    ["meet","met","met","","We ___ our teacher at the church.","I have never ___ the mayor."],
    ["pay","paid","paid","","Dad ___ the bill yesterday.","The shop has ___ all its workers."],
    ["run","ran","run","","The dog ___ after the car.","He has ___ five kilometres already."],
    ["say","said","said","","The doctor ___ I must rest.","Nobody has ___ anything yet."],
    ["sell","sold","sold","","The trader ___ all his mangoes.","This house has been ___ twice."],
    ["send","sent","sent","","I ___ a message to my cousin.","She has ___ the documents by email."],
    ["sing","sang","sung","","The choir ___ beautifully at the wedding.","Have you ever ___ in public?"],
    ["sit","sat","sat","","We ___ under the big tree.","The cat has ___ on my chair all day."],
    ["sleep","slept","slept","","The baby ___ for three hours.","I have not ___ well this week."],
    ["win","won","won","","Our team ___ the match.","She has ___ three prizes this year."],
    ["wear","wore","worn","","He ___ a blue shirt to school.","The shoes are badly ___ ."],
    ["swim","swam","swum","","The children ___ in the lake.","Have you ever ___ across the river?"],
    ["understand","understood","understood","","I ___ the lesson perfectly.","She has ___ the rule now."],
    ["tell","told","told","","He ___ us a funny story.","I have ___ you the truth."],
    ["feel","felt","felt","","I ___ tired after the match.","She has ___ better since Monday."],
    ["leave","left","left","","The train ___ at six.","We have ___ the keys on the table."],
    ["spend","spent","spent","","We ___ two hours at the market.","He has ___ all his money."],
    ["build","built","built","","They ___ a new school in the village.","This bridge was ___ in 1990."],
    ["fall","fell","fallen","","The mango ___ from the tree.","The leaves have ___ early this year."],
    ["hide","hid","hidden","","The kittens ___ under the bed.","The treasure has been ___ for years."]
  ];
  const forms=v=>{const b=v[0];const ing=b.endsWith("e")?b.slice(0,-1)+"ing":b+"ing";const sg=/(o|s|x|ch|sh)$/.test(b)?b+"es":/[^aeiou]y$/.test(b)?b.slice(0,-1)+"ies":b+"s";return[b,v[1],v[2],sg,ing]};
  V.forEach(v=>{
    const f=forms(v);
    add(1,v[4].replace("___","_____")+` (${v[0]})`,v[1],f,`Past simple of "${v[0]}" is "${v[1]}".`);
    add(2,v[5].replace("___","_____")+` (${v[0]})`,v[2],f,`Past participle of "${v[0]}" is "${v[2]}" (have/has + ${v[2]}, or passive).`);
  });

  /* 3 · contraires */
  const A=[["big","small"],["hot","cold"],["old","new"],["long","short"],["tall","short"],["fast","slow"],["happy","sad"],["easy","difficult"],["early","late"],["open","closed"],["full","empty"],["rich","poor"],["strong","weak"],["clean","dirty"],["cheap","expensive"],["right","wrong"],["up","down"],["inside","outside"],["buy","sell"],["love","hate"],["win","lose"],["arrive","leave"],["begin","end"],["always","never"],["heavy","light"],["wet","dry"],["hard","soft"],["young","old"],["near","far"],["loud","quiet"]];
  A.forEach(([x,y])=>{
    add(1,`What is the opposite of "${x}"?`,y,A.map(p=>p[1]),`The opposite of "${x}" is "${y}".`);
    add(1,`What is the opposite of "${y}"?`,x,A.map(p=>p[0]),`The opposite of "${y}" is "${x}".`);
  });

  /* 4 · pluriels irréguliers et réguliers */
  const P=[["child","children"],["man","men"],["woman","women"],["tooth","teeth"],["foot","feet"],["mouse","mice"],["person","people"],["knife","knives"],["leaf","leaves"],["city","cities"],["baby","babies"],["bus","buses"],["dish","dishes"],["watch","watches"],["potato","potatoes"],["box","boxes"],["day","days"],["country","countries"]];
  P.forEach(([s,p])=>add(1,`The plural of "${s}" is ___.`,p,P.map(x=>x[1]),`The plural of "${s}" is "${p}".`));

  /* 5 · comparatifs et superlatifs */
  const C=[["big","bigger","biggest"],["small","smaller","smallest"],["tall","taller","tallest"],["fast","faster","fastest"],["hot","hotter","hottest"],["happy","happier","happiest"],["good","better","best"],["bad","worse","worst"],["far","farther","farthest"],["easy","easier","easiest"],["heavy","heavier","heaviest"],["early","earlier","earliest"],["late","later","latest"],["cheap","cheaper","cheapest"],["clever","cleverer","cleverest"],["strong","stronger","strongest"]];
  const CC=[["expensive","more expensive","most expensive"],["beautiful","more beautiful","most beautiful"],["interesting","more interesting","most interesting"],["difficult","more difficult","most difficult"],["important","more important","most important"]];
  const all=C.concat(CC);
  all.forEach(([b,c,s])=>{
    const pool=[b,c,s,...all.map(x=>x[1])];
    add(2,`My bag is ___ than yours.`.replace("___","_____")+` (${b})`,c,pool,`Comparative of "${b}": "${c}".`);
    add(2,`Of all my friends, Kofi is the ___. (${b})`,s,[b,c,s,...all.map(x=>x[2])],`Superlative of "${b}": "${s}" (the + superlative).`);
  });

  /* 6 · prépositions de temps */
  const T=[["Monday","on"],["Sunday","on"],["July","in"],["2030","in"],["7 o'clock","at"],["midnight","at"],["the morning","in"],["Christmas Day","on"]];
  T.forEach(([x,p])=>add(1,`We will meet ___ ${x}.`,p,["in","on","at","under"],`We use "${p}" with ${x}.`));

  /* 7 · formation des noms */
  const N=[["happy","happiness"],["kind","kindness"],["decide","decision"],["create","creation"],["achieve","achievement"],["differ","difference"],["invent","invention"],["educate","education"],["act","action"],["friend","friendship"],["employ","employment"],["improve","improvement"],["produce","production"],["prefer","preference"],["hope","hope"],["govern","government"]];
  N.forEach(([b,n])=>add(2,`Form a noun from "${b}": ___`,n,N.map(x=>x[1]),`The noun from "${b}" is "${n}".`));

  /* 8 · phrasal verbs */
  const PV=[
    ["Please ___ the radio; I'm trying to study.","turn down",["turn down","turn up","turn on","turn off"]],
    ["I can't ___ this word. Can you help me?","figure out",["figure out","find out","point out","pick out"]],
    ["We have to ___ the meeting until next week.","put off",["put off","put on","put out","put up"]],
    ["She decided to ___ smoking last year.","give up",["give up","give in","give out","give away"]],
    ["Could you ___ my bag while I buy some water?","look after",["look after","look for","look into","look up"]],
    ["The plane will ___ at six o'clock.","take off",["take off","take on","take in","take over"]],
    ["He ___ his coat and sat down.","took off",["took off","took on","took in","took up"]],
    ["Don't ___ your homework until tomorrow.","put off",["put off","put on","put out","put down"]],
    ["The teacher ___ the exam papers to the class.","handed out",["handed out","handed in","handed over","handed down"]],
    ["Please ___ the lights when you leave the room.","turn off",["turn off","turn on","turn up","turn down"]],
    ["I ___ an old friend at the market yesterday.","ran into",["ran into","ran out","ran over","ran away"]],
    ["Our school will ___ a new library next year.","set up",["set up","set off","set out","set down"]]
  ];
  PV.forEach(([q,a,o])=>add(3,q,a,o,`"${a}" fits the meaning of the sentence.`));

  /* 9 · conditionnels */
  const CD=[
    ["If it rains tomorrow, I ___ at home.","will stay",["will stay","stayed","would stay","stay"],2,"First conditional: if + present, will + verb."],
    ["If you study hard, you ___ the exam.","will pass",["will pass","passed","would pass","pass"],2,"First conditional: if + present, will + verb."],
    ["If I had more time, I ___ you more often.","would visit",["would visit","will visit","visited","visit"],2,"Second conditional: if + past, would + verb."],
    ["If she were rich, she ___ a car.","would buy",["would buy","will buy","bought","buys"],2,"Second conditional: if + past, would + verb."],
    ["If we had left earlier, we ___ the bus.","would have caught",["would have caught","will catch","caught","catch"],3,"Third conditional: if + had + pp, would have + pp."],
    ["If he had studied, he ___ the test.","would have passed",["would have passed","will pass","passed","pass"],3,"Third conditional: if + had + pp, would have + pp."],
    ["If I had known about it, I ___ you.","would have helped",["would have helped","will help","helped","help"],3,"Third conditional: if + had + pp, would have + pp."],
    ["If they had called me, I ___ them back.","would have called",["would have called","will call","called","call"],3,"Third conditional: if + had + pp, would have + pp."]
  ];
  CD.forEach(([q,a,o,lv,e])=>add(lv,q,a,o,e));

  /* 10 · modaux et règles */
  const MD=[
    ["You ___ smoke in this classroom. It is forbidden.","mustn't",["mustn't","don't have to","needn't","might not"],2,"Mustn't = it is forbidden."],
    ["You ___ come tomorrow if you are busy. It is optional.","needn't",["needn't","mustn't","can't","shouldn't have"],2,"Needn't = it is not necessary."],
    ["Ama ___ speak three languages. She is very talented.","can",["can","must","should have","might have to"],1,"Can = ability."],
    ["It's raining. You ___ take an umbrella.","should",["should","shouldn't","must not","wouldn't"],1,"Should = advice."],
    ["She ___ be at home now; her light is on.","must",["must","mustn't","wouldn't","couldn't have"],2,"Must = strong deduction."],
    ["He ___ have left already. His car is still here.","can't",["can't","must","should","might"],3,"Can't = impossibility, a strong deduction."]
  ];
  MD.forEach(([q,a,o,lv,e])=>add(lv,q,a,o,e));

  /* 11 · niveau avancé : voix passive, discours indirect, inversions */
  const AD=[
    ["The report ___ by the manager yesterday.",  "was written", ["was written","wrote","written","has written"], "Passive past simple: was + past participle."],
    ["He said that he ___ the film the day before.","had seen",["had seen","has seen","saw","would see"],"Reported speech: present perfect becomes past perfect."],
    ["Not until she called ___ he realise his mistake.","did",["did","was","had","does"],"Inversion after 'not until': did + subject + verb."],
    ["Had I ___ about the delay, I would have warned you.","known",["known","know","knowing","knew"],"Inverted third conditional: had + subject + past participle."],
    ["The students ___ their projects since Monday.","have been working",["have been working","are working","worked","had worked"],"Present perfect continuous with 'since'."],
    ["I wish I ___ harder when I was at school.","had studied",["had studied","studied","would study","study"],"'I wish' + past perfect expresses a regret about the past."],
    ["She suggested that he ___ the doctor immediately.","see",["see","sees","saw","will see"],"After 'suggest that', use the base form."],
    ["It is high time we ___ home.","went",["went","go","going","have gone"],"'It is high time' + past simple."],
    ["No sooner had we left the house ___ the rain started.","than",["than","when","as","then"],"No sooner ... than."],
    ["Rarely ___ such a beautiful view.","have I seen",["have I seen","I have seen","did I see","I saw"],"Inversion after 'rarely'."],
    ["Were it not for the rain, we ___ to the match.","would have gone",["would have gone","will go","went","go"],"Mixed conditional: a present condition with a past result."],
    ["He is said ___ the richest man in the town.","to be",["to be","being","be","to being"],"Passive reporting structure: is said to be."]
  ];
  AD.forEach(([q,a,o,e])=>add(3,q,a,o,e));
}
