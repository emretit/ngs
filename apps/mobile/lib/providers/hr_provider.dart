import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/hr_service.dart';
import '../services/auth_service.dart';
import '../models/employee.dart';
import '../models/employee_leave.dart';
import '../models/employee_performance.dart';

final hrServiceProvider = Provider<HrService>((ref) {
  return HrService();
});

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  final authService = AuthService();
  final user = await authService.getCurrentUserEmployeeInfo();
  return user?['companyId'] as String?;
}

final employeesProvider = FutureProvider<List<Employee>>((ref) async {
  final service = ref.read(hrServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getEmployees(companyId: companyId);
});

final employeeLeavesProvider = FutureProvider<List<EmployeeLeave>>((ref) async {
  final service = ref.read(hrServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getEmployeeLeaves(companyId: companyId);
});

final employeePerformanceProvider = FutureProvider<List<EmployeePerformance>>((ref) async {
  final service = ref.read(hrServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getEmployeePerformance(companyId: companyId);
});

