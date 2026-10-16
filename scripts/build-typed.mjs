// Fabrique www/typed-jeux.json : questions où l'élève écrit la réponse.
//  · « type » : écrire le mot manquant (depuis les phrases à trous) ;
//  · « order » : remettre les mots d'une phrase d'exemple dans le bon ordre.
// La vérification se fait sur le serveur (supabase/battle-typed.sql).
// Lancer : node scripts/build-typed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const banque = JSON.parse(readFileSync(join(ROOT, "www/banque-jeux.json"), "utf8"));
const content = JSON.parse(readFileSync(join(ROOT, "www/content.json"), "utf8"));
const FR = /\b(le|la|les|des|une|est|pour|avec|dans|qui|que|sur|cette|nous|vous|mais|donc|très|et|ou)\b|[àâçéèêëîïôûùüœ]/i;

let seed = 20261017;
const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const LV = { A1: 1, A2: 1, B1: 2, B2: 3, C1: 3, C2: 3 };
const out = [];
const seen = new Set();

// 1 · écrire le mot manquant
for (const it of banque.filter(x => x.src === "gap")) {
  const accept = [it.o[it.a]];
  const key = it.q;
  if (seen.has(key)) continue;
  seen.add(key);
  out.push({ lv: it.lv, src: "typed", type: "type", q: it.q, accept, e: "Correct: " + it.q.replace("___", accept[0]) });
}

// 2 · remettre les mots dans l'ordre
for (const d of Object.values(content.decks || {})) {
  const lv = LV[d.level] || 2;
  for (const c of d.cards || []) {
    const ex = (c.ex || "").trim().replace(/[.!?…]+$/, "");
    const words = ex.split(/\s+/);
    if (words.length < 4 || words.length > 9 || FR.test(ex) || /\d/.test(ex)) continue;
    let scr = shuffle(words);
    if (scr.join(" ") === words.join(" ")) scr = [...scr.slice(1), scr[0]];
    const q = "Put these words in the right order: " + scr.join(" / ");
    if (seen.has(q)) continue;
    seen.add(q);
    out.push({ lv, src: "typed", type: "order", q, accept: [ex], e: "Correct: " + ex + "." });
  }
}

writeFileSync(join(ROOT, "www/typed-jeux.json"), JSON.stringify(out), "utf8");
const count = {};
out.forEach(x => count[x.type + "-" + x.lv] = (count[x.type + "-" + x.lv] || 0) + 1);
console.log("Questions à écrire :", out.length, count);
