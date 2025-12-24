import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/firebase_messaging_service.dart';
import '../services/session_activity_service.dart';
import '../services/activity_service.dart';
import '../models/user.dart' as app_models;

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

// Kullanıcının is_technical bilgisini tutan provider
final userIsTechnicalProvider = FutureProvider<bool>((ref) async {
  final authService = ref.read(authServiceProvider);
  final employeeInfo = await authService.getCurrentUserEmployeeInfo();
  return employeeInfo?['is_technical'] ?? false;
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final app_models.User? user;
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    app_models.User? user,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.read(authServiceProvider);
    // Build sırasında async işlem yapamayız, bu yüzden currentUser kullanıyoruz
    // Company_id build sonrası signIn'de yüklenecek
    final user = _authService.currentUser;
    return AuthState(
      isAuthenticated: user != null,
      user: user,
    );
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    
    final success = await _authService.signInWithEmail(email, password);
    
    if (success) {
      // Company_id ile birlikte kullanıcı bilgilerini çek
      final user = await _authService.getCurrentUserWithCompany();
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
      );
      
      // Session activity'yi güncelle (web app'teki gibi)
      await SessionActivityService.updateActivity();
      
      // FCM token'ı kaydet
      if (user != null) {
        await FirebaseMessagingService.saveTokenToSupabase(user.id);
        FirebaseMessagingService.listenToTokenRefresh();
      }
    } else {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
      );
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    // Session activity'yi temizle (web app'teki gibi)
    await SessionActivityService.clearActivity();
    // Employee ID cache'ini temizle
    ActivityService.clearCache();
    state = AuthState();
  }

  Future<void> refreshUser() async {
    if (state.isAuthenticated) {
      final user = await _authService.getCurrentUserWithCompany();
      state = state.copyWith(user: user);
    }
  }
}
