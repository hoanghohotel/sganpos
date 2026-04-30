# Android & iOS Build Setup - Complete Summary

Complete build configuration for the CàPhê POS Waitstaff Flutter application.

## Overview

The Flutter application has been fully configured for building on both Android and iOS platforms with:
- ✅ Native configuration files for both platforms
- ✅ Automated build scripts (bash and batch)
- ✅ CI/CD configuration (GitHub Actions)
- ✅ Comprehensive build documentation
- ✅ Signing and distribution setup
- ✅ Deployment guides

## What's Included

### Android Configuration
```
waitstaff_app/android/
├── app/
│   ├── build.gradle              ← Gradle configuration
│   └── src/main/
│       └── AndroidManifest.xml   ← App permissions & settings
├── build.gradle                  ← Root Gradle config
├── gradle.properties             ← Gradle JVM settings
└── key.properties.example        ← Signing template
```

### iOS Configuration
```
waitstaff_app/ios/
├── Podfile                       ← CocoaPods dependencies
└── Runner/
    └── Info.plist               ← iOS app configuration
```

### Build Automation
```
waitstaff_app/scripts/
├── build.sh                      ← macOS/Linux build script
└── build.bat                     ← Windows build script

.github/workflows/
└── build.yml                     ← GitHub Actions CI/CD
```

### Documentation
```
waitstaff_app/
├── BUILD_GUIDE.md               ← Complete build instructions
├── ARCHITECTURE.md              ← Technical architecture
├── README.md                    ← Feature documentation
└── QUICK_START.md              ← 5-minute quick start

Project root:
├── DEPLOYMENT_GUIDE.md          ← Play Store & App Store
├── BUILD_REFERENCE.md           ← Quick command reference
└── ANDROID_IOS_BUILD_SETUP.md   ← This file
```

## Quick Start (5 Minutes)

### 1. Install Flutter

```bash
# Visit https://flutter.dev/docs/get-started/install
# Follow platform-specific instructions

# Verify
flutter --version
flutter doctor
```

### 2. Install Dependencies

```bash
cd waitstaff_app
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Build APK (Android)

```bash
# Release APK
flutter build apk --release --target-platform android-arm64 --split-per-abi

# Or use script (macOS/Linux)
chmod +x scripts/build.sh
./scripts/build.sh android
```

### 4. Build IPA (iOS - macOS only)

```bash
cd ios
pod install --repo-update
cd ..

flutter build ipa --release --export-method app-store

# Or use script
./scripts/build.sh ios-ipa
```

## Build Commands Reference

### Android

```bash
# Debug APK
flutter build apk --debug

# Release APK (split by architecture)
flutter build apk --release --target-platform android-arm64 --split-per-abi

# App Bundle (Google Play Store)
flutter build appbundle --release

# Using build script
./scripts/build.sh android        # APK
./scripts/build.sh android-aab    # App Bundle
```

### iOS

```bash
# Debug (no code signing)
flutter build ios --debug --no-codesign

# Release (no code signing)
flutter build ios --release --no-codesign

# IPA (App Store distribution)
flutter build ipa --release --export-method app-store

# Using build script
./scripts/build.sh ios            # App
./scripts/build.sh ios-ipa        # IPA
```

## Platform-Specific Configuration

### Android

**Manifest Permissions:**
- ✓ INTERNET - For API and Socket.IO
- ✓ ACCESS_NETWORK_STATE - Network detection
- ✓ CHANGE_NETWORK_STATE - Network state changes

**Gradle Settings:**
- Min SDK: 21 (Android 5.0+)
- Target SDK: 34 (Android 14+)
- Kotlin: 1.7.10

**Key Configuration Files:**
- `android/app/build.gradle` - App-level build configuration
- `android/build.gradle` - Project-level build configuration
- `android/gradle.properties` - Gradle JVM settings
- `android/app/src/main/AndroidManifest.xml` - App manifest

### iOS

**Requirements:**
- Min iOS: 11.0
- Deployment Target: 11.0+
- Xcode: 13.0+

**Network Configuration:**
- ✓ Network permissions for Socket.IO
- ✓ Allow insecure connections to localhost (development)
- ✓ Bonjour services configuration

**Key Configuration Files:**
- `ios/Podfile` - CocoaPods dependencies
- `ios/Runner/Info.plist` - App configuration and permissions

## Environment Setup by OS

### macOS

```bash
# Install Flutter
brew install flutter

# Install Xcode
xcode-select --install

# Install Cocoapods
sudo gem install cocoapods

# Verify
flutter doctor
```

### Windows

1. Download Flutter from https://flutter.dev
2. Extract to C:\flutter
3. Add C:\flutter\bin to PATH
4. Download Android Studio
5. Run `flutter doctor` to install Android SDK

### Linux

```bash
# Download Flutter
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
export PATH="$PATH:$HOME/flutter/bin"

# Install dependencies
sudo apt-get install clang cmake git ninja-build pkg-config
sudo apt-get install libgtk-3-dev libstdc++-12-dev

