import 'package:supabase_flutter/supabase_flutter.dart';

class SystemParametersService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Sistem parametresini getir
  Future<String?> getParameter(String parameterKey, {String? companyId}) async {
    try {
      // company_id'yi otomatik olarak al
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

      dynamic query = _supabase
          .from('system_parameters')
          .select('parameter_value')
          .eq('parameter_key', parameterKey);

      if (finalCompanyId != null) {
        query = query.eq('company_id', finalCompanyId);
      }

      final response = await query.maybeSingle();
      return response?['parameter_value']?.toString();
    } catch (e) {
      print('Sistem parametresi getirme hatası: $e');
      return null;
    }
  }

  // Sistem parametresini güncelle
  Future<void> setParameter(String parameterKey, String parameterValue, {String? companyId}) async {
    try {
      // company_id'yi otomatik olarak al
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

      // Önce mevcut parametreyi kontrol et
      dynamic query = _supabase
          .from('system_parameters')
          .select('id')
          .eq('parameter_key', parameterKey);

      if (finalCompanyId != null) {
        query = query.eq('company_id', finalCompanyId);
      }

      final existing = await query.maybeSingle();

      if (existing != null) {
        // Güncelle
        await _supabase
            .from('system_parameters')
            .update({
              'parameter_value': parameterValue,
              'updated_at': DateTime.now().toIso8601String(),
            })
            .eq('id', existing['id']);
      } else {
        // Yeni oluştur
        await _supabase
            .from('system_parameters')
            .insert({
              'parameter_key': parameterKey,
              'parameter_value': parameterValue,
              'company_id': finalCompanyId,
              'created_at': DateTime.now().toIso8601String(),
              'updated_at': DateTime.now().toIso8601String(),
            });
      }
    } catch (e) {
      print('Sistem parametresi güncelleme hatası: $e');
      throw Exception('Sistem parametresi güncellenemedi: $e');
    }
  }

  // Tüm sistem parametrelerini getir
  Future<Map<String, String>> getAllParameters({String? companyId}) async {
    try {
      // company_id'yi otomatik olarak al
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

      dynamic query = _supabase
          .from('system_parameters')
          .select('parameter_key, parameter_value');

      if (finalCompanyId != null) {
        query = query.eq('company_id', finalCompanyId);
      }

      final response = await query;
      final Map<String, String> parameters = {};
      
      for (final item in response as List) {
        parameters[item['parameter_key']] = item['parameter_value']?.toString() ?? '';
      }

      return parameters;
    } catch (e) {
      print('Sistem parametreleri getirme hatası: $e');
      return {};
    }
  }
}
