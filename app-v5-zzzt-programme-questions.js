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
  add(2,"What does 'chieftaincy' mean in French?","la chefferie traditionnelle",["la justice moderne","le gouvernement central","le mariage coutumier"],"Chieftaincy = la chefferie traditionnelle.");
  add(2,"What does 'royal court' mean in French?","la cour royale",["le marché royal","l'école royale","le village royal"],"Royal court = la cour royale, where trials are held.");
  add(2,"If you _____ the rules of the palace, you will be punished.","break",["will break","broke","would break"],"First conditional: if + present simple, will + verb.");
  add(2,"What does 'elder' mean in French?","un ancien (du village)",["un enfant","un étranger","un chasseur"],"An elder is a respected older member of the community.");
  add(2,"Choose the correct sentence.","If the chief were wise, the people would be happy.",["If the chief would be wise, the people would be happy.","If the chief is wise, the people is happy.","If the chief was wise, the people would happy."],"Second conditional: if + were, would + base verb.");
  add(2,"If we _____ together, we will solve the conflict.","unite",["united","will unite","would unite"],"First conditional: if + present simple, will + verb.");
  add(2,"What does 'to rule' mean in French?","gouverner",["juger","punir","élire"],"To rule = gouverner.");

  /* ---------- SECONDE · S2 Chieftaincy in Africa ---------- */
  add(2,"If the chiefs _____ together, they can solve many conflicts.","work",["worked","working","would work"],"First conditional: if + present simple, can + verb.");
  add(2,"If the young people _____ the traditions, the villages will lose their identity.","forget",["forgot","forgetting","would forget"],"First conditional: if + present simple, will + verb.");
  add(2,"If the king had listened to his advisers, the war _____ avoided.","would have been",["will be","is","was"],"Third conditional: if + had + past participle, would have + past participle.");
  add(2,"Even though he was powerful, the chief _____ to the elders.","listened",["listen","will listen","listening"],"Even though + past simple in the main clause, past simple for narration.");
  add(2,"Though the colonial period was hard, the chiefs _____ their authority.","kept",["keep","will keep","keeping"],"Though + past simple, then past simple in the main clause.");
  add(2,"What does 'weakness' mean in French?","la faiblesse",["la force","la richesse","la sagesse"],"Weakness = la faiblesse.");
  add(2,"What is the opposite of 'strength'?","weakness",["power","wisdom","pride"],"The opposite of strength is weakness.");
  add(2,"If the people _____ the king, they would respect him more.","respected",["respect","will respect","respecting"],"Second conditional: if + past simple, would + verb.");
  add(2,"What does 'although' mean in French?","bien que",["parce que","donc","depuis"],"Although = bien que.");
  add(2,"What does 'even though' mean in French?","même si",["parce que","alors","depuis"],"Even though = même si.");
  add(2,"_____ the chief was sick, he attended the ceremony.","Though",["Unless","Because","So"],"Though is a concessive conjunction.");
  add(2,"Which word means 'sagesse' in English?","wisdom",["weakness","pride","trial"],"Sagesse = wisdom.");
  add(2,"If the elders _____ their children, the villages would be stronger.","educated",["educate","will educate","educating"],"Second conditional with a past simple verb in the if-clause.");
  add(2,"Choose the correct sentence.","If we unite, we will be stronger.",["If we will unite, we will be stronger.","If we united, we will be stronger.","If we unite, we would be stronger."],"First conditional: if + present simple, will + base verb.");
  add(2,"What does 'elder' mean in French?","un ancien (du village)",["un enfant","un étranger","un chasseur"],"An elder is a respected older member of the community.");

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
  add(2,"What does 'equality' mean in French?","l'égalité",["l'inégalité","la liberté","la justice"],"Equality = l'égalité.");
  add(2,"What does 'household' mean in French?","le foyer, le ménage",["le marché","l'école","la rivière"],"Household = le foyer, le ménage.");
  add(2,"What is the opposite of 'educated'?","uneducated",["educating","educate","education"],"The opposite of educated is uneducated.");

  /* ---------- SECONDE · S4 Women's Place in the Family ---------- */
  add(2,"In many families, women _____ most of the housework.","do",["does","did","doing"],"Present simple with a plural subject: do.");
  add(2,"The husband and the wife _____ the children together.","bring up",["brings up","brought up","bringing up"],"Present simple with a plural subject: bring up.");
  add(2,"What does 'to bring up' mean in French?","élever (des enfants)",["apporter","amener","ramener"],"To bring up (children) = élever (des enfants).");
  add(2,"Girls should have the same _____ as boys.","rights",["rightful","righting","righteous"],"Rights is the noun meaning 'droits'.");
  add(2,"Women and men _____ share the housework equally.","should",["shouldn't","wouldn't","mustn't have"],"Should expresses advice or what is right.");
  add(2,"What does 'housework' mean in French?","les travaux ménagers",["le travail des champs","le travail de bureau","le marché"],"Housework = les travaux ménagers.");
  add(2,"The father _____ make all the decisions alone; the family decides together.","doesn't have to",["mustn't","couldn't","wouldn't"],"Doesn't have to = it is not necessary.");
  add(2,"If the mother _____ outside the home, the children help more with the housework.","works",["worked","will work","working"],"First conditional: if + present simple, the main clause uses the present simple.");
  add(2,"What is the opposite of 'equal'?","unequal",["equally","equality","equalise"],"The opposite of equal is unequal.");
  add(2,"What does 'stereotype' mean in French?","un préjugé",["une habitude","une règle","un sport"],"Stereotype = un préjugé.");
  add(2,"Choose the correct sentence.","Women should be respected in the family.",["Women should respected in the family.","Women should be respect in the family.","Women should to be respected in the family."],"Should + be + past participle: passive form.");
  add(2,"She is a clever girl, _____?","isn't she",["is she","doesn't she","isn't it"],"Question tag after a positive statement with is.");
  add(2,"What is the noun form of 'respectful'?","respectfulness",["respectable","respectably","respect"],"The noun form of 'respectful' is 'respectfulness' (respect itself is also a noun, but the question asks the derived form).");
  add(2,"The girls _____ their homework every evening.","do",["does","did","doing"],"Present simple with a plural subject: do.");

  /* ---------- SECONDE · S5 Bushfires and Deforestation ---------- */
  add(2,"The forest _____ by fire last year.","was destroyed",["destroyed","has destroyed","destroys"],"Passive past simple: was + past participle.");
  add(2,"Many trees _____ every year for firewood.","are cut down",["cut down","are cutting down","have cut down"],"Passive present simple: are + past participle.");
  add(2,"What does 'to set fire to' mean in French?","mettre le feu à",["éteindre","nettoyer","planter"],"To set fire to = mettre le feu à.");
  add(2,"You will not get wood _____ you plant new trees.","unless",["if","when","until"],"Unless = if not.");
  add(2,"We will stop the fire _____ we act now.","unless",["if","until","when"],"Unless = if not. The sentence means 'if we do not act now'.");
  add(2,"The man _____ house burned down is my neighbour.","whose",["who","which","whom"],"Whose shows possession: the man whose house.");
  add(2,"The dumping ground _____ is near the river is dangerous.","which",["who","whose","where"],"Which is used for things; the dumping ground (thing) which is near the river.");
  add(2,"The student _____ wrote the report won a prize.","who",["which","whose","whom"],"Who is used for people as the subject of a relative clause.");
  add(2,"What does 'deforestation' mean in French?","la déforestation",["le reboisement","la sécheresse","la pollution"],"Deforestation = la déforestation.");
  add(2,"What does 'bushfire' mean in French?","un feu de brousse",["une inondation","un orage","une tempête"],"Bushfire = un feu de brousse.");
  add(2,"What is a 'dumping ground' in French?","une décharge",["une usine","un marché","un parc"],"A dumping ground = une décharge (waste site).");
  add(2,"What is the opposite of 'to plant' (trees)?","to cut down",["to water","to grow","to dig"],"To plant trees is the opposite of cutting them down.");
  add(2,"Choose the correct passive sentence.","The rubbish is burned every week.",["The rubbish burns every week.","The rubbish is burning every week by.","The rubbish has burned by every week."],"Passive present simple: is + past participle (burned).");
  add(2,"Choose the correct sentence.","The forest was destroyed by the fire.",["The forest was destroy by the fire.","The forest destroyed by the fire.","The forest was destroyed the fire."],"Passive: was + past participle, with by + agent.");
  add(2,"We will not win the fight _____ we protect the forest.","unless",["if","when","because"],"Unless = if not.");

  /* ---------- SECONDE · S6 Dumping Grounds ---------- */
  add(2,"Dumping grounds _____ the air and the water.","pollute",["polluted","pollutes","will pollute"],"Plural subject with the present simple: pollute.");
  add(2,"Plastic bags _____ slowly in the soil.","decompose",["decomposes","decomposed","decomposing"],"Plural subject with the present simple: decompose.");
  add(2,"What does 'waste' mean in French?","les déchets",["les ressources","les plantes","les routes"],"Waste = les déchets.");
  add(2,"The rubbish _____ every day by the workers.","is collected",["collects","collected","has collected"],"Passive present simple.");
  add(2,"The city _____ a new dumping ground next year.","will build",["will be built","builds","built"],"Active future: will + base verb.");
  add(2,"The waste _____ by the wind into the river.","was carried",["carried","has carried","carries"],"Passive past simple: was + past participle.");
  add(2,"What is the opposite of 'clean'?","dirty",["fresh","wet","bright"],"The opposite of clean is dirty.");
  add(2,"What does 'to recycle' mean in French?","recycler",["jeter","brûler","enterrer"],"To recycle = recycler.");
  add(2,"People should throw rubbish in the bin, _____?","shouldn't they",["should they","don't they","do they"],"Question tag after should: negative tag.");
  add(2,"If we _____ the rubbish, the town will be clean.","collect",["will collect","collected","collecting"],"First conditional: if + present simple, the main clause uses will.");
  add(2,"What does 'pollution' mean in French?","la pollution",["la population","la solution","la protection"],"Pollution = la pollution.");
  add(2,"Our streets are _____ than before since the workers started cleaning.","cleaner",["more clean","cleanest","the cleaner"],"Comparative of clean: cleaner than.");

  /* ---------- SECONDE · S7 Artificial Intelligence and the Modern Society ---------- */
  add(2,"Artificial intelligence _____ more and more in hospitals, which is a big change.","is being used",["has used","was using","being used"],"Present continuous passive: is being + past participle.");
  add(2,"Computers _____ by engineers in many countries.","are designed",["design","are designing","designed"],"Passive present simple: are + past participle.");
  add(2,"What does 'artificial intelligence' mean in French?","l'intelligence artificielle",["l'intelligence humaine","l'art de la ville","la technologie ancienne"],"Artificial intelligence = l'intelligence artificielle.");
  add(2,"What does 'curriculum vitae' mean in French?","un curriculum vitae",["une lettre de motivation","un contrat de travail","un bulletin scolaire"],"CV = curriculum vitae.");
  add(2,"What does 'e-learning' mean?","learning by internet",["learning in a village","learning by hand","learning in a church"],"E-learning is learning through digital tools and the internet.");
  add(2,"The new software _____ by a young engineer last year.","was developed",["developed","is developing","has developed"],"Passive past simple: was + past participle.");
  add(2,"Choose the correct passive sentence.","The phone is made in a factory.",["The phone makes in a factory.","The phone is making in a factory.","The phone has made in a factory by."],"Passive present simple: is + past participle.");
  add(2,"What does 'advantage' mean in French?","un avantage",["un inconvénient","un danger","une règle"],"Advantage = un avantage.");
  add(2,"What is the opposite of 'advantage'?","disadvantage",["advantageous","advantageously","adventure"],"The opposite of advantage is disadvantage.");
  add(2,"Robots _____ many jobs in the future.","will replace",["replace","will replaced","are replaced"],"Future: will + base verb.");
  add(2,"If the machine _____, the workers will stop the production.","breaks down",["broke down","will break down","breaking down"],"First conditional: if + present simple.");
  add(2,"What does 'phytotherapy' mean in French?","la phytothérapie",["la chirurgie","la radiothérapie","la psychologie"],"Phytotherapy = la phytothérapie (treatment with plants).");
  add(2,"What does 'a diagnosis' mean in French?","un diagnostic",["un traitement","un médicament","un hôpital"],"Diagnosis = un diagnostic.");
  add(2,"The advantages of AI are _____ than its disadvantages.","more numerous",["more numerously","numerous than","most numerous"],"Comparison of quantity: more numerous than.");

  /* ---------- SECONDE · S8 Phytotherapy and Health ---------- */
  add(2,"Many people _____ plants to treat their illnesses.","use",["uses","are used","used"],"Present simple with a plural subject: use + object.");
  add(2,"The leaves of this plant _____ to cure fever.","are used",["use","are using","used"],"Passive present simple: are + past participle.");
  add(2,"What does 'a remedy' mean in French?","un remède",["une maladie","un médecin","une douleur"],"Remedy = un remède.");
  add(2,"What does 'a symptom' mean in French?","un symptôme",["un sirop","un virus","une vaccination"],"Symptom = un symptôme.");
  add(2,"What does 'a patient' mean in French?","un patient",["un étudiant","un ami","un voisin"],"Patient = un patient.");
  add(2,"What does 'a vaccine' mean in French?","un vaccin",["une piqûre","un pansement","une ordonnance"],"Vaccine = un vaccin.");
  add(2,"If you _____ more fruit and vegetables, you will be healthier.","eat",["will eat","ate","eating"],"First conditional: if + present simple, will + verb.");
  add(2,"If I had a headache, I _____ a herbal tea.","would drink",["will drink","drink","drank"],"Second conditional: if + past simple, would + verb.");
  add(2,"Choose the correct sentence.","The doctor was consulted by many people.",["The doctor consulted by many people.","The doctor was consult by many people.","The doctor has been consulted by many people by."],"Passive past simple: was + past participle.");
  add(2,"What is the opposite of 'healthy'?","unhealthy",["healthily","health","healthier"],"The opposite of healthy is unhealthy.");
  add(2,"Herbal medicine is _____ than many modern drugs in some villages.","cheaper",["more cheap","cheapest","the cheap"],"Comparative of cheap: cheaper than.");
  add(2,"People _____ to the hospital when they are seriously ill.","go",["goes","went","going"],"Present simple with a plural subject: go.");
  add(2,"What does 'to heal' mean in French?","guérir",["tomber malade","mourir","souffrir"],"To heal = guérir.");
  add(2,"What does 'illness' mean in French?","la maladie",["la santé","la guérison","le médicament"],"Illness = la maladie.");

  /* ---------- SECONDE · S9 Respect of State Property ---------- */
  add(2,"I wish I _____ the public bus more carefully yesterday.","had treated",["treated","have treated","would treat"],"I wish + past perfect expresses regret about the past.");
  add(2,"If only the people _____ the school building in good condition!","would keep",["keep","kept","will keep"],"If only + would expresses a wish about the present or future.");
  add(2,"I wish I _____ in a clean country.","lived",["live","will live","would live"],"I wish + past simple expresses a wish about the present.");
  add(2,"What does 'state property' mean in French?","les biens de l'État",["les biens privés","les marchés","les églises"],"State property = les biens de l'État.");
  add(2,"What does 'patriotism' mean in French?","le patriotisme",["le pacifisme","le capitalisme","le populisme"],"Patriotism = le patriotisme.");
  add(2,"The public buildings _____ by the young men last night.","were damaged",["damaged","have damaged","damage"],"Passive past simple: were + past participle.");
  add(2,"Everybody should respect the national flag, _____?","shouldn't they",["should they","don't they","does everybody"],"Question tag after should, with everybody as subject: they.");
  add(2,"Nobody saw the thief, _____?","did they",["didn't they","did he","do they"],"Nobody takes a positive verb, so the tag is positive, with they.");
  add(2,"Write a formal letter. It should begin with 'Dear Sir', _____ ?","shouldn't it",["should it","doesn't it","will it"],"Question tag after should in the negative.");
  add(2,"What does 'to damage' mean in French?","endommager",["réparer","construire","protéger"],"To damage = endommager.");
  add(2,"What does 'citizenship' mean in French?","la citoyenneté",["la nationalité étrangère","l'immigration","le recensement"],"Citizenship = la citoyenneté.");
  add(2,"Choose the correct passive sentence.","The school was built by the government.",["The school built by the government.","The school was build by the government.","The school has built by the government."],"Passive past simple: was + past participle (built).");
  add(2,"What is the opposite of 'to respect'?","to despise",["to obey","to admire","to trust"],"To despise = mépriser, the opposite of respect.");
  add(2,"I wish the people _____ their country more.","loved",["love","will love","loving"],"I wish + past simple: a wish about the present.");

  /* ---------- SECONDE · S10 Patriotic Acts ---------- */
  add(2,"What does 'a formal letter' mean in French?","une lettre formelle",["une lettre d'amour","une carte postale","un message oral"],"A formal letter = une lettre formelle.");
  add(2,"Dear Sir, I _____ to inform you about the problem.","am writing",["write","wrote","will write"],"Present continuous for a letter written now.");
  add(2,"Yours _____, Kofi Mensah.","faithfully",["faithful","faithfully as","faithfulness"],"Yours faithfully is used with Dear Sir.");
  add(2,"What does 'to donate' mean in French?","faire un don",["voler","vendre","emprunter"],"To donate = faire un don.");
  add(2,"The volunteers _____ the street last Sunday.","cleaned",["clean","cleaning","have clean"],"Past simple: cleaned.");
  add(2,"The national anthem _____ every morning at school.","is sung",["sings","is singing","has sung"],"Passive present simple: is + past participle.");
  add(2,"What is the opposite of 'to obey'?","to disobey",["to respect","to follow","to help"],"The opposite of obey is disobey.");
  add(2,"What does 'to celebrate' mean in French?","fêter",["oublier","critiquer","interdire"],"To celebrate = fêter.");
  add(2,"If the people _____ their country, they would protect it.","loved",["love","will love","loving"],"Second conditional: if + past simple, would + verb.");
  add(2,"Choose the correct sentence.","The letter was sent yesterday.",["The letter sent yesterday.","The letter was send yesterday.","The letter has sent yesterday by."],"Passive past simple: was + past participle.");

  /* ---------- SECONDE · S11 Land Issues ---------- */
  add(2,"_____ the land and the house, the girl did not receive anything.","Neither ... nor",["Either ... or","Both ... nor","Not only ... but"],"Neither ... nor: correlative conjunction (ni ... ni).");
  add(2,"Both the sons _____ the house and the field.","inherited",["inherits","inheriting","have inherit"],"Past simple: inherited.");
  add(2,"_____ the men, the women also have the right to own land.","Not only ... but also",["Either ... or","Neither ... nor","Both ... nor"],"Not only ... but also: correlative conjunction (non seulement ... mais aussi).");
  add(2,"What does 'inheritance' mean in French?","l'héritage",["le partage","la vente","le prêt"],"Inheritance = l'héritage.");
  add(2,"What does 'a dispute' mean in French?","un litige",["un jugement","un prix","une récolte"],"A dispute = un litige.");
  add(2,"If she _____ the land papers, she would have won the case.","had found",["found","has found","would find"],"Third conditional: if + had + past participle, would have + past participle.");
  add(2,"If the widow had signed the paper, she _____ her land.","would have kept",["will keep","kept","keeps"],"Third conditional: would have + past participle.");
  add(2,"If they had asked for help, the court _____ them.","would have helped",["will help","helped","help"],"Third conditional: would have + past participle.");
  add(2,"Neither the mother _____ the daughter could read the document.","nor",["or","and","but"],"Neither ... nor: nor introduces the second part.");
  add(2,"What does 'to denounce' mean in French?","dénoncer",["défendre","pardonner","vendre"],"To denounce = dénoncer.");
  add(2,"What does 'land injustice' mean in French?","l'injustice foncière",["la justice foncière","le partage de la terre","la culture du sol"],"Land injustice = l'injustice foncière.");
  add(2,"Either the chief _____ the elders will decide the case.","or",["and","nor","but"],"Either ... or: correlative conjunction (soit ... soit).");
  add(2,"If the family had shared the land fairly, the quarrel _____ .","would not have happened",["will not happen","does not happen","had not happened"],"Third conditional: would not have + past participle.");

  /* ---------- SECONDE · S12 The Value of Traditional Arts in Togo ---------- */
  add(2,"_____ you like the mask or not, it is part of our culture.","No matter whether",["No matter what","No matter where","No matter how"],"No matter whether: it doesn't matter if.");
  add(2,"_____ where you go in Togo, you will find traditional art.","No matter",["However","Unless","Even"],"No matter where = wherever; the phrase introduces an indifference.");
  add(2,"She said, 'I am making a drum.' She said that she _____ a drum.","was making",["is making","makes","made"],"Direct to reported speech: present continuous becomes past continuous.");
  add(2,"He said, 'We will sing tonight.' He said they _____ that night.","would sing",["will sing","sing","sang"],"Direct to reported speech: will becomes would.");
  add(2,"'Where is the museum?' she asked me. She asked me _____ the museum was.","where",["that","what","which"],"Reported questions: no inversion, where the museum was.");
  add(2,"What does 'traditional art' mean in French?","l'art traditionnel",["l'art moderne","la mode","la photographie"],"Traditional art = l'art traditionnel.");
  add(2,"What does 'extremism' mean in French?","l'extrémisme",["l'optimisme","le pacifisme","le tourisme"],"Extremism = l'extrémisme.");
  add(2,"The weavers _____ beautiful cloth for the festival.","make",["makes","made","making"],"Present simple with a plural subject: make.");
  add(2,"'Please help me,' she said to him. She asked him _____ her.","to help",["help","helped","helping"],"Reported request: asked + object + to + base verb.");
  add(2,"He told the drummer, 'Stop playing now.' He told him _____ playing.","to stop",["stop","stopped","stopping"],"Reported order: told + object + to + base verb.");
  add(2,"What does 'a religious leader' mean in French?","un chef religieux",["un chef militaire","un artisan","un marchand"],"Religious leader = un chef religieux.");

  /* ---------- SECONDE · S13 Violent Extremism ---------- */
  add(2,"What does 'violent extremism' mean in French?","l'extrémisme violent",["le pacifisme","la violence urbaine","le fanatisme sportif"],"Violent extremism = l'extrémisme violent.");
  add(2,"'We will fight terrorism,' the minister said. The minister said that they _____ terrorism.","would fight",["will fight","fight","fought"],"Reported speech: will becomes would.");
  add(2,"'Did you see the attack?' he asked. He asked me _____ the attack.","if I had seen",["did I see","had I seen","that I saw"],"Reported yes/no questions: if + subject + past perfect, no inversion.");
  add(2,"'I am afraid,' she said. She said that she _____ afraid.","was",["is","were","has been"],"Reported speech: am becomes was.");
  add(2,"What does 'to attack' mean in French?","attaquer",["défendre","protéger","arrêter"],"To attack = attaquer.");
  add(2,"What does 'a victim' mean in French?","une victime",["un témoin","un juge","un voleur"],"A victim = une victime.");
  add(2,"Violence _____ the community for many years.","has divided",["have divided","divides","dividing"],"Singular subject violence: has + past participle.");
  add(2,"Our schools _____ violence without fear.","must be free from",["must be free of","must free from","must be free to"],"Free from = libre de, exempt de.");
  add(2,"What does 'to demonstrate' mean in French?","manifester",["démontrer seulement","démolir","démissionner"],"To demonstrate (in the street) = manifester.");
  add(2,"'Stop the violence now,' the leader said. He told the people _____ the violence.","to stop",["stop","stopped","stopping"],"Reported order: told + object + to + base verb.");
  add(2,"What does 'an extremist' mean in French?","un extrémiste",["un artiste","un optimiste","un journaliste"],"An extremist = un extrémiste.");
  add(2,"What is the opposite of 'peace'?","war",["freedom","calm","justice"],"The opposite of peace is war.");

  /* ---------- PREMIÈRE · P1 The Commonwealth ---------- */
  add(2,"The Commonwealth _____ in 1949 in London.","was founded",["founded","has founded","founds"],"Passive past simple: was + past participle.");
  add(2,"Many former British colonies _____ members of the Commonwealth since their independence.","have been",["were","is being","have be"],"Present perfect with since: have been.");
  add(2,"Although the members are different, they _____ the same language.","share",["shares","sharing","shared"],"Plural subject with present simple: share.");
  add(2,"Despite _____ many differences, the member states cooperate.","their",["they","them","theirs"],"Despite + noun/possessive + -ing, the possessive adjective comes before the noun.");
  add(2,"Although the country is small, it _____ an important role.","plays",["play","played","playing"],"Although + present simple, then present simple with a singular subject.");
  add(2,"The woman _____ spoke at the meeting is the Secretary-General.","who",["which","whose","whom"],"Who for people as subject of a relative clause.");
  add(2,"The Commonwealth _____ countries share the English language.","whose",["who","which","that"],"Whose shows possession (the countries' language).");
  add(2,"What does 'a member state' mean in French?","un État membre",["un État indépendant","une colonie","un territoire"],"A member state = un État membre.");
  add(2,"What does 'cooperation' mean in French?","la coopération",["la compétition","la concurrence","la séparation"],"Cooperation = la coopération.");
  add(2,"What does 'to share' mean in French?","partager",["séparer","vendre","garder"],"To share = partager.");
  add(2,"Choose the correct tense: 'Since 2010, the organisation _____ several projects.'","has launched",["launched","has launching","launches"],"Since + present perfect.");
  add(2,"In 2020, many countries _____ together to fight the pandemic.","worked",["have worked","work","are working"],"A specific past time (2020) requires the past simple.");
  add(2,"What does 'a summit' mean in French?","un sommet",["un sommet de montagne uniquement","un sondage","un traité"],"A summit = un sommet (meeting of leaders).");

  /* ---------- PREMIÈRE · P2 Different Types of Regimes ---------- */
  add(2,"If the people _____ their voice, the government will listen.","use",["will use","used","using"],"First conditional: if + present simple, will + verb.");
  add(2,"Unless the leaders _____ the constitution, the country will remain stable.","respect",["will respect","respected","respecting"],"Unless = if not, then present simple.");
  add(2,"What does 'a dictatorship' mean in French?","une dictature",["une démocratie","une monarchie","une république"],"Dictatorship = une dictature.");
  add(2,"What does 'a democracy' mean in French?","une démocratie",["une dictature","une oligarchie","une anarchie"],"Democracy = une démocratie.");
  add(2,"What does 'a monarchy' mean in French?","une monarchie",["une république","une tyrannie","une fédération"],"Monarchy = une monarchie.");
  add(2,"Unless the people _____ their rights, they will lose them.","defend",["will defend","defended","defending"],"Unless + present simple, then will + verb.");
  add(2,"What is the opposite of 'a dictatorship'?","a democracy",["a monarchy","a tyranny","an oligarchy"],"A democracy is the opposite of a dictatorship.");
  add(2,"The election _____ every five years in our country.","is held",["holds","is holding","held"],"Passive present simple: is + past participle.");
  add(2,"What does 'an election' mean in French?","une élection",["une électricité","une éléction de pompiers","un électeur"],"Election = une élection.");
  add(2,"What does 'a voter' mean in French?","un électeur",["un élu","un ministre","un juge"],"A voter = un électeur.");
  add(2,"The president _____ by the people in a free vote.","is elected",["elects","is electing","elected"],"Passive present simple: is elected.");
  add(2,"The people of this country _____ their own leaders.","choose",["chooses","chosen","choosing"],"Present simple with a plural subject: choose.");
  add(2,"Choose the correct sentence.","If you vote, you can change the government.",["If you will vote, you can change the government.","If you voted, you will change the government.","If you vote, you could change the government."],"First conditional: if + present simple, can + base verb.");

  /* ---------- PREMIÈRE · P3 Women and Occupations ---------- */
  add(2,"She is a hard worker. _____, she earns less than her colleagues.","However",["Because","So","Unless"],"However introduces a contrast.");
  add(2,"She is very skilled _____ she is paid less than men.","yet",["because","unless","so that"],"Yet introduces a contrast: pourtant, cependant.");
  add(2,"Many women work hard, _____ they do not always get promotions.","yet",["unless","because","until"],"Yet = pourtant, introduces a contrast.");
  add(2,"_____ she had a degree, she could not find a job.","Although",["Unless","Because","Until"],"Although introduces a concession.");
  add(2,"What does 'a workplace' mean in French?","un lieu de travail",["un marché","une école","un hôpital"],"Workplace = un lieu de travail.");
  add(2,"What does 'an employer' mean in French?","un employeur",["un employé","un patron de village","un salarié"],"Employer = un employeur.");
  add(2,"What does 'a salary' mean in French?","un salaire",["une récolte","un prix","une dette"],"Salary = un salaire.");
  add(2,"What is the opposite of 'an employee'?","an employer",["a worker","a student","a trader"],"Employee and employer are opposites in the working relationship.");
  add(2,"She works in a bank, _____?","doesn't she",["does she","isn't she","won't she"],"Question tag after positive present simple: doesn't she.");
  add(2,"What does 'a promotion' mean in French?","une promotion",["une publicité","une dépense","une décision"],"Promotion (at work) = une promotion.");
  add(2,"Women _____ run their own businesses in Togo.","can",["must","have to","shall"],"Can expresses ability or possibility.");
  add(2,"What does 'a business' mean in French?","une entreprise",["un bureau","un marché","une banque"],"A business = une entreprise.");
  add(2,"She wanted to work in an office, _____ she had no degree.","but",["so","because","therefore"],"But introduces a contrast in this sentence.");

  /* ---------- PREMIÈRE · P4 Pre-established Gender Roles ---------- */
  add(2,"Girls _____ to stay at home; boys go out to play.","are expected",["expect","are expecting","expected"],"Passive present simple: are expected to.");
  add(2,"What does 'a stereotype' mean in French?","un stéréotype",["un symbole","une règle","un modèle"],"Stereotype = un stéréotype.");
  add(2,"What does 'discrimination' mean in French?","la discrimination",["la domination","la décision","la division de la terre"],"Discrimination = la discrimination.");
  add(2,"Although women are equal, they _____ often treated unfairly.","are",["is","be","were being"],"Although + present simple, then present simple passive: are treated.");
  add(2,"Gender roles _____ by society for a long time.","have been defined",["have defined","were defined","are defined"],"Present perfect passive: have been + past participle.");
  add(2,"What is the opposite of 'equal'?","unequal",["equally","equator","equality"],"The opposite of equal is unequal.");
  add(2,"Boys _____ often encouraged to play football.","are",["is","has","do"],"Plural subject: are.");
  add(2,"What does 'a bias' mean in French?","un parti pris",["un bénéfice","un droit","une bataille"],"A bias = un parti pris.");
  add(2,"What does 'to stage' a sketch mean?","to perform it",["to write it","to cancel it","to translate it"],"To stage a sketch = to perform it on a stage.");
  add(2,"Women must not _____ treated differently at work.","be",["being","to be","been"],"Modal + passive: must not be + past participle.");
  add(2,"In the past, women _____ to vote in many countries.","were not allowed",["did not allow","have not allowed","are not allowed"],"Past simple passive: were not allowed.");
  add(2,"What does 'a role' mean in French?","un rôle",["une règle","une route","un rouleau"],"Role = un rôle.");
  add(2,"What is the opposite of 'to encourage'?","to discourage",["to support","to help","to praise"],"The opposite of encourage is discourage.");
}
