/* =====================================================================
   v5 · Arena, more content and two new games.
   • Odd One Out   : find the word that does not belong (easy → hard)
   • Grammar Traps : pick the sentence with no mistake (the usual traps)
   • many more quiz, fill-the-gap, word-order and guess-the-word items,
     tagged by level: 1 easy, 2 medium, 3 hard. Hard is really hard.
   Loads after app-v5-arena.js (its name sorts after it).
   ===================================================================== */

/* ---------- more quiz questions (grammar, vocabulary, collocations) ---------- */
AR_Q.push(
 {lv:1,q:"We ___ a lot of fun at the party yesterday.",o:["had","have","are having","has"],a:0,e:"Yesterday means past simple: had."},
 {lv:1,q:"Which word is the opposite of 'ancient'?",o:["old","modern","huge","broken"],a:1,e:"Ancient means very old; modern is its opposite."},
 {lv:1,q:"She is good ___ maths, but bad ___ languages.",o:["at / at","at / in","in / at","for / at"],a:0,e:"Good at, bad at: use 'at' with both."},
 {lv:2,q:"The more you practise, ___ you become.",o:["the more confident","more confident","the most confident","confident more"],a:0,e:"The more..., the more...: a double comparison."},
 {lv:2,q:"By next June, I ___ here for ten years.",o:["will work","will have worked","have worked","am working"],a:1,e:"Future perfect: an action that will be complete by a future time."},
 {lv:2,q:"Despite ___ tired, she finished the marathon.",o:["being","to be","be","been"],a:0,e:"Despite + -ing form."},
 {lv:2,q:"The children were made ___ their rooms before dinner.",o:["to clean","cleaning","clean","cleaned"],a:0,e:"Passive of 'make': were made to + base verb."},
 {lv:2,q:"The number of students ___ growing every year.",o:["is","are","have been","were"],a:0,e:"The number of + noun takes a singular verb."},
 {lv:2,q:"A number of students ___ waiting outside.",o:["is","are","was","has"],a:1,e:"A number of + noun takes a plural verb."},
 {lv:2,q:"She suggested we ___ at the new restaurant.",o:["eat","ate","eating","to eat"],a:0,e:"After 'suggested we', use the base form."},
 {lv:2,q:"We need to ___ a decision by Friday.",o:["make","do","take","have"],a:0,e:"Make a decision: the usual collocation."},
 {lv:2,q:"She decided to ___ a risk and apply abroad.",o:["take","make","do","get"],a:0,e:"Take a risk: the usual collocation."},
 {lv:2,q:"The match was ___ because of the heavy rain.",o:["called off","called on","called for","called back"],a:0,e:"Called off means cancelled."},
 {lv:2,q:"The ___ of the new law surprised everyone.",o:["announce","announcement","announced","announcing"],a:1,e:"After 'The', a noun is needed: announcement."},
 {lv:2,q:"'I will call you tomorrow,' she said. She said she ___ me the next day.",o:["would call","will call","called","would have called"],a:0,e:"Reported speech: will becomes would."},
 {lv:2,q:"The thief ___ by the police yesterday.",o:["was arrested","arrested","has arrested","was arresting"],a:0,e:"Past passive: was + past participle."},
 {lv:2,q:"You ___ have told me; I would have helped.",o:["should","must","might","can"],a:0,e:"Should have + past participle: a missed duty in the past."},
 {lv:2,q:"Unless you hurry, you ___ the train.",o:["will miss","miss","would miss","missed"],a:0,e:"First conditional with unless: unless = if not."},
 {lv:2,q:"I remember ___ the letter, but I forgot to post it.",o:["posting","to post","post","posted"],a:0,e:"Remember + -ing for something you did in the past."},
 {lv:2,q:"The woman ___ house we visited is a painter.",o:["whose","who","which","that's"],a:0,e:"Whose shows possession: the woman's house."},
 {lv:2,q:"They ___ leave the next day, but they changed their minds.",o:["were going to","are going to","go to","will be going"],a:0,e:"Was/were going to: a plan in the past that did not happen."},
 {lv:3,q:"Had I known about the traffic, I ___ earlier.",o:["would leave","would have left","will leave","had left"],a:1,e:"Inverted third conditional: Had I known... would have left."},
 {lv:3,q:"The report, ___ by the committee last week, has been criticised.",o:["published","publishing","having published","to publish"],a:0,e:"Reduced passive relative clause: published."},
 {lv:3,q:"She is said ___ the best surgeon in the country.",o:["to be","being","to have been","be"],a:0,e:"Is said to be: the usual reporting pattern."},
 {lv:3,q:"Not only ___ the exam, but she also won a scholarship.",o:["she passed","did she pass","she did pass","passed she"],a:1,e:"Inversion after 'Not only': did she pass."},
 {lv:3,q:"I'd rather you ___ me the truth than hide it.",o:["told","tell","have told","telling"],a:0,e:"I'd rather + you + past simple: a wish about now."},
 {lv:3,q:"He ___ have finished it already; his desk is empty.",o:["must","can't","should","might not"],a:0,e:"Must have + past participle: a strong deduction about the past."},
 {lv:3,q:"I wish I ___ harder when I was at school.",o:["studied","had studied","would study","study"],a:1,e:"Wish + past perfect: a regret about the past."},
 {lv:3,q:"Hardly ___ the door when the phone rang.",o:["had I closed","I had closed","did I close","I closed"],a:0,e:"Hardly had I... when: inversion after hardly."},
 {lv:3,q:"She insisted that he ___ the doctor immediately.",o:["sees","see","saw","will see"],a:1,e:"Subjunctive after insist that: base form."},
 {lv:3,q:"No sooner ___ home than it started to rain.",o:["had we got","we had got","did we get","we got"],a:0,e:"No sooner had... than: inversion."},
 {lv:3,q:"It's high time you ___ your homework.",o:["do","did","will do","have done"],a:1,e:"It's high time + past simple: it is late to act."},
 {lv:3,q:"Under no circumstances ___ the password to anyone.",o:["you should share","should you share","you share","do you share"],a:1,e:"Negative adverbial at the start: should you share."},
 {lv:3,q:"He is the only one of my friends who ___ French.",o:["speaks","speak","is speaking","spoke"],a:0,e:"The only one... who takes a singular verb: speaks."},
 {lv:3,q:"Neither the manager nor the workers ___ aware of the problem.",o:["was","were","is","has been"],a:1,e:"With nor, the verb agrees with the nearer subject: workers, so were."},
 {lv:3,q:"If I had more time, I ___ you with the project.",o:["would help","would have helped","helped","will help"],a:0,e:"Second conditional: if + past, would + base."},
 {lv:3,q:"Little ___ that the plan would fail.",o:["did they know","they knew","did they knew","they did know"],a:0,e:"Little did they know: inversion for emphasis."},
 {lv:3,q:"The speech was so ___ that the audience fell asleep.",o:["riveting","tedious","vivid","candid"],a:1,e:"Tedious means boring and too long."},
 {lv:3,q:"Her explanation was so ___ that nobody could follow it.",o:["lucid","convoluted","candid","vivid"],a:1,e:"Convoluted means very complicated."},
 {lv:3,q:"The company's profits ___ after the scandal.",o:["plummeted","flourished","hesitated","persevered"],a:0,e:"Plummeted means dropped suddenly and sharply."},
 {lv:3,q:"He is very ___; he always says exactly what he thinks.",o:["diplomatic","candid","reticent","meticulous"],a:1,e:"Candid means open and honest."},
 {lv:3,q:"The mayor's decision was ___: it could not be changed.",o:["irrevocable","reversible","ambiguous","tentative"],a:0,e:"Irrevocable means impossible to undo."},
 {lv:3,q:"The news came ___ the blue, and we were shocked.",o:["out of","on","in","at"],a:0,e:"Out of the blue means unexpectedly."},
 {lv:3,q:"I can't ___ with his constant complaints any more.",o:["put up with","take up with","make up with","keep up with"],a:0,e:"Put up with means tolerate."},
 {lv:3,q:"She is ___ about her work; she checks every detail.",o:["meticulous","meticulously","meticulousness","meticulate"],a:0,e:"After 'is', use an adjective: meticulous."},
 {lv:3,q:"'Have you finished?' he asked me. He asked me ___.",o:["whether I had finished","if have I finished","whether had I finished","did I finish"],a:0,e:"Reported question: statement word order and past perfect."}
);

