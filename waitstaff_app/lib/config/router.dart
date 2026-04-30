import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/product_model.dart';
import '../models/table_model.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/orders/active_orders_screen.dart';
import '../screens/orders/new_order_screen.dart';
import '../screens/orders/order_details_screen.dart';
import '../screens/orders/select_table_screen.dart';
import '../screens/menu/menu_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: authState.isLoggedIn ? '/home' : '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.isLoggedIn;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      if (isLoggedIn && isLoggingIn) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'menu',
            name: 'menu',
            builder: (context, state) => const MenuScreen(),
          ),
          GoRoute(
            path: 'active-orders',
            name: 'active-orders',
            builder: (context, state) => const ActiveOrdersScreen(),
            routes: [
              GoRoute(
                path: ':orderId',
                name: 'order-details',
                builder: (context, state) {
                  final orderId = state.pathParameters['orderId'] ?? '';
                  return OrderDetailsScreen(orderId: orderId);
                },
              ),
            ],
          ),
          GoRoute(
            path: 'new-order',
            name: 'new-order',
            builder: (context, state) => const SelectTableScreen(),
            routes: [
              GoRoute(
                path: 'table/:tableId',
                name: 'new-order-items',
                builder: (context, state) {
                  final tableId = state.pathParameters['tableId'] ?? '';
                  final tableNumber = state.uri.queryParameters['tableNumber'] ?? '';
                  return NewOrderScreen(
                    tableId: tableId,
                    tableNumber: tableNumber,
                  );
                },
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
