import Flutter
import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Firebase'i başlat
    FirebaseApp.configure()
    print("Firebase başlatıldı")
    
    // Uygulama başlatıldığında badge'i temizle
    application.applicationIconBadgeNumber = 0
    print("Badge temizlendi (AppDelegate)")
    
    // FCM delegate ayarla
    Messaging.messaging().delegate = self
    
    // Push notification izinlerini iste
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { granted, error in
          print("Notification permission granted: \(granted)")
          if let error = error {
            print("Notification permission error: \(error)")
          }
          
          DispatchQueue.main.async {
            application.registerForRemoteNotifications()
          }
        }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
      application.registerForRemoteNotifications()
    }
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // FCM token alındığında
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("✅ APNS token alındı: \(tokenString.prefix(20))... (uzunluk: \(deviceToken.count))")
    print("📱 APNS token Firebase'e set ediliyor...")
    Messaging.messaging().apnsToken = deviceToken
    print("✅ APNS token Firebase'e set edildi")
  }
  
  // APNS registration hatası
  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ APNS registration hatası: \(error.localizedDescription)")
    print("❌ APNS hata detayları: \(error)")
    print("⚠️ Firebase Console'da APNs Authentication Key kontrol edin!")
    print("⚠️ Bundle ID ve Team ID doğru mu kontrol edin!")
  }
  
  // Push notification alındığında (foreground)
  override func userNotificationCenter(_ center: UNUserNotificationCenter,
                                     willPresent notification: UNNotification,
                                     withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([[.alert, .sound]])
  }
  
  // Push notification'a tıklandığında
  override func userNotificationCenter(_ center: UNUserNotificationCenter,
                                     didReceive response: UNNotificationResponse,
                                     withCompletionHandler completionHandler: @escaping () -> Void) {
    // Bildirime tıklandığında badge'i temizle
    UIApplication.shared.applicationIconBadgeNumber = 0
    print("Badge temizlendi (notification tap)")
    completionHandler()
  }
  
  // Uygulama aktif hale geldiğinde
  override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    // Uygulama aktif olduğunda badge'i temizle
    application.applicationIconBadgeNumber = 0
    print("Badge temizlendi (app became active)")
  }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
      print("✅ FCM registration token alındı: \(token.prefix(30))... (uzunluk: \(token.count))")
      print("📱 FCM token Flutter tarafına gönderilecek")
    } else {
      print("❌ FCM token nil - APNs token sorunlu olabilir!")
      print("⚠️ Firebase Console'da APNs Authentication Key kontrol edin!")
    }
  }
}
