#!/usr/bin/env bash
set -e

echo "=== Building Real Native Standalone Android APK for Nexora (v2.0 with AlarmManager + BroadcastReceiver + BootReceiver) ==="

BUILD_DIR="/tmp/nexora_android_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/nexora/app"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/layout"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets/app/avatars"
mkdir -p "$BUILD_DIR/assets/app/screenshots"
mkdir -p "$BUILD_DIR/assets/app/icons"
mkdir -p "$BUILD_DIR/bin"

PUBLIC_DIR="/app/applet/public"
if [ -d "/opt/android/sdk/build-tools" ]; then
  LATEST_BUILD_TOOLS=$(ls -1 /opt/android/sdk/build-tools | sort -V | tail -n 1)
  if [ -n "$LATEST_BUILD_TOOLS" ]; then
    export PATH="/opt/android/sdk/build-tools/$LATEST_BUILD_TOOLS:$PATH"
  fi
fi

ANDROID_JAR="/opt/android/sdk/platforms/android-36/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
  ANDROID_JAR="/usr/share/java/android.jar"
fi
if [ ! -f "$ANDROID_JAR" ]; then
  ANDROID_JAR="/usr/share/java/com.android.android-23.jar"
fi
if [ ! -f "$ANDROID_JAR" ]; then
  ANDROID_JAR=$(find /opt/android/sdk /usr -name "android.jar" 2>/dev/null | head -n 1)
fi

echo "Using ANDROID_JAR: $ANDROID_JAR"

# 1. Copy app icons for launcher mipmaps & notification drawables
cp "$PUBLIC_DIR/icon-192.png" "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp "$PUBLIC_DIR/icon-192.png" "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp "$PUBLIC_DIR/icon-512.png" "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
cp "$PUBLIC_DIR/icon-512.png" "$BUILD_DIR/res/mipmap-xxxhdpi/ic_launcher.png"
cp "$PUBLIC_DIR/icon-192.png" "$BUILD_DIR/res/drawable/ic_launcher.png"

# 2. Bundle offline assets into assets/ directory
cp -r "$PUBLIC_DIR/avatars/"* "$BUILD_DIR/assets/app/avatars/" 2>/dev/null || true
cp -r "$PUBLIC_DIR/screenshots/"* "$BUILD_DIR/assets/app/screenshots/" 2>/dev/null || true
cp "$PUBLIC_DIR/icon-192.png" "$BUILD_DIR/assets/app/icons/"
cp "$PUBLIC_DIR/icon-512.png" "$BUILD_DIR/assets/app/icons/"
cp "$PUBLIC_DIR/icon.svg" "$BUILD_DIR/assets/app/"
cp "$PUBLIC_DIR/manifest.webmanifest" "$BUILD_DIR/assets/app/"