/* ---------- Odd One Out: the word that does not belong ---------- */
const AR_ODD=[
 {lv:1,q:"Which word does NOT belong?",o:["apple","banana","carrot","orange"],a:2,e:"Carrot is a vegetable. The others are fruits."},
 {lv:1,q:"Which word does NOT belong?",o:["dog","cat","horse","table"],a:3,e:"A table is furniture. The others are animals."},
 {lv:1,q:"Which word does NOT belong?",o:["Monday","Friday","January","Sunday"],a:2,e:"January is a month. The others are days."},
 {lv:1,q:"Which word does NOT belong?",o:["red","blue","green","quickly"],a:3,e:"Quickly is an adverb. The others are colours."},
 {lv:2,q:"Which word does NOT belong?",o:["happy","glad","delighted","furious"],a:3,e:"Furious means very angry. The others mean pleased."},
 {lv:2,q:"Which word does NOT belong?",o:["sad","unhappy","gloomy","generous"],a:3,e:"Generous means kind with money or time. The others mean unhappy."},
 {lv:2,q:"Which word does NOT belong?",o:["swim","run","jump","kitchen"],a:3,e:"Kitchen is a noun. The others are verbs."},
 {lv:2,q:"Which word does NOT belong?",o:["bread","rice","pasta","knife"],a:3,e:"A knife is a tool. The others are food."},
 {lv:2,q:"Which word does NOT belong?",o:["ankle","wrist","elbow","thermometer"],a:3,e:"A thermometer is an instrument. The others are parts of the body."},
 {lv:2,q:"Which word does NOT belong?",o:["ocean","river","lake","desert"],a:3,e:"A desert has no water. The others are water."},
 {lv:3,q:"Which word does NOT belong?",o:["ambiguous","vague","unclear","explicit"],a:3,e:"Explicit means very clear. The others mean not clear."},
 {lv:3,q:"Which word does NOT belong?",o:["accomplish","achieve","fulfil","abandon"],a:3,e:"Abandon means give up. The others mean succeed."},
 {lv:3,q:"Which word does NOT belong?",o:["anxious","nervous","uneasy","serene"],a:3,e:"Serene means calm and peaceful. The others mean worried."},
 {lv:3,q:"Which word does NOT belong?",o:["frugal","thrifty","stingy","extravagant"],a:3,e:"Extravagant means spending too much. The others mean careful with money."},
 {lv:3,q:"Which word does NOT belong?",o:["whisper","mutter","murmur","shout"],a:3,e:"Shout is loud. The others are quiet ways of speaking."},
 {lv:3,q:"Which word does NOT belong?",o:["conceal","hide","cover","reveal"],a:3,e:"Reveal means make known. The others mean keep out of sight."},
 {lv:3,q:"Which word does NOT belong?",o:["candid","honest","sincere","deceitful"],a:3,e:"Deceitful means dishonest. The others mean truthful."},
 {lv:3,q:"Which word does NOT belong?",o:["ancient","antique","old-fashioned","futuristic"],a:3,e:"Futuristic means about the future. The others mean old."},
 {lv:3,q:"Which word does NOT belong?",o:["Tuesday","Thursday","summer","Saturday"],a:2,e:"Summer is a season. The others are days."},
 {lv:3,q:"Which word does NOT belong?",o:["meticulous","careful","thorough","careless"],a:3,e:"Careless means not paying attention. The others mean very careful."}
];

