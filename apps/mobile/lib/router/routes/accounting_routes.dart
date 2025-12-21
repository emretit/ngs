import 'package:go_router/go_router.dart';
import '../../pages/accounting/expenses_page.dart';
import '../../pages/accounting/payments_page.dart';
import '../../pages/accounting/bank_accounts_page.dart';
import '../../pages/finance_page.dart';

/// Accounting modülü route'ları
/// Web app'teki financeRoutes.tsx'e benzer yapı
final List<RouteBase> accountingRoutes = [
  // Ana Finans Dashboard
  GoRoute(
    path: '/finance',
    builder: (context, state) => const FinancePage(),
  ),
  GoRoute(
    path: '/accounting',
    redirect: (context, state) => '/finance',
  ),
  GoRoute(
    path: '/accounting/expenses',
    builder: (context, state) => const ExpensesPage(),
  ),
  GoRoute(
    path: '/accounting/payments',
    builder: (context, state) => const PaymentsPage(),
  ),
  GoRoute(
    path: '/accounting/accounts',
    builder: (context, state) => const BankAccountsPage(),
  ),
];

