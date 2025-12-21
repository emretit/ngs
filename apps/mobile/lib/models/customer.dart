/// Customer Model
/// Web app'teki customer tipine uyumlu
class Customer {
  final String id;
  final String name;
  final String? email;
  final String? mobilePhone;
  final String? officePhone;
  final String? company;
  final String type; // bireysel, kurumsal
  final String status; // aktif, pasif, potansiyel
  final String? representative;
  final double? balance;
  final String? address;
  final String? taxNumber;
  final String? taxOffice;
  final String? city;
  final String? district;
  final String? einvoiceAliasName;
  final String? website;
  final String? country;
  final String? postalCode;
  final String? fax;
  final String? bankName;
  final String? iban;
  final String? accountNumber;
  final String? tradeRegistryNumber;
  final String? mersisNumber;
  final String? establishmentDate;
  final String? sector;
  final String? customerSegment;
  final String? customerSource;
  final String? notes;
  final String? firstContactPosition;
  final String? secondContactName;
  final String? secondContactEmail;
  final String? secondContactPhone;
  final String? secondContactPosition;
  final String? secondAddress;
  final String? secondCity;
  final String? secondDistrict;
  final String? secondCountry;
  final String? secondPostalCode;
  final String? paymentTerms;
  final bool isEinvoiceMukellef;
  final DateTime? lastInteraction;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;

