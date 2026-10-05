// Ajoute au projet Android : micro, reconnaissance vocale, synthèse vocale et retour de connexion Google
import { readFileSync, writeFileSync } from "node:fs";
const f = "android/app/src/main/AndroidManifest.xml";
let s = readFileSync(f, "utf8");
if (!s.includes("RECORD_AUDIO")) s = s.replace("<application", `<uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
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
writeFileSync(f, s); console.log("✓ AndroidManifest.xml complété");
