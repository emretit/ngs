import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance => _instance ??= SupabaseService._();
  
  SupabaseService._();
  
  SupabaseClient get client => Supabase.instance.client;
  
  // Auth işlemleri
  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }
  
  Future<void> signOut() async {
    await client.auth.signOut();
  }
  
  User? get currentUser => client.auth.currentUser;
  
  // Realtime subscription
  RealtimeChannel subscribeToServiceRequests(String technicianId) {
    return client
        .channel('service_requests')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: AppConstants.serviceRequestsTable,
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'assigned_to',
            value: technicianId,
          ),
          callback: (payload) {
            // Bu callback'te servis taleplerindeki değişiklikleri dinleyeceğiz
            // Realtime güncellemeleri burada işlenecek
          },
        )
        .subscribe();
  }
  
  // Servis taleplerini getir
  Future<List<Map<String, dynamic>>> getServiceRequests(String technicianId) async {
    final response = await client
        .from(AppConstants.serviceRequestsTable)
        .select('''
          *,
          customers:customer_id (
            id,
            name,
            company,
            mobile_phone,
            office_phone,
            address
          )
        ''')
        .eq('assigned_to', technicianId)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }
  
  // Servis talebi durumunu güncelle
  Future<void> updateServiceRequestStatus(
    String requestId,
    String status, {
    String? notes,
    List<String>? attachments,
  }) async {
    final updateData = <String, dynamic>{
      'status': status,
      'updated_at': DateTime.now().toIso8601String(),
    };
    
    if (notes != null) {
      updateData['notes'] = notes;
    }
    
    if (attachments != null) {
      updateData['attachments'] = attachments;
    }
    
    await client
        .from(AppConstants.serviceRequestsTable)
        .update(updateData)
        .eq('id', requestId);
  }
  
  // Teknisyen bilgilerini getir
  Future<Map<String, dynamic>?> getTechnician(String technicianId) async {
    final response = await client
        .from(AppConstants.employeesTable)
        .select('*')
        .eq('id', technicianId)
        .eq('department', 'Teknik')
        .single();
    
    return response;
  }
  
  // Dosya yükleme
  Future<String> uploadFile(String bucket, String path, Uint8List fileBytes) async {
    final response = await client.storage
        .from(bucket)
        .uploadBinary(path, fileBytes);
    
    return response;
  }
  
  // Dosya URL'si al
  String getPublicUrl(String bucket, String path) {
    return client.storage.from(bucket).getPublicUrl(path);
  }
}
