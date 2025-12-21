class Opportunity {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final String? customerId;
  final String? customerName;
  final String? employeeId;
  final DateTime? expectedCloseDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double? value;
  final String currency;
  final List<dynamic>? contactHistory;
  final List<dynamic>? products;
  final String? notes;
  final String? proposalId;
  final List<String>? tags;
  final String? opportunityType;
  final String? companyId;

  Opportunity({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.customerId,
    this.customerName,
    this.employeeId,
    this.expectedCloseDate,
    required this.createdAt,
    required this.updatedAt,
    this.value,
    required this.currency,
    this.contactHistory,
    this.products,
    this.notes,
    this.proposalId,
    this.tags,
    this.opportunityType,
    this.companyId,
  });

  factory Opportunity.fromJson(Map<String, dynamic> json) {
    // customer relation varsa customer name'i al
    String? customerName;
    if (json['customers'] != null) {
      customerName = json['customers']['name'];
    } else if (json['customer_name'] != null) {
      customerName = json['customer_name'];
    }

    return Opportunity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'new',
      priority: json['priority'] ?? 'medium',
      customerId: json['customer_id'],
      customerName: customerName,
      employeeId: json['employee_id'],
      expectedCloseDate: json['expected_close_date'] != null
          ? DateTime.parse(json['expected_close_date'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      value: json['value'] != null ? (json['value']).toDouble() : null,
      currency: json['currency'] ?? 'TRY',
      contactHistory: json['contact_history'] != null
          ? List<dynamic>.from(json['contact_history'])
          : null,
      products: json['products'] != null ? List<dynamic>.from(json['products']) : null,
      notes: json['notes'],
      proposalId: json['proposal_id'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      opportunityType: json['opportunity_type'],
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'customer_id': customerId,
      'employee_id': employeeId,
      'expected_close_date': expectedCloseDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'value': value,
      'currency': currency,
      'contact_history': contactHistory,
      'products': products,
      'notes': notes,
      'proposal_id': proposalId,
      'tags': tags,
      'opportunity_type': opportunityType,
      'company_id': companyId,
    };
  }
}