# Verify
flutter doctor
```

## Building for Distribution

### Google Play Store

1. Create keystore:
```bash
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -storetype JKS -keyalg RSA -keysize 2048 \
  -validity 10950 -alias upload
```

2. Configure signing:
```bash
# Create android/key.properties with keystore details
cp android/key.properties.example android/key.properties
# Edit with your keystore password and path
```

3. Build App Bundle:
```bash
flutter build appbundle --release
```

4. Upload to Play Console at https://play.google.com/console

### Apple App Store

1. Enroll in Apple Developer Program ($99/year)

2. Create App in App Store Connect:
   https://appstoreconnect.apple.com

3. Configure code signing in Xcode:
   - Select Team
   - Configure provisioning profile

4. Build IPA:
```bash
flutter build ipa --release --export-method app-store
```

5. Upload using Transporter or Xcode Organizer

## CI/CD Setup (GitHub Actions)

Automated builds configured in `.github/workflows/build.yml`

Triggers on:
- Push to main/develop branches
- Pull requests to main/develop

Actions:
- ✅ Builds Android APK and App Bundle
- ✅ Builds iOS IPA (on macOS runner)
- ✅ Uploads artifacts for download

To enable:
1. Push to GitHub
2. Go to Actions tab
3. GitHub Actions will automatically run builds

## Troubleshooting

### Common Issues

**Flutter not found**
```bash
flutter --version
# If error, add Flutter to PATH
export PATH="$PATH:~/flutter/bin"  # macOS/Linux
setx PATH "%PATH%;C:\flutter\bin"   # Windows
```

**Pod install fails (iOS)**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

**Gradle build fails (Android)**
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk --release
```

**Socket.IO connection issues**
- Update `API_URL` and `SOCKET_URL` in `lib/config/app_config.dart`
- Ensure backend server is running
- Check firewall settings

### Getting Help

1. Check `flutter doctor -v` output
2. Read BUILD_GUIDE.md for detailed instructions
3. Check GitHub Actions logs for CI/CD issues
4. Review error messages in Xcode or Android Studio

## File Structure Summary

```
waitstaff_app/
├── android/                      # Android native code
│   ├── app/build.gradle         # App build config
│   ├── build.gradle             # Project config
│   ├── gradle.properties        # Gradle settings
│   ├── key.properties.example   # Signing template
│   └── app/src/main/
│       └── AndroidManifest.xml  # App manifest
│
├── ios/                          # iOS native code
│   ├── Podfile                  # CocoaPods dependencies
│   ├── Runner/Info.plist        # App configuration
│   └── Runner/                  # iOS app files
│
├── lib/                          # Dart source code
│   ├── config/                  # App configuration
│   ├── models/                  # Data models
│   ├── services/                # API & Socket services
│   ├── repositories/            # Data repositories
│   ├── providers/               # Riverpod state management
│   ├── screens/                 # UI screens
│   ├── theme/                   # App theme
│   └── main.dart                # App entry point
│
├── scripts/                      # Build automation
│   ├── build.sh                 # macOS/Linux build script
│   └── build.bat                # Windows batch script
│
├── .github/workflows/
│   └── build.yml                # GitHub Actions CI/CD
│
├── pubspec.yaml                 # Flutter dependencies
├── BUILD_GUIDE.md               # Complete build guide
├── ARCHITECTURE.md              # Technical documentation
├── README.md                    # Feature guide
├── QUICK_START.md              # Quick reference
└── .gitignore                  # Git ignore rules

Root:
├── DEPLOYMENT_GUIDE.md         # App Store & Play Store deployment
├── BUILD_REFERENCE.md          # Command reference card
└── ANDROID_IOS_BUILD_SETUP.md  # This file
```

## Next Steps

1. **Install Flutter** - Follow BUILD_GUIDE.md step 1
2. **Test Local Build** - Run `flutter build apk --debug` or `flutter build ios --debug --no-codesign`
3. **Configure Signing** - Set up keystore for Android or provisioning profile for iOS
4. **Deploy to Stores** - Follow DEPLOYMENT_GUIDE.md
5. **Monitor Release** - Check Google Play Console or App Store Connect

## Documentation Map

- **Quick Start**: QUICK_START.md (5 minutes)
- **Build Instructions**: BUILD_GUIDE.md (30 minutes)
- **Deployment**: DEPLOYMENT_GUIDE.md (45 minutes)
- **Command Reference**: BUILD_REFERENCE.md (2 minutes)
- **Architecture**: waitstaff_app/ARCHITECTURE.md
- **Features**: waitstaff_app/README.md

## Support Resources

- Flutter Documentation: https://flutter.dev/docs
- Android Documentation: https://developer.android.com/docs
- iOS Documentation: https://developer.apple.com/documentation
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

## Summary

You now have a complete build setup for Android and iOS with:
- ✅ Native platform configurations
- ✅ Automated build scripts
- ✅ CI/CD pipeline
- ✅ Comprehensive documentation
- ✅ Distribution guides
- ✅ Troubleshooting help

Ready to build and distribute your waitstaff application! 🚀
