class EmployeeLeave {
  final String id;
  final String employeeId;
  final String leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final String? reason;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  EmployeeLeave({
    required this.id,
    required this.employeeId,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.reason,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory EmployeeLeave.fromJson(Map<String, dynamic> json) {
    return EmployeeLeave(
      id: json['id'] ?? '',
      employeeId: json['employee_id'] ?? '',
      leaveType: json['leave_type'] ?? '',
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      status: json['status'] ?? 'pending',
      reason: json['reason'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'leave_type': leaveType,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
      'status': status,
      'reason': reason,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }
}

