import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../services/activity_service.dart';
import 'auth_provider.dart';

final activityServiceProvider = Provider<ActivityService>((ref) {
  return ActivityService();
});

final activitiesProvider = FutureProvider<List<Activity>>((ref) async {
  final activityService = ref.watch(activityServiceProvider);
  final authState = ref.watch(authStateProvider);
  final companyId = authState.user?.companyId;
  final userId = authState.user?.id;

  return await activityService.getPersonalActivities(
    companyId: companyId,
    userId: userId,
  );
});

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
