import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/activity.dart';
import 'logger_service.dart';

class ActivityService {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  // Employee ID cache (static - tüm instance'lar arasında paylaşılır)
  static String? _cachedEmployeeId;
  static String? _cachedUserId;

  // ID'ye göre aktivite getir
  Future<Activity> getActivityById(String id) async {
    try {
      final response = await _supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .single();

      return Activity.fromJson(response);
    } catch (e) {
      AppLogger.error('Aktivite getirme hatası', e);
      throw Exception('Aktivite getirilemedi: $e');
    }
  }

  // Kullanıcının kişisel aktivitelerini getir
  Future<List<Activity>> getPersonalActivities({String? companyId, String? userId}) async {
    try {
      final targetUserId = userId ?? _supabase.auth.currentUser!.id;
      
      // Kullanıcının employee_id'sini bul
      final employeeId = await _getEmployeeIdForUser(targetUserId);
      
      dynamic query = _supabase
          .from('activities')
          .select('*')
          .eq('type', 'activity'); // Sadece 'activity' tipindeki kayıtları getir

      // Employee ID varsa onu kullan
      if (employeeId != null) {
        query = query.eq('assignee_id', employeeId);
      } else {
        // Employee ID yoksa, assignee_id null olan aktiviteleri getir
        // (Kullanıcının employee kaydı yoksa, kendi oluşturduğu aktiviteleri görmek için)
        query = query.isFilter('assignee_id', null);
      }

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query
          .order('due_date', ascending: true)
          .order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Activity.fromJson(json)).toList();
    } catch (e) {
      AppLogger.error('Kişisel aktiviteler getirme hatası: $e');
      throw Exception('Kişisel aktiviteler getirilemedi: $e');
    }
  }

  // Kullanıcının employee_id'sini bul (profiles -> employees ilişkisi üzerinden)
  // Cache mekanizması ile optimize edilmiş
  Future<String?> _getEmployeeIdForUser(String userId) async {
    try {
      // Cache kontrolü - aynı kullanıcı için cache'lenmiş değer varsa direkt döndür
      if (_cachedEmployeeId != null && _cachedUserId == userId) {
        return _cachedEmployeeId;
      }
      
      // Önce profiles tablosundan employee_id'yi kontrol et
      final profileResponse = await _supabase
          .from('profiles')
          .select('employee_id')
          .eq('id', userId)
          .maybeSingle();
      
      if (profileResponse != null && profileResponse['employee_id'] != null) {
        final employeeId = profileResponse['employee_id'] as String;
        // Cache'e kaydet
        _cachedEmployeeId = employeeId;
        _cachedUserId = userId;
        return employeeId;
      }
      
      // Eğer profiles'da yoksa, employees tablosunda user_id ile ara
      final employeeResponse = await _supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
      
      if (employeeResponse != null && employeeResponse['id'] != null) {
        final employeeId = employeeResponse['id'] as String;
        // Cache'e kaydet
        _cachedEmployeeId = employeeId;
        _cachedUserId = userId;
        return employeeId;
      }
      
      // Employee bulunamazsa null döndür (assignee_id nullable)
      // Null değeri de cache'le (tekrar sorgu yapmamak için)
      _cachedEmployeeId = null;
      _cachedUserId = userId;
      return null;
    } catch (e) {
      AppLogger.error('Employee ID bulma hatası: $e');
      return null;
    }
  }
  
  // Cache'i temizle (logout veya profil değişikliklerinde kullanılır)
  static void clearCache() {
    _cachedEmployeeId = null;
    _cachedUserId = null;
  }

  // Yeni aktivite oluştur
  Future<Activity> createActivity({
    required String title,
    String? description,
    String? dueDate,
    String priority = 'medium',
    String status = 'todo',
    String? companyId,
    String? userId,
    String? assigneeId,
    String? relatedItemId,
    String? relatedItemType,
    String? relatedItemTitle,
    String? opportunityId,
    bool? isImportant,
    bool? isRecurring,
    String? recurrenceType,
    int? recurrenceInterval,
    String? recurrenceEndDate,
    List<String>? recurrenceDays,
    int? recurrenceDayOfMonth,
  }) async {
    try {
      final targetUserId = userId ?? _supabase.auth.currentUser!.id;
      
      // Kullanıcının employee_id'sini bul (assigneeId yoksa)
      String? employeeId = assigneeId;
      if (employeeId == null) {
        employeeId = await _getEmployeeIdForUser(targetUserId);
      }
      
      final now = DateTime.now().toIso8601String();
      final data = {
        'title': title,
        'description': description,
        'status': status,
        'priority': priority,
        'due_date': dueDate,
        if (employeeId != null) 'assignee_id': employeeId,
        'type': 'activity',
        'created_at': now,
        'updated_at': now,
        if (companyId != null) 'company_id': companyId,
        if (relatedItemId != null) 'related_item_id': relatedItemId,
        if (relatedItemType != null) 'related_item_type': relatedItemType,
        if (relatedItemTitle != null) 'related_item_title': relatedItemTitle,
        if (opportunityId != null) 'opportunity_id': opportunityId,
        if (isImportant != null) 'is_important': isImportant,
        if (isRecurring != null) 'is_recurring': isRecurring,
        if (recurrenceType != null) 'recurrence_type': recurrenceType,
        if (recurrenceInterval != null) 'recurrence_interval': recurrenceInterval,
        if (recurrenceEndDate != null) 'recurrence_end_date': recurrenceEndDate,
        if (recurrenceDays != null) 'recurrence_days': recurrenceDays,
        if (recurrenceDayOfMonth != null) 'recurrence_day_of_month': recurrenceDayOfMonth,
      };

      final response = await _supabase
          .from('activities')
          .insert(data)
          .select()
          .single();

      return Activity.fromJson(response);
    } catch (e) {
      AppLogger.error('Aktivite oluşturma hatası: $e');
      throw Exception('Aktivite oluşturulamadı: $e');
    }
  }

  // Aktivite güncelle
  Future<Activity> updateActivity({
    required String id,
    String? title,
    String? description,
    String? status,
    String? priority,
    String? dueDate,
    String? assigneeId,
    String? opportunityId,
    bool? isImportant,
    bool? isRecurring,
    String? recurrenceType,
    int? recurrenceInterval,
    String? recurrenceEndDate,
    List<String>? recurrenceDays,
    int? recurrenceDayOfMonth,
  }) async {
    try {
      final data = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (title != null) data['title'] = title;
      if (description != null) data['description'] = description;
      if (status != null) data['status'] = status;
      if (priority != null) data['priority'] = priority;
      if (assigneeId != null) data['assignee_id'] = assigneeId;
      if (opportunityId != null) data['opportunity_id'] = opportunityId;
      if (isImportant != null) data['is_important'] = isImportant;
      if (isRecurring != null) data['is_recurring'] = isRecurring;
      if (recurrenceType != null) data['recurrence_type'] = recurrenceType;
      if (recurrenceInterval != null) data['recurrence_interval'] = recurrenceInterval;
      if (recurrenceEndDate != null) {
        data['recurrence_end_date'] = recurrenceEndDate;
      } else if (recurrenceEndDate == null && data.containsKey('recurrence_end_date')) {
        data['recurrence_end_date'] = null;
      }
      if (recurrenceDays != null) data['recurrence_days'] = recurrenceDays;
      if (recurrenceDayOfMonth != null) data['recurrence_day_of_month'] = recurrenceDayOfMonth;
      
      if (dueDate != null) {
        data['due_date'] = dueDate;
      } else if (dueDate == null && data.containsKey('due_date')) {
        data['due_date'] = null;
      }

      final response = await _supabase
          .from('activities')
          .update(data)
          .eq('id', id)
          .select()
          .single();

      return Activity.fromJson(response);
    } catch (e) {
      AppLogger.error('Aktivite güncelleme hatası: $e');
      throw Exception('Aktivite güncellenemedi: $e');
    }
  }

  // Aktivite durumunu güncelle (tamamla/iptal et)
  Future<Activity> updateActivityStatus({
    required String id,
    required String status,
  }) async {
    try {
      final response = await _supabase
          .from('activities')
          .update({
            'status': status,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id)
          .select()
          .single();

      return Activity.fromJson(response);
    } catch (e) {
      AppLogger.error('Aktivite durumu güncelleme hatası: $e');
      throw Exception('Aktivite durumu güncellenemedi: $e');
    }
  }

  // Aktivite sil
  Future<void> deleteActivity(String id) async {
    try {
      await _supabase.from('activities').delete().eq('id', id);
    } catch (e) {
      AppLogger.error('Aktivite silme hatası: $e');
      throw Exception('Aktivite silinemedi: $e');
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
      AppLogger.error('Bugünkü aktiviteler getirme hatası: $e');
      throw Exception('Bugünkü aktiviteler getirilemedi: $e');
    }
  }

  // Şirket genelindeki tüm aktiviteleri getir (pagination ile optimize edilmiş)
  Future<List<Activity>> getAllCompanyActivities({
    String? companyId,
    int page = 0,
    int pageSize = 50,
  }) async {
    try {
      final start = page * pageSize;
      final end = start + pageSize - 1;

      dynamic query = _supabase
          .from('activities')
          .select('*')
          .eq('type', 'activity'); // Sadece 'activity' tipindeki kayıtları getir

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query
          .order('due_date', ascending: true)
          .order('created_at', ascending: false)
          .range(start, end); // Supabase pagination

      final response = await query;
      return (response as List).map((json) => Activity.fromJson(json)).toList();
    } catch (e) {
      AppLogger.error('Şirket aktiviteleri getirme hatası: $e');
      throw Exception('Şirket aktiviteleri getirilemedi: $e');
    }
  }
}