# 3. Create production offline sanctuary HTML shell (without developer test buttons)
cat << 'EOF' > "$BUILD_DIR/assets/app/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes" />
  <title>Nexora Sanctuary</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0C0A09;
      color: #F5F5F4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(212, 168, 83, 0.15);
      border: 1px solid rgba(212, 168, 83, 0.4);
      color: #FCD34D;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 30px;
      font-weight: 800;
      color: #F5F5F4;
      margin-bottom: 10px;
    }
    p {
      color: #A8A29E;
      font-size: 14px;
      max-width: 400px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .card {
      background: #1C1917;
      border: 1px solid #292524;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FCD34D, #F59E0B);
      color: #0C0A09;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      margin-bottom: 12px;
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.35);
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #292524;
    }
    .stat-item { text-align: center; }
    .stat-num { font-size: 15px; font-weight: 800; color: #F59E0B; }
    .stat-lbl { font-size: 10px; color: #78716C; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Nexora — Digital Sanctuary</div>
    <h1>Sanctuary Offline</h1>
    <p>Your scheduled task, habit, and hydration alarms remain active on your device even while offline. Reconnect to sync your workspace.</p>
    <button class="btn" onclick="window.location.href='https://nexora-nine-kappa.vercel.app/dashboard'">Reconnect Workspace</button>
    <div class="stats">
      <div class="stat-item"><div class="stat-num">Armed</div><div class="stat-lbl">Alarms</div></div>
      <div class="stat-item"><div class="stat-num">Local</div><div class="stat-lbl">Storage</div></div>
      <div class="stat-item"><div class="stat-num">Ready</div><div class="stat-lbl">Channels</div></div>
    </div>
  </div>
</body>
</html>
EOF

# 4. strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Nexora</string>
</resources>
EOF

# 5. styles.xml
cat << 'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
EOF

# 6. activity_main.xml
cat << 'EOF' > "$BUILD_DIR/res/layout/activity_main.xml"
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0C0A09">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <ProgressBar
        android:id="@+id/progress_bar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:layout_alignParentTop="true"
        android:visibility="gone" />

</RelativeLayout>
EOF

# 7. AndroidManifest.xml with RECEIVE_BOOT_COMPLETED, ReminderReceiver & BootReceiver
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.nexora.app"
    android:versionCode="3"
    android:versionName="2.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="35" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:hardwareAccelerated="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name="com.nexora.app.MainActivity"
            android:label="@string/app_name"
            android:launchMode="singleTop"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver
            android:name="com.nexora.app.ReminderReceiver"
            android:enabled="true"
            android:exported="false" />

        <receiver
            android:name="com.nexora.app.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>
EOF

# 8A. NotificationHelper.java — Manages the 4 notification channels & builds system notifications
cat << 'EOF' > "$BUILD_DIR/src/com/nexora/app/NotificationHelper.java"
package com.nexora.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Vibrator;

public class NotificationHelper {
    public static final String CHANNEL_TASKS = "nexora_tasks";
    public static final String CHANNEL_HABITS = "nexora_habits";
    public static final String CHANNEL_HYDRATION = "nexora_hydration";
    public static final String CHANNEL_EXPENSES = "nexora_expenses";

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager == null) return;

                createSingleChannel(manager, CHANNEL_TASKS, "Task Reminders", "Scheduled task reminders and deadlines", 4);
                createSingleChannel(manager, CHANNEL_HABITS, "Habit Reminders", "Scheduled habit windows and daily routines", 4);
                createSingleChannel(manager, CHANNEL_HYDRATION, "Hydration Reminders", "Periodic water intake reminders during active hours", 4);
                createSingleChannel(manager, CHANNEL_EXPENSES, "Expense Reminders", "Daily cash-flow and expense logging prompts", 3);
            } catch (Throwable e) {
                e.printStackTrace();
            }
        }
    }

    private static void createSingleChannel(NotificationManager manager, String id, String name, String desc, int importance) {
        try {
            Class<?> channelClass = Class.forName("android.app.NotificationChannel");
            java.lang.reflect.Constructor<?> constructor = channelClass.getConstructor(
                String.class, CharSequence.class, int.class
            );
            Object channel = constructor.newInstance(id, name, importance);

            java.lang.reflect.Method setDesc = channelClass.getMethod("setDescription", String.class);
            setDesc.invoke(channel, desc);

            java.lang.reflect.Method enableVib = channelClass.getMethod("enableVibration", boolean.class);
            enableVib.invoke(channel, true);

            java.lang.reflect.Method setVibPattern = channelClass.getMethod("setVibrationPattern", long[].class);
            setVibPattern.invoke(channel, (Object) new long[]{0, 250, 100, 250});

            java.lang.reflect.Method createMethod = manager.getClass().getMethod("createNotificationChannel", channelClass);
            createMethod.invoke(manager, channel);
        } catch (Throwable ignored) {}
    }

    public static void showSystemNotification(Context context, String alarmId, String title, String message, String channelId, String targetUrl) {
        try {
            ensureChannels(context);

            String resolvedChannel = (channelId != null && !channelId.isEmpty()) ? channelId : CHANNEL_HABITS;

            try {
                Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) {
                    v.vibrate(new long[]{0, 200, 100, 200}, -1);
                }
            } catch (Throwable ignored) {}

            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
            if (targetUrl != null && !targetUrl.isEmpty()) {
                intent.putExtra("target_url", targetUrl);
            }
            if (alarmId != null) {
                intent.putExtra("alarm_id", alarmId);
            }

            int reqCode = (alarmId != null ? alarmId.hashCode() : (int) System.currentTimeMillis()) & 0x7fffffff;
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, reqCode, intent, flags);

            Notification.Builder builder = new Notification.Builder(context);
            if (Build.VERSION.SDK_INT >= 26) {
                try {
                    java.lang.reflect.Constructor<Notification.Builder> c =
                        Notification.Builder.class.getConstructor(Context.class, String.class);
                    builder = c.newInstance(context, resolvedChannel);
                } catch (Throwable e1) {
                    try {
                        java.lang.reflect.Method setChannel =
                            builder.getClass().getMethod("setChannelId", String.class);
                        setChannel.invoke(builder, resolvedChannel);
                    } catch (Throwable ignored) {}
                }
            }

            int smallIcon = R.drawable.ic_launcher;
            if (smallIcon == 0) {
                smallIcon = context.getApplicationInfo().icon;
            }
            if (smallIcon == 0) {
                smallIcon = android.R.drawable.ic_dialog_info;
            }

            builder.setContentTitle(title != null && !title.isEmpty() ? title : "Nexora Reminder")
                   .setContentText(message != null && !message.isEmpty() ? message : "Scheduled reminder active.")
                   .setSmallIcon(smallIcon)
                   .setContentIntent(pendingIntent)
                   .setAutoCancel(true)
                   .setWhen(System.currentTimeMillis())
                   .setDefaults(Notification.DEFAULT_ALL);

            if (Build.VERSION.SDK_INT >= 17) {
                builder.setShowWhen(true);
            }
            if (Build.VERSION.SDK_INT >= 16) {
                builder.setStyle(new Notification.BigTextStyle().bigText(message));
            }
            if (Build.VERSION.SDK_INT >= 21) {
                builder.setPriority(Notification.PRIORITY_HIGH);
                if (CHANNEL_EXPENSES.equals(resolvedChannel)) {
                    builder.setVisibility(Notification.VISIBILITY_PRIVATE);
                } else {
                    builder.setVisibility(Notification.VISIBILITY_PUBLIC);
                }
            }

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(reqCode, builder.build());
            }
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }
}
EOF

