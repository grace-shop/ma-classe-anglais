package tg.maclasse.anglais;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

/* Opens the downloaded update inside the app (no browser): JS: Capacitor.Plugins.ApkInstaller.install({ path }).
   If the phone does not yet allow this app to install apps, the settings screen of this app opens instead. */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void install(PluginCall call) {
        String path = call.getString("path", "");
        if (path == null || path.isEmpty()) { call.reject("no file"); return; }
        if (path.startsWith("file://")) path = path.substring(7);
        File f = new File(path);
        if (!f.exists() || f.length() < 2000000L) { call.reject("incomplete file"); return; }
        Context ctx = getContext();
        // the file must have the announced size, be a real APK (zip) that Android can read, and be this very app
        long expected = call.getData().optLong("size", 0L);
        if (expected > 0 && f.length() != expected) { f.delete(); call.reject("incomplete file"); return; }
        try {
            java.io.FileInputStream in = new java.io.FileInputStream(f);
            byte[] head = new byte[4];
            int n = in.read(head);
            in.close();
            if (n < 4 || head[0] != 'P' || head[1] != 'K') { f.delete(); call.reject("corrupt file"); return; }
        } catch (Exception e) { call.reject("corrupt file"); return; }
        try {
            android.content.pm.PackageInfo pi = ctx.getPackageManager().getPackageArchiveInfo(f.getAbsolutePath(), 0);
            if (pi == null) { f.delete(); call.reject("corrupt file"); return; }
            if (!ctx.getPackageName().equals(pi.packageName)) { f.delete(); call.reject("wrong app"); return; }
        } catch (Exception e) { /* if the check itself is not possible, the system installer decides */ }
        try {
            if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(s);
                JSObject r = new JSObject();
                r.put("needsPermission", true);
                call.resolve(r);
                return;
            }
            Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".apkprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            JSObject r = new JSObject();
            r.put("started", true);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("install failed: " + e.getMessage());
        }
    }
}
