import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/supplier.dart';

/// Supplier Service
/// Tedarikçi CRUD işlemleri
class SupplierService {
  final _supabase = Supabase.instance.client;

  /// Tüm tedarikçileri getir (pagination ile optimize edilmiş)
  Future<List<Supplier>> getSuppliers({
    int page = 0,
    int pageSize = 50,
  }) async {
    try {
      final start = page * pageSize;
      final end = start + pageSize - 1;

      final response = await _supabase
          .from('suppliers')
          .select('*')
          .order('created_at', ascending: false)
          .range(start, end); // Supabase pagination
      
      return (response as List)
          .map((json) => Supplier.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Tedarikçiler yüklenirken hata oluştu: $e');
    }
  }

  /// ID'ye göre tedarikçi getir
  Future<Supplier?> getSupplierById(String id) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .single();
      
      return Supplier.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  /// Tedarikçi ara
  Future<List<Supplier>> searchSuppliers(String query) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .select('*')
          .or('name.ilike.%$query%,company.ilike.%$query%,email.ilike.%$query%')
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Supplier.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Tedarikçi araması yapılırken hata oluştu: $e');
    }
  }

  /// Duruma göre tedarikçileri getir
  Future<List<Supplier>> getSuppliersByStatus(String status) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .select('*')
          .eq('status', status)
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Supplier.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Tedarikçiler yüklenirken hata oluştu: $e');
    }
  }

  /// Tipe göre tedarikçileri getir
  Future<List<Supplier>> getSuppliersByType(String type) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .select('*')
          .eq('type', type)
          .order('created_at', ascending: false);
      
      return (response as List)
          .map((json) => Supplier.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Tedarikçiler yüklenirken hata oluştu: $e');
    }
  }

  /// Yeni tedarikçi oluştur
  Future<Supplier> createSupplier(Map<String, dynamic> data) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .insert(data)
          .select()
          .single();
      
      return Supplier.fromJson(response);
    } catch (e) {
      throw Exception('Tedarikçi oluşturulurken hata oluştu: $e');
    }
  }

  /// Tedarikçi güncelle
  Future<Supplier> updateSupplier(String id, Map<String, dynamic> data) async {
    try {
      final response = await _supabase
          .from('suppliers')
          .update(data)
          .eq('id', id)
          .select()
          .single();
      
      return Supplier.fromJson(response);
    } catch (e) {
      throw Exception('Tedarikçi güncellenirken hata oluştu: $e');
    }
  }

  /// Tedarikçi sil
  Future<void> deleteSupplier(String id) async {
    try {
      await _supabase
          .from('suppliers')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Tedarikçi silinirken hata oluştu: $e');
    }
  }

  /// Tedarikçi istatistiklerini getir
  Future<Map<String, dynamic>> getSupplierStats() async {
    try {
      final response = await _supabase
          .from('suppliers')
          .select('status, balance');
      
      final suppliers = response as List;
      
      final activeCount = suppliers.where((s) => s['status'] == 'aktif').length;
      final potentialCount = suppliers.where((s) => s['status'] == 'potansiyel').length;
      final passiveCount = suppliers.where((s) => s['status'] == 'pasif').length;
      final totalBalance = suppliers.fold<double>(
        0, 
        (sum, s) => sum + ((s['balance'] ?? 0) as num).toDouble(),
      );

      return {
        'totalSuppliers': suppliers.length,
        'activeSuppliers': activeCount,
        'potentialSuppliers': potentialCount,
        'passiveSuppliers': passiveCount,
        'totalBalance': totalBalance,
      };
    } catch (e) {
      throw Exception('İstatistikler yüklenirken hata oluştu: $e');
    }
  }
}

