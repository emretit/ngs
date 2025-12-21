import 'package:go_router/go_router.dart';
import '../../pages/sales/sales_orders_page.dart';
import '../../pages/sales/sales_invoices_page.dart';
import '../../pages/sales/proposals_page.dart';
import '../../pages/sales/proposal_detail_page.dart';
import '../../pages/sales/opportunities_page.dart';
import '../../pages/crm_page.dart';

/// Sales modülü route'ları
/// Web app'teki orderRoutes.tsx ve proposalRoutes.tsx'e benzer yapı
final List<RouteBase> salesRoutes = [
  // CRM Dashboard
  GoRoute(
    path: '/crm',
    builder: (context, state) => const CrmPage(),
  ),
  GoRoute(
    path: '/sales',
    redirect: (context, state) => '/sales/orders',
  ),
  GoRoute(
    path: '/sales/orders',
    builder: (context, state) => const SalesOrdersPage(),
  ),
  GoRoute(
    path: '/sales/invoices',
    builder: (context, state) => const SalesInvoicesPage(),
  ),
  GoRoute(
    path: '/sales/proposals',
    builder: (context, state) => const ProposalsPage(),
  ),
  GoRoute(
    path: '/sales/proposals/:id',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ProposalDetailPage(id: id);
    },
  ),
  GoRoute(
    path: '/sales/opportunities',
    builder: (context, state) => const OpportunitiesPage(),
  ),
];

