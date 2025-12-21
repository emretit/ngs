import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/dashboard_service.dart';
import '../models/activity.dart';
import '../models/approval.dart';
import '../models/notification.dart' as notification_model;
import 'auth_provider.dart';

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  return DashboardService();
});

// Kişisel aktiviteler provider
final personalActivitiesProvider = FutureProvider<List<Activity>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  final authState = ref.read(authStateProvider);
  final user = authState.user;

  if (user == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getPersonalActivities(
    companyId: user.companyId,
    userId: user.id,
  );
});

// Bugünkü aktiviteler provider
final todayActivitiesProvider = FutureProvider<List<Activity>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  final authState = ref.read(authStateProvider);
  final user = authState.user;

  if (user == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getTodayActivities(
    companyId: user.companyId,
    userId: user.id,
  );
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

// Dashboard istatistikleri provider
final dashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  final authState = ref.read(authStateProvider);
  final user = authState.user;

  if (user == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getDashboardStats(
    companyId: user.companyId,
    userId: user.id,
  );
});

