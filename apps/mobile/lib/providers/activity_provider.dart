import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../services/activity_service.dart';
import '../services/cache_service.dart';
import 'auth_provider.dart';

final activityServiceProvider = Provider<ActivityService>((ref) {
  return ActivityService();
});

// Kullanıcının kişisel aktiviteleri (cache ile optimize edilmiş)
final personalActivitiesProvider = AsyncNotifierProvider<PersonalActivitiesNotifier, List<Activity>>(
  () => PersonalActivitiesNotifier(),
);

class PersonalActivitiesNotifier extends AsyncNotifier<List<Activity>> {
  @override
  Future<List<Activity>> build() async {
    final activityService = ref.read(activityServiceProvider);
    final authState = ref.watch(authStateProvider);
    final companyId = authState.user?.companyId;
    final userId = authState.user?.id;

    if (companyId == null || userId == null) {
      return [];
    }

    // Cache key oluştur
    final cacheKey = 'personal_activities_${companyId}_$userId';

    // Cache kontrolü
    final cached = CacheService.get<List<Activity>>(cacheKey);
    if (cached != null) {
      return cached;
    }

    // API çağrısı
    final activities = await activityService.getPersonalActivities(
      companyId: companyId,
      userId: userId,
    );

    // Cache'e kaydet (5 dakika TTL)
    CacheService.set(cacheKey, activities, ttl: const Duration(minutes: 5));

    return activities;
  }

  /// Cache'i temizle ve yeniden yükle
  Future<void> refresh() async {
    final authState = ref.read(authStateProvider);
    final companyId = authState.user?.companyId;
    final userId = authState.user?.id;

    if (companyId != null && userId != null) {
      final cacheKey = 'personal_activities_${companyId}_$userId';
      CacheService.remove(cacheKey);
    }

    // Tüm activity cache'lerini temizle
    CacheService.invalidate('personal_activities_');
    CacheService.invalidate('activities_');

    // Provider'ı yeniden yükle
    ref.invalidateSelf();
  }
}

// Bugünkü aktiviteler provider (personalActivitiesProvider'dan türetilmiş, client-side filtering)
final todayActivitiesProvider = Provider<List<Activity>>((ref) {
  final activitiesAsync = ref.watch(personalActivitiesProvider);
  return activitiesAsync.when(
    data: (activities) {
      final today = DateTime.now();
      return activities.where((a) {
        if (a.dueDate == null) return false;
        return a.dueDate!.day == today.day &&
            a.dueDate!.month == today.month &&
            a.dueDate!.year == today.year &&
            a.status != 'completed';
      }).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

// Şirket genelindeki tüm aktiviteler (CRM için, cache ile optimize edilmiş)
final activitiesProvider = AsyncNotifierProvider<ActivitiesNotifier, List<Activity>>(
  () => ActivitiesNotifier(),
);

class ActivitiesNotifier extends AsyncNotifier<List<Activity>> {
  @override
  Future<List<Activity>> build() async {
    final activityService = ref.read(activityServiceProvider);
    final authState = ref.watch(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId == null) {
      throw Exception('Kullanıcının company_id bilgisi bulunamadı');
    }

    // Cache key oluştur
    final cacheKey = 'activities_$companyId';

    // Cache kontrolü
    final cached = CacheService.get<List<Activity>>(cacheKey);
    if (cached != null) {
      return cached;
    }

    // API çağrısı
    final activities = await activityService.getAllCompanyActivities(
      companyId: companyId,
    );

    // Cache'e kaydet (5 dakika TTL)
    CacheService.set(cacheKey, activities, ttl: const Duration(minutes: 5));

    return activities;
  }

  /// Cache'i temizle ve yeniden yükle
  Future<void> refresh() async {
    final authState = ref.read(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId != null) {
      final cacheKey = 'activities_$companyId';
      CacheService.remove(cacheKey);
    }

    // Tüm activity cache'lerini temizle
    CacheService.invalidate('activities_');
    CacheService.invalidate('personal_activities_');

    // Provider'ı yeniden yükle
    ref.invalidateSelf();
  }
}

final activityStatusesProvider = Provider<List<String>>((ref) {
  return ['todo', 'in_progress', 'completed', 'cancelled'];
});

final activityStatusColorsProvider = Provider<Map<String, String>>((ref) {
  return {
    'todo': 'blue',
    'in_progress': 'orange',
    'completed': 'green',
    'cancelled': 'red',
  };
});

final activityStatusDisplayNamesProvider = Provider<Map<String, String>>((ref) {
  return {
    'todo': 'Yapılacak',
    'in_progress': 'Devam Ediyor',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
  };
});

final activityPriorityColorsProvider = Provider<Map<String, String>>((ref) {
  return {
    'low': 'blue',
    'medium': 'yellow',
    'high': 'orange',
    'urgent': 'red',
  };
});

final activityPriorityDisplayNamesProvider = Provider<Map<String, String>>((ref) {
  return {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek',
    'urgent': 'Acil',
  };
});
