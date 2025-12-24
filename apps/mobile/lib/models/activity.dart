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
  final bool? isImportant;
  final bool? isRecurring;
  final String? recurrenceType;
  final int? recurrenceInterval;
  final DateTime? recurrenceEndDate;
  final List<String>? recurrenceDays;
  final int? recurrenceDayOfMonth;

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
    this.isImportant,
    this.isRecurring,
    this.recurrenceType,
    this.recurrenceInterval,
    this.recurrenceEndDate,
    this.recurrenceDays,
    this.recurrenceDayOfMonth,
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
      isImportant: json['is_important'] as bool?,
      isRecurring: json['is_recurring'] as bool?,
      recurrenceType: json['recurrence_type'],
      recurrenceInterval: json['recurrence_interval'] as int?,
      recurrenceEndDate: json['recurrence_end_date'] != null ? DateTime.parse(json['recurrence_end_date']) : null,
      recurrenceDays: json['recurrence_days'] != null ? List<String>.from(json['recurrence_days']) : null,
      recurrenceDayOfMonth: json['recurrence_day_of_month'] as int?,
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
      'is_important': isImportant,
      'is_recurring': isRecurring,
      'recurrence_type': recurrenceType,
      'recurrence_interval': recurrenceInterval,
      'recurrence_end_date': recurrenceEndDate?.toIso8601String(),
      'recurrence_days': recurrenceDays,
      'recurrence_day_of_month': recurrenceDayOfMonth,
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

