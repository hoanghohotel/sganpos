import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user.dart';
import '../models/table.dart';
import '../models/order.dart';

/// API Client for communicating with SGANPOS backend
class ApiClient {
  final http.Client _httpClient;
  String? _token;
  String? _tenantId;

  ApiClient({http.Client? httpClient}) 
    : _httpClient = httpClient ?? http.Client();

  /// Set authentication token
  void setToken(String token) {
    _token = token;
  }

  /// Set tenant ID
  void setTenantId(String tenantId) {
    _tenantId = tenantId;
  }

  /// Get current token
  String? getToken() => _token;

  /// Clear authentication
  void clearAuth() {
    _token = null;
    _tenantId = null;
  }

  /// Build headers with auth token
  Map<String, String> _buildHeaders({bool withAuth = false}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (withAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    if (_tenantId != null) {
      headers['X-Tenant-Id'] = _tenantId!;
    }
    
    return headers;
  }

  /// Handle API errors
  dynamic _handleError(dynamic e) {
    if (e is http.Response) {
      final body = jsonDecode(e.body);
      throw Exception(body['error'] ?? 'API Error: ${e.statusCode}');
    }
    throw Exception('Network error: $e');
  }

  // ============= AUTH ENDPOINTS =============

  /// Login with email/phone and password
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final response = await _httpClient.post(
        Uri.parse('${AppConfig.currentApiUrl}/api/auth/login'),
        headers: _buildHeaders(),
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _token = data['token'];
        return data;
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return {};
  }

  /// Refresh authentication token
  Future<Map<String, dynamic>> refreshToken() async {
    if (_token == null) {
      throw Exception('No token to refresh');
    }

    try {
      final response = await _httpClient.post(
        Uri.parse('${AppConfig.currentApiUrl}/api/auth/refresh'),
        headers: _buildHeaders(withAuth: true),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _token = data['token'];
        return data;
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return {};
  }

  /// Get current user info
  Future<User> getCurrentUser() async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/auth/me'),
        headers: _buildHeaders(withAuth: true),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return User.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return User(id: '', name: '', role: '');
  }

  // ============= TABLE ENDPOINTS =============

  /// Get all tables
  Future<List<TableModel>> getTables() async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/tables'),
        headers: _buildHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => TableModel.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return [];
  }

  /// Get specific table
  Future<TableModel> getTable(String tableId) async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/tables/$tableId'),
        headers: _buildHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return TableModel.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return TableModel(id: '', tenantId: '', name: '', capacity: 0, status: 'EMPTY');
  }

  /// Update table status
  Future<TableModel> updateTable(String tableId, {required String status, String? currentOrderId}) async {
    try {
      final response = await _httpClient.patch(
        Uri.parse('${AppConfig.currentApiUrl}/api/tables/$tableId'),
        headers: _buildHeaders(withAuth: true),
        body: jsonEncode({
          'status': status,
          if (currentOrderId != null) 'currentOrderId': currentOrderId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return TableModel.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return TableModel(id: '', tenantId: '', name: '', capacity: 0, status: 'EMPTY');
  }

  // ============= ORDER ENDPOINTS =============

  /// Get all orders
  Future<List<Order>> getOrders({int page = 1, int limit = 50}) async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/orders?page=$page&limit=$limit'),
        headers: _buildHeaders(withAuth: true),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return [];
  }

  /// Get specific order
  Future<Order> getOrder(String orderId) async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/orders/$orderId'),
        headers: _buildHeaders(withAuth: true),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Order.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return Order(
      id: '', tenantId: '', tableId: '', status: '', paymentStatus: '',
      items: [], subtotal: 0, tax: 0, total: 0, createdAt: DateTime.now(),
    );
  }

  /// Create new order
  Future<Order> createOrder(String tableId, List<Map<String, dynamic>> items) async {
    try {
      final response = await _httpClient.post(
        Uri.parse('${AppConfig.currentApiUrl}/api/orders'),
        headers: _buildHeaders(withAuth: true),
        body: jsonEncode({
          'tableId': tableId,
          'items': items,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Order.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return Order(
      id: '', tenantId: '', tableId: '', status: '', paymentStatus: '',
      items: [], subtotal: 0, tax: 0, total: 0, createdAt: DateTime.now(),
    );
  }

  /// Update order
  Future<Order> updateOrder(
    String orderId, {
    String? status,
    String? paymentStatus,
    String? paymentMethod,
    List<Map<String, dynamic>>? items,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (status != null) body['status'] = status;
      if (paymentStatus != null) body['paymentStatus'] = paymentStatus;
      if (paymentMethod != null) body['paymentMethod'] = paymentMethod;
      if (items != null) body['items'] = items;

      final response = await _httpClient.patch(
        Uri.parse('${AppConfig.currentApiUrl}/api/orders/$orderId'),
        headers: _buildHeaders(withAuth: true),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Order.fromJson(data);
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return Order(
      id: '', tenantId: '', tableId: '', status: '', paymentStatus: '',
      items: [], subtotal: 0, tax: 0, total: 0, createdAt: DateTime.now(),
    );
  }

  // ============= PRODUCT ENDPOINTS =============

  /// Get all products for order creation
  Future<List<Map<String, dynamic>>> getProducts() async {
    try {
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.currentApiUrl}/api/products'),
        headers: _buildHeaders(withAuth: true),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        _handleError(response);
      }
    } catch (e) {
      _handleError(e);
    }
    return [];
  }
}
