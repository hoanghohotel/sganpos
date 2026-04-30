class Product {
  final String id;
  final String name;
  final String? description;
  final double price;
  final String category;
  final bool isAvailable;
  final String? imageUrl;
  final int preparationTime; // in minutes
  final String tenantId;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.category,
    required this.isAvailable,
    this.imageUrl,
    required this.preparationTime,
    required this.tenantId,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      price: (json['price'] ?? 0).toDouble(),
      category: json['category'] ?? 'Other',
      isAvailable: json['isAvailable'] ?? json['is_available'] ?? true,
      imageUrl: json['imageUrl'] ?? json['image_url'],
      preparationTime: json['preparationTime'] ?? json['preparation_time'] ?? 15,
      tenantId: json['tenantId'] ?? json['tenant_id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'isAvailable': isAvailable,
      'imageUrl': imageUrl,
      'preparationTime': preparationTime,
      'tenantId': tenantId,
    };
  }
}

class Category {
  final String name;
  final List<Product> products;

  Category({
    required this.name,
    required this.products,
  });
}
