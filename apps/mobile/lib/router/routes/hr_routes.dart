import 'package:go_router/go_router.dart';
import '../../pages/hr/employees_page.dart';
import '../../pages/hr/employee_leaves_page.dart';
import '../../pages/hr/employee_performance_page.dart';

/// HR modülü route'ları
/// Web app'teki employeeRoutes.tsx'e benzer yapı
final List<RouteBase> hrRoutes = [
  GoRoute(
    path: '/hr',
    redirect: (context, state) => '/hr/employees',
  ),
  GoRoute(
    path: '/hr/employees',
    builder: (context, state) => const EmployeesPage(),
  ),
  GoRoute(
    path: '/hr/leaves',
    builder: (context, state) => const EmployeeLeavesPage(),
  ),
  GoRoute(
    path: '/hr/performance',
    builder: (context, state) => const EmployeePerformancePage(),
  ),
];

