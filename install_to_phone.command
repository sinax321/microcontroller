#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "   HomeGuard — Android APK Installer     "
echo "=========================================="
echo ""

# 1. Locate adb binary
ADB_BIN=""
if command -v adb >/dev/null 2>&1; then
  ADB_BIN="adb"
elif [ -f "./adb" ]; then
  ADB_BIN="./adb"
elif [ -n "$ANDROID_HOME" ] && [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
  ADB_BIN="$ANDROID_HOME/platform-tools/adb"
elif [ -n "$ANDROID_SDK_ROOT" ] && [ -f "$ANDROID_SDK_ROOT/platform-tools/adb" ]; then
  ADB_BIN="$ANDROID_SDK_ROOT/platform-tools/adb"
elif [ -f "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
  ADB_BIN="$HOME/Library/Android/sdk/platform-tools/adb"
fi

if [ -z "$ADB_BIN" ]; then
  echo "❌ Android Debug Bridge (adb) was not found on your system."
  echo ""
  echo "To install adb on macOS:"
  echo "  1. If you have Homebrew: run 'brew install android-platform-tools'"
  echo "  2. Or install Android Studio (includes platform-tools)"
  echo "  3. Or place an 'adb' binary directly in this directory."
  echo ""
  read -p "Press [Enter] to exit..."
  exit 1
fi

# 2. Locate or build APK
APK_PATH=""
if [ -f "./HomeGuard.apk" ]; then
  APK_PATH="./HomeGuard.apk"
elif [ -f "./android/app/build/outputs/apk/debug/app-debug.apk" ]; then
  APK_PATH="./android/app/build/outputs/apk/debug/app-debug.apk"
elif [ -f "./android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
  APK_PATH="./android/app/build/outputs/apk/release/app-release-unsigned.apk"
fi

if [ -z "$APK_PATH" ]; then
  echo "ℹ️  No pre-built APK found in directory."
  echo "Attempting to build APK with Capacitor & Gradle..."
  CAPACITOR=true npm run build && npx cap sync android
  if [ -f "./android/gradlew" ]; then
    (cd android && ./gradlew assembleDebug)
    if [ -f "./android/app/build/outputs/apk/debug/app-debug.apk" ]; then
      APK_PATH="./android/app/build/outputs/apk/debug/app-debug.apk"
      cp "$APK_PATH" ./HomeGuard.apk
      echo "✅ APK successfully built: ./HomeGuard.apk"
    fi
  fi
fi

if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
  echo "❌ Could not find or build HomeGuard APK."
  echo "Please build the APK first or place HomeGuard.apk in this directory."
  echo ""
  read -p "Press [Enter] to exit..."
  exit 1
fi

echo "Checking connected Android device via: $ADB_BIN"
$ADB_BIN devices

DEVICE_COUNT=$($ADB_BIN devices | grep -v "List of devices" | grep -v "^$" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq 0 ]; then
  echo ""
  echo "⚠️  No Android phone detected!"
  echo ""
  echo "Please check the following on your Android phone:"
  echo "  1. Connect your phone to your Mac using a USB cable."
  echo "  2. In your phone's Settings > Developer options, turn ON 'USB debugging'."
  echo "  3. When your phone screen prompts 'Allow USB debugging?', tap 'Allow'."
  echo ""
  echo "After doing that, run this script again!"
  echo ""
  read -p "Press [Enter] to exit..."
  exit 1
fi

echo ""
echo "📱 Phone detected! Installing $APK_PATH..."
$ADB_BIN install -r "$APK_PATH"

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 SUCCESS! HomeGuard is installed on your phone."
  echo "Open your phone's app drawer to launch HomeGuard!"
  echo ""
else
  echo ""
  echo "❌ Installation failed. If your phone showed a prompt to allow app install from unknown source, approve it and try again."
  echo ""
fi

read -p "Press [Enter] to exit..."
