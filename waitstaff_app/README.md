# CàPhê POS - Waitstaff Mobile App

A professional Flutter mobile application for waitstaff employees to take orders, manage tables, and track order status in real-time within the CàPhê POS system.

## Features

### Core Features
- **Secure Authentication**: Staff login with JWT token-based authentication
- **Real-time Order Management**: Live order updates via Socket.IO
- **Quick Order Entry**: Fast, intuitive interface for taking orders
- **Table Management**: View available tables and manage orders per table
- **Order Tracking**: Real-time status updates from pending to completed
- **Multi-category Menu**: Browse products by category
- **Cart Management**: Add items, modify quantities, add special notes
- **Active Orders Display**: See all active orders with status indicators
- **Order History**: View detailed order information and history

### Technical Features
- **Responsive Design**: Optimized for both phones and tablets
- **Offline Support**: Works offline with local caching (future enhancement)
- **Real-time Sync**: Socket.IO integration for instant updates across devices
- **State Management**: Riverpod for reactive state management
- **Secure Storage**: Flutter Secure Storage for sensitive data
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Logging**: Built-in logging for debugging

## Architecture

### Project Structure
```
lib/
├── config/           # Configuration files
│   ├── app_config.dart
│   └── router.dart
├── models/           # Data models
│   ├── user_model.dart
│   ├── product_model.dart
│   ├── order_model.dart
│   └── table_model.dart
├── services/         # Services layer
│   ├── api_client.dart
│   ├── auth_service.dart
│   └── socket_service.dart
├── repositories/     # Data access layer
│   ├── orders_repository.dart
│   ├── products_repository.dart
│   └── tables_repository.dart
├── providers/        # Riverpod state management
│   ├── auth_provider.dart
│   ├── orders_provider.dart
│   ├── products_provider.dart
│   ├── socket_provider.dart
│   └── tables_provider.dart
├── screens/          # UI screens
│   ├── auth/
│   │   └── login_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── orders/
│   │   ├── select_table_screen.dart
│   │   ├── new_order_screen.dart
│   │   ├── active_orders_screen.dart
│   │   └── order_details_screen.dart
│   └── menu/
│       └── menu_screen.dart
├── theme/           # Theme and styling
│   └── app_theme.dart
└── main.dart        # Application entry point
```

### Architecture Layers

**1. Data Layer**
- `models/`: Data structures and serialization
- `repositories/`: Data access abstraction
- `services/`: External service integration (API, Socket, Storage)

**2. State Management Layer**
- `providers/`: Riverpod providers for state management
- Handles complex state with clear separation of concerns

**3. UI Layer**
- `screens/`: Feature screens and UI components
- Responsive design for phones and tablets
- Clean separation between mobile and tablet layouts

## API Integration

### Authentication
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`
- **Verify**: `POST /api/auth/verify`

### Orders
- **Get Active Orders**: `GET /api/orders?status=pending,confirmed,preparing,ready,served`
- **Get Order Details**: `GET /api/orders/:orderId`
- **Create Order**: `POST /api/orders`
- **Add Items**: `PUT /api/orders/:orderId/items`
- **Update Status**: `PUT /api/orders/:orderId/status`
- **Cancel Order**: `DELETE /api/orders/:orderId`

### Products
- **Get All Products**: `GET /api/products`
- **Get by Category**: `GET /api/products?category=:category`

### Tables
- **Get All Tables**: `GET /api/tables`
- **Get Table Details**: `GET /api/tables/:tableId`
- **Get by Status**: `GET /api/tables?status=:status`
- **Update Status**: `PUT /api/tables/:tableId`

### Real-time Events (Socket.IO)
- `order:created` - New order created
- `order:updated` - Order status updated
- `order:cancelled` - Order cancelled
- `order:completed` - Order completed

## Configuration

### Environment Setup

Edit `lib/config/app_config.dart` to configure:

```dart
static const String apiBaseUrl = 'http://your-api-server:3001';
static const String socketUrl = 'http://your-api-server:3001';
```

### Build & Run

```bash
# Get dependencies
flutter pub get

# Run on device/emulator
flutter run

# Run in release mode
flutter run --release
```

## Dependencies

### Key Packages
- **riverpod** (^2.4.0): State management
- **dio** (^5.3.0): HTTP client
- **socket_io_client** (^2.0.2): Real-time communication
- **flutter_secure_storage** (^9.0.0): Secure data storage
- **go_router** (^12.0.0): Navigation
- **intl** (^0.19.0): Localization and formatting

## Features in Detail

### 1. Authentication
- Secure login with email/password
- JWT token storage in secure storage
- Automatic token refresh on app launch
- Logout with session cleanup

### 2. Order Management
- **New Orders**: Select table → Browse menu → Add items → Submit
- **Active Orders**: View all active orders with status
- **Order Details**: See items, notes, timeline, and status
- **Cart System**: Add/remove items, adjust quantities, add special notes

### 3. Real-time Updates
- Socket.IO connection management
- Automatic reconnection on disconnect
- Real-time order status updates
- Connection status indicator

### 4. Responsive UI
- **Mobile Layout**: Single-column design, bottom sheet modals
- **Tablet Layout**: Multi-column grid, side-by-side panels
- Portrait and landscape support
- Touch-optimized controls

## Testing

### Demo Credentials
```
Email: staff@example.com
Password: password123
```

## Future Enhancements

1. **Offline Support**: Local SQLite database for offline caching
2. **Photo Uploads**: Product images from device
3. **Advanced Filtering**: Filter orders by various criteria
4. **Statistics**: Sales and order analytics
5. **Multi-language Support**: Localization (Vietnamese, English, etc.)
6. **Voice Commands**: Voice-based order entry
7. **Payment Integration**: Split bills and payment handling
8. **Customer Display**: Kitchen display system integration
9. **Notifications**: Push notifications for order updates
10. **Search**: Advanced search and filtering capabilities

## Troubleshooting

### Connection Issues
1. Check API server is running on configured URL
2. Verify Socket.IO server is accessible
3. Check network connectivity
4. Review logs in debug console

### State Management
1. Verify Riverpod providers are properly instantiated
2. Check ref.watch() is used in ConsumerWidget
3. Ensure proper state notifier updates

### UI Issues
1. Test on both phone and tablet sizes
2. Check for responsive breakpoints at 600dp
3. Verify theme colors are properly applied

## Contributing

Follow these guidelines when contributing:
1. Use descriptive commit messages
2. Follow the existing code style
3. Test on multiple device sizes
4. Update documentation as needed

## License

© 2024 CàPhê POS. All rights reserved.

## Support

For issues or questions:
1. Check existing documentation
2. Review the troubleshooting section
3. Contact the development team

---

**Built with Flutter and Riverpod for modern, reactive mobile development.**
