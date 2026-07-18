package com.massbug.pet;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Pet")
public class PetPlugin extends Plugin {

    private static final int MAX_CONFIG_LENGTH = 1_000_000;

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(createStatus());
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Settings.canDrawOverlays(getContext())) {
            call.resolve(createPermissionResult());
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        startActivityForResult(call, intent, "overlayPermissionResult");
    }

    @ActivityCallback
    private void overlayPermissionResult(PluginCall call, ActivityResult result) {
        call.resolve(createPermissionResult());
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            call.reject("需要先授予悬浮窗权限", "OVERLAY_PERMISSION_REQUIRED");
            return;
        }

        JSObject config = call.getObject("config");

        if (config == null) {
            call.reject("缺少桌宠配置", "INVALID_CONFIG");
            return;
        }

        String serializedConfig = config.toString();

        if (serializedConfig.isEmpty() || serializedConfig.length() > MAX_CONFIG_LENGTH) {
            call.reject("桌宠配置大小无效", "INVALID_CONFIG");
            return;
        }

        new PetStore(getContext()).saveConfig(serializedConfig);

        Intent intent = new Intent(getContext(), PetService.class);
        intent.setAction(
            PetService.isRunning()
                ? PetService.ACTION_UPDATE
                : PetService.ACTION_START
        );
        ContextCompat.startForegroundService(getContext(), intent);

        JSObject status = createStatus();
        status.put("running", true);
        call.resolve(status);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), PetService.class));

        JSObject status = createStatus();
        status.put("running", false);
        call.resolve(status);
    }

    private JSObject createStatus() {
        JSObject result = createPermissionResult();
        result.put("running", PetService.isRunning());
        result.put("supported", true);
        return result;
    }

    private JSObject createPermissionResult() {
        JSObject result = new JSObject();
        result.put("permissionGranted", Settings.canDrawOverlays(getContext()));
        return result;
    }
}
