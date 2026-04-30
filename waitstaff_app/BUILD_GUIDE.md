# Flutter Waitstaff App - Build Guide

Complete guide for building and deploying the CàPhê POS Waitstaff mobile application for Android and iOS platforms.

## Prerequisites

### System Requirements

#### Windows
- Windows 10 or later (x64)
- 4 GB RAM minimum (8 GB recommended)
- 1.5 GB disk space

#### macOS
- macOS 11 (Big Sur) or later
- 4 GB RAM minimum (8 GB recommended)
- Xcode 13.0 or later

#### Linux
- Ubuntu 20.04 LTS or later
- 4 GB RAM minimum (8 GB recommended)

### Required Software

1. **Flutter SDK**
   - Download: https://flutter.dev/docs/get-started/install
   - Version: 3.0 or later
   - Add Flutter to PATH

2. **Android Development**
   - Android SDK (API level 21 or later)
   - Android Studio or Android SDK Command-line Tools
   - Java Development Kit (JDK) 11 or later

3. **iOS Development** (macOS only)
   - Xcode 13.0 or later
   - CocoaPods
   - iOS Deployment Target: 11.0 or later

4. **Git**
   - For version control

## Setup Instructions

### 1. Install Flutter

#### Windows
```bash
# Download Flutter from https://flutter.dev/docs/get-started/install
# Extract to a location (e.g., C:\flutter)
# Add to PATH in Environment Variables

# Verify installation
flutter --version
flutter doctor
```

#### macOS
```bash
# Using Homebrew (recommended)
brew install flutter

# Or download manually
# https://flutter.dev/docs/get-started/install

# Verify installation
flutter --version
flutter doctor
```

#### Linux
```bash
# Download Flutter
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
export PATH="$PATH:~/development/flutter/bin"

# Verify installation
flutter --version
flutter doctor
```

### 2. Install Android SDK

#### Windows
```bash
# Using Android Studio
1. Download Android Studio: https://developer.android.com/studio
2. Run installer
3. Launch Android Studio
4. SDK Manager > SDK Tools > Install required tools
5. Create Android Virtual Device (AVD) for testing

# Using Command Line Tools
# Set ANDROID_SDK_ROOT environment variable
setx ANDROID_SDK_ROOT "C:\Android\sdk"
```

#### macOS
```bash
# Using Homebrew
brew install android-commandlinetools

# Or download from:
# https://developer.android.com/studio

# Set ANDROID_SDK_ROOT
export ANDROID_SDK_ROOT=/Library/Android/sdk
```

#### Linux
```bash
# Download command-line tools from:
# https://developer.android.com/studio

# Extract and set up
cd ~/Android
# Extract tools to cmdline-tools/latest

# Set environment
export ANDROID_SDK_ROOT=$HOME/Android
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
```

### 3. Install Xcode (macOS only)

```bash
# From App Store
# Or from Apple Developer website
# https://developer.apple.com/download/

# Verify installation
xcode-select --install
xcode-select --print-path
```

### 4. Verify Setup

```bash
flutter doctor

# Expected output should show:
# ✓ Flutter installed
# ✓ Android SDK installed
# ✓ iOS toolchain installed (macOS)
# ✓ Connected devices
```

## Building the Application

### Project Structure
```
waitstaff_app/
├── android/              # Android native code and configuration
├── ios/                  # iOS native code and configuration
├── lib/                  # Dart source code
├── scripts/              # Build and deployment scripts
├── pubspec.yaml          # Flutter dependencies
├── BUILD_GUIDE.md        # This file
└── README.md             # Project documentation
```

### Get Dependencies

```bash
cd waitstaff_app
flutter pub get

# Generate code from annotations
flutter pub run build_runner build --delete-conflicting-outputs
```

### Clean Build

```bash
flutter clean
flutter pub get
```

## Android Build

### Debug APK

```bash
flutter build apk --debug
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

### Release APK

```bash
flutter build apk --release --target-platform android-arm64 --split-per-abi
# Output: build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
```

### Release APK (Universal)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle (Recommended for Play Store)

```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### Using Build Script (Automated)

#### macOS/Linux
```bash
# Make script executable
chmod +x scripts/build.sh

# Build Android APK
./scripts/build.sh android

# Build Android App Bundle
./scripts/build.sh android-aab

# Build both
./scripts/build.sh all-android

# Clean build
./scripts/build.sh clean
```

#### Windows
```bash
# Build Android APK
scripts\build.bat android

# Build Android App Bundle
scripts\build.bat android-aab

# Check setup
scripts\build.bat check
```

## iOS Build

### Prerequisites (macOS)

```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Navigate to iOS directory
cd ios

# Install pods
pod install --repo-update

# Return to project root
cd ..
```

### Debug Build

```bash
flutter build ios --debug --no-codesign
# Output: build/ios/iphoneos/Runner.app
```

### Release Build

```bash
flutter build ios --release --no-codesign
# Output: build/ios/iphoneos/Runner.app
```

### Generate IPA (App Store Distribution)

```bash
flutter build ipa --release --export-method app-store
# Output: build/ios/ipa/waitstaff_app.ipa
```

### Using Build Script (Automated)

