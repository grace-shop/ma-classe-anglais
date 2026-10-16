// Fabrique www/banque-jeux.json à partir des paquets de vocabulaire (www/content.json).
// Deux types de questions, en anglais seulement :
//  · « gap » : trouver le mot qui manque dans une phrase d'exemple du paquet ;
//  · « odd » : trouver le mot qui n'appartient pas à un groupe (thème différent).
// Lancer : node scripts/build-banque.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const c = JSON.parse(readFileSync(join(ROOT, "www/content.json"), "utf8"));

const LV = { A1: 1, A2: 1, B1: 2, B2: 3, C1: 3, C2: 3 };          // easy / medium / hard
const FR = /\b(le|la|les|des|une|est|pour|avec|dans|qui|que|sur|cette|nous|vous|mais|donc|très|et|ou)\b|[àâçéèêëîïôûùüœ]/i;

// générateur déterministe : la banque est la même à chaque build
let seed = 20261016;
const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const decks = Object.entries(c.decks || {}).map(([id, d]) => ({
  id, title: d.title || id, lv: LV[d.level] || 2,
  cards: (d.cards || []).filter(x => x.en && x.en.trim().length >= 3 && !FR.test(x.en + " " + (x.ex || "")))
})).filter(d => d.cards.length >= 3);

const items = [];
const seen = new Set();
const push = (it) => { const key = it.q + "|" + [...it.o].sort().join("|"); if (!seen.has(key)) { seen.add(key); items.push(it); } };

// 1 · phrases à trous
for (const d of decks) {
  const others = decks.filter(o => o.lv === d.lv && o.id !== d.id).flatMap(o => o.cards.map(x => x.en.trim()));
  for (const x of d.cards) {
    const w = x.en.trim(), ex = (x.ex || "").trim();
    if (!ex) continue;
    const re = new RegExp("\\b" + esc(w) + "\\b", "i");
    if (!re.test(ex)) continue;
    const q = ex.replace(re, "___");
    const sameDeck = d.cards.map(y => y.en.trim()).filter(v => v !== w && !new RegExp("\\b" + esc(v) + "\\b", "i").test(ex));
    const pool = [...new Set(sameDeck.concat(others))].filter(v => v.toLowerCase() !== w.toLowerCase() && !ex.toLowerCase().includes(v.toLowerCase()));
    const wrong = shuffle(pool).slice(0, 3);
    if (wrong.length < 3) continue;
    const choices = shuffle([w, ...wrong]);
    push({ lv: d.lv, src: "gap", q, o: choices, a: choices.indexOf(w), e: `Example: ${ex}` });
  }
}

// 2 · le mot intrus : trois mots d'un thème, un mot d'un autre thème du même niveau
for (const d of decks) {
  const words = d.cards.map(x => x.en.trim());
  const others = decks.filter(o => o.lv === d.lv && o.id !== d.id && o.cards.length);
  if (!others.length) continue;
  for (let k = 0; k < 6 && words.length >= 3; k++) {
    const group = shuffle(words).slice(0, 3);
    const o = shuffle(others)[0];
    const odd = shuffle(o.cards.map(x => x.en.trim()).filter(v => !words.includes(v)))[0];
    if (!odd) continue;
    const choices = shuffle([...group, odd]);
    push({ lv: d.lv, src: "odd", q: "Which word does NOT belong with the others?", o: choices, a: choices.indexOf(odd),
      e: `${odd} belongs to a different theme. ${group.join(", ")} come from the same theme: ${d.title}.` });
  }
}

const count = {};
for (const it of items) count[it.src + "-" + it.lv] = (count[it.src + "-" + it.lv] || 0) + 1;
writeFileSync(join(ROOT, "www/banque-jeux.json"), JSON.stringify(items), "utf8");
console.log("Banque écrite :", items.length, "questions", count);
