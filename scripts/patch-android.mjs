// Ajoute au projet Android : micro, reconnaissance vocale, synthèse vocale et retour de connexion Google
import { readFileSync, writeFileSync } from "node:fs";
const f = "android/app/src/main/AndroidManifest.xml";
let s = readFileSync(f, "utf8");
if (!s.includes("RECORD_AUDIO")) s = s.replace("<application", `<uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
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
            storeFile file(System.getenv("EC_KEYSTORE"))
            storePassword System.getenv("EC_KS_PASS")
            keyAlias "englishclasses"
            keyPassword System.getenv("EC_KS_PASS")
        }
    }`);
writeFileSync(g, gr); console.log("✓ version Android", build, "· signature fixe");

// Notifications (appels et messages) : fichier Firebase + plugin Google Services dans le projet
import { existsSync, copyFileSync } from "node:fs";
if (existsSync("android-extras/google-services.json")) {
  copyFileSync("android-extras/google-services.json", "android/app/google-services.json");
  const root = "android/build.gradle", app = "android/app/build.gradle";
  let r = readFileSync(root, "utf8");
  if (!r.includes("google-services")) r = r.replace(/dependencies \{/, "dependencies {\n        classpath 'com.google.gms:google-services:4.4.2'");
  writeFileSync(root, r);
  let a = readFileSync(app, "utf8");
  if (!a.includes("com.google.gms.google-services")) a += "\napply plugin: 'com.google.gms.google-services'\n";
  writeFileSync(app, a);
  console.log("✓ Firebase (notifications) ajouté au projet Android");
}

// Appel en cours quand on quitte l'application : service de premier plan (micro et caméra)
import { mkdirSync, copyFileSync as cp, readdirSync } from "node:fs";
if (existsSync("android-extras/callkeeper")) {
  const dir = "android/app/src/main/java/tg/maclasse/anglais";
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync("android-extras/callkeeper")) cp("android-extras/callkeeper/" + f, dir + "/" + f);
  const mf = "android/app/src/main/AndroidManifest.xml";
  let m = readFileSync(mf, "utf8");
  if (!m.includes("CallKeeperService")) {
    m = m.replace("<application", `<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <application`);
    m = m.replace("</application>", `    <service android:name=".CallKeeperService" android:foregroundServiceType="microphone|camera" android:exported="false" />
    </application>`);
    writeFileSync(mf, m);
  }
  const act = dir + "/MainActivity.java";
  let a = readFileSync(act, "utf8");
  if (!a.includes("CallKeeperPlugin")) {
    a = a.replace("super.onCreate(savedInstanceState);", "registerPlugin(CallKeeperPlugin.class);\n        super.onCreate(savedInstanceState);");
    writeFileSync(act, a);
  }
  console.log("✓ appel en arrière-plan (service de premier plan) ajouté");
}

// Sons de notification : fichiers WAV dans res/raw (un canal Android par son)
import { readdirSync as rds, mkdirSync as mk2, copyFileSync as cp2 } from "node:fs";
if (existsSync("android-extras/sounds")) {
  mk2("android/app/src/main/res/raw", { recursive: true });
  for (const f of rds("android-extras/sounds")) if (f.endsWith(".wav")) cp2("android-extras/sounds/" + f, "android/app/src/main/res/raw/" + f);
  console.log("✓ sons de notification copiés");
}

// Partage d'écran pendant l'appel : plugin ScreenShare + service de capture (android-extras/screenshare)
if (existsSync("android-extras/screenshare")) {
  const dir = "android/app/src/main/java/tg/maclasse/anglais";
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync("android-extras/screenshare")) cp("android-extras/screenshare/" + f, dir + "/" + f);
  const mf = "android/app/src/main/AndroidManifest.xml";
  let m = readFileSync(mf, "utf8");
  if (!m.includes("ScreenShareService")) {
    m = m.replace("<application", `<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <application`);
    m = m.replace("</application>", `    <service android:name=".ScreenShareService" android:foregroundServiceType="mediaProjection" android:exported="false" />
    </application>`);
    writeFileSync(mf, m);
  }
  const act = dir + "/MainActivity.java";
  let a = readFileSync(act, "utf8");
  if (!a.includes("ScreenSharePlugin")) {
    a = a.replace("super.onCreate(savedInstanceState);", "registerPlugin(ScreenSharePlugin.class);\n        super.onCreate(savedInstanceState);");
    writeFileSync(act, a);
  }
  console.log("✓ partage d'écran (plugin ScreenShare) ajouté");
}

// Mise à jour dans l'application : le fichier téléchargé s'ouvre dans l'installeur Android (plugin ApkInstaller)
if (existsSync("android-extras/installer")) {
  const dir = "android/app/src/main/java/tg/maclasse/anglais";
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync("android-extras/installer")) cp("android-extras/installer/" + f, dir + "/" + f);
  mkdirSync("android/app/src/main/res/xml", { recursive: true });
  writeFileSync("android/app/src/main/res/xml/apk_paths.xml", '<?xml version="1.0" encoding="utf-8"?>\n<paths><cache-path name="apk" path="." /></paths>\n');
  const mf = "android/app/src/main/AndroidManifest.xml";
  let m = readFileSync(mf, "utf8");
  if (!m.includes("apkprovider")) {
    m = m.replace("</application>", `    <provider android:name="androidx.core.content.FileProvider" android:authorities="${"$"}{applicationId}.apkprovider" android:exported="false" android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/apk_paths" />
        </provider>
    </application>`);
    writeFileSync(mf, m);
  }
  console.log("✓ installeur de mise à jour (ApkInstaller) ajouté");
}

// Les plugins natifs doivent être enregistrés dans MainActivity. Le modèle de Capacitor n'a pas toujours
// de onCreate : on écrit donc la classe entière (même paquet), avec l'enregistrement avant super.onCreate.
{
  const dir = "android/app/src/main/java/tg/maclasse/anglais";
  const act = dir + "/MainActivity.java";
  if (existsSync(act)) {
    const plugins = [];
    if (existsSync("android-extras/callkeeper")) plugins.push("CallKeeperPlugin");
    if (existsSync("android-extras/screenshare")) plugins.push("ScreenSharePlugin");
    if (existsSync("android-extras/installer")) plugins.push("ApkInstallerPlugin");
    const old = readFileSync(act, "utf8");
    const pkg = (old.match(/^package\s+([\w.]+);/m) || [])[1] || "tg.maclasse.anglais";
    const regs = plugins.map(c => `registerPlugin(${c}.class);`).join("\n        ");
    writeFileSync(act, `package ${pkg};

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        ${regs}
        super.onCreate(savedInstanceState);
    }
}
`);
    console.log("✓ MainActivity : plugins enregistrés →", plugins.join(", "));
  }
}
