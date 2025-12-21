class Order {
  final String id;
  final String orderNumber;
  final String? proposalId;
  final String? customerId;
  final String? employeeId;
  final String? opportunityId;
  final String title;
  final String? description;
  final String? notes;
  final String status;
  final DateTime orderDate;
  final DateTime? expectedDeliveryDate;
  final DateTime? deliveryDate;
  final String currency;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double totalAmount;
  final String? paymentTerms;
  final String? deliveryTerms;
  final String? warrantyTerms;
  final String? priceTerms;
  final String? otherTerms;
  final String? deliveryAddress;
  final String? deliveryContactName;
  final String? deliveryContactPhone;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  Order({
    required this.id,
    required this.orderNumber,
    this.proposalId,
    this.customerId,
    this.employeeId,
    this.opportunityId,
    required this.title,
    this.description,
    this.notes,
    required this.status,
    required this.orderDate,
    this.expectedDeliveryDate,
    this.deliveryDate,
    required this.currency,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalAmount,
    this.paymentTerms,
    this.deliveryTerms,
    this.warrantyTerms,
    this.priceTerms,
    this.otherTerms,
    this.deliveryAddress,
    this.deliveryContactName,
    this.deliveryContactPhone,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      orderNumber: json['order_number'] ?? '',
      proposalId: json['proposal_id'],
      customerId: json['customer_id'],
      employeeId: json['employee_id'],
      opportunityId: json['opportunity_id'],
      title: json['title'] ?? '',
      description: json['description'],
      notes: json['notes'],
      status: json['status'] ?? 'pending',
      orderDate: json['order_date'] != null
          ? DateTime.parse(json['order_date'])
          : DateTime.now(),
      expectedDeliveryDate: json['expected_delivery_date'] != null
          ? DateTime.parse(json['expected_delivery_date'])
          : null,
      deliveryDate: json['delivery_date'] != null
          ? DateTime.parse(json['delivery_date'])
          : null,
      currency: json['currency'] ?? 'TRY',
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      taxAmount: (json['tax_amount'] ?? 0).toDouble(),
      discountAmount: (json['discount_amount'] ?? 0).toDouble(),
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      paymentTerms: json['payment_terms'],
      deliveryTerms: json['delivery_terms'],
      warrantyTerms: json['warranty_terms'],
      priceTerms: json['price_terms'],
      otherTerms: json['other_terms'],
      deliveryAddress: json['delivery_address'],
      deliveryContactName: json['delivery_contact_name'],
      deliveryContactPhone: json['delivery_contact_phone'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'proposal_id': proposalId,
      'customer_id': customerId,
      'employee_id': employeeId,
      'opportunity_id': opportunityId,
      'title': title,
      'description': description,
      'notes': notes,
      'status': status,
      'order_date': orderDate.toIso8601String(),
      'expected_delivery_date': expectedDeliveryDate?.toIso8601String(),
      'delivery_date': deliveryDate?.toIso8601String(),
      'currency': currency,
      'subtotal': subtotal,
      'tax_amount': taxAmount,
      'discount_amount': discountAmount,
      'total_amount': totalAmount,
      'payment_terms': paymentTerms,
      'delivery_terms': deliveryTerms,
      'warranty_terms': warrantyTerms,
      'price_terms': priceTerms,
      'other_terms': otherTerms,
      'delivery_address': deliveryAddress,
      'delivery_contact_name': deliveryContactName,
      'delivery_contact_phone': deliveryContactPhone,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }
}

