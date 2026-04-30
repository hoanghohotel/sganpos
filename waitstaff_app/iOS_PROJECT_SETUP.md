# iOS Project Setup Guide

## Problem
The iOS project files (`.xcodeproj`) are missing from the `ios/` directory.

## Solution
Flutter can automatically generate the missing iOS project files. Follow these steps:

### Quick Fix (Recommended)

**Option 1: Regenerate iOS Files**
```bash
cd waitstaff_app
rm -rf ios/
flutter create --platforms=ios .
```

This will recreate the entire `ios/` directory with proper project structure.

### Alternative: Create iOS Project Manually

If the above doesn't work, you can create the iOS project structure manually:

**Step 1: Clean Flutter Cache**
```bash
flutter clean
flutter pub get
```

**Step 2: Generate iOS Project**
```bash
cd ios/
pod install
cd ..
```

**Step 3: Verify Project Structure**
```bash
ls -la ios/
# Should see: Runner.xcodeproj, Podfile, Runner/, etc.
```

## Expected iOS Directory Structure

```
ios/
├── Runner.xcodeproj/          # Xcode project (generated)
│   ├── project.pbxproj        # Project configuration
│   ├── xcshareddata/
│   │   └── xcschemes/
│   │       └── Runner.xcscheme
│   └── xcuserdata/
├── Runner/                    # App folder
│   ├── Assets.xcassets/
│   ├── Base.lproj/
│   ├── GeneratedPluginRegistrant.h
│   ├── GeneratedPluginRegistrant.m
│   ├── Info.plist
│   ├── LaunchScreen.storyboard
│   └── Main.storyboard
├── Podfile                    # CocoaPods configuration
├── Podfile.lock               # CocoaPods lock file (generated)
└── Pods/                      # CocoaPods dependencies (generated)
```

## Troubleshooting

### 1. Flutter not found
```bash
which flutter
# If not found, add Flutter to PATH:
export PATH="$PATH:/path/to/flutter/bin"
```

### 2. Xcode not installed (macOS only)
```bash
xcode-select --install
```

### 3. CocoaPods issues
```bash
sudo gem install cocoapods
pod setup
pod install --repo-update
```

### 4. Pod install fails
```bash
cd ios/
rm Podfile.lock
pod deintegrate
pod install
```

## Build After Setup

Once iOS files are generated:

```bash
# Debug build
flutter build ios --debug --no-codesign

# Release build
flutter build ios --release
```

## Next Steps

1. Ensure Flutter is properly installed: `flutter doctor`
2. Run the iOS file generation command above
3. Verify the directory structure matches the expected layout
4. Try building again: `flutter build ios --release`

## Additional Resources

- [Flutter iOS Setup Documentation](https://flutter.dev/docs/get-started/install/macos)
- [Xcode Build Documentation](https://developer.apple.com/documentation/xcode)
- [CocoaPods Documentation](https://cocoapods.org)

---

**Note**: iOS development requires macOS and Xcode. Windows and Linux users cannot build iOS apps.
