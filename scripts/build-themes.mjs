// Fabrique www/questions-themes.json à partir de contenu/questions-themes.js.
// Chaque question reçoit les réponses mélangées (ordre fixe d'un build à l'autre).
// Lancer : node scripts/build-themes.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "contenu/questions-themes.js"), "utf8")
  .replace(/^const QUESTIONS_THEMES=/m, "globalThis.__Q=");
new Function(src)();
const LV = { easy: 1, medium: 2, hard: 3 };
let seed = 20261016;
const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const out = [];
for (const [theme, level, q, correct, wrong] of globalThis.__Q) {
  if (!q.includes("___")) throw new Error("Question sans trou : " + q);
  const choices = shuffle([correct, ...wrong]);
  if (new Set(choices.map(x => x.toLowerCase())).size !== 4) throw new Error("Doublon de réponse : " + q);
  out.push({ lv: LV[level], src: "theme", theme, q, o: choices, a: choices.indexOf(correct),
    e: "Correct: " + q.replace("___", correct) });
}
writeFileSync(join(ROOT, "www/questions-themes.json"), JSON.stringify(out), "utf8");
const byTheme = {};
out.forEach(x => byTheme[x.theme] = (byTheme[x.theme] || 0) + 1);
console.log("Questions par thème :", out.length, byTheme);
