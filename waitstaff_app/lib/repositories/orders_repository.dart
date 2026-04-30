import 'package:logger/logger.dart';
import '../config/app_config.dart';
import '../models/order_model.dart';
import '../services/api_client.dart';

class OrdersRepository {
  final ApiClient _apiClient;
  final Logger _logger = Logger();

  OrdersRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Order>> getActiveOrders({
    String? tableId,
  }) async {
    try {
      final response = await _apiClient.get(
        AppConfig.ordersEndpoint,
        queryParameters: {
          if (tableId != null) 'tableId': tableId,
          'status': 'pending,confirmed,preparing,ready,served',
        },
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final orders = (data['orders'] as List<dynamic>?)
            ?.map((order) => Order.fromJson(order as Map<String, dynamic>))
            .toList() ?? [];
        _logger.i('Fetched ${orders.length} active orders');
        return orders;
      }
      return [];
    } catch (e) {
      _logger.e('Failed to fetch orders: $e');
      rethrow;
    }
  }

  Future<Order> getOrder(String orderId) async {
    try {
      final response = await _apiClient.get(
        '${AppConfig.ordersEndpoint}/$orderId',
      );

      if (response.statusCode == 200) {
        final order = Order.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Fetched order: $orderId');
        return order;
      }
      throw Exception('Failed to fetch order');
    } catch (e) {
      _logger.e('Failed to fetch order: $e');
      rethrow;
    }
  }

  Future<Order> createOrder({
    required String tableId,
    required String tableNumber,
    required List<OrderItem> items,
    required String staffId,
    required String staffName,
  }) async {
    try {
      final response = await _apiClient.post(
        AppConfig.ordersEndpoint,
        data: {
          'tableId': tableId,
          'tableNumber': tableNumber,
          'items': items.map((item) => item.toJson()).toList(),
          'staffId': staffId,
          'staffName': staffName,
          'status': 'pending',
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final order = Order.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Order created: ${order.id}');
        return order;
      }
      throw Exception('Failed to create order');
    } catch (e) {
      _logger.e('Failed to create order: $e');
      rethrow;
    }
  }

  Future<Order> addItemsToOrder({
    required String orderId,
    required List<OrderItem> items,
  }) async {
    try {
      final response = await _apiClient.put(
        '${AppConfig.ordersEndpoint}/$orderId/items',
        data: {
          'items': items.map((item) => item.toJson()).toList(),
        },
      );

      if (response.statusCode == 200) {
        final order = Order.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Items added to order: $orderId');
        return order;
      }
      throw Exception('Failed to add items to order');
    } catch (e) {
      _logger.e('Failed to add items: $e');
      rethrow;
    }
  }

  Future<Order> updateOrderStatus({
    required String orderId,
    required OrderStatus status,
  }) async {
    try {
      final response = await _apiClient.put(
        '${AppConfig.ordersEndpoint}/$orderId/status',
        data: {
          'status': status.toString().split('.').last,
        },
      );

      if (response.statusCode == 200) {
        final order = Order.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Order status updated: $orderId -> ${status.toString().split('.').last}');
        return order;
      }
      throw Exception('Failed to update order status');
    } catch (e) {
      _logger.e('Failed to update order status: $e');
      rethrow;
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      final response = await _apiClient.delete(
        '${AppConfig.ordersEndpoint}/$orderId',
      );

      if (response.statusCode == 200) {
        _logger.i('Order cancelled: $orderId');
        return true;
      }
      return false;
    } catch (e) {
      _logger.e('Failed to cancel order: $e');
      rethrow;
    }
  }
}
