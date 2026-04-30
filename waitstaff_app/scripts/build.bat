@echo off
REM CàPhê POS Waitstaff App - Build Script for Windows
REM This script handles building for Android platform on Windows

setlocal enabledelayedexpansion

set APP_NAME=waitstaff_app
set VERSION=1.0.0
set BUILD_DIR=build

:check_flutter
    where flutter >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Flutter is not installed or not in PATH
        echo Please install Flutter from https://flutter.dev/docs/get-started/install
        exit /b 1
    )
    
    echo ================================
    echo Flutter Version
    echo ================================
    flutter --version
    goto check_done

:check_done
    goto check_dependencies

:check_dependencies
    echo.
    echo ================================
    echo Checking Dependencies
    echo ================================
    flutter pub get
    flutter pub run build_runner build --delete-conflicting-outputs
    echo ================================
    echo Dependencies Installed
    echo ================================
    goto main_menu

:main_menu
    if "%1"=="" (
        echo.
        echo Usage: build.bat [command]
        echo.
        echo Commands:
        echo   android         Build Android APK
        echo   android-aab     Build Android App Bundle
        echo   clean           Clean build files
        echo   check           Check Flutter setup
        echo   help            Show this help message
        echo.
        echo Examples:
        echo   build.bat android
        echo   build.bat check
        exit /b 0
    )

    if "%1"=="android" goto build_android
    if "%1"=="android-aab" goto build_android_aab
    if "%1"=="clean" goto clean_build
    if "%1"=="check" goto check_flutter
    if "%1"=="help" goto show_help

    echo Unknown command: %1
    goto show_help

:build_android
    echo.
    echo ================================
    echo Building Android APK
    echo ================================
    flutter build apk --release --target-platform android-arm64 --split-per-abi
    if exist "build\app\outputs\flutter-apk\app-arm64-v8a-release.apk" (
        echo.
        echo Android APK built successfully!
        echo Location: %CD%\build\app\outputs\flutter-apk\app-arm64-v8a-release.apk
    ) else (
        echo ERROR: APK build failed
        exit /b 1
    )
    goto end

:build_android_aab
    echo.
    echo ================================
    echo Building Android App Bundle
    echo ================================
    flutter build appbundle --release --target-platform android-arm64
    if exist "build\app\outputs\bundle\release\app-release.aab" (
        echo.
        echo Android App Bundle built successfully!
        echo Location: %CD%\build\app\outputs\bundle\release\app-release.aab
    ) else (
        echo ERROR: AAB build failed
        exit /b 1
    )
    goto end

:clean_build
    echo.
    echo ================================
    echo Cleaning Build Files
    echo ================================
    flutter clean
    rmdir /s /q build 2>nul
    flutter pub get
    echo Build files cleaned
    goto end

:show_help
    echo.
    echo Usage: build.bat [command]
    echo.
    echo Commands:
    echo   android         Build Android APK
    echo   android-aab     Build Android App Bundle
    echo   clean           Clean build files
    echo   check           Check Flutter setup
    echo   help            Show this help message
    goto end

:end
    exit /b %ERRORLEVEL%
