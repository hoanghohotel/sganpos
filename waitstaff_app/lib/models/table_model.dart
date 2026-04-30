enum TableStatus {
  available,
  occupied,
  reserved,
  cleaning,
}

class TableData {
  final String id;
  final String tableNumber;
  final int capacity;
  final TableStatus status;
  final String? currentOrderId;
  final String tenantId;
  final DateTime createdAt;

  TableData({
    required this.id,
    required this.tableNumber,
    required this.capacity,
    required this.status,
    this.currentOrderId,
    required this.tenantId,
    required this.createdAt,
  });

  factory TableData.fromJson(Map<String, dynamic> json) {
    return TableData(
      id: json['_id'] ?? json['id'] ?? '',
      tableNumber: json['tableNumber'] ?? json['table_number'] ?? '',
      capacity: json['capacity'] ?? 2,
      status: _parseStatus(json['status']),
      currentOrderId: json['currentOrderId'] ?? json['current_order_id'],
      tenantId: json['tenantId'] ?? json['tenant_id'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tableNumber': tableNumber,
      'capacity': capacity,
      'status': status.toString().split('.').last,
      'currentOrderId': currentOrderId,
      'tenantId': tenantId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  static TableStatus _parseStatus(dynamic status) {
    if (status == null) return TableStatus.available;
    final statusStr = status.toString().toLowerCase();
    switch (statusStr) {
      case 'occupied':
        return TableStatus.occupied;
      case 'reserved':
        return TableStatus.reserved;
      case 'cleaning':
        return TableStatus.cleaning;
      default:
        return TableStatus.available;
    }
  }
}
