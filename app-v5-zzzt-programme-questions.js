/* =====================================================================
   v5 · Questions tirées des programmes imprimés (Seconde, Première,
   Terminale). Une banque déterministe : mêmes questions et même ordre
   sur tous les téléphones. Les options sont mélangées avec une graine
   fixe. Chaque question est écrite à la main.
   ===================================================================== */
{
  let seed=20261016;
  const rnd=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296};
  const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const seen=new Set((typeof AR_Q!=="undefined"?AR_Q:[]).map(x=>x.q));
  const add=(lv,q,correct,wrong,e)=>{
    if(seen.has(q))return;
    const d=wrong.filter((x,i,arr)=>x!==correct&&arr.indexOf(x)===i).slice(0,3);
    if(d.length<3)return;
    const o=shuf([correct,...d]);seen.add(q);
    AR_Q.push({lv:lv,q:q,o:o,a:o.indexOf(correct),e:e});
  };

  /* ---------- SECONDE · S1 Chieftaincy in Togo ---------- */
  add(2,"If it rains tomorrow, the chief _____ the meeting in the palace.","will hold",["holds","held","would hold"],"First conditional: if + present simple, will + verb.");
  add(2,"If the elders _____ the case carefully, the people will accept the decision.","study",["studies","studied","will study"],"First conditional: if + present simple, will + verb.");
  add(2,"If I were the chief, I _____ the trial fairly.","would judge",["will judge","judged","judge"],"Second conditional: if + past simple, would + verb.");
  add(2,"If the villagers _____ more time, they would visit the royal palace.","had",["have","will have","would have"],"Second conditional: if + past simple (had), would + verb.");
  add(2,"_____ the chief was old, he still ruled the village with wisdom.","Although",["Because","Unless","So"],"Although introduces a concession: it means 'despite the fact that'.");
  add(2,"Even though the king was tired, he _____ the ceremony.","attended",["attends","attending","will attend"],"Even though + past simple, then a past simple verb in the main clause.");
  add(2,"_____ the trial was long, the people listened until the end.","Though",["Unless","Because","So that"],"Though is a concessive conjunction, like although.");
  add(2,"What is 'chieftaincy'?","the system in which a traditional chief rules a community",["a modern court of justice", "a central government office", "a traditional wedding ceremony"],"Chieftaincy is the system of traditional chiefs.");
  add(2,"What is a 'royal court'?","the place where a king holds his council and trials",["a royal market", "a royal school", "a royal village"],"A royal court is where a king rules and holds trials.");
  add(2,"If you _____ the rules of the palace, you will be punished.","break",["will break","broke","would break"],"First conditional: if + present simple, will + verb.");
  add(2,"What is an 'elder' in a village?","a respected older member of the community",["a child", "a stranger", "a hunter"],"An elder is a respected older member of the community.");
  add(2,"Choose the correct sentence.","If the chief were wise, the people would be happy.",["If the chief would be wise, the people would be happy.","If the chief is wise, the people is happy.","If the chief was wise, the people would happy."],"Second conditional: if + were, would + base verb.");
  add(2,"If we _____ together, we will solve the conflict.","unite",["united","will unite","would unite"],"First conditional: if + present simple, will + verb.");
  add(2,"What does 'to rule' mean?","to govern",["to judge", "to punish", "to elect"],"To rule means to govern.");

  /* ---------- SECONDE · S2 Chieftaincy in Africa ---------- */
  add(2,"If the chiefs _____ together, they can solve many conflicts.","work",["worked","working","would work"],"First conditional: if + present simple, can + verb.");
  add(2,"If the young people _____ the traditions, the villages will lose their identity.","forget",["forgot","forgetting","would forget"],"First conditional: if + present simple, will + verb.");
  add(2,"If the king had listened to his advisers, the war _____ avoided.","would have been",["will be","is","was"],"Third conditional: if + had + past participle, would have + past participle.");
  add(2,"Even though he was powerful, the chief _____ to the elders.","listened",["listen","will listen","listening"],"Even though + past simple in the main clause, past simple for narration.");
  add(2,"Though the colonial period was hard, the chiefs _____ their authority.","kept",["keep","will keep","keeping"],"Though + past simple, then past simple in the main clause.");
  add(2,"What does 'weakness' mean?","lack of strength",["great wealth", "great wisdom", "good health"],"Weakness is the lack of strength.");
  add(2,"What is the opposite of 'strength'?","weakness",["power","wisdom","pride"],"The opposite of strength is weakness.");
  add(2,"If the people _____ the king, they would respect him more.","respected",["respect","will respect","respecting"],"Second conditional: if + past simple, would + verb.");
  add(2,"Which word means 'despite the fact that'?","although",["because", "unless", "so"],"Although means despite the fact that.");
  add(2,"Which phrase is a stronger form of 'although'?","even though",["because of", "so that", "unless"],"Even though is a stronger form of although.");
  add(2,"_____ the chief was sick, he attended the ceremony.","Though",["Unless","Because","So"],"Though is a concessive conjunction.");
  add(2,"Which word means 'good judgment gained from experience'?","wisdom",["weakness", "pride", "trial"],"Wisdom is good judgment gained from experience.");
  add(2,"If the elders _____ their children, the villages would be stronger.","educated",["educate","will educate","educating"],"Second conditional with a past simple verb in the if-clause.");
  add(2,"Choose the correct sentence.","If we unite, we will be stronger.",["If we will unite, we will be stronger.","If we united, we will be stronger.","If we unite, we would be stronger."],"First conditional: if + present simple, will + base verb.");
  add(2,"What is an 'elder' in a village?","a respected older member of the community",["a child", "a stranger", "a hunter"],"An elder is a respected older member of the community.");

  /* ---------- SECONDE · S3 Girls' Education ---------- */
  add(2,"Girls can be _____ clever _____ boys.","as ... as",["more ... than","so ... as","less ... than"],"Equality: as + adjective + as.");
  add(2,"Fatou is _____ than her brother at mathematics.","less good",["more good","gooder","as good"],"Inferiority: less + adjective + than.");
  add(2,"Girls' education is _____ important than ever.","more",["most","much","many"],"Comparative: more + adjective + than.");
  add(2,"Girls' schooling is expensive. _____, it is necessary.","However",["Because","So","Unless"],"However introduces a contrast: 'nevertheless'.");
  add(2,"Girls should go to school, _____?","shouldn't they",["should they","don't they","do they"],"Question tag: positive statement with should, negative tag.");
  add(2,"Mariam is a student, _____?","isn't she",["is she","doesn't she","isn't it"],"Question tag: positive statement with be, negative tag with the pronoun she.");
  add(2,"Boys and girls have the same rights, _____?","don't they",["do they","haven't they","don't we"],"Question tag: positive statement with have, negative tag with do.");
  add(2,"Let's go to school, _____?","shall we",["will we","do we","won't we"],"Let's ... tag is shall we.");
  add(2,"She can't read well, _____?","can she",["can't she","does she","isn't she"],"Negative statement with can, positive tag with can.");
  add(2,"This road is _____ than the one to school.","longer",["more long","longest","as long"],"Comparative of long: longer than.");
  add(2,"She is _____ tall _____ her sister.","as ... as",["so ... that","more ... than","less ... than"],"Equality: as + adjective + as.");
  add(2,"What does 'equality' mean?","the state of being equal",["unfairness", "freedom", "justice"],"Equality is the state of being equal.");
  add(2,"What is a 'household'?","all the people who live together in one home",["a market", "a school", "a river"],"A household is the people who share one home.");
  add(2,"What is the opposite of 'educated'?","uneducated",["educating","educate","education"],"The opposite of educated is uneducated.");

  /* ---------- SECONDE · S4 Women's Place in the Family ---------- */
  add(2,"In many families, women _____ most of the housework.","do",["does","did","doing"],"Present simple with a plural subject: do.");
  add(2,"The husband and the wife _____ the children together.","bring up",["brings up","brought up","bringing up"],"Present simple with a plural subject: bring up.");
  add(2,"What does 'to bring up' (children) mean?","to raise children",["to take something upstairs", "to take something away", "to bring back"],"To bring up children means to raise them.");
  add(2,"Girls should have the same _____ as boys.","rights",["rightful","righting","righteous"],"Rights is the noun meaning 'droits'.");
  add(2,"Women and men _____ share the housework equally.","should",["shouldn't","wouldn't","mustn't have"],"Should expresses advice or what is right.");
  add(2,"What is 'housework'?","the tasks done in the home, like cooking and cleaning",["work in the fields", "office work", "shopping at the market"],"Housework is the daily work done in the home.");
  add(2,"The father _____ make all the decisions alone; the family decides together.","doesn't have to",["mustn't","couldn't","wouldn't"],"Doesn't have to = it is not necessary.");
  add(2,"If the mother _____ outside the home, the children help more with the housework.","works",["worked","will work","working"],"First conditional: if + present simple, the main clause uses the present simple.");
  add(2,"What is the opposite of 'equal'?","unequal",["equally","equality","equalise"],"The opposite of equal is unequal.");
  add(2,"What is a 'stereotype'?","a fixed, often unfair idea about a group of people",["a daily habit", "a rule", "a sport"],"A stereotype is a fixed, often unfair idea about a group.");
  add(2,"Choose the correct sentence.","Women should be respected in the family.",["Women should respected in the family.","Women should be respect in the family.","Women should to be respected in the family."],"Should + be + past participle: passive form.");
  add(2,"She is a clever girl, _____?","isn't she",["is she","doesn't she","isn't it"],"Question tag after a positive statement with is.");
  add(2,"What is the noun form of 'respectful'?","respectfulness",["respectable","respectably","respect"],"The noun form of 'respectful' is 'respectfulness' (respect itself is also a noun, but the question asks the derived form).");
  add(2,"The girls _____ their homework every evening.","do",["does","did","doing"],"Present simple with a plural subject: do.");

  /* ---------- SECONDE · S5 Bushfires and Deforestation ---------- */
  add(2,"The forest _____ by fire last year.","was destroyed",["destroyed","has destroyed","destroys"],"Passive past simple: was + past participle.");
  add(2,"Many trees _____ every year for firewood.","are cut down",["cut down","are cutting down","have cut down"],"Passive present simple: are + past participle.");
  add(2,"What does 'to set fire to' mean?","to start a fire on purpose",["to put out", "to clean", "to plant"],"To set fire to something means to start a fire on it.");
  add(2,"You will not get wood _____ you plant new trees.","unless",["if","when","until"],"Unless = if not.");
  add(2,"We will stop the fire _____ we act now.","unless",["if","until","when"],"Unless = if not. The sentence means 'if we do not act now'.");
  add(2,"The man _____ house burned down is my neighbour.","whose",["who","which","whom"],"Whose shows possession: the man whose house.");
  add(2,"The dumping ground _____ is near the river is dangerous.","which",["who","whose","where"],"Which is used for things; the dumping ground (thing) which is near the river.");
  add(2,"The student _____ wrote the report won a prize.","who",["which","whose","whom"],"Who is used for people as the subject of a relative clause.");
  add(2,"What is 'deforestation'?","cutting down large areas of forest",["planting new forests", "drought", "river pollution"],"Deforestation is the clearing of forests.");
  add(2,"What is a 'bushfire'?","a fire that spreads across grassland or bush",["a flood", "a storm", "a strong wind"],"A bushfire is a fire that spreads across bush or grassland.");
  add(2,"What is a 'dumping ground'?","a place where rubbish is left",["a factory", "a market", "a park"],"A dumping ground is a place where waste is dumped.");
  add(2,"What is the opposite of 'to plant' (trees)?","to cut down",["to water","to grow","to dig"],"To plant trees is the opposite of cutting them down.");
  add(2,"Choose the correct passive sentence.","The rubbish is burned every week.",["The rubbish burns every week.","The rubbish is burning every week by.","The rubbish has burned by every week."],"Passive present simple: is + past participle (burned).");
  add(2,"Choose the correct sentence.","The forest was destroyed by the fire.",["The forest was destroy by the fire.","The forest destroyed by the fire.","The forest was destroyed the fire."],"Passive: was + past participle, with by + agent.");
  add(2,"We will not win the fight _____ we protect the forest.","unless",["if","when","because"],"Unless = if not.");

  /* ---------- SECONDE · S6 Dumping Grounds ---------- */
  add(2,"Dumping grounds _____ the air and the water.","pollute",["polluted","pollutes","will pollute"],"Plural subject with the present simple: pollute.");
  add(2,"Plastic bags _____ slowly in the soil.","decompose",["decomposes","decomposed","decomposing"],"Plural subject with the present simple: decompose.");
  add(2,"What is 'waste'?","materials that are thrown away",["natural resources", "plants", "roads"],"Waste is material that is thrown away.");
  add(2,"The rubbish _____ every day by the workers.","is collected",["collects","collected","has collected"],"Passive present simple.");
  add(2,"The city _____ a new dumping ground next year.","will build",["will be built","builds","built"],"Active future: will + base verb.");
  add(2,"The waste _____ by the wind into the river.","was carried",["carried","has carried","carries"],"Passive past simple: was + past participle.");
  add(2,"What is the opposite of 'clean'?","dirty",["fresh","wet","bright"],"The opposite of clean is dirty.");
  add(2,"What does 'to recycle' mean?","to process used materials so they can be used again",["to throw away", "to burn", "to bury"],"To recycle means to reuse materials.");
  add(2,"People should throw rubbish in the bin, _____?","shouldn't they",["should they","don't they","do they"],"Question tag after should: negative tag.");
  add(2,"If we _____ the rubbish, the town will be clean.","collect",["will collect","collected","collecting"],"First conditional: if + present simple, the main clause uses will.");
  add(2,"What is 'pollution'?","harmful substances that contaminate air, water or soil",["a large population", "a solution", "protection"],"Pollution is harmful substances in the environment.");
  add(2,"Our streets are _____ than before since the workers started cleaning.","cleaner",["more clean","cleanest","the cleaner"],"Comparative of clean: cleaner than.");

  /* ---------- SECONDE · S7 Artificial Intelligence and the Modern Society ---------- */
  add(2,"Artificial intelligence _____ more and more in hospitals, which is a big change.","is being used",["has used","was using","being used"],"Present continuous passive: is being + past participle.");
  add(2,"Computers _____ by engineers in many countries.","are designed",["design","are designing","designed"],"Passive present simple: are + past participle.");
  add(2,"What is 'artificial intelligence'?","computer systems that do tasks which normally need human intelligence",["human intelligence in a city", "ancient technology", "a type of art"],"Artificial intelligence is computer systems doing intelligent tasks.");
  add(2,"What is a 'curriculum vitae'?","a document listing your education and work experience",["a letter asking for a job", "a work contract", "a school report"],"A curriculum vitae (CV) lists your education and experience.");
  add(2,"What does 'e-learning' mean?","learning by internet",["learning in a village","learning by hand","learning in a church"],"E-learning is learning through digital tools and the internet.");
  add(2,"The new software _____ by a young engineer last year.","was developed",["developed","is developing","has developed"],"Passive past simple: was + past participle.");
  add(2,"Choose the correct passive sentence.","The phone is made in a factory.",["The phone makes in a factory.","The phone is making in a factory.","The phone has made in a factory by."],"Passive present simple: is + past participle.");
  add(2,"What is an 'advantage'?","a benefit or positive point",["a disadvantage", "a danger", "a rule"],"An advantage is a benefit.");
  add(2,"What is the opposite of 'advantage'?","disadvantage",["advantageous","advantageously","adventure"],"The opposite of advantage is disadvantage.");
  add(2,"Robots _____ many jobs in the future.","will replace",["replace","will replaced","are replaced"],"Future: will + base verb.");
  add(2,"If the machine _____, the workers will stop the production.","breaks down",["broke down","will break down","breaking down"],"First conditional: if + present simple.");
  add(2,"What is 'phytotherapy'?","treatment using plants",["surgery", "radiotherapy", "psychology"],"Phytotherapy is treatment with plants.");
  add(2,"What is a 'diagnosis'?","identifying the cause of an illness",["a treatment", "a medicine", "a hospital"],"A diagnosis identifies what illness someone has.");
  add(2,"The advantages of AI are _____ than its disadvantages.","more numerous",["more numerously","numerous than","most numerous"],"Comparison of quantity: more numerous than.");

  /* ---------- SECONDE · S8 Phytotherapy and Health ---------- */
  add(2,"Many people _____ plants to treat their illnesses.","use",["uses","are used","used"],"Present simple with a plural subject: use + object.");
  add(2,"The leaves of this plant _____ to cure fever.","are used",["use","are using","used"],"Passive present simple: are + past participle.");
  add(2,"What is a 'remedy'?","a treatment that cures or relieves a problem",["an illness", "a doctor", "a pain in the body"],"A remedy is a treatment for an illness.");
  add(2,"What is a 'symptom'?","a sign that shows you may be ill",["a syrup", "a virus", "a vaccination"],"A symptom is a sign of illness, such as fever.");
  add(2,"What is a 'patient'?","a person receiving medical treatment",["a student", "a friend", "a neighbour"],"A patient is a person under medical care.");
  add(2,"What is a 'vaccine'?","a substance that protects against a disease",["an injection for pain", "a bandage", "a prescription"],"A vaccine protects the body against a disease.");
  add(2,"If you _____ more fruit and vegetables, you will be healthier.","eat",["will eat","ate","eating"],"First conditional: if + present simple, will + verb.");
  add(2,"If I had a headache, I _____ a herbal tea.","would drink",["will drink","drink","drank"],"Second conditional: if + past simple, would + verb.");
  add(2,"Choose the correct sentence.","The doctor was consulted by many people.",["The doctor consulted by many people.","The doctor was consult by many people.","The doctor has been consulted by many people by."],"Passive past simple: was + past participle.");
  add(2,"What is the opposite of 'healthy'?","unhealthy",["healthily","health","healthier"],"The opposite of healthy is unhealthy.");
  add(2,"Herbal medicine is _____ than many modern drugs in some villages.","cheaper",["more cheap","cheapest","the cheap"],"Comparative of cheap: cheaper than.");
  add(2,"People _____ to the hospital when they are seriously ill.","go",["goes","went","going"],"Present simple with a plural subject: go.");
  add(2,"What does 'to heal' mean?","to become well again",["to become ill", "to die", "to suffer"],"To heal means to become well again.");
  add(2,"What is an 'illness'?","a disease or sickness",["good health", "a cure", "a medicine"],"An illness is a disease or sickness.");

  /* ---------- SECONDE · S9 Respect of State Property ---------- */
  add(2,"I wish I _____ the public bus more carefully yesterday.","had treated",["treated","have treated","would treat"],"I wish + past perfect expresses regret about the past.");
  add(2,"If only the people _____ the school building in good condition!","would keep",["keep","kept","will keep"],"If only + would expresses a wish about the present or future.");
  add(2,"I wish I _____ in a clean country.","lived",["live","will live","would live"],"I wish + past simple expresses a wish about the present.");
  add(2,"What is 'state property'?","things owned by the government",["private goods", "markets", "churches"],"State property belongs to the government.");
  add(2,"What is 'patriotism'?","love and loyalty for one's country",["pacifism", "capitalism", "populism"],"Patriotism is love and loyalty for one's country.");
  add(2,"The public buildings _____ by the young men last night.","were damaged",["damaged","have damaged","damage"],"Passive past simple: were + past participle.");
  add(2,"Everybody should respect the national flag, _____?","shouldn't they",["should they","don't they","does everybody"],"Question tag after should, with everybody as subject: they.");
  add(2,"Nobody saw the thief, _____?","did they",["didn't they","did he","do they"],"Nobody takes a positive verb, so the tag is positive, with they.");
  add(2,"Write a formal letter. It should begin with 'Dear Sir', _____ ?","shouldn't it",["should it","doesn't it","will it"],"Question tag after should in the negative.");
  add(2,"What does 'to damage' mean?","to harm or spoil something",["to repair", "to build", "to protect"],"To damage means to harm something.");
  add(2,"What is 'citizenship'?","the legal status of being a member of a country",["foreign nationality", "immigration", "a census"],"Citizenship is membership of a country.");
  add(2,"Choose the correct passive sentence.","The school was built by the government.",["The school built by the government.","The school was build by the government.","The school has built by the government."],"Passive past simple: was + past participle (built).");
  add(2,"What is the opposite of 'to respect'?","to despise",["to obey","to admire","to trust"],"To despise is the opposite of respect.");
  add(2,"I wish the people _____ their country more.","loved",["love","will love","loving"],"I wish + past simple: a wish about the present.");

  /* ---------- SECONDE · S10 Patriotic Acts ---------- */
  add(2,"What is a 'formal letter'?","a letter written in polite, official language",["a love letter", "a postcard", "an oral message"],"A formal letter uses polite, official language.");
  add(2,"Dear Sir, I _____ to inform you about the problem.","am writing",["write","wrote","will write"],"Present continuous for a letter written now.");
  add(2,"Yours _____, Kofi Mensah.","faithfully",["faithful","faithfully as","faithfulness"],"Yours faithfully is used with Dear Sir.");
  add(2,"What does 'to donate' mean?","to give money or things for free",["to steal", "to sell", "to borrow"],"To donate means to give freely.");
  add(2,"The volunteers _____ the street last Sunday.","cleaned",["clean","cleaning","have clean"],"Past simple: cleaned.");
  add(2,"The national anthem _____ every morning at school.","is sung",["sings","is singing","has sung"],"Passive present simple: is + past participle.");
  add(2,"What is the opposite of 'to obey'?","to disobey",["to respect","to follow","to help"],"The opposite of obey is disobey.");
  add(2,"What does 'to celebrate' mean?","to mark a happy event",["to forget", "to criticise", "to forbid"],"To celebrate means to mark a happy occasion.");
  add(2,"If the people _____ their country, they would protect it.","loved",["love","will love","loving"],"Second conditional: if + past simple, would + verb.");
  add(2,"Choose the correct sentence.","The letter was sent yesterday.",["The letter sent yesterday.","The letter was send yesterday.","The letter has sent yesterday by."],"Passive past simple: was + past participle.");

  /* ---------- SECONDE · S11 Land Issues ---------- */
  add(2,"_____ the land and the house, the girl did not receive anything.","Neither ... nor",["Either ... or","Both ... nor","Not only ... but"],"Neither ... nor: correlative conjunction .");
  add(2,"Both the sons _____ the house and the field.","inherited",["inherits","inheriting","have inherit"],"Past simple: inherited.");
  add(2,"_____ the men, the women also have the right to own land.","Not only ... but also",["Either ... or","Neither ... nor","Both ... nor"],"Not only ... but also: correlative conjunction .");
  add(2,"What is 'inheritance'?","property received from a family member who has died",["sharing", "selling", "lending"],"Inheritance is property passed down after a death.");
  add(2,"What is 'a dispute'?","a disagreement or legal argument",["a judgment", "a prize", "a harvest"],"A dispute is a disagreement, often legal.");
  add(2,"If she _____ the land papers, she would have won the case.","had found",["found","has found","would find"],"Third conditional: if + had + past participle, would have + past participle.");
  add(2,"If the widow had signed the paper, she _____ her land.","would have kept",["will keep","kept","keeps"],"Third conditional: would have + past participle.");
  add(2,"If they had asked for help, the court _____ them.","would have helped",["will help","helped","help"],"Third conditional: would have + past participle.");
  add(2,"Neither the mother _____ the daughter could read the document.","nor",["or","and","but"],"Neither ... nor: nor introduces the second part.");
  add(2,"What does 'to denounce' mean?","to publicly accuse someone",["to defend", "to forgive", "to sell"],"To denounce means to accuse publicly.");
  add(2,"What is 'land injustice'?","unfair treatment in the ownership of land",["fair land distribution", "sharing the land", "growing crops"],"Land injustice is unfair treatment over land.");
  add(2,"Either the chief _____ the elders will decide the case.","or",["and","nor","but"],"Either ... or: correlative conjunction .");
  add(2,"If the family had shared the land fairly, the quarrel _____ .","would not have happened",["will not happen","does not happen","had not happened"],"Third conditional: would not have + past participle.");

  /* ---------- SECONDE · S12 The Value of Traditional Arts in Togo ---------- */
  add(2,"_____ you like the mask or not, it is part of our culture.","No matter whether",["No matter what","No matter where","No matter how"],"No matter whether: it doesn't matter if.");
  add(2,"_____ where you go in Togo, you will find traditional art.","No matter",["However","Unless","Even"],"No matter where = wherever; the phrase introduces an indifference.");
  add(2,"She said, 'I am making a drum.' She said that she _____ a drum.","was making",["is making","makes","made"],"Direct to reported speech: present continuous becomes past continuous.");
  add(2,"He said, 'We will sing tonight.' He said they _____ that night.","would sing",["will sing","sing","sang"],"Direct to reported speech: will becomes would.");
  add(2,"'Where is the museum?' she asked me. She asked me _____ the museum was.","where",["that","what","which"],"Reported questions: no inversion, where the museum was.");
  add(2,"What is 'traditional art'?","art made with long-established local methods",["modern art", "fashion", "photography"],"Traditional art follows old local methods.");
  add(2,"What is 'extremism'?","holding very extreme political or religious views",["optimism", "pacifism", "tourism"],"Extremism means holding very extreme views.");
  add(2,"The weavers _____ beautiful cloth for the festival.","make",["makes","made","making"],"Present simple with a plural subject: make.");
  add(2,"'Please help me,' she said to him. She asked him _____ her.","to help",["help","helped","helping"],"Reported request: asked + object + to + base verb.");
  add(2,"He told the drummer, 'Stop playing now.' He told him _____ playing.","to stop",["stop","stopped","stopping"],"Reported order: told + object + to + base verb.");
  add(2,"What is a 'religious leader'?","a person who guides a faith community",["a military commander", "a craftsman", "a merchant"],"A religious leader guides a faith community.");

  /* ---------- SECONDE · S13 Violent Extremism ---------- */
  add(2,"What is 'violent extremism'?","extreme views supported by violence",["peaceful protest", "urban violence", "sports fanaticism"],"Violent extremism uses violence to pursue extreme views.");
  add(2,"'We will fight terrorism,' the minister said. The minister said that they _____ terrorism.","would fight",["will fight","fight","fought"],"Reported speech: will becomes would.");
  add(2,"'Did you see the attack?' he asked. He asked me _____ the attack.","if I had seen",["did I see","had I seen","that I saw"],"Reported yes/no questions: if + subject + past perfect, no inversion.");
  add(2,"'I am afraid,' she said. She said that she _____ afraid.","was",["is","were","has been"],"Reported speech: am becomes was.");
  add(2,"What does 'to attack' mean?","to use force against someone",["to defend", "to protect", "to stop"],"To attack means to use force against someone.");
  add(2,"What is 'a victim'?","a person who suffers harm from a crime",["a witness", "a judge", "a thief"],"A victim is someone who is harmed.");
  add(2,"Violence _____ the community for many years.","has divided",["have divided","divides","dividing"],"Singular subject violence: has + past participle.");
  add(2,"Our schools _____ violence without fear.","must be free from",["must be free of","must free from","must be free to"],"Free from means not having something harmful.");
  add(2,"What does 'to demonstrate' mean in the sense of a crowd?","to march in public to show protest",["to prove something only", "to demolish", "to resign"],"To demonstrate means to march in public.");
  add(2,"'Stop the violence now,' the leader said. He told the people _____ the violence.","to stop",["stop","stopped","stopping"],"Reported order: told + object + to + base verb.");
  add(2,"What is 'an extremist'?","a person with very extreme views",["an artist", "an optimist", "a journalist"],"An extremist holds very extreme views.");
  add(2,"What is the opposite of 'peace'?","war",["freedom","calm","justice"],"The opposite of peace is war.");

  /* ---------- PREMIÈRE · P1 The Commonwealth ---------- */
  add(2,"The Commonwealth _____ in 1949 in London.","was founded",["founded","has founded","founds"],"Passive past simple: was + past participle.");
  add(2,"Many former British colonies _____ members of the Commonwealth since their independence.","have been",["were","is being","have be"],"Present perfect with since: have been.");
  add(2,"Although the members are different, they _____ the same language.","share",["shares","sharing","shared"],"Plural subject with present simple: share.");
  add(2,"Despite _____ many differences, the member states cooperate.","their",["they","them","theirs"],"Despite + noun/possessive + -ing, the possessive adjective comes before the noun.");
  add(2,"Although the country is small, it _____ an important role.","plays",["play","played","playing"],"Although + present simple, then present simple with a singular subject.");
  add(2,"The woman _____ spoke at the meeting is the Secretary-General.","who",["which","whose","whom"],"Who for people as subject of a relative clause.");
  add(2,"The Commonwealth _____ countries share the English language.","whose",["who","which","that"],"Whose shows possession (the countries' language).");
  add(2,"What is 'a member state'?","a country that belongs to an organisation",["an independent country outside any group", "a colony", "a territory with no government"],"A member state belongs to an organisation.");
  add(2,"What does 'cooperation' mean?","working together",["competing", "competition", "separation"],"Cooperation means working together.");
  add(2,"What does 'to share' mean?","to have or use something together",["to separate", "to sell", "to keep for yourself"],"To share means to have or use something together.");
  add(2,"Choose the correct tense: 'Since 2010, the organisation _____ several projects.'","has launched",["launched","has launching","launches"],"Since + present perfect.");
  add(2,"In 2020, many countries _____ together to fight the pandemic.","worked",["have worked","work","are working"],"A specific past time (2020) requires the past simple.");
  add(2,"What is a 'summit'?","a meeting of leaders",["the top of a mountain only", "a survey", "a treaty"],"A summit is a meeting of heads of state.");

  /* ---------- PREMIÈRE · P2 Different Types of Regimes ---------- */
  add(2,"If the people _____ their voice, the government will listen.","use",["will use","used","using"],"First conditional: if + present simple, will + verb.");
  add(2,"Unless the leaders _____ the constitution, the country will remain stable.","respect",["will respect","respected","respecting"],"Unless = if not, then present simple.");
  add(2,"What is 'a dictatorship'?","rule by one person with total power",["a system where people vote freely", "rule by a king who shares power", "a federal union"],"A dictatorship is rule by one person.");
  add(2,"What is 'a democracy'?","a system where people choose their leaders",["rule by one person", "rule by a small group", "anarchy"],"Democracy means people choose their leaders.");
  add(2,"What is 'a monarchy'?","a state ruled by a king or queen",["a republic with elected presidents", "a tyranny", "a federation"],"A monarchy is ruled by a king or queen.");
  add(2,"Unless the people _____ their rights, they will lose them.","defend",["will defend","defended","defending"],"Unless + present simple, then will + verb.");
  add(2,"What is the opposite of 'a dictatorship'?","a democracy",["a monarchy","a tyranny","an oligarchy"],"A democracy is the opposite of a dictatorship.");
  add(2,"The election _____ every five years in our country.","is held",["holds","is holding","held"],"Passive present simple: is + past participle.");
  add(2,"What is 'an election'?","a vote to choose leaders",["a bill for electricity", "a firefighters' meeting", "a worker"],"An election is a vote to choose leaders.");
  add(2,"What is 'a voter'?","a person who votes in an election",["an elected official", "a minister", "a judge"],"A voter is a person who votes.");
  add(2,"The president _____ by the people in a free vote.","is elected",["elects","is electing","elected"],"Passive present simple: is elected.");
  add(2,"The people of this country _____ their own leaders.","choose",["chooses","chosen","choosing"],"Present simple with a plural subject: choose.");
  add(2,"Choose the correct sentence.","If you vote, you can change the government.",["If you will vote, you can change the government.","If you voted, you will change the government.","If you vote, you could change the government."],"First conditional: if + present simple, can + base verb.");

  /* ---------- PREMIÈRE · P3 Women and Occupations ---------- */
  add(2,"She is a hard worker. _____, she earns less than her colleagues.","However",["Because","So","Unless"],"However introduces a contrast.");
  add(2,"She is very skilled _____ she is paid less than men.","yet",["because","unless","so that"],"Yet introduces a contrast.");
  add(2,"Many women work hard, _____ they do not always get promotions.","yet",["unless","because","until"],"Yet introduces a contrast.");
  add(2,"_____ she had a degree, she could not find a job.","Although",["Unless","Because","Until"],"Although introduces a concession.");
  add(2,"What is 'a workplace'?","the place where you work",["a market", "a school", "a hospital"],"A workplace is where people work.");
  add(2,"What is 'an employer'?","a person or company that pays workers",["a worker", "a village chief", "a salaried person"],"An employer pays workers.");
  add(2,"What is 'a salary'?","regular payment for work",["a harvest", "a prize", "a debt"],"A salary is regular pay for work.");
  add(2,"What is the opposite of 'an employee'?","an employer",["a worker","a student","a trader"],"Employee and employer are opposites in the working relationship.");
  add(2,"She works in a bank, _____?","doesn't she",["does she","isn't she","won't she"],"Question tag after positive present simple: doesn't she.");
  add(2,"What is 'a promotion' at work?","a move to a higher job position",["an advertisement", "an expense", "a decision"],"A promotion is a move to a higher position.");
  add(2,"Women _____ run their own businesses in Togo.","can",["must","have to","shall"],"Can expresses ability or possibility.");
  add(2,"What is 'a business'?","a company that sells goods or services",["an office", "a market", "a bank"],"A business sells goods or services.");
  add(2,"She wanted to work in an office, _____ she had no degree.","but",["so","because","therefore"],"But introduces a contrast in this sentence.");

  /* ---------- PREMIÈRE · P4 Pre-established Gender Roles ---------- */
  add(2,"Girls _____ to stay at home; boys go out to play.","are expected",["expect","are expecting","expected"],"Passive present simple: are expected to.");
  add(2,"What is 'a stereotype' in society?","a fixed, oversimplified idea about a group",["a family rule", "a right", "a battle"],"A stereotype is an oversimplified idea about a group.");
  add(2,"What is 'discrimination'?","unfair treatment of people because of who they are",["domination", "a decision", "dividing land"],"Discrimination is unfair treatment.");
  add(2,"Although women are equal, they _____ often treated unfairly.","are",["is","be","were being"],"Although + present simple, then present simple passive: are treated.");
  add(2,"Gender roles _____ by society for a long time.","have been defined",["have defined","were defined","are defined"],"Present perfect passive: have been + past participle.");
  add(2,"What is the opposite of 'equal'?","unequal",["equally","equator","equality"],"The opposite of equal is unequal.");
  add(2,"Boys _____ often encouraged to play football.","are",["is","has","do"],"Plural subject: are.");
  add(2,"What is 'a bias'?","an unfair preference for or against something",["a benefit", "a right", "a battle"],"A bias is an unfair preference.");
  add(2,"What does 'to stage' a sketch mean?","to perform it",["to write it","to cancel it","to translate it"],"To stage a sketch = to perform it on a stage.");
  add(2,"Women must not _____ treated differently at work.","be",["being","to be","been"],"Modal + passive: must not be + past participle.");
  add(2,"In the past, women _____ to vote in many countries.","were not allowed",["did not allow","have not allowed","are not allowed"],"Past simple passive: were not allowed.");
  add(2,"What is 'a role' in society?","the part a person is expected to play",["a rule", "a road", "a roll of paper"],"A role is the part a person plays in society.");
  add(2,"What is the opposite of 'to encourage'?","to discourage",["to support","to help","to praise"],"The opposite of encourage is discourage.");
}
