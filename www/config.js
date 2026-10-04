/* =====================================================================
   RÉGLAGES DE VOTRE APPLICATION — à remplir une seule fois (voir GUIDE)
   Supabase → Project Settings → API (ou « Connect ») :
   ===================================================================== */
window.APP_CONFIG = {
  supabaseUrl: "https://yvpsrttyxhcxglinkycr.supabase.co",   // Project URL
  supabaseAnonKey: "sb_publishable_04tBn5lV2be0NA_8zUTYPQ_7Dxhhsiu",          // clé « anon » / « publishable » (jamais la clé service_role !)
  googleEnabled: false,                                // false pour masquer le bouton Google
  aiEnabled: true,                                     // false pour couper Nova
  nativeRedirect: "tg.maclasse.anglais://login",       // retour de connexion dans l'application Android
  threeUrl: "vendor/three.min.js"                      // fond 3D (copie locale) ; laissez tel quel
};
