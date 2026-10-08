// Ajoute au projet Android : micro, reconnaissance vocale, synthèse vocale et retour de connexion Google
import { readFileSync, writeFileSync } from "node:fs";
const f = "android/app/src/main/AndroidManifest.xml";
let s = readFileSync(f, "utf8");
if (!s.includes("RECORD_AUDIO")) s = s.replace("<application", `<uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <queries>
        <intent><action android:name="android.speech.RecognitionService" /></intent>
        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>
    </queries>
    <application`);
if (!s.includes('android:scheme="tg.maclasse.anglais"')) s = s.replace(/(<activity[\s\S]*?MainActivity[\s\S]*?<\/intent-filter>)/, `$1
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="tg.maclasse.anglais" android:host="login" />
            </intent-filter>`);
s = s.replace('android:allowBackup="true"', 'android:allowBackup="false"');
if (!s.includes("usesCleartextTraffic")) s = s.replace("<application", '<application android:usesCleartextTraffic="false"');
if (!s.includes("android:allowBackup")) s = s.replace("<application", '<application android:allowBackup="false"');
writeFileSync(f, s); console.log("✓ AndroidManifest.xml complété (sauvegarde cloud et trafic non chiffré désactivés)");

// Mise à jour sans désinstaller : numéro de version croissant à chaque publication
if (!s.includes("REQUEST_INSTALL_PACKAGES")) { s = s.replace("<application", '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n    <application'); writeFileSync(f, s); }
const g = "android/app/build.gradle", build = parseInt(process.env.BUILD || "1", 10) || 1;
let gr = readFileSync(g, "utf8");
gr = gr.replace(/versionCode\s+\d+/, "versionCode " + build).replace(/versionName\s+"[^"]*"/, 'versionName "1.' + build + '"');
// clé de signature fixe : chaque nouvelle version remplace l'ancienne sans désinstaller
if (!gr.includes("EC_KEYSTORE")) gr = gr.replace(/android\s*\{/, `android {
    signingConfigs {
        debug {
            storeFile file(System.getenv("EC_KEYSTORE") ?: "../../android-extras/english-classes.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }`);
writeFileSync(g, gr); console.log("✓ version Android", build, "· signature fixe");
