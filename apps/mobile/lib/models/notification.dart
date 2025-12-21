class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final bool isRead;
  final String? action;
  final String? serviceRequestId;
  final String? technicianId;
  final String? customerId;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.data,
    required this.createdAt,
    this.isRead = false,
    this.action,
    this.serviceRequestId,
    this.technicianId,
    this.customerId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? '',
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      isRead: json['is_read'] ?? false,
      action: json['action'],
      serviceRequestId: json['service_request_id'],
      technicianId: json['technician_id'],
      customerId: json['customer_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'data': data,
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
      'action': action,
      'service_request_id': serviceRequestId,
      'technician_id': technicianId,
      'customer_id': customerId,
    };
  }

  NotificationModel copyWith({
    String? id,
    String? title,
    String? body,
    String? type,
    Map<String, dynamic>? data,
    DateTime? createdAt,
    bool? isRead,
    String? action,
    String? serviceRequestId,
    String? technicianId,
    String? customerId,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      type: type ?? this.type,
      data: data ?? this.data,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      action: action ?? this.action,
      serviceRequestId: serviceRequestId ?? this.serviceRequestId,
      technicianId: technicianId ?? this.technicianId,
      customerId: customerId ?? this.customerId,
    );
  }

  // Notification türlerine göre icon döndür
  String get iconPath {
    switch (type) {
      case 'service_assignment':
        return '🔧';
      case 'status_update':
        return '📋';
      case 'service_completed':
        return '✅';
      case 'appointment_reminder':
        return '⏰';
      case 'emergency':
        return '🚨';
      default:
        return '📢';
    }
  }

  // Notification türlerine göre renk döndür
  String get colorHex {
    switch (type) {
      case 'service_assignment':
        return '#007AFF'; // Mavi
      case 'status_update':
        return '#34C759'; // Yeşil
      case 'service_completed':
        return '#30D158'; // Yeşil
      case 'appointment_reminder':
        return '#FF9500'; // Turuncu
      case 'emergency':
        return '#FF3B30'; // Kırmızı
      default:
        return '#8E8E93'; // Gri
    }
  }

  // Zaman formatı
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 0) {
      return '${difference.inDays} gün önce';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} saat önce';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} dakika önce';
    } else {
      return 'Az önce';
    }
  }
}
