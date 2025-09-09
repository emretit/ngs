// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'service_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServiceRequest _$ServiceRequestFromJson(Map<String, dynamic> json) =>
    ServiceRequest(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: json['status'] as String,
      priority: json['priority'] as String,
      customerId: json['customerId'] as String?,
      serviceType: json['serviceType'] as String?,
      location: json['location'] as String?,
      dueDate: json['dueDate'] == null
          ? null
          : DateTime.parse(json['dueDate'] as String),
      assignedTo: json['assignedTo'] as String?,
      equipmentId: json['equipmentId'] as String?,
      notes:
          (json['notes'] as List<dynamic>?)?.map((e) => e as String).toList(),
      warrantyInfo: json['warrantyInfo'] as Map<String, dynamic>?,
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map((e) =>
                  ServiceRequestAttachment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      reportedDate: json['reportedDate'] as String?,
      companyId: json['companyId'] as String?,
      customer: json['customer'] == null
          ? null
          : Customer.fromJson(json['customer'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ServiceRequestToJson(ServiceRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'status': instance.status,
      'priority': instance.priority,
      'customerId': instance.customerId,
      'serviceType': instance.serviceType,
      'location': instance.location,
      'dueDate': instance.dueDate?.toIso8601String(),
      'assignedTo': instance.assignedTo,
      'equipmentId': instance.equipmentId,
      'notes': instance.notes,
      'warrantyInfo': instance.warrantyInfo,
      'attachments': instance.attachments,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'reportedDate': instance.reportedDate,
      'companyId': instance.companyId,
      'customer': instance.customer,
    };

ServiceRequestAttachment _$ServiceRequestAttachmentFromJson(
        Map<String, dynamic> json) =>
    ServiceRequestAttachment(
      name: json['name'] as String,
      path: json['path'] as String,
      type: json['type'] as String,
      size: (json['size'] as num).toInt(),
    );

Map<String, dynamic> _$ServiceRequestAttachmentToJson(
        ServiceRequestAttachment instance) =>
    <String, dynamic>{
      'name': instance.name,
      'path': instance.path,
      'type': instance.type,
      'size': instance.size,
    };

Customer _$CustomerFromJson(Map<String, dynamic> json) => Customer(
      id: json['id'] as String,
      name: json['name'] as String,
      company: json['company'] as String?,
      mobilePhone: json['mobilePhone'] as String?,
      officePhone: json['officePhone'] as String?,
      address: json['address'] as String?,
    );

Map<String, dynamic> _$CustomerToJson(Customer instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'company': instance.company,
      'mobilePhone': instance.mobilePhone,
      'officePhone': instance.officePhone,
      'address': instance.address,
    };
