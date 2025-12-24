import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/customer.dart';

/// Customer Service
/// Müşteri CRUD işlemleri
class CustomerService {
  final _supabase = Supabase.instance.client;

  /// Tüm müşterileri getir (pagination ile optimize edilmiş)
  Future<List<Customer>> getCustomers({
    int page = 0,
    int pageSize = 50,
  }) async {
    try {
      final start = page * pageSize;
      final end = start + pageSize - 1;

      final response = await _supabase
          .from('customers')
          .select('*')
          .order('created_at', ascending: false)
          .range(start, end); // Supabase pagination
      
      return (response as List)
          .map((json) => Customer.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Müşteriler yüklenirken hata oluştu: $e');
    }
  }

  /// ID'ye göre müşteri getir
  Future<Customer?> getCustomerById(String id) async {
    try {
      final response = await _supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
      
      return Customer.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  /// Müşteri ara
  Future<List<Customer>> searchCustomers(String query) async {
    try {
      final response = await _supabase
          .from('customers')
          .select('*')
          .or('name.ilike.%$query%,company.ilike.%$query%,email.ilike.%$query%')
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Customer.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Müşteri araması yapılırken hata oluştu: $e');
    }
  }

  /// Duruma göre müşterileri getir
  Future<List<Customer>> getCustomersByStatus(String status) async {
    try {
      final response = await _supabase
          .from('customers')
          .select('*')
          .eq('status', status)
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Customer.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Müşteriler yüklenirken hata oluştu: $e');
    }
  }

  /// Tipe göre müşterileri getir
  Future<List<Customer>> getCustomersByType(String type) async {
    try {
      final response = await _supabase
          .from('customers')
          .select('*')
          .eq('type', type)
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Customer.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Müşteriler yüklenirken hata oluştu: $e');
    }
  }

  /// Yeni müşteri oluştur
  Future<Customer> createCustomer(Map<String, dynamic> data) async {
    try {
      final response = await _supabase
          .from('customers')
          .insert(data)
          .select()
          .single();
      
      return Customer.fromJson(response);
    } catch (e) {
      throw Exception('Müşteri oluşturulurken hata oluştu: $e');
    }
  }

  /// Müşteri güncelle
  Future<Customer> updateCustomer(String id, Map<String, dynamic> data) async {
    try {
      final response = await _supabase
          .from('customers')
          .update(data)
          .eq('id', id)
          .select()
          .single();
      
      return Customer.fromJson(response);
    } catch (e) {
      throw Exception('Müşteri güncellenirken hata oluştu: $e');
    }
  }

  /// Müşteri sil
  Future<void> deleteCustomer(String id) async {
    try {
      await _supabase
          .from('customers')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Müşteri silinirken hata oluştu: $e');
    }
  }

  /// Müşteri istatistiklerini getir
  Future<Map<String, dynamic>> getCustomerStats() async {
    try {
      final response = await _supabase
          .from('customers')
          .select('status, balance');
      
      final customers = response as List;
      
      final activeCount = customers.where((c) => c['status'] == 'aktif').length;
      final potentialCount = customers.where((c) => c['status'] == 'potansiyel').length;
      final passiveCount = customers.where((c) => c['status'] == 'pasif').length;
      final totalBalance = customers.fold<double>(
        0, 
        (sum, c) => sum + ((c['balance'] ?? 0) as num).toDouble(),
      );

      return {
        'totalCustomers': customers.length,
        'activeCustomers': activeCount,
        'potentialCustomers': potentialCount,
        'passiveCustomers': passiveCount,
        'totalBalance': totalBalance,
      };
    } catch (e) {
      throw Exception('İstatistikler yüklenirken hata oluştu: $e');
    }
  }
}

