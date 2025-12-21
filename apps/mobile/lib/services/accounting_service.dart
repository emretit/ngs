import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/expense.dart';
import '../models/payment.dart';
import '../models/bank_account.dart';

class AccountingService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Giderleri getir
  Future<List<Expense>> getExpenses({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('expenses')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Expense.fromJson(json)).toList();
    } catch (e) {
      print('Giderler getirme hatası: $e');
      throw Exception('Giderler getirilemedi: $e');
    }
  }

  // Ödemeleri getir
  Future<List<Payment>> getPayments({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('payments')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Payment.fromJson(json)).toList();
    } catch (e) {
      print('Ödemeler getirme hatası: $e');
      throw Exception('Ödemeler getirilemedi: $e');
    }
  }

  // Banka hesaplarını getir
  Future<List<BankAccount>> getBankAccounts({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('bank_accounts')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => BankAccount.fromJson(json)).toList();
    } catch (e) {
      print('Banka hesapları getirme hatası: $e');
      throw Exception('Banka hesapları getirilemedi: $e');
    }
  }
}

