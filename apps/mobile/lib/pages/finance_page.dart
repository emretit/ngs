import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/accounting_provider.dart';
import '../models/bank_account.dart';
import '../models/expense.dart';
import '../models/payment.dart';

/// Finans Dashboard Sayfası
/// Web app'teki Finance modülünün mobil versiyonu
class FinancePage extends ConsumerStatefulWidget {
  const FinancePage({super.key});

  @override
  ConsumerState<FinancePage> createState() => _FinancePageState();
}

class _FinancePageState extends ConsumerState<FinancePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<BankAccount>> bankAccountsAsync = ref.watch(bankAccountsProvider);
    final AsyncValue<List<Expense>> expensesAsync = ref.watch(expensesProvider);
    final AsyncValue<List<Payment>> paymentsAsync = ref.watch(paymentsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          'Finans',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          CupertinoButton(
            padding: const EdgeInsets.all(8),
            onPressed: () {
              // TODO: Yeni işlem ekle
            },
            child: const Icon(
              CupertinoIcons.plus_circle_fill,
              color: Color(0xFFD32F2F),
              size: 24,
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFFD32F2F),
          unselectedLabelColor: const Color(0xFF8E8E93),
          indicatorColor: const Color(0xFFD32F2F),
          tabs: const [
            Tab(text: 'Özet'),
            Tab(text: 'Hesaplar'),
            Tab(text: 'Giderler'),
            Tab(text: 'Ödemeler'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Özet Tab
          _buildSummaryTab(context, bankAccountsAsync, expensesAsync, paymentsAsync),
          // Hesaplar Tab
          _buildAccountsTab(context, bankAccountsAsync),
          // Giderler Tab
          _buildExpensesTab(context, expensesAsync),
          // Ödemeler Tab
          _buildPaymentsTab(context, paymentsAsync),
        ],
      ),
    );
  }

  Widget _buildSummaryTab(
    BuildContext context,
    AsyncValue bankAccountsAsync,
    AsyncValue expensesAsync,
    AsyncValue paymentsAsync,
  ) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(bankAccountsProvider);
        ref.invalidate(expensesProvider);
        ref.invalidate(paymentsProvider);
      },
      color: const Color(0xFFD32F2F),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Toplam Bakiye Kartı
            _buildTotalBalanceCard(context, bankAccountsAsync as AsyncValue<List<BankAccount>>),
            const SizedBox(height: 24),

            // İstatistikler
            Text(
              'Finansal Özet',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 16),
            _buildFinanceStatsGrid(context, bankAccountsAsync, expensesAsync, paymentsAsync),
            const SizedBox(height: 24),

            // Hızlı Erişim
            Text(
              'Hızlı İşlemler',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 16),
            _buildQuickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalBalanceCard(BuildContext context, AsyncValue<List<BankAccount>> bankAccountsAsync) {
    return bankAccountsAsync.when(
      data: (List<BankAccount> accounts) {
        double totalBalance = 0.0;
        for (final account in accounts) {
          totalBalance += account.currentBalance ?? 0.0;
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF3B82F6).withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      CupertinoIcons.building_2_fill,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Toplam Bakiye',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                '₺${_formatNumber(totalBalance)}',
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${accounts.length} aktif hesap',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
              ),
            ],
          ),
        );
      },
      loading: () => Container(
        width: double.infinity,
        height: 160,
        decoration: BoxDecoration(
          color: const Color(0xFF3B82F6).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (e, _) => _buildErrorCard('Bakiye yüklenemedi'),
    );
  }

  Widget _buildFinanceStatsGrid(
    BuildContext context,
    AsyncValue bankAccountsAsync,
    AsyncValue expensesAsync,
    AsyncValue paymentsAsync,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: bankAccountsAsync.when(
                data: (accounts) => _buildStatCard(
                  'Hesap Sayısı',
                  '${accounts.length}',
                  CupertinoIcons.building_2_fill,
                  const Color(0xFF3B82F6),
                ),
                loading: () => _buildLoadingCard(),
                error: (e, _) => _buildStatCard('Hesap Sayısı', '-', CupertinoIcons.building_2_fill, const Color(0xFF3B82F6)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: expensesAsync.when(
                data: (expenses) {
                  final thisMonthExpenses = expenses.where((Expense e) {
                    final now = DateTime.now();
                    return e.date.month == now.month && e.date.year == now.year;
                  }).fold<double>(0.0, (double sum, Expense e) => sum + e.amount);
                  return _buildStatCard(
                    'Bu Ay Gider',
                    '₺${_formatNumber(thisMonthExpenses)}',
                    CupertinoIcons.arrow_down_circle_fill,
                    const Color(0xFFEF4444),
                  );
                },
                loading: () => _buildLoadingCard(),
                error: (e, _) => _buildStatCard('Bu Ay Gider', '-', CupertinoIcons.arrow_down_circle_fill, const Color(0xFFEF4444)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: paymentsAsync.when(
                data: (payments) {
                  // Payment modelinde status yok, paymentDirection kullanıyoruz
                  // Gelen ödemeler için 'incoming', giden ödemeler için 'outgoing'
                  final incomingPayments = payments.where((Payment p) => p.paymentDirection == 'incoming').length;
                  return _buildStatCard(
                    'Gelen',
                    '$incomingPayments',
                    CupertinoIcons.arrow_down_circle_fill,
                    const Color(0xFF22C55E),
                  );
                },
                loading: () => _buildLoadingCard(),
                error: (e, _) => _buildStatCard('Gelen', '-', CupertinoIcons.arrow_down_circle_fill, const Color(0xFF22C55E)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: paymentsAsync.when(
                data: (payments) {
                  // Giden ödemeler
                  final outgoingPayments = payments.where((Payment p) => p.paymentDirection == 'outgoing').length;
                  return _buildStatCard(
                    'Giden',
                    '$outgoingPayments',
                    CupertinoIcons.arrow_up_circle_fill,
                    const Color(0xFFEF4444),
                  );
                },
                loading: () => _buildLoadingCard(),
                error: (e, _) => _buildStatCard('Tamamlanan', '-', CupertinoIcons.checkmark_circle_fill, const Color(0xFF22C55E)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF8E8E93),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      children: [
        _buildQuickActionCard(
          context,
          'Gider Ekle',
          'Yeni gider kaydı oluştur',
          CupertinoIcons.arrow_down_circle_fill,
          const Color(0xFFEF4444),
          () => context.go('/accounting/expenses/new'),
        ),
        const SizedBox(height: 12),
        _buildQuickActionCard(
          context,
          'Ödeme Yap',
          'Yeni ödeme kaydı oluştur',
          CupertinoIcons.creditcard_fill,
          const Color(0xFF22C55E),
          () => context.go('/accounting/payments/new'),
        ),
        const SizedBox(height: 12),
        _buildQuickActionCard(
          context,
          'Hesap Ekle',
          'Yeni banka hesabı ekle',
          CupertinoIcons.building_2_fill,
          const Color(0xFF3B82F6),
          () => context.go('/accounting/accounts/new'),
        ),
      ],
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: Color(0xFF8E8E93),
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAccountsTab(BuildContext context, AsyncValue bankAccountsAsync) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(bankAccountsProvider);
      },
      color: const Color(0xFFD32F2F),
      child: bankAccountsAsync.when(
        data: (accounts) {
          if (accounts.isEmpty) {
            return _buildEmptyState(
              'Henüz hesap bulunmuyor',
              'İlk banka hesabınızı ekleyin',
              CupertinoIcons.building_2_fill,
              () => context.go('/accounting/accounts/new'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: accounts.length,
            itemBuilder: (context, index) {
              final account = accounts[index];
              return _buildAccountCard(context, account);
            },
          );
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
      ),
    );
  }

  Widget _buildAccountCard(BuildContext context, dynamic account) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/accounting/accounts/${account.id}'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    CupertinoIcons.building_2_fill,
                    color: Color(0xFF3B82F6),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        account.bankName ?? 'Banka',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        account.accountNumber ?? '',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₺${_formatNumber(account.currentBalance ?? 0.0)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF22C55E),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExpensesTab(BuildContext context, AsyncValue expensesAsync) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(expensesProvider);
      },
      color: const Color(0xFFD32F2F),
      child: expensesAsync.when(
        data: (expenses) {
          if (expenses.isEmpty) {
            return _buildEmptyState(
              'Henüz gider bulunmuyor',
              'İlk gider kaydınızı oluşturun',
              CupertinoIcons.arrow_down_circle_fill,
              () => context.go('/accounting/expenses/new'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: expenses.length,
            itemBuilder: (context, index) {
              final expense = expenses[index];
              return _buildExpenseCard(context, expense);
            },
          );
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
      ),
    );
  }

  Widget _buildExpenseCard(BuildContext context, dynamic expense) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                CupertinoIcons.arrow_down_circle_fill,
                color: Color(0xFFEF4444),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    expense.description ?? 'Gider',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF000000),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    expense.subcategory ?? expense.description ?? '',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF8E8E93),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '-₺${_formatNumber(expense.amount)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFEF4444),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(expense.date),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF8E8E93),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentsTab(BuildContext context, AsyncValue paymentsAsync) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(paymentsProvider);
      },
      color: const Color(0xFFD32F2F),
      child: paymentsAsync.when(
        data: (payments) {
          if (payments.isEmpty) {
            return _buildEmptyState(
              'Henüz ödeme bulunmuyor',
              'İlk ödeme kaydınızı oluşturun',
              CupertinoIcons.creditcard_fill,
              () => context.go('/accounting/payments/new'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: payments.length,
            itemBuilder: (context, index) {
              final payment = payments[index];
              return _buildPaymentCard(context, payment);
            },
          );
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
      ),
    );
  }

  Widget _buildPaymentCard(BuildContext context, dynamic payment) {
    final statusColor = _getPaymentStatusColor(payment.status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                CupertinoIcons.creditcard_fill,
                color: statusColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payment.description ?? 'Ödeme',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF000000),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _getPaymentStatusText(payment.status),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₺${_formatNumber(payment.amount)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(payment.date),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF8E8E93),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon, VoidCallback onAdd) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(40),
            ),
            child: Icon(
              icon,
              size: 40,
              color: const Color(0xFF3B82F6),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF8E8E93),
            ),
          ),
          const SizedBox(height: 24),
          CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            color: const Color(0xFFD32F2F),
            borderRadius: BorderRadius.circular(10),
            onPressed: onAdd,
            child: const Text(
              'Ekle',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingCard() {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(child: CupertinoActivityIndicator()),
    );
  }

  Widget _buildErrorCard(String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(CupertinoIcons.exclamationmark_circle, color: Colors.red[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: Colors.red[600]),
            ),
          ),
        ],
      ),
    );
  }

  Color _getPaymentStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return const Color(0xFFFF9500);
      case 'completed':
        return const Color(0xFF22C55E);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getPaymentStatusText(String? status) {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return 'Bilinmiyor';
    }
  }

  String _formatNumber(num value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toStringAsFixed(0);
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