# 8B. AlarmStorage.java — Persists scheduled alarms in SharedPreferences and schedules with AlarmManager
cat << 'EOF' > "$BUILD_DIR/src/com/nexora/app/AlarmStorage.java"
package com.nexora.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Map;
import org.json.JSONObject;

public class AlarmStorage {
    private static final String PREFS_ALARMS = "nexora_scheduled_alarms_prefs";

    public static void scheduleAlarm(Context context, String id, String title, String message, long triggerAtMs, String channelId, String targetUrl) {
        if (id == null || id.isEmpty() || triggerAtMs <= 0) return;

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("title", title != null ? title : "Nexora Reminder");
            obj.put("message", message != null ? message : "");
            obj.put("triggerAtMs", triggerAtMs);
            obj.put("channelId", channelId != null ? channelId : NotificationHelper.CHANNEL_HABITS);
            obj.put("targetUrl", targetUrl != null ? targetUrl : "/dashboard");
            prefs.edit().putString(id, obj.toString()).apply();

            registerWithAlarmManager(context, id, title, message, triggerAtMs, channelId, targetUrl);
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    public static void registerWithAlarmManager(Context context, String id, String title, String message, long triggerAtMs, String channelId, String targetUrl) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            PendingIntent pi = buildPendingIntent(context, id, title, message, channelId, targetUrl);

            if (Build.VERSION.SDK_INT >= 23) {
                try {
                    java.lang.reflect.Method setIdle = AlarmManager.class.getMethod(
                        "setAndAllowWhileIdle", int.class, long.class, PendingIntent.class
                    );
                    setIdle.invoke(am, AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
                    return;
                } catch (Throwable ignored) {}
            }

            if (Build.VERSION.SDK_INT >= 19) {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
            }
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    public static void cancelAlarm(Context context, String id) {
        if (id == null || id.isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            prefs.edit().remove(id).apply();

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                PendingIntent pi = buildPendingIntent(context, id, "", "", "", "");
                am.cancel(pi);
            }
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    public static void cancelAllAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            Map<String, ?> all = prefs.getAll();
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            for (String key : all.keySet()) {
                if (am != null) {
                    PendingIntent pi = buildPendingIntent(context, key, "", "", "", "");
                    am.cancel(pi);
                }
            }
            prefs.edit().clear().apply();
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    public static void removeTriggeredAlarmRecord(Context context, String id) {
        if (id == null || id.isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            prefs.edit().remove(id).apply();
        } catch (Throwable ignored) {}
    }

    public static void rescheduleAllPersistedAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            Map<String, ?> all = prefs.getAll();
            long now = System.currentTimeMillis();

            for (Map.Entry<String, ?> entry : all.entrySet()) {
                Object raw = entry.getValue();
                if (!(raw instanceof String)) continue;
                try {
                    JSONObject obj = new JSONObject((String) raw);
                    String id = obj.optString("id", entry.getKey());
                    String title = obj.optString("title", "Nexora Reminder");
                    String message = obj.optString("message", "");
                    long triggerAtMs = obj.optLong("triggerAtMs", 0L);
                    String channelId = obj.optString("channelId", NotificationHelper.CHANNEL_HABITS);
                    String targetUrl = obj.optString("targetUrl", "/dashboard");

                    if (triggerAtMs > now) {
                        registerWithAlarmManager(context, id, title, message, triggerAtMs, channelId, targetUrl);
                    } else {
                        prefs.edit().remove(id).apply();
                    }
                } catch (Throwable ignored) {}
            }
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    private static PendingIntent buildPendingIntent(Context context, String id, String title, String message, String channelId, String targetUrl) {
        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.setAction("com.nexora.app.ACTION_TRIGGER_REMINDER_" + id);
        intent.putExtra("alarm_id", id);
        intent.putExtra("title", title);
        intent.putExtra("message", message);
        intent.putExtra("channel_id", channelId);
        intent.putExtra("target_url", targetUrl);

        int reqCode = id.hashCode() & 0x7fffffff;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, reqCode, intent, flags);
    }
}
EOF

# 8C. ReminderReceiver.java — Fires system notification when scheduled AlarmManager broadcast triggers
cat << 'EOF' > "$BUILD_DIR/src/com/nexora/app/ReminderReceiver.java"
package com.nexora.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        try {
            String alarmId = intent.getStringExtra("alarm_id");
            String title = intent.getStringExtra("title");
            String message = intent.getStringExtra("message");
            String channelId = intent.getStringExtra("channel_id");
            String targetUrl = intent.getStringExtra("target_url");

            AlarmStorage.removeTriggeredAlarmRecord(context, alarmId);
            NotificationHelper.showSystemNotification(context, alarmId, title, message, channelId, targetUrl);
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }
}
EOF

# 8D. BootReceiver.java — Reschedules persisted alarms on device restart or time/timezone change
cat << 'EOF' > "$BUILD_DIR/src/com/nexora/app/BootReceiver.java"
package com.nexora.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null) return;
        try {
            NotificationHelper.ensureChannels(context);
            AlarmStorage.rescheduleAllPersistedAlarms(context);
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }
}
EOF

