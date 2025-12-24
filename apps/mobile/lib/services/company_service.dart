import 'package:supabase_flutter/supabase_flutter.dart';

class CompanyService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Kullanıcının bağlı olduğu şirketleri getir
  Future<List<Map<String, dynamic>>> getUserCompanies(String userId) async {
    try {
      final response = await _supabase
          .from('user_companies')
          .select('''
            id,
            user_id,
            company_id,
            role,
            is_owner,
            created_at,
            company:companies(id, name, logo_url, is_active)
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: true);

      return (response as List).map((item) => item as Map<String, dynamic>).toList();
    } catch (e) {
      print('Kullanıcı şirketleri getirme hatası: $e');
      throw Exception('Kullanıcı şirketleri getirilemedi: $e');
    }
  }

  /// Şirket değiştir
  Future<void> switchCompany(String userId, String companyId) async {
    try {
      // Önce kullanıcının bu firmaya ait olup olmadığını kontrol et
      final userCompany = await _supabase
          .from('user_companies')
          .select('id, company_id')
          .eq('user_id', userId)
          .eq('company_id', companyId)
          .maybeSingle();

      if (userCompany == null) {
        throw Exception('Bu firmaya erişim yetkiniz bulunmamaktadır');
      }

      // Update the user's profile with the new company_id
      await _supabase
          .from('profiles')
          .update({ 'company_id': companyId })
          .eq('id', userId);
      
      // Supabase Flutter'da hata durumunda exception fırlatır, başarılıysa devam eder
    } catch (e) {
      print('Şirket değiştirme hatası: $e');
      rethrow;
    }
  }

  /// Yeni şirket oluştur
  Future<Map<String, dynamic>> createCompany(String userId, String companyName) async {
    try {
      if (companyName.trim().isEmpty) {
        throw Exception('Şirket adı gereklidir');
      }

      // RPC fonksiyonunu kullan
      final data = await _supabase.rpc(
        'create_company_for_user',
        params: {'company_name': companyName.trim()},
      );

      if (data == null || data['company_id'] == null) {
        throw Exception('Şirket oluşturuldu ancak ID alınamadı');
      }

      return {
        'id': data['company_id'],
        'name': companyName.trim(),
        'is_active': true,
      };
    } catch (e) {
      print('Şirket oluşturma hatası: $e');
      rethrow;
    }
  }
}

