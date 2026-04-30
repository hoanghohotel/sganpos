import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _apiClient;
  final FlutterSecureStorage _secureStorage;
  final Logger _logger = Logger();

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  AuthService({
    required ApiClient apiClient,
    FlutterSecureStorage? secureStorage,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage ?? const FlutterSecureStorage();

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        AppConfig.authLogin,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token'] as String?;
        final user = data['user'] as Map<String, dynamic>?;

        if (token != null && user != null) {
          await _secureStorage.write(key: _tokenKey, value: token);
          await _secureStorage.write(key: _userKey, value: user.toString());
          _apiClient.setAuthToken(token);
          _logger.i('Login successful for ${user['email']}');
          return true;
        }
      }
      return false;
    } catch (e) {
      _logger.e('Login failed: $e');
      rethrow;
    }
  }

  Future<bool> logout() async {
    try {
      await _apiClient.post(AppConfig.authLogout);
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);
      _apiClient.clearAuthToken();
      _logger.i('Logout successful');
      return true;
    } catch (e) {
      _logger.e('Logout failed: $e');
      // Clear token anyway
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);
      _apiClient.clearAuthToken();
      return false;
    }
  }

  Future<bool> verifyToken() async {
    try {
      final token = await _secureStorage.read(key: _tokenKey);
      if (token == null) return false;

      _apiClient.setAuthToken(token);
      final response = await _apiClient.post(AppConfig.authVerify);

      if (response.statusCode == 200) {
        _logger.i('Token verified successfully');
        return true;
      }
      return false;
    } catch (e) {
      _logger.e('Token verification failed: $e');
      await _secureStorage.delete(key: _tokenKey);
      return false;
    }
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  Future<void> initializeAuth() async {
    try {
      final token = await getToken();
      if (token != null) {
        _apiClient.setAuthToken(token);
        _logger.i('Auth initialized with stored token');
      }
    } catch (e) {
      _logger.e('Auth initialization failed: $e');
    }
  }
}
