package tg.maclasse.anglais;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/* Keeps a call alive when the person leaves the app (JS: Capacitor.Plugins.CallKeeper). */
@CapacitorPlugin(name = "CallKeeper")
public class CallKeeperPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Intent i = new Intent(getContext(), CallKeeperService.class);
        i.putExtra("title", call.getString("title", "English Classes"));
        i.putExtra("video", call.getBoolean("video", false));
        if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(i);
        else getContext().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), CallKeeperService.class));
        call.resolve();
    }

    /* Haut-parleur on/off during a call (JS: Capacitor.Plugins.CallKeeper.speaker({on})). */
    @PluginMethod
    public void speaker(PluginCall call) {
        android.media.AudioManager am = (android.media.AudioManager) getContext().getSystemService(android.content.Context.AUDIO_SERVICE);
        if (am != null) {
            am.setMode(android.media.AudioManager.MODE_IN_COMMUNICATION);
            am.setSpeakerphoneOn(call.getBoolean("on", false));
        }
        call.resolve();
    }
}
