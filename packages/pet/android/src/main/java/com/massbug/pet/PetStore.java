package com.massbug.pet;

import android.content.Context;
import android.content.SharedPreferences;

final class PetStore {

    private static final String PREFERENCES_NAME = "pet";
    private static final String CONFIG_KEY = "config";
    private static final String POSITION_X_KEY = "position_x";
    private static final String POSITION_Y_KEY = "position_y";

    private final SharedPreferences preferences;

    PetStore(Context context) {
        preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    String getConfig() {
        return preferences.getString(CONFIG_KEY, "");
    }

    void saveConfig(String config) {
        preferences.edit().putString(CONFIG_KEY, config).apply();
    }

    int getPositionX(int fallback) {
        return preferences.getInt(POSITION_X_KEY, fallback);
    }

    int getPositionY(int fallback) {
        return preferences.getInt(POSITION_Y_KEY, fallback);
    }

    void savePosition(int x, int y) {
        preferences.edit().putInt(POSITION_X_KEY, x).putInt(POSITION_Y_KEY, y).apply();
    }

}
