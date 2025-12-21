import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/accounting_service.dart';
import '../services/auth_service.dart';
import '../models/expense.dart';
import '../models/payment.dart';
import '../models/bank_account.dart';

final accountingServiceProvider = Provider<AccountingService>((ref) {
  return AccountingService();
});

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  final authService = AuthService();
  final user = await authService.getCurrentUserEmployeeInfo();
  return user?['companyId'];
}

final expensesProvider = FutureProvider<List<Expense>>((ref) async {
  final service = ref.read(accountingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getExpenses(companyId: companyId);
});

final paymentsProvider = FutureProvider<List<Payment>>((ref) async {
  final service = ref.read(accountingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getPayments(companyId: companyId);
});

final bankAccountsProvider = FutureProvider<List<BankAccount>>((ref) async {
  final service = ref.read(accountingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getBankAccounts(companyId: companyId);
});

