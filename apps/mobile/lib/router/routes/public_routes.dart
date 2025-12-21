import 'package:go_router/go_router.dart';
import '../../pages/login_page.dart';

/// Public route'lar (authentication gerektirmeyen)
/// Web app'teki publicRoutes.tsx'e benzer yapı
final List<RouteBase> publicRoutes = [
  GoRoute(
    path: '/login',
    builder: (context, state) => const LoginPage(),
  ),
  GoRoute(
    path: '/signin',
    redirect: (context, state) => '/login',
  ),
];

