class Warehouse {
  final String id;
  final String name;
  final String? code;
  final String? address;
  final String? city;
  final String? district;
  final String country;
  final String? postalCode;
  final String? phone;
  final String? email;
  final String? managerName;
  final String? managerPhone;
  final String? managerEmail;
  final String warehouseType;
  final bool isActive;
  final double? capacity;
  final String capacityUnit;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? createdBy;
  final String? updatedBy;
  final String? companyId;

  Warehouse({
    required this.id,
    required this.name,
    this.code,
    this.address,
    this.city,
    this.district,
    required this.country,
    this.postalCode,
    this.phone,
    this.email,
    this.managerName,
    this.managerPhone,
    this.managerEmail,
    required this.warehouseType,
    required this.isActive,
    this.capacity,
    required this.capacityUnit,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.createdBy,
    this.updatedBy,
    this.companyId,
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) {
    return Warehouse(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'],
      address: json['address'],
      city: json['city'],
      district: json['district'],
      country: json['country'] ?? 'Turkey',
      postalCode: json['postal_code'],
      phone: json['phone'],
      email: json['email'],
      managerName: json['manager_name'],
      managerPhone: json['manager_phone'],
      managerEmail: json['manager_email'],
      warehouseType: json['warehouse_type'] ?? 'main',
      isActive: json['is_active'] ?? true,
      capacity: json['capacity'] != null ? (json['capacity'] as num).toDouble() : null,
      capacityUnit: json['capacity_unit'] ?? 'm2',
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      createdBy: json['created_by'],
      updatedBy: json['updated_by'],
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'address': address,
      'city': city,
      'district': district,
      'country': country,
      'postal_code': postalCode,
      'phone': phone,
      'email': email,
      'manager_name': managerName,
      'manager_phone': managerPhone,
      'manager_email': managerEmail,
      'warehouse_type': warehouseType,
      'is_active': isActive,
      'capacity': capacity,
      'capacity_unit': capacityUnit,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'created_by': createdBy,
      'updated_by': updatedBy,
      'company_id': companyId,
    };
  }
}

