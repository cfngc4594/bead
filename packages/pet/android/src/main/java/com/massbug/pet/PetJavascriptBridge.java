package com.massbug.pet;

import android.webkit.JavascriptInterface;

final class PetJavascriptBridge {

    private final PetStore store;

    PetJavascriptBridge(PetStore store) {
        this.store = store;
    }

    @JavascriptInterface
    public String getConfig() {
        return store.getConfig();
    }
}
