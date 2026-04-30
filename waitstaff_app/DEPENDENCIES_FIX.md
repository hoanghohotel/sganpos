# Flutter Dependencies - Fixed

## Issue Resolved

The previous `pubspec.yaml` contained an incorrect dev dependency: `riverpod_generator_runner` which does not exist on pub.dev.

### What Was Wrong
```yaml
dev_dependencies:
  riverpod_generator_runner: ^2.3.0  # ❌ This package doesn't exist!
```

### What's Now Correct
```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0  # ✅ This is the correct code generation runner
```

## Explanation

- **`build_runner`** is the standard Dart/Flutter code generation tool that runs all code generators, including `riverpod_generator`
- **`riverpod_generator`** (already in dependencies) is the actual Riverpod code generation package that gets invoked by `build_runner`
- The non-existent `riverpod_generator_runner` was a typo/mistake

## Installation Steps

Now you can successfully install dependencies:

```bash
cd waitstaff_app
flutter pub get
```

## Code Generation

After dependencies are installed, run code generation:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

This command:
1. Uses `build_runner` to run the code generator
2. Generates the necessary Riverpod provider files
3. `--delete-conflicting-outputs` cleans up any conflicts from previous runs

## Troubleshooting

If you still get dependency errors:

1. **Clear pub cache**
   ```bash
   flutter pub cache clean
   ```

2. **Get fresh dependencies**
   ```bash
   flutter pub get
   ```

3. **Run code generation**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Full clean rebuild** (if needed)
   ```bash
   flutter clean
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

## Dependencies Summary

### Production Dependencies (main features)
- `riverpod: ^2.4.0` - State management
- `flutter_riverpod: ^2.4.0` - Flutter integration
- `riverpod_generator: ^2.3.0` - Code generation for providers
- `dio: ^5.3.0` - HTTP client
- `socket_io_client: ^2.0.2` - Real-time communication
- `flutter_secure_storage: ^9.0.0` - Secure token storage
- `go_router: ^12.0.0` - Navigation
- `logger: ^2.0.0` - Logging

### Development Dependencies (build tools)
- `build_runner: ^2.4.0` - Code generation runner
- `flutter_lints: ^3.0.0` - Lint rules

## Next Steps

Once dependencies are installed:

```bash
# 1. Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# 2. Run the app
flutter run

# 3. Build for release
flutter build apk --release  # Android
flutter build ipa --release  # iOS
```

---

**Status**: ✅ All dependencies are now correct and resolvable from pub.dev
