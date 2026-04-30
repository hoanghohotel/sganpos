# Flutter Build Reference Card

Quick reference for building Android and iOS apps.

## Prerequisites Check

```bash
# Verify all tools installed
flutter doctor

# Update Flutter
flutter upgrade

# Get dependencies
cd waitstaff_app
flutter pub get
```

## Generate Code

```bash
# Generate code from annotations (required before build)
flutter pub run build_runner build --delete-conflicting-outputs

# Watch mode for development
flutter pub run build_runner watch
```

## Android Builds

### Debug (Development)

```bash
flutter build apk --debug

# Output: build/app/outputs/flutter-apk/app-debug.apk
# Size: ~50-100MB
# Time: 2-3 minutes
```

### Release APK (Google Play Beta/Testing)

```bash
# Split APK (smaller per architecture)
flutter build apk --release --target-platform android-arm64 --split-per-abi

# Output: build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
# Size: ~30-40MB
# Time: 3-4 minutes
```

### Release App Bundle (Google Play Store)

```bash
# Recommended for Play Store (automatic APK optimization)
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
# Size: ~20-25MB
# Time: 3-4 minutes
```

### Signed Build (Production)

1. Ensure `android/key.properties` is configured
2. Run build commands above (automatically signs)
3. Verify signature:
```bash
jarsigner -verify -verbose build/app/outputs/bundle/release/app-release.aab
```

## iOS Builds

### Debug (Development - macOS only)

```bash
flutter build ios --debug --no-codesign

# Output: build/ios/iphoneos/Runner.app
# Time: 5-10 minutes
```

### Release (Ad-hoc/Internal Testing - macOS only)

```bash
# Install dependencies first
cd ios && pod install --repo-update && cd ..

# Build
flutter build ios --release --no-codesign

# Output: build/ios/iphoneos/Runner.app
# Time: 8-12 minutes
```

### IPA (App Store Distribution - macOS only)

```bash
# Install dependencies first
cd ios && pod install --repo-update && cd ..

# Build for App Store
flutter build ipa --release --export-method app-store

# Output: build/ios/ipa/waitstaff_app.ipa
# Size: ~50-70MB
# Time: 10-15 minutes
```

### Code Signing (macOS only)

```bash
# Install provisioning profile and certificate in Xcode first
# Then rebuild with automatic signing enabled
flutter build ipa --release --export-method app-store
```

## Using Build Scripts

### macOS/Linux

```bash
# Make executable
chmod +x scripts/build.sh

# Show all commands
./scripts/build.sh help

# Build Android
./scripts/build.sh android        # APK
./scripts/build.sh android-aab    # App Bundle
./scripts/build.sh all-android    # Both

# Build iOS
./scripts/build.sh ios            # App
./scripts/build.sh ios-ipa        # IPA
./scripts/build.sh all-ios        # Both

# Utilities
./scripts/build.sh check          # Verify setup
./scripts/build.sh clean          # Clean build
```

### Windows

```bash
# Show all commands
scripts\build.bat help

# Build Android
scripts\build.bat android         # APK
scripts\build.bat android-aab     # App Bundle
scripts\build.bat all-android     # Both

# Check setup
scripts\build.bat check
```

## Clean Build

```bash
# Full clean
flutter clean
rm -rf build/
flutter pub get

# Code generation
flutter pub run build_runner build --delete-conflicting-outputs
```

## Common Commands

```bash
# List devices/emulators
flutter devices

# Run on specific device
flutter run -d <device-id>
flutter run -d <device-id> --release

# Profile build (performance testing)
flutter build apk --profile

# Analyze app size
flutter build apk --analyze-size --release

# Check warnings
flutter analyze

# Format code
dart format lib/
```

## Build Output Locations

```
Android:
  Debug APK:        build/app/outputs/flutter-apk/app-debug.apk
  Release APK:      build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
  App Bundle (AAB): build/app/outputs/bundle/release/app-release.aab

iOS:
  App:              build/ios/iphoneos/Runner.app
  IPA:              build/ios/ipa/waitstaff_app.ipa
```

## Troubleshooting Quick Fixes

```bash
# Pod install issues (macOS)
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Gradle cache issues (Android)
cd android
./gradlew clean
cd ..

# Kotlin version mismatch
# Update kotlin_version in android/build.gradle

# Socket.IO connection issues
# Check API_URL in lib/config/app_config.dart
# Ensure backend server is running

# Build timeout
# Increase Gradle timeout:
# org.gradle.jvmargs=-Xmx2048m in android/gradle.properties
```

## Version Numbering

Update in `pubspec.yaml`:
```yaml
version: MAJOR.MINOR.PATCH+BUILD_NUMBER

Examples:
version: 1.0.0+1   # First release
version: 1.0.1+2   # Patch fix
version: 1.1.0+3   # Minor feature
version: 2.0.0+4   # Major version
```

## Performance Tips

```bash
# Profile a build
flutter build apk --profile

# Check app size breakdown
flutter build apk --analyze-size --release

# Enable R8 code shrinking (default: true)
# Set in android/gradle.properties:
# android.enableR8=true

# Split APK for smaller downloads
flutter build apk --release --split-per-abi
```

## Signing Keystore

```bash
# Create keystore
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -storetype JKS -keyalg RSA -keysize 2048 \
  -validity 10950 -alias upload

# List keystore info
keytool -list -v -keystore ~/upload-keystore.jks

# Configure gradle:
# Copy credentials to android/key.properties
```

## Emulator/Simulator

```bash
# Android Emulator
flutter emulators
flutter emulate <emulator-id>
flutter run

# iOS Simulator (macOS)
open -a Simulator
flutter run
```

## Environment Variables

```bash
# Set API URL (optional, defaults to config)
export API_URL=https://your-api.com
export SOCKET_URL=https://your-api.com

# Run with env
flutter run --dart-define=API_URL=https://your-api.com
```

## Resources

- Flutter Docs: https://flutter.dev/docs/deployment
- Build Configuration: https://flutter.dev/docs/testing/build-modes
- Platform-specific Issues: https://flutter.dev/docs/deployment/ios

---

**Last Updated**: 2024
**Flutter Version**: 3.16+
**Dart Version**: 3.0+
