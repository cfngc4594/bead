package com.massbug.pet;

import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;

final class PetJavascriptBridge {

    private final Context context;
    private final PetStore store;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable onMenuClosed;

    PetJavascriptBridge(Context context, PetStore store, Runnable onMenuClosed) {
        this.context = context.getApplicationContext();
        this.store = store;
        this.onMenuClosed = onMenuClosed;
    }

    @JavascriptInterface
    public String getConfig() {
        return store.getConfig();
    }

    @JavascriptInterface
    public void closeMenu() {
        mainHandler.post(onMenuClosed);
    }

    @JavascriptInterface
    public void stopPet() {
        mainHandler.post(() -> {
            onMenuClosed.run();
            context.stopService(new Intent(context, PetService.class));
        });
    }
}
