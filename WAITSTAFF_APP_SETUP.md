# CàPhê POS Waitstaff Mobile App - Setup Guide

This guide will help you set up and run the Flutter waitstaff mobile application for the CàPhê POS system.

## Prerequisites

Before starting, ensure you have:
- **Flutter SDK** (version 3.0+) - [Install Flutter](https://flutter.dev/docs/get-started/install)
- **Dart SDK** (included with Flutter)
- **Android Studio** or **Xcode** (for device emulation)
- **Node.js & npm/yarn** (for backend server)
- **MongoDB** (local or Atlas)

## Project Structure

```
sganpos/
├── waitstaff_app/          # Flutter mobile app (NEW)
│   ├── lib/               # Source code
│   ├── pubspec.yaml      # Flutter dependencies
│   ├── README.md         # App documentation
│   └── ...
├── server.ts             # Backend Express server
├── src/                  # Backend source code
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/       # Express middleware
│   └── lib/              # Services (Socket.IO, etc)
└── ...
```

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hoanghohotel/sganpos.git
cd sganpos
```

### 2. Setup Backend Server

The Flutter app requires a running backend server for API and Socket.IO connections.

```bash
# Install dependencies
npm install
# or
yarn install

# Start the server (default port 3001)
npm run dev
# or
yarn dev
```

**Important**: The backend server must be running before starting the Flutter app.

### 3. Setup Flutter App

Navigate to the Flutter app directory:

```bash
cd waitstaff_app
```

#### a. Install Flutter Dependencies

```bash
flutter pub get
```

#### b. Generate Code (Riverpod)

```bash
flutter pub run build_runner build
```

#### c. Configure API URL (Important!)

Edit `lib/config/app_config.dart`:

```dart
// Change these to match your backend server
static const String apiBaseUrl = 'http://localhost:3001';  // Mobile device: use your PC IP
static const String socketUrl = 'http://localhost:3001';   // Mobile device: use your PC IP
```

**For Physical Device Testing:**
- Find your PC's IP address:
  - **Windows**: `ipconfig` → Look for "IPv4 Address"
  - **macOS/Linux**: `ifconfig` → Look for "inet" address

- Replace `localhost` with your IP:
```dart
static const String apiBaseUrl = 'http://192.168.1.100:3001';
static const String socketUrl = 'http://192.168.1.100:3001';
```

### 4. Run the Flutter App

#### On Android Emulator

```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators launch <emulator_name>

# Run app
flutter run
```

#### On iOS Simulator

```bash
# Run app (automatically launches simulator)
flutter run

# Or run in release mode
flutter run --release
```

#### On Physical Device

```bash
# Connect device via USB
# List connected devices
flutter devices

# Run app
flutter run -d <device_id>
```

### 5. Verify Setup

1. **Backend Server**
   - Open http://localhost:3001 in browser
   - Check that server is responding

2. **Flutter App**
   - Login with demo credentials:
     - Email: `staff@example.com`
     - Password: `password123`
   - Navigate through screens:
     - Home → New Order → Select Table → Browse Menu
     - Home → Active Orders → View Order Details
   - Check connection status in app bar

## API Integration

The Flutter app integrates with these backend endpoints:

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/verify
```

### Orders
```
GET /api/orders
GET /api/orders/:id
POST /api/orders
PUT /api/orders/:id/items
PUT /api/orders/:id/status
DELETE /api/orders/:id
```

### Products
```
GET /api/products
GET /api/products?category=:category
```

### Tables
```
GET /api/tables
GET /api/tables/:id
GET /api/tables?status=:status
PUT /api/tables/:id
```

### Real-time (Socket.IO)
```
order:created
order:updated
order:cancelled
order:completed
```

## Database Setup

Make sure MongoDB is running and configured in your backend:

```bash
# If using local MongoDB
mongod

# Or configure MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/caffe_pos
```

## Environment Variables

Create a `.env` file in the backend root:

```env
# Backend Configuration
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/caffe_pos

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Issue: App can't connect to backend

**Solution**:
1. Verify backend server is running: `http://localhost:3001`
2. Check firewall settings allow port 3001
3. On physical device, use your PC IP instead of localhost
4. Check network connectivity between device and PC

### Issue: Socket.IO not connecting

**Solution**:
1. Ensure Socket.IO server is enabled in backend
2. Check WebSocket support in your network
3. Verify app has internet permission in `AndroidManifest.xml` and `Info.plist`
4. Review console logs for connection errors

### Issue: MongoDB connection error

**Solution**:
1. Verify MongoDB is running
2. Check connection string in .env
3. Ensure database user has correct permissions
4. Check MongoDB firewall settings

### Issue: Build errors with Riverpod

**Solution**:
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Issue: Phone can't see localhost

**Solution**:
```bash
# Find your PC's IP address
# Windows
ipconfig

# macOS/Linux
ifconfig

# Update app_config.dart with your IP
static const String apiBaseUrl = 'http://192.168.1.X:3001';
```

## Development Workflow

### Creating New Screens

1. Create screen file in `lib/screens/feature_name/`
2. Use `ConsumerWidget` or `ConsumerStatefulWidget`
3. Add route in `lib/config/router.dart`
4. Import models and providers as needed

### Managing State

Use Riverpod providers in `lib/providers/`:

```dart
final myProvider = StateProvider<String>((ref) => 'initial');

// In widget
final value = ref.watch(myProvider);
ref.read(myProvider.notifier).state = 'new value';
```

### Communicating with API

Use repositories in `lib/repositories/`:

```dart
class MyRepository {
  Future<List<Item>> getItems() async {
    final response = await _apiClient.get('/api/items');
    return (response.data as List).map(...).toList();
  }
}
```

### Real-time Updates

Listen to Socket events:

```dart
final socketService = ref.watch(socketServiceProvider);
socketService.onOrderUpdated((order) {
  // Handle update
});
```

## Testing

### Unit Tests

```bash
flutter test
```

### Integration Tests

```bash
flutter test integration_test/
```

### Manual Testing Checklist

- [ ] Login/Logout works
- [ ] Can select table for new order
- [ ] Can browse menu by category
- [ ] Can add items to cart
- [ ] Can submit order
- [ ] Can view active orders
- [ ] Can view order details
- [ ] Real-time updates work
- [ ] App responds on mobile (< 500ms)
- [ ] Works on both portrait and landscape
- [ ] Works on tablet (≥ 600dp width)

## Building for Release

### Android

```bash
# Build APK
flutter build apk --release

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

### iOS

```bash
# Build IPA
flutter build ios --release
```

## Performance Optimization

### Best Practices

1. **Use const constructors** where possible
2. **Lazy load data** with pagination
3. **Cache API responses** using Riverpod's caching
4. **Optimize images** before adding to app
5. **Use LocalStorage** for temporary data

### Monitoring

- Check console for rebuild warnings
- Use DevTools to profile performance
- Monitor memory usage on low-end devices

## Deployment

### iOS App Store

1. Configure app signing
2. Update version in `pubspec.yaml`
3. Build release IPA
4. Upload via App Store Connect

### Google Play Store

1. Configure app signing (keystore)
2. Update version in `pubspec.yaml`
3. Build release App Bundle
4. Upload to Google Play Console

## Additional Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [GoRouter Documentation](https://pub.dev/packages/go_router)
- [Dio Documentation](https://github.com/flutterchina/dio)
- [Socket.IO Client](https://pub.dev/packages/socket_io_client)

## Support & Issues

1. Check the [Flutter troubleshooting guide](https://flutter.dev/docs/resources/bootstrap-into-dart)
2. Review app README in `waitstaff_app/README.md`
3. Check backend logs for API errors
4. Enable verbose logging: `flutter run -v`

## Next Steps

1. Customize theme colors in `lib/theme/app_theme.dart`
2. Add your company logo/branding
3. Implement additional features from roadmap
4. Set up CI/CD for automated builds
5. Configure analytics and crash reporting

---

**Happy coding! Good luck with your CàPhê POS waitstaff app! ☕**
