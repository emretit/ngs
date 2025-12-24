import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/product.dart';
import '../../providers/inventory_provider.dart';
import '../../shared/widgets/service_form_widgets.dart';

/// Ürün seçim dialogu - servis formunda kullanılan ürünleri seçmek için
class ProductSelectionDialog extends ConsumerStatefulWidget {
  final Function(Map<String, dynamic>, double) onProductSelected;

  const ProductSelectionDialog({
    super.key,
    required this.onProductSelected,
  });

  @override
  ConsumerState<ProductSelectionDialog> createState() => _ProductSelectionDialogState();
}

class _ProductSelectionDialogState extends ConsumerState<ProductSelectionDialog> {
  final _searchController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  List<Product> _filteredProducts = [];
  Product? _selectedProduct;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_filterProducts);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  void _filterProducts() {
    final productsAsync = ref.read(productsProvider);
    productsAsync.whenData((products) {
      final query = _searchController.text.toLowerCase();
      setState(() {
        _filteredProducts = products.where((product) {
          return product.name.toLowerCase().contains(query) ||
                 (product.description?.toLowerCase().contains(query) ?? false);
        }).toList();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ServiceFormStyles.cardRadius),
      ),
      child: Container(
        height: 550,
        width: 380,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(ServiceFormStyles.cardRadius),
                  topRight: Radius.circular(ServiceFormStyles.cardRadius),
                ),
              ),
              child: Row(
                children: [
                  const Icon(CupertinoIcons.cube_box, color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Ürün Seç',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(
                      CupertinoIcons.xmark_circle_fill,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: ServiceFormTextField(
                controller: _searchController,
                label: 'Ürün ara...',
                icon: CupertinoIcons.search,
              ),
            ),
            
            Expanded(
              child: productsAsync.when(
                data: (products) {
                  if (_filteredProducts.isEmpty && _searchController.text.isEmpty) {
                    _filteredProducts = products;
                  }
                  
                  if (_filteredProducts.isEmpty) {
                    return const Center(
                      child: Text(
                        'Ürün bulunamadı',
                        style: TextStyle(
                          color: ServiceFormStyles.textSecondary,
                          fontSize: ServiceFormStyles.bodySize,
                        ),
                      ),
                    );
                  }
                  
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = _filteredProducts[index];
                      final isSelected = _selectedProduct?.id == product.id;
                      
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedProduct = product;
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: isSelected 
                              ? ServiceFormStyles.primaryColor.withOpacity(0.1) 
                              : Colors.white,
                            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                            border: Border.all(
                              color: isSelected 
                                ? ServiceFormStyles.primaryColor 
                                : Colors.grey.shade200,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: (isSelected 
                                      ? ServiceFormStyles.primaryColor 
                                      : ServiceFormStyles.successColor).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    CupertinoIcons.cube_box,
                                    color: isSelected 
                                      ? ServiceFormStyles.primaryColor 
                                      : ServiceFormStyles.successColor,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        product.name,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: ServiceFormStyles.titleSize,
                                          color: isSelected 
                                            ? ServiceFormStyles.primaryColor 
                                            : ServiceFormStyles.textPrimary,
                                        ),
                                      ),
                                      if (product.description != null && product.description!.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 2),
                                          child: Text(
                                            product.description!,
                                            style: const TextStyle(
                                              color: ServiceFormStyles.textSecondary,
                                              fontSize: ServiceFormStyles.captionSize,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          '${product.price} ₺',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: ServiceFormStyles.successColor,
                                            fontSize: ServiceFormStyles.labelSize,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(
                                    CupertinoIcons.checkmark_circle_fill,
                                    color: ServiceFormStyles.primaryColor,
                                    size: 24,
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CupertinoActivityIndicator()),
                error: (error, stack) => Center(
                  child: Text(
                    'Ürünler yüklenemedi',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ),
            ),
            
            if (_selectedProduct != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.inputBackground,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: ServiceFormTextField(
                        controller: _quantityController,
                        label: 'Miktar (${_selectedProduct!.unit ?? 'adet'})',
                        icon: CupertinoIcons.number,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      color: ServiceFormStyles.primaryColor,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
                      onPressed: () {
                        final quantity = double.tryParse(_quantityController.text) ?? 1;
                        widget.onProductSelected({
                          'id': _selectedProduct!.id,
                          'name': _selectedProduct!.name,
                          'description': _selectedProduct!.description,
                          'unit': _selectedProduct!.unit,
                          'price': _selectedProduct!.price,
                        }, quantity);
                        Navigator.pop(context);
                      },
                      child: const Text(
                        'Ekle',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: ServiceFormStyles.titleSize,
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
}

