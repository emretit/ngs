class Activity {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final DateTime? dueDate;
  final String? assigneeId;
  final String? relatedItemId;
  final String? relatedItemType;
  final String? relatedItemTitle;
  final String? opportunityId;
  final String type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  Activity({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.dueDate,
    this.assigneeId,
    this.relatedItemId,
    this.relatedItemType,
    this.relatedItemTitle,
    this.opportunityId,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'todo',
      priority: json['priority'] ?? 'medium',
      dueDate: json['due_date'] != null ? DateTime.parse(json['due_date']) : null,
      assigneeId: json['assignee_id'],
      relatedItemId: json['related_item_id'],
      relatedItemType: json['related_item_type'],
      relatedItemTitle: json['related_item_title'],
      opportunityId: json['opportunity_id'],
      type: json['type'] ?? 'general',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
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
      'due_date': dueDate?.toIso8601String(),
      'assignee_id': assigneeId,
      'related_item_id': relatedItemId,
      'related_item_type': relatedItemType,
      'related_item_title': relatedItemTitle,
      'opportunity_id': opportunityId,
      'type': type,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }

  bool get isOverdue {
    if (dueDate == null || status == 'completed') return false;
    return dueDate!.isBefore(DateTime.now());
  }

  bool get isToday {
    if (dueDate == null) return false;
    final now = DateTime.now();
    return dueDate!.year == now.year &&
           dueDate!.month == now.month &&
           dueDate!.day == now.day;
  }
}