# 8E. MainActivity.java — WebView host + NativeBridge + Deep-link routing
cat << 'EOF' > "$BUILD_DIR/src/com/nexora/app/MainActivity.java"
package com.nexora.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import java.util.Locale;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private WebView webView;
    private ProgressBar progressBar;
    private static final String BASE_ORIGIN = "https://nexora-nine-kappa.vercel.app";
    private static final String APP_URL = "https://nexora-nine-kappa.vercel.app/dashboard";
    private static final String OFFLINE_URL = "file:///android_asset/app/index.html";
    private static final String PREFS_NAME = "nexora_native_prefs";
    private static final int REQ_POST_NOTIFICATIONS = 101;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    public class NativeBridge {
        @JavascriptInterface
        public void showNotification(final String title, final String message, final String tag) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String channel = NotificationHelper.CHANNEL_HABITS;
                    String target = "/dashboard";
                    if (tag != null) {
                        if (tag.contains("task")) {
                            channel = NotificationHelper.CHANNEL_TASKS;
                            target = "/tasks";
                        } else if (tag.contains("hydration")) {
                            channel = NotificationHelper.CHANNEL_HYDRATION;
                            target = "/dashboard#hydration";
                        } else if (tag.contains("expense")) {
                            channel = NotificationHelper.CHANNEL_EXPENSES;
                            target = "/dashboard#finance";
                        } else if (tag.contains("habit")) {
                            channel = NotificationHelper.CHANNEL_HABITS;
                            target = "/habits";
                        }
                    }
                    NotificationHelper.showSystemNotification(
                        MainActivity.this,
                        tag != null ? tag : "nexora-now",
                        title,
                        message,
                        channel,
                        target
                    );
                }
            });
        }

        @JavascriptInterface
        public void scheduleNotification(
            final String id,
            final String title,
            final String message,
            final long triggerAtMs,
            final String channelId,
            final String targetUrl
        ) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    AlarmStorage.scheduleAlarm(
                        MainActivity.this,
                        id,
                        title,
                        message,
                        triggerAtMs,
                        channelId,
                        targetUrl
                    );
                }
            });
        }

        @JavascriptInterface
        public void cancelNotification(final String id) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    AlarmStorage.cancelAlarm(MainActivity.this, id);
                }
            });
        }

        @JavascriptInterface
        public void cancelAllNotifications() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    AlarmStorage.cancelAllAlarms(MainActivity.this);
                }
            });
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    askOrTriggerNotificationPermission(true);
                }
            });
        }

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            return isNotificationPermissionGranted();
        }

        @JavascriptInterface
        public void openAppNotificationSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent();
                        if (Build.VERSION.SDK_INT >= 26) {
                            intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
                            intent.putExtra("android.provider.extra.APP_PACKAGE", getPackageName());
                        } else {
                            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                            intent.setData(Uri.fromParts("package", getPackageName(), null));
                        }
                        startActivity(intent);
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public void vibrate(final long ms) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                        if (v != null) {
                            long duration = ms > 0 ? Math.min(ms, 2000L) : 50L;
                            v.vibrate(duration);
                        }
                    } catch (Throwable ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void speakText(final String text) {
            if (text == null || text.trim().isEmpty()) return;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (tts != null && ttsReady) {
                            if (Build.VERSION.SDK_INT >= 21) {
                                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "nexora_tts_" + System.currentTimeMillis());
                            } else {
                                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null);
                            }
                        }
                    } catch (Throwable t) {
                        t.printStackTrace();
                    }
                }
            });
        }

        @JavascriptInterface
        public void stopSpeaking() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (tts != null) {
                            tts.stop();
                        }
                    } catch (Throwable ignored) {}
                }
            });
        }
    }

    private boolean isNotificationPermissionGranted() {
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                return checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
            } catch (Throwable t) {
                return true;
            }
        }
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return prefs.getBoolean("notif_allowed", true);
    }

    private void askOrTriggerNotificationPermission(final boolean fromUserAction) {
        final SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                if (!fromUserAction && prefs.getBoolean("notif_denied_once", false)) {
                    return;
                }
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_POST_NOTIFICATIONS);
                return;
            }
        }

        if (!prefs.getBoolean("notif_prompt_shown", false)) {
            try {
                AlertDialog.Builder dlg = new AlertDialog.Builder(this);
                dlg.setTitle("Enable Nexora Reminders");
                dlg.setMessage("Nexora uses Android notifications to deliver your scheduled task, habit, and hydration reminders even when the app is closed.");
                dlg.setCancelable(true);
                dlg.setPositiveButton("Enable", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        prefs.edit().putBoolean("notif_prompt_shown", true).putBoolean("notif_allowed", true).apply();
                        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_POST_NOTIFICATIONS);
                        } else {
                            notifyWebPermissionResult(true);
                        }
                    }
                });
                dlg.setNegativeButton("Not Now", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        prefs.edit().putBoolean("notif_prompt_shown", true).putBoolean("notif_denied_once", true).apply();
                        dialog.dismiss();
                    }
                });
                dlg.show();
                return;
            } catch (Throwable t) {
                t.printStackTrace();
            }
        }

        if (fromUserAction) {
            prefs.edit().putBoolean("notif_allowed", true).apply();
            notifyWebPermissionResult(true);
        }
    }

    private void notifyWebPermissionResult(final boolean granted) {
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= 19) {
                        webView.evaluateJavascript(
                            "window.__nexoraNotifGranted = " + granted + "; if (window.onNexoraNotificationPermissionResult) { window.onNexoraNotificationPermissionResult(" + granted + "); }",
                            null
                        );
                    } else {
                        webView.loadUrl("javascript:window.__nexoraNotifGranted=" + granted + ";if(window.onNexoraNotificationPermissionResult){window.onNexoraNotificationPermissionResult(" + granted + ");}");
                    }
                }
            });
        }
    }

    private void injectWebNotificationPolyfill(WebView view) {
        if (view == null) return;
        String js = "(function(){" +
            "if(window.__nexoraPolyfillInstalled) return;" +
            "window.__nexoraPolyfillInstalled = true;" +
            "var Bridge = window.NexoraNativeBridge;" +
            "if(!Bridge) return;" +
            "function NativeNotification(title, options){" +
            "  var body = (options && options.body) ? options.body : '';" +
            "  var tag = (options && options.tag) ? options.tag : 'nexora-alert';" +
            "  Bridge.showNotification(String(title || 'Nexora Reminder'), String(body), String(tag));" +
            "  this.title = title;" +
            "  this.body = body;" +
            "  this.close = function(){};" +
            "}" +
            "NativeNotification.permission = Bridge.hasNotificationPermission() ? 'granted' : 'default';" +
            "NativeNotification.requestPermission = function(cb){" +
            "  Bridge.requestNotificationPermission();" +
            "  if(typeof cb === 'function') cb('granted');" +
            "  return Promise.resolve('granted');" +
            "};" +
            "window.Notification = NativeNotification;" +
            "if(navigator.serviceWorker && window.ServiceWorkerRegistration){" +
            "  ServiceWorkerRegistration.prototype.showNotification = function(title, options){" +
            "    var body = (options && options.body) ? options.body : '';" +
            "    var tag = (options && options.tag) ? options.tag : 'nexora-sw';" +
            "    Bridge.showNotification(String(title || 'Nexora Reminder'), String(body), String(tag));" +
            "    return Promise.resolve();" +
            "  };" +
            "}" +
            "})();";

        if (Build.VERSION.SDK_INT >= 19) {
            view.evaluateJavascript(js, null);
        } else {
            view.loadUrl("javascript:" + js);
        }
    }

    private String resolveDeepLinkUrl(Intent intent) {
        if (intent == null) return APP_URL;
        String target = intent.getStringExtra("target_url");
        if (target != null && !target.isEmpty()) {
            if (target.startsWith("http://") || target.startsWith("https://")) {
                return target;
            }
            if (!target.startsWith("/")) {
                target = "/" + target;
            }
            return BASE_ORIGIN + target;
        }
        return APP_URL;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (webView != null && intent != null && intent.hasExtra("target_url")) {
            String url = resolveDeepLinkUrl(intent);
            webView.loadUrl(url);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_POST_NOTIFICATIONS) {
            boolean granted = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            prefs.edit()
                .putBoolean("notif_prompt_shown", true)
                .putBoolean("notif_allowed", granted)
                .putBoolean("notif_denied_once", !granted)
                .apply();

            if (granted) {
                Toast.makeText(this, "Nexora reminders enabled", Toast.LENGTH_SHORT).show();
            }
            notifyWebPermissionResult(granted);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        NotificationHelper.ensureChannels(this);
        AlarmStorage.rescheduleAllPersistedAlarms(this);

        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0C0A09"));

        webView = (WebView) findViewById(R.id.webview);
        progressBar = (ProgressBar) findViewById(R.id.progress_bar);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " NexoraNativeAndroid/2.0.0");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= 21) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        webView.setBackgroundColor(Color.parseColor("#0C0A09"));
        webView.addJavascriptInterface(new NativeBridge(), "NexoraNativeBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                injectWebNotificationPolyfill(view);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectWebNotificationPolyfill(view);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                view.loadUrl(OFFLINE_URL);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        String launchUrl = resolveDeepLinkUrl(getIntent());
        if (savedInstanceState == null) {
            webView.loadUrl(launchUrl);
        } else {
            webView.restoreState(savedInstanceState);
        }

        try {
            tts = new TextToSpeech(this, this);
        } catch (Throwable t) {
            t.printStackTrace();
        }

        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                askOrTriggerNotificationPermission(false);
            }
        }, 900);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            try {
                int res = tts.setLanguage(Locale.US);
                if (res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED) {
                    ttsReady = true;
                }
            } catch (Throwable t) {
                t.printStackTrace();
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Throwable ignored) {}
        }
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

