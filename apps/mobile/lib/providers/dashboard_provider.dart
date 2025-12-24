import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/dashboard_service.dart';
import '../services/cache_service.dart';
import '../models/approval.dart';
import '../models/notification.dart' as notification_model;
import 'auth_provider.dart';

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  return DashboardService();
});

// Bekleyen onaylar provider
final pendingApprovalsProvider = FutureProvider<List<Approval>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  final authState = ref.read(authStateProvider);
  final user = authState.user;

  if (user == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getPendingApprovals(
    companyId: user.companyId,
    approverId: user.id,
  );
});

// Son bildirimler provider
final recentNotificationsProvider = FutureProvider<List<notification_model.NotificationModel>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  final authState = ref.read(authStateProvider);
  final user = authState.user;

  if (user == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getRecentNotifications(
    companyId: user.companyId,
    userId: user.id,
    limit: 10,
  );
});

// Dashboard istatistikleri provider (cache ile optimize edilmiş)
final dashboardStatsProvider = AsyncNotifierProvider<DashboardStatsNotifier, Map<String, dynamic>>(
  () => DashboardStatsNotifier(),
);

class DashboardStatsNotifier extends AsyncNotifier<Map<String, dynamic>> {
  @override
  Future<Map<String, dynamic>> build() async {
    final service = ref.read(dashboardServiceProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    if (user == null) {
      throw Exception('Kullanıcı giriş yapmamış');
    }

    // Cache key oluştur
    final cacheKey = 'dashboard_stats_${user.companyId}_${user.id}';

    // Cache kontrolü
    final cached = CacheService.get<Map<String, dynamic>>(cacheKey);
    if (cached != null) {
      return cached;
    }

    // API çağrısı
    final stats = await service.getDashboardStats(
      companyId: user.companyId,
      userId: user.id,
    );

    // Cache'e kaydet (2 dakika TTL - dashboard stats daha sık değişebilir)
    CacheService.set(cacheKey, stats, ttl: const Duration(minutes: 2));

    return stats;
  }

  /// Cache'i temizle ve yeniden yükle
  Future<void> refresh() async {
    final authState = ref.read(authStateProvider);
    final user = authState.user;

    if (user != null) {
      final cacheKey = 'dashboard_stats_${user.companyId}_${user.id}';
      CacheService.remove(cacheKey);
    }

    // Tüm dashboard stats cache'lerini temizle
    CacheService.invalidate('dashboard_stats_');

    // Provider'ı yeniden yükle
    ref.invalidateSelf();
  }
}

