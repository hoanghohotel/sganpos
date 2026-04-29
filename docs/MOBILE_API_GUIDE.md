# SGANPOS Mobile API Guide

This document describes all APIs available for the Flutter mobile waiter app.

## Base URL

```
https://api.sganpos.com  (production)
http://localhost:3000    (development)
```

## Authentication

All protected endpoints require either:
1. JWT token in `Authorization` header: `Authorization: Bearer <token>`
2. JWT token in cookie: `token=<token>`

The tenant ID is detected from the subdomain and sent via `X-Tenant-Id` header if available.

### Login Endpoint
**POST** `/api/auth/login`

Request:
```json
{
  "identifier": "email@example.com or phone_number",
  "password": "password"
}
```

Response (200):
```json
{
  "user": {
    "id": "user_id",
    "name": "Waiter Name",
    "email": "email@example.com",
    "phone": "+84900000000",
    "role": "STAFF"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Error (401):
```json
{
  "error": "Thông tin đăng nhập không chính xác"
}
```

---

## Token Refresh

**POST** `/api/auth/refresh`

Request headers:
```
Authorization: Bearer <expired_or_current_token>
```

Response (200):
```json
{
  "token": "new_jwt_token",
  "user": {
    "id": "user_id",
    "name": "Waiter Name",
    "email": "email@example.com",
    "phone": "+84900000000",
    "role": "STAFF"
  }
}
```

Error (401):
```json
{
  "error": "Invalid or expired token"
}
```

---

## User Info

**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "_id": "user_id",
  "tenantId": "store_id",
  "name": "Waiter Name",
  "email": "email@example.com",
  "phone": "+84900000000",
  "role": "STAFF",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Tables

### Get All Tables
**GET** `/api/tables`

Response (200):
```json
[
  {
    "_id": "table_id",
    "tenantId": "store_id",
    "name": "Bàn 1",
    "capacity": 4,
    "status": "EMPTY",
    "currentOrderId": null,
    "section": "Trong nhà",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "_id": "table_id",
    "tenantId": "store_id",
    "name": "Bàn 2",
    "capacity": 6,
    "status": "OCCUPIED",
    "currentOrderId": "order_id",
    "section": "Sân ngoài",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Single Table
**GET** `/api/tables/:id`

Response (200):
```json
{
  "_id": "table_id",
  "tenantId": "store_id",
  "name": "Bàn 1",
  "capacity": 4,
  "status": "EMPTY",
  "currentOrderId": null,
  "section": "Trong nhà"
}
```

### Update Table Status
**PATCH** `/api/tables/:id`

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "status": "OCCUPIED",
  "currentOrderId": "order_id"
}
```

Response (200):
```json
{
  "_id": "table_id",
  "tenantId": "store_id",
  "name": "Bàn 1",
  "capacity": 4,
  "status": "OCCUPIED",
  "currentOrderId": "order_id"
}
```

---

## Orders

### Get All Orders
**GET** `/api/orders`

Query params (optional):
- `page=1` - Page number (default: 1)
- `limit=50` - Items per page (default: 50)

Response (200):
```json
[
  {
    "_id": "order_id",
    "tenantId": "store_id",
    "tableId": "table_id",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "items": [
      {
        "productId": "product_id",
        "name": "Cơm gà",
        "price": 50000,
        "quantity": 2,
        "notes": "Ít mặn"
      }
    ],
    "subtotal": 100000,
    "tax": 10000,
    "total": 110000,
    "paymentMethod": null,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:05:00Z"
  }
]
```

### Create Order
**POST** `/api/orders`

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Request:
```json
{
  "tableId": "table_id",
  "items": [
    {
      "productId": "product_id",
      "name": "Cơm gà",
      "price": 50000,
      "quantity": 2,
      "notes": "Ít mặn"
    }
  ],
  "paymentMethod": null
}
```

Response (201):
```json
{
  "_id": "new_order_id",
  "tenantId": "store_id",
  "tableId": "table_id",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "items": [...],
  "subtotal": 100000,
  "tax": 10000,
  "total": 110000,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Get Single Order
**GET** `/api/orders/:id`

Response (200):
```json
{
  "_id": "order_id",
  "tenantId": "store_id",
  "tableId": "table_id",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "items": [...],
  "subtotal": 100000,
  "tax": 10000,
  "total": 110000
}
```

### Update Order
**PATCH** `/api/orders/:id`

Headers:
```
Authorization: Bearer <token>
```

Request (any combination):
```json
{
  "status": "COMPLETED",
  "paymentStatus": "PAID",
  "paymentMethod": "CASH",
  "items": [...]
}
```

Response (200):
```json
{
  "_id": "order_id",
  "status": "COMPLETED",
  "paymentStatus": "PAID",
  "paymentMethod": "CASH"
}
```

---

## Products

### Get All Products (for order creation)
**GET** `/api/products`

Response (200):
```json
[
  {
    "_id": "product_id",
    "tenantId": "store_id",
    "name": "Cơm gà",
    "description": "Cơm trắng với gà nướng",
    "price": 50000,
    "category": "Cơm",
    "image": "https://...",
    "isActive": true
  }
]
```

---

## Shifts (for shift management)

### Get Current Shift
**GET** `/api/shifts/current`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "_id": "shift_id",
  "tenantId": "store_id",
  "userId": "user_id",
  "startTime": "2024-01-01T08:00:00Z",
  "endTime": null,
  "status": "OPEN",
  "ordersCount": 15,
  "totalRevenue": 750000
}
```

Error (400):
```json
{
  "error": "Không có ca làm việc mở"
}
```

### Start Shift
**POST** `/api/shifts/start`

Headers:
```
Authorization: Bearer <token>
```

Response (201):
```json
{
  "_id": "shift_id",
  "tenantId": "store_id",
  "userId": "user_id",
  "startTime": "2024-01-01T08:00:00Z",
  "status": "OPEN"
}
```

### End Shift
**POST** `/api/shifts/end`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "_id": "shift_id",
  "endTime": "2024-01-01T17:00:00Z",
  "status": "CLOSED",
  "ordersCount": 15,
  "totalRevenue": 750000
}
```

---

## Real-time Events (Socket.io)

### Connection
```javascript
// Connect with token and tenant ID
const socket = io('https://api.sganpos.com', {
  auth: {
    token: 'jwt_token',
    tenantId: 'store_id'
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

### Events

#### `table:update`
Emitted when a table status changes.

```json
{
  "_id": "table_id",
  "name": "Bàn 1",
  "status": "OCCUPIED",
  "currentOrderId": "order_id"
}
```

#### `order:update`
Emitted when an order status changes.

```json
{
  "_id": "order_id",
  "tableId": "table_id",
  "status": "COMPLETED",
  "paymentStatus": "PAID"
}
```

#### `order:create`
Emitted when a new order is created.

```json
{
  "_id": "order_id",
  "tableId": "table_id",
  "items": [...],
  "total": 110000
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message in Vietnamese"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (user not active)
- `404` - Not found
- `500` - Server error

### Token Expiry Handling

When a request returns `401`:
1. Try to refresh token using `/api/auth/refresh`
2. If refresh succeeds, retry the original request with new token
3. If refresh fails, redirect to login screen

---

## CORS Headers

The API supports CORS for mobile apps (no origin required).

Request headers to include:
```
Authorization: Bearer <token>
X-Tenant-Id: store_id (optional, auto-detected from subdomain)
Content-Type: application/json
```

---

## Rate Limiting

- Global API: 1000 requests per 15 minutes per IP
- Auth endpoints: 20 requests per 15 minutes per IP

---

## Example: Flutter Integration

```dart
// HTTP Client with token handling
class ApiClient {
  static const String baseUrl = 'https://api.sganpos.com';
  final http.Client _httpClient = http.Client();
  
  Future<Map> login(String identifier, String password) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Store data['token'] in secure storage
      return data;
    } else {
      throw Exception('Login failed');
    }
  }
  
  Future<List> getTables() async {
    final token = await _getToken();
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/api/tables'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch tables');
    }
  }
  
  Future<String> _getToken() async {
    // Get from secure storage
    return await FlutterSecureStorage().read(key: 'jwt_token') ?? '';
  }
}
```

---

## Testing the API

### With cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"password"}'

# Get tables with token
curl -X GET http://localhost:3000/api/tables \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### With Postman
1. Set base URL: `http://localhost:3000`
2. Login to `/api/auth/login` and copy the `token`
3. Set `Authorization` header to `Bearer {token}` for all subsequent requests
4. Use real-time Socket.io client to test events

---

## Notes for Mobile Development

1. **Token Storage**: Use `flutter_secure_storage` to store JWT securely
2. **Token Refresh**: Implement automatic refresh on 401 responses
3. **Socket.io**: Use `socket_io_client` package for real-time updates
4. **Tenant Detection**: Get tenantId from user data after login, pass to socket connection
5. **Error Messages**: All error messages are in Vietnamese - translate/display appropriately
6. **Connection Handling**: Implement reconnection logic for Socket.io
7. **Offline Support**: Consider caching orders/tables locally for offline viewing
