import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_config.dart';
import '../../models/product_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/products_provider.dart';
import '../../theme/app_theme.dart';

class NewOrderScreen extends ConsumerStatefulWidget {
  final String tableId;
  final String tableNumber;

  const NewOrderScreen({
    required this.tableId,
    required this.tableNumber,
    Key? key,
  }) : super(key: key);

  @override
  ConsumerState<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends ConsumerState<NewOrderScreen> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    // Set the table in cart
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cartProvider.notifier).setTable(widget.tableId, widget.tableNumber);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    final isMobile = MediaQuery.of(context).size.width < AppConfig.tabletBreakpoint;

    if (isMobile) {
      return _buildMobileLayout(context, productsAsync);
    } else {
      return _buildTabletLayout(context, productsAsync);
    }
  }

  Widget _buildMobileLayout(
    BuildContext context,
    AsyncValue<List<Product>> productsAsync,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: Text('New Order - Table ${widget.tableNumber}'),
        elevation: 0,
      ),
      body: SafeArea(
        child: productsAsync.when(
          data: (products) {
            final categories = ref.watch(categoriesProvider);
            return categories.when(
              data: (cats) {
                return Column(
                  children: [
                    // Category Tabs
                    SizedBox(
                      height: 50,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: cats.length,
                        itemBuilder: (context, index) {
                          final category = cats[index];
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: FilterChip(
                              label: Text(category),
                              selected: ref.watch(selectedCategoryProvider) == category,
                              onSelected: (selected) {
                                ref.read(selectedCategoryProvider.notifier).state =
                                    selected ? category : null;
                              },
                            ),
                          );
                        },
                      ),
                    ),

                    // Products Grid
                    Expanded(
                      child: _buildProductsGrid(context, products, isMobile: true),
                    ),

                    // Cart Summary
                    _buildCartSummary(context, isMobile: true),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Error: $error')),
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (error, stackTrace) => Center(
            child: Text('Error loading products: $error'),
          ),
        ),
      ),
    );
  }

  Widget _buildTabletLayout(
    BuildContext context,
    AsyncValue<List<Product>> productsAsync,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: Text('New Order - Table ${widget.tableNumber}'),
        elevation: 0,
      ),
      body: SafeArea(
        child: productsAsync.when(
          data: (products) {
            return Row(
              children: [
                // Products Section (70%)
                Expanded(
                  flex: 7,
                  child: _buildProductsSection(context, products),
                ),

                // Divider
                const VerticalDivider(width: 1),

                // Cart Section (30%)
                Expanded(
                  flex: 3,
                  child: _buildCartSection(context),
                ),
              ],
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (error, stackTrace) => Center(
            child: Text('Error loading products: $error'),
          ),
        ),
      ),
    );
  }

  Widget _buildProductsSection(BuildContext context, List<Product> allProducts) {
    final categories = ref.watch(categoriesProvider);
    return categories.when(
      data: (cats) {
        return Column(
          children: [
            // Category Tabs
            SizedBox(
              height: 50,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: cats.length,
                itemBuilder: (context, index) {
                  final category = cats[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: FilterChip(
                      label: Text(category),
                      selected: ref.watch(selectedCategoryProvider) == category,
                      onSelected: (selected) {
                        ref.read(selectedCategoryProvider.notifier).state =
                            selected ? category : null;
                      },
                    ),
                  );
                },
              ),
            ),

            // Products Grid
            Expanded(
              child: _buildProductsGrid(context, allProducts, isMobile: false),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Error: $error')),
    );
  }

  Widget _buildProductsGrid(
    BuildContext context,
    List<Product> allProducts, {
    required bool isMobile,
  }) {
    final selectedCategory = ref.watch(selectedCategoryProvider);
    final filteredProducts = selectedCategory == null
        ? allProducts
        : allProducts.where((p) => p.category == selectedCategory).toList();

    return GridView.builder(
      padding: const EdgeInsets.all(AppConfig.defaultPadding),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isMobile ? 2 : 3,
        mainAxisSpacing: AppConfig.defaultPadding,
        crossAxisSpacing: AppConfig.defaultPadding,
        childAspectRatio: 0.75,
      ),
      itemCount: filteredProducts.length,
      itemBuilder: (context, index) {
        final product = filteredProducts[index];
        return _buildProductCard(context, product);
      },
    );
  }

  Widget _buildProductCard(BuildContext context, Product product) {
    return GestureDetector(
      onTap: product.isAvailable
          ? () => _showProductDetail(context, product)
          : null,
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultBorderRadius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppConfig.defaultBorderRadius),
                  ),
                  color: product.isAvailable
                      ? AppTheme.surfaceSecondary
                      : AppTheme.textHint.withOpacity(0.3),
                ),
                child: Center(
                  child: Icon(
                    Icons.coffee,
                    size: 32,
                    color: product.isAvailable
                        ? AppTheme.primaryColor
                        : AppTheme.textTertiary,
                  ),
                ),
              ),
            ),

            // Product Info
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'VND ${product.price.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppTheme.primaryColor,
                        ),
                  ),
                  if (!product.isAvailable)
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text(
                        'Out of stock',
                        style: TextStyle(
                          fontSize: 10,
                          color: AppTheme.errorColor,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartSummary(BuildContext context, {required bool isMobile}) {
    final cartState = ref.watch(cartProvider);

    return Container(
      padding: const EdgeInsets.all(AppConfig.defaultPadding),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: AppTheme.borderColor),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${cartState.itemCount} items',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  Text(
                    'VND ${cartState.total.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: AppTheme.primaryColor,
                        ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: cartState.items.isEmpty ? null : () => _showCartModal(context),
                child: const Text('View Cart'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCartSection(BuildContext context) {
    final cartState = ref.watch(cartProvider);

    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(AppConfig.defaultPadding),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppTheme.borderColor),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Summary',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    'Table ${widget.tableNumber}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Cart Items
        Expanded(
          child: cartState.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_cart_outlined,
                        size: 48,
                        color: AppTheme.textTertiary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Cart is empty',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(AppConfig.defaultPadding),
                  itemCount: cartState.items.length,
                  itemBuilder: (context, index) {
                    final item = cartState.items[index];
                    return _buildCartItemTile(context, item);
                  },
                ),
        ),

        // Total and Submit
        Container(
          padding: const EdgeInsets.all(AppConfig.defaultPadding),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: AppTheme.borderColor),
            ),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total:',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    'VND ${cartState.total.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: AppTheme.primaryColor,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: cartState.items.isEmpty ? null : () => _submitOrder(context),
                  child: cartState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Submit Order'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCartItemTile(BuildContext context, CartItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.borderColor),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    item.product.name,
                    style: Theme.of(context).textTheme.labelLarge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: () {
                    ref.read(cartProvider.notifier).removeItem(item.id);
                  },
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'VND ${item.subtotal.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryColor,
                      ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 16),
                      onPressed: () {
                        ref.read(cartProvider.notifier).updateItemQuantity(
                          item.id,
                          item.quantity - 1,
                        );
                      },
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                    SizedBox(
                      width: 30,
                      child: Text(
                        item.quantity.toString(),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add, size: 16),
                      onPressed: () {
                        ref.read(cartProvider.notifier).updateItemQuantity(
                          item.id,
                          item.quantity + 1,
                        );
                      },
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showProductDetail(BuildContext context, Product product) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppConfig.defaultBorderRadius),
        ),
      ),
      builder: (context) {
        return _ProductDetailModal(
          product: product,
          onAddToCart: (quantity, notes) {
            for (int i = 0; i < quantity; i++) {
              ref.read(cartProvider.notifier).addItem(product, notes: notes);
            }
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Added ${quantity} x ${product.name}')),
            );
          },
        );
      },
    );
  }

  void _showCartModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppConfig.defaultBorderRadius),
        ),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          builder: (context, scrollController) {
            return _buildCartSection(context);
          },
        );
      },
    );
  }

  void _submitOrder(BuildContext context) async {
    final authState = ref.read(authProvider);
    final cartNotifier = ref.read(cartProvider.notifier);

    if (authState.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User not authenticated')),
      );
      return;
    }

    final order = await cartNotifier.submitOrder(
      authState.user!.id,
      authState.user!.name,
    );

    if (order != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order submitted successfully!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      context.pop();
      context.pop();
    }
  }
}

