import 'package:go_router/go_router.dart';
import '../../pages/service_requests_list_page.dart';
import '../../pages/service_request_detail_page.dart';
import '../../pages/service_request_edit_page.dart';
import '../../pages/service_request_form_page.dart';
import '../../pages/service_slip_form_page.dart';
import '../../pages/service_slip_view_page.dart';
import '../../pages/service_slip_template_selection_page.dart';
import '../../pages/service_slip_signature_flow_page.dart';

/// Service modülü route'ları
/// Web app'teki serviceRoutes.tsx'e benzer yapı
final List<RouteBase> serviceRoutes = [
  // Service Management (Ana liste)
  GoRoute(
    path: '/service',
    redirect: (context, state) => '/service/management',
  ),
  GoRoute(
    path: '/service/management',
    builder: (context, state) => const ServiceRequestsListPage(),
  ),
  
  // Eski route'lar için redirect (geriye dönük uyumluluk)
  GoRoute(
    path: '/service-requests',
    redirect: (context, state) => '/service/management',
  ),
  
  // CRUD İşlemleri
  GoRoute(
    path: '/service/new',
    builder: (context, state) => const ServiceRequestFormPage(),
  ),
  GoRoute(
    path: '/service/detail/:id',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ServiceRequestDetailPage(id: id);
    },
  ),
  GoRoute(
    path: '/service/edit/:id',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ServiceRequestEditPage(id: id);
    },
  ),
  
  // Service Slip
  GoRoute(
    path: '/service/:id/slip',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ServiceSlipFormPage(serviceRequestId: id);
    },
  ),
  GoRoute(
    path: '/service/:id/slip/view',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ServiceSlipViewPage(serviceRequestId: id);
    },
  ),
  GoRoute(
    path: '/service/:id/slip/templates',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      return ServiceSlipTemplateSelectionPage(serviceRequestId: id);
    },
  ),
  GoRoute(
    path: '/service/:id/slip/signatures',
    builder: (context, state) {
      final id = state.pathParameters['id']!;
      final extra = state.extra as Map<String, dynamic>?;
      final templateId = extra?['templateId'] as String? ?? '';
      return ServiceSlipSignatureFlowPage(
        serviceRequestId: id,
        templateId: templateId,
      );
    },
  ),
  
  // Eski route'lar (geriye dönük uyumluluk)
  GoRoute(
    path: '/service-requests/create',
    redirect: (context, state) => '/service/new',
  ),
  GoRoute(
    path: '/service-requests/:id',
    redirect: (context, state) {
      final id = state.pathParameters['id']!;
      return '/service/detail/$id';
    },
  ),
  GoRoute(
    path: '/service-requests/:id/edit',
    redirect: (context, state) {
      final id = state.pathParameters['id']!;
      return '/service/edit/$id';
    },
  ),
  GoRoute(
    path: '/service-requests/:id/slip',
    redirect: (context, state) {
      final id = state.pathParameters['id']!;
      return '/service/$id/slip';
    },
  ),
  GoRoute(
    path: '/service-requests/:id/slip/view',
    redirect: (context, state) {
      final id = state.pathParameters['id']!;
      return '/service/$id/slip/view';
    },
  ),
];

