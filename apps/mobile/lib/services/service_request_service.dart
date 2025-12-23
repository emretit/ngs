import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/service_request.dart';
import 'push_notification_service.dart';
import 'service_number_generator.dart';

class ServiceRequestService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final PushNotificationService _pushNotificationService = PushNotificationService();
  final ServiceNumberGenerator _numberGenerator = ServiceNumberGenerator(Supabase.instance.client);

  // Tüm servis taleplerini getir
  Future<List<ServiceRequest>> getServiceRequests({
    String? status,
    String? priority,
    String? assignedTo,
    String? customerId,
    String? companyId,
    int? limit,
    int? offset,
  }) async {
    int retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        dynamic query = _supabase
            .from('service_requests')
            .select('*');

        // Company_id filtresi - güvenlik için zorunlu
        if (companyId != null) {
          query = query.eq('company_id', companyId);
        }

        if (status != null) {
          query = query.eq('service_status', status);
        }
        if (priority != null) {
          query = query.eq('service_priority', priority);
        }
        if (assignedTo != null) {
          query = query.eq('assigned_technician', assignedTo);
        }
        if (customerId != null) {
          query = query.eq('customer_id', customerId);
        }

        query = query.order('created_at', ascending: false);

        if (limit != null) {
          query = query.limit(limit);
        }
        if (offset != null) {
          query = query.range(offset, offset + (limit ?? 10) - 1);
        }

        final response = await query;
        return (response as List).map((json) => ServiceRequest.fromJson(json)).toList();
      } catch (e) {
        retryCount++;
        print('Service requests getirme hatası (deneme $retryCount/$maxRetries): $e');
        
        if (retryCount >= maxRetries) {
          throw Exception('Servis talepleri getirilemedi: $e');
        }
        
        // Exponential backoff ile bekle
        await Future.delayed(Duration(seconds: retryCount * 2));
      }
    }
    
    throw Exception('Servis talepleri getirilemedi: Maksimum deneme sayısı aşıldı');
  }

  // ID'ye göre servis talebi getir
  Future<ServiceRequest?> getServiceRequestById(String id, {String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('service_requests')
          .select('''
            *,
            customers (
              id,
              name,
              company,
              email,
              mobile_phone,
              office_phone,
              address
            )
          ''')
          .eq('id', id);

      // Company_id filtresi - güvenlik için zorunlu
      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      final response = await query.single();

      // Müşteri bilgilerini customer_data'ya dönüştür
      if (response['customers'] != null) {
        final customer = response['customers'];
        response['customer_data'] = {
          'id': customer['id'],
          'name': customer['name'],
          'company': customer['company'],
          'email': customer['email'],
          'phone': customer['mobile_phone'] ?? customer['office_phone'],
          'address': customer['address'],
        };
        // customer_name'i de set et
        if (customer['name'] != null) {
          response['customer_name'] = customer['name'];
        }
      }

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Service request getirme hatası: $e');
      return null;
    }
  }

  // Yeni servis talebi oluştur (retry mekanizması ile)
  Future<ServiceRequest> createServiceRequest(ServiceRequest serviceRequest) async {
    int attempts = 0;
    const maxAttempts = 5;
    String? currentServiceNumber = serviceRequest.serviceNumber?.trim();
    String? companyId; // companyId'yi dışarıda tut
    
    // Eğer kullanıcı numara girmediyse, otomatik üret
    if (currentServiceNumber == null || currentServiceNumber.isEmpty) {
      currentServiceNumber = null; // Kayıt anında üretilecek
    }

    // Retry mekanizması ile kayıt yap
    while (attempts < maxAttempts) {
      try {
        // Eğer created_by yoksa, mevcut kullanıcıyı ekle
        final jsonData = serviceRequest.toJson();
        final currentUser = _supabase.auth.currentUser;
        
        if (currentUser != null) {
          // created_by set et
          if (jsonData['created_by'] == null) {
            jsonData['created_by'] = currentUser.id;
          }
          
          // company_id'yi otomatik olarak set et (profiles tablosundan)
          if (jsonData['company_id'] == null) {
            try {
              final profileResponse = await _supabase
                  .from('profiles')
                  .select('company_id')
                  .eq('id', currentUser.id)
                  .maybeSingle();
              
              if (profileResponse != null && profileResponse['company_id'] != null) {
                jsonData['company_id'] = profileResponse['company_id'];
              }
            } catch (e) {
              print('Company ID getirme hatası: $e');
              // Hata durumunda devam et, Supabase trigger'ı set edebilir
            }
          }
        }

        // companyId'yi sakla (retry için gerekli)
        companyId = jsonData['company_id'] as String?;
        
        // Servis numarasını otomatik oluştur (kayıt anında)
        if (currentServiceNumber == null || currentServiceNumber.isEmpty) {
          try {
            currentServiceNumber = await _numberGenerator.generateServiceNumber(companyId);
            jsonData['service_number'] = currentServiceNumber;
          } catch (e) {
            print('Servis numarası üretme hatası: $e');
            // Fallback: timestamp kullan
            final now = DateTime.now();
            jsonData['service_number'] = 'SRV-${now.millisecondsSinceEpoch}';
          }
        } else {
          // Kullanıcının girdiği numara kullanılıyor
          jsonData['service_number'] = currentServiceNumber;
        }
        
        final response = await _supabase
            .from('service_requests')
            .insert(jsonData)
            .select()
            .single();

        return ServiceRequest.fromJson(response);
        
      } catch (e) {
        // PostgreSQL unique constraint hatası (23505)
        final errorString = e.toString();
        final isUniqueConstraintError = errorString.contains('23505') || 
                                       errorString.contains('duplicate key') ||
                                       errorString.contains('unique constraint') ||
                                       (errorString.contains('service_number') && 
                                        errorString.contains('already exists'));
        
        if (isUniqueConstraintError && 
            (currentServiceNumber == null || currentServiceNumber.isEmpty || attempts > 0)) {
          attempts++;
          
          if (attempts >= maxAttempts) {
            throw Exception('Servis numarası çakışması. Lütfen tekrar deneyin.');
          }
          
          // Yeni numara üret (sadece otomatik üretilen numaralar için)
          try {
            currentServiceNumber = await _numberGenerator.generateServiceNumber(companyId);
            print('🔄 Çakışma tespit edildi, yeni numara üretildi: $currentServiceNumber (Deneme: $attempts/$maxAttempts)');
          } catch (genError) {
            print('Yeni servis numarası üretme hatası: $genError');
            // Fallback: timestamp kullan
            final now = DateTime.now();
            currentServiceNumber = 'SRV-${now.millisecondsSinceEpoch}';
          }
          
          // Exponential backoff: 100ms, 200ms, 300ms, ...
          await Future.delayed(Duration(milliseconds: 100 * attempts));
          continue; // Tekrar dene
        }
        
        // Diğer hatalar için direkt fırlat
        print('Service request oluşturma hatası: $e');
        throw Exception('Servis talebi oluşturulamadı: $e');
      }
    }
    
    throw Exception('Servis kaydı oluşturulamadı. Maksimum deneme sayısına ulaşıldı.');
  }

  // Servis talebi güncelle
  Future<ServiceRequest> updateServiceRequest(String id, ServiceRequest serviceRequest) async {
    try {
      // Önce mevcut servis talebini al
      final currentRequest = await getServiceRequestById(id);
      if (currentRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      // Eğer assigned_technician değiştiyse, özel atama metodunu kullan
      final oldAssignedTo = currentRequest.assignedTo;
      final newAssignedTo = serviceRequest.assignedTo;
      
      print('🔍 Atama kontrolü:');
      print('  - Eski: $oldAssignedTo');
      print('  - Yeni: $newAssignedTo');
      print('  - Değişti mi: ${oldAssignedTo != newAssignedTo}');
      
      if (oldAssignedTo != newAssignedTo) {
        print('🔔 Atama değişti: $oldAssignedTo -> $newAssignedTo');
        // Önce diğer alanları güncelle
        final updateData = serviceRequest.toJson();
        // assigned_technician'ı çıkar (updateServiceRequestAssignment bunu yapacak)
        updateData.remove('assigned_technician');
        
        if (updateData.isNotEmpty) {
          print('📝 Diğer alanlar güncelleniyor...');
          await _supabase
              .from('service_requests')
              .update(updateData)
              .eq('id', id);
        }
        
        // Atama güncellemesini özel metodla yap (trigger ve bildirim için)
        print('🎯 updateServiceRequestAssignment çağrılıyor...');
        return await updateServiceRequestAssignment(id, serviceRequest.assignedTo);
      } else {
        print('ℹ️ Atama değişmedi, normal güncelleme yapılıyor');
      }

      // Atama değişmediyse normal güncelleme yap
      final response = await _supabase
          .from('service_requests')
          .update(serviceRequest.toJson())
          .eq('id', id)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Service request güncelleme hatası: $e');
      throw Exception('Servis talebi güncellenemedi: $e');
    }
  }

  // Servis talebi sil
  Future<void> deleteServiceRequest(String id) async {
    try {
      await _supabase
          .from('service_requests')
          .delete()
          .eq('id', id);
    } catch (e) {
      print('Service request silme hatası: $e');
      throw Exception('Servis talebi silinemedi: $e');
    }
  }

  // Servis talebi arama
  Future<List<ServiceRequest>> searchServiceRequests(String searchQuery, {String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('service_requests')
          .select('*')
          .or('service_title.ilike.%$searchQuery%,service_request_description.ilike.%$searchQuery%,service_location.ilike.%$searchQuery%');

      // Company_id filtresi - güvenlik için zorunlu
      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => ServiceRequest.fromJson(json)).toList();
    } catch (e) {
      print('Service request arama hatası: $e');
      throw Exception('Servis talebi araması yapılamadı: $e');
    }
  }

  // Müşteriye göre servis talepleri getir
  Future<List<ServiceRequest>> getServiceRequestsByCustomer(String customerId) async {
    try {
      final response = await _supabase
          .from('service_requests')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', ascending: false);

      return (response as List).map((json) => ServiceRequest.fromJson(json)).toList();
    } catch (e) {
      print('Müşteri servis talepleri getirme hatası: $e');
      throw Exception('Müşteri servis talepleri getirilemedi: $e');
    }
  }

  // Atanan kişiye göre servis talepleri getir
  Future<List<ServiceRequest>> getServiceRequestsByAssignee(String assignedTo) async {
    try {
      final response = await _supabase
          .from('service_requests')
          .select('*')
          .eq('assigned_technician', assignedTo)
          .order('created_at', ascending: false);

      return (response as List).map((json) => ServiceRequest.fromJson(json)).toList();
    } catch (e) {
      print('Atanan servis talepleri getirme hatası: $e');
      throw Exception('Atanan servis talepleri getirilemedi: $e');
    }
  }

  // Durum güncelleme
  Future<ServiceRequest> updateServiceRequestStatus(String id, String status) async {
    try {
      // Önce mevcut servis talebini al
      final currentRequest = await getServiceRequestById(id);
      if (currentRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      final oldStatus = currentRequest.serviceStatus;
      final now = DateTime.now();

      // Güncellenecek alanları hazırla
      final updateData = <String, dynamic>{
        'service_status': status,
        'updated_at': now.toIso8601String(),
      };

      // Servis başlatıldığında başlama tarihini ayarla
      if (status == 'in_progress' && currentRequest.serviceStartDate == null) {
        updateData['service_start_date'] = now.toIso8601String();
      }

      // Servis tamamlandığında bitirme tarihini ayarla
      if (status == 'completed' && currentRequest.serviceEndDate == null) {
        updateData['service_end_date'] = now.toIso8601String();
      }

      final response = await _supabase
          .from('service_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

      final updatedRequest = ServiceRequest.fromJson(response);

      // Müşteriye durum güncelleme bildirimi gönder
      if (currentRequest.customerId != null) {
        await _pushNotificationService.sendStatusUpdateNotification(
          customerId: currentRequest.customerId!,
          serviceTitle: currentRequest.serviceTitle,
          oldStatus: oldStatus,
          newStatus: status,
        );
      }

      // Servis tamamlandıysa özel bildirim gönder
      if (status == 'completed' && currentRequest.assignedTechnician != null) {
        await _pushNotificationService.sendServiceCompletedNotification(
          customerId: currentRequest.customerId ?? '',
          serviceTitle: currentRequest.serviceTitle,
          technicianName: 'Teknisyen', // Burada gerçek teknisyen adı alınabilir
        );
      }

      return updatedRequest;
    } catch (e) {
      print('Servis talebi durumu güncelleme hatası: $e');
      throw Exception('Servis talebi durumu güncellenemedi: $e');
    }
  }

  // Öncelik güncelleme
  Future<ServiceRequest> updateServiceRequestPriority(String id, String priority) async {
    try {
      final response = await _supabase
          .from('service_requests')
          .update({'service_priority': priority, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', id)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis talebi önceliği güncelleme hatası: $e');
      throw Exception('Servis talebi önceliği güncellenemedi: $e');
    }
  }

  // Atama güncelleme
  Future<ServiceRequest> updateServiceRequestAssignment(String id, String? assignedTo) async {
    try {
      print('🔔 updateServiceRequestAssignment çağrıldı:');
      print('  - Service Request ID: $id');
      print('  - Assigned To: $assignedTo');
      
      // Önce mevcut servis talebini al
      final currentRequest = await getServiceRequestById(id);
      if (currentRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      print('  - Mevcut assigned_technician: ${currentRequest.assignedTo}');
      print('  - Yeni assigned_technician: $assignedTo');
      print('  - Trigger tetiklenecek: ${currentRequest.assignedTo != assignedTo}');

      final response = await _supabase
          .from('service_requests')
          .update({
            'assigned_technician': assignedTo,
            'updated_at': DateTime.now().toIso8601String()
          })
          .eq('id', id)
          .select()
          .single();

      print('✅ Veritabanı güncellendi - trigger tetiklenmeli');

      final updatedRequest = ServiceRequest.fromJson(response);

      // Teknisyene bildirim gönder (mobil uygulamadan direkt çağrı için)
      // NOT: Trigger zaten push notification gönderecek, bu sadece mobil uygulamadan çağrıldığında çalışır
      if (assignedTo != null) {
        print('📤 Mobil uygulamadan bildirim gönderiliyor...');
        await _pushNotificationService.sendServiceAssignmentNotification(
          technicianId: assignedTo,
          serviceRequestId: id,
          customerName: currentRequest.customerName ?? 'Müşteri',
          serviceTitle: currentRequest.serviceTitle,
        );
      }

      return updatedRequest;
    } catch (e) {
      print('❌ Servis talebi ataması güncelleme hatası: $e');
      print('   Stack trace: ${StackTrace.current}');
      throw Exception('Servis talebi ataması güncellenemedi: $e');
    }
  }

  // Servis aktivitelerini getir
  Future<List<ServiceActivity>> getServiceActivities(String serviceRequestId) async {
    try {
      final response = await _supabase
          .from('service_activities')
          .select('*')
          .eq('service_request_id', serviceRequestId)
          .order('created_at', ascending: false);

      return (response as List).map((json) => ServiceActivity.fromJson(json)).toList();
    } catch (e) {
      print('Servis aktiviteleri getirme hatası: $e');
      throw Exception('Servis aktiviteleri getirilemedi: $e');
    }
  }

  // Servis aktivitesi oluştur
  Future<ServiceActivity> createServiceActivity(ServiceActivity activity) async {
    try {
      final response = await _supabase
          .from('service_activities')
          .insert(activity.toJson())
          .select()
          .single();

      return ServiceActivity.fromJson(response);
    } catch (e) {
      print('Servis aktivitesi oluşturma hatası: $e');
      throw Exception('Servis aktivitesi oluşturulamadı: $e');
    }
  }

  // Servis geçmişini getir
  Future<List<ServiceHistory>> getServiceHistory(String serviceRequestId) async {
    try {
      final response = await _supabase
          .from('service_history')
          .select('*')
          .eq('service_request_id', serviceRequestId)
          .order('created_at', ascending: false);

      return (response as List).map((json) => ServiceHistory.fromJson(json)).toList();
    } catch (e) {
      print('Servis geçmişi getirme hatası: $e');
      throw Exception('Servis geçmişi getirilemedi: $e');
    }
  }

  // Servis geçmişi kaydı oluştur
  Future<ServiceHistory> createServiceHistory(ServiceHistory history) async {
    try {
      final response = await _supabase
          .from('service_history')
          .insert(history.toJson())
          .select()
          .single();

      return ServiceHistory.fromJson(response);
    } catch (e) {
      print('Servis geçmişi oluşturma hatası: $e');
      throw Exception('Servis geçmişi oluşturulamadı: $e');
    }
  }

  // Not ekleme
  Future<ServiceRequest> addNote(String id, String note) async {
    try {
      // Önce mevcut notları al
      final currentRequest = await getServiceRequestById(id);
      if (currentRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      // Yeni notu ekle
      final updatedNotes = [...(currentRequest.notes ?? []), note];

      final response = await _supabase
          .from('service_requests')
          .update({
            'notes': updatedNotes,
            'updated_at': DateTime.now().toIso8601String()
          })
          .eq('id', id)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Not ekleme hatası: $e');
      throw Exception('Not eklenemedi: $e');
    }
  }

  // İstatistikler
  Future<Map<String, int>> getServiceRequestStats({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('service_requests')
          .select('service_status');

      // Company_id filtresi - güvenlik için zorunlu
      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      final response = await query;

      final stats = <String, int>{};
      for (final item in response as List) {
        final status = item['service_status'] as String;
        stats[status] = (stats[status] ?? 0) + 1;
      }

      return stats;
    } catch (e) {
      print('Servis talebi istatistikleri getirme hatası: $e');
      throw Exception('Servis talebi istatistikleri getirilemedi: $e');
    }
  }

  // Servis fişi oluştur
  Future<ServiceRequest> createServiceSlip(String serviceRequestId, {
    required String technicianName,
    Map<String, dynamic>? customerData,
    Map<String, dynamic>? equipmentData,
    Map<String, dynamic>? serviceDetails,
    String? technicianSignature,
  }) async {
    try {
      // Benzersiz servis fişi numarası oluştur
      final slipNumber = _generateSlipNumber();
      
      final response = await _supabase
          .from('service_requests')
          .update({
            'slip_number': slipNumber,
            'issue_date': DateTime.now().toIso8601String(),
            'technician_name': technicianName,
            'customer_data': customerData ?? {},
            'equipment_data': equipmentData ?? {},
            'service_details': serviceDetails ?? {},
            'slip_status': 'draft',
            'technician_signature': technicianSignature,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis fişi oluşturma hatası: $e');
      throw Exception('Servis fişi oluşturulamadı: $e');
    }
  }

  // Servis fişi güncelle
  Future<ServiceRequest> updateServiceSlip(String serviceRequestId, {
    String? technicianName,
    Map<String, dynamic>? customerData,
    Map<String, dynamic>? equipmentData,
    Map<String, dynamic>? serviceDetails,
    String? technicianSignature,
    String? slipStatus,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (technicianName != null) updateData['technician_name'] = technicianName;
      if (customerData != null) updateData['customer_data'] = customerData;
      if (equipmentData != null) updateData['equipment_data'] = equipmentData;
      if (serviceDetails != null) updateData['service_details'] = serviceDetails;
      if (technicianSignature != null) updateData['technician_signature'] = technicianSignature;
      if (slipStatus != null) updateData['slip_status'] = slipStatus;

      final response = await _supabase
          .from('service_requests')
          .update(updateData)
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis fişi güncelleme hatası: $e');
      throw Exception('Servis fişi güncellenemedi: $e');
    }
  }

  // Servis fişi tamamla
  Future<ServiceRequest> completeServiceSlip(String serviceRequestId, {
    String? technicianSignature,
  }) async {
    try {
      final updateData = {
        'slip_status': 'completed',
        'completion_date': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (technicianSignature != null) {
        updateData['technician_signature'] = technicianSignature;
      }

      final response = await _supabase
          .from('service_requests')
          .update(updateData)
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis fişi tamamlama hatası: $e');
      throw Exception('Servis fişi tamamlanamadı: $e');
    }
  }

  // Servis fişi imzala (teknisyen)
  Future<ServiceRequest> signServiceSlip(String serviceRequestId, String signature) async {
    try {
      final response = await _supabase
          .from('service_requests')
          .update({
            'technician_signature': signature,
            'slip_status': 'signed',
            'completion_date': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis fişi imzalama hatası: $e');
      throw Exception('Servis fişi imzalanamadı: $e');
    }
  }

  // Müşteri imzası kaydet
  Future<ServiceRequest> signServiceSlipByCustomer(String serviceRequestId, String signature) async {
    try {
      final response = await _supabase
          .from('service_requests')
          .update({
            'customer_signature': signature,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Müşteri imzası kaydetme hatası: $e');
      throw Exception('Müşteri imzası kaydedilemedi: $e');
    }
  }

  // YENİ: Koordinat ve sayfa numarası ile imza kaydetme
  Future<void> saveSignatureWithMetadata({
    required String serviceRequestId,
    required String signatureType, // 'technician' or 'customer'
    required String signatureBase64,
    required String userName,
    required Map<String, dynamic> coordinates,
    required int pageNumber,
  }) async {
    try {
      // service_signatures tablosuna kaydet (upsert - eğer varsa güncelle, yoksa ekle)
      await _supabase
        .from('service_signatures')
        .upsert({
          'service_request_id': serviceRequestId,
          'signature_type': signatureType,
          'signature_data': signatureBase64,
          'user_name': userName,
          'coordinates': coordinates, // JSONB
          'page_number': pageNumber,
          'signed_at': DateTime.now().toIso8601String(),
        }, onConflict: 'service_request_id,signature_type');

      // service_requests tablosuna da kaydet (PDF oluşturulurken kullanılacak)
      final updateData = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };
      
      if (signatureType == 'technician') {
        updateData['technician_signature'] = signatureBase64;
        // Eğer müşteri imzası da varsa slip_status'u güncelle
        final serviceRequest = await _supabase
          .from('service_requests')
          .select('customer_signature')
          .eq('id', serviceRequestId)
          .single();
        
        if (serviceRequest['customer_signature'] != null && 
            (serviceRequest['customer_signature'] as String).isNotEmpty) {
          updateData['slip_status'] = 'signed';
          updateData['completion_date'] = DateTime.now().toIso8601String();
        }
      } else if (signatureType == 'customer') {
        updateData['customer_signature'] = signatureBase64;
        // Eğer teknisyen imzası da varsa slip_status'u güncelle
        final serviceRequest = await _supabase
          .from('service_requests')
          .select('technician_signature')
          .eq('id', serviceRequestId)
          .single();
        
        if (serviceRequest['technician_signature'] != null && 
            (serviceRequest['technician_signature'] as String).isNotEmpty) {
          updateData['slip_status'] = 'signed';
          updateData['completion_date'] = DateTime.now().toIso8601String();
        }
      }

      await _supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', serviceRequestId);

      print('✅ $signatureType imzası kaydedildi (sayfa $pageNumber) - hem service_signatures hem service_requests tablosuna');
    } catch (e) {
      print('❌ İmza kaydedilemedi: $e');
      rethrow;
    }
  }

  // İmzaları service_signatures tablosundan getir
  Future<Map<String, dynamic>> getSignatures(String serviceRequestId) async {
    try {
      final response = await _supabase
        .from('service_signatures')
        .select('*')
        .eq('service_request_id', serviceRequestId);

      final signatures = (response as List).cast<Map<String, dynamic>>();
      
      // technician ve customer imzalarını ayır
      String? technicianSignature;
      String? customerSignature;
      
      for (var sig in signatures) {
        if (sig['signature_type'] == 'technician') {
          technicianSignature = sig['signature_data']?.toString();
        } else if (sig['signature_type'] == 'customer') {
          customerSignature = sig['signature_data']?.toString();
        }
      }

      return {
        'technician': technicianSignature,
        'customer': customerSignature,
        'hasTechnician': technicianSignature != null && technicianSignature.isNotEmpty,
        'hasCustomer': customerSignature != null && customerSignature.isNotEmpty,
      };
    } catch (e) {
      print('❌ İmzalar getirilemedi: $e');
      return {
        'technician': null,
        'customer': null,
        'hasTechnician': false,
        'hasCustomer': false,
      };
    }
  }

  // Servis numarası oluştur  
  Future<ServiceRequest> generateServiceNumber(String serviceRequestId) async {
    try {
      // Mevcut servis talebinin company_id'sini al
      String? finalCompanyId;
      try {
        final requestData = await _supabase
            .from('service_requests')
            .select('company_id')
            .eq('id', serviceRequestId)
            .maybeSingle();
        finalCompanyId = requestData?['company_id'];
      } catch (e) {
        print('Company ID getirme hatası: $e');
      }
      
      final serviceNumber = await _numberGenerator.generateServiceNumber(finalCompanyId);
      
      final response = await _supabase
          .from('service_requests')
          .update({
            'service_number': serviceNumber,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', serviceRequestId)
          .select()
          .single();

      return ServiceRequest.fromJson(response);
    } catch (e) {
      print('Servis numarası oluşturma hatası: $e');
      throw Exception('Servis numarası oluşturulamadı: $e');
    }
  }

  // Teknisyen listesi getir (is_technical = true olan çalışanlar)
  Future<List<Map<String, dynamic>>> getTechnicians({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('employees')
          .select('id, first_name, last_name, email, phone')
          .eq('is_technical', true)
          .eq('status', 'aktif');

      // Company_id filtresi - güvenlik için zorunlu
      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('first_name');

      final response = await query;
      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      print('Teknisyen listesi getirme hatası: $e');
      throw Exception('Teknisyen listesi getirilemedi: $e');
    }
  }

  // Benzersiz fiş numarası oluştur
  String _generateSlipNumber() {
    final now = DateTime.now();
    final year = now.year.toString().substring(2);
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    final hour = now.hour.toString().padLeft(2, '0');
    final minute = now.minute.toString().padLeft(2, '0');
    final second = now.second.toString().padLeft(2, '0');
    
    return 'SF$year$month$day$hour$minute$second';
  }


  // ========== SERVICE ITEMS (Ürünler) ==========

  // Servis talebindeki ürünleri getir
  Future<List<Map<String, dynamic>>> getServiceItems(String serviceRequestId) async {
    try {
      final response = await _supabase
          .from('service_items')
          .select('*')
          .eq('service_request_id', serviceRequestId)
          .order('sort_order', ascending: true)
          .order('created_at', ascending: true);

      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      print('Servis ürünleri getirme hatası: $e');
      throw Exception('Servis ürünleri getirilemedi: $e');
    }
  }

  // Servis talebine ürün ekle
  Future<Map<String, dynamic>> addServiceItem(
    String serviceRequestId, {
    String? productId,
    required String name,
    String? description,
    required double quantity,
    required String unit,
    required double unitPrice,
    double? taxRate,
    double? discountRate,
    String? currency,
    int? sortOrder,
    String? companyId,
  }) async {
    try {
      // company_id'yi otomatik olarak set et
      String? finalCompanyId = companyId;
      if (finalCompanyId == null) {
        final currentUser = _supabase.auth.currentUser;
        if (currentUser != null) {
          try {
            final profileResponse = await _supabase
                .from('profiles')
                .select('company_id')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (profileResponse != null && profileResponse['company_id'] != null) {
              finalCompanyId = profileResponse['company_id'];
            }
          } catch (e) {
            print('Company ID getirme hatası: $e');
          }
        }
      }

      // Toplam fiyatı hesapla
      final subtotal = quantity * unitPrice;
      final discountAmount = discountRate != null ? subtotal * (discountRate / 100) : 0;
      final afterDiscount = subtotal - discountAmount;
      final taxAmount = taxRate != null ? afterDiscount * (taxRate / 100) : 0;
      final totalPrice = afterDiscount + taxAmount;

      final itemData = {
        'service_request_id': serviceRequestId,
        'product_id': productId,
        'name': name,
        'description': description,
        'quantity': quantity,
        'unit': unit,
        'unit_price': unitPrice,
        'tax_rate': taxRate ?? 20,
        'discount_rate': discountRate ?? 0,
        'total_price': totalPrice,
        'currency': currency ?? 'TRY',
        'sort_order': sortOrder ?? 0,
        'company_id': finalCompanyId,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final response = await _supabase
          .from('service_items')
          .insert(itemData)
          .select()
          .single();

      return response as Map<String, dynamic>;
    } catch (e) {
      print('Servis ürünü ekleme hatası: $e');
      throw Exception('Servis ürünü eklenemedi: $e');
    }
  }

  // Servis talebindeki ürünü güncelle
  Future<Map<String, dynamic>> updateServiceItem(
    String itemId, {
    String? productId,
    String? name,
    String? description,
    double? quantity,
    String? unit,
    double? unitPrice,
    double? taxRate,
    double? discountRate,
    String? currency,
    int? sortOrder,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (productId != null) updateData['product_id'] = productId;
      if (name != null) updateData['name'] = name;
      if (description != null) updateData['description'] = description;
      if (quantity != null) updateData['quantity'] = quantity;
      if (unit != null) updateData['unit'] = unit;
      if (unitPrice != null) updateData['unit_price'] = unitPrice;
      if (taxRate != null) updateData['tax_rate'] = taxRate;
      if (discountRate != null) updateData['discount_rate'] = discountRate;
      if (currency != null) updateData['currency'] = currency;
      if (sortOrder != null) updateData['sort_order'] = sortOrder;

      // Eğer fiyat veya miktar değiştiyse toplam fiyatı yeniden hesapla
      if (quantity != null || unitPrice != null || taxRate != null || discountRate != null) {
        // Mevcut değerleri al
        final currentItem = await _supabase
            .from('service_items')
            .select('quantity, unit_price, tax_rate, discount_rate')
            .eq('id', itemId)
            .single();

        final finalQuantity = quantity ?? (currentItem['quantity'] as num).toDouble();
        final finalUnitPrice = unitPrice ?? (currentItem['unit_price'] as num).toDouble();
        final finalTaxRate = taxRate ?? (currentItem['tax_rate'] as num?)?.toDouble() ?? 20;
        final finalDiscountRate = discountRate ?? (currentItem['discount_rate'] as num?)?.toDouble() ?? 0;

        final subtotal = finalQuantity * finalUnitPrice;
        final discountAmount = finalDiscountRate > 0 ? subtotal * (finalDiscountRate / 100) : 0;
        final afterDiscount = subtotal - discountAmount;
        final taxAmount = finalTaxRate > 0 ? afterDiscount * (finalTaxRate / 100) : 0;
        final totalPrice = afterDiscount + taxAmount;

        updateData['total_price'] = totalPrice;
      }

      final response = await _supabase
          .from('service_items')
          .update(updateData)
          .eq('id', itemId)
          .select()
          .single();

      return response as Map<String, dynamic>;
    } catch (e) {
      print('Servis ürünü güncelleme hatası: $e');
      throw Exception('Servis ürünü güncellenemedi: $e');
    }
  }

  // Servis talebindeki ürünü sil
  Future<void> deleteServiceItem(String itemId) async {
    try {
      await _supabase
          .from('service_items')
          .delete()
          .eq('id', itemId);
    } catch (e) {
      print('Servis ürünü silme hatası: $e');
      throw Exception('Servis ürünü silinemedi: $e');
    }
  }

  // Servis talebindeki tüm ürünleri sil
  Future<void> deleteAllServiceItems(String serviceRequestId) async {
    try {
      await _supabase
          .from('service_items')
          .delete()
          .eq('service_request_id', serviceRequestId);
    } catch (e) {
      print('Servis ürünleri silme hatası: $e');
      throw Exception('Servis ürünleri silinemedi: $e');
    }
  }

  // Servis talebindeki ürünleri toplu ekle
  Future<List<Map<String, dynamic>>> addServiceItems(
    String serviceRequestId,
    List<Map<String, dynamic>> items, {
    String? companyId,
  }) async {
    try {
      // company_id'yi otomatik olarak set et
      String? finalCompanyId = companyId;
      if (finalCompanyId == null) {
        final currentUser = _supabase.auth.currentUser;
        if (currentUser != null) {
          try {
            final profileResponse = await _supabase
                .from('profiles')
                .select('company_id')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (profileResponse != null && profileResponse['company_id'] != null) {
              finalCompanyId = profileResponse['company_id'];
            }
          } catch (e) {
            print('Company ID getirme hatası: $e');
          }
        }
      }

      final itemsToInsert = items.map((item) {
        final quantity = (item['quantity'] as num?)?.toDouble() ?? 1.0;
        final unitPrice = (item['price'] as num?)?.toDouble() ?? (item['unit_price'] as num?)?.toDouble() ?? 0.0;
        final taxRate = (item['tax_rate'] as num?)?.toDouble() ?? 20.0;
        final discountRate = (item['discount_rate'] as num?)?.toDouble() ?? 0.0;

        // Toplam fiyatı hesapla
        final subtotal = quantity * unitPrice;
        final discountAmount = discountRate > 0 ? subtotal * (discountRate / 100) : 0;
        final afterDiscount = subtotal - discountAmount;
        final taxAmount = taxRate > 0 ? afterDiscount * (taxRate / 100) : 0;
        final totalPrice = afterDiscount + taxAmount;

        return {
          'service_request_id': serviceRequestId,
          'product_id': item['id'] ?? item['product_id'],
          'name': item['name'] ?? '',
          'description': item['description'],
          'quantity': quantity,
          'unit': item['unit'] ?? 'adet',
          'unit_price': unitPrice,
          'tax_rate': taxRate,
          'discount_rate': discountRate,
          'total_price': totalPrice,
          'currency': item['currency'] ?? 'TRY',
          'sort_order': item['sort_order'] ?? 0,
          'company_id': finalCompanyId,
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        };
      }).toList();

      final response = await _supabase
          .from('service_items')
          .insert(itemsToInsert)
          .select();

      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      print('Servis ürünleri toplu ekleme hatası: $e');
      throw Exception('Servis ürünleri eklenemedi: $e');
    }
  }
}