/* ---------- Grammar Traps: which sentence has no mistake? ---------- */
const AR_TRAP=[
 {lv:2,q:"Which sentence is correct?",o:["She don't like coffee.","She doesn't likes coffee.","She doesn't like coffee.","She not like coffee."],a:2,e:"Doesn't + base verb, with no -s."},
 {lv:2,q:"Which sentence is correct?",o:["I have been there last year.","I went there last year.","I have went there last year.","I was go there last year."],a:1,e:"Last year needs the past simple, not the present perfect."},
 {lv:2,q:"Which sentence is correct?",o:["There is many people here.","There are many people here.","There be many people here.","There is much people here."],a:1,e:"People is plural, so use there are many."},
 {lv:2,q:"Which sentence is correct?",o:["He is more taller than me.","He is taller than me.","He is most tall than me.","He is tallest than me."],a:1,e:"Short adjectives add -er. Do not add more to them."},
 {lv:2,q:"Which sentence is correct?",o:["I am agree with you.","I agree with you.","I am agreeing you.","I agree you."],a:1,e:"Agree is a verb: no 'am' and no direct object here."},
 {lv:2,q:"Which sentence is correct?",o:["Between you and I, it's fine.","Between you and me, it's fine.","Between you and myself, it's fine.","Between you and mine, it's fine."],a:1,e:"After a preposition, use the object pronoun: me."},
 {lv:3,q:"Which sentence is correct?",o:["If I would have known, I would come.","If I had known, I would have come.","If I knew, I would had come.","If I have known, I would came."],a:1,e:"Third conditional: if + past perfect, would have + past participle."},
 {lv:3,q:"Which sentence is correct?",o:["Despite of the rain, we went out.","Despite the rain, we went out.","Despite the rain, we did went out.","In spite the rain, we went out."],a:1,e:"Despite takes a noun directly: despite the rain."},
 {lv:3,q:"Which sentence is correct?",o:["The informations are useful.","The information is useful.","The informations is useful.","An information are useful."],a:1,e:"Information is uncountable: no plural, no 'an'."},
 {lv:3,q:"Which sentence is correct?",o:["She suggested to go to the cinema.","She suggested going to the cinema.","She suggested that to go to the cinema.","She suggested go to the cinema."],a:1,e:"Suggest + -ing."},
 {lv:3,q:"Which sentence is correct?",o:["I'm interesting in history.","I'm interested in history.","I'm interest in history.","I interest in history."],a:1,e:"Interested (feeling) vs interesting (quality). Use interested here."},
 {lv:3,q:"Which sentence is correct?",o:["He made me to laugh.","He made me laugh.","He made me laughing.","He made me laughed."],a:1,e:"Make + object + base verb, with no 'to'."},
 {lv:3,q:"Which sentence is correct?",o:["Neither the students nor the teacher are ready.","Neither the students nor the teacher is ready.","Neither the students nor the teacher be ready.","Neither the students nor the teacher were ready."],a:1,e:"With neither... nor, the verb agrees with the nearer subject: teacher, so is."},
 {lv:3,q:"Which sentence is correct?",o:["Less people came than expected.","Fewer people came than expected.","Less peoples came than expected.","Few people came than expected."],a:1,e:"Fewer for countable nouns like people."},
 {lv:3,q:"Which sentence is correct?",o:["Hardly I had arrived when it started.","Hardly had I arrived when it started.","Hardly did I arrived when it started.","Hardly I arrived when it started."],a:1,e:"Hardly + had + subject, then the past participle."}
];

