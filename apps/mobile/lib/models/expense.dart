class Expense {
  final String id;
  final String type;
  final double amount;
  final String categoryId;
  final DateTime date;
  final String? description;
  final String? attachmentUrl;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String expenseType;
  final String? employeeId;
  final bool isPaid;
  final DateTime? paidDate;
  final bool isRecurring;
  final String? recurrencePattern;
  final DateTime? recurrenceEndDate;
  final String? paymentAccountType;
  final String? paymentAccountId;
  final double? paymentAmount;
  final String? subcategory;
  final double? vatRate;
  final String? recurrenceType;
  final int? recurrenceInterval;
  final List<String>? recurrenceDays;
  final int? recurrenceDayOfMonth;
  final String? parentExpenseId;
  final bool isRecurringInstance;

  Expense({
    required this.id,
    required this.type,
    required this.amount,
    required this.categoryId,
    required this.date,
    this.description,
    this.attachmentUrl,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    required this.expenseType,
    this.employeeId,
    required this.isPaid,
    this.paidDate,
    required this.isRecurring,
    this.recurrencePattern,
    this.recurrenceEndDate,
    this.paymentAccountType,
    this.paymentAccountId,
    this.paymentAmount,
    this.subcategory,
    this.vatRate,
    this.recurrenceType,
    this.recurrenceInterval,
    this.recurrenceDays,
    this.recurrenceDayOfMonth,
    this.parentExpenseId,
    required this.isRecurringInstance,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'] ?? '',
      type: json['type'] ?? 'expense',
      amount: (json['amount'] ?? 0).toDouble(),
      categoryId: json['category_id'] ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'])
          : DateTime.now(),
      description: json['description'],
      attachmentUrl: json['attachment_url'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      expenseType: json['expense_type'] ?? 'company',
      employeeId: json['employee_id'],
      isPaid: json['is_paid'] ?? false,
      paidDate: json['paid_date'] != null
          ? DateTime.parse(json['paid_date'])
          : null,
      isRecurring: json['is_recurring'] ?? false,
      recurrencePattern: json['recurrence_pattern'],
      recurrenceEndDate: json['recurrence_end_date'] != null
          ? DateTime.parse(json['recurrence_end_date'])
          : null,
      paymentAccountType: json['payment_account_type'],
      paymentAccountId: json['payment_account_id'],
      paymentAmount: json['payment_amount'] != null
          ? (json['payment_amount'] as num).toDouble()
          : null,
      subcategory: json['subcategory'],
      vatRate: json['vat_rate'] != null ? (json['vat_rate'] as num).toDouble() : null,
      recurrenceType: json['recurrence_type'],
      recurrenceInterval: json['recurrence_interval'],
      recurrenceDays: json['recurrence_days'] != null
          ? List<String>.from(json['recurrence_days'])
          : null,
      recurrenceDayOfMonth: json['recurrence_day_of_month'],
      parentExpenseId: json['parent_expense_id'],
      isRecurringInstance: json['is_recurring_instance'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'amount': amount,
      'category_id': categoryId,
      'date': date.toIso8601String(),
      'description': description,
      'attachment_url': attachmentUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'expense_type': expenseType,
      'employee_id': employeeId,
      'is_paid': isPaid,
      'paid_date': paidDate?.toIso8601String(),
      'is_recurring': isRecurring,
      'recurrence_pattern': recurrencePattern,
      'recurrence_end_date': recurrenceEndDate?.toIso8601String(),
      'payment_account_type': paymentAccountType,
      'payment_account_id': paymentAccountId,
      'payment_amount': paymentAmount,
      'subcategory': subcategory,
      'vat_rate': vatRate,
      'recurrence_type': recurrenceType,
      'recurrence_interval': recurrenceInterval,
      'recurrence_days': recurrenceDays,
      'recurrence_day_of_month': recurrenceDayOfMonth,
      'parent_expense_id': parentExpenseId,
      'is_recurring_instance': isRecurringInstance,
    };
  }
}

