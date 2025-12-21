class Payment {
  final String id;
  final double amount;
  final String currency;
  final DateTime paymentDate;
  final String? recipientName;
  final String? referenceNote;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? paymentType;
  final String? description;
  final String? customerId;
  final String? supplierId;
  final String? paymentDirection;
  final String? companyId;
  final String? accountId;

  Payment({
    required this.id,
    required this.amount,
    required this.currency,
    required this.paymentDate,
    this.recipientName,
    this.referenceNote,
    required this.createdAt,
    required this.updatedAt,
    this.paymentType,
    this.description,
    this.customerId,
    this.supplierId,
    this.paymentDirection,
    this.companyId,
    this.accountId,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'TRY',
      paymentDate: json['payment_date'] != null
          ? DateTime.parse(json['payment_date'])
          : DateTime.now(),
      recipientName: json['recipient_name'],
      referenceNote: json['reference_note'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      paymentType: json['payment_type'],
      description: json['description'],
      customerId: json['customer_id'],
      supplierId: json['supplier_id'],
      paymentDirection: json['payment_direction'],
      companyId: json['company_id'],
      accountId: json['account_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'amount': amount,
      'currency': currency,
      'payment_date': paymentDate.toIso8601String(),
      'recipient_name': recipientName,
      'reference_note': referenceNote,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'payment_type': paymentType,
      'description': description,
      'customer_id': customerId,
      'supplier_id': supplierId,
      'payment_direction': paymentDirection,
      'company_id': companyId,
      'account_id': accountId,
    };
  }
}

