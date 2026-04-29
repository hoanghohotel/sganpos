import 'dart:convert';

class User {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String role; // ADMIN, MANAGER, STAFF
  final bool isActive;
  final String? tenantId;

  User({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.role,
    this.isActive = true,
    this.tenantId,
  });

  /// Convert User to JSON for storage
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
    'role': role,
    'isActive': isActive,
    'tenantId': tenantId,
  };

  /// Create User from JSON
  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] ?? json['_id'] ?? '',
    name: json['name'] ?? '',
    email: json['email'],
    phone: json['phone'],
    role: json['role'] ?? 'STAFF',
    isActive: json['isActive'] ?? true,
    tenantId: json['tenantId'],
  );

  /// Create User from JSON string
  factory User.fromJsonString(String jsonString) {
    final Map<String, dynamic> json = jsonDecode(jsonString);
    return User.fromJson(json);
  }

  /// Convert User to JSON string
  String toJsonString() => jsonEncode(toJson());

  /// Check if user is admin or manager
  bool get isAdminOrManager => role == 'ADMIN' || role == 'MANAGER';

  @override
  String toString() => 'User(id: $id, name: $name, role: $role)';
}
