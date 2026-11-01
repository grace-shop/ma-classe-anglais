/* =====================================================================
   v5 · Photo editor, before you send a photo.
   In the photo preview: "✏️ Edit" opens the editor.
   - Rogner: crop, free or 1:1, 4:5, 9:16.
   - Texte: your words, with a choice of fonts and colours, moved by a finger.
   - Flou: paint over a place (a face, an address) to blur it.
   - Marqueur: draw with a coloured brush.
   - Stickers: emoji, moved by a finger.
   - Annuler: undo the last change.
   The edited photo replaces the preview. HD keeps the full size.
   Videos are not edited here yet.
   ===================================================================== */
(function () {
  var FONTS = [
    { n: "Normal", f: "system-ui, sans-serif" },
    { n: "Pacifico", f: "'Pacifico', cursive" },
    { n: "Dancing", f: "'Dancing Script', cursive" },
    { n: "Lobster", f: "'Lobster', cursive" },
    { n: "Bangers", f: "'Bangers', cursive" },
    { n: "Playfair", f: "'Playfair Display', serif" },
    { n: "Cinzel", f: "'Cinzel', serif" },
    { n: "Permanent", f: "'Permanent Marker', cursive" }
  ];
  var COLORS = ["#FFFFFF", "#000000", "#EF4444", "#F59E0B", "#22C55E", "#38BDF8", "#A78BFA", "#EC4899"];
  // every emoji of the standard emoji blocks (the phone draws them with its own font)
  var EMOJI = ["\u{1F600}","\u{1F601}","\u{1F602}","\u{1F603}","\u{1F604}","\u{1F605}","\u{1F606}","\u{1F607}","\u{1F608}","\u{1F609}","\u{1F60A}","\u{1F60B}","\u{1F60C}","\u{1F60D}","\u{1F60E}","\u{1F60F}","\u{1F610}","\u{1F611}","\u{1F612}","\u{1F613}","\u{1F614}","\u{1F615}","\u{1F616}","\u{1F617}","\u{1F618}","\u{1F619}","\u{1F61A}","\u{1F61B}","\u{1F61C}","\u{1F61D}","\u{1F61E}","\u{1F61F}","\u{1F620}","\u{1F621}","\u{1F622}","\u{1F623}","\u{1F624}","\u{1F625}","\u{1F626}","\u{1F627}","\u{1F628}","\u{1F629}","\u{1F62A}","\u{1F62B}","\u{1F62C}","\u{1F62D}","\u{1F62E}","\u{1F62F}","\u{1F630}","\u{1F631}","\u{1F632}","\u{1F633}","\u{1F634}","\u{1F635}","\u{1F636}","\u{1F637}","\u{1F638}","\u{1F639}","\u{1F63A}","\u{1F63B}","\u{1F63C}","\u{1F63D}","\u{1F63E}","\u{1F63F}","\u{1F640}","\u{1F641}","\u{1F642}","\u{1F643}","\u{1F644}","\u{1F645}","\u{1F646}","\u{1F647}","\u{1F648}","\u{1F649}","\u{1F64A}","\u{1F64B}","\u{1F64C}","\u{1F64D}","\u{1F64E}","\u{1F64F}","\u{1F910}","\u{1F911}","\u{1F912}","\u{1F913}","\u{1F914}","\u{1F915}","\u{1F916}","\u{1F917}","\u{1F918}","\u{1F919}","\u{1F91A}","\u{1F91B}","\u{1F91C}","\u{1F91D}","\u{1F91E}","\u{1F91F}","\u{1F920}","\u{1F921}","\u{1F922}","\u{1F923}","\u{1F924}","\u{1F925}","\u{1F926}","\u{1F927}","\u{1F928}","\u{1F929}","\u{1F92A}","\u{1F92B}","\u{1F92C}","\u{1F92D}","\u{1F92E}","\u{1F92F}","\u{1F970}","\u{1F971}","\u{1F972}","\u{1F973}","\u{1F974}","\u{1F975}","\u{1F976}","\u{1F977}","\u{1F978}","\u{1F979}","\u{1F97A}","\u{1F9D0}","\u{1F300}","\u{1F301}","\u{1F302}","\u{1F303}","\u{1F304}","\u{1F305}","\u{1F306}","\u{1F307}","\u{1F308}","\u{1F309}","\u{1F30A}","\u{1F30B}","\u{1F30C}","\u{1F30D}","\u{1F30E}","\u{1F30F}","\u{1F310}","\u{1F311}","\u{1F312}","\u{1F313}","\u{1F314}","\u{1F315}","\u{1F316}","\u{1F317}","\u{1F318}","\u{1F319}","\u{1F31A}","\u{1F31B}","\u{1F31C}","\u{1F31D}","\u{1F31E}","\u{1F31F}","\u{1F320}","\u{1F330}","\u{1F331}","\u{1F332}","\u{1F333}","\u{1F334}","\u{1F335}","\u{1F337}","\u{1F338}","\u{1F339}","\u{1F33A}","\u{1F33B}","\u{1F33C}","\u{1F33D}","\u{1F33E}","\u{1F33F}","\u{1F340}","\u{1F341}","\u{1F342}","\u{1F343}","\u{1F344}","\u{1F345}","\u{1F346}","\u{1F347}","\u{1F348}","\u{1F349}","\u{1F34A}","\u{1F34B}","\u{1F34C}","\u{1F34D}","\u{1F34E}","\u{1F34F}","\u{1F350}","\u{1F351}","\u{1F352}","\u{1F353}","\u{1F354}","\u{1F355}","\u{1F356}","\u{1F357}","\u{1F358}","\u{1F359}","\u{1F35A}","\u{1F35B}","\u{1F35C}","\u{1F35D}","\u{1F35E}","\u{1F35F}","\u{1F360}","\u{1F361}","\u{1F362}","\u{1F363}","\u{1F364}","\u{1F365}","\u{1F366}","\u{1F367}","\u{1F368}","\u{1F369}","\u{1F36A}","\u{1F36B}","\u{1F36C}","\u{1F36D}","\u{1F36E}","\u{1F36F}","\u{1F370}","\u{1F371}","\u{1F372}","\u{1F373}","\u{1F374}","\u{1F375}","\u{1F376}","\u{1F377}","\u{1F378}","\u{1F379}","\u{1F37A}","\u{1F37B}","\u{1F37C}","\u{1F380}","\u{1F381}","\u{1F382}","\u{1F383}","\u{1F384}","\u{1F385}","\u{1F386}","\u{1F387}","\u{1F388}","\u{1F389}","\u{1F38A}","\u{1F38B}","\u{1F38C}","\u{1F38D}","\u{1F38E}","\u{1F38F}","\u{1F390}","\u{1F391}","\u{1F392}","\u{1F393}","\u{1F3A0}","\u{1F3A1}","\u{1F3A2}","\u{1F3A3}","\u{1F3A4}","\u{1F3A5}","\u{1F3A6}","\u{1F3A7}","\u{1F3A8}","\u{1F3A9}","\u{1F3AA}","\u{1F3AB}","\u{1F3AC}","\u{1F3AD}","\u{1F3AE}","\u{1F3AF}","\u{1F3B0}","\u{1F3B1}","\u{1F3B2}","\u{1F3B3}","\u{1F3B4}","\u{1F3B5}","\u{1F3B6}","\u{1F3B7}","\u{1F3B8}","\u{1F3B9}","\u{1F3BA}","\u{1F3BB}","\u{1F3BC}","\u{1F3BD}","\u{1F3BE}","\u{1F3BF}","\u{1F3C0}","\u{1F3C1}","\u{1F3C2}","\u{1F3C3}","\u{1F3C4}","\u{1F3C5}","\u{1F3C6}","\u{1F3C7}","\u{1F3C8}","\u{1F3C9}","\u{1F3CA}","\u{1F3E0}","\u{1F3E1}","\u{1F3E2}","\u{1F3E3}","\u{1F3E4}","\u{1F3E5}","\u{1F3E6}","\u{1F3E7}","\u{1F3E8}","\u{1F3E9}","\u{1F3EA}","\u{1F3EB}","\u{1F3EC}","\u{1F3ED}","\u{1F3EE}","\u{1F3EF}","\u{1F3F0}","\u{1F400}","\u{1F401}","\u{1F402}","\u{1F403}","\u{1F404}","\u{1F405}","\u{1F406}","\u{1F407}","\u{1F408}","\u{1F409}","\u{1F40A}","\u{1F40B}","\u{1F40C}","\u{1F40D}","\u{1F40E}","\u{1F40F}","\u{1F410}","\u{1F411}","\u{1F412}","\u{1F413}","\u{1F414}","\u{1F415}","\u{1F416}","\u{1F417}","\u{1F418}","\u{1F419}","\u{1F41A}","\u{1F41B}","\u{1F41C}","\u{1F41D}","\u{1F41E}","\u{1F41F}","\u{1F420}","\u{1F421}","\u{1F422}","\u{1F423}","\u{1F424}","\u{1F425}","\u{1F426}","\u{1F427}","\u{1F428}","\u{1F429}","\u{1F42A}","\u{1F42B}","\u{1F42C}","\u{1F42D}","\u{1F42E}","\u{1F42F}","\u{1F430}","\u{1F431}","\u{1F432}","\u{1F433}","\u{1F434}","\u{1F435}","\u{1F436}","\u{1F437}","\u{1F438}","\u{1F439}","\u{1F43A}","\u{1F43B}","\u{1F43C}","\u{1F43D}","\u{1F43E}","\u{1F440}","\u{1F442}","\u{1F443}","\u{1F444}","\u{1F445}","\u{1F446}","\u{1F447}","\u{1F448}","\u{1F449}","\u{1F44A}","\u{1F44B}","\u{1F44C}","\u{1F44D}","\u{1F44E}","\u{1F44F}","\u{1F450}","\u{1F451}","\u{1F452}","\u{1F453}","\u{1F454}","\u{1F455}","\u{1F456}","\u{1F457}","\u{1F458}","\u{1F459}","\u{1F45A}","\u{1F45B}","\u{1F45C}","\u{1F45D}","\u{1F45E}","\u{1F45F}","\u{1F460}","\u{1F461}","\u{1F462}","\u{1F463}","\u{1F464}","\u{1F465}","\u{1F466}","\u{1F467}","\u{1F468}","\u{1F469}","\u{1F46A}","\u{1F46B}","\u{1F46C}","\u{1F46D}","\u{1F46E}","\u{1F46F}","\u{1F470}","\u{1F471}","\u{1F472}","\u{1F473}","\u{1F474}","\u{1F475}","\u{1F476}","\u{1F477}","\u{1F478}","\u{1F479}","\u{1F47A}","\u{1F47B}","\u{1F47C}","\u{1F47D}","\u{1F47E}","\u{1F47F}","\u{1F480}","\u{1F481}","\u{1F482}","\u{1F483}","\u{1F484}","\u{1F485}","\u{1F486}","\u{1F487}","\u{1F488}","\u{1F489}","\u{1F48A}","\u{1F48B}","\u{1F48C}","\u{1F48D}","\u{1F48E}","\u{1F48F}","\u{1F490}","\u{1F491}","\u{1F492}","\u{1F493}","\u{1F494}","\u{1F495}","\u{1F496}","\u{1F497}","\u{1F498}","\u{1F499}","\u{1F49A}","\u{1F49B}","\u{1F49C}","\u{1F49D}","\u{1F49E}","\u{1F49F}","\u{1F4A0}","\u{1F4A1}","\u{1F4A2}","\u{1F4A3}","\u{1F4A4}","\u{1F4A5}","\u{1F4A6}","\u{1F4A7}","\u{1F4A8}","\u{1F4A9}","\u{1F4AA}","\u{1F4AB}","\u{1F4AC}","\u{1F4AD}","\u{1F4AE}","\u{1F4AF}","\u{1F4B0}","\u{1F4B1}","\u{1F4B2}","\u{1F4B3}","\u{1F4B4}","\u{1F4B5}","\u{1F4B6}","\u{1F4B7}","\u{1F4B8}","\u{1F4B9}","\u{1F4BA}","\u{1F4BB}","\u{1F4BC}","\u{1F4BD}","\u{1F4BE}","\u{1F4BF}","\u{1F4C0}","\u{1F4C1}","\u{1F4C2}","\u{1F4C3}","\u{1F4C4}","\u{1F4C5}","\u{1F4C6}","\u{1F4C7}","\u{1F4C8}","\u{1F4C9}","\u{1F4CA}","\u{1F4CB}","\u{1F4CC}","\u{1F4CD}","\u{1F4CE}","\u{1F4CF}","\u{1F4D0}","\u{1F4D1}","\u{1F4D2}","\u{1F4D3}","\u{1F4D4}","\u{1F4D5}","\u{1F4D6}","\u{1F4D7}","\u{1F4D8}","\u{1F4D9}","\u{1F4DA}","\u{1F4DB}","\u{1F4DC}","\u{1F4DD}","\u{1F4DE}","\u{1F4DF}","\u{1F4E0}","\u{1F4E1}","\u{1F4E2}","\u{1F4E3}","\u{1F4E4}","\u{1F4E5}","\u{1F4E6}","\u{1F4E7}","\u{1F4E8}","\u{1F4E9}","\u{1F4EA}","\u{1F4EB}","\u{1F4EC}","\u{1F4ED}","\u{1F4EE}","\u{1F4EF}","\u{1F4F0}","\u{1F4F1}","\u{1F4F2}","\u{1F4F3}","\u{1F4F4}","\u{1F4F5}","\u{1F4F6}","\u{1F4F7}","\u{1F4F8}","\u{1F4F9}","\u{1F4FA}","\u{1F4FB}","\u{1F4FC}","\u{1F4FF}","\u{1F500}","\u{1F501}","\u{1F502}","\u{1F503}","\u{1F504}","\u{1F505}","\u{1F506}","\u{1F507}","\u{1F508}","\u{1F509}","\u{1F50A}","\u{1F50B}","\u{1F50C}","\u{1F50D}","\u{1F50E}","\u{1F50F}","\u{1F510}","\u{1F511}","\u{1F512}","\u{1F513}","\u{1F514}","\u{1F515}","\u{1F516}","\u{1F517}","\u{1F518}","\u{1F519}","\u{1F51A}","\u{1F51B}","\u{1F51C}","\u{1F51D}","\u{1F51E}","\u{1F51F}","\u{1F520}","\u{1F521}","\u{1F522}","\u{1F523}","\u{1F524}","\u{1F525}","\u{1F526}","\u{1F527}","\u{1F528}","\u{1F529}","\u{1F52A}","\u{1F52B}","\u{1F52C}","\u{1F52D}","\u{1F52E}","\u{1F52F}","\u{1F530}","\u{1F531}","\u{1F532}","\u{1F533}","\u{1F534}","\u{1F535}","\u{1F536}","\u{1F537}","\u{1F538}","\u{1F539}","\u{1F53A}","\u{1F53B}","\u{1F53C}","\u{1F53D}","\u{1F5FB}","\u{1F5FC}","\u{1F5FD}","\u{1F5FE}","\u{1F5FF}","\u{1F680}","\u{1F681}","\u{1F682}","\u{1F683}","\u{1F684}","\u{1F685}","\u{1F686}","\u{1F687}","\u{1F688}","\u{1F689}","\u{1F68A}","\u{1F68B}","\u{1F68C}","\u{1F68D}","\u{1F68E}","\u{1F68F}","\u{1F690}","\u{1F691}","\u{1F692}","\u{1F693}","\u{1F694}","\u{1F695}","\u{1F696}","\u{1F697}","\u{1F698}","\u{1F699}","\u{1F69A}","\u{1F69B}","\u{1F69C}","\u{1F69D}","\u{1F69E}","\u{1F69F}","\u{1F6A0}","\u{1F6A1}","\u{1F6A2}","\u{1F6A3}","\u{1F6A4}","\u{1F6A5}","\u{1F6A6}","\u{1F6A7}","\u{1F6A8}","\u{1F6A9}","\u{1F6AA}","\u{1F6AB}","\u{1F6AC}","\u{1F6AD}","\u{1F6AE}","\u{1F6AF}","\u{1F6B0}","\u{1F6B1}","\u{1F6B2}","\u{1F6B3}","\u{1F6B4}","\u{1F6B5}","\u{1F6B6}","\u{1F6B7}","\u{1F6B8}","\u{1F6B9}","\u{1F6BA}","\u{1F6BB}","\u{1F6BC}","\u{1F6BD}","\u{1F6BE}","\u{1F6BF}","\u{1F6C0}","\u{1F6C1}","\u{1F6C2}","\u{1F6C3}","\u{1F6C4}","\u{1F6C5}","\u{1F6D0}","\u{1F6D1}","\u{1F6D2}","\u{1F6EB}","\u{1F6EC}","\u{1F6F4}","\u{1F6F5}","\u{1F6F6}","\u{1F6F7}","\u{1F6F8}","\u{1F6F9}","\u{1F6FA}","\u{1F7E0}","\u{1F7E1}","\u{1F7E2}","\u{1F7E3}","\u{1F7E4}","\u{1F7E5}","\u{1F7E6}","\u{1F7E7}","\u{1F7E8}","\u{1F7E9}","\u{1F7EA}","\u{1F7EB}","\u{1F90C}","\u{1F90D}","\u{1F90E}","\u{1F90F}","\u{1F930}","\u{1F931}","\u{1F932}","\u{1F933}","\u{1F934}","\u{1F935}","\u{1F936}","\u{1F937}","\u{1F938}","\u{1F939}","\u{1F93A}","\u{1F93C}","\u{1F93D}","\u{1F93E}","\u{1F93F}","\u{1F940}","\u{1F941}","\u{1F942}","\u{1F943}","\u{1F944}","\u{1F945}","\u{1F947}","\u{1F948}","\u{1F949}","\u{1F94A}","\u{1F94B}","\u{1F94C}","\u{1F94D}","\u{1F94E}","\u{1F94F}","\u{1F950}","\u{1F951}","\u{1F952}","\u{1F953}","\u{1F954}","\u{1F955}","\u{1F956}","\u{1F957}","\u{1F958}","\u{1F959}","\u{1F95A}","\u{1F95B}","\u{1F95C}","\u{1F95D}","\u{1F95E}","\u{1F95F}","\u{1F960}","\u{1F961}","\u{1F962}","\u{1F963}","\u{1F964}","\u{1F965}","\u{1F966}","\u{1F967}","\u{1F968}","\u{1F969}","\u{1F96A}","\u{1F96B}","\u{1F96C}","\u{1F96D}","\u{1F96E}","\u{1F96F}","\u{1F97B}","\u{1F97C}","\u{1F97D}","\u{1F97E}","\u{1F97F}","\u{1F980}","\u{1F981}","\u{1F982}","\u{1F983}","\u{1F984}","\u{1F985}","\u{1F986}","\u{1F987}","\u{1F988}","\u{1F989}","\u{1F98A}","\u{1F98B}","\u{1F98C}","\u{1F98D}","\u{1F98E}","\u{1F98F}","\u{1F990}","\u{1F991}","\u{1F992}","\u{1F993}","\u{1F994}","\u{1F995}","\u{1F996}","\u{1F997}","\u{1F998}","\u{1F999}","\u{1F99A}","\u{1F99B}","\u{1F99C}","\u{1F99D}","\u{1F99E}","\u{1F99F}","\u{1F9A0}","\u{1F9A1}","\u{1F9A2}","\u{1F9A3}","\u{1F9A4}","\u{1F9A5}","\u{1F9A6}","\u{1F9A7}","\u{1F9A8}","\u{1F9A9}","\u{1F9AA}","\u{1F9AB}","\u{1F9AC}","\u{1F9AD}","\u{1F9AE}","\u{1F9AF}","\u{1F9B0}","\u{1F9B1}","\u{1F9B2}","\u{1F9B3}","\u{1F9B4}","\u{1F9B5}","\u{1F9B6}","\u{1F9B7}","\u{1F9B8}","\u{1F9B9}","\u{1F9BA}","\u{1F9BB}","\u{1F9BC}","\u{1F9BD}","\u{1F9BE}","\u{1F9BF}","\u{1F9C0}","\u{1F9C1}","\u{1F9C2}","\u{1F9C3}","\u{1F9C4}","\u{1F9C5}","\u{1F9C6}","\u{1F9C7}","\u{1F9C8}","\u{1F9C9}","\u{1F9CA}","\u{1F9CB}","\u{1F9CC}","\u{1F9CD}","\u{1F9CE}","\u{1F9CF}","\u{1F9D1}","\u{1F9D2}","\u{1F9D3}","\u{1F9D4}","\u{1F9D5}","\u{1F9D6}","\u{1F9D7}","\u{1F9D8}","\u{1F9D9}","\u{1F9DA}","\u{1F9DB}","\u{1F9DC}","\u{1F9DD}","\u{1F9DE}","\u{1F9DF}","\u{1F9E0}","\u{1F9E1}","\u{1F9E2}","\u{1F9E3}","\u{1F9E4}","\u{1F9E5}","\u{1F9E6}","\u{1F9E7}","\u{1F9E8}","\u{1F9E9}","\u{1F9EA}","\u{1F9EB}","\u{1F9EC}","\u{1F9ED}","\u{1F9EE}","\u{1F9EF}","\u{1F9F0}","\u{1F9F1}","\u{1F9F2}","\u{1F9F3}","\u{1F9F4}","\u{1F9F5}","\u{1F9F6}","\u{1F9F7}","\u{1F9F8}","\u{1F9F9}","\u{1F9FA}","\u{1F9FB}","\u{1F9FC}","\u{1F9FD}","\u{1F9FE}","\u{1F9FF}","\u{2600}","\u{2601}","\u{2602}","\u{2603}","\u{2604}","\u{260E}","\u{2611}","\u{2614}","\u{2615}","\u{2618}","\u{261D}","\u{2620}","\u{2622}","\u{2623}","\u{2626}","\u{262A}","\u{262E}","\u{262F}","\u{2638}","\u{2639}","\u{263A}","\u{2640}","\u{2642}","\u{2648}","\u{2649}","\u{264A}","\u{264B}","\u{264C}","\u{264D}","\u{264E}","\u{264F}","\u{2650}","\u{2651}","\u{2652}","\u{2653}","\u{265F}","\u{2660}","\u{2663}","\u{2665}","\u{2666}","\u{2668}","\u{267B}","\u{267E}","\u{267F}","\u{2692}","\u{2693}","\u{2694}","\u{2695}","\u{2696}","\u{2697}","\u{2699}","\u{269B}","\u{269C}","\u{26A0}","\u{26A1}","\u{26A7}","\u{26AA}","\u{26AB}","\u{26B0}","\u{26B1}","\u{26BD}","\u{26BE}","\u{26C4}","\u{26C5}","\u{26C8}","\u{26CE}","\u{26CF}","\u{26D1}","\u{26D3}","\u{26D4}","\u{26E9}","\u{26EA}","\u{26F0}","\u{26F1}","\u{26F2}","\u{26F3}","\u{26F4}","\u{26F5}","\u{26F7}","\u{26F8}","\u{26F9}","\u{26FA}","\u{26FD}","\u{2702}","\u{2705}","\u{2708}","\u{2709}","\u{270A}","\u{270B}","\u{270C}","\u{270D}","\u{270F}","\u{2712}","\u{2714}","\u{2716}","\u{271D}","\u{2721}","\u{2728}","\u{2733}","\u{2734}","\u{2744}","\u{2747}","\u{274C}","\u{274E}","\u{2753}","\u{2754}","\u{2755}","\u{2757}","\u{2763}","\u{2764}","\u{2795}","\u{2796}","\u{2797}","\u{27A1}","\u{27B0}","\u{27BF}","\u{2B05}","\u{2B06}","\u{2B07}","\u{2B1B}","\u{2B1C}","\u{2B50}","\u{2B55}","\u{3030}","\u{303D}","\u{3297}","\u{3299}","\u{1F1F9}\u{1F1EC}"];

  var ed = null; // { img, W, H, objs:[], undo:[], tool, color, font, size, crop:{x,y,w,h}, ratio, drag, root, cv, ctx, scale }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // stored stickers (images): loaded once, drawn at their size, keep their ratio
  var SIMG = {};
  function simgLoad(o) {
    var key = o.p;
    if (SIMG[key]) return SIMG[key];
    var rec = { im: null, ok: false };
    SIMG[key] = rec;
    if (typeof srcBlob === "function") {
      srcBlob({ k: "m", id: o.p, t: o.mt }).then(function (b) {
        var im = new Image();
        im.onload = function () { rec.im = im; rec.ok = true; try { if (ed && ed.ctx) redraw(); } catch (x) {} };
        im.src = URL.createObjectURL(b);
      }).catch(function () {});
    }
    return rec;
  }
  function simgPaint(ctx, o) {
    var rec = simgLoad(o);
    if (!rec.ok) return;
    var w = o.size, h = o.size * rec.im.naturalHeight / rec.im.naturalWidth;
    ctx.drawImage(rec.im, o.x - w / 2, o.y - h / 2, w, h);
  }

  function snap() { ed.undo.push(clone(ed.objs)); if (ed.undo.length > 40) ed.undo.shift(); }

  // ---- drawing (in image coordinates) ----
  function paint(ctx, withCrop) {
    var W = ed.W, H = ed.H;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(ed.img, 0, 0, W, H);
    // blur strokes: the blurred picture, shown only where painted
    var blurs = ed.objs.filter(function (o) { return o.t === "blur"; });
    if (blurs.length) {
      var mask = document.createElement("canvas");
      mask.width = W; mask.height = H;
      var mc = mask.getContext("2d");
      blurs.forEach(function (o) { strokePath(mc, o, "#fff"); });
      var bl = document.createElement("canvas");
      bl.width = W; bl.height = H;
      var bc = bl.getContext("2d");
      bc.filter = "blur(" + Math.max(10, Math.round(W / 60)) + "px)";
      bc.drawImage(ed.img, 0, 0, W, H);
      bc.filter = "none";
      bc.globalCompositeOperation = "destination-in";
      bc.drawImage(mask, 0, 0);
      ctx.drawImage(bl, 0, 0);
    }
    ed.objs.forEach(function (o) {
      if (o.t === "stroke") strokePath(ctx, o, o.color);
      else if (o.t === "text") {
        ctx.font = "700 " + o.size + "px " + FONTS[o.font].f;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = Math.max(2, o.size / 9);
        ctx.strokeStyle = "rgba(0,0,0,.55)";
        ctx.strokeText(o.text, o.x, o.y);
        ctx.fillStyle = o.color;
        ctx.fillText(o.text, o.x, o.y);
      } else if (o.t === "simg") {
        simgPaint(ctx, o);
      } else if (o.t === "sticker") {
        ctx.font = o.size + "px serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(o.e, o.x, o.y);
      }
    });
    if (withCrop && ed.crop) {
      var c = ed.crop;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, W / 400);
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      var hl = Math.max(28, W / 14);
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(5, W / 120);
      ctx.beginPath();
      ctx.moveTo(c.x + c.w / 2 - hl / 2, c.y); ctx.lineTo(c.x + c.w / 2 + hl / 2, c.y);
      ctx.moveTo(c.x + c.w / 2 - hl / 2, c.y + c.h); ctx.lineTo(c.x + c.w / 2 + hl / 2, c.y + c.h);
      ctx.moveTo(c.x, c.y + c.h / 2 - hl / 2); ctx.lineTo(c.x, c.y + c.h / 2 + hl / 2);
      ctx.moveTo(c.x + c.w, c.y + c.h / 2 - hl / 2); ctx.lineTo(c.x + c.w, c.y + c.h / 2 + hl / 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function strokePath(ctx, o, color) {
    if (!o.pts || !o.pts.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = o.w;
    ctx.beginPath();
    ctx.moveTo(o.pts[0][0], o.pts[0][1]);
    for (var i = 1; i < o.pts.length; i++) ctx.lineTo(o.pts[i][0], o.pts[i][1]);
    if (o.pts.length === 1) ctx.lineTo(o.pts[0][0] + 0.01, o.pts[0][1]);
    ctx.stroke();
    ctx.restore();
  }

  function redraw() { paint(ed.ctx, true); }

  // ---- coordinates ----
  function toImg(e) {
    var r = ed.cv.getBoundingClientRect();
    return [(e.clientX - r.left) * ed.W / r.width, (e.clientY - r.top) * ed.H / r.height];
  }

  // a corner of the photo where a dragged text or sticker is thrown away
  function binCorner(o) {
    var zx = ed.W * 0.22, zy = ed.H * 0.16;
    var l = o.x < zx, r = o.x > ed.W - zx, t = o.y < zy, b = o.y > ed.H - zy;
    if (!(l || r) || !(t || b)) return "";
    return (t ? "t" : "b") + (l ? "l" : "r");
  }

  // show the red bin in that corner (or hide it when "")
  function setBin(c) {
    ed.binCorner = c;
    var el = ed.root && ed.root.querySelector(".zz-pebin");
    if (!el) return;
    el.hidden = !c;
    if (c) el.dataset.c = c; else delete el.dataset.c;
  }

  // the width of a text as it is drawn (for a finger to grab the whole text)
  function textWidth(o) {
    ed.ctx.font = "700 " + o.size + "px " + FONTS[o.font].f;
    return ed.ctx.measureText(o.text).width;
  }

  function hit(p) {
    var pad = 30;
    for (var i = ed.objs.length - 1; i >= 0; i--) {
      var o = ed.objs[i];
      if (o.t === "text") {
        var half = textWidth(o) / 2;
        if (Math.abs(p[0] - o.x) <= half + pad && Math.abs(p[1] - o.y) <= o.size * 0.7 + pad) return i;
      } else if (o.t === "simg") {
        if (Math.abs(p[0] - o.x) <= o.size / 2 + pad && Math.abs(p[1] - o.y) <= o.size / 2 + pad) return i;
      } else if (o.t === "sticker") {
        var d = Math.hypot(p[0] - o.x, p[1] - o.y);
        if (d < Math.max(40, o.size * 0.8)) return i;
      }
    }
    return -1;
  }

  // what a finger on the crop frame grabs: a corner (tl, tr, bl, br), an edge
  // (t, b, l, r), the inside (in: moves the frame), or nothing ("")
  function cornerHit(p) {
    var c = ed.crop, r = Math.max(44, ed.W / 10);
    var pts = [[c.x, c.y, "tl"], [c.x + c.w, c.y, "tr"], [c.x, c.y + c.h, "bl"], [c.x + c.w, c.y + c.h, "br"]];
    for (var i = 0; i < pts.length; i++) if (Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) < r) return pts[i][2];
    var inX = p[0] >= c.x - r && p[0] <= c.x + c.w + r, inY = p[1] >= c.y - r && p[1] <= c.y + c.h + r;
    if (inY && Math.abs(p[0] - c.x) < r) return "l";
    if (inY && Math.abs(p[0] - (c.x + c.w)) < r) return "r";
    if (inX && Math.abs(p[1] - c.y) < r) return "t";
    if (inX && Math.abs(p[1] - (c.y + c.h)) < r) return "b";
    if (p[0] > c.x && p[0] < c.x + c.w && p[1] > c.y && p[1] < c.y + c.h) return "in";
    return "";
  }

  function applyRatio() {
    var c = ed.crop, W = ed.W, H = ed.H;
    if (!ed.ratio) { ed.crop = { x: 0, y: 0, w: W, h: H }; return; }
    var rw = ed.ratio[0], rh = ed.ratio[1];
    var w = W, h = w * rh / rw;
    if (h > H) { h = H; w = h * rw / rh; }
    ed.crop = { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
  }

  // ---- pointer ----
  function down(e) {
    e.preventDefault();
    var p = toImg(e);
    ed.cv.setPointerCapture && ed.cv.setPointerCapture(e.pointerId);
    if (ed.tool === "crop") {
      var k = cornerHit(p);
      if (k === "in") ed.drag = { kind: "shift", sx: p[0], sy: p[1], c0: { x: ed.crop.x, y: ed.crop.y, w: ed.crop.w, h: ed.crop.h } };
      else ed.drag = k ? { kind: "corner", k: k } : null;
      return;
    }
    if (ed.tool === "stroke" || ed.tool === "blur") {
      snap();
      ed.drag = { kind: "paint", o: { t: ed.tool === "blur" ? "blur" : "stroke", color: ed.color, w: Math.max(6, ed.W / 60) * ed.size, pts: [p] } };
      ed.objs.push(ed.drag.o);
      redraw();
      return;
    }
    var i = hit(p);
    if (i >= 0) { snap(); ed.drag = { kind: "move", i: i, dx: p[0] - ed.objs[i].x, dy: p[1] - ed.objs[i].y, started: false }; }
    else ed.drag = null;
  }

  function move(e) {
    if (!ed.drag) return;
    e.preventDefault();
    var p = toImg(e), d = ed.drag;
    if (d.kind === "paint") { d.o.pts.push(p); redraw(); return; }
    if (d.kind === "move") {
      if (!d.started) { d.started = true; }
      var o = ed.objs[d.i];
      o.x = p[0] - d.dx; o.y = p[1] - d.dy;
      setBin(binCorner(o));
      redraw();
      return;
    }
    if (d.kind === "shift") {
      var nx = d.c0.x + (p[0] - d.sx), ny = d.c0.y + (p[1] - d.sy);
      nx = Math.max(0, Math.min(nx, ed.W - d.c0.w));
      ny = Math.max(0, Math.min(ny, ed.H - d.c0.h));
      ed.crop = { x: nx, y: ny, w: d.c0.w, h: d.c0.h };
      redraw();
      return;
    }
    if (d.kind === "corner") {
      var c = ed.crop, x2 = c.x + c.w, y2 = c.y + c.h;
      var nx = Math.max(0, Math.min(p[0], ed.W)), ny = Math.max(0, Math.min(p[1], ed.H));
      var left = c.x, top = c.y, right = x2, bottom = y2;
      if (d.k.indexOf("l") >= 0) left = Math.min(nx, right - 40);
      if (d.k.indexOf("r") >= 0) right = Math.max(nx, left + 40);
      if (d.k.indexOf("t") >= 0) top = Math.min(ny, bottom - 40);
      if (d.k.indexOf("b") >= 0) bottom = Math.max(ny, top + 40);
      if (ed.ratio) {
        var w = right - left, h = w * ed.ratio[1] / ed.ratio[0];
        bottom = top + h;
        if (bottom > ed.H) { bottom = ed.H; top = bottom - h; }
        right = left + w;
      }
      ed.crop = { x: left, y: top, w: right - left, h: bottom - top };
      redraw();
    }
  }

  function up() {
    if (!ed.drag) return;
    var d = ed.drag;
    ed.drag = null;
    if (d.kind === "paint") redraw();
    if (d.kind === "move") {
      // released over the red bin: the text or sticker is removed
      if (ed.binCorner && ed.objs[d.i]) { ed.objs.splice(d.i, 1); redraw(); }
      setBin("");
    }
    // crop changes are not undone: they are a frame, not a mark
  }

  // ---- the editor screen ----
  function open(url, done, tool) {
    close();
    var img = new Image();
    img.onload = function () {
      // work at most 2048 px wide: keeps every move smooth on a phone
      var sc = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
      var base = document.createElement("canvas");
      base.width = Math.max(1, Math.round(img.naturalWidth * sc));
      base.height = Math.max(1, Math.round(img.naturalHeight * sc));
      base.getContext("2d").drawImage(img, 0, 0, base.width, base.height);
      ed = { img: base, W: base.width, H: base.height, objs: [], undo: [], tool: "text", initTool: tool || "text", color: "#FFFFFF", font: 1, size: 1, crop: null, ratio: null, drag: null, done: done };
      ed.crop = { x: 0, y: 0, w: ed.W, h: ed.H };
      build();
      redraw();
    };
    img.onerror = function () { toast("Cette photo ne peut pas être modifiée.", "x"); };
    img.src = url;
  }

  function close() {
    if (ed && ed.root) ed.root.remove();
    ed = null;
  }

  function build() {
    var root = document.createElement("div");
    root.id = "zzPe";
    root.innerHTML =
      '<div class="zz-pebar"><button type="button" data-a="cancel">Annuler</button><b>Modifier la photo</b><button type="button" data-a="undo" aria-label="Annuler la dernière modification">↶</button><button type="button" class="ok" data-a="ok">Valider</button></div>' +
      '<div class="zz-pestage"><canvas></canvas><div class="zz-pebin" hidden aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></div></div>' +
      '<div class="zz-petools">' +
        '<button type="button" data-rot="-1" aria-label="Tourner à gauche">Tourner ↺</button>' +
        '<button type="button" data-rot="1" aria-label="Tourner à droite">Tourner ↻</button>' +
        '<button type="button" data-t="crop">Rogner</button>' +
        '<button type="button" data-t="text">Texte</button>' +
        '<button type="button" data-t="blur">Flou</button>' +
        '<button type="button" data-t="stroke">Marqueur</button>' +
        '<button type="button" data-t="sticker">Stickers</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="crop" hidden>' +
        '<button type="button" data-r="free">Libre</button><button type="button" data-r="1:1">1:1</button><button type="button" data-r="4:5">4:5</button><button type="button" data-r="9:16">9:16</button>' +
        '<button type="button" class="ok" data-a="cropok">Cadrage fait</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="text" hidden>' +
        '<input id="zzPeT" maxlength="60" placeholder="Écris ton texte" autocomplete="off">' +
        '<div class="zz-pesw">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="background:' + c + '" aria-label="Couleur"></button>'; }).join("") + '</div>' +
        '<div class="zz-pefonts">' + FONTS.map(function (f, i) { return '<button type="button" data-f="' + i + '" style="font-family:' + f.f + '">' + f.n + '</button>'; }).join("") + '</div>' +
        '<button type="button" class="ok" data-a="addtext">Ajouter le texte</button>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="stroke" hidden>' +
        '<div class="zz-pesw">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="background:' + c + '" aria-label="Couleur"></button>'; }).join("") + '</div>' +
        '<div class="zz-pesz"><button type="button" data-s="1">Fin</button><button type="button" data-s="2">Épais</button></div>' +
      '</div>' +
      '<div class="zz-peopt" data-opt="blur" hidden><p>Passe le doigt sur ce qu\'il faut cacher : il devient flou.</p><div class="zz-pesz"><button type="button" data-s="1">Petit</button><button type="button" data-s="2">Grand</button></div></div>' +
      '<div class="zz-peopt" data-opt="sticker" hidden><div class="zz-pestab"><button type="button" data-tab="emo" aria-pressed="true">Emojis</button><button type="button" data-tab="mine" aria-pressed="false">Mes stickers</button></div>' +
        '<div class="zz-peemo" data-pane="emo">' + EMOJI.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join("") + '</div>' +
        '<div class="zz-peemo" data-pane="mine" hidden></div></div>';
    document.body.appendChild(root);
    ed.root = root;
    ed.cv = root.querySelector("canvas");
    ed.cv.width = ed.W; ed.cv.height = ed.H;
    ed.ctx = ed.cv.getContext("2d");
    ed.cv.addEventListener("pointerdown", down);
    ed.cv.addEventListener("pointermove", move);
    ed.cv.addEventListener("pointerup", up);
    ed.cv.addEventListener("pointercancel", up);
    root.addEventListener("click", function (e) { e.stopPropagation(); onClick(e); });
    markColor();
    root.querySelector('#zzPeT').addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addText(); } });
    showTool(ed.initTool || "text");
  }

  function markColor() {
    ed.root.querySelectorAll("[data-c]").forEach(function (x) { x.classList.toggle("on", x.dataset.c === ed.color); });
  }

  function showTool(t) {
    ed.tool = t;
    ed.root.querySelectorAll(".zz-petools button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
    ed.root.querySelectorAll(".zz-peopt").forEach(function (p) { p.hidden = p.dataset.opt !== t; });
    if (t === "crop") { applyRatio(); redraw(); }
    if (t === "text") setTimeout(function () { var i = ed.root.querySelector("#zzPeT"); if (i) i.focus(); }, 50);
  }

  function addText() {
    var txt = (ed.root.querySelector("#zzPeT").value || "").trim();
    if (!txt) { toast("Écris d'abord ton texte.", "x"); return; }
    snap();
    ed.objs.push({ t: "text", text: txt, x: ed.W / 2, y: ed.H / 2, color: ed.color, font: ed.font, size: Math.round(ed.W / 14) * (ed.size === 2 ? 1.5 : 1) });
    ed.root.querySelector("#zzPeT").value = "";
    redraw();
  }

  function onClick(e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b || !ed) return;
    if (b.dataset.a === "cancel") return close();
    if (b.dataset.a === "undo") { if (ed.undo.length) { ed.objs = ed.undo.pop(); redraw(); } return; }
    if (b.dataset.a === "ok") return finish();
    if (b.dataset.a === "addtext") return addText();
    if (b.dataset.a === "cropok") { showTool("text"); return; }
    if (b.dataset.rot) return turn(+b.dataset.rot);
    if (b.dataset.t) return showTool(b.dataset.t);
    if (b.dataset.r) {
      ed.ratio = b.dataset.r === "free" ? null : b.dataset.r.split(":").map(Number);
      applyRatio(); redraw(); return;
    }
    if (b.dataset.f !== undefined) { ed.font = +b.dataset.f; return; }
    if (b.dataset.c) { ed.color = b.dataset.c; markColor(); return; }
    if (b.dataset.s) { ed.size = +b.dataset.s; return; }
    if (b.dataset.tab) {
      var rt = b.closest(".zz-peopt");
      rt.querySelectorAll("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== b.dataset.tab; });
      rt.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      if (b.dataset.tab === "mine") fillMine(rt);
      return;
    }
    if (b.dataset.simg !== undefined) {
      var st = simgList()[+b.dataset.simg];
      if (st) {
        snap();
        ed.objs.push({ t: "simg", p: st.p, mt: st.t, x: ed.W / 2, y: ed.H / 2, size: Math.round(ed.W / 4) });
        redraw();
      }
      return;
    }
    if (b.dataset.e) {
      snap();
      ed.objs.push({ t: "sticker", e: b.dataset.e, x: ed.W / 2, y: ed.H / 2, size: Math.round(ed.W / 9) });
      redraw();
      return;
    }
  }

  // ---- turn the photo by a quarter turn (dir 1 = clockwise, -1 = counter-clockwise) ----
  function turnOnce() {
    var oldW = ed.W, oldH = ed.H;
    var rc = document.createElement("canvas");
    rc.width = oldH; rc.height = oldW;
    var g = rc.getContext("2d");
    g.translate(oldH, 0); g.rotate(Math.PI / 2); g.drawImage(ed.img, 0, 0);
    // a point (x, y) of the old photo is (oldH - y, x) after a clockwise turn
    function mp(p) { return [oldH - p[1], p[0]]; }
    function fix(list) {
      list.forEach(function (o) {
        if (o.pts) o.pts = o.pts.map(mp);
        else if (typeof o.x === "number") { var q = mp([o.x, o.y]); o.x = q[0]; o.y = q[1]; }
      });
    }
    fix(ed.objs);
    ed.undo.forEach(fix);
    ed.img = rc; ed.W = oldH; ed.H = oldW;
    ed.cv.width = ed.W; ed.cv.height = ed.H;
    ed.crop = { x: 0, y: 0, w: ed.W, h: ed.H };
    if (ed.ratio) applyRatio();
  }

  function turn(dir) {
    var n = dir < 0 ? 3 : 1;   // counter-clockwise = three clockwise turns
    for (var i = 0; i < n; i++) turnOnce();
    redraw();
  }

  // ---- finish: the new photo replaces the preview ----
  function finish() {
    var c = ed.crop || { x: 0, y: 0, w: ed.W, h: ed.H };
    var out = document.createElement("canvas");
    out.width = Math.round(c.w); out.height = Math.round(c.h);
    var octx = out.getContext("2d");
    var full = document.createElement("canvas");
    full.width = ed.W; full.height = ed.H;
    paint(full.getContext("2d"), false);
    octx.drawImage(full, -c.x, -c.y);
    window.__zzLastEdit = { W: ed.W, H: ed.H, crop: { x: c.x, y: c.y, w: c.w, h: c.h }, objs: clone(ed.objs) };
    out.toBlob(function (blob) {
      if (!blob) { toast("Photo non enregistrée.", "x"); return; }
      var file = new File([blob], "photo-modifiee.jpg", { type: "image/jpeg" });
      var done = ed.done;
      close();
      done && done(file);
    }, "image/jpeg", 0.92);
  }

  // open the editor on the photo of the preview sheet, with one tool ready
  function editPre(tool) {
    var P = (typeof V4 !== "undefined") && V4.pre;
    if (!P) return;
    if (P.video && typeof zzVidEdit === "function") { zzVidEdit(tool); return; }
    open(P.url, function (file) {
      var cur = (typeof V4 !== "undefined") && V4.pre;
      if (!cur) return;
      try { URL.revokeObjectURL(cur.url); } catch (x) {}
      cur.file = file;
      cur.url = URL.createObjectURL(file);
      cur.edited = true;
      if (typeof render === "function") render();
    }, tool);
  }

  // open the editor from the preview sheet
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('[data-v4="preEdit"]');
    if (b) {
      e.preventDefault(); e.stopImmediatePropagation();
      var P = (typeof V4 !== "undefined") && V4.pre;
      if (!P) return;
      open(P.url, function (file) {
        var cur = (typeof V4 !== "undefined") && V4.pre;
        if (!cur) return;
        try { URL.revokeObjectURL(cur.url); } catch (x) {}
        cur.file = file;
        cur.url = URL.createObjectURL(file);
        cur.edited = true;
        if (typeof render === "function") render();
      });
      return;
    }
    var pt = t.closest('[data-v4="preTool"]');
    if (pt) { e.preventDefault(); e.stopImmediatePropagation(); editPre(pt.dataset.tool); return; }
    var h = t.closest('[data-v4="preHd"]');
    if (h) {
      e.preventDefault(); e.stopImmediatePropagation();
      var Q = (typeof V4 !== "undefined") && V4.pre;
      if (Q) { Q.hd = !Q.hd; if (typeof render === "function") render(); }
    }
  }, true);

  var st = document.createElement("style");
  st.id = "zzzzzuPhotoEdit";
  st.textContent = `
#zzPe{position:fixed;inset:0;z-index:10010;background:#07080F;color:#EDEEF3;display:flex;flex-direction:column;font:600 .85rem system-ui,sans-serif}
#zzPe .zz-pebar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px));background:#11131F}
#zzPe .zz-pebar b{font-size:.95rem}
#zzPe .zz-pebar button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:8px 14px;font:700 .85rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-pebar .ok{background:#A78BFA;color:#0B0D18}
#zzPe .zz-pestage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden}
#zzPe canvas{max-width:100%;max-height:100%;width:auto;height:auto;touch-action:none;border-radius:8px}
#zzPe .zz-pestage{position:relative}
#zzPe .zz-pebin{position:absolute;width:58px;height:58px;border-radius:50%;background:#E5484D;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(229,72,77,.45);pointer-events:none;z-index:2}
#zzPe .zz-pebin[hidden]{display:none}
#zzPe .zz-pebin[data-c="tl"]{top:12px;left:12px}
#zzPe .zz-pebin[data-c="tr"]{top:12px;right:12px}
#zzPe .zz-pebin[data-c="bl"]{bottom:12px;left:12px}
#zzPe .zz-pebin[data-c="br"]{bottom:12px;right:12px}
#zzPe .zz-petools{display:flex;gap:6px;justify-content:center;padding:8px;background:#11131F;flex-wrap:wrap}
#zzPe .zz-petools button{border:1px solid rgba(255,255,255,.2);background:transparent;color:#EDEEF3;border-radius:999px;padding:8px 12px;font:700 .8rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-petools button.on{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
#zzPe .zz-peopt{background:#11131F;padding:10px 12px;display:flex;flex-direction:column;gap:8px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))}
#zzPe .zz-peopt[hidden]{display:none}
#zzPe .zz-peopt p{margin:0;opacity:.8;font-weight:500}
#zzPe .zz-peopt button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#EDEEF3;border-radius:12px;padding:9px 12px;font:700 .85rem system-ui,sans-serif;cursor:pointer}
#zzPe .zz-peopt button.ok{background:#A78BFA;color:#0B0D18;border-color:#A78BFA}
#zzPe .zz-peopt input{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:12px;color:#fff;padding:10px 12px;font:600 1rem system-ui,sans-serif;outline:none}
#zzPe .zz-pesw,#zzPe .zz-pefonts,#zzPe .zz-pesz,#zzPe .zz-peemo{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#zzPe .zz-pesw button{width:30px;height:30px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.4)}
#zzPe .zz-pesw button.on{border-color:#fff;box-shadow:0 0 0 2px #A78BFA}
#zzPe .zz-peemo button{font-size:1.6rem;padding:4px 8px;border:0;background:transparent}
#zzPe .zz-pefonts button{font-size:1rem}
`;
  document.head.appendChild(st);

  // other files (the stickers) can open the editor too
  // the stored image stickers (videos are not used as stickers in the editor)
  function simgList() {
    return (window.zzMyStickers ? window.zzMyStickers() : []).filter(function (x) { return !/^video\//.test(x.t || ""); });
  }
  function fillMine(rt) {
    var pane = rt.querySelector('[data-pane="mine"]');
    if (!pane) return;
    var list = simgList();
    if (!list.length) { pane.innerHTML = '<p class="zz-pemp">Aucun sticker enregistré. Crée-en un depuis les stickers du chat.</p>'; return; }
    pane.innerHTML = list.map(function (x, i) {
      return '<button type="button" data-simg="' + i + '" aria-label="Sticker"><img data-zzsp="' + x.p + '" data-zzst="' + x.t + '" alt=""></button>';
    }).join("");
    pane.querySelectorAll("img[data-zzsp]").forEach(function (im) {
      if (typeof srcBlob !== "function") return;
      srcBlob({ k: "m", id: im.dataset.zzsp, t: im.dataset.zzst }).then(function (b) { im.src = URL.createObjectURL(b); }).catch(function () {});
    });
  }
  var zzPeSt = document.createElement("style");
  zzPeSt.id = "zzPeStickers";
  zzPeSt.textContent = "#zzPe .zz-peemo[data-pane=emo]{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;max-height:34vh;overflow-y:auto;-webkit-overflow-scrolling:touch}#zzPe .zz-peemo[data-pane=emo] button{font-size:1.45rem;height:42px;padding:0;border:0;background:transparent}#zzPe .zz-peemo[data-pane=mine]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;max-height:40vh;overflow-y:auto}#zzPe .zz-peemo[data-pane=mine] button{position:relative;height:0;padding:0 0 100% 0;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.05);overflow:hidden}#zzPe .zz-peemo[data-pane=mine] img{position:absolute;left:6px;top:6px;width:calc(100% - 12px);height:calc(100% - 12px);object-fit:contain;display:block}.zz-pestab{display:flex;gap:8px;margin-bottom:8px}.zz-pestab button{flex:1;padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font:700 .9rem system-ui,sans-serif;cursor:pointer}.zz-pestab button[aria-pressed=true]{background:#A78BFA;color:#0B0D18;border-color:transparent}.zz-peemo[data-pane=mine] button{padding:4px;aspect-ratio:auto}.zz-peemo[data-pane=mine] img{width:100%;height:auto;display:block;object-fit:contain}.zz-pemp{grid-column:1/-1;opacity:.7;text-align:center;margin:8px 0}";
  document.head.appendChild(zzPeSt);
  window.__zzPhotoEdit = { open: open };
  // draws one frame (picture or video) with the same edits as a photo: used for video stickers
  window.__zzPaintFrame = function (src, W, H, objs, ctx) {
    var keep = ed;
    ed = { img: src, W: W, H: H, objs: objs || [], ctx: ctx };
    try { paint(ctx, false); } finally { ed = keep; }
  };
  // draws src (a frame, at W x H) with the objects, onto canvas; nothing of the open editor changes
  window.__zzPaintTo = function (canvas, src, W, H, objs) {
    var keep = ed;
    ed = { img: src, W: W, H: H, objs: objs };
    try { paint(canvas.getContext("2d"), false); } finally { ed = keep; }
  };

  // drag: the canvas gets the pointer events above
  window.addEventListener("resize", function () { if (ed) redraw(); });
})();
