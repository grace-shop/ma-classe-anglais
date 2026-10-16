// Construit les leçons, quiz, pratiques et paquets de vocabulaire des programmes
// Seconde, Première et Terminale à partir de contenu/programmes-manuel.js,
// puis les écrit dans www/content.json (le modèle installé par l'application).
// Lancer : node scripts/build-programmes.mjs
// L'arène lit ce même www/content.json : quand le modèle change, l'arène suit.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BATCH = "togo-2026-10";
const PREFIX = { "2nde": "2nde", "1re": "1re", tle: "tle" };
const CLASSE = { "2nde": "2nde", "1re": "1re", tle: "Tle" };
const CREATED = 1791099976000;

// 1 · lire le programme (fichier JS, on ne garde que le tableau)
const src = readFileSync(join(ROOT, "contenu/programmes-manuel.js"), "utf8")
  .replace(/^const PROGRAMMES_MANUEL=/m, "globalThis.__P=");
new Function(src)();
const UNITS = globalThis.__P;
if (!Array.isArray(UNITS) || !UNITS.length) throw new Error("programmes-manuel.js : tableau vide");

// 2 · quiz : « * bonne réponse », « - fausse », « = réponse écrite »
function parseQuiz(text) {
  const out = [];
  for (const block of text.trim().split(/\n\s*\n/)) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const q = lines[0];
    const good = lines.filter(l => l.startsWith("* ")).map(l => l.slice(2).trim());
    const bad = lines.filter(l => l.startsWith("- ")).map(l => l.slice(2).trim());
    const typed = lines.filter(l => l.startsWith("= ")).map(l => l.slice(2).trim());
    if (typed.length && !good.length) { out.push({ q, type: "type", accept: typed }); continue; }
    if (!good.length) throw new Error("Question sans bonne réponse : " + q);
    const choices = [good[0], ...bad];
    out.push({ q, answer: 0, choices });
  }
  // mélange stable : la bonne réponse change de place d'une question à l'autre
  out.forEach((x, i) => {
    if (x.type === "type") return;
    const correct = x.choices[0];
    const rest = x.choices.slice(1);
    const pos = (i * 7 + 3) % (rest.length + 1);
    rest.splice(pos, 0, correct);
    x.choices = rest;
    x.answer = pos;
  });
  return out;
}

// 3 · vocabulaire : « anglais | définition en anglais | exemple » (aucun français dans l'application)
function parseDeck(text) {
  return text.trim().split("\n").map(l => l.split("|").map(s => s.trim())).filter(p => p.length >= 2 && p[0])
    .map(([en, fr, ex]) => ({ en, fr, ex: ex || "" }));
}

// 4 · pratique de vocabulaire générée à partir du paquet (sens et traduction)
function vocabQuiz(cards) {
  const qs = [];
  cards.slice(0, 10).forEach((c, i) => {
    const others = cards.filter(o => o !== c);
    const en2fr = i % 2 === 0;
    const correct = en2fr ? c.fr : c.en;
    const pool = others.map(o => (en2fr ? o.fr : o.en)).filter((v, k, a) => v !== correct && a.indexOf(v) === k);
    const wrong = pool.slice((i * 3) % Math.max(1, pool.length - 3), (i * 3) % Math.max(1, pool.length - 3) + 3);
    while (wrong.length < 3 && pool.length) wrong.push(pool[wrong.length]);
    if (wrong.length < 3) return;
    const q = en2fr ? `What does « ${c.en} » mean?` : `Which word means « ${c.fr} »?`;
    const pos = i % 4;
    const choices = [...wrong];
    choices.splice(pos, 0, correct);
    qs.push({ q, answer: pos, choices });
  });
  return qs;
}

const content = JSON.parse(readFileSync(join(ROOT, "www/content.json"), "utf8"));
for (const k of ["lessons", "quizzes", "decks"]) content[k] = content[k] || {};

// 5 · retirer les anciennes entrées « programme » de ces trois classes, puis reconstruire
const oldPrefix = /^prog-(2nde|1re|tle)-/;
for (const id of Object.keys(content.lessons)) if (oldPrefix.test(id)) delete content.lessons[id];
for (const id of Object.keys(content.quizzes)) if (oldPrefix.test(content.quizzes[id].lessonId || "")) delete content.quizzes[id];
for (const id of Object.keys(content.decks)) if (/^deck-prog-(2nde|1re|tle)-/.test(id)) delete content.decks[id];

let counts = {};
for (const u of UNITS) {
  const slug = PREFIX[u.c];
  if (!slug) throw new Error("Classe inconnue : " + u.c);
  const lessonId = `bk-${slug}-${u.u}`;
  const classe = CLASSE[u.c];
  content.lessons[lessonId] = {
    audience: "lycee", body: u.body, classe, createdAt: CREATED, grammar: u.g, level: u.lv,
    prog: true, batch: BATCH, theme: u.th, title: u.t, unit: u.u, book: "Programme du manuel"
  };
  const deckId = `bkd-${slug}-${u.u}`;
  const cards = parseDeck(u.deck || "");
  if (cards.length) content.decks[deckId] = { audience: "lycee", batch: BATCH, lessonId, cards };
  const quizQs = parseQuiz(u.quiz || "");
  const vq = vocabQuiz(cards);
  content.quizzes[`bkq-${slug}-${u.u}`] = {
    audience: "lycee", classe, createdAt: CREATED, exam: false, lessonId, level: u.lv, minutes: 10,
    prog: true, batch: BATCH, title: `Quiz · ${u.t}`, unit: u.u, questions: quizQs
  };
  if (vq.length) content.quizzes[`bkv-${slug}-${u.u}`] = {
    audience: "lycee", classe, createdAt: CREATED, exam: false, lessonId, level: u.lv, minutes: 5,
    prog: true, batch: BATCH, title: `Vocabulaire · ${u.t}`, unit: u.u, questions: vq
  };
  counts[slug] = (counts[slug] || 0) + 1;
}

writeFileSync(join(ROOT, "www/content.json"), JSON.stringify(content));
console.log("Programmes écrits :", counts, "· leçons :", Object.keys(content.lessons).filter(k => k.startsWith("bk-")).length);
