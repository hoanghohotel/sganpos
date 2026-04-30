# Troubleshooting Guide - Flutter Build Errors

## Error: "Did not find xcodeproj from /Users/builder/clone/ios"

### Root Cause
The iOS Xcode project files (`.xcodeproj`) are missing from the `ios/` directory. This typically happens when:
- The iOS project was never generated
- The iOS files were deleted or corrupted
- The project was created without iOS support

### Solution

**The Best Fix - Regenerate iOS Project:**

```bash
cd waitstaff_app

# Option 1: Full regeneration (Recommended)
rm -rf ios/
flutter create --platforms=ios .

# Option 2: Fresh dependencies
flutter clean
flutter pub get
flutter create --platforms=ios .
```

**Then verify:**
```bash
ls -la ios/
# You should see: Runner.xcodeproj, Podfile, Runner/, etc.
```

### Alternative: Manual Regeneration

If the automated command doesn't work:

```bash
cd waitstaff_app

# 1. Clean everything
flutter clean
rm -rf build/
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# 2. Get fresh dependencies
flutter pub get

# 3. Regenerate iOS support
flutter create . --platforms=ios

# 4. Install pods
cd ios/
pod install
cd ..

# 5. Try building
flutter build ios --release
```

## Other Common Flutter Build Errors

### 1. Dependencies Not Found

**Error**: `Resolving dependencies... version solving failed`

**Solution**:
```bash
flutter pub get
flutter pub upgrade
flutter pub downgrade  # if upgrade causes issues
```

**For specific package issues**:
```bash
# Check what's wrong
flutter pub cache repair

# Clean and reinstall
flutter clean
flutter pub get
```

### 2. Android Build Failures

**Error**: `Build failed with an exception in build`

**Solution**:
```bash
# Option 1: Clean build
flutter clean
flutter pub get
flutter build apk --release

# Option 2: Reset Gradle
cd android/
./gradlew clean
cd ..
flutter build apk --release

# Option 3: Full reset
flutter clean
rm -rf android/app/build
rm -rf android/build
flutter pub get
flutter build apk --release
```

### 3. CocoaPods Issues (iOS)

**Error**: `Pod install failed` or `No Podfile found`

**Solution**:
```bash
cd ios/
rm Podfile.lock
pod deintegrate
pod install
cd ..
flutter build ios --release
```

### 4. Plugin Registration Issues

**Error**: `GeneratedPluginRegistrant not found`

**Solution**:
```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 5. Gradle Wrapper Issues (Android)

**Error**: `Gradle wrapper failed` or `Gradle not found`

**Solution**:
```bash
cd android/
./gradlew wrapper --gradle-version 7.6
cd ..
flutter clean
flutter pub get
flutter build apk --release
```

## Complete Reset Procedure

If none of the above works, do a complete reset:

```bash
cd waitstaff_app

# 1. Clean all build artifacts
flutter clean
rm -rf build/
rm -rf .dart_tool/
rm -rf pubspec.lock

# 2. Remove platform directories and regenerate
rm -rf android/
rm -rf ios/
flutter create --platforms=android,ios .

# 3. Merge configuration back (if needed)
# Copy pubspec.yaml settings manually if you customized it

# 4. Fresh install
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# 5. Verify
flutter doctor -v

# 6. Try building
flutter build apk --release        # Android
flutter build ios --release        # iOS (macOS only)
```

## Pre-Build Checklist

Before building, verify:

```bash
# 1. Flutter is installed and updated
flutter upgrade

# 2. All dependencies are installed
flutter doctor -v

# 3. No obvious issues
flutter pub get
flutter analyze

# 4. Platform-specific requirements:

# For Android:
# - Android SDK 21+ installed
# - ANDROID_SDK_ROOT set correctly
# - Java JDK 11+ installed

# For iOS (macOS only):
# - Xcode 13.0+ installed
# - CocoaPods installed: sudo gem install cocoapods
# - iOS Deployment Target 11.0+
```

## Quick Fixes by Platform

### Android Quick Fixes
```bash
# Clear Android cache
flutter clean
rm -rf android/app/build
flutter pub get
flutter build apk --release
```

### iOS Quick Fixes
```bash
# Clear iOS cache
flutter clean
rm -rf ios/Pods
rm -rf ios/Podfile.lock
cd ios/ && pod install && cd ..
flutter build ios --release
```

## Environment Variables

Make sure these are set correctly:

```bash
# Check Flutter
flutter --version

# Check Dart
dart --version

# Android (if building APK)
echo $ANDROID_SDK_ROOT
echo $ANDROID_HOME

# iOS (if building IPA)
xcode-select --print-path
```

## Build Command Reference

### Android
```bash
# Debug APK
flutter build apk --debug

# Release APK (split by ABI)
flutter build apk --release --split-per-abi

# App Bundle
flutter build appbundle --release

# Verbose output for debugging
flutter build apk --release -v
```

### iOS (macOS only)
```bash
# Debug (no code signing)
flutter build ios --debug --no-codesign

# Release IPA
flutter build ipa --release

# Verbose output
flutter build ios --release -v
```

## Getting Help

If you still have issues:

1. **Run Flutter Doctor**
   ```bash
   flutter doctor -v
   # This shows all missing dependencies
   ```

2. **Check Logs**
   ```bash
   # Android build logs
   flutter build apk --release -v 2>&1 | tee build.log

   # iOS build logs
   flutter build ios --release -v 2>&1 | tee build.log
   ```

3. **Search for Solutions**
   - GitHub Issues: https://github.com/flutter/flutter/issues
   - Stack Overflow: Tag `flutter`
   - Flutter Discourse: https://discourse.flutter.dev

4. **Contact Support**
   - Flutter Issues: https://github.com/flutter/flutter/issues/new
   - Your Package Issues: Check the package repository

## Notes

- iOS development requires macOS and Xcode
- Windows/Linux users can only build Android APKs
- Use `flutter doctor` to identify missing tools
- Keep Flutter and dependencies updated: `flutter upgrade`
- Clean builds take longer but fix most issues

---

**Last Updated**: 2024
**Flutter Version**: 3.0+
**Status**: Troubleshooting Guide
