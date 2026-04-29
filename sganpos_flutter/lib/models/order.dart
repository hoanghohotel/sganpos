import 'dart:convert';

class OrderItem {
  final String productId;
  final String name;
  final int price; // in VND
  final int quantity;
  final String? notes;

  OrderItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
    this.notes,
  });

  /// Item total = price * quantity
  int get total => price * quantity;

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'name': name,
    'price': price,
    'quantity': quantity,
    'notes': notes,
  };

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
    productId: json['productId'] ?? json['_id'] ?? '',
    name: json['name'] ?? '',
    price: (json['price'] ?? 0).toInt(),
    quantity: (json['quantity'] ?? 1).toInt(),
    notes: json['notes'],
  );
}

class Order {
  final String id;
  final String tenantId;
  final String tableId;
  final String status; // PENDING, COMPLETED, CANCELLED
  final String paymentStatus; // UNPAID, PAID
  final List<OrderItem> items;
  final int subtotal; // in VND
  final int tax; // in VND
  final int total; // in VND
  final String? paymentMethod; // CASH, CARD, TRANSFER
  final DateTime createdAt;
  final DateTime? updatedAt;

  Order({
    required this.id,
    required this.tenantId,
    required this.tableId,
    required this.status,
    required this.paymentStatus,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
    this.paymentMethod,
    required this.createdAt,
    this.updatedAt,
  });

  /// Check if order is pending
  bool get isPending => status == 'PENDING';

  /// Check if order is completed
  bool get isCompleted => status == 'COMPLETED';

  /// Check if order is paid
  bool get isPaid => paymentStatus == 'PAID';

  /// Check if order is unpaid
  bool get isUnpaid => paymentStatus == 'UNPAID';

  /// Calculate number of items
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  /// Format price for display
  String formatPrice(int price) {
    return '${(price / 1000).toStringAsFixed(0)}k đ';
  }

  /// Convert to JSON for API requests
  Map<String, dynamic> toJson() => {
    'tableId': tableId,
    'items': items.map((item) => item.toJson()).toList(),
    'paymentMethod': paymentMethod,
  };

  /// Create Order from JSON (API response)
  factory Order.fromJson(Map<String, dynamic> json) => Order(
    id: json['_id'] ?? json['id'] ?? '',
    tenantId: json['tenantId'] ?? '',
    tableId: json['tableId'] ?? '',
    status: json['status'] ?? 'PENDING',
    paymentStatus: json['paymentStatus'] ?? 'UNPAID',
    items: (json['items'] as List?)
        ?.map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
        .toList() ?? [],
    subtotal: (json['subtotal'] ?? 0).toInt(),
    tax: (json['tax'] ?? 0).toInt(),
    total: (json['total'] ?? 0).toInt(),
    paymentMethod: json['paymentMethod'],
    createdAt: DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toString()),
    updatedAt: json['updatedAt'] != null 
      ? DateTime.parse(json['updatedAt'] as String)
      : null,
  );

  /// Create Order from JSON string
  factory Order.fromJsonString(String jsonString) {
    final Map<String, dynamic> json = jsonDecode(jsonString);
    return Order.fromJson(json);
  }

  /// Convert to JSON string
  String toJsonString() => jsonEncode({
    'id': id,
    'tableId': tableId,
    'status': status,
    'paymentStatus': paymentStatus,
    'items': items.map((item) => item.toJson()).toList(),
    'total': total,
  });

  @override
  String toString() => 'Order(id: $id, tableId: $tableId, status: $status, total: $total)';

  /// Create a copy with modified fields
  Order copyWith({
    String? status,
    String? paymentStatus,
    String? paymentMethod,
    List<OrderItem>? items,
  }) => Order(
    id: id,
    tenantId: tenantId,
    tableId: tableId,
    status: status ?? this.status,
    paymentStatus: paymentStatus ?? this.paymentStatus,
    items: items ?? this.items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: paymentMethod ?? this.paymentMethod,
    createdAt: createdAt,
    updatedAt: updatedAt,
  );
}
