class Proposal {
  final String id;
  final String number;
  final String title;
  final String? description;
  final String? customerId;
  final String? opportunityId;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? validUntil;
  final double totalAmount;
  final String currency;
  final String? terms;
  final String? notes;
  final String? employeeId;
  final List<dynamic>? items;
  final List<dynamic>? attachments;
  final String? paymentTerms;
  final String? deliveryTerms;
  final String? warrantyTerms;
  final String? priceTerms;
  final String? otherTerms;
  final List<String>? selectedPaymentTerms;
  final List<String>? selectedDeliveryTerms;
  final List<String>? selectedWarrantyTerms;
  final List<String>? selectedPricingTerms;
  final List<String>? selectedOtherTerms;
  final String? companyId;
  final String? subject;
  final double exchangeRate;
  final DateTime? offerDate;
  final List<dynamic>? history;
  final String? parentProposalId;
  final int? revisionNumber;

  Proposal({
    required this.id,
    required this.number,
    required this.title,
    this.description,
    this.customerId,
    this.opportunityId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.validUntil,
    required this.totalAmount,
    required this.currency,
    this.terms,
    this.notes,
    this.employeeId,
    this.items,
    this.attachments,
    this.paymentTerms,
    this.deliveryTerms,
    this.warrantyTerms,
    this.priceTerms,
    this.otherTerms,
    this.selectedPaymentTerms,
    this.selectedDeliveryTerms,
    this.selectedWarrantyTerms,
    this.selectedPricingTerms,
    this.selectedOtherTerms,
    this.companyId,
    this.subject,
    required this.exchangeRate,
    this.offerDate,
    this.history,
    this.parentProposalId,
    this.revisionNumber,
  });

  factory Proposal.fromJson(Map<String, dynamic> json) {
    return Proposal(
      id: json['id'] ?? '',
      number: json['number'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      customerId: json['customer_id'],
      opportunityId: json['opportunity_id'],
      status: json['status'] ?? 'draft',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      validUntil: json['valid_until'] != null
          ? DateTime.parse(json['valid_until'])
          : null,
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'TRY',
      terms: json['terms'],
      notes: json['notes'],
      employeeId: json['employee_id'],
      items: json['items'] != null 
          ? (json['items'] is List 
              ? List<dynamic>.from(json['items']) 
              : null)
          : null,
      attachments: json['attachments'] != null
          ? (json['attachments'] is List
              ? List<dynamic>.from(json['attachments'])
              : null)
          : null,
      paymentTerms: json['payment_terms'],
      deliveryTerms: json['delivery_terms'],
      warrantyTerms: json['warranty_terms'],
      priceTerms: json['price_terms'],
      otherTerms: json['other_terms'],
      selectedPaymentTerms: json['selected_payment_terms'] != null
          ? (json['selected_payment_terms'] is List
              ? List<String>.from(json['selected_payment_terms'])
              : null)
          : null,
      selectedDeliveryTerms: json['selected_delivery_terms'] != null
          ? (json['selected_delivery_terms'] is List
              ? List<String>.from(json['selected_delivery_terms'])
              : null)
          : null,
      selectedWarrantyTerms: json['selected_warranty_terms'] != null
          ? (json['selected_warranty_terms'] is List
              ? List<String>.from(json['selected_warranty_terms'])
              : null)
          : null,
      selectedPricingTerms: json['selected_pricing_terms'] != null
          ? (json['selected_pricing_terms'] is List
              ? List<String>.from(json['selected_pricing_terms'])
              : null)
          : null,
      selectedOtherTerms: json['selected_other_terms'] != null
          ? (json['selected_other_terms'] is List
              ? List<String>.from(json['selected_other_terms'])
              : null)
          : null,
      companyId: json['company_id'],
      subject: json['subject'],
      exchangeRate: (json['exchange_rate'] ?? 1).toDouble(),
      offerDate: json['offer_date'] != null
          ? DateTime.parse(json['offer_date'])
          : null,
      history: json['history'] != null
          ? (json['history'] is List
              ? List<dynamic>.from(json['history'])
              : null)
          : null,
      parentProposalId: json['parent_proposal_id'],
      revisionNumber: json['revision_number'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'number': number,
      'title': title,
      'description': description,
      'customer_id': customerId,
      'opportunity_id': opportunityId,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'valid_until': validUntil?.toIso8601String(),
      'total_amount': totalAmount,
      'currency': currency,
      'terms': terms,
      'notes': notes,
      'employee_id': employeeId,
      'items': items,
      'attachments': attachments,
      'payment_terms': paymentTerms,
      'delivery_terms': deliveryTerms,
      'warranty_terms': warrantyTerms,
      'price_terms': priceTerms,
      'other_terms': otherTerms,
      'selected_payment_terms': selectedPaymentTerms,
      'selected_delivery_terms': selectedDeliveryTerms,
      'selected_warranty_terms': selectedWarrantyTerms,
      'selected_pricing_terms': selectedPricingTerms,
      'selected_other_terms': selectedOtherTerms,
      'company_id': companyId,
      'subject': subject,
      'exchange_rate': exchangeRate,
      'offer_date': offerDate?.toIso8601String(),
      'history': history,
      'parent_proposal_id': parentProposalId,
      'revision_number': revisionNumber,
    };
  }
}

