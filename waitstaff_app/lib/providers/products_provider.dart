import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product_model.dart';
import '../repositories/products_repository.dart';
import '../services/api_client.dart';
import 'auth_provider.dart';

// Products Repository Provider
final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProductsRepository(apiClient: apiClient);
});

// All Products Provider
final productsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productsRepositoryProvider);
  return repository.getAllProducts();
});

// Products by Category Provider
final productsByCategoryProvider = FutureProvider.family<List<Product>, String>(
  (ref, category) async {
    final repository = ref.watch(productsRepositoryProvider);
    return repository.getProductsByCategory(category);
  },
);

// Categories Provider
final categoriesProvider = FutureProvider<List<String>>((ref) async {
  final repository = ref.watch(productsRepositoryProvider);
  return repository.getCategories();
});

// Grouped Products Provider
final groupedProductsProvider = FutureProvider<List<Category>>((ref) async {
  final products = await ref.watch(productsProvider.future);
  final repository = ref.watch(productsRepositoryProvider);
  return repository.groupProductsByCategory(products);
});

// Selected Category Provider
final selectedCategoryProvider = StateProvider<String?>((ref) => null);

// Search Query Provider
final searchQueryProvider = StateProvider<String>((ref) => '');

// Filtered Products Provider
final filteredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final products = await ref.watch(productsProvider.future);
  final searchQuery = ref.watch(searchQueryProvider);
  final selectedCategory = ref.watch(selectedCategoryProvider);

  var filtered = products;

  if (selectedCategory != null && selectedCategory.isNotEmpty) {
    filtered = filtered.where((p) => p.category == selectedCategory).toList();
  }

  if (searchQuery.isNotEmpty) {
    filtered = filtered
        .where((p) =>
            p.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
            (p.description?.toLowerCase().contains(searchQuery.toLowerCase()) ?? false))
        .toList();
  }

  return filtered;
});
