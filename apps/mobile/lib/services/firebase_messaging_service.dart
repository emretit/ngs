import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FirebaseMessagingService {
  static FirebaseMessaging? _firebaseMessaging;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  static FirebaseMessaging get _firebaseMessagingInstance {
    if (_firebaseMessaging == null) {
      try {
        _firebaseMessaging = FirebaseMessaging.instance;
      } catch (e) {
        print('Firebase Messaging instance alınamadı: $e');
        throw Exception('Firebase başlatılmamış');
      }
    }
    return _firebaseMessaging!;
  }

  // FCM token'ı al
  static Future<String?> getToken() async {
    try {
      // iOS için APNS token'ının hazır olmasını bekle
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        // APNS token'ının hazır olmasını bekle
        await _waitForAPNSToken();
      }
      
      final token = await _firebaseMessagingInstance.getToken();
      return token;
    } catch (e) {
      print('FCM token alınamadı: $e');
      return null;
    }
  }

  // iOS için APNS token'ının hazır olmasını bekle
  static Future<void> _waitForAPNSToken() async {
    if (defaultTargetPlatform != TargetPlatform.iOS) return;
    
    int attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        final apnsToken = await _firebaseMessagingInstance.getAPNSToken();
        if (apnsToken != null) {
          print('APNS token hazır: ${apnsToken.length} karakter');
          return;
        }
      } catch (e) {
        print('APNS token kontrolü: $e');
      }
      
      await Future.delayed(const Duration(seconds: 1));
      attempts++;
    }
    
    print('APNS token hazır değil, FCM token alınmaya çalışılıyor...');
  }

  // FCM token'ı Supabase'e kaydet
  static Future<void> saveTokenToSupabase(String userId) async {
    int retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        final token = await getToken();
        if (token == null) return;

        final supabase = Supabase.instance.client;
        
        // Platform detection
        String platform = 'android';
        if (defaultTargetPlatform == TargetPlatform.iOS) {
          platform = 'ios';
        } else if (defaultTargetPlatform == TargetPlatform.macOS) {
          platform = 'web';
        }
        
        // Profiles tablosunda FCM token güncelle
        await supabase.from('profiles').update({
          'fcm_token': token,
          'device_id': 'device_${DateTime.now().millisecondsSinceEpoch}', // Unique device ID
          'platform': platform,
          'notification_enabled': true,
          'last_token_updated': DateTime.now().toIso8601String(),
        }).eq('id', userId);
        
        print('FCM token başarıyla kaydedildi/güncellendi: $platform');
        return; // Başarılı olursa çık
      } catch (e) {
        retryCount++;
        if (retryCount >= maxRetries) {
          print('FCM token kaydetme hatası (${maxRetries} deneme sonrası): $e');
          return;
        }
        // Exponential backoff: 1s, 2s, 4s
        await Future.delayed(Duration(seconds: retryCount));
        print('FCM token kaydetme hatası (deneme $retryCount/$maxRetries): $e');
      }
    }
  }

  // Bildirim izinlerini iste
  static Future<void> requestPermission() async {
    try {
      final settings = await _firebaseMessagingInstance.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      print('Bildirim izni durumu: ${settings.authorizationStatus}');
    } catch (e) {
      print('Bildirim izni hatası: $e');
    }
  }

  // Local notifications'ı başlat
  static Future<void> initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(initSettings);
    
    // Android 8.0+ için notification channel oluştur
    if (defaultTargetPlatform == TargetPlatform.android) {
      await _createNotificationChannel();
    }
  }

  // Android notification channel oluştur
  static Future<void> _createNotificationChannel() async {
    const androidChannel = AndroidNotificationChannel(
      'pafta_notifications',
      'Pafta Bildirimleri',
      description: 'Pafta teknik servis bildirimleri',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  // Background message handler
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    try {
      // Firebase zaten başlatılmış olabilir, kontrol et
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      print('Background mesaj alındı: ${message.messageId}');
    } catch (e) {
      print('Background handler Firebase başlatma hatası: $e');
    }
  }

  // FCM'yi başlat
  static Future<void> initialize() async {
    try {
      // Firebase'in başlatıldığını kontrol et
      if (Firebase.apps.isEmpty) {
        print('Firebase henüz başlatılmamış, Firebase Messaging atlanıyor');
        return;
      }
      
      // Uygulama başlatıldığında badge'i temizle
      await clearBadge();
      
      // Background message handler'ı ayarla
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // Local notifications'ı başlat
      await initializeLocalNotifications();
      
      // Bildirim izinlerini iste
      await requestPermission();
      
      // Foreground mesajları dinle
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('Foreground mesaj alındı: ${message.messageId}');
        _showLocalNotification(message);
      });
      
      // Uygulama açıldığında mesajları dinle
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('Uygulama açıldığında mesaj alındı: ${message.messageId}');
        _handleNotificationTap(message);
        // Bildirime tıklandığında badge'i temizle
        clearBadge();
      });
      
      // Uygulama kapalıyken gelen mesajları kontrol et
      final initialMessage = await _firebaseMessagingInstance.getInitialMessage();
      if (initialMessage != null) {
        print('Uygulama kapalıyken mesaj alındı: ${initialMessage.messageId}');
        _handleNotificationTap(initialMessage);
        // Uygulama açıldığında badge'i temizle
        clearBadge();
      }
      
      // Token refresh dinleyicisini başlat
      listenToTokenRefresh();
      
      print('Firebase Messaging başarıyla başlatıldı');
      
    } catch (e) {
      print('Firebase Messaging başlatma hatası: $e');
    }
  }

  // Local notification göster
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'pafta_notifications',
      'Pafta Bildirimleri',
      channelDescription: 'Pafta teknik servis bildirimleri',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Pafta',
      message.notification?.body ?? 'Yeni bildirim',
      notificationDetails,
      payload: message.data.toString(),
    );
  }

  // Bildirim tıklama işlemi
  static void _handleNotificationTap(RemoteMessage message) {
    print('Bildirime tıklandı: ${message.data}');
    
    // Bildirimi veritabanına kaydet
    _saveNotificationToDatabase(message);
    
    // Action'a göre yönlendirme yap
    final action = message.data['action'];
    final serviceRequestId = message.data['service_request_id'];
    
    if (action != null) {
      print('Bildirim action: $action');
      
      // Global navigator key kullanarak yönlendirme yap
      final navigatorKey = _navigatorKey;
      if (navigatorKey?.currentContext != null) {
        final context = navigatorKey!.currentContext!;
        
        switch (action) {
          case 'open_service_request':
            if (serviceRequestId != null) {
              // Servis talebi detay sayfasına git
              context.go('/service/detail/$serviceRequestId');
            }
            break;
          case 'open_service_requests':
            // Servis talepleri listesine git
            context.go('/service/management');
            break;
          case 'open_emergency':
            // Acil durum sayfasına git (şimdilik servis listesine)
            context.go('/service/management');
            break;
          case 'open_notifications':
            // Bildirimler sayfasına git
            context.go('/notifications');
            break;
          default:
            break;
        }
      }
    }
  }
  
  // Global navigator key - main.dart'ta set edilecek
  static GlobalKey<NavigatorState>? _navigatorKey;
  
  // Navigator key'i set et
  static void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  // Badge'i temizle
  static Future<void> clearBadge() async {
    try {
      // Tüm bildirimleri iptal et (badge'i de temizler)
      await _localNotifications.cancelAll();
      
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        // iOS için ek izin kontrolü
        await _localNotifications.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
            ?.requestPermissions(alert: true, badge: true, sound: true);
      }
      
      print('Badge temizlendi');
    } catch (e) {
      print('Badge temizleme hatası: $e');
    }
  }

  // Bildirimi veritabanına kaydet
  static Future<void> _saveNotificationToDatabase(RemoteMessage message) async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      await supabase.from('notifications').insert({
        'user_id': user.id,
        'title': message.notification?.title ?? 'Bildirim',
        'body': message.notification?.body ?? '',
        'type': message.data['type'] ?? 'general',
        'data': message.data,
        'action': message.data['action'],
        'service_request_id': message.data['service_request_id'],
        'technician_id': message.data['technician_id'],
        'customer_id': message.data['customer_id'],
        'is_read': false,
      });
      
      print('Bildirim veritabanına kaydedildi');
    } catch (e) {
      print('Bildirim kaydetme hatası: $e');
    }
  }

  // Token yenileme dinleyicisi
  static void listenToTokenRefresh() {
    try {
      _firebaseMessagingInstance.onTokenRefresh.listen((newToken) {
        print('FCM token yenilendi: $newToken');
        // Token'ı Supabase'e güncelle
        final user = Supabase.instance.client.auth.currentUser;
        if (user != null) {
          saveTokenToSupabase(user.id);
        }
      });
    } catch (e) {
      print('Token refresh dinleyicisi başlatılamadı: $e');
    }
  }

  // Kullanıcı giriş yaptığında token'ı kaydet
  static Future<void> saveTokenForCurrentUser() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await saveTokenToSupabase(user.id);
        print('FCM token mevcut kullanıcı için kaydedildi');
      }
    } catch (e) {
      print('FCM token kaydetme hatası (saveTokenForCurrentUser): $e');
    }
  }
}
