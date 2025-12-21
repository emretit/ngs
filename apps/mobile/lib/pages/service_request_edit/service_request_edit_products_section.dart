import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ServiceRequestEditProductsSection extends StatelessWidget {
  final List<Map<String, dynamic>> usedProducts;
  final VoidCallback onAddProduct;
  final Function(int) onRemoveProduct;

  const ServiceRequestEditProductsSection({
    super.key,
    required this.usedProducts,
    required this.onAddProduct,
    required this.onRemoveProduct,
  });

  @override
  Widget build(BuildContext context) {
    return ServiceFormSection(
      title: 'Kullanılan Ürünler',
      icon: CupertinoIcons.cube_box,
      iconColor: const Color(0xFF16A085),
      trailing: CupertinoButton(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        color: ServiceFormStyles.primaryColor,
        borderRadius: BorderRadius.circular(8),
        minSize: 0,
        onPressed: onAddProduct,
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.add, color: Colors.white, size: 16),
            SizedBox(width: 4),
            Text(
              'Ürün Ekle',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
      children: [
        if (usedProducts.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            ),
            child: const Column(
              children: [
                Icon(
                  CupertinoIcons.cube_box,
                  size: 32,
                  color: ServiceFormStyles.textSecondary,
                ),
                SizedBox(height: 8),
                Text(
                  'Henüz ürün eklenmemiş',
                  style: TextStyle(
                    color: ServiceFormStyles.textSecondary,
                    fontStyle: FontStyle.italic,
                    fontSize: ServiceFormStyles.bodySize,
                  ),
                ),
              ],
            ),
          )
        else
          ...(usedProducts.asMap().entries.map((entry) {
            final index = entry.key;
            final product = entry.value;
            return ServiceProductItem(
              name: product['name'] ?? 'Bilinmeyen Ürün',
              description: product['description'],
              quantity: (product['quantity'] ?? 1).toDouble(),
              unit: product['unit'] ?? 'adet',
              price: (product['price'] ?? 0).toDouble(),
              onDelete: () => onRemoveProduct(index),
            );
          }).toList()),
      ],
    );
  }
}

