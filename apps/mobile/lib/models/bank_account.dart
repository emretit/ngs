class BankAccount {
  final String id;
  final String accountName;
  final String bankName;
  final String? branchName;
  final String? accountNumber;
  final String? iban;
  final String? swiftCode;
  final String accountType;
  final String currency;
  final double? currentBalance;
  final double? availableBalance;
  final double? creditLimit;
  final double? interestRate;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isActive;
  final DateTime? lastTransactionDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? notes;
  final String? companyId;

  BankAccount({
    required this.id,
    required this.accountName,
    required this.bankName,
    this.branchName,
    this.accountNumber,
    this.iban,
    this.swiftCode,
    required this.accountType,
    required this.currency,
    this.currentBalance,
    this.availableBalance,
    this.creditLimit,
    this.interestRate,
    required this.startDate,
    this.endDate,
    required this.isActive,
    this.lastTransactionDate,
    required this.createdAt,
    required this.updatedAt,
    this.notes,
    this.companyId,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: json['id'] ?? '',
      accountName: json['account_name'] ?? '',
      bankName: json['bank_name'] ?? '',
      branchName: json['branch_name'],
      accountNumber: json['account_number'],
      iban: json['iban'],
      swiftCode: json['swift_code'],
      accountType: json['account_type'] ?? 'vadesiz',
      currency: json['currency'] ?? 'TRY',
      currentBalance: json['current_balance'] != null
          ? (json['current_balance'] as num).toDouble()
          : null,
      availableBalance: json['available_balance'] != null
          ? (json['available_balance'] as num).toDouble()
          : null,
      creditLimit: json['credit_limit'] != null
          ? (json['credit_limit'] as num).toDouble()
          : null,
      interestRate: json['interest_rate'] != null
          ? (json['interest_rate'] as num).toDouble()
          : null,
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : null,
      isActive: json['is_active'] ?? true,
      lastTransactionDate: json['last_transaction_date'] != null
          ? DateTime.parse(json['last_transaction_date'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      notes: json['notes'],
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'account_name': accountName,
      'bank_name': bankName,
      'branch_name': branchName,
      'account_number': accountNumber,
      'iban': iban,
      'swift_code': swiftCode,
      'account_type': accountType,
      'currency': currency,
      'current_balance': currentBalance,
      'available_balance': availableBalance,
      'credit_limit': creditLimit,
      'interest_rate': interestRate,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'is_active': isActive,
      'last_transaction_date': lastTransactionDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'notes': notes,
      'company_id': companyId,
    };
  }
}

