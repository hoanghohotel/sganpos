class AppConfig {
  // API Configuration
  static const String apiBaseUrl = 'http://localhost:3001'; // Change for production
  static const String socketUrl = 'http://localhost:3001'; // Change for production
  
  // API Endpoints
  static const String authLogin = '/api/auth/login';
  static const String authLogout = '/api/auth/logout';
  static const String authVerify = '/api/auth/verify';
  
  static const String productsEndpoint = '/api/products';
  static const String tablesEndpoint = '/api/tables';
  static const String ordersEndpoint = '/api/orders';
  
  // Socket.IO Events
  static const String socketOrderCreated = 'order:created';
  static const String socketOrderUpdated = 'order:updated';
  static const String socketOrderCancelled = 'order:cancelled';
  static const String socketOrderCompleted = 'order:completed';
  static const String socketConnect = 'connect';
  static const String socketDisconnect = 'disconnect';
  
  // App Settings
  static const int connectionTimeout = 10000; // ms
  static const int receiveTimeout = 30000; // ms
  static const int socketReconnectDelay = 1000; // ms
  static const int socketReconnectDelayMax = 5000; // ms
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;
  static const double tabletBreakpoint = 600.0;
}

enum Environment {
  development,
  staging,
  production,
}
