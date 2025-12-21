import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/purchase_request.dart';
import '../models/purchase_order.dart';
import '../models/supplier.dart';

class PurchasingService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Satın alma taleplerini getir
  Future<List<PurchaseRequest>> getPurchaseRequests({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('purchase_requests')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => PurchaseRequest.fromJson(json)).toList();
    } catch (e) {
      print('Satın alma talepleri getirme hatası: $e');
      throw Exception('Satın alma talepleri getirilemedi: $e');
    }
  }

  // Satın alma siparişlerini getir
  Future<List<PurchaseOrder>> getPurchaseOrders({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('purchase_orders')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => PurchaseOrder.fromJson(json)).toList();
    } catch (e) {
      print('Satın alma siparişleri getirme hatası: $e');
      throw Exception('Satın alma siparişleri getirilemedi: $e');
    }
  }

  // Tedarikçileri getir
  Future<List<Supplier>> getSuppliers({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('suppliers')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Supplier.fromJson(json)).toList();
    } catch (e) {
      print('Tedarikçiler getirme hatası: $e');
      throw Exception('Tedarikçiler getirilemedi: $e');
    }
  }
}

