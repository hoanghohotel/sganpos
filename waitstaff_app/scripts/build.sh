#!/bin/bash

# CàPhê POS Waitstaff App - Build Script
# This script handles building for Android and iOS platforms

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="waitstaff_app"
VERSION="1.0.0"
BUILD_DIR="build"

print_header() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}================================${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

check_flutter() {
    if ! command -v flutter &> /dev/null; then
        print_error "Flutter is not installed. Please install Flutter from https://flutter.dev/docs/get-started/install"
    fi
    
    print_header "Flutter Version"
    flutter --version
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    # Get dependencies
    flutter pub get
    
    # Generate code
    flutter pub run build_runner build --delete-conflicting-outputs
    
    print_header "Dependencies Installed"
}

build_android() {
    print_header "Building Android APK"
    
    flutter build apk \
        --release \
        --target-platform android-arm64 \
        --split-per-abi
    
    APK_PATH="build/app/outputs/flutter-apk/app-arm64-v8a-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo -e "${GREEN}✓ Android APK built successfully${NC}"
        echo -e "Location: ${YELLOW}$(pwd)/$APK_PATH${NC}"
    else
        print_error "APK build failed"
    fi
}

build_android_aab() {
    print_header "Building Android App Bundle (AAB)"
    
    flutter build appbundle \
        --release \
        --target-platform android-arm64
    
    AAB_PATH="build/app/outputs/bundle/release/app-release.aab"
    
    if [ -f "$AAB_PATH" ]; then
        echo -e "${GREEN}✓ Android App Bundle built successfully${NC}"
        echo -e "Location: ${YELLOW}$(pwd)/$AAB_PATH${NC}"
    else
        print_error "AAB build failed"
    fi
}

build_ios() {
    print_header "Building iOS"
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be performed on macOS"
    fi
    
    # Install pods
    cd ios
    pod install --repo-update
    cd ..
    
    flutter build ios \
        --release \
        --no-codesign
    
    IOS_APP="build/ios/iphoneos/Runner.app"
    
    if [ -d "$IOS_APP" ]; then
        echo -e "${GREEN}✓ iOS app built successfully${NC}"
        echo -e "Location: ${YELLOW}$(pwd)/$IOS_APP${NC}"
    else
        print_error "iOS build failed"
    fi
}

build_ios_ipa() {
    print_header "Building iOS IPA"
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be performed on macOS"
    fi
    
    flutter build ipa \
        --release \
        --export-method app-store
    
    IPA_PATH="build/ios/ipa/waitstaff_app.ipa"
    
    if [ -f "$IPA_PATH" ]; then
        echo -e "${GREEN}✓ iOS IPA built successfully${NC}"
        echo -e "Location: ${YELLOW}$(pwd)/$IPA_PATH${NC}"
    else
        print_error "IPA build failed"
    fi
}

clean_build() {
    print_header "Cleaning Build Files"
    
    flutter clean
    rm -rf build/
    flutter pub get
    
    echo -e "${GREEN}✓ Build files cleaned${NC}"
}

show_usage() {
    echo "Usage: ./scripts/build.sh [command]"
    echo ""
    echo "Commands:"
    echo "  android         Build Android APK"
    echo "  android-aab     Build Android App Bundle"
    echo "  ios             Build iOS app (macOS only)"
    echo "  ios-ipa         Build iOS IPA (macOS only)"
    echo "  all-android     Build all Android variants"
    echo "  all-ios         Build all iOS variants"
    echo "  clean           Clean build files"
    echo "  check           Check Flutter setup"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/build.sh android"
    echo "  ./scripts/build.sh ios-ipa"
    echo "  ./scripts/build.sh check"
}

main() {
    local command=${1:-"help"}
    
    case $command in
        android)
            check_flutter
            check_dependencies
            build_android
            ;;
        android-aab)
            check_flutter
            check_dependencies
            build_android_aab
            ;;
        ios)
            check_flutter
            check_dependencies
            build_ios
            ;;
        ios-ipa)
            check_flutter
            check_dependencies
            build_ios_ipa
            ;;
        all-android)
            check_flutter
            check_dependencies
            build_android
            build_android_aab
            ;;
        all-ios)
            check_flutter
            check_dependencies
            build_ios
            build_ios_ipa
            ;;
        clean)
            clean_build
            ;;
        check)
            check_flutter
            check_dependencies
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            echo "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
