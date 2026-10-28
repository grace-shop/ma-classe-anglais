package tg.maclasse.anglais;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;

import java.io.ByteArrayOutputStream;

/* Foreground service (type mediaProjection): captures the screen a few times a second
   and gives each picture to ScreenSharePlugin as a small JPEG. */
public class ScreenShareService extends Service {

    static final String CHANNEL = "screen_share";
    static final int NOTE_ID = 4712;
    static final long FRAME_MS = 350;   // about 3 pictures a second
    static final int MAX_W = 540;       // width sent (keeps the call light)
    static final int JPEG_Q = 55;

    static volatile ScreenSharePlugin owner;

    private MediaProjection projection;
    private VirtualDisplay display;
    private ImageReader reader;
    private HandlerThread thread;
    private Handler work;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean running = false;

    static void attach(ScreenSharePlugin p) { owner = p; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        if (running) return START_NOT_STICKY;

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Screen sharing", NotificationManager.IMPORTANCE_LOW));
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setContentTitle("You are sharing your screen")
                .setContentText("Tap to return to the call")
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
        // Android 14: the service must be in the foreground before the capture token is used
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        else startForeground(NOTE_ID, n);

        int code = intent.getIntExtra("code", 0);
        Intent data = (Intent) intent.getParcelableExtra("data");
        MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
        projection = mpm.getMediaProjection(code, data);
        if (projection == null) { finish(false); return START_NOT_STICKY; }
        projection.registerCallback(new MediaProjection.Callback() {
            @Override public void onStop() { finish(true); }
        }, main);

        DisplayMetrics dm = new DisplayMetrics();
        ((WindowManager) getSystemService(WINDOW_SERVICE)).getDefaultDisplay().getRealMetrics(dm);
        int w = Math.min(MAX_W, dm.widthPixels) & ~1;
        int h = (dm.heightPixels * w / dm.widthPixels) & ~1;

        thread = new HandlerThread("screen-share");
        thread.start();
        work = new Handler(thread.getLooper());
        reader = ImageReader.newInstance(w, h, PixelFormat.RGBA_8888, 2);
        display = projection.createVirtualDisplay("english-classes-screen", w, h, dm.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, work);

        running = true;
        work.postDelayed(tick, FRAME_MS);
        return START_NOT_STICKY;
    }

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (!running) return;
            sendFrame();
            if (running) work.postDelayed(this, FRAME_MS);
        }
    };

    private void sendFrame() {
        Image img = null;
        try {
            img = reader.acquireLatestImage();
            if (img == null) return;
            Image.Plane plane = img.getPlanes()[0];
            int w = img.getWidth(), h = img.getHeight();
            int ps = plane.getPixelStride(), rs = plane.getRowStride();
            Bitmap bmp = Bitmap.createBitmap(w + (rs - ps * w) / ps, h, Bitmap.Config.ARGB_8888);
            bmp.copyPixelsFromBuffer(plane.getBuffer());
            Bitmap crop = Bitmap.createBitmap(bmp, 0, 0, w, h);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            crop.compress(Bitmap.CompressFormat.JPEG, JPEG_Q, out);
            final String b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            final ScreenSharePlugin p = owner;
            if (p != null) {
                main.post(() -> {
                    JSObject o = new JSObject();
                    o.put("data", b64);
                    p.emit("frame", o);
                });
            }
        } catch (Exception e) {
            // one picture lost is fine: the next one comes in a moment
        } finally {
            if (img != null) img.close();
        }
    }

    private void finish(boolean tellPage) {
        if (!running && projection == null) { stopSelf(); return; }
        running = false;
        if (work != null) work.removeCallbacks(tick);
        if (display != null) { display.release(); display = null; }
        if (reader != null) { reader.close(); reader = null; }
        MediaProjection mp = projection;
        projection = null;
        if (mp != null) { try { mp.stop(); } catch (Exception e) { } }
        if (thread != null) { thread.quitSafely(); thread = null; }
        final ScreenSharePlugin p = owner;
        if (tellPage && p != null) main.post(() -> p.emit("stopped", new JSObject()));
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        finish(false);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
