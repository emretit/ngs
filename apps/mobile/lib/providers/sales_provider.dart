import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/sales_service.dart';
import '../services/auth_service.dart';
import '../models/order.dart';
import '../models/invoice.dart';
import '../models/proposal.dart';
import '../models/opportunity.dart';

final salesServiceProvider = Provider<SalesService>((ref) {
  return SalesService();
});

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  final authService = AuthService();
  final user = await authService.getCurrentUserEmployeeInfo();
  return user?['companyId'];
}

final salesOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final service = ref.read(salesServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getSalesOrders(companyId: companyId);
});

final salesInvoicesProvider = FutureProvider<List<Invoice>>((ref) async {
  final service = ref.read(salesServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getSalesInvoices(companyId: companyId);
});

final proposalsProvider = FutureProvider<List<Proposal>>((ref) async {
  final service = ref.read(salesServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getProposals(companyId: companyId);
});

final proposalByIdProvider = FutureProvider.family<Proposal?, String>((ref, id) async {
  final service = ref.read(salesServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getProposalById(id, companyId: companyId);
});

final opportunitiesProvider = FutureProvider<List<Opportunity>>((ref) async {
  final service = ref.read(salesServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getOpportunities(companyId: companyId);
});

