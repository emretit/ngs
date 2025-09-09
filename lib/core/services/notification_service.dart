import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final SupabaseClient _supabase = Supabase.instance.client;
  
  // FCM Token'ı saklama
  String? _fcmToken;
  
  // FCM Token'ı al
  String? get fcmToken => _fcmToken;
  
  // FCM Token'ı ayarla
  Future<void> setFCMToken(String token) async {
    _fcmToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_token', token);
    
    // Supabase'e token'ı kaydet
    await _saveTokenToSupabase(token);
  }
  
  // FCM Token'ı Supabase'e kaydet
  Future<void> _saveTokenToSupabase(String token) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        await _supabase
            .from('user_tokens')
            .upsert({
              'user_id': user.id,
              'fcm_token': token,
              'platform': defaultTargetPlatform.name,
              'updated_at': DateTime.now().toIso8601String(),
            });
      }
    } catch (e) {
      debugPrint('FCM Token kaydetme hatası: $e');
    }
  }
  
  // Realtime subscription başlat
  Future<void> startRealtimeSubscription() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        // Servis talepleri değişikliklerini dinle
        _supabase
            .channel('service_requests_changes')
            .onPostgresChanges(
              event: PostgresChangeEvent.all,
              schema: 'public',
              table: 'service_requests',
              filter: PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'assigned_to',
                value: user.id,
              ),
              callback: (payload) {
                _handleServiceRequestChange(payload);
              },
            )
            .subscribe();
      }
    } catch (e) {
      debugPrint('Realtime subscription hatası: $e');
    }
  }
  
  // Servis talebi değişikliklerini işle
  void _handleServiceRequestChange(PostgresChangePayload payload) {
    try {
      final eventType = payload.eventType;
      final newRecord = payload.newRecord;
      final oldRecord = payload.oldRecord;
      
      String title = '';
      String body = '';
      
      switch (eventType) {
        case PostgresChangeEvent.insert:
          title = 'Yeni Servis Talebi';
          body = 'Size yeni bir servis talebi atandı: ${newRecord['title']}';
          break;
        case PostgresChangeEvent.update:
          title = 'Servis Talebi Güncellendi';
          body = 'Servis talebi güncellendi: ${newRecord['title']}';
          break;
        case PostgresChangeEvent.delete:
          title = 'Servis Talebi Silindi';
          body = 'Servis talebi silindi: ${oldRecord['title']}';
          break;
      }
      
      // Local notification göster
      _showLocalNotification(title, body, newRecord);
      
    } catch (e) {
      debugPrint('Servis talebi değişiklik işleme hatası: $e');
    }
  }
  
  // Local notification göster
  void _showLocalNotification(String title, String body, Map<String, dynamic> data) {
    // Bu kısımda local notification gösterilecek
    // Şimdilik debug print kullanıyoruz
    debugPrint('🔔 Bildirim: $title - $body');
    debugPrint('📊 Veri: $data');
  }
  
  // Push notification gönder (admin panelinden)
  Future<void> sendPushNotification({
    required String userId,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    try {
      // Supabase Edge Function ile push notification gönder
      await _supabase.functions.invoke(
        'send-push-notification',
        body: {
          'user_id': userId,
          'title': title,
          'body': body,
          'data': data ?? {},
        },
      );
    } catch (e) {
      debugPrint('Push notification gönderme hatası: $e');
    }
  }
  
  // Servis talebi atandığında bildirim gönder
  Future<void> notifyServiceAssigned({
    required String technicianId,
    required String serviceTitle,
    required String serviceId,
  }) async {
    await sendPushNotification(
      userId: technicianId,
      title: 'Yeni Servis Talebi',
      body: 'Size yeni bir servis talebi atandı: $serviceTitle',
      data: {
        'type': 'service_assigned',
        'service_id': serviceId,
        'service_title': serviceTitle,
      },
    );
  }
  
  // Servis durumu değiştiğinde bildirim gönder
  Future<void> notifyStatusChanged({
    required String technicianId,
    required String serviceTitle,
    required String newStatus,
    required String serviceId,
  }) async {
    await sendPushNotification(
      userId: technicianId,
      title: 'Servis Durumu Güncellendi',
      body: '$serviceTitle servisi $newStatus durumuna geçti',
      data: {
        'type': 'status_changed',
        'service_id': serviceId,
        'service_title': serviceTitle,
        'new_status': newStatus,
      },
    );
  }
}