# 9. Generate R.java
echo "-> Generating R.java via aapt..."
aapt package -m -J "$BUILD_DIR/src" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

# 10. Compile Java classes
echo "-> Compiling Java sources with javac..."
javac --release 8 \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/bin" \
    "$BUILD_DIR/src/com/nexora/app/"*.java

# 11. Dex byte-compilation
echo "-> Converting class files to Dalvik DEX..."
if command -v d8 >/dev/null 2>&1; then
  d8 --lib "$ANDROID_JAR" --output "$BUILD_DIR/bin" $(find "$BUILD_DIR/bin" -name "*.class")
else
  DX_JAR="/usr/share/java/com.android.dx.jar"
  if [ ! -f "$DX_JAR" ]; then
    DX_JAR="/usr/share/java/dx.jar"
  fi
  java -jar "$DX_JAR" --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/bin"
fi

# 12. Package initial APK with aapt including raw assets (-A)
echo "-> Packaging APK resources and assets with aapt..."
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/bin/Nexora.unaligned.apk"

# 13. Add classes.dex into unaligned APK
echo "-> Adding classes.dex to APK archive..."
cd "$BUILD_DIR/bin"
aapt add "Nexora.unaligned.apk" "classes.dex"
cd /app/applet

# 14. Zipalign APK (4-byte alignment)
echo "-> Running zipalign..."
zipalign -v -p 4 "$BUILD_DIR/bin/Nexora.unaligned.apk" "$BUILD_DIR/bin/Nexora.aligned.apk"

