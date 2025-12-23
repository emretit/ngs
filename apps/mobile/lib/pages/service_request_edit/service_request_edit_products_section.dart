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
        else ...[
          // Tablo başlığı
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
              border: Border.all(
                color: Colors.grey.withOpacity(0.15),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 30,
                  child: Text(
                    '#',
                    style: TextStyle(
                      fontSize: ServiceFormStyles.captionSize,
                      fontWeight: FontWeight.w600,
                      color: ServiceFormStyles.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  flex: 3,
                  child: Text(
                    'Parça Adı',
                    style: TextStyle(
                      fontSize: ServiceFormStyles.captionSize,
                      fontWeight: FontWeight.w600,
                      color: ServiceFormStyles.textSecondary,
                    ),
                  ),
                ),
                SizedBox(
                  width: 50,
                  child: Text(
                    'Miktar',
                    style: TextStyle(
                      fontSize: ServiceFormStyles.captionSize,
                      fontWeight: FontWeight.w600,
                      color: ServiceFormStyles.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Text(
                    'Birim Fiyat',
                    style: TextStyle(
                      fontSize: ServiceFormStyles.captionSize,
                      fontWeight: FontWeight.w600,
                      color: ServiceFormStyles.textSecondary,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
                const SizedBox(width: 40), // Sil butonu için alan
              ],
            ),
          ),
          // Tablo satırları
          ...usedProducts.asMap().entries.map((entry) {
            final index = entry.key;
            final product = entry.value;
            final quantity = (product['quantity'] ?? 1).toDouble();
            final price = (product['price'] ?? 0).toDouble();
            final total = quantity * price;

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  left: BorderSide(color: Colors.grey.withOpacity(0.15)),
                  right: BorderSide(color: Colors.grey.withOpacity(0.15)),
                  bottom: BorderSide(
                    color: Colors.grey.withOpacity(0.15),
                    width: index == usedProducts.length - 1 ? 1 : 0.5,
                  ),
                ),
                borderRadius: index == usedProducts.length - 1
                    ? const BorderRadius.only(
                        bottomLeft: Radius.circular(8),
                        bottomRight: Radius.circular(8),
                      )
                    : null,
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 30,
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        fontSize: ServiceFormStyles.bodySize,
                        fontWeight: FontWeight.w500,
                        color: ServiceFormStyles.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product['name'] ?? 'Bilinmeyen Ürün',
                          style: const TextStyle(
                            fontSize: ServiceFormStyles.bodySize,
                            fontWeight: FontWeight.w600,
                            color: ServiceFormStyles.textPrimary,
                          ),
                        ),
                        if (product['description'] != null && product['description'].toString().isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            product['description'],
                            style: TextStyle(
                              fontSize: ServiceFormStyles.captionSize,
                              color: ServiceFormStyles.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 50,
                    child: Text(
                      '${quantity.toInt()} ${product['unit'] ?? 'adet'}',
                      style: const TextStyle(
                        fontSize: ServiceFormStyles.labelSize,
                        color: ServiceFormStyles.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(
                    width: 60,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${price.toStringAsFixed(2)} ₺',
                          style: const TextStyle(
                            fontSize: ServiceFormStyles.labelSize,
                            fontWeight: FontWeight.w500,
                            color: ServiceFormStyles.textPrimary,
                          ),
                          textAlign: TextAlign.right,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${total.toStringAsFixed(2)} ₺',
                          style: const TextStyle(
                            fontSize: ServiceFormStyles.captionSize,
                            fontWeight: FontWeight.w600,
                            color: ServiceFormStyles.successColor,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 40,
                    child: CupertinoButton(
                      padding: EdgeInsets.zero,
                      minSize: 0,
                      onPressed: () => onRemoveProduct(index),
                      child: const Icon(
                        CupertinoIcons.delete,
                        color: ServiceFormStyles.errorColor,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ],
    );
  }
}

