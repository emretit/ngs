import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/service_request.dart';
import '../services/service_request_service.dart';
import 'auth_provider.dart';

final serviceRequestServiceProvider = Provider<ServiceRequestService>((ref) {
  return ServiceRequestService();
});

// Kullanıcının company_id'sini Supabase'den çek
Future<String?> _getCurrentUserCompanyId() async {
  try {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;
    
    final profileResponse = await Supabase.instance.client
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
    
    return profileResponse?['company_id'];
  } catch (e) {
    print('Company ID getirme hatası: $e');
    return null;
  }
}

final serviceRequestsProvider = FutureProvider<List<ServiceRequest>>((ref) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.getServiceRequests(companyId: companyId);
});

final serviceRequestStatsProvider = FutureProvider<Map<String, int>>((ref) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.getServiceRequestStats(companyId: companyId);
});

final serviceRequestByIdProvider = FutureProvider.family<ServiceRequest?, String>((ref, id) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.getServiceRequestById(id, companyId: companyId);
});

final serviceRequestsByStatusProvider = FutureProvider.family<List<ServiceRequest>, String>((ref, status) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.getServiceRequests(status: status, companyId: companyId);
});

final serviceRequestsByAssigneeProvider = FutureProvider.family<List<ServiceRequest>, String>((ref, assigneeId) async {
  final service = ref.read(serviceRequestServiceProvider);
  return await service.getServiceRequestsByAssignee(assigneeId);
});

final serviceRequestsByCustomerProvider = FutureProvider.family<List<ServiceRequest>, String>((ref, customerId) async {
  final service = ref.read(serviceRequestServiceProvider);
  return await service.getServiceRequestsByCustomer(customerId);
});

final serviceRequestSearchProvider = FutureProvider.family<List<ServiceRequest>, String>((ref, query) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.searchServiceRequests(query, companyId: companyId);
});

final serviceActivitiesProvider = FutureProvider.family<List<ServiceActivity>, String>((ref, serviceRequestId) async {
  final service = ref.read(serviceRequestServiceProvider);
  return await service.getServiceActivities(serviceRequestId);
});

final serviceHistoryProvider = FutureProvider.family<List<ServiceHistory>, String>((ref, serviceRequestId) async {
  final service = ref.read(serviceRequestServiceProvider);
  return await service.getServiceHistory(serviceRequestId);
});

// Service request durumları
final serviceRequestStatusesProvider = Provider<List<String>>((ref) {
  return [
    'new',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled',
  ];
});

// Service request öncelikleri
final serviceRequestPrioritiesProvider = Provider<List<String>>((ref) {
  return [
    'low',
    'medium',
    'high',
    'urgent',
  ];
});

// Durum renkleri
final serviceRequestStatusColorsProvider = Provider<Map<String, String>>((ref) {
  return {
    'new': 'blue',
    'assigned': 'orange',
    'in_progress': 'green',
    'on_hold': 'yellow',
    'completed': 'green',
    'cancelled': 'red',
  };
});

// Öncelik renkleri
final serviceRequestPriorityColorsProvider = Provider<Map<String, String>>((ref) {
  return {
    'low': 'green',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red',
  };
});

// Durum görüntüleme adları
final serviceRequestStatusDisplayNamesProvider = Provider<Map<String, String>>((ref) {
  return {
    'new': 'Yeni',
    'assigned': 'Atandı',
    'in_progress': 'Devam Ediyor',
    'on_hold': 'Beklemede',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
  };
});

// Öncelik görüntüleme adları
final serviceRequestPriorityDisplayNamesProvider = Provider<Map<String, String>>((ref) {
  return {
    'low': 'Düşük',
    'medium': 'Normal',
    'high': 'Yüksek',
    'urgent': 'Acil',
  };
});

// Teknisyen listesi (is_technical = true olan çalışanlar)
final techniciansProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(serviceRequestServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  
  if (companyId == null) {
    throw Exception('Kullanıcının company_id bilgisi bulunamadı');
  }
  
  return await service.getTechnicians(companyId: companyId);
});
