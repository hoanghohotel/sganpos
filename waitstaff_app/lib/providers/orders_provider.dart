import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../repositories/orders_repository.dart';
import '../services/api_client.dart';

// Orders Repository Provider
final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OrdersRepository(apiClient: apiClient);
});

// Import apiClientProvider
import 'auth_provider.dart';

// Active Orders Provider
final activeOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final repository = ref.watch(ordersRepositoryProvider);
  return repository.getActiveOrders();
});

// Single Order Provider
final orderProvider = FutureProvider.family<Order, String>((ref, orderId) async {
  final repository = ref.watch(ordersRepositoryProvider);
  return repository.getOrder(orderId);
});

// Cart State - for new order being created
class CartItem {
  final String id;
  final Product product;
  int quantity;
  final String? notes;

  CartItem({
    required this.product,
    required this.quantity,
    this.notes,
  }) : id = const Uuid().v4();

  double get subtotal => product.price * quantity;

  CartItem copyWith({
    Product? product,
    int? quantity,
    String? notes,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
    );
  }
}

class CartState {
  final List<CartItem> items;
  final String? selectedTableId;
  final String? selectedTableNumber;
  final bool isLoading;
  final String? error;

  const CartState({
    this.items = const [],
    this.selectedTableId,
    this.selectedTableNumber,
    this.isLoading = false,
    this.error,
  });

  double get total => items.fold(0, (sum, item) => sum + item.subtotal);

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    String? selectedTableId,
    String? selectedTableNumber,
    bool? isLoading,
    String? error,
  }) {
    return CartState(
      items: items ?? this.items,
      selectedTableId: selectedTableId ?? this.selectedTableId,
      selectedTableNumber: selectedTableNumber ?? this.selectedTableNumber,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// Cart Notifier
class CartNotifier extends StateNotifier<CartState> {
  final OrdersRepository _ordersRepository;

  CartNotifier(this._ordersRepository) : super(const CartState());

  void setTable(String tableId, String tableNumber) {
    state = state.copyWith(
      selectedTableId: tableId,
      selectedTableNumber: tableNumber,
    );
  }

  void addItem(Product product, {String? notes}) {
    final existingIndex =
        state.items.indexWhere((item) => item.product.id == product.id);

    if (existingIndex != -1) {
      final updatedItems = [...state.items];
      updatedItems[existingIndex] = updatedItems[existingIndex].copyWith(
        quantity: updatedItems[existingIndex].quantity + 1,
      );
      state = state.copyWith(items: updatedItems);
    } else {
      state = state.copyWith(
        items: [...state.items, CartItem(product: product, quantity: 1, notes: notes)],
      );
    }
  }

  void updateItemQuantity(String itemId, int quantity) {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    final updatedItems = state.items.map((item) {
      if (item.id == itemId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    state = state.copyWith(items: updatedItems);
  }

  void removeItem(String itemId) {
    state = state.copyWith(
      items: state.items.where((item) => item.id != itemId).toList(),
    );
  }

  void clearCart() {
    state = const CartState();
  }

  Future<Order?> submitOrder(String staffId, String staffName) async {
    if (state.items.isEmpty || state.selectedTableId == null) {
      state = state.copyWith(error: 'Invalid order data');
      return null;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final orderItems = state.items
          .map((item) => OrderItem(
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            subtotal: item.subtotal,
            notes: item.notes,
            createdAt: DateTime.now(),
          ))
          .toList();

      final order = await _ordersRepository.createOrder(
        tableId: state.selectedTableId!,
        tableNumber: state.selectedTableNumber!,
        items: orderItems,
        staffId: staffId,
        staffName: staffName,
      );

      state = state.copyWith(isLoading: false);
      clearCart();
      return order;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return null;
    }
  }
}

// Cart Provider
final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  final repository = ref.watch(ordersRepositoryProvider);
  return CartNotifier(repository);
});
