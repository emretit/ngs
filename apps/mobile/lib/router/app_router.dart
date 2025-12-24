import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../pages/dashboard_page.dart';
import '../pages/customers_page.dart';
import '../pages/suppliers_page.dart';
import '../pages/profile_page.dart';
import '../pages/notifications_page.dart';
import '../pages/notification_settings_page.dart';
import '../pages/modules_page.dart';
import '../pages/activity_form_page.dart';
import '../shared/layouts/main_layout.dart';
// Modüler route'lar - Web app'teki gibi yapı
import 'routes/public_routes.dart';
import 'routes/service_routes.dart';
import 'routes/sales_routes.dart';
import 'routes/purchase_routes.dart';
import 'routes/accounting_routes.dart';
import 'routes/inventory_routes.dart';
import 'routes/hr_routes.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.uri.path == '/login' || state.uri.path == '/signin';
      
      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }
      
      if (isAuthenticated && isLoginRoute) {
        return '/dashboard';
      }
      
      return null;
    },
    routes: [
      // Kök dizin redirect - authentication durumuna göre yönlendirme
      GoRoute(
        path: '/',
        redirect: (context, state) {
          final isAuthenticated = authState.isAuthenticated;
          return isAuthenticated ? '/dashboard' : '/login';
        },
      ),
      
      // Public routes (authentication gerektirmeyen)
      ...publicRoutes,
      
      // Protected routes - Shell Route ile sabit bottom bar
      ShellRoute(
        builder: (context, state, child) => MainLayout(
          currentRoute: state.uri.path,
          child: child,
        ),
        routes: [
          // Dashboard (Ana Sayfa)
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: '/home',
            redirect: (context, state) => '/dashboard',
          ),
          
          // Müşteriler
          GoRoute(
            path: '/customers',
            builder: (context, state) => const CustomersPage(),
          ),
          
          // Tedarikçiler
          GoRoute(
            path: '/suppliers',
            builder: (context, state) => const SuppliersPage(),
          ),
          
          // Aktiviteler (form sayfaları)
          GoRoute(
            path: '/activities/new',
            builder: (context, state) => const ActivityFormPage(),
          ),
          GoRoute(
            path: '/activities/:id/edit',
            builder: (context, state) {
              final id = state.pathParameters['id'];
              return ActivityFormPage(id: id);
            },
          ),
          
          // Profil
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
          
          // Bildirimler
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsPage(),
          ),
          
          // Tüm Modüller
          GoRoute(
            path: '/modules',
            builder: (context, state) => const ModulesPage(),
          ),
          
          // Modüler route'lar - Web app'teki gibi yapı
          ...serviceRoutes,
          ...salesRoutes,
          ...purchaseRoutes,
          ...accountingRoutes,
          ...inventoryRoutes,
          ...hrRoutes,
        ],
      ),
      
      // Alt sayfalar - bottom bar olmadan (full screen)
      GoRoute(
        path: '/notification-settings',
        builder: (context, state) => const NotificationSettingsPage(),
      ),
    ],
  );
});
