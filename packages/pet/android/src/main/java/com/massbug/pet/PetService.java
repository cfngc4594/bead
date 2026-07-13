package com.massbug.pet;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.view.WindowMetrics;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;

public class PetService extends Service {

    public static final String ACTION_START = "com.massbug.pet.START";
    public static final String ACTION_UPDATE = "com.massbug.pet.UPDATE";
    public static final String ACTION_STOP = "com.massbug.pet.STOP";

    private static final String NOTIFICATION_CHANNEL_ID = "pet";
    private static final int NOTIFICATION_ID = 4102;
    private static final int PET_SIZE_DP = 176;
    private static final int EDGE_HANDLE_WIDTH_DP = 32;
    private static final int EDGE_HANDLE_HEIGHT_DP = 56;
    private static final int EDGE_SNAP_THRESHOLD_DP = 12;
    private static final double PET_CAMERA_PADDING = 1.22;

    private static volatile boolean running = false;

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (webView == null || intent.getAction() == null) {
                return;
            }

            if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                webView.onPause();
            } else if (Intent.ACTION_SCREEN_ON.equals(intent.getAction())) {
                webView.onResume();
            }
        }
    };

    private PetStore store;
    private WindowManager windowManager;
    private FrameLayout overlayView;
    private WindowManager.LayoutParams overlayParams;
    private WebView webView;
    private TextView edgeHandle;
    private int collapsedSide;

    public static boolean isRunning() {
        return running;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        store = new PetStore(this);
        collapsedSide = store.getCollapsedSide();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        ContextCompat.registerReceiver(
            this,
            screenReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();

        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        startForeground(NOTIFICATION_ID, createNotification());

        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (overlayView == null) {
            showOverlay();
        } else {
            dispatchConfig();
        }

        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        running = false;

        try {
            unregisterReceiver(screenReceiver);
        } catch (IllegalArgumentException ignored) {
            // The receiver may already be unregistered during process teardown.
        }

        removeOverlay();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    private void showOverlay() {
        int size = dpToPx(PET_SIZE_DP);

        overlayParams = new WindowManager.LayoutParams(
            size,
            size,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        overlayParams.gravity = Gravity.TOP | Gravity.START;
        Rect displayBounds = getSafeDisplayBounds();
        Rect contentBounds = getPetContentBounds(size);
        overlayParams.x = store.getPositionX(
            displayBounds.right - contentBounds.right - dpToPx(12)
        );
        overlayParams.y = store.getPositionY(displayBounds.height() / 3);
        constrainOverlayPosition(displayBounds, contentBounds);

        overlayView = new FrameLayout(this);
        overlayView.setBackgroundColor(Color.TRANSPARENT);
        webView = createWebView();
        overlayView.addView(
            webView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );
        edgeHandle = createEdgeHandle();
        overlayView.addView(edgeHandle);
        installDragGesture(webView);
        windowManager.addView(overlayView, overlayParams);
        webView.loadUrl("file:///android_asset/public/pet.html");

        if (collapsedSide != 0) {
            collapseToEdge(collapsedSide);
        }
    }

    private TextView createEdgeHandle() {
        TextView handle = new TextView(this);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.argb(220, 39, 39, 42));
        background.setCornerRadius(dpToPx(12));
        handle.setBackground(background);
        handle.setContentDescription("展开桌面宠物");
        handle.setGravity(Gravity.CENTER);
        handle.setTextColor(Color.WHITE);
        handle.setTextSize(28);
        handle.setVisibility(View.GONE);
        handle.setOnClickListener(ignored -> expandFromEdge());
        return handle;
    }

    @SuppressWarnings("deprecation")
    private WebView createWebView() {
        WebView view = new WebView(getApplicationContext());
        WebSettings settings = view.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        view.setBackgroundColor(Color.TRANSPARENT);
        view.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        view.addJavascriptInterface(
            new PetJavascriptBridge(store),
            "BeadPetAndroid"
        );
        view.setWebViewClient(
            new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView ignored, String url) {
                    return !url.startsWith("file:///android_asset/public/");
                }
            }
        );

        return view;
    }

    private void installDragGesture(View view) {
        int touchSlop = ViewConfiguration.get(this).getScaledTouchSlop();

        view.setOnTouchListener(
            new View.OnTouchListener() {
                private float downRawX;
                private float downRawY;
                private int startX;
                private int startY;
                private boolean dragging;

                @Override
                public boolean onTouch(View ignored, MotionEvent event) {
                    switch (event.getActionMasked()) {
                        case MotionEvent.ACTION_DOWN:
                            downRawX = event.getRawX();
                            downRawY = event.getRawY();
                            startX = overlayParams.x;
                            startY = overlayParams.y;
                            dragging = false;
                            return true;
                        case MotionEvent.ACTION_MOVE:
                            int deltaX = Math.round(event.getRawX() - downRawX);
                            int deltaY = Math.round(event.getRawY() - downRawY);

                            if (!dragging && Math.hypot(deltaX, deltaY) >= touchSlop) {
                                dragging = true;
                            }

                            if (dragging) {
                                updateOverlayPosition(startX + deltaX, startY + deltaY);
                            }
                            return true;
                        case MotionEvent.ACTION_UP:
                            if (dragging) {
                                store.savePosition(overlayParams.x, overlayParams.y);
                                int edge = getDockEdge();

                                if (edge != 0) {
                                    collapseToEdge(edge);
                                }
                            } else {
                                dispatchTap();
                            }
                            return true;
                        case MotionEvent.ACTION_CANCEL:
                            return true;
                        default:
                            return false;
                    }
                }
            }
        );
    }

    private void updateOverlayPosition(int x, int y) {
        if (overlayView == null || overlayParams == null) {
            return;
        }

        overlayParams.x = x;
        overlayParams.y = y;
        constrainOverlayPosition(
            getSafeDisplayBounds(),
            getPetContentBounds(overlayParams.width)
        );
        windowManager.updateViewLayout(overlayView, overlayParams);
    }

    private int getDockEdge() {
        Rect displayBounds = getSafeDisplayBounds();
        Rect contentBounds = getPetContentBounds(overlayParams.width);
        int threshold = dpToPx(EDGE_SNAP_THRESHOLD_DP);
        int minX = displayBounds.left - contentBounds.left;
        int maxX = displayBounds.right - contentBounds.right;

        if (overlayParams.x <= minX + threshold) {
            return -1;
        }

        if (overlayParams.x >= maxX - threshold) {
            return 1;
        }

        return 0;
    }

    private void collapseToEdge(int side) {
        if (overlayView == null || webView == null || edgeHandle == null) {
            return;
        }

        int petSize = dpToPx(PET_SIZE_DP);
        int handleWidth = dpToPx(EDGE_HANDLE_WIDTH_DP);
        int handleHeight = dpToPx(EDGE_HANDLE_HEIGHT_DP);
        Rect displayBounds = getSafeDisplayBounds();
        int handleY = overlayParams.y + (petSize - handleHeight) / 2;

        collapsedSide = side < 0 ? -1 : 1;
        store.saveCollapsedSide(collapsedSide);
        webView.setVisibility(View.GONE);
        edgeHandle.setText(collapsedSide < 0 ? "›" : "‹");
        edgeHandle.setVisibility(View.VISIBLE);
        overlayParams.width = handleWidth;
        overlayParams.height = handleHeight;
        overlayParams.x = collapsedSide < 0
            ? displayBounds.left
            : displayBounds.right - handleWidth;
        overlayParams.y = clamp(
            handleY,
            displayBounds.top,
            displayBounds.bottom - handleHeight
        );
        windowManager.updateViewLayout(overlayView, overlayParams);
    }

    private void expandFromEdge() {
        if (collapsedSide == 0 || overlayView == null || webView == null || edgeHandle == null) {
            return;
        }

        int side = collapsedSide;
        int petSize = dpToPx(PET_SIZE_DP);
        int handleHeight = dpToPx(EDGE_HANDLE_HEIGHT_DP);
        int expandedY = overlayParams.y - (petSize - handleHeight) / 2;
        Rect displayBounds = getSafeDisplayBounds();
        Rect contentBounds = getPetContentBounds(petSize);

        collapsedSide = 0;
        store.saveCollapsedSide(0);
        edgeHandle.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        overlayParams.width = petSize;
        overlayParams.height = petSize;
        overlayParams.x = side < 0
            ? displayBounds.left - contentBounds.left
            : displayBounds.right - contentBounds.right;
        overlayParams.y = expandedY;
        constrainOverlayPosition(displayBounds, contentBounds);
        windowManager.updateViewLayout(overlayView, overlayParams);
        store.savePosition(overlayParams.x, overlayParams.y);
    }

    private void constrainOverlayPosition(Rect displayBounds, Rect contentBounds) {
        overlayParams.x = clamp(
            overlayParams.x,
            displayBounds.left - contentBounds.left,
            displayBounds.right - contentBounds.right
        );
        overlayParams.y = clamp(
            overlayParams.y,
            displayBounds.top - contentBounds.top,
            displayBounds.bottom - contentBounds.bottom
        );
    }

    private Rect getPetContentBounds(int canvasSize) {
        try {
            JSONArray instances = new JSONObject(store.getConfig()).getJSONArray("instances");

            if (instances.length() == 0) {
                return new Rect(0, 0, canvasSize, canvasSize);
            }

            double minX = Double.POSITIVE_INFINITY;
            double maxX = Double.NEGATIVE_INFINITY;
            double minY = Double.POSITIVE_INFINITY;
            double maxY = Double.NEGATIVE_INFINITY;

            for (int index = 0; index < instances.length(); index++) {
                JSONObject instance = instances.getJSONObject(index);
                double x = instance.getDouble("x");
                double y = instance.getDouble("y");
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }

            double modelWidth = Math.max(1, maxX - minX + 1);
            double modelHeight = Math.max(1, maxY - minY + 1);
            double scale = canvasSize /
                (Math.max(modelWidth, modelHeight) * PET_CAMERA_PADDING);
            int contentWidth = Math.min(canvasSize, (int) Math.ceil(modelWidth * scale));
            int contentHeight = Math.min(canvasSize, (int) Math.ceil(modelHeight * scale));
            int left = (canvasSize - contentWidth) / 2;
            int top = (canvasSize - contentHeight) / 2;

            return new Rect(left, top, left + contentWidth, top + contentHeight);
        } catch (Exception ignored) {
            return new Rect(0, 0, canvasSize, canvasSize);
        }
    }

    private Rect getSafeDisplayBounds() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowMetrics metrics = windowManager.getCurrentWindowMetrics();
            Rect bounds = metrics.getBounds();
            Insets insets = metrics
                .getWindowInsets()
                .getInsetsIgnoringVisibility(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()
                );

            return new Rect(
                0,
                0,
                bounds.width() - insets.left - insets.right,
                bounds.height() - insets.top - insets.bottom
            );
        }

        return new Rect(
            0,
            0,
            getResources().getDisplayMetrics().widthPixels,
            getResources().getDisplayMetrics().heightPixels
        );
    }

    private void dispatchTap() {
        if (webView != null) {
            webView.evaluateJavascript(
                "window.dispatchEvent(new Event('bead-pet-tap'))",
                null
            );
        }
    }

    private void dispatchConfig() {
        if (webView == null) {
            return;
        }

        String serializedConfig = store.getConfig();

        if (serializedConfig.isEmpty()) {
            return;
        }

        String script =
            "window.dispatchEvent(new CustomEvent('bead-pet-config',{detail:JSON.parse(" +
            JSONObject.quote(serializedConfig) +
            ")}))";
        webView.evaluateJavascript(script, null);

        if (collapsedSide == 0) {
            updateOverlayPosition(overlayParams.x, overlayParams.y);
        }
    }

    private void removeOverlay() {
        if (overlayView != null) {
            windowManager.removeView(overlayView);
            overlayView = null;
        }

        if (webView != null) {
            webView.removeJavascriptInterface("BeadPetAndroid");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
    }

    private Notification createNotification() {
        Intent openAppIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());

        if (openAppIntent == null) {
            openAppIntent = new Intent();
        }

        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, PetService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_pet_notification)
            .setContentTitle(getString(R.string.pet_notification_title))
            .setContentText(getString(R.string.pet_notification_text))
            .setContentIntent(openAppPendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                R.drawable.ic_pet_notification,
                getString(R.string.pet_notification_stop),
                stopPendingIntent
            )
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            getString(R.string.pet_notification_channel),
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(getString(R.string.pet_notification_channel_description));
        channel.setShowBadge(false);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