class CartItem {
  final String id;
  final Product product;
  int quantity;
  final String? notes;

  CartItem({
    required this.product,
    required this.quantity,
    this.notes,
  }) : id = DateTime.now().toString();
}

class _ProductDetailModal extends StatefulWidget {
  final Product product;
  final Function(int quantity, String? notes) onAddToCart;

  const _ProductDetailModal({
    required this.product,
    required this.onAddToCart,
  });

  @override
  State<_ProductDetailModal> createState() => _ProductDetailModalState();
}

class _ProductDetailModalState extends State<_ProductDetailModal> {
  int _quantity = 1;
  late TextEditingController _notesController;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.product.name,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          if (widget.product.description != null)
            Text(
              widget.product.description!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
          const SizedBox(height: 16),
          Text(
            'VND ${widget.product.price.toStringAsFixed(0)}',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppTheme.primaryColor,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Quantity:'),
              const SizedBox(width: 16),
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
              ),
              SizedBox(
                width: 50,
                child: TextField(
                  textAlign: TextAlign.center,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  controller: TextEditingController(text: _quantity.toString()),
                  onChanged: (value) {
                    setState(() {
                      _quantity = int.tryParse(value) ?? _quantity;
                    });
                  },
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => setState(() => _quantity++),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              hintText: 'Add notes (optional)',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                widget.onAddToCart(_quantity, _notesController.text.isEmpty ? null : _notesController.text);
              },
              child: const Text('Add to Cart'),
            ),
          ),
        ],
      ),
    );
  }
}
