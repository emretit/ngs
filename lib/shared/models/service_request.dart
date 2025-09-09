import 'package:json_annotation/json_annotation.dart';

part 'service_request.g.dart';

@JsonSerializable()
class ServiceRequest {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final String? customerId;
  final String? serviceType;
  final String? location;
  final DateTime? dueDate;
  final String? assignedTo;
  final String? equipmentId;
  final List<String>? notes;
  final Map<String, dynamic>? warrantyInfo;
  final List<ServiceRequestAttachment> attachments;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? reportedDate;
  final String? companyId;
  
  // İlişkili veriler
  final Customer? customer;

  const ServiceRequest({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.customerId,
    this.serviceType,
    this.location,
    this.dueDate,
    this.assignedTo,
    this.equipmentId,
    this.notes,
    this.warrantyInfo,
    this.attachments = const [],
    this.createdAt,
    this.updatedAt,
    this.reportedDate,
    this.companyId,
    this.customer,
  });

  factory ServiceRequest.fromJson(Map<String, dynamic> json) =>
      _$ServiceRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceRequestToJson(this);

  ServiceRequest copyWith({
    String? id,
    String? title,
    String? description,
    String? status,
    String? priority,
    String? customerId,
    String? serviceType,
    String? location,
    DateTime? dueDate,
    String? assignedTo,
    String? equipmentId,
    List<String>? notes,
    Map<String, dynamic>? warrantyInfo,
    List<ServiceRequestAttachment>? attachments,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? reportedDate,
    String? companyId,
    Customer? customer,
  }) {
    return ServiceRequest(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      customerId: customerId ?? this.customerId,
      serviceType: serviceType ?? this.serviceType,
      location: location ?? this.location,
      dueDate: dueDate ?? this.dueDate,
      assignedTo: assignedTo ?? this.assignedTo,
      equipmentId: equipmentId ?? this.equipmentId,
      notes: notes ?? this.notes,
      warrantyInfo: warrantyInfo ?? this.warrantyInfo,
      attachments: attachments ?? this.attachments,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      reportedDate: reportedDate ?? this.reportedDate,
      companyId: companyId ?? this.companyId,
      customer: customer ?? this.customer,
    );
  }
}

@JsonSerializable()
class ServiceRequestAttachment {
  final String name;
  final String path;
  final String type;
  final int size;

  const ServiceRequestAttachment({
    required this.name,
    required this.path,
    required this.type,
    required this.size,
  });

  factory ServiceRequestAttachment.fromJson(Map<String, dynamic> json) =>
      _$ServiceRequestAttachmentFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceRequestAttachmentToJson(this);
}

@JsonSerializable()
class Customer {
  final String id;
  final String name;
  final String? company;
  final String? mobilePhone;
  final String? officePhone;
  final String? address;

  const Customer({
    required this.id,
    required this.name,
    this.company,
    this.mobilePhone,
    this.officePhone,
    this.address,
  });

  factory Customer.fromJson(Map<String, dynamic> json) =>
      _$CustomerFromJson(json);

  Map<String, dynamic> toJson() => _$CustomerToJson(this);
}
