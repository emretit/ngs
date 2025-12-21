import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/purchasing_service.dart';
import '../services/auth_service.dart';
import '../models/purchase_request.dart';
import '../models/purchase_order.dart';
import '../models/supplier.dart';

final purchasingServiceProvider = Provider<PurchasingService>((ref) {
  return PurchasingService();
});

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  final authService = AuthService();
  final user = await authService.getCurrentUserEmployeeInfo();
  return user?.companyId;
}

final purchaseRequestsProvider = FutureProvider<List<PurchaseRequest>>((ref) async {
  final service = ref.read(purchasingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getPurchaseRequests(companyId: companyId);
});

final purchaseOrdersProvider = FutureProvider<List<PurchaseOrder>>((ref) async {
  final service = ref.read(purchasingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getPurchaseOrders(companyId: companyId);
});

final suppliersProvider = FutureProvider<List<Supplier>>((ref) async {
  final service = ref.read(purchasingServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getSuppliers(companyId: companyId);
});

