import 'dart:convert';

class TableModel {
  final String id;
  final String tenantId;
  final String name;
  final int capacity;
  final String status; // EMPTY, OCCUPIED, RESERVED
  final String? currentOrderId;
  final String? section;
  final DateTime? createdAt;

  TableModel({
    required this.id,
    required this.tenantId,
    required this.name,
    required this.capacity,
    required this.status,
    this.currentOrderId,
    this.section,
    this.createdAt,
  });

  /// Check if table is empty
  bool get isEmpty => status == 'EMPTY';

  /// Check if table is occupied
  bool get isOccupied => status == 'OCCUPIED';

  /// Check if table is reserved
  bool get isReserved => status == 'RESERVED';

  /// Convert to JSON for API requests
  Map<String, dynamic> toJson() => {
    'name': name,
    'capacity': capacity,
    'status': status,
    'currentOrderId': currentOrderId,
    'section': section,
  };

  /// Create TableModel from JSON (API response)
  factory TableModel.fromJson(Map<String, dynamic> json) => TableModel(
    id: json['_id'] ?? json['id'] ?? '',
    tenantId: json['tenantId'] ?? '',
    name: json['name'] ?? '',
    capacity: json['capacity'] ?? 0,
    status: json['status'] ?? 'EMPTY',
    currentOrderId: json['currentOrderId'],
    section: json['section'],
    createdAt: json['createdAt'] != null 
      ? DateTime.parse(json['createdAt'] as String)
      : null,
  );

  /// Create TableModel from JSON string
  factory TableModel.fromJsonString(String jsonString) {
    final Map<String, dynamic> json = jsonDecode(jsonString);
    return TableModel.fromJson(json);
  }

  /// Convert to JSON string
  String toJsonString() => jsonEncode(toJson());

  @override
  String toString() => 'Table(id: $id, name: $name, status: $status)';

  /// Create a copy with modified fields
  TableModel copyWith({
    String? status,
    String? currentOrderId,
  }) => TableModel(
    id: id,
    tenantId: tenantId,
    name: name,
    capacity: capacity,
    status: status ?? this.status,
    currentOrderId: currentOrderId ?? this.currentOrderId,
    section: section,
    createdAt: createdAt,
  );
}
