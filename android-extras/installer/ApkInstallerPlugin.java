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
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.zip.ZipFile;

/* Updates inside the app (never the browser).
   JS: Capacitor.Plugins.ApkInstaller.download({ url, name }) -> { path, size }   (progress events: { bytes, total })
       Capacitor.Plugins.ApkInstaller.install({ path, size })
   download(): its own connection, resumes after a cut, checks that the file is complete and is a readable zip.
   install(): if the phone does not yet allow this app to install apps, the settings screen of this app opens instead. */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private static boolean isZipOk(File f) {
        try { new ZipFile(f).close(); return true; } catch (Exception e) { return false; }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url", "");
        final String name = call.getString("name", "update.apk");
        if (url == null || !url.startsWith("https://")) { call.reject("bad address"); return; }
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    File dir = new File(getContext().getCacheDir(), "apk");
                    dir.mkdirs();
                    File out = new File(dir, name.replaceAll("[^A-Za-z0-9._-]", "_"));
                    if (out.exists()) out.delete();
                    long have = 0, total = 0, lastNote = 0;
                    int fails = 0;
                    while (true) {
                        HttpURLConnection c = null;
                        try {
                            c = (HttpURLConnection) new URL(url).openConnection();
                            c.setConnectTimeout(30000);
                            c.setReadTimeout(60000);
                            c.setInstanceFollowRedirects(true);
                            c.setRequestProperty("Accept-Encoding", "identity");
                            c.setRequestProperty("User-Agent", "EnglishClasses-Updater");
                            if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
                            int code = c.getResponseCode();
                            if (code == 200 && have > 0) { have = 0; out.delete(); }   // the server ignored the resume: start again
                            if (code != 200 && code != 206) throw new java.io.IOException("http " + code);
                            if (code == 206) {
                                String cr = c.getHeaderField("Content-Range");
                                if (cr != null && cr.indexOf('/') > 0) total = Long.parseLong(cr.substring(cr.lastIndexOf('/') + 1).trim());
                            } else {
                                total = c.getContentLengthLong();
                            }
                            InputStream in = c.getInputStream();
                            FileOutputStream fo = new FileOutputStream(out, have > 0);
                            try {
                                byte[] buf = new byte[65536];
                                int n;
                                while ((n = in.read(buf)) > 0) {
                                    fo.write(buf, 0, n);
                                    have += n;
                                    long now = System.currentTimeMillis();
                                    if (now - lastNote > 250) {
                                        lastNote = now;
                                        JSObject p = new JSObject();
                                        p.put("bytes", have);
                                        p.put("total", total);
                                        notifyListeners("progress", p);
                                    }
                                }
                            } finally {
                                try { fo.close(); } catch (Exception e) {}
                                try { in.close(); } catch (Exception e) {}
                            }
                        } catch (Exception e) {
                            if (++fails > 10) throw e;
                            Thread.sleep(1500);
                            continue;   // the connection was cut: resume from what is already saved
                        } finally {
                            if (c != null) c.disconnect();
                        }
                        if (total <= 0 || have >= total) break;
                        if (++fails > 10) throw new java.io.IOException("incomplete: " + have + " of " + total);
                    }
                    if (have < 2000000L || (total > 0 && have != total)) { out.delete(); call.reject("incomplete file: " + have + " of " + total); return; }
                    if (!isZipOk(out)) { out.delete(); call.reject("corrupt file"); return; }
                    JSObject r = new JSObject();
                    r.put("path", out.getAbsolutePath());
                    r.put("size", have);
                    call.resolve(r);
                } catch (Exception e) {
                    call.reject("download failed: " + e.getMessage());
                }
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        String path = call.getString("path", "");
        if (path == null || path.isEmpty()) { call.reject("no file"); return; }
        if (path.startsWith("file://")) path = path.substring(7);
        File f = new File(path);
        if (!f.exists() || f.length() < 2000000L) { call.reject("incomplete file"); return; }
        Context ctx = getContext();
        long expected = call.getData().optLong("size", 0L);
        if (expected > 0 && f.length() != expected) { f.delete(); call.reject("incomplete file: " + f.length() + " of " + expected); return; }
        if (!isZipOk(f)) { f.delete(); call.reject("corrupt file"); return; }
        try {
            // only a clear mismatch stops here; if the phone cannot read the file info, the system installer decides
            android.content.pm.PackageInfo pi = ctx.getPackageManager().getPackageArchiveInfo(f.getAbsolutePath(), 0);
            if (pi != null && pi.packageName != null && !ctx.getPackageName().equals(pi.packageName)) { f.delete(); call.reject("wrong app"); return; }
        } catch (Exception e) { /* ignored */ }
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
