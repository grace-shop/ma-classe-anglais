/* Programme togolais d'anglais (APC) : leçons, quiz, vocabulaire, devoirs.
   Formats = ceux du Studio : quiz (* bonne réponse, - fausse, "= a / b" réponse écrite), vocabulaire (anglais | français | exemple). */
const CURRICULUM_TOGO=[
{c:"CP1",u:1,lv:"A1",t:"Hello! Colours and greetings",th:"Salutations et couleurs",g:"Hello / My name is",
body:`Au CP, on apprend l'anglais par l'oreille : on écoute, on répète, on chante.

**Hello!** = Bonjour ! **Good morning** = Bonjour (le matin). **Goodbye** = Au revoir.

Pour se présenter : **My name is** Koffi. (Je m'appelle Koffi.)

Les couleurs : **red** (rouge), **blue** (bleu), **green** (vert), **yellow** (jaune), **black** (noir), **white** (blanc).

Joue avec ton voisin : « Hello! My name is ... »`,
quiz:`Comment dit-on « Bonjour » en anglais ?
* Hello
- Goodbye
- Red

Que veut dire « Goodbye » ?
* Au revoir
- Bonjour
- Merci

Quelle est la couleur « red » ?
* Rouge
- Bleu
- Vert

My name ___ Ama.
* is
- are
- am

Écris « blue » en français.
= bleu`,
deck:`hello | bonjour | Hello, teacher!
goodbye | au revoir | Goodbye, Mama!
red | rouge | The apple is red.
blue | bleu | The sky is blue.
green | vert | The leaf is green.
yellow | jaune | The sun is yellow.
black | noir | The board is black.
white | blanc | The chalk is white.`,
hw:{t:"My name and my favourite colour",b:"Écris (ou dessine) : Hello! My name is ... My favourite colour is ... (3 phrases courtes)."}},

{c:"CE1",u:1,lv:"A1",t:"Numbers and days of the week",th:"Chiffres et jours",g:"How many...? / Today is...",
body:`Les chiffres : **one** (1), **two** (2), **three** (3), **four** (4), **five** (5), **six** (6), **seven** (7), **eight** (8), **nine** (9), **ten** (10).

Les jours de la semaine : **Monday**, **Tuesday**, **Wednesday**, **Thursday**, **Friday**, **Saturday**, **Sunday**.

Questions utiles :
How many pencils? — **Five** pencils.
What day is it today? — Today is **Monday**.`,
quiz:`Quel chiffre est « seven » ?
* 7
- 6
- 9

Quel jour vient après Monday ?
* Tuesday
- Sunday
- Friday

How many fingers on one hand?
* Five
- Two
- Ten

Today ___ Friday.
* is
- are
- am

Écris « trois » en anglais.
= three`,
deck:`one | un | one book
two | deux | two pens
three | trois | three mangoes
five | cinq | five fingers
ten | dix | ten pupils
Monday | lundi | Today is Monday.
Friday | vendredi | Friday is a school day.
Sunday | dimanche | I go to church on Sunday.`,
hw:{t:"My week",b:"Écris les 7 jours de la semaine en anglais, puis complète : Today is ... I have ... books in my bag."}},

{c:"CM1",u:1,lv:"A1",t:"Animals and my house",th:"Animaux et maison",g:"There is / There are",
body:`Les animaux : **dog** (chien), **cat** (chat), **goat** (chèvre), **chicken** (poulet), **cow** (vache), **bird** (oiseau).

Les pièces de la maison : **kitchen** (cuisine), **bedroom** (chambre), **living room** (salon), **bathroom** (douche).

**There is** + un seul : There is a dog in the yard.
**There are** + plusieurs : There are three chickens in the yard.`,
quiz:`Comment dit-on « chèvre » ?
* goat
- cow
- cat

There ___ two goats.
* are
- is
- am

La « kitchen » est…
* la cuisine
- la chambre
- le salon

There ___ a cat on the bed.
* is
- are
- be

Écris « chien » en anglais.
= dog`,
deck:`dog | chien | The dog is big.
cat | chat | The cat is sleeping.
goat | chèvre | There is a goat in the yard.
chicken | poulet | I have four chickens.
cow | vache | The cow gives milk.
kitchen | cuisine | Mama is in the kitchen.
bedroom | chambre | My bedroom is small.
house | maison | This is my house.`,
hw:{t:"My house and my animals",b:"Décris ta maison en 4 phrases avec There is / There are. Exemple : There is a kitchen. There are two bedrooms."}},

{c:"6e",u:1,lv:"A1",t:"School and classroom objects",th:"The school",g:"Imperative / this is / these are",
body:`**Classroom objects** : a **book**, a **pen**, a **pencil**, a **ruler**, a **bag**, a **desk**, a **blackboard**.

**L'impératif** donne un ordre ou une consigne. On utilise le verbe seul :
**Sit down.** (Assieds-toi.) **Listen.** (Écoute.) **Open your book.** **Don't talk!** (Ne parle pas !)

**This is** un objet proche : This is a pen. **These are** plusieurs objets : These are pens.

Questions : What is this? — It is a book. How many pens? — Three pens.`,
quiz:`Choisis l'impératif correct pour « Assieds-toi ».
* Sit down.
- You sit down.
- Sitting down.

___ is my bag.
* This
- These
- Those

These ___ my pencils.
* are
- is
- am

« Don't talk! » veut dire…
* Ne parle pas !
- Parle !
- Écoute !

Écris « règle (outil) » en anglais.
= ruler`,
deck:`book | livre | Open your book.
pen | stylo | I write with a pen.
pencil | crayon | This is my pencil.
ruler | règle | The ruler is on the desk.
bag | sac | My bag is heavy.
blackboard | tableau | Look at the blackboard.
teacher | professeur | The teacher is kind.
classroom | salle de classe | Our classroom is clean.`,
hw:{t:"My school bag",b:"Liste 6 objets de ton sac en anglais et écris 3 phrases : This is my ... These are my ..."}},

{c:"6e",u:2,lv:"A1",t:"My family and my body",th:"Family, body, daily life",g:"Present simple, present continuous, possessives",
body:`**La famille** : **father**, **mother**, **brother**, **sister**, **grandmother**, **uncle**, **aunt**.

**Adjectifs possessifs** : my, your, his, her, our, their. This is **my** father. **His** name is Kodjo.
**Génitif** : Ama**'s** book = le livre d'Ama.

**Présent simple** (habitudes) : I **go** to school every day. She **goes** to school. (he/she/it + **s**)
**Présent continu** (maintenant) : I **am reading** now. (be + verbe-**ing**)

**Le corps** : head, arm, leg, hand, foot, eye, ear, mouth.`,
quiz:`She ___ to school every day.
* goes
- go
- going

Look! The children ___ now.
* are playing
- play
- plays

This is Ama's book signifie :
* C'est le livre d'Ama.
- C'est Ama qui lit.
- Ama a deux livres.

___ name is Kofi. (il)
* His
- Her
- Their

Écris « jambe » en anglais.
= leg`,
deck:`father | père | My father is a driver.
mother | mère | My mother sells tomatoes.
brother | frère | I have one brother.
sister | soeur | My sister is ten.
head | tête | Touch your head.
hand | main | Wash your hands.
leg | jambe | My leg hurts.
eye | oeil | She has big eyes.`,
hw:{t:"My family",b:"Présente ta famille en 6 phrases : This is my mother. Her name is ... She sells ... Utilise my / his / her."}},

{c:"5e",u:1,lv:"A1",t:"Village life, town life and traditions",th:"Village, town, ceremonies",g:"Past simple",
body:`**Vocabulaire** : **village**, **town**, **market**, **ceremony**, **festival**, **chief**, **farm**.

**Le passé simple** raconte un événement fini.
Verbes réguliers : verbe + **ed** : walk → **walked**, play → **played**.
Verbes irréguliers : go → **went**, see → **saw**, eat → **ate**, have → **had**, buy → **bought**.

Négation : I **did not** (didn't) **go**. Question : **Did** you **go** to the market?

Exemple : Last Sunday, we **went** to the village. We **ate** fufu and we **danced** at the ceremony.`,
quiz:`Yesterday I ___ to the market.
* went
- go
- goed

They ___ football last Saturday.
* played
- play
- plays

Did you ___ the festival?
* see
- saw
- seen

She didn't ___ rice.
* eat
- ate
- eaten

Écris le passé de « buy ».
= bought`,
deck:`village | village | I live in a small village.
town | ville | The town is big.
market | marché | We buy yams at the market.
ceremony | cérémonie | The ceremony was beautiful.
festival | festival | We love the festival.
chief | chef traditionnel | The chief spoke first.
farm | ferme / champ | My uncle has a farm.
last Sunday | dimanche dernier | Last Sunday, we visited Kara.`,
hw:{t:"A day I will never forget",b:"Raconte au passé simple (8 phrases) une cérémonie ou un voyage au village : Last ..., we went to ..."}},

{c:"5e",u:2,lv:"A2",t:"Health, sport and travel",th:"Hospital, sport, transport",g:"Be going to / will, comparatives, for / since",
body:`**Le futur**
**Be going to** = projet décidé : I **am going to** visit the hospital tomorrow.
**Will** = décision soudaine, prédiction : It **will** rain tonight.

**Comparatifs** : tall → tall**er** than ; **more** interesting **than** ; good → **better** ; bad → **worse**.
**Superlatifs** : the tall**est**, **the most** beautiful, **the best**.

**For / since** : I have lived here **for** five years. (durée) I have lived here **since** 2019. (point de départ)

**Vocabulaire** : hospital, nurse, medicine, airport, station, ticket, football.`,
quiz:`Tomorrow, I ___ visit my aunt. (projet)
* am going to
- went
- was

Lomé is ___ than Kpalimé.
* bigger
- more big
- biggest

She is ___ player in the team.
* the best
- better
- good

I have lived here ___ 2018.
* since
- for
- during

Complète : I have waited ___ two hours.
= for`,
deck:`hospital | hôpital | She works at the hospital.
nurse | infirmière | The nurse is kind.
medicine | médicament | Take your medicine.
airport | aéroport | The airport is far.
station | gare | We wait at the station.
ticket | billet | I bought a ticket.
better | meilleur | This road is better.
tomorrow | demain | Tomorrow I will travel.`,
hw:{t:"My plans for the holidays",b:"Écris 8 phrases : 4 avec be going to (tes projets) et 2 comparatifs (ex. Lomé is bigger than Aného)."}},

{c:"4e",u:1,lv:"A2",t:"Food, cooking and nature",th:"Food and environment",g:"Quantifiers: much, many, some, any",
body:`**Aliments** : rice, beans, cassava, yam, fish, tomato, pepper, oil, water.

**Dénombrables** (on peut compter) : **many** tomatoes. **Non dénombrables** : **much** water, **much** rice.
**Some** dans les phrases affirmatives : I have **some** rice.
**Any** dans les négations et questions : I don't have **any** oil. Do you have **any** fish?
**A lot of** marche partout : A lot of people eat cassava.

**How much** rice? (non dénombrable) **How many** tomatoes? (dénombrable)

Recette simple : **Wash** the rice. **Boil** water. **Add** salt. **Cook** for twenty minutes.`,
quiz:`How ___ tomatoes do you need?
* many
- much
- some

There isn't ___ water.
* much
- many
- a few

I have ___ rice for lunch.
* some
- any
- many

Do you have ___ fish?
* any
- some
- a

« Boil » veut dire…
* faire bouillir
- laver
- couper

Écris « poivre / piment » en anglais.
= pepper`,
deck:`rice | riz | We eat rice today.
beans | haricots | Beans are cheap.
cassava | manioc | She sells cassava.
yam | igname | Yam is expensive.
fish | poisson | Fish is tasty.
oil | huile | Add a little oil.
boil | faire bouillir | Boil the water.
environment | environnement | Protect the environment.`,
hw:{t:"My favourite recipe",b:"Décris comment préparer un plat togolais en 6 étapes (Wash, Boil, Add, Cook...). Utilise some, any, much, many."}},

{c:"4e",u:2,lv:"A2",t:"Jobs and basic technology",th:"Jobs, phones, computers",g:"Present perfect, can / must / should",
body:`**Métiers** : **teacher**, **doctor**, **farmer**, **driver**, **engineer**, **tailor**, **trader**.

**Present perfect** = have / has + participe passé : I **have finished** my homework. She **has never travelled** by plane.
Mots utiles : **already**, **yet**, **ever**, **never**, **just**.

**Modaux**
**Can** (capacité, permission) : I **can** use a computer.
**Must** (obligation) : You **must** wear a helmet.
**Should** (conseil) : You **should** study every day.
**Mustn't** = interdiction. **Don't have to** = pas obligé.

**Technologie** : phone, computer, internet, message, screen, battery.`,
quiz:`I ___ my homework already.
* have finished
- finished
- am finishing

She has ___ been to Accra.
* never
- not
- no

You ___ wear a helmet on a motorbike.
* must
- can
- might

You ___ study every day. (conseil)
* should
- must not
- will

« You mustn't smoke » veut dire…
* Il est interdit de fumer.
- Tu n'es pas obligé de fumer.
- Tu peux fumer.

Écris « ingénieur » en anglais.
= engineer`,
deck:`teacher | enseignant | My aunt is a teacher.
doctor | médecin | The doctor helps people.
farmer | cultivateur | The farmer plants maize.
driver | chauffeur | He is a taxi driver.
engineer | ingénieur | She wants to be an engineer.
computer | ordinateur | I use a computer.
phone | téléphone | My phone is new.
battery | batterie | The battery is low.`,
hw:{t:"My dream job",b:"Écris 8 phrases sur le métier que tu veux faire : I want to be... I should study... I must... I have already..."}},

{c:"3e",u:1,lv:"A2",t:"Children's rights and citizenship",th:"Rights and duties",g:"Reported speech (direct → indirect)",
body:`**Droits** : the right to **education**, to **health**, to **play**, to **be protected**. **Devoirs** : respect, obey the law, help others.

**Discours direct** : Ama said, « I **am** happy. »
**Discours indirect** : Ama said that she **was** happy.

Règles principales (verbe introducteur au passé) :
- présent → passé : am → **was**, go → **went**
- will → **would** ; can → **could**
- **I** → he/she ; **my** → his/her ; **now** → **then** ; **today** → **that day** ; **tomorrow** → **the next day**

Questions : « Where do you live? » → He asked me **where I lived**. (pas d'inversion)`,
quiz:`« I am tired », said Kofi. → Kofi said that he ___ tired.
* was
- is
- will be

« I will come tomorrow. » → She said she ___ come the next day.
* would
- will
- can

« Where do you live? » → He asked me where I ___.
* lived
- do live
- live

Dans le discours indirect, « now » devient…
* then
- today
- later

Complète : « I can swim. » → He said he ___ swim.
= could`,
deck:`right | droit | Every child has the right to learn.
duty | devoir (obligation) | Respect is a duty.
education | éducation | Education is important.
protect | protéger | We protect children.
citizen | citoyen | A good citizen obeys the law.
law | loi | The law protects us.
to say | dire | She said that she was ready.
to ask | demander | He asked me my name.`,
hw:{t:"Reported speech practice",b:"Transforme en discours indirect : 1) « I am hungry », said Ama. 2) « I will help you », said Kofi. 3) « Where is the school? » asked Eli. Puis écris 3 droits de l'enfant."}},

{c:"3e",u:2,lv:"B1",t:"Environment, media and communication",th:"Protect the environment, media",g:"Conditionals type 1 and 2, passive voice",
body:`**Environnement** : pollution, waste, tree, forest, recycle, plastic.

**Conditionnel type 1** (possible) : **If** we **plant** trees, the air **will be** cleaner.
**Conditionnel type 2** (imaginaire) : **If** I **were** president, I **would** protect the forests.

**Voix passive** : be + participe passé.
Active : People **burn** plastic. → Passive : Plastic **is burned** (by people).
Passé : The tree **was cut** yesterday.

**Médias** : newspaper, radio, television, social media, news.`,
quiz:`If it rains, we ___ at home.
* will stay
- would stay
- stayed

If I ___ rich, I would build a school.
* were
- am
- will be

English is ___ all over the world.
* spoken
- speak
- speaking

The tree ___ cut yesterday.
* was
- is
- were

Mets au passif : « They sell fish. » → Fish ___ sold.
= is`,
deck:`pollution | pollution | Pollution kills fish.
waste | déchets | Don't throw waste on the road.
forest | forêt | The forest is green.
recycle | recycler | We recycle plastic bags.
plastic | plastique | Plastic is dangerous.
newspaper | journal | My father reads a newspaper.
radio | radio | I listen to the radio.
news | actualités | The news is on at eight.`,
hw:{t:"Save our environment",b:"Écris un petit texte de 10 phrases : 3 conditionnelles (If ... will / would) et 3 phrases au passif sur la pollution."}},

{c:"2nde",u:1,lv:"B1",t:"Public health: malaria, HIV/AIDS and hygiene",th:"Health and hygiene",g:"Past continuous, past perfect, linking words",
body:`**Santé publique** : malaria, mosquito net, vaccine, HIV/AIDS, hygiene, symptoms, prevention.

**Past continuous** : I **was sleeping** when the phone rang. (action en cours dans le passé)
**Past perfect** : When I arrived, the nurse **had** already **left**. (avant un autre moment du passé)

**Connecteurs** : **however** (cependant), **although** (bien que), **therefore** (donc), **because** (parce que), **moreover** (de plus).
Although malaria is dangerous, it **can be prevented**. Mosquitoes bite at night; **therefore** we sleep under a net.`,
quiz:`I ___ when you called.
* was sleeping
- slept
- have slept

When we arrived, the film ___ already started.
* had
- has
- was

___ it was raining, they went out.
* Although
- Because
- Therefore

Malaria is dangerous; ___, we use mosquito nets.
* therefore
- although
- but also

Quel mot veut dire « de plus » ?
* moreover
- however
- because`,
deck:`malaria | paludisme | Malaria is spread by mosquitoes.
mosquito net | moustiquaire | Sleep under a mosquito net.
vaccine | vaccin | The vaccine protects children.
hygiene | hygiène | Hygiene saves lives.
symptom | symptôme | Fever is a symptom.
prevention | prévention | Prevention is better than cure.
however | cependant | However, it is possible.
therefore | donc | Therefore, we must act.`,
hw:{t:"A health campaign",b:"Rédige un paragraphe de 12 phrases pour sensibiliser ton quartier au paludisme. Utilise au moins 4 connecteurs (however, although, therefore, moreover)."}},

{c:"2nde",u:2,lv:"B1",t:"Writing an informal letter",th:"Letters and structured paragraphs",g:"Letter format, paragraph structure",
body:`**Une lettre informelle** (à un ami) :
1. Adresse et date en haut à droite.
2. **Dear Kofi,**
3. Introduction : **How are you? I hope you are fine.**
4. Corps : 2 paragraphes (une idée par paragraphe).
5. Conclusion : **Write back soon. / Give my love to your family.**
6. **Best wishes, / Yours, / Love,** + prénom.

**Un paragraphe** = idée principale + 2 ou 3 détails + conclusion.
Connecteurs : **first**, **then**, **after that**, **finally**.

Exemple : « I am writing to tell you about my school trip. **First**, we visited Kara... »`,
quiz:`Comment commence une lettre informelle ?
* Dear Kofi,
- To whom it may concern,
- Sir,

Quelle formule finit une lettre à un ami ?
* Write back soon.
- Yours faithfully.
- I remain.

Un paragraphe contient…
* une idée principale avec des détails
- une seule phrase courte
- une liste de mots

Quel mot sert à ordonner des actions ?
* finally
- although
- because of

Complète : « I hope you ___ fine. »
= are`,
deck:`dear | cher | Dear Ama,
to write back | répondre | Please write back soon.
first | d'abord | First, we left home.
then | ensuite | Then we arrived.
after that | après cela | After that, we ate.
finally | enfin | Finally, we went home.
best wishes | meilleurs voeux | Best wishes, Kofi.
trip | voyage | The school trip was fun.`,
hw:{t:"A letter to a friend",b:"Écris une lettre informelle de 120 mots à un ami : parle de ton école, de ta famille et invite-le pour les vacances."}},

{c:"1re",u:1,lv:"B1",t:"Governance, politics and gender equality",th:"Commonwealth, democracy, gender",g:"Complex sentences, relative clauses",
body:`**Gouvernance** : government, election, democracy, president, parliament, the **Commonwealth**.
**Genre et société** : gender equality, women's rights, equal opportunities, job.

**Propositions relatives** : **who** (personne), **which** (chose), **whose** (possession), **where** (lieu).
The woman **who** leads the school is my aunt. The law **which** protects women is new.

**Subordonnées** : **although**, **while**, **as soon as**, **so that**.
Girls should go to school **so that** they can get good jobs.

Argumenter : **In my opinion**, **I strongly believe that**, **On the one hand... on the other hand...**`,
quiz:`The man ___ lives next door is a teacher.
* who
- which
- where

The law ___ protects women is important.
* which
- whose
- who

___ I strongly believe that girls need education.
* In my opinion,
- Because of
- However of

Girls should study ___ they can get good jobs.
* so that
- although
- unless

Le mot « election » veut dire…
* élection
- électricité
- éducation`,
deck:`government | gouvernement | The government builds schools.
election | élection | The election was peaceful.
democracy | démocratie | Democracy gives people a voice.
Commonwealth | Commonwealth | Togo joined the Commonwealth in 2022.
gender equality | égalité de genre | Gender equality is a right.
equal | égal | We are equal.
opportunity | opportunité | Everyone needs an opportunity.
in my opinion | à mon avis | In my opinion, school is vital.`,
hw:{t:"Women and work in Togo",b:"Rédige un texte argumentatif de 150 mots : « Women and men should have the same job opportunities. » Utilise au moins 3 relatives et 3 connecteurs."}},

{c:"1re",u:2,lv:"B2",t:"Cybercrime and the Internet",th:"Science, technology, internet",g:"Conditional type 3, summary writing",
body:`**Vocabulaire** : internet, cybercrime, scam, password, hacker, privacy, social media, online.

**Conditionnel type 3** (regret, passé impossible) : **If** he **had used** a strong password, he **would not have been hacked**.
Structure : **If + past perfect, would have + participe passé.**

**Résumé de texte** : lis, repère l'idée de chaque paragraphe, écris avec **tes propres mots** (environ 1/3 de la longueur du texte).

**Conseils en ligne** : never share your password; do not click on strange links; protect your privacy.`,
quiz:`If she ___ the link, she would not have lost her money.
* had not clicked
- did not click
- has not clicked

If I had known, I ___ you.
* would have told
- would tell
- will tell

Un « scam » est…
* une arnaque
- un jeu
- une application

Dans un résumé, on écrit…
* avec ses propres mots
- en recopiant tout
- en ajoutant son opinion

Complète : « Never share your ___ . » (mot de passe)
= password`,
deck:`cybercrime | cybercriminalité | Cybercrime is increasing.
scam | arnaque | The message was a scam.
password | mot de passe | Use a strong password.
hacker | pirate informatique | The hacker stole data.
privacy | vie privée | Protect your privacy.
online | en ligne | I study online.
link | lien | Don't click on that link.
to protect | protéger | Protect your account.`,
hw:{t:"Staying safe online",b:"Écris un conseil de 8 phrases à des lycéens sur la sécurité sur Internet (2 phrases au conditionnel type 3)."}},

{c:"Tle",u:1,lv:"B2",t:"Globalisation, migration and development",th:"Globalisation, emigration, sustainable development",g:"Registers, formal writing, linking ideas",
body:`**Vocabulaire** : globalisation, trade, migration, emigrant, immigrant, development, sustainable, poverty.

**Registres** : informel (**kids**, **gonna**, **can't**) ≠ formel (**children**, **going to**, **cannot**). À l'examen, utilise un registre **formel** : pas de contractions, vocabulaire précis.

**Plan d'une dissertation (essay)** :
1. **Introduction** : présente le sujet et ta thèse.
2. **Développement** : 2 ou 3 paragraphes, un argument + un exemple chacun.
3. **Conclusion** : résume et ouvre.

Connecteurs : **Firstly**, **Furthermore**, **In addition**, **On the contrary**, **To sum up**.`,
quiz:`Quel mot est formel ?
* children
- kids
- guys

Quelle partie présente la thèse ?
* l'introduction
- la conclusion
- le titre

« To sum up » sert à…
* conclure
- commencer
- donner un exemple

Une personne qui quitte son pays est…
* an emigrant
- an immigrant
- a citizen

Complète : « Sustainable ___ protects the future. » (développement)
= development`,
deck:`globalisation | mondialisation | Globalisation connects countries.
trade | commerce | Trade helps economies.
emigrant | émigré | An emigrant leaves his country.
immigrant | immigré | An immigrant arrives in a new country.
sustainable | durable | Sustainable energy is clean.
poverty | pauvreté | Poverty must end.
furthermore | de plus | Furthermore, it is cheaper.
to sum up | en résumé | To sum up, we must act.`,
hw:{t:"Essay: Is globalisation good for Africa?",b:"Rédige une dissertation de 250 mots avec introduction, 2 arguments avec exemples et conclusion. Registre formel."}},

{c:"Tle",u:2,lv:"B2",t:"Human rights, peace and democracy",th:"Human rights, democracy, peace",g:"Debate and critical analysis",
body:`**Vocabulaire** : human rights, freedom, justice, peace, conflict, election, equality, debate.

**Donner son opinion** : **I agree / I disagree**, **I am convinced that**, **I would argue that**.
**Nuancer** : **to some extent**, **it depends on**, **there is some truth in...**
**Répondre à un argument** : **That may be true, but...**, **On the other hand...**

**Analyse critique d'un document** : 1) Qui écrit ? 2) Pour qui ? 3) Quel est le message ? 4) Quels arguments ? 5) Mon avis.

Exemple : « Freedom of speech is essential in a democracy, **but** it must respect other people's rights. »`,
quiz:`Quelle phrase exprime un désaccord ?
* I disagree with this idea.
- I am convinced of it.
- That is true.

« To some extent » signifie…
* dans une certaine mesure
- jamais
- toujours

Dans une analyse de document, on commence par…
* identifier l'auteur et le public
- recopier le texte
- donner sa note

« Freedom » veut dire…
* liberté
- loi
- égalité

Complète : « Human ___ must be respected. » (droits)
= rights`,
deck:`human rights | droits humains | Human rights protect everyone.
freedom | liberté | Freedom of speech matters.
justice | justice | We want justice.
peace | paix | Peace brings development.
conflict | conflit | Conflict destroys lives.
debate | débat | We had a debate today.
to agree | être d'accord | I agree with you.
to some extent | dans une certaine mesure | To some extent, you are right.`,
hw:{t:"Debate: Democracy and peace",b:"Prépare un discours de 2 minutes (environ 200 mots) : « Democracy is the best way to keep peace. » Donne 3 arguments."}},

{c:"Université",u:1,lv:"B1",t:"Business English for students (ESP)",th:"English for Specific Purposes",g:"Professional vocabulary, formal emails",
body:`**Business English** s'adapte à ta filière : gestion, droit, économie, sciences, informatique, médecine.

**Vocabulaire clé** : **meeting**, **deadline**, **invoice**, **budget**, **customer**, **contract**, **profit**, **to negotiate**.

**Mail formel** :
Subject: Request for information
**Dear Mr Mensah,**
**I am writing to ask about** ...
**Could you please send** me the price list?
**I look forward to hearing from you.**
**Yours sincerely,** Ama Koffi

Politesse : **Could you...?**, **Would you mind...?**, **I would appreciate it if...**`,
quiz:`Une « deadline » est…
* une date limite
- un budget
- une réunion

Quelle formule est polie ?
* Could you please send the report?
- Send me the report now.
- You send report.

« I look forward to hearing from you » se place…
* à la fin du mail
- au début
- dans l'objet

« Invoice » signifie…
* facture
- contrat
- profit

Complète : « Dear Mr Mensah, I am ___ to ask about the price. »
= writing`,
deck:`meeting | réunion | The meeting starts at ten.
deadline | date limite | The deadline is Friday.
invoice | facture | Please pay the invoice.
budget | budget | Our budget is small.
customer | client | The customer is satisfied.
contract | contrat | He signed the contract.
profit | bénéfice | The company made a profit.
to negotiate | négocier | We negotiate the price.`,
hw:{t:"A formal email",b:"Écris un mail formel de 100 mots à une entreprise pour demander un stage. Utilise Dear..., I am writing to..., Yours sincerely."}},

{c:"Adultes",u:1,lv:"B1",t:"English at work: emails, meetings, presentations",th:"Professional English",g:"Polite requests, meetings vocabulary",
body:`**Au travail**, l'anglais sert surtout à écrire des mails, participer à des réunions et présenter un projet.

**Demander poliment** : **Could you...?**, **Would it be possible to...?**, **I would be grateful if...**
**En réunion** : **Let's start.**, **I'd like to add...**, **Can we move on to the next point?**, **Let's summarise.**
**Présenter** : **Good morning, everyone. Today I will talk about...**, **First, ... Second, ... Finally, ...**, **Thank you for your attention.**

**Certifications** : TOEFL, IELTS, TOEIC mesurent ton niveau (A1 à C2).`,
quiz:`Quelle phrase est la plus polie ?
* Would it be possible to meet on Monday?
- Meet me Monday.
- Monday meet.

« Let's move on to the next point » sert à…
* passer au sujet suivant
- finir la réunion
- refuser

Pour terminer une présentation, on dit…
* Thank you for your attention.
- Goodbye teacher.
- See you never.

Le TOEIC est…
* un test d'anglais professionnel
- une langue
- un contrat

Complète : « Today I will ___ about our new project. » (parler)
= talk`,
deck:`schedule | emploi du temps | Here is my schedule.
colleague | collègue | My colleague is helpful.
client | client | I meet a client today.
to attend | assister à | I attend the meeting.
report | rapport | I wrote the report.
to summarise | résumer | Let's summarise the points.
presentation | présentation | My presentation is ready.
certificate | certificat | She has an IELTS certificate.`,
hw:{t:"Introduce yourself at a meeting",b:"Écris une présentation de 100 mots : ton nom, ton métier, ton projet. Termine par Thank you for your attention."}}
];
