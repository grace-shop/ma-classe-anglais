// Écrit www/config.js à partir des variables du dépôt GitHub (Settings → Secrets and variables → Actions → Variables)
import { readFileSync, writeFileSync } from "node:fs";
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) { console.log("Variables SUPABASE_URL / SUPABASE_ANON_KEY absentes : config.js gardé tel quel."); process.exit(0); }
let s = readFileSync("www/config.js", "utf8");
s = s.replace(/supabaseUrl:\s*"[^"]*"/, `supabaseUrl: "${url}"`).replace(/supabaseAnonKey:\s*"[^"]*"/, `supabaseAnonKey: "${key}"`);
writeFileSync("www/config.js", s); console.log("✓ config.js rempli avec", url);
