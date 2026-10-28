#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "   HomeGuard — Android APK Installer     "
echo "=========================================="
echo ""

echo "Checking connected Android device..."
./adb devices

DEVICE_COUNT=$(./adb devices | grep -v "List of devices" | grep -v "^$" | wc -l | tr -d ' ')

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
echo "📱 Phone detected! Installing HomeGuard.apk..."
./adb install -r ./HomeGuard.apk

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
