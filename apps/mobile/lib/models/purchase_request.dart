class PurchaseRequest {
  final String id;
  final String requestNumber;
  final String title;
  final String? description;
  final String requesterId;
  final String? department;
  final String? preferredSupplierId;
  final double totalBudget;
  final String status;
  final String? notes;
  final DateTime? requestedDate;
  final DateTime? neededByDate;
  final String? approvedBy;
  final DateTime? approvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String priority;
  final String? costCenter;
  final DateTime? needByDate;
  final String? requesterNotes;
  final String? departmentId;

  PurchaseRequest({
    required this.id,
    required this.requestNumber,
    required this.title,
    this.description,
    required this.requesterId,
    this.department,
    this.preferredSupplierId,
    required this.totalBudget,
    required this.status,
    this.notes,
    this.requestedDate,
    this.neededByDate,
    this.approvedBy,
    this.approvedAt,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    required this.priority,
    this.costCenter,
    this.needByDate,
    this.requesterNotes,
    this.departmentId,
  });

  factory PurchaseRequest.fromJson(Map<String, dynamic> json) {
    return PurchaseRequest(
      id: json['id'] ?? '',
      requestNumber: json['request_number'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      requesterId: json['requester_id'] ?? '',
      department: json['department'],
      preferredSupplierId: json['preferred_supplier_id'],
      totalBudget: (json['total_budget'] ?? 0).toDouble(),
      status: json['status'] ?? 'draft',
      notes: json['notes'],
      requestedDate: json['requested_date'] != null
          ? DateTime.parse(json['requested_date'])
          : null,
      neededByDate: json['needed_by_date'] != null
          ? DateTime.parse(json['needed_by_date'])
          : null,
      approvedBy: json['approved_by'],
      approvedAt: json['approved_at'] != null
          ? DateTime.parse(json['approved_at'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      priority: json['priority'] ?? 'normal',
      costCenter: json['cost_center'],
      needByDate: json['need_by_date'] != null
          ? DateTime.parse(json['need_by_date'])
          : null,
      requesterNotes: json['requester_notes'],
      departmentId: json['department_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'request_number': requestNumber,
      'title': title,
      'description': description,
      'requester_id': requesterId,
      'department': department,
      'preferred_supplier_id': preferredSupplierId,
      'total_budget': totalBudget,
      'status': status,
      'notes': notes,
      'requested_date': requestedDate?.toIso8601String(),
      'needed_by_date': neededByDate?.toIso8601String(),
      'approved_by': approvedBy,
      'approved_at': approvedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'priority': priority,
      'cost_center': costCenter,
      'need_by_date': needByDate?.toIso8601String(),
      'requester_notes': requesterNotes,
      'department_id': departmentId,
    };
  }
}

