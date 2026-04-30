import 'package:logger/logger.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/app_config.dart';
import '../models/order_model.dart';

typedef OrderCallback = void Function(Order order);
typedef ConnectionCallback = void Function();
typedef ErrorCallback = void Function(dynamic error);

class SocketService {
  late IO.Socket _socket;
  final Logger _logger = Logger();

  // Callbacks
  final List<OrderCallback> _orderCreatedCallbacks = [];
  final List<OrderCallback> _orderUpdatedCallbacks = [];
  final List<OrderCallback> _orderCancelledCallbacks = [];
  final List<OrderCallback> _orderCompletedCallbacks = [];
  final List<ConnectionCallback> _connectedCallbacks = [];
  final List<ConnectionCallback> _disconnectedCallbacks = [];
  final List<ErrorCallback> _errorCallbacks = [];

  bool get isConnected => _socket.connected;

  SocketService() {
    _initializeSocket();
  }

  void _initializeSocket() {
    _socket = IO.io(
      AppConfig.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setReconnectionDelay(AppConfig.socketReconnectDelay)
          .setReconnectionDelayMax(AppConfig.socketReconnectDelayMax)
          .enableReconnection()
          .setExtraHeaders({'content-type': 'application/json'})
          .build(),
    );

    _setupListeners();
  }

  void _setupListeners() {
    _socket.onConnect((_) {
      _logger.i('Socket connected');
      _notifyConnected();
    });

    _socket.onDisconnect((_) {
      _logger.i('Socket disconnected');
      _notifyDisconnected();
    });

    _socket.on('error', (error) {
      _logger.e('Socket error: $error');
      _notifyError(error);
    });

    // Order events
    _socket.on(AppConfig.socketOrderCreated, (data) {
      _logger.i('Order created event received');
      try {
        final order = Order.fromJson(data as Map<String, dynamic>);
        _notifyOrderCreated(order);
      } catch (e) {
        _logger.e('Error parsing order created event: $e');
      }
    });

    _socket.on(AppConfig.socketOrderUpdated, (data) {
      _logger.i('Order updated event received');
      try {
        final order = Order.fromJson(data as Map<String, dynamic>);
        _notifyOrderUpdated(order);
      } catch (e) {
        _logger.e('Error parsing order updated event: $e');
      }
    });

    _socket.on(AppConfig.socketOrderCancelled, (data) {
      _logger.i('Order cancelled event received');
      try {
        final order = Order.fromJson(data as Map<String, dynamic>);
        _notifyOrderCancelled(order);
      } catch (e) {
        _logger.e('Error parsing order cancelled event: $e');
      }
    });

    _socket.on(AppConfig.socketOrderCompleted, (data) {
      _logger.i('Order completed event received');
      try {
        final order = Order.fromJson(data as Map<String, dynamic>);
        _notifyOrderCompleted(order);
      } catch (e) {
        _logger.e('Error parsing order completed event: $e');
      }
    });
  }

  void connect({String? token}) {
    if (!_socket.connected) {
      if (token != null) {
        _socket.io.options?['extraHeaders'] = {'Authorization': 'Bearer $token'};
      }
      _socket.connect();
      _logger.i('Connecting socket...');
    }
  }

  void disconnect() {
    if (_socket.connected) {
      _socket.disconnect();
      _logger.i('Disconnecting socket...');
    }
  }

  void reconnect() {
    disconnect();
    Future.delayed(const Duration(milliseconds: 500), () {
      connect();
    });
  }

  // Event registration methods
  void onOrderCreated(OrderCallback callback) {
    _orderCreatedCallbacks.add(callback);
  }

  void onOrderUpdated(OrderCallback callback) {
    _orderUpdatedCallbacks.add(callback);
  }

  void onOrderCancelled(OrderCallback callback) {
    _orderCancelledCallbacks.add(callback);
  }

  void onOrderCompleted(OrderCallback callback) {
    _orderCompletedCallbacks.add(callback);
  }

  void onConnected(ConnectionCallback callback) {
    _connectedCallbacks.add(callback);
  }

  void onDisconnected(ConnectionCallback callback) {
    _disconnectedCallbacks.add(callback);
  }

  void onError(ErrorCallback callback) {
    _errorCallbacks.add(callback);
  }

  // Notification methods
  void _notifyOrderCreated(Order order) {
    for (final callback in _orderCreatedCallbacks) {
      callback(order);
    }
  }

  void _notifyOrderUpdated(Order order) {
    for (final callback in _orderUpdatedCallbacks) {
      callback(order);
    }
  }

  void _notifyOrderCancelled(Order order) {
    for (final callback in _orderCancelledCallbacks) {
      callback(order);
    }
  }

  void _notifyOrderCompleted(Order order) {
    for (final callback in _orderCompletedCallbacks) {
      callback(order);
    }
  }

  void _notifyConnected() {
    for (final callback in _connectedCallbacks) {
      callback();
    }
  }

  void _notifyDisconnected() {
    for (final callback in _disconnectedCallbacks) {
      callback();
    }
  }

  void _notifyError(dynamic error) {
    for (final callback in _errorCallbacks) {
      callback(error);
    }
  }

  void dispose() {
    _socket.dispose();
  }
}
