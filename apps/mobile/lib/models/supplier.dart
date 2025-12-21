class Supplier {
  final String id;
  final String name;
  final String? email;
  final String? mobilePhone;
  final String? officePhone;
  final String? company;
  final String type;
  final String status;
  final double balance;
  final String? address;
  final String? taxNumber;
  final String? taxOffice;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String? city;
  final String? district;
  final String? country;
  final String? postalCode;
  final String? fax;
  final String? website;
  final bool isActive;
  final String? payeeFinancialAccountId;
  final String? paymentMeansChannelCode;
  final String? paymentMeansCode;
  final Map<String, dynamic>? aliases;
  final String? einvoiceAliasName;
  final String? bankName;
  final String? iban;
  final String? accountNumber;
  final String? tradeRegistryNumber;
  final String? mersisNumber;
  final DateTime? lastInteraction;
  final bool isEinvoiceMukellef;
  final String? einvoiceCompanyName;
  final String? einvoiceTaxOffice;
  final String? einvoiceAddress;
  final String? einvoiceCity;
  final String? einvoiceDistrict;
  final String? einvoiceMersisNo;
  final String? einvoiceSicilNo;
  final DateTime? einvoiceCheckedAt;
  final String? representative;
  final int? cityId;
  final int? districtId;
  final int? neighborhoodId;
  final String? addressLine;
  final String? secondContactName;
  final String? secondContactEmail;
  final String? secondContactPhone;
  final String? secondContactPosition;
  final String? firstContactPosition;
  final String? secondAddress;
  final String? secondCity;
  final String? secondDistrict;
  final String? secondCountry;
  final String? secondPostalCode;
  final DateTime? establishmentDate;
  final String? sector;
  final String? supplierSegment;
  final String? supplierSource;
  final String? notes;
  final String? paymentTerms;
  final String? apartmentNumber;
  final String? unitNumber;
  final bool portalEnabled;
  final String? portalEmail;
  final DateTime? lastPortalLogin;

  Supplier({
    required this.id,
    required this.name,
    this.email,
    this.mobilePhone,
    this.officePhone,
    this.company,
    required this.type,
    required this.status,
    required this.balance,
    this.address,
    this.taxNumber,
    this.taxOffice,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    this.city,
    this.district,
    this.country,
    this.postalCode,
    this.fax,
    this.website,
    required this.isActive,
    this.payeeFinancialAccountId,
    this.paymentMeansChannelCode,
    this.paymentMeansCode,
    this.aliases,
    this.einvoiceAliasName,
    this.bankName,
    this.iban,
    this.accountNumber,
    this.tradeRegistryNumber,
    this.mersisNumber,
    this.lastInteraction,
    required this.isEinvoiceMukellef,
    this.einvoiceCompanyName,
    this.einvoiceTaxOffice,
    this.einvoiceAddress,
    this.einvoiceCity,
    this.einvoiceDistrict,
    this.einvoiceMersisNo,
    this.einvoiceSicilNo,
    this.einvoiceCheckedAt,
    this.representative,
    this.cityId,
    this.districtId,
    this.neighborhoodId,
    this.addressLine,
    this.secondContactName,
    this.secondContactEmail,
    this.secondContactPhone,
    this.secondContactPosition,
    this.firstContactPosition,
    this.secondAddress,
    this.secondCity,
    this.secondDistrict,
    this.secondCountry,
    this.secondPostalCode,
    this.establishmentDate,
    this.sector,
    this.supplierSegment,
    this.supplierSource,
    this.notes,
    this.paymentTerms,
    this.apartmentNumber,
    this.unitNumber,
    required this.portalEnabled,
    this.portalEmail,
    this.lastPortalLogin,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      mobilePhone: json['mobile_phone'],
      officePhone: json['office_phone'],
      company: json['company'],
      type: json['type'] ?? 'bireysel',
      status: json['status'] ?? 'potansiyel',
      balance: (json['balance'] ?? 0).toDouble(),
      address: json['address'],
      taxNumber: json['tax_number'],
      taxOffice: json['tax_office'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      city: json['city'],
      district: json['district'],
      country: json['country'],
      postalCode: json['postal_code'],
      fax: json['fax'],
      website: json['website'],
      isActive: json['is_active'] ?? true,
      payeeFinancialAccountId: json['payee_financial_account_id'],
      paymentMeansChannelCode: json['payment_means_channel_code'],
      paymentMeansCode: json['payment_means_code'],
      aliases: json['aliases'] != null
          ? Map<String, dynamic>.from(json['aliases'])
          : null,
      einvoiceAliasName: json['einvoice_alias_name'],
      bankName: json['bank_name'],
      iban: json['iban'],
      accountNumber: json['account_number'],
      tradeRegistryNumber: json['trade_registry_number'],
      mersisNumber: json['mersis_number'],
      lastInteraction: json['last_interaction'] != null
          ? DateTime.parse(json['last_interaction'])
          : null,
      isEinvoiceMukellef: json['is_einvoice_mukellef'] ?? false,
      einvoiceCompanyName: json['einvoice_company_name'],
      einvoiceTaxOffice: json['einvoice_tax_office'],
      einvoiceAddress: json['einvoice_address'],
      einvoiceCity: json['einvoice_city'],
      einvoiceDistrict: json['einvoice_district'],
      einvoiceMersisNo: json['einvoice_mersis_no'],
      einvoiceSicilNo: json['einvoice_sicil_no'],
      einvoiceCheckedAt: json['einvoice_checked_at'] != null
          ? DateTime.parse(json['einvoice_checked_at'])
          : null,
      representative: json['representative'],
      cityId: json['city_id'],
      districtId: json['district_id'],
      neighborhoodId: json['neighborhood_id'],
      addressLine: json['address_line'],
      secondContactName: json['second_contact_name'],
      secondContactEmail: json['second_contact_email'],
      secondContactPhone: json['second_contact_phone'],
      secondContactPosition: json['second_contact_position'],
      firstContactPosition: json['first_contact_position'],
      secondAddress: json['second_address'],
      secondCity: json['second_city'],
      secondDistrict: json['second_district'],
      secondCountry: json['second_country'],
      secondPostalCode: json['second_postal_code'],
      establishmentDate: json['establishment_date'] != null
          ? DateTime.parse(json['establishment_date'])
          : null,
      sector: json['sector'],
      supplierSegment: json['supplier_segment'],
      supplierSource: json['supplier_source'],
      notes: json['notes'],
      paymentTerms: json['payment_terms'],
      apartmentNumber: json['apartment_number'],
      unitNumber: json['unit_number'],
      portalEnabled: json['portal_enabled'] ?? false,
      portalEmail: json['portal_email'],
      lastPortalLogin: json['last_portal_login'] != null
          ? DateTime.parse(json['last_portal_login'])
          : null,
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
      'balance': balance,
      'address': address,
      'tax_number': taxNumber,
      'tax_office': taxOffice,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'city': city,
      'district': district,
      'country': country,
      'postal_code': postalCode,
      'fax': fax,
      'website': website,
      'is_active': isActive,
      'payee_financial_account_id': payeeFinancialAccountId,
      'payment_means_channel_code': paymentMeansChannelCode,
      'payment_means_code': paymentMeansCode,
      'aliases': aliases,
      'einvoice_alias_name': einvoiceAliasName,
      'bank_name': bankName,
      'iban': iban,
      'account_number': accountNumber,
      'trade_registry_number': tradeRegistryNumber,
      'mersis_number': mersisNumber,
      'last_interaction': lastInteraction?.toIso8601String(),
      'is_einvoice_mukellef': isEinvoiceMukellef,
      'einvoice_company_name': einvoiceCompanyName,
      'einvoice_tax_office': einvoiceTaxOffice,
      'einvoice_address': einvoiceAddress,
      'einvoice_city': einvoiceCity,
      'einvoice_district': einvoiceDistrict,
      'einvoice_mersis_no': einvoiceMersisNo,
      'einvoice_sicil_no': einvoiceSicilNo,
      'einvoice_checked_at': einvoiceCheckedAt?.toIso8601String(),
      'representative': representative,
      'city_id': cityId,
      'district_id': districtId,
      'neighborhood_id': neighborhoodId,
      'address_line': addressLine,
      'second_contact_name': secondContactName,
      'second_contact_email': secondContactEmail,
      'second_contact_phone': secondContactPhone,
      'second_contact_position': secondContactPosition,
      'first_contact_position': firstContactPosition,
      'second_address': secondAddress,
      'second_city': secondCity,
      'second_district': secondDistrict,
      'second_country': secondCountry,
      'second_postal_code': secondPostalCode,
      'establishment_date': establishmentDate?.toIso8601String(),
      'sector': sector,
      'supplier_segment': supplierSegment,
      'supplier_source': supplierSource,
      'notes': notes,
      'payment_terms': paymentTerms,
      'apartment_number': apartmentNumber,
      'unit_number': unitNumber,
      'portal_enabled': portalEnabled,
      'portal_email': portalEmail,
      'last_portal_login': lastPortalLogin?.toIso8601String(),
    };
  }
}

