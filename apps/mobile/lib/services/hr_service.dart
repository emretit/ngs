import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/employee.dart';
import '../models/employee_leave.dart';
import '../models/employee_performance.dart';

class HrService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Çalışanları getir
  Future<List<Employee>> getEmployees({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('employees')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => Employee.fromJson(json)).toList();
    } catch (e) {
      print('Çalışanlar getirme hatası: $e');
      throw Exception('Çalışanlar getirilemedi: $e');
    }
  }

  // İzinleri getir
  Future<List<EmployeeLeave>> getEmployeeLeaves({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('employee_leaves')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => EmployeeLeave.fromJson(json)).toList();
    } catch (e) {
      print('İzinler getirme hatası: $e');
      throw Exception('İzinler getirilemedi: $e');
    }
  }

  // Performans kayıtlarını getir
  Future<List<EmployeePerformance>> getEmployeePerformance({String? companyId}) async {
    try {
      dynamic query = _supabase
          .from('employee_performance')
          .select('*');

      if (companyId != null) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', ascending: false);

      final response = await query;
      return (response as List).map((json) => EmployeePerformance.fromJson(json)).toList();
    } catch (e) {
      print('Performans kayıtları getirme hatası: $e');
      throw Exception('Performans kayıtları getirilemedi: $e');
    }
  }
}

