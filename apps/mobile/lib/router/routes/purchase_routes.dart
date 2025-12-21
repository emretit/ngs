import 'package:go_router/go_router.dart';
import '../../pages/purchasing/purchase_requests_page.dart';
import '../../pages/purchasing/purchase_orders_page.dart';
import '../../pages/purchasing/suppliers_page.dart';

/// Purchase modülü route'ları
/// Web app'teki purchaseRoutes.tsx'e benzer yapı
final List<RouteBase> purchaseRoutes = [
  GoRoute(
    path: '/purchasing',
    redirect: (context, state) => '/purchasing/requests',
  ),
  GoRoute(
    path: '/purchasing/requests',
    builder: (context, state) => const PurchaseRequestsPage(),
  ),
  GoRoute(
    path: '/purchasing/orders',
    builder: (context, state) => const PurchaseOrdersPage(),
  ),
  GoRoute(
    path: '/purchasing/suppliers',
    builder: (context, state) => const SuppliersPage(),
  ),
];

