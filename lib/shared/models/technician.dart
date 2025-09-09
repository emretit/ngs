import 'package:json_annotation/json_annotation.dart';

part 'technician.g.dart';

@JsonSerializable()
class Technician {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String position;
  final String department;
  final String status;
  final String? avatarUrl;
  final DateTime? hireDate;
  final String? address;
  final String? city;
  final String? companyId;

  const Technician({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    required this.position,
    required this.department,
    required this.status,
    this.avatarUrl,
    this.hireDate,
    this.address,
    this.city,
    this.companyId,
  });

  factory Technician.fromJson(Map<String, dynamic> json) =>
      _$TechnicianFromJson(json);

  Map<String, dynamic> toJson() => _$TechnicianToJson(this);

  String get fullName => '$firstName $lastName';

  bool get isActive => status == 'aktif';

  Technician copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? position,
    String? department,
    String? status,
    String? avatarUrl,
    DateTime? hireDate,
    String? address,
    String? city,
    String? companyId,
  }) {
    return Technician(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      position: position ?? this.position,
      department: department ?? this.department,
      status: status ?? this.status,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      hireDate: hireDate ?? this.hireDate,
      address: address ?? this.address,
      city: city ?? this.city,
      companyId: companyId ?? this.companyId,
    );
  }
}
