# Architecture Documentation

## Overview

The Flutter Waitstaff App follows clean architecture principles with clear separation of concerns across multiple layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│         (Screens, Widgets, Navigation)              │
└────────────────┬──────────────────────────────────┘
                 │ ConsumerWidget
                 ▼
┌─────────────────────────────────────────────────────┐
│              State Management Layer                 │
│           (Riverpod Providers & Notifiers)          │
└────────────────┬──────────────────────────────────┘
                 │ watch, read, notifier
                 ▼
┌─────────────────────────────────────────────────────┐
│               Repository Layer                      │
│     (Orders, Products, Tables Repositories)         │
└────────────────┬──────────────────────────────────┘
                 │ business logic
                 ▼
┌─────────────────────────────────────────────────────┐
│                Services Layer                       │
│   (API Client, Auth, Socket.IO, Storage)            │
└────────────────┬──────────────────────────────────┘
                 │ HTTP, WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│              External Resources                     │
│     (Backend API, MongoDB, Socket.IO Server)        │
└─────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. UI Layer (`screens/`)

Responsible for rendering the user interface and handling user interactions.

**Characteristics**:
- Displays data from providers
- Responds to user actions
- Navigates between screens
- Shows loading and error states

**Key Components**:
- `LoginScreen`: Authentication interface
- `HomeScreen`: Main navigation hub
- `NewOrderScreen`: Order creation with cart
- `ActiveOrdersScreen`: Order list view
- `SelectTableScreen`: Table selection
- `OrderDetailsScreen`: Order information
- `MenuScreen`: Product browsing

**Best Practices**:
- Use `ConsumerWidget` for reactive updates
- Derive data from providers, don't duplicate state
- Handle errors gracefully with UI feedback
- Optimize rebuilds with selective watches

### 2. State Management Layer (`providers/`)

Manages application state using Riverpod.

**Key Providers**:

#### Auth Management
```dart
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>
```
- Manages user login/logout
- Stores authentication state
- Handles token management

#### Orders Management
```dart
final cartProvider = StateNotifierProvider<CartNotifier, CartState>
final activeOrdersProvider = FutureProvider<List<Order>>
final orderProvider = FutureProvider.family<Order, String>
```
- Cart state for new orders
- Active orders list
- Individual order details

#### Products Management
```dart
final productsProvider = FutureProvider<List<Product>>
final categoriesProvider = FutureProvider<List<String>>
final filteredProductsProvider = FutureProvider<List<Product>>
```
- Product catalog
- Category filtering
- Search functionality

#### Socket Management
```dart
final socketConnectionProvider = StateNotifierProvider<SocketConnectionNotifier, SocketConnectionState>
```
- Real-time connection status
- Socket event listeners

**Advantages**:
- Reactive data binding
- Automatic caching with `FutureProvider`
- Family providers for parameterized queries
- Dependency tracking via ref system

### 3. Repository Layer (`repositories/`)

Abstracts data operations and business logic.

**Repositories**:

#### OrdersRepository
```dart
- getActiveOrders()
- getOrder(id)
- createOrder()
- addItemsToOrder()
- updateOrderStatus()
- cancelOrder()
```

#### ProductsRepository
```dart
- getAllProducts()
- getProductsByCategory()
- getCategories()
- groupProductsByCategory()
```

#### TablesRepository
```dart
- getAllTables()
- getTable(id)
- getTablesByStatus()
- updateTableStatus()
```

**Benefits**:
- Decouples UI from data source
- Facilitates testing with mock repositories
- Centralizes business logic
- Easy to switch implementations

### 4. Services Layer (`services/`)

Provides low-level services for API communication and data persistence.

#### ApiClient
```dart
class ApiClient {
  - setAuthToken()
  - get(), post(), put(), delete()
  - Automatic header injection
  - Logging and error handling
}
```

**Features**:
- Dio-based HTTP client
- Automatic token injection
- Request/response logging
- Error handling with retries

#### AuthService
```dart
class AuthService {
  - login()
  - logout()
  - verifyToken()
  - getToken()
  - isLoggedIn()
  - initializeAuth()
}
```

**Features**:
- JWT token management
- Secure storage with Flutter Secure Storage
- Token refresh logic
- Session management

#### SocketService
```dart
class SocketService {
  - connect()
  - disconnect()
  - reconnect()
  - onOrderCreated(), onOrderUpdated(), etc.
}
```

**Features**:
- Socket.IO client wrapper
- Event registration/callbacks
- Automatic reconnection
- Connection status tracking

### 5. Models (`models/`)

Data structures with serialization/deserialization.

```dart
User
  - id, name, email, role
  - toJson(), fromJson()

Product
  - id, name, price, category, isAvailable
  - toJson(), fromJson()

Order
  - id, tableId, items, status, total
  - toJson(), fromJson()
  - statusDisplay()

OrderItem
  - id, productId, quantity, price, notes
  - toJson(), fromJson()

TableData
  - id, tableNumber, status, capacity
  - toJson(), fromJson()
```

## Data Flow Examples

### Login Flow

```
1. LoginScreen
   ↓ user enters credentials
2. ref.read(authProvider.notifier).login(email, password)
   ↓ calls
3. AuthNotifier.login()
   ↓ calls
4. AuthService.login()
   ↓ calls
5. ApiClient.post('/api/auth/login')
   ↓ receives token
6. AuthNotifier updates state
   ↓ AuthState updated
7. LoginScreen rebuilds
   ↓ watches authProvider
8. GoRouter redirects to /home
```