# 15. Create Keystore and Sign APK with v1, v2, v3
echo "-> Signing APK with apksigner..."
KEYSTORE="$BUILD_DIR/release.keystore"
keytool -genkeypair -v -keystore "$KEYSTORE" \
    -alias nexora \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass nexora2026 \
    -keypass nexora2026 \
    -dname "CN=Nexora, OU=Production, O=Nexora Sanctuary, L=Global, ST=Earth, C=US"

apksigner sign --ks "$KEYSTORE" \
    --ks-pass pass:nexora2026 \
    --key-pass pass:nexora2026 \
    --out "$PUBLIC_DIR/download/Nexora.apk" \
    "$BUILD_DIR/bin/Nexora.aligned.apk"

# 16. Verify signed APK
echo "-> Verifying signed APK..."
apksigner verify -v "$PUBLIC_DIR/download/Nexora.apk"

# 17. Build & Sign Google Play Android App Bundle (Nexora.aab) if aapt2 & bundletool are available
if command -v aapt2 >/dev/null 2>&1; then
  echo "-> Building Google Play Android App Bundle (Nexora.aab)..."
  AAB_WORK="$BUILD_DIR/aab_work"
  mkdir -p "$AAB_WORK/compiled_res" "$AAB_WORK/base/dex" "$AAB_WORK/base/manifest"
  aapt2 compile --dir "$BUILD_DIR/res" -o "$AAB_WORK/compiled_res/resources.zip"
  aapt2 link --proto-format \
      -o "$AAB_WORK/proto.apk" \
      -I "$ANDROID_JAR" \
      --manifest "$BUILD_DIR/AndroidManifest.xml" \
      -R "$AAB_WORK/compiled_res/resources.zip" \
      --auto-add-overlay
  cd "$AAB_WORK/base"
  jar xf "$AAB_WORK/proto.apk"
  mv AndroidManifest.xml manifest/AndroidManifest.xml
  cp "$BUILD_DIR/bin/classes.dex" dex/classes.dex
  cp -r "$BUILD_DIR/assets" assets
  jar cfM "$AAB_WORK/base.zip" manifest dex res assets resources.pb
  cd /app/applet
  BUNDLETOOL_CP=$(find /opt/gradle/.gradle/caches/modules-2/files-2.1 -name "*.jar" ! -name "*-android.jar" 2>/dev/null | sort -rV | tr '\n' ':')
  if [ -n "$BUNDLETOOL_CP" ]; then
    rm -f "$PUBLIC_DIR/download/Nexora.aab"
    java -cp "$BUNDLETOOL_CP" com.android.tools.build.bundletool.BundleToolMain build-bundle \
        --modules="$AAB_WORK/base.zip" \
        --output="$PUBLIC_DIR/download/Nexora.aab"
    jarsigner -keystore "$KEYSTORE" \
        -storepass nexora2026 \
        -keypass nexora2026 \
        "$PUBLIC_DIR/download/Nexora.aab" \
        nexora
    java -cp "$BUNDLETOOL_CP" com.android.tools.build.bundletool.BundleToolMain validate \
        --bundle="$PUBLIC_DIR/download/Nexora.aab"
    ls -lh "$PUBLIC_DIR/download/Nexora.aab"
  fi
fi

# 18. Report APK details
ls -lh "$PUBLIC_DIR/download/Nexora.apk"
echo "=== Nexora Standalone Multi-MB Android APK & AAB v2.0.0 Successfully Built! ==="
