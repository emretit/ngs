import 'package:go_router/go_router.dart';
import '../../pages/inventory/products_page.dart';
import '../../pages/inventory/warehouses_page.dart';
import '../../pages/inventory/inventory_transactions_page.dart';

/// Inventory modülü route'ları
/// Web app'teki inventoryRoutes.tsx'e benzer yapı
final List<RouteBase> inventoryRoutes = [
  GoRoute(
    path: '/inventory',
    redirect: (context, state) => '/inventory/products',
  ),
  GoRoute(
    path: '/inventory/products',
    builder: (context, state) => const ProductsPage(),
  ),
  GoRoute(
    path: '/inventory/warehouses',
    builder: (context, state) => const WarehousesPage(),
  ),
  GoRoute(
    path: '/inventory/transactions',
    builder: (context, state) => const InventoryTransactionsPage(),
  ),
];