```bash
# Make script executable
chmod +x scripts/build.sh

# Build iOS app
./scripts/build.sh ios

# Build iOS IPA
./scripts/build.sh ios-ipa

# Build both
./scripts/build.sh all-ios

# Check setup
./scripts/build.sh check
```

## Signing & Distribution

### Android Signing

#### Create a Keystore

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10950 \
  -alias upload

# Note your password - you'll need it for building
```

#### Configure Signing in Gradle

Create `android/key.properties`:
```properties
storePassword=<password-from-keytool>
keyPassword=<password-from-keytool>
keyAlias=upload
storeFile=<path-to-upload-keystore.jks>
```

#### Build Signed APK

```bash
flutter build apk --release --target-platform android-arm64 --split-per-abi
```

#### Build Signed AAB

```bash
flutter build appbundle --release
```

### iOS Code Signing

#### Configure Signing in Xcode

```bash
# Open iOS project
open ios/Runner.xcworkspace

# In Xcode:
# 1. Select Runner project
# 2. Select Runner target
# 3. Go to Signing & Capabilities
# 4. Select your Team
# 5. Configure Provisioning Profile
```

#### Build for Distribution

```bash
flutter build ipa --release --export-method app-store
```

## Distribution

### Google Play Store

1. Create Google Play Developer account
2. Create app in Play Console
3. Upload signed AAB
4. Fill app information and screenshots
5. Submit for review

```bash
# Upload AAB
# Location: build/app/outputs/bundle/release/app-release.aab
```

### Apple App Store

1. Create Apple Developer account
2. Create app in App Store Connect
3. Generate iOS App ID and Provisioning Profile
4. Upload IPA using Xcode or Transporter

```bash
# Upload IPA
# Location: build/ios/ipa/waitstaff_app.ipa

# Or use Transporter
# Download from App Store Connect
```

### Internal Testing

#### Google Play (Internal Testing Track)
```
1. Open Play Console
2. Select app
3. Testing > Internal testing
4. Upload APK/AAB
5. Share link with testers
```

#### TestFlight (iOS)
```
1. Open App Store Connect
2. Select app
3. TestFlight tab
4. Add testers
5. Upload IPA
6. Send invitations
```

## Testing Before Build

### Test on Device

#### Android
```bash
# Connect Android device via USB
# Enable USB Debugging in Developer Options

flutter devices  # List connected devices

flutter run -v   # Run in debug mode
flutter run --release  # Run release build
```

#### iOS
```bash
# Connect iOS device via USB
# Trust device on phone

flutter devices  # List connected devices

flutter run -v   # Run in debug mode
flutter run --release  # Run release build
```

### Test on Emulator

#### Android Emulator
```bash
# Create virtual device in Android Studio
# Or use command line
flutter emulators

flutter emulate <emulator-id>  # Start emulator

flutter run  # Run app
```

#### iOS Simulator
```bash
# macOS only
open -a Simulator

flutter run  # Run app
```

## Troubleshooting

### Flutter Doctor Issues

```bash
flutter doctor -v  # Verbose output

# Common fixes:
flutter pub get  # Update dependencies
flutter clean  # Clean build
```

### Android Build Errors

```bash
# Gradle cache issues
cd android
./gradlew clean
cd ..

# Kotlin version issues
# Update kotlin_version in android/build.gradle

# NDK version
# Update ndkVersion in android/app/build.gradle
```

### iOS Build Errors

```bash
# CocoaPods issues
cd ios
rm Podfile.lock
pod install --repo-update
cd ..

# Xcode caching
flutter clean

# Provisioning profile
# Check Xcode signing configuration
```

### Network/Socket.IO Issues

Ensure your backend server is accessible:

```bash
# Check server connectivity
curl http://your-server:3000

# Update API_URL in app_config.dart if needed
```

## Build Optimization

### Release Build Options

```bash
# Split APK by architecture (smaller downloads)
flutter build apk --release --split-per-abi

# Build for specific architecture
flutter build apk --release --target-platform android-arm64

# Enable R8/ProGuard (code shrinking)
# Set android.enableR8=true in android/gradle.properties
```

### Performance Tips

1. Use Profile builds for testing performance
   ```bash
   flutter build apk --profile
   ```

2. Enable benchmarking
   ```bash
   flutter run --profile
   ```

3. Check app size
   ```bash
   flutter build apk --analyze-size --release
   ```

## Additional Resources

- Flutter Documentation: https://flutter.dev/docs
- Android Documentation: https://developer.android.com/docs
- iOS Documentation: https://developer.apple.com/documentation
- Socket.IO Flutter: https://pub.dev/packages/socket_io_client
- Riverpod: https://riverpod.dev
- Dio HTTP Client: https://pub.dev/packages/dio

## Support

For issues or questions:
1. Check Flutter Doctor: `flutter doctor -v`
2. Read error messages carefully
3. Search GitHub Issues
4. Check Stack Overflow

## Version Information

- **Flutter Version**: 3.0 or later
- **Dart Version**: 3.0 or later
- **Minimum Android API**: 21
- **Minimum iOS Version**: 11.0
- **Target Android API**: 34+
- **Target iOS Version**: 14.0+
