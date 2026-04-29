import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import '../models/user.dart';
import '../services/api_client.dart';

class AuthProvider extends ChangeNotifier {
  final _apiClient = ApiClient();
  final _secureStorage = const FlutterSecureStorage();

  User? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  // Getters
  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _token != null && _user != null;

  AuthProvider() {
    _initializeAuth();
  }

  /// Initialize authentication state from secure storage
  Future<void> _initializeAuth() async {
    try {
      _isLoading = true;
      notifyListeners();

      final token = await _secureStorage.read(key: AppConfig.tokenKey);
      final userData = await _secureStorage.read(key: AppConfig.userDataKey);
      final tenantId = await _secureStorage.read(key: AppConfig.tenantIdKey);

      if (token != null && userData != null && tenantId != null) {
        _token = token;
        _user = User.fromJsonString(userData);
        _apiClient.setToken(token);
        _apiClient.setTenantId(tenantId);

        // Verify token is still valid by fetching user info
        try {
          final user = await _apiClient.getCurrentUser();
          _user = user;
          _error = null;
        } catch (e) {
          // Token might be expired, clear auth
          await logout();
        }
      }
    } catch (e) {
      _error = 'Failed to initialize auth: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Login with identifier and password
  Future<bool> login(String identifier, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiClient.login(identifier, password);
      
      _token = response['token'];
      _user = User.fromJson(response['user']);
      
      // Extract tenant ID from user data
      final tenantId = _user?.tenantId ?? 'default';

      // Store securely
      await _secureStorage.write(
        key: AppConfig.tokenKey,
        value: _token!,
      );
      await _secureStorage.write(
        key: AppConfig.userDataKey,
        value: _user!.toJsonString(),
      );
      await _secureStorage.write(
        key: AppConfig.tenantIdKey,
        value: tenantId,
      );

      // Set client auth
      _apiClient.setToken(_token!);
      _apiClient.setTenantId(tenantId);

      return true;
    } catch (e) {
      _error = e.toString();
      _token = null;
      _user = null;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refresh authentication token
  Future<bool> refreshToken() async {
    try {
      final response = await _apiClient.refreshToken();
      
      _token = response['token'];
      _user = User.fromJson(response['user']);

      await _secureStorage.write(
        key: AppConfig.tokenKey,
        value: _token!,
      );
      await _secureStorage.write(
        key: AppConfig.userDataKey,
        value: _user!.toJsonString(),
      );

      _apiClient.setToken(_token!);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  /// Logout and clear auth
  Future<void> logout() async {
    try {
      _token = null;
      _user = null;
      _error = null;

      await _secureStorage.delete(key: AppConfig.tokenKey);
      await _secureStorage.delete(key: AppConfig.userDataKey);
      await _secureStorage.delete(key: AppConfig.tenantIdKey);

      _apiClient.clearAuth();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to logout: $e';
      notifyListeners();
    }
  }

  /// Get API client (for use in other providers)
  ApiClient get apiClient => _apiClient;

  /// Clear error message
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
