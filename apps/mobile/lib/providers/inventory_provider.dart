import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/inventory_service.dart';
import '../services/auth_service.dart';
import '../models/product.dart';
import '../models/warehouse.dart';
import '../models/inventory_transaction.dart';

final inventoryServiceProvider = Provider<InventoryService>((ref) {
  return InventoryService();
});

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  final authService = AuthService();
  final user = await authService.getCurrentUserEmployeeInfo();
  return user?['companyId'] as String?;
}

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getProducts(companyId: companyId);
});

final warehousesProvider = FutureProvider<List<Warehouse>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getWarehouses(companyId: companyId);
});

final inventoryTransactionsProvider = FutureProvider<List<InventoryTransaction>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  final companyId = await _getCurrentUserCompanyId();
  return await service.getInventoryTransactions(companyId: companyId);
});

