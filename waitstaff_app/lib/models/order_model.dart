enum OrderStatus {
  pending,
  confirmed,
  preparing,
  ready,
  served,
  completed,
  cancelled,
}

class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final int quantity;
  final double price;
  final double subtotal;
  final String? notes;
  final DateTime createdAt;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
    required this.subtotal,
    this.notes,
    required this.createdAt,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['_id'] ?? json['id'] ?? '',
      productId: json['productId'] ?? json['product_id'] ?? '',
      productName: json['productName'] ?? json['product_name'] ?? '',
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'price': price,
      'subtotal': subtotal,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Order {
  final String id;
  final String tableId;
  final String tableNumber;
  final List<OrderItem> items;
  final OrderStatus status;
  final double total;
  final String staffId;
  final String staffName;
  final String tenantId;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? completedAt;

  Order({
    required this.id,
    required this.tableId,
    required this.tableNumber,
    required this.items,
    required this.status,
    required this.total,
    required this.staffId,
    required this.staffName,
    required this.tenantId,
    required this.createdAt,
    this.updatedAt,
    this.completedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] ?? json['id'] ?? '',
      tableId: json['tableId'] ?? json['table_id'] ?? '',
      tableNumber: json['tableNumber'] ?? json['table_number'] ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      status: _parseStatus(json['status']),
      total: (json['total'] ?? 0).toDouble(),
      staffId: json['staffId'] ?? json['staff_id'] ?? '',
      staffName: json['staffName'] ?? json['staff_name'] ?? '',
      tenantId: json['tenantId'] ?? json['tenant_id'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tableId': tableId,
      'tableNumber': tableNumber,
      'items': items.map((item) => item.toJson()).toList(),
      'status': status.toString().split('.').last,
      'total': total,
      'staffId': staffId,
      'staffName': staffName,
      'tenantId': tenantId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  static OrderStatus _parseStatus(dynamic status) {
    if (status == null) return OrderStatus.pending;
    final statusStr = status.toString().toLowerCase();
    switch (statusStr) {
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'preparing':
        return OrderStatus.preparing;
      case 'ready':
        return OrderStatus.ready;
      case 'served':
        return OrderStatus.served;
      case 'completed':
        return OrderStatus.completed;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }

  static String statusDisplay(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready';
      case OrderStatus.served:
        return 'Served';
      case OrderStatus.completed:
        return 'Completed';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}
