import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'firebase_options.dart';
import 'router/app_router.dart';
import 'services/firebase_messaging_service.dart';
import 'services/session_activity_service.dart';
import 'services/logger_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  try {
    await dotenv.load(fileName: '.env');
    AppLogger.info('Environment variables loaded successfully');
  } catch (e) {
    AppLogger.error('Error loading .env file', e);
    AppLogger.warning('Make sure .env file exists and is properly configured');
  }
  
  try {
    // Firebase'i başlat (Web platformunda atla çünkü yapılandırılmamış)
    if (!kIsWeb) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      AppLogger.info('Firebase başarıyla başlatıldı');
    } else {
      AppLogger.info('Firebase henüz başlatılmamış, Firebase Messaging atlanıyor');
    }
  } catch (e) {
    AppLogger.error('Firebase başlatma hatası', e);
    // Firebase başlatılamadıysa uygulamayı durdurma, sadece log yaz
  }
  
  try {
    // Supabase'i başlat - Environment variables'dan oku
    final supabaseUrl = dotenv.env['SUPABASE_URL'];
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'];

    if (supabaseUrl == null || supabaseAnonKey == null) {
      throw Exception(
        'Missing Supabase environment variables. Please check your .env file.\n'
        'Required: SUPABASE_URL, SUPABASE_ANON_KEY'
      );
    }

    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      realtimeClientOptions: const RealtimeClientOptions(
        logLevel: RealtimeLogLevel.info,
        timeout: Duration(seconds: 30),
      ),
      authOptions: const FlutterAuthClientOptions(
        autoRefreshToken: true, // Web app'teki gibi auto refresh açık
      ),
      storageOptions: const StorageClientOptions(
        retryAttempts: 5,
      ),
    );
    AppLogger.info('Supabase başarıyla başlatıldı');
    
    // Session expired kontrolü (web app'teki gibi)
    final isExpired = await SessionActivityService.isSessionExpired();
    if (isExpired) {
      AppLogger.warning('Session expired due to inactivity');
      await Supabase.instance.client.auth.signOut();
      await SessionActivityService.clearActivity();
    } else {
      // Session varsa activity'yi güncelle
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null) {
        await SessionActivityService.updateActivity();
      }
    }
  } catch (e) {
    AppLogger.error('Supabase başlatma hatası', e);
  }
  
  try {
    // Firebase Messaging'i başlat (Web'de atla)
    if (!kIsWeb) {
      await FirebaseMessagingService.initialize();
      AppLogger.info('Firebase Messaging başarıyla başlatıldı');

      // Eğer kullanıcı zaten login ise FCM token'ını kaydet
      final currentSession = Supabase.instance.client.auth.currentSession;
      if (currentSession != null) {
        AppLogger.info('Mevcut kullanıcı için FCM token kaydediliyor...');
        await FirebaseMessagingService.saveTokenForCurrentUser();
      }
    }
  } catch (e) {
    AppLogger.error('Firebase Messaging başlatma hatası', e);
  }
  
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    
    // Navigator key'i Firebase Messaging Service'e set et
    final navigatorKey = GlobalKey<NavigatorState>();
    FirebaseMessagingService.setNavigatorKey(navigatorKey);
    
    return MaterialApp.router(
      title: 'PAFTA',
      theme: _buildIOSTheme(),
      routerConfig: router,
      // Navigator key'i ekle (GoRouter bunu kullanır)
      restorationScopeId: 'app',
      debugShowCheckedModeBanner: false, // DEBUG bandını kaldır
    );
  }

  ThemeData _buildIOSTheme() {
    return ThemeData(
      // PAFTA brand renk paleti - Web app ile uyumlu
      useMaterial3: true,
      primarySwatch: Colors.red,
      primaryColor: const Color(0xFFD32F2F), // PAFTA Bright Red (web app primary)
      
      // iOS benzeri fontlar
      fontFamily: 'SF Pro Display',
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 34,
          fontWeight: FontWeight.bold,
          color: Color(0xFF000000),
          letterSpacing: -0.41,
        ),
        headlineLarge: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: Color(0xFF000000),
          letterSpacing: -0.36,
        ),
        headlineMedium: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Color(0xFF000000),
          letterSpacing: -0.26,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Color(0xFF000000),
          letterSpacing: -0.45,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Color(0xFF000000),
          letterSpacing: -0.32,
        ),
        bodyLarge: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w400,
          color: Color(0xFF000000),
          letterSpacing: -0.41,
        ),
        bodyMedium: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: Color(0xFF000000),
          letterSpacing: -0.24,
        ),
        labelLarge: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF8E8E93),
          letterSpacing: -0.08,
        ),
      ),
      
      // iOS benzeri AppBar tema
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFF2F2F7),
        foregroundColor: Color(0xFF000000),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: Color(0xFF000000),
          letterSpacing: -0.41,
        ),
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      
      // iOS benzeri card tema
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
      
      // PAFTA brand buton temaları - Web app ile uyumlu
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFD32F2F), // Primary
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.41,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFFD32F2F), // Primary
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.41,
          ),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: const Color(0xFFD32F2F), // Primary
          textStyle: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w400,
            letterSpacing: -0.41,
          ),
        ),
      ),
      
      // iOS benzeri input tema
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF2F2F7),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFD32F2F), width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        hintStyle: const TextStyle(
          color: Color(0xFF8E8E93),
          fontSize: 17,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.41,
        ),
      ),
      
      // iOS benzeri scaffold tema
      scaffoldBackgroundColor: const Color(0xFFF2F2F7),
      
      // iOS benzeri liste tema
      listTileTheme: const ListTileThemeData(
        tileColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      
      // iOS benzeri divider tema
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE5E5EA),
        thickness: 0.5,
        space: 1,
      ),
      
      // PAFTA brand navigasyon tema
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFFF2F2F7),
        selectedItemColor: Color(0xFFD32F2F), // Primary
        unselectedItemColor: Color(0xFF8E8E93),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.06,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.06,
        ),
      ),
      
      // PAFTA brand renk şeması - Web app ile uyumlu
      colorScheme: const ColorScheme.light(
        primary: Color(0xFFD32F2F), // PAFTA Bright Red (web app primary)
        secondary: Colors.white, // Web app secondary
        surface: Colors.white,
        background: Color(0xFFF2F2F7),
        error: Color(0xFFE53935), // Web app error
        onPrimary: Colors.white,
        onSecondary: Color(0xFF4A4A4A), // Web app secondary foreground
        onSurface: Color(0xFF000000),
        onBackground: Color(0xFF000000),
        onError: Colors.white,
      ),
    );
  }
}