/* ---------- Fill the Gap: more items ---------- */
AR_F.push(
 {lv:1,s:"I ___ a sandwich for lunch.",a:["ate"],h:"past of 'eat'"},
 {lv:1,s:"There ___ two cats in the garden.",a:["are"],h:"plural: there are"},
 {lv:2,s:"She has ___ in London for five years.",a:["lived"],h:"past participle of 'live'"},
 {lv:2,s:"If it ___ tomorrow, we will cancel the trip.",a:["rains"],h:"first conditional, present simple"},
 {lv:2,s:"Scientists have ___ a cure for the disease.",a:["found"],h:"past participle of 'find'"},
 {lv:2,s:"We ___ going to the beach if the weather is nice.",a:["are"],h:"present continuous for plans"},
 {lv:3,s:"By the time he arrived, we ___ dinner.",a:["had eaten","had already eaten"],h:"past perfect"},
 {lv:3,s:"The house ___ in 1920.",a:["was built"],h:"passive, past simple of 'build'"},
 {lv:3,s:"I'd rather you ___ silent during the exam.",a:["stayed"],h:"would rather + past"},
 {lv:3,s:"He is ___ to speak three languages.",a:["able"],h:"an adjective that means 'can'"},
 {lv:3,s:"The team ___ their best to win the match.",a:["did"],h:"do your best"},
 {lv:3,s:"She ___ the solution after hours of thinking.",a:["finally found","found"],h:"past simple of 'find'"},
 {lv:3,s:"The package should ___ by Monday.",a:["arrive"],h:"modal + base verb"},
 {lv:3,s:"The book was ___ into twelve languages.",a:["translated"],h:"past participle of 'translate'"},
 {lv:3,s:"If I ___ you, I would apologise.",a:["were"],h:"second conditional: were"}
);

/* ---------- Word Order: more sentences ---------- */
AR_O.push(
 {lv:2,w:["She","bought","a","new","dress","yesterday"],a:"She bought a new dress yesterday"},
 {lv:2,w:["never","have","I","seen","such","a","view"],a:"I have never seen such a view"},
 {lv:3,w:["Despite","the","rain","we","enjoyed","the","trip"],a:"Despite the rain we enjoyed the trip"},
 {lv:3,w:["The","report","was","finished","before","the","deadline"],a:"The report was finished before the deadline"},
 {lv:3,w:["I","would","have","called","if","I","had","known"],a:"I would have called if I had known"},
 {lv:3,w:["She","has","been","working","here","since","2019"],a:"She has been working here since 2019"},
 {lv:1,w:["I","like","reading","books"],a:"I like reading books"}
);

/* ---------- Guess the Word: more words, tagged by level ---------- */
AR_G.push(
 {lv:2,w:"carpet",h:"It covers the floor of a room."},
 {lv:2,w:"elephant",h:"A very large animal with a trunk."},
 {lv:2,w:"umbrella",h:"You open it when it rains."},
 {lv:3,w:"chemistry",h:"The science of substances and how they react."},
 {lv:3,w:"gravity",h:"The force that pulls things down to the ground."},
 {lv:3,w:"conscience",h:"The inner voice that tells you right from wrong."},
 {lv:3,w:"photosynthesis",h:"How plants use sunlight to make food."},
 {lv:3,w:"democracy",h:"A system where people vote to choose their leaders."},
 {lv:3,w:"ambassador",h:"A diplomat who represents their country abroad."}
);

/* the new games appear on the Arena home, after the first six */
AR_I.odd='<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>';
AR_I.traps='<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>';
AR_MODES.push(
 {id:"odd",t:"Odd One Out",d:"Find the word that does not belong",ic:"odd",max:400},
 {id:"traps",t:"Grammar Traps",d:"Spot the sentence with no mistake",ic:"traps",max:400}
);
