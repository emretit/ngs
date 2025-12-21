import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/product.dart';
import '../models/warehouse.dart';
import '../models/inventory_transaction.dart';

class InventoryService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Ürünleri getir
  Future<List<Product>> getProducts({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('products')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      print('Ürünler getirme hatası: $e');
      throw Exception('Ürünler getirilemedi: $e');
    }
  }

  // Depoları getir
  Future<List<Warehouse>> getWarehouses({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('warehouses')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Warehouse.fromJson(json)).toList();
    } catch (e) {
      print('Depolar getirme hatası: $e');
      throw Exception('Depolar getirilemedi: $e');
    }
  }

  // Stok hareketlerini getir
  Future<List<InventoryTransaction>> getInventoryTransactions({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('inventory_transactions')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => InventoryTransaction.fromJson(json)).toList();
    } catch (e) {
      print('Stok hareketleri getirme hatası: $e');
      throw Exception('Stok hareketleri getirilemedi: $e');
    }
  }
}

