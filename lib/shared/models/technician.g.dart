// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'technician.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Technician _$TechnicianFromJson(Map<String, dynamic> json) => Technician(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      position: json['position'] as String,
      department: json['department'] as String,
      status: json['status'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      hireDate: json['hireDate'] == null
          ? null
          : DateTime.parse(json['hireDate'] as String),
      address: json['address'] as String?,
      city: json['city'] as String?,
      companyId: json['companyId'] as String?,
    );

Map<String, dynamic> _$TechnicianToJson(Technician instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'email': instance.email,
      'phone': instance.phone,
      'position': instance.position,
      'department': instance.department,
      'status': instance.status,
      'avatarUrl': instance.avatarUrl,
      'hireDate': instance.hireDate?.toIso8601String(),
      'address': instance.address,
      'city': instance.city,
      'companyId': instance.companyId,
    };
