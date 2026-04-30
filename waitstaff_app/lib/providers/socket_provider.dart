import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import '../services/socket_service.dart';
import 'auth_provider.dart';

// Socket Service Provider
final socketServiceProvider = Provider<SocketService>((ref) {
  final socketService = SocketService();
  
  // Setup Socket listeners when auth is available
  ref.listen<AuthState>(authProvider, (previous, next) {
    if (next.isLoggedIn && !socketService.isConnected) {
      socketService.connect();
    } else if (!next.isLoggedIn && socketService.isConnected) {
      socketService.disconnect();
    }
  });

  return socketService;
});

// Socket Connection State
class SocketConnectionState {
  final bool isConnected;
  final String? error;

  const SocketConnectionState({
    this.isConnected = false,
    this.error,
  });

  SocketConnectionState copyWith({
    bool? isConnected,
    String? error,
  }) {
    return SocketConnectionState(
      isConnected: isConnected ?? this.isConnected,
      error: error ?? this.error,
    );
  }
}

// Socket Connection Notifier
class SocketConnectionNotifier extends StateNotifier<SocketConnectionState> {
  final SocketService _socketService;

  SocketConnectionNotifier(this._socketService) : super(const SocketConnectionState()) {
    _setupListeners();
  }

  void _setupListeners() {
    _socketService.onConnected(() {
      state = state.copyWith(isConnected: true, error: null);
    });

    _socketService.onDisconnected(() {
      state = state.copyWith(isConnected: false);
    });

    _socketService.onError((error) {
      state = state.copyWith(error: error.toString());
    });
  }

  void connect() {
    _socketService.connect();
  }

  void disconnect() {
    _socketService.disconnect();
  }

  void reconnect() {
    _socketService.reconnect();
  }
}

// Socket Connection Provider
final socketConnectionProvider =
    StateNotifierProvider<SocketConnectionNotifier, SocketConnectionState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return SocketConnectionNotifier(socketService);
});

// Real-time Orders Stream
final realtimeOrdersProvider = StreamProvider<Order?>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  
  // Create a stream that emits orders when they are updated
  return Stream.value(null).asBroadcastStream();
});

// Order Events Stream
final orderEventsStreamProvider = StreamProvider<Order?>((ref) async* {
  final socketService = ref.watch(socketServiceProvider);

  // Create stream controllers for different events
  final eventStream = Stream.fromIterable([]);

  // This is a placeholder - in production you'd use actual stream implementation
  yield* eventStream;
});

// Real-time order update listener helper
extension SocketListener on WidgetRef {
  void listenToOrderUpdates(Function(Order) onOrderUpdate) {
    final socketService = watch(socketServiceProvider);
    socketService.onOrderUpdated(onOrderUpdate);
  }

  void listenToOrderCreated(Function(Order) onOrderCreated) {
    final socketService = watch(socketServiceProvider);
    socketService.onOrderCreated(onOrderCreated);
  }

  void listenToOrderCompleted(Function(Order) onOrderCompleted) {
    final socketService = watch(socketServiceProvider);
    socketService.onOrderCompleted(onOrderCompleted);
  }
}
