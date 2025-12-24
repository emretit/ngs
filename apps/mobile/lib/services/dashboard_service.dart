import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/activity.dart';
import '../models/approval.dart';
import '../models/notification.dart' as notification_model;
import 'logger_service.dart';

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
      AppLogger.error('Kişisel aktiviteler getirme hatası', e);
      throw Exception('Kişisel aktiviteler getirilemedi: $e');
    }
  }

  // Bugünkü aktiviteleri getir (kullanıcının kendi aktiviteleri)
  Future<List<Activity>> getTodayActivities({String? companyId, String? userId}) async {
    try {
      final today = DateTime.now();
      final todayStart = DateTime(today.year, today.month, today.day);
      final todayEnd = todayStart.add(const Duration(days: 1));
      
      dynamic query = _supabase
          .from('activities')
          .select('*')
          .eq('assignee_id', userId ?? _supabase.auth.currentUser!.id)
          .gte('due_date', todayStart.toIso8601String())
          .lt('due_date', todayEnd.toIso8601String())
          .neq('status', 'completed');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query
          .order('due_date', ascending: true)
          .order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Activity.fromJson(json)).toList();
    } catch (e) {
      AppLogger.error('Bugünkü aktiviteler getirme hatası', e);
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
      AppLogger.error('Bekleyen onaylar getirme hatası', e);
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
      AppLogger.error('Son bildirimler getirme hatası', e);
      throw Exception('Son bildirimler getirilemedi: $e');
    }
  }

  // Dashboard istatistiklerini getir (paralel API çağrıları ile optimize edilmiş)
  Future<Map<String, dynamic>> getDashboardStats({
    String? companyId,
    String? userId,
  }) async {
    try {
      final effectiveUserId = userId ?? _supabase.auth.currentUser!.id;
      
      // Tüm API çağrılarını paralel olarak yap
      final results = await Future.wait([
        // 1. Bekleyen onaylar
        getPendingApprovals(
          companyId: companyId,
          approverId: effectiveUserId,
        ),
        // 2. Tüm kişisel aktiviteler
        getPersonalActivities(companyId: companyId, userId: effectiveUserId),
        // 3. Okunmamış bildirim sayısı
        _supabase
            .from('notifications')
            .select()
            .eq('user_id', effectiveUserId)
            .eq('is_read', false)
            .count(CountOption.exact)
            .then((response) => (response as PostgrestResponse).count ?? 0),
      ]);

      final pendingApprovals = results[0] as List<Approval>;
      final allActivities = results[1] as List<Activity>;
      final unreadCount = results[2] as int;

      // Client-side hesaplamalar
      final today = DateTime.now();
      final todayActivities = allActivities.where((activity) {
        if (activity.dueDate == null || activity.status == 'completed') return false;
        return activity.dueDate!.day == today.day &&
            activity.dueDate!.month == today.month &&
            activity.dueDate!.year == today.year;
      }).length;

      final overdueActivities = allActivities.where((activity) => activity.isOverdue).length;
      final completedActivities = allActivities.where((activity) => activity.status == 'completed').length;

      return {
        'todayActivitiesCount': todayActivities,
        'pendingApprovalsCount': pendingApprovals.length,
        'overdueActivitiesCount': overdueActivities,
        'completedActivitiesCount': completedActivities,
        'totalActivitiesCount': allActivities.length,
        'unreadNotificationsCount': unreadCount,
      };
    } catch (e) {
      AppLogger.error('Dashboard istatistikleri getirme hatası', e);
      throw Exception('Dashboard istatistikleri getirilemedi: $e');
    }
  }
}

