import 'package:logger/logger.dart';
import '../config/app_config.dart';
import '../models/product_model.dart';
import '../services/api_client.dart';

class ProductsRepository {
  final ApiClient _apiClient;
  final Logger _logger = Logger();

  ProductsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Product>> getAllProducts() async {
    try {
      final response = await _apiClient.get(AppConfig.productsEndpoint);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final products = (data['products'] as List<dynamic>?)
            ?.map((product) => Product.fromJson(product as Map<String, dynamic>))
            .toList() ?? [];
        _logger.i('Fetched ${products.length} products');
        return products;
      }
      return [];
    } catch (e) {
      _logger.e('Failed to fetch products: $e');
      rethrow;
    }
  }

  Future<List<Product>> getProductsByCategory(String category) async {
    try {
      final response = await _apiClient.get(
        AppConfig.productsEndpoint,
        queryParameters: {'category': category},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final products = (data['products'] as List<dynamic>?)
            ?.map((product) => Product.fromJson(product as Map<String, dynamic>))
            .toList() ?? [];
        _logger.i('Fetched ${products.length} products for category: $category');
        return products;
      }
      return [];
    } catch (e) {
      _logger.e('Failed to fetch products by category: $e');
      rethrow;
    }
  }

  Future<List<String>> getCategories() async {
    try {
      final products = await getAllProducts();
      final categories = products
          .map((p) => p.category)
          .toSet()
          .toList();
      categories.sort();
      _logger.i('Found ${categories.length} categories');
      return categories;
    } catch (e) {
      _logger.e('Failed to fetch categories: $e');
      rethrow;
    }
  }

  List<Category> groupProductsByCategory(List<Product> products) {
    final map = <String, List<Product>>{};
    
    for (final product in products) {
      if (!map.containsKey(product.category)) {
        map[product.category] = [];
      }
      map[product.category]!.add(product);
    }

    return map.entries
        .map((entry) => Category(
          name: entry.key,
          products: entry.value,
        ))
        .toList();
  }
}
