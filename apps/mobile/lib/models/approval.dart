class Approval {
  final String id;
  final String? companyId;
  final String objectType;
  final String objectId;
  final int step;
  final String? approverId;
  final String status;
  final DateTime? decidedAt;
  final String? comment;
  final DateTime createdAt;
  final DateTime updatedAt;

  Approval({
    required this.id,
    this.companyId,
    required this.objectType,
    required this.objectId,
    required this.step,
    this.approverId,
    required this.status,
    this.decidedAt,
    this.comment,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Approval.fromJson(Map<String, dynamic> json) {
    return Approval(
      id: json['id'] ?? '',
      companyId: json['company_id'],
      objectType: json['object_type'] ?? '',
      objectId: json['object_id'] ?? '',
      step: json['step'] ?? 1,
      approverId: json['approver_id'],
      status: json['status'] ?? 'pending',
      decidedAt: json['decided_at'] != null ? DateTime.parse(json['decided_at']) : null,
      comment: json['comment'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'company_id': companyId,
      'object_type': objectType,
      'object_id': objectId,
      'step': step,
      'approver_id': approverId,
      'status': status,
      'decided_at': decidedAt?.toIso8601String(),
      'comment': comment,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
}

