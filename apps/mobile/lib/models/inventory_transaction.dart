class InventoryTransaction {
  final String id;
  final String transactionNumber;
  final String transactionType;
  final String status;
  final String? warehouseId;
  final String? fromWarehouseId;
  final String? toWarehouseId;
  final DateTime transactionDate;
  final String? referenceNumber;
  final String? notes;
  final String? createdBy;
  final String? approvedBy;
  final DateTime? approvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String companyId;

  InventoryTransaction({
    required this.id,
    required this.transactionNumber,
    required this.transactionType,
    required this.status,
    this.warehouseId,
    this.fromWarehouseId,
    this.toWarehouseId,
    required this.transactionDate,
    this.referenceNumber,
    this.notes,
    this.createdBy,
    this.approvedBy,
    this.approvedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.companyId,
  });

  factory InventoryTransaction.fromJson(Map<String, dynamic> json) {
    return InventoryTransaction(
      id: json['id'] ?? '',
      transactionNumber: json['transaction_number'] ?? '',
      transactionType: json['transaction_type'] ?? 'giris',
      status: json['status'] ?? 'pending',
      warehouseId: json['warehouse_id'],
      fromWarehouseId: json['from_warehouse_id'],
      toWarehouseId: json['to_warehouse_id'],
      transactionDate: json['transaction_date'] != null
          ? DateTime.parse(json['transaction_date'])
          : DateTime.now(),
      referenceNumber: json['reference_number'],
      notes: json['notes'],
      createdBy: json['created_by'],
      approvedBy: json['approved_by'],
      approvedAt: json['approved_at'] != null
          ? DateTime.parse(json['approved_at'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transaction_number': transactionNumber,
      'transaction_type': transactionType,
      'status': status,
      'warehouse_id': warehouseId,
      'from_warehouse_id': fromWarehouseId,
      'to_warehouse_id': toWarehouseId,
      'transaction_date': transactionDate.toIso8601String(),
      'reference_number': referenceNumber,
      'notes': notes,
      'created_by': createdBy,
      'approved_by': approvedBy,
      'approved_at': approvedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }
}

