class Product {
  final String id;
  final String name;
  final String? description;
  final int taxRate;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? categoryId;
  final String productType;
  final String? sku;
  final int stockQuantity;
  final String unit;
  final bool isActive;
  final String? imageUrl;
  final int? discountRate;
  final String categoryType;
  final String? barcode;
  final double price;
  final String currency;
  final int minStockLevel;
  final String? supplierId;
  final int? stockThreshold;
  final String? companyId;
  final bool vatIncluded;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.taxRate,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.categoryId,
    required this.productType,
    this.sku,
    required this.stockQuantity,
    required this.unit,
    required this.isActive,
    this.imageUrl,
    this.discountRate,
    required this.categoryType,
    this.barcode,
    required this.price,
    required this.currency,
    required this.minStockLevel,
    this.supplierId,
    this.stockThreshold,
    this.companyId,
    required this.vatIncluded,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      taxRate: json['tax_rate'] ?? 18,
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      categoryId: json['category_id'],
      productType: json['product_type'] ?? 'physical',
      sku: json['sku'],
      stockQuantity: json['stock_quantity'] ?? 0,
      unit: json['unit'] ?? 'piece',
      isActive: json['is_active'] ?? true,
      imageUrl: json['image_url'],
      discountRate: json['discount_rate'],
      categoryType: json['category_type'] ?? 'product',
      barcode: json['barcode'],
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'TRY',
      minStockLevel: json['min_stock_level'] ?? 0,
      supplierId: json['supplier_id'],
      stockThreshold: json['stock_threshold'],
      companyId: json['company_id'],
      vatIncluded: json['vat_included'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'tax_rate': taxRate,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'category_id': categoryId,
      'product_type': productType,
      'sku': sku,
      'stock_quantity': stockQuantity,
      'unit': unit,
      'is_active': isActive,
      'image_url': imageUrl,
      'discount_rate': discountRate,
      'category_type': categoryType,
      'barcode': barcode,
      'price': price,
      'currency': currency,
      'min_stock_level': minStockLevel,
      'supplier_id': supplierId,
      'stock_threshold': stockThreshold,
      'company_id': companyId,
      'vat_included': vatIncluded,
    };
  }
}

