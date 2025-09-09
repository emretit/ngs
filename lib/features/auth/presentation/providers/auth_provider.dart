import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/supabase_service.dart';
import '../../../../shared/models/technician.dart';

// Auth State
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Technician? technician;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.technician,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Technician? technician,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      technician: technician ?? this.technician,
      error: error ?? this.error,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final SupabaseService _supabaseService = SupabaseService.instance;

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final user = _supabaseService.currentUser;
      
      if (user != null) {
        // Teknisyen bilgilerini getir
        final technicianData = await _supabaseService.getTechnician(user.id);
        
        if (technicianData != null) {
          final technician = Technician.fromJson(technicianData);
          state = state.copyWith(
            isAuthenticated: true,
            isLoading: false,
            technician: technician,
          );
        } else {
          // Teknisyen değilse çıkış yap
          await signOut();
        }
      } else {
        state = state.copyWith(
          isAuthenticated: false,
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isAuthenticated: false,
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _supabaseService.signInWithEmail(email, password);
      
      if (response.user != null) {
        // Teknisyen bilgilerini getir
        final technicianData = await _supabaseService.getTechnician(response.user!.id);
        
        if (technicianData != null) {
          final technician = Technician.fromJson(technicianData);
          state = state.copyWith(
            isAuthenticated: true,
            isLoading: false,
            technician: technician,
          );
          return true;
        } else {
          // Teknisyen değilse çıkış yap
          await signOut();
          state = state.copyWith(
            isAuthenticated: false,
            isLoading: false,
            error: 'Bu hesap teknik servis personeli değil',
          );
          return false;
        }
      } else {
        state = state.copyWith(
          isAuthenticated: false,
          isLoading: false,
          error: 'Giriş başarısız',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isAuthenticated: false,
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);
    
    try {
      await _supabaseService.signOut();
      state = const AuthState();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
