import 'package:supabase_flutter/supabase_flutter.dart';

class PushNotificationService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Tek kullanıcıya bildirim gönder
  Future<bool> sendNotificationToUser({
    required String userId,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    try {
      print('📤 Push notification gönderiliyor:');
      print('  - User ID: $userId');
      print('  - Title: $title');
      print('  - Body: $body');
      print('  - Data: $data');
      
      final response = await _supabase.functions.invoke(
        'send-push-notification',
        body: {
          'user_id': userId,
          'title': title,
          'body': body,
          'data': data ?? {},
        },
      );

      print('📥 Edge function response:');
      print('  - Status: ${response.status}');
      print('  - Data: ${response.data}');

      if (response.status == 200) {
        print('✅ Bildirim başarıyla gönderildi');
        return true;
      } else {
        print('❌ Bildirim gönderme hatası: ${response.status}');
        print('   Response: ${response.data}');
        return false;
      }
    } catch (e) {
      print('❌ Bildirim gönderme hatası: $e');
      print('   Stack trace: ${StackTrace.current}');
      return false;
    }
  }

  // Servis talebi atama bildirimi gönder
  Future<bool> sendServiceAssignmentNotification({
    required String technicianId,
    required String serviceRequestId,
    required String customerName,
    required String serviceTitle,
  }) async {
    return await sendNotificationToUser(
      userId: technicianId,
      title: 'Yeni Servis Talebi Atandı',
      body: '$customerName için "$serviceTitle" servis talebi atandı',
      data: {
        'type': 'service_assignment',
        'service_request_id': serviceRequestId,
        'action': 'open_service_request',
      },
    );
  }

  // Servis talebi durum güncelleme bildirimi gönder
  Future<bool> sendStatusUpdateNotification({
    required String customerId,
    required String serviceTitle,
    required String oldStatus,
    required String newStatus,
  }) async {
    return await sendNotificationToUser(
      userId: customerId,
      title: 'Servis Talebi Durumu Güncellendi',
      body: '"$serviceTitle" servis talebinizin durumu "$oldStatus" → "$newStatus" olarak güncellendi',
      data: {
        'type': 'status_update',
        'service_title': serviceTitle,
        'old_status': oldStatus,
        'new_status': newStatus,
        'action': 'open_service_requests',
      },
    );
  }

  // Acil durum bildirimi gönder
  Future<bool> sendEmergencyNotification({
    required String technicianId,
    required String message,
  }) async {
    return await sendNotificationToUser(
      userId: technicianId,
      title: '🚨 Acil Durum',
      body: message,
      data: {
        'type': 'emergency',
        'priority': 'high',
        'action': 'open_emergency',
      },
    );
  }

  // Tüm teknisyenlere genel bildirim gönder
  Future<bool> sendBroadcastToTechnicians({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    try {
      // Tüm teknisyenlerin ID'lerini al
      final response = await _supabase
          .from('employees')
          .select('id')
          .eq('is_technical', true);

      if (response.isEmpty) {
        print('Teknisyen bulunamadı');
        return false;
      }

      bool allSuccess = true;
      for (final technician in response) {
        final success = await sendNotificationToUser(
          userId: technician['id'],
          title: title,
          body: body,
          data: data,
        );
        if (!success) allSuccess = false;
      }

      return allSuccess;
    } catch (e) {
      print('Genel bildirim gönderme hatası: $e');
      return false;
    }
  }

  // Müşteriye servis tamamlandı bildirimi gönder
  Future<bool> sendServiceCompletedNotification({
    required String customerId,
    required String serviceTitle,
    required String technicianName,
  }) async {
    return await sendNotificationToUser(
      userId: customerId,
      title: 'Servis Tamamlandı',
      body: '"$serviceTitle" servis talebiniz $technicianName tarafından tamamlandı',
      data: {
        'type': 'service_completed',
        'service_title': serviceTitle,
        'technician_name': technicianName,
        'action': 'open_service_requests',
      },
    );
  }

  // Randevu hatırlatma bildirimi gönder
  Future<bool> sendAppointmentReminder({
    required String userId,
    required String serviceTitle,
    required DateTime appointmentTime,
  }) async {
    final timeStr = '${appointmentTime.day}/${appointmentTime.month}/${appointmentTime.year} ${appointmentTime.hour}:${appointmentTime.minute.toString().padLeft(2, '0')}';
    
    return await sendNotificationToUser(
      userId: userId,
      title: 'Randevu Hatırlatması',
      body: '"$serviceTitle" servis talebiniz için randevunuz $timeStr',
      data: {
        'type': 'appointment_reminder',
        'service_title': serviceTitle,
        'appointment_time': appointmentTime.toIso8601String(),
        'action': 'open_service_request',
      },
    );
  }

  // Test push notification gönder
  Future<bool> sendTestNotification({
    required String userId,
  }) async {
    return await sendNotificationToUser(
      userId: userId,
      title: 'Test Bildirimi',
      body: 'Bu bir test bildirimidir. Push notification çalışıyor mu?',
      data: {
        'type': 'test',
        'timestamp': DateTime.now().toIso8601String(),
        'action': 'open_app',
      },
    );
  }
}
