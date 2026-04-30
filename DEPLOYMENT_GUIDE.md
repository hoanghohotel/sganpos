# CàPhê POS Waitstaff App - Deployment Guide

Complete guide for deploying the Flutter mobile application to Google Play Store and Apple App Store.

## Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Android Deployment](#android-deployment)
3. [iOS Deployment](#ios-deployment)
4. [Release Management](#release-management)
5. [Post-Deployment](#post-deployment)

## Pre-Deployment Setup

### 1. Build Configuration

Update version numbers in `pubspec.yaml`:
```yaml
version: 1.0.0+1
```

Where:
- `1.0.0` = semantic version (major.minor.patch)
- `1` = build number (Android only, increment each build)

### 2. Environment Configuration

Ensure `app_config.dart` has production API URLs:
```dart
const String apiBaseUrl = 'https://your-production-api.com';
const String socketUrl = 'https://your-production-api.com';
```

### 3. Security Audit Checklist

- [ ] Remove debug logging
- [ ] Verify secure token storage
- [ ] Check API timeout values
- [ ] Verify error message visibility
- [ ] Test offline functionality
- [ ] Check Socket.IO reconnection strategy
- [ ] Verify no hardcoded credentials
- [ ] Check data encryption

### 4. Testing Checklist

- [ ] Test on multiple devices
- [ ] Test on different Android versions (API 21+)
- [ ] Test on different iOS versions (11.0+)
- [ ] Test on tablet devices
- [ ] Test offline mode
- [ ] Test with slow network
- [ ] Test order flow end-to-end
- [ ] Verify real-time updates work

## Android Deployment

### Step 1: Create Google Play Developer Account

1. Visit https://play.google.com/console
2. Create new developer account ($25 one-time fee)
3. Complete account setup with:
   - Business information
   - Payment method
   - Developer identity verification

### Step 2: Create Application in Play Console

1. Create new app
2. Enter app name: "CàPhê POS - Waitstaff"
3. Set default language
4. Select app category: Business
5. Enter contact details

### Step 3: Prepare App Signing

#### Option A: Google Play App Signing (Recommended)

1. Generate keystore:
```bash
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10950 \
  -alias upload
```

2. Configure signing in Android:
```
Copy to android/key.properties:
storePassword=<your-password>
keyPassword=<your-password>
keyAlias=upload
storeFile=<path-to-keystore.jks>
```

3. Build signed App Bundle:
```bash
cd waitstaff_app
flutter build appbundle --release
```

#### Option B: Manual Signing

```bash
cd waitstaff_app
flutter build appbundle --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ~/upload-keystore.jks \
  build/app/outputs/bundle/release/app-release.aab upload
```

### Step 4: Upload to Play Console

1. In Play Console, go to "Release" > "Production"
2. Click "Create new release"
3. Upload App Bundle: `build/app/outputs/bundle/release/app-release.aab`
4. Review app details
5. Add release notes

### Step 5: Complete App Information

#### Content Rating

1. Go to "App content" > "Content rating"
2. Complete questionnaire
3. Receive content rating

#### Pricing & Distribution

1. Set app to free
2. Select target countries
3. Configure pricing (if applicable)

#### Store Listing

1. Add app icon (512x512 px)
2. Add feature graphics (1024x500 px)
3. Add screenshots (minimum 2, recommended 4-8):
   - Login screen
   - Menu screen
   - Order creation
   - Active orders
4. Write short description (80 characters)
5. Write full description (4000 characters max)

Example descriptions:
```
Short: Order management app for CàPhê POS waitstaff

Full:
CàPhê POS Waitstaff is a mobile application designed for 
restaurant and café employees to take orders on the go. 
Features include:

• Quick order entry with menu browsing
• Real-time order synchronization
• Table management
• Order status tracking
• Support for tablets and phones
• Offline mode support
• Secure staff authentication

Perfect for quick-service restaurants, cafes, and bars.
Integrates seamlessly with CàPhê POS management system.
```

#### Permissions

Review required permissions in Play Console:
- Internet access (required for Socket.IO)
- Network state (for connectivity detection)

#### Privacy Policy

Required: Create and link privacy policy
Example: https://www.termsfeed.com/privacy-policy

#### Target API Level

Ensure app targets latest Android API:
- In `android/app/build.gradle`:
```gradle
targetSdkVersion 34
```

### Step 6: Submit for Review

1. Complete all sections (marked with ✓)
2. Ensure app is tested for crashes
3. Click "Review and roll out to production"
4. Confirm rollout

**Review typically takes 2-4 hours**

### Step 7: Monitor Release

1. Watch Play Console dashboard
2. Monitor user reviews
3. Check crash reports in Play Console
4. Monitor app size and performance

## iOS Deployment

### Step 1: Create Apple Developer Account

1. Visit https://developer.apple.com
2. Enroll in Apple Developer Program ($99/year)
3. Complete verification process

### Step 2: Create App in App Store Connect

1. Log in to https://appstoreconnect.apple.com
2. Click "My Apps"
3. Create new app:
   - Platform: iOS
   - Name: "CàPhê POS - Waitstaff"
   - Bundle ID: com.caphepos.waitstaff_app
   - SKU: unique identifier

### Step 3: Configure App Information

#### App Information

- Primary Language: English (or your language)
- Category: Business
- Privacy Policy: [Your privacy policy URL]

#### Rating

1. Go to "App Information" > "Rating"
2. Answer questionnaire
3. Receive age rating

#### General Information

- Version: 1.0
- Copyright: © 2024 Your Company
- License Agreement: Accept terms

### Step 4: Prepare App Store Version

Create signing certificate and provisioning profile:

#### Create Certificate (Xcode)

```bash
# Using Xcode (recommended)
1. Open Xcode
2. Preferences > Accounts > Add Apple ID
3. Manage Certificates > Create Certificate

# Or use command line
security request-smartcard-setup
```

#### Create Provisioning Profile

1. In Apple Developer portal
2. Certificates, IDs & Profiles > Identifiers
3. Create new App ID: com.caphepos.waitstaff_app
4. Create Provisioning Profile for distribution
5. Download and install in Xcode

### Step 5: Configure Code Signing in Xcode

1. Open `ios/Runner.xcworkspace`
2. Select Runner project
3. Select Runner target
4. Go to "Signing & Capabilities"
5. Select your Team
6. Configure provisioning profile

### Step 6: Build IPA

```bash
cd waitstaff_app

# For App Store distribution
flutter build ipa --release --export-method app-store

# Output: build/ios/ipa/waitstaff_app.ipa
```

### Step 7: Upload to App Store

#### Option A: Using Transporter (Recommended)

```bash
# Download from App Store
# https://apps.apple.com/us/app/transporter/id1450874784

# Use Transporter GUI to upload build/ios/ipa/waitstaff_app.ipa
```

#### Option B: Using Xcode

```bash
# In Xcode
1. Window > Organizer
2. Select your build
3. Distribute App
4. App Store Connect > Upload
```

#### Option C: Using Command Line

```bash
xcrun altool --upload-app \
  --file build/ios/ipa/waitstaff_app.ipa \
  --type ios \
  --apple-id your-apple-id@example.com \
  --password app-specific-password
```

### Step 8: Complete App Store Information

#### App Preview and Screenshots

Add minimum 2 screenshots for each device:
- iPhone 6.5" (first screenshot shown in list)
- iPad 12.9"

Screenshots should show:
1. Login screen
2. Menu/Product listing
3. Order creation
4. Active orders
5. Order details

#### Description

```
Short: Order management app for CàPhê POS waitstaff (170 characters)

Full (up to 4000 characters):
CàPhê POS Waitstaff is the ultimate mobile application for 
restaurant and café employees to efficiently take orders on tablets 
and smartphones.

Key Features:
• Intuitive order entry with full menu browsing
• Real-time synchronization with kitchen display system
• Table and customer management
• Live order status tracking
• Optimized for both phones and tablets
• Offline functionality for seamless service
• Secure staff authentication

Perfect for quick-service restaurants, cafes, and bars managing 
multiple locations. Integrates seamlessly with the CàPhê POS 
management system for complete control over your business.

Requires iOS 11.0 or later.
```

#### Keywords

Add relevant keywords (up to 100 characters):
```
cafe, restaurant, pos, order, waitstaff, food, delivery
```

#### Support URL

Link to your support page:
```
https://support.your-company.com/waitstaff
```

#### Privacy Policy

Link to privacy policy (required):
```
https://www.your-company.com/privacy
```

### Step 9: Submit for Review

1. Set build from TestFlight to App Store version
2. Complete all required fields
3. Set app age rating
4. Confirm content guidelines compliance
5. Click "Submit for Review"

**Apple review typically takes 24-48 hours**

### Step 10: Monitor Review Status

1. Check status in App Store Connect
2. Be available for responses if Apple requests information
3. Review is complete when status changes to "Ready for Sale"

## Release Management

### Version Management

Update versions before each release:

**pubspec.yaml:**
```yaml
version: 1.0.0+1  # Update both parts
```

Where:
- First part: semantic version (1.0.0)
- Second part: build number (increment each build)

### Release Notes Template

```
## Version 1.0.0 - Initial Release

### Features
- ✓ User authentication and account management
- ✓ Complete menu browsing with filters
- ✓ Order creation with real-time synchronization
- ✓ Active order tracking with live updates
- ✓ Support for multiple tables
- ✓ Responsive design for phones and tablets
- ✓ Offline order caching

### Bug Fixes
- Improved Socket.IO connection stability
- Fixed order status update delays

### Known Issues
- None

### Improvements
- Optimized app startup time
- Improved memory usage on older devices
```

### Release Checklist

Before every release:
- [ ] Update version number
- [ ] Update changelog
- [ ] Test on real devices
- [ ] Test all flows end-to-end
- [ ] Verify offline mode works
- [ ] Check error handling
- [ ] Review console output for warnings
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tags: `git push --tags`

## Post-Deployment

### Monitoring

#### Google Play Console Dashboard
- Monitor daily active users
- Check crash reports
- Review user ratings
- Track version distribution
- Monitor app size

#### App Store Connect Dashboard
- Check sales and trends
- Monitor reviews
- View crash logs
- Check compatibility issues

### Update Strategy

#### Minor Updates (Bug fixes, UI improvements)
- Can be deployed without review delays
- Submit to both stores for review

#### Major Updates (New features)
- Plan release announcement
- Coordinate with marketing
- Prepare support documentation
- Monitor initial rollout for issues

### Managing Multiple Versions

For new feature releases:
1. Create release branch
2. Test thoroughly
3. Submit to both stores simultaneously
4. Coordinate rollout timing
5. Monitor adoption

## Troubleshooting

### Play Store Upload Issues

**Error: "This Android App Bundle is not signed"**
```bash
# Ensure key.properties is configured
# Rebuild: flutter build appbundle --release
```

**Error: "Version code must be higher"**
```bash
# Increment version in pubspec.yaml
# Increase build number: version: 1.0.0+2
```

### App Store Upload Issues

**Error: "Invalid provisioning profile"**
- Regenerate provisioning profile
- Update signing in Xcode
- Rebuild IPA

**Error: "Missing required icons"**
- Add all required app icons
- Verify sizes and formats

### Review Rejection

Common reasons and solutions:

**Crash on startup**
- Run `flutter doctor -v`
- Test on multiple devices
- Check logs in Xcode/Android Studio

**Performance issues**
- Profile app with DevTools
- Check memory usage
- Optimize Network requests

**Privacy concerns**
- Add privacy policy
- Disclose data collection
- Get user consent for sensitive data

## Support and Resources

- Flutter: https://flutter.dev/docs
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com
- Flutter Releases: https://github.com/flutter/flutter/releases

## Checklist for Production

- [ ] Flutter version 3.16 or later installed
- [ ] Android SDK updated
- [ ] Xcode updated (macOS)
- [ ] App tested on multiple devices
- [ ] All dependencies updated
- [ ] Build optimization enabled
- [ ] Crash reporting configured
- [ ] Analytics implemented
- [ ] Security audit completed
- [ ] Privacy policy created
- [ ] Release notes prepared
- [ ] Team trained on deployment
- [ ] Rollback plan prepared
