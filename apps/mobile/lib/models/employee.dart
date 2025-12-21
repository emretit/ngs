class Employee {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String position;
  final String department;
  final DateTime hireDate;
  final String status;
  final String? avatarUrl;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? maritalStatus;
  final String? address;
  final String? city;
  final String? district;
  final String? postalCode;
  final String country;
  final String? idSsn;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? emergencyContactRelation;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String? userId;
  final String? neighborhood;
  final int? cityId;
  final int? districtId;
  final int? neighborhoodId;
  final String? addressLine;
  final String? paymentFrequency;
  final double? salaryAmount;
  final String? salaryCurrency;
  final String? salaryType;
  final DateTime? salaryStartDate;
  final String? salaryNotes;
  final double? grossSalary;
  final double? netSalary;
  final Map<String, dynamic>? allowances;
  final DateTime? effectiveDate;
  final double? sgkEmployerRate;
  final double? unemploymentEmployerRate;
  final double? accidentInsuranceRate;
  final double? stampTax;
  final double? severanceProvision;
  final double? bonusProvision;
  final double? totalEmployerCost;
  final double? sgkEmployerAmount;
  final bool? calculateAsMinimumWage;
  final String? salaryInputType;
  final double? mealAllowance;
  final double? transportAllowance;
  final double? sgkEmployeeRate;
  final double? sgkEmployeeAmount;
  final double? unemploymentEmployeeRate;
  final double? unemploymentEmployeeAmount;
  final double? incomeTaxAmount;
  final double? stampTaxRate;
  final double? stampTaxAmount;
  final double? totalDeductions;
  final double? cumulativeYearlyGross;
  final double? cumulativeYearlyTax;
  final int? taxYear;
  final double? manualEmployerSgkCost;
  final double balance;
  final String? apartmentNumber;
  final String? unitNumber;
  final bool isTechnical;

  Employee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    required this.position,
    required this.department,
    required this.hireDate,
    required this.status,
    this.avatarUrl,
    this.dateOfBirth,
    this.gender,
    this.maritalStatus,
    this.address,
    this.city,
    this.district,
    this.postalCode,
    required this.country,
    this.idSsn,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.emergencyContactRelation,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    this.userId,
    this.neighborhood,
    this.cityId,
    this.districtId,
    this.neighborhoodId,
    this.addressLine,
    this.paymentFrequency,
    this.salaryAmount,
    this.salaryCurrency,
    this.salaryType,
    this.salaryStartDate,
    this.salaryNotes,
    this.grossSalary,
    this.netSalary,
    this.allowances,
    this.effectiveDate,
    this.sgkEmployerRate,
    this.unemploymentEmployerRate,
    this.accidentInsuranceRate,
    this.stampTax,
    this.severanceProvision,
    this.bonusProvision,
    this.totalEmployerCost,
    this.sgkEmployerAmount,
    this.calculateAsMinimumWage,
    this.salaryInputType,
    this.mealAllowance,
    this.transportAllowance,
    this.sgkEmployeeRate,
    this.sgkEmployeeAmount,
    this.unemploymentEmployeeRate,
    this.unemploymentEmployeeAmount,
    this.incomeTaxAmount,
    this.stampTaxRate,
    this.stampTaxAmount,
    this.totalDeductions,
    this.cumulativeYearlyGross,
    this.cumulativeYearlyTax,
    this.taxYear,
    this.manualEmployerSgkCost,
    required this.balance,
    this.apartmentNumber,
    this.unitNumber,
    required this.isTechnical,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      position: json['position'] ?? '',
      department: json['department'] ?? '',
      hireDate: json['hire_date'] != null
          ? DateTime.parse(json['hire_date'])
          : DateTime.now(),
      status: json['status'] ?? 'aktif',
      avatarUrl: json['avatar_url'],
      dateOfBirth: json['date_of_birth'] != null
          ? DateTime.parse(json['date_of_birth'])
          : null,
      gender: json['gender'],
      maritalStatus: json['marital_status'],
      address: json['address'],
      city: json['city'],
      district: json['district'],
      postalCode: json['postal_code'],
      country: json['country'] ?? 'Turkey',
      idSsn: json['id_ssn'],
      emergencyContactName: json['emergency_contact_name'],
      emergencyContactPhone: json['emergency_contact_phone'],
      emergencyContactRelation: json['emergency_contact_relation'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      userId: json['user_id'],
      neighborhood: json['neighborhood'],
      cityId: json['city_id'],
      districtId: json['district_id'],
      neighborhoodId: json['neighborhood_id'],
      addressLine: json['address_line'],
      paymentFrequency: json['payment_frequency'],
      salaryAmount: json['salary_amount'] != null
          ? (json['salary_amount'] as num).toDouble()
          : null,
      salaryCurrency: json['salary_currency'],
      salaryType: json['salary_type'],
      salaryStartDate: json['salary_start_date'] != null
          ? DateTime.parse(json['salary_start_date'])
          : null,
      salaryNotes: json['salary_notes'],
      grossSalary: json['gross_salary'] != null
          ? (json['gross_salary'] as num).toDouble()
          : null,
      netSalary: json['net_salary'] != null
          ? (json['net_salary'] as num).toDouble()
          : null,
      allowances: json['allowances'] != null
          ? Map<String, dynamic>.from(json['allowances'])
          : null,
      effectiveDate: json['effective_date'] != null
          ? DateTime.parse(json['effective_date'])
          : null,
      sgkEmployerRate: json['sgk_employer_rate'] != null
          ? (json['sgk_employer_rate'] as num).toDouble()
          : null,
      unemploymentEmployerRate: json['unemployment_employer_rate'] != null
          ? (json['unemployment_employer_rate'] as num).toDouble()
          : null,
      accidentInsuranceRate: json['accident_insurance_rate'] != null
          ? (json['accident_insurance_rate'] as num).toDouble()
          : null,
      stampTax: json['stamp_tax'] != null ? (json['stamp_tax'] as num).toDouble() : null,
      severanceProvision: json['severance_provision'] != null
          ? (json['severance_provision'] as num).toDouble()
          : null,
      bonusProvision: json['bonus_provision'] != null
          ? (json['bonus_provision'] as num).toDouble()
          : null,
      totalEmployerCost: json['total_employer_cost'] != null
          ? (json['total_employer_cost'] as num).toDouble()
          : null,
      sgkEmployerAmount: json['sgk_employer_amount'] != null
          ? (json['sgk_employer_amount'] as num).toDouble()
          : null,
      calculateAsMinimumWage: json['calculate_as_minimum_wage'],
      salaryInputType: json['salary_input_type'],
      mealAllowance: json['meal_allowance'] != null
          ? (json['meal_allowance'] as num).toDouble()
          : null,
      transportAllowance: json['transport_allowance'] != null
          ? (json['transport_allowance'] as num).toDouble()
          : null,
      sgkEmployeeRate: json['sgk_employee_rate'] != null
          ? (json['sgk_employee_rate'] as num).toDouble()
          : null,
      sgkEmployeeAmount: json['sgk_employee_amount'] != null
          ? (json['sgk_employee_amount'] as num).toDouble()
          : null,
      unemploymentEmployeeRate: json['unemployment_employee_rate'] != null
          ? (json['unemployment_employee_rate'] as num).toDouble()
          : null,
      unemploymentEmployeeAmount: json['unemployment_employee_amount'] != null
          ? (json['unemployment_employee_amount'] as num).toDouble()
          : null,
      incomeTaxAmount: json['income_tax_amount'] != null
          ? (json['income_tax_amount'] as num).toDouble()
          : null,
      stampTaxRate: json['stamp_tax_rate'] != null
          ? (json['stamp_tax_rate'] as num).toDouble()
          : null,
      stampTaxAmount: json['stamp_tax_amount'] != null
          ? (json['stamp_tax_amount'] as num).toDouble()
          : null,
      totalDeductions: json['total_deductions'] != null
          ? (json['total_deductions'] as num).toDouble()
          : null,
      cumulativeYearlyGross: json['cumulative_yearly_gross'] != null
          ? (json['cumulative_yearly_gross'] as num).toDouble()
          : null,
      cumulativeYearlyTax: json['cumulative_yearly_tax'] != null
          ? (json['cumulative_yearly_tax'] as num).toDouble()
          : null,
      taxYear: json['tax_year'],
      manualEmployerSgkCost: json['manual_employer_sgk_cost'] != null
          ? (json['manual_employer_sgk_cost'] as num).toDouble()
          : null,
      balance: (json['balance'] ?? 0).toDouble(),
      apartmentNumber: json['apartment_number'],
      unitNumber: json['unit_number'],
      isTechnical: json['is_technical'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'position': position,
      'department': department,
      'hire_date': hireDate.toIso8601String(),
      'status': status,
      'avatar_url': avatarUrl,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'marital_status': maritalStatus,
      'address': address,
      'city': city,
      'district': district,
      'postal_code': postalCode,
      'country': country,
      'id_ssn': idSsn,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'emergency_contact_relation': emergencyContactRelation,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'user_id': userId,
      'neighborhood': neighborhood,
      'city_id': cityId,
      'district_id': districtId,
      'neighborhood_id': neighborhoodId,
      'address_line': addressLine,
      'payment_frequency': paymentFrequency,
      'salary_amount': salaryAmount,
      'salary_currency': salaryCurrency,
      'salary_type': salaryType,
      'salary_start_date': salaryStartDate?.toIso8601String(),
      'salary_notes': salaryNotes,
      'gross_salary': grossSalary,
      'net_salary': netSalary,
      'allowances': allowances,
      'effective_date': effectiveDate?.toIso8601String(),
      'sgk_employer_rate': sgkEmployerRate,
      'unemployment_employer_rate': unemploymentEmployerRate,
      'accident_insurance_rate': accidentInsuranceRate,
      'stamp_tax': stampTax,
      'severance_provision': severanceProvision,
      'bonus_provision': bonusProvision,
      'total_employer_cost': totalEmployerCost,
      'sgk_employer_amount': sgkEmployerAmount,
      'calculate_as_minimum_wage': calculateAsMinimumWage,
      'salary_input_type': salaryInputType,
      'meal_allowance': mealAllowance,
      'transport_allowance': transportAllowance,
      'sgk_employee_rate': sgkEmployeeRate,
      'sgk_employee_amount': sgkEmployeeAmount,
      'unemployment_employee_rate': unemploymentEmployeeRate,
      'unemployment_employee_amount': unemploymentEmployeeAmount,
      'income_tax_amount': incomeTaxAmount,
      'stamp_tax_rate': stampTaxRate,
      'stamp_tax_amount': stampTaxAmount,
      'total_deductions': totalDeductions,
      'cumulative_yearly_gross': cumulativeYearlyGross,
      'cumulative_yearly_tax': cumulativeYearlyTax,
      'tax_year': taxYear,
      'manual_employer_sgk_cost': manualEmployerSgkCost,
      'balance': balance,
      'apartment_number': apartmentNumber,
      'unit_number': unitNumber,
      'is_technical': isTechnical,
    };
  }

  String get fullName => '$firstName $lastName';
}

