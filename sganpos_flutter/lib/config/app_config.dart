import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static late SharedPreferences _prefs;

  /// Base URL for API - can be configured per environment
  static String apiUrl = 'https://sganpos.com';
  
  /// For development, use localhost
  static String apiUrlDev = 'http://localhost:3000';
  
  /// Current API URL (dev or prod)
  static String get currentApiUrl {
    // Change this to apiUrlDev for development
    return apiUrl;
  }

  static const String apiVersion = '1.0.0';
  
  /// Socket.io connection settings
  static const int socketReconnectionDelay = 1000;
  static const int socketReconnectionDelayMax = 5000;
  static const int socketReconnectionAttempts = 5;

  /// Token storage keys
  static const String tokenKey = 'jwt_token';
  static const String userDataKey = 'user_data';
  static const String tenantIdKey = 'tenant_id';

  /// Initialize app configuration
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Get SharedPreferences instance
  static SharedPreferences get prefs => _prefs;

  /// Check if running in debug mode
  static const bool isDebug = true; // Set to false for production
}