  Customer({
    required this.id,
    required this.name,
    this.email,
    this.mobilePhone,
    this.officePhone,
    this.company,
    required this.type,
    required this.status,
    this.representative,
    this.balance,
    this.address,
    this.taxNumber,
    this.taxOffice,
    this.city,
    this.district,
    this.einvoiceAliasName,
    this.website,
    this.country,
    this.postalCode,
    this.fax,
    this.bankName,
    this.iban,
    this.accountNumber,
    this.tradeRegistryNumber,
    this.mersisNumber,
    this.establishmentDate,
    this.sector,
    this.customerSegment,
    this.customerSource,
    this.notes,
    this.firstContactPosition,
    this.secondContactName,
    this.secondContactEmail,
    this.secondContactPhone,
    this.secondContactPosition,
    this.secondAddress,
    this.secondCity,
    this.secondDistrict,
    this.secondCountry,
    this.secondPostalCode,
    this.paymentTerms,
    this.isEinvoiceMukellef = false,
    this.lastInteraction,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      mobilePhone: json['mobile_phone'],
      officePhone: json['office_phone'],
      company: json['company'],
      type: json['type'] ?? 'bireysel',
      status: json['status'] ?? 'potansiyel',
      representative: json['representative'],
      balance: json['balance'] != null ? (json['balance']).toDouble() : 0.0,
      address: json['address'],
      taxNumber: json['tax_number'],
      taxOffice: json['tax_office'],
      city: json['city'],
      district: json['district'],
      einvoiceAliasName: json['einvoice_alias_name'],
      website: json['website'],
      country: json['country'],
      postalCode: json['postal_code'],
      fax: json['fax'],
      bankName: json['bank_name'],
      iban: json['iban'],
      accountNumber: json['account_number'],
      tradeRegistryNumber: json['trade_registry_number'],
      mersisNumber: json['mersis_number'],
      establishmentDate: json['establishment_date'],
      sector: json['sector'],
      customerSegment: json['customer_segment'],
      customerSource: json['customer_source'],
      notes: json['notes'],
      firstContactPosition: json['first_contact_position'],
      secondContactName: json['second_contact_name'],
      secondContactEmail: json['second_contact_email'],
      secondContactPhone: json['second_contact_phone'],
      secondContactPosition: json['second_contact_position'],
      secondAddress: json['second_address'],
      secondCity: json['second_city'],
      secondDistrict: json['second_district'],
      secondCountry: json['second_country'],
      secondPostalCode: json['second_postal_code'],
      paymentTerms: json['payment_terms'],
      isEinvoiceMukellef: json['is_einvoice_mukellef'] ?? false,
      lastInteraction: json['last_interaction'] != null
          ? DateTime.parse(json['last_interaction'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'mobile_phone': mobilePhone,
      'office_phone': officePhone,
      'company': company,
      'type': type,
      'status': status,
      'representative': representative,
      'balance': balance,
      'address': address,
      'tax_number': taxNumber,
      'tax_office': taxOffice,
      'city': city,
      'district': district,
      'einvoice_alias_name': einvoiceAliasName,
      'website': website,
      'country': country,
      'postal_code': postalCode,
      'fax': fax,
      'bank_name': bankName,
      'iban': iban,
      'account_number': accountNumber,
      'trade_registry_number': tradeRegistryNumber,
      'mersis_number': mersisNumber,
      'establishment_date': establishmentDate,
      'sector': sector,
      'customer_segment': customerSegment,
      'customer_source': customerSource,
      'notes': notes,
      'first_contact_position': firstContactPosition,
      'second_contact_name': secondContactName,
      'second_contact_email': secondContactEmail,
      'second_contact_phone': secondContactPhone,
      'second_contact_position': secondContactPosition,
      'second_address': secondAddress,
      'second_city': secondCity,
      'second_district': secondDistrict,
      'second_country': secondCountry,
      'second_postal_code': secondPostalCode,
      'payment_terms': paymentTerms,
      'is_einvoice_mukellef': isEinvoiceMukellef,
      'last_interaction': lastInteraction?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };
  }

  Customer copyWith({
    String? id,
    String? name,
    String? email,
    String? mobilePhone,
    String? officePhone,
    String? company,
    String? type,
    String? status,
    String? representative,
    double? balance,
    String? address,
    String? taxNumber,
    String? taxOffice,
    String? city,
    String? district,
    String? einvoiceAliasName,
    String? website,
    String? country,
    String? postalCode,
    String? fax,
    String? bankName,
    String? iban,
    String? accountNumber,
    String? tradeRegistryNumber,
    String? mersisNumber,
    String? establishmentDate,
    String? sector,
    String? customerSegment,
    String? customerSource,
    String? notes,
    String? firstContactPosition,
    String? secondContactName,
    String? secondContactEmail,
    String? secondContactPhone,
    String? secondContactPosition,
    String? secondAddress,
    String? secondCity,
    String? secondDistrict,
    String? secondCountry,
    String? secondPostalCode,
    String? paymentTerms,
    bool? isEinvoiceMukellef,
    DateTime? lastInteraction,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? companyId,
  }) {
    return Customer(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      mobilePhone: mobilePhone ?? this.mobilePhone,
      officePhone: officePhone ?? this.officePhone,
      company: company ?? this.company,
      type: type ?? this.type,
      status: status ?? this.status,
      representative: representative ?? this.representative,
      balance: balance ?? this.balance,
      address: address ?? this.address,
      taxNumber: taxNumber ?? this.taxNumber,
      taxOffice: taxOffice ?? this.taxOffice,
      city: city ?? this.city,
      district: district ?? this.district,
      einvoiceAliasName: einvoiceAliasName ?? this.einvoiceAliasName,
      website: website ?? this.website,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      fax: fax ?? this.fax,
      bankName: bankName ?? this.bankName,
      iban: iban ?? this.iban,
      accountNumber: accountNumber ?? this.accountNumber,
      tradeRegistryNumber: tradeRegistryNumber ?? this.tradeRegistryNumber,
      mersisNumber: mersisNumber ?? this.mersisNumber,
      establishmentDate: establishmentDate ?? this.establishmentDate,
      sector: sector ?? this.sector,
      customerSegment: customerSegment ?? this.customerSegment,
      customerSource: customerSource ?? this.customerSource,
      notes: notes ?? this.notes,
      firstContactPosition: firstContactPosition ?? this.firstContactPosition,
      secondContactName: secondContactName ?? this.secondContactName,
      secondContactEmail: secondContactEmail ?? this.secondContactEmail,
      secondContactPhone: secondContactPhone ?? this.secondContactPhone,
      secondContactPosition: secondContactPosition ?? this.secondContactPosition,
      secondAddress: secondAddress ?? this.secondAddress,
      secondCity: secondCity ?? this.secondCity,
      secondDistrict: secondDistrict ?? this.secondDistrict,
      secondCountry: secondCountry ?? this.secondCountry,
      secondPostalCode: secondPostalCode ?? this.secondPostalCode,
      paymentTerms: paymentTerms ?? this.paymentTerms,
      isEinvoiceMukellef: isEinvoiceMukellef ?? this.isEinvoiceMukellef,
      lastInteraction: lastInteraction ?? this.lastInteraction,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      companyId: companyId ?? this.companyId,
    );
  }
}