### Create Order Flow

```
1. NewOrderScreen - table selected, items added
   ↓ user clicks submit
2. CartNotifier.submitOrder()
   ↓ calls
3. OrdersRepository.createOrder()
   ↓ calls
4. ApiClient.post('/api/orders')
   ↓ receives Order object
5. SocketService emits order:created event
   ↓ other devices receive update
6. OrdersRepository returns Order
7. CartNotifier clears cart
8. NewOrderScreen navigates back
```

### Real-time Order Update Flow

```
1. Backend updates order status
   ↓ broadcasts via Socket.IO
2. SocketService receives event
   ↓ calls registered callbacks
3. SocketService.onOrderUpdated() callback
   ↓ notifies listeners
4. OrderDetailsScreen watches activeOrdersProvider
   ↓ provider refetches data
5. OrderDetailsScreen rebuilds with new data
   ↓ UI updates automatically
```

## Key Design Patterns

### 1. Repository Pattern
Abstracts data sources, making code testable and flexible.

```dart
interface IOrdersRepository {
  Future<Order> getOrder(String id);
}

class OrdersRepository implements IOrdersRepository {
  Future<Order> getOrder(String id) async {
    // API call
  }
}
```

### 2. Provider Pattern (Riverpod)
Manages state reactively with automatic dependency tracking.

```dart
final userProvider = StateNotifierProvider<UserNotifier, User>
final ordersProvider = FutureProvider<List<Order>>
final filteredOrdersProvider = Provider<List<Order>>
```

### 3. Service Locator Pattern
Provides services through dependency injection via Riverpod.

```dart
final apiClientProvider = Provider<ApiClient>
final authServiceProvider = Provider<AuthService>
```

### 4. Callback Pattern (Socket.IO)
Registers callbacks for async events.

```dart
socketService.onOrderUpdated((order) {
  // Handle order update
});
```

## Testing Strategy

### Unit Tests
Test individual functions and classes.

```dart
test('AuthService.login returns true with valid credentials', () async {
  // Mock API client
  // Call login
  // Assert result
});
```

### Widget Tests
Test individual widgets.

```dart
testWidgets('LoginScreen shows error on failed login', (tester) async {
  // Build widget with test data
  // Trigger error
  // Verify error displayed
});
```

### Integration Tests
Test full user flows.

```dart
testWidgets('User can login and create order', (tester) async {
  // Login
  // Select table
  // Add items
  // Submit order
  // Verify order created
});
```

## Performance Considerations

### 1. Caching
```dart
// Riverpod automatically caches FutureProvider results
final productsProvider = FutureProvider<List<Product>>((ref) async {
  // Result cached automatically
});

// Refresh when needed
ref.refresh(productsProvider);
```

### 2. Lazy Loading
```dart
// Use pagination for large lists
final activeOrdersProvider = FutureProvider.family<List<Order>, int>
  ((ref, page) async {
    return repository.getOrders(page: page);
  });
```

### 3. Image Optimization
```dart
// Use cached_network_image for efficient loading
CachedNetworkImage(
  imageUrl: product.imageUrl,
  cacheManager: CustomCacheManager.instance,
);
```

### 4. Selective Rebuilds
```dart
// Only watch specific providers
final name = ref.watch(userProvider.select((user) => user.name));

// Use AutomaticKeepAliveClientMixin for tab views
class MyScreen extends ConsumerStatefulWidget {
  @override
  void _MyScreenState with AutomaticKeepAliveClientMixin {}
}
```

## Error Handling

### Three-tier approach:

```dart
// 1. Service Layer - Network errors
catch (e) {
  _logger.e('API Error: $e');
  rethrow;
}

// 2. Repository Layer - Data errors
catch (e) {
  _logger.e('Repository Error: $e');
  throw CustomException('Failed to fetch data');
}

// 3. UI Layer - User feedback
orderAsync.whenData((data) => showData(data))
          .onError((error, st) => showError(error))
          .when(
            loading: () => showLoading(),
            data: (data) => showData(data),
            error: (error, st) => showError(error),
          )
```

## Scalability

### Adding New Features

1. **Create Models** in `models/`
2. **Create Repository** in `repositories/`
3. **Create Providers** in `providers/`
4. **Create Screens** in `screens/`
5. **Add Routes** in `config/router.dart`

### Example: Add Ratings

```dart
// 1. models/rating_model.dart
class Rating { ... }

// 2. repositories/ratings_repository.dart
class RatingsRepository { ... }

// 3. providers/ratings_provider.dart
final ratingsProvider = FutureProvider<List<Rating>>

// 4. screens/ratings/ratings_screen.dart
class RatingsScreen extends ConsumerWidget { ... }

// 5. config/router.dart - Add route
GoRoute(path: 'ratings', builder: (c, s) => RatingsScreen())
```

## Conclusion

This architecture provides:
- **Maintainability**: Clear separation of concerns
- **Testability**: Easy to mock and test each layer
- **Scalability**: Add features without affecting existing code
- **Performance**: Built-in caching and optimization
- **Reactivity**: Automatic UI updates when data changes

Follow these principles when extending the app! 🚀
