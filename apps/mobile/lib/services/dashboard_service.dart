import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/activity.dart';
import '../models/approval.dart';
import '../models/notification.dart' as notification_model;

class DashboardService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Kullanıcının kişisel aktivitelerini getir
  Future<List<Activity>> getPersonalActivities({String? companyId, String? userId}) async {
    try {
      dynamic query = _supabase
          .from('activities')
          .select('*')
          .eq('assignee_id', userId ?? _supabase.auth.currentUser!.id);

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query
          .order('due_date', ascending: true)
          .order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Activity.fromJson(json)).toList();
    } catch (e) {
      print('Kişisel aktiviteler getirme hatası: $e');
      throw Exception('Kişisel aktiviteler getirilemedi: $e');
    }
  }

  // Bugünkü aktiviteleri getir
  Future<List<Activity>> getTodayActivities({String? companyId, String? userId}) async {
    try {
      final allActivities = await getPersonalActivities(companyId: companyId, userId: userId);
      final today = DateTime.now();
      return allActivities.where((activity) {
        if (activity.dueDate == null) return false;
        return activity.dueDate!.year == today.year &&
               activity.dueDate!.month == today.month &&
               activity.dueDate!.day == today.day &&
               activity.status != 'completed';
      }).toList();
    } catch (e) {
      print('Bugünkü aktiviteler getirme hatası: $e');
      throw Exception('Bugünkü aktiviteler getirilemedi: $e');
    }
  }

  // Bekleyen onayları getir
  Future<List<Approval>> getPendingApprovals({String? companyId, String? approverId}) async {
    try {
      dynamic query = _supabase
          .from('approvals')
          .select('*')
          .eq('approver_id', approverId ?? _supabase.auth.currentUser!.id)
          .eq('status', 'pending');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Approval.fromJson(json)).toList();
    } catch (e) {
      print('Bekleyen onaylar getirme hatası: $e');
      throw Exception('Bekleyen onaylar getirilemedi: $e');
    }
  }

  // Son bildirimleri getir
  Future<List<notification_model.NotificationModel>> getRecentNotifications({
    String? companyId,
    String? userId,
    int limit = 10,
  }) async {
    try {
      dynamic query = _supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId ?? _supabase.auth.currentUser!.id);

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query
          .order('created_at', ascending: false)
          .limit(limit);

      final response = await query;
      return (response as List)
          .map((json) => notification_model.NotificationModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Son bildirimler getirme hatası: $e');
      throw Exception('Son bildirimler getirilemedi: $e');
    }
  }

  // Dashboard istatistiklerini getir
  Future<Map<String, dynamic>> getDashboardStats({
    String? companyId,
    String? userId,
  }) async {
    try {
      final todayActivities = await getTodayActivities(companyId: companyId, userId: userId);
      final pendingApprovals = await getPendingApprovals(
        companyId: companyId,
        approverId: userId,
      );
      final allActivities = await getPersonalActivities(companyId: companyId, userId: userId);
      final overdueActivities = allActivities.where((activity) => activity.isOverdue).length;
      final completedActivities = allActivities.where((activity) => activity.status == 'completed').length;

      // Okunmamış bildirim sayısı
      final unreadNotifications = await _supabase
          .from('notifications')
          .select()
          .eq('user_id', userId ?? _supabase.auth.currentUser!.id)
          .eq('is_read', false)
          .count(CountOption.exact);

      return {
        'todayActivitiesCount': todayActivities.length,
        'pendingApprovalsCount': pendingApprovals.length,
        'overdueActivitiesCount': overdueActivities,
        'completedActivitiesCount': completedActivities,
        'totalActivitiesCount': allActivities.length,
        'unreadNotificationsCount': unreadNotifications.count ?? 0,
      };
    } catch (e) {
      print('Dashboard istatistikleri getirme hatası: $e');
      throw Exception('Dashboard istatistikleri getirilemedi: $e');
    }
  }
}

