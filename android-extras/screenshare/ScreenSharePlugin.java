package tg.maclasse.anglais;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/* Shares the phone screen during a call (JS: Capacitor.Plugins.ScreenShare).
   start() asks the person to allow screen capture, then the service sends pictures of the screen
   to the web page as "frame" events (base64 JPEG). "stopped" is sent when the person stops sharing. */
@CapacitorPlugin(name = "ScreenShare")
public class ScreenSharePlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        MediaProjectionManager mpm = (MediaProjectionManager) getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        startActivityForResult(call, mpm.createScreenCaptureIntent(), "onScreenResult");
    }

    @ActivityCallback
    private void onScreenResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Screen sharing was not allowed");
            return;
        }
        Intent svc = new Intent(getContext(), ScreenShareService.class);
        svc.putExtra("code", result.getResultCode());
        svc.putExtra("data", result.getData());
        ScreenShareService.attach(this);
        if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(svc);
        else getContext().startService(svc);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), ScreenShareService.class));
        call.resolve();
    }

    void emit(String event, JSObject data) {
        notifyListeners(event, data);
    }
}
