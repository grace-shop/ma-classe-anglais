// Copie la bibliothèque Supabase dans www/vendor pour que l'application marche sans CDN.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
const src = "node_modules/@supabase/supabase-js/dist/umd/supabase.js";
if (existsSync(src)) { mkdirSync("www/vendor", { recursive: true }); copyFileSync(src, "www/vendor/supabase.js"); console.log("✓ www/vendor/supabase.js"); }
else console.log("(supabase-js introuvable : l'application utilisera le CDN jsDelivr)");
