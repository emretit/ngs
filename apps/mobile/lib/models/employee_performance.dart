class EmployeePerformance {
  final String id;
  final String? employeeId;
  final DateTime reviewDate;
  final String reviewType;
  final Map<String, dynamic> metrics;
  final String? feedback;
  final int? rating;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  EmployeePerformance({
    required this.id,
    this.employeeId,
    required this.reviewDate,
    required this.reviewType,
    required this.metrics,
    this.feedback,
    this.rating,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory EmployeePerformance.fromJson(Map<String, dynamic> json) {
    return EmployeePerformance(
      id: json['id'] ?? '',
      employeeId: json['employee_id'],
      reviewDate: DateTime.parse(json['review_date']),
      reviewType: json['review_type'] ?? '',
      metrics: Map<String, dynamic>.from(json['metrics'] ?? {}),
      feedback: json['feedback'],
      rating: json['rating'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'review_date': reviewDate.toIso8601String(),
      'review_type': reviewType,
      'metrics': metrics,
      'feedback': feedback,
      'rating': rating,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }
}

