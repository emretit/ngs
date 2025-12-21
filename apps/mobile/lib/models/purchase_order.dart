class PurchaseOrder {
  final String id;
  final String orderNumber;
  final String? requestId;
  final String? supplierId;
  final DateTime orderDate;
  final DateTime? expectedDeliveryDate;
  final String status;
  final String priority;
  final String? paymentTerms;
  final String? deliveryAddress;
  final String? notes;
  final double? subtotal;
  final double? taxTotal;
  final double? totalAmount;
  final String currency;
  final String? createdBy;
  final String? approvedBy;
  final DateTime? approvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  PurchaseOrder({
    required this.id,
    required this.orderNumber,
    this.requestId,
    this.supplierId,
    required this.orderDate,
    this.expectedDeliveryDate,
    required this.status,
    required this.priority,
    this.paymentTerms,
    this.deliveryAddress,
    this.notes,
    this.subtotal,
    this.taxTotal,
    this.totalAmount,
    required this.currency,
    this.createdBy,
    this.approvedBy,
    this.approvedAt,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) {
    return PurchaseOrder(
      id: json['id'] ?? '',
      orderNumber: json['order_number'] ?? '',
      requestId: json['request_id'],
      supplierId: json['supplier_id'],
      orderDate: json['order_date'] != null
          ? DateTime.parse(json['order_date'])
          : DateTime.now(),
      expectedDeliveryDate: json['expected_delivery_date'] != null
          ? DateTime.parse(json['expected_delivery_date'])
          : null,
      status: json['status'] ?? 'draft',
      priority: json['priority'] ?? 'normal',
      paymentTerms: json['payment_terms'],
      deliveryAddress: json['delivery_address'],
      notes: json['notes'],
      subtotal: json['subtotal'] != null ? (json['subtotal'] as num).toDouble() : null,
      taxTotal: json['tax_total'] != null ? (json['tax_total'] as num).toDouble() : null,
      totalAmount: json['total_amount'] != null ? (json['total_amount'] as num).toDouble() : null,
      currency: json['currency'] ?? 'TRY',
      createdBy: json['created_by'],
      approvedBy: json['approved_by'],
      approvedAt: json['approved_at'] != null
          ? DateTime.parse(json['approved_at'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'request_id': requestId,
      'supplier_id': supplierId,
      'order_date': orderDate.toIso8601String(),
      'expected_delivery_date': expectedDeliveryDate?.toIso8601String(),
      'status': status,
      'priority': priority,
      'payment_terms': paymentTerms,
      'delivery_address': deliveryAddress,
      'notes': notes,
      'subtotal': subtotal,
      'tax_total': taxTotal,
      'total_amount': totalAmount,
      'currency': currency,
      'created_by': createdBy,
      'approved_by': approvedBy,
      'approved_at': approvedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }
}

