import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/customer_provider.dart';
import '../models/customer.dart';
import '../utils/responsive.dart';

class CustomersPage extends ConsumerStatefulWidget {
  const CustomersPage({super.key});

  @override
  ConsumerState<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends ConsumerState<CustomersPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'Tümü';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersProvider);
    final statsAsync = ref.watch(customerStatsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                CupertinoIcons.person_2_fill,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            const Text('Müşteriler'),
          ],
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () => context.go('/customers/new'),
            icon: const Icon(CupertinoIcons.plus_circle_fill, size: 24),
            color: const Color(0xFF10B981),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(customersProvider);
          ref.invalidate(customerStatsProvider);
        },
        color: const Color(0xFF10B981),
        child: CustomScrollView(
          slivers: [
            // Gradient Header with Stats
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    // Stats
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        Responsive.getHorizontalPadding(context),
                        20,
                        Responsive.getHorizontalPadding(context),
                        20
                      ),
                      child: statsAsync.when(
                        data: (stats) => _buildCompactStats(stats),
                        loading: () => _buildLoadingStats(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ),
                    
                    // Search and Filters
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        Responsive.getHorizontalPadding(context),
                        0,
                        Responsive.getHorizontalPadding(context),
                        16
                      ),
                      child: Column(
                        children: [
                          CupertinoSearchTextField(
                            controller: _searchController,
                            placeholder: 'Müşteri ara...',
                            onChanged: (value) {
                              setState(() {
                                _searchQuery = value;
                              });
                            },
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          const SizedBox(height: 12),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildFilterChip('Tümü', _selectedFilter == 'Tümü'),
                                const SizedBox(width: 8),
                                _buildFilterChip('Aktif', _selectedFilter == 'Aktif'),
                                const SizedBox(width: 8),
                                _buildFilterChip('Pasif', _selectedFilter == 'Pasif'),
                                const SizedBox(width: 8),
                                _buildFilterChip('Potansiyel', _selectedFilter == 'Potansiyel'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Customer List
            SliverPadding(
              padding: EdgeInsets.all(Responsive.getPadding(context)),
              sliver: customersAsync.when(
                data: (customers) {
                  final filteredCustomers = _filterCustomers(customers);
                  
                  if (filteredCustomers.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildEmptyState(),
                    );
                  }

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildCustomerCardCompact(filteredCustomers[index]);
                      },
                      childCount: filteredCustomers.length,
                    ),
                  );
                },
                loading: () => SliverFillRemaining(
                  hasScrollBody: false,
                  child: const Center(
                    child: CupertinoActivityIndicator(color: Color(0xFF10B981)),
                  ),
                ),
                error: (error, stack) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildErrorState(error.toString()),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Kompakt İstatistikler
  Widget _buildCompactStats(Map<String, dynamic> stats) {
    return Row(
      children: [
        Expanded(
          child: _buildStatBubble(
            '${stats['totalCustomers'] ?? 0}',
            'Toplam',
            CupertinoIcons.person_2_fill,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['activeCustomers'] ?? 0}',
            'Aktif',
            CupertinoIcons.checkmark_circle_fill,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['potentialCustomers'] ?? 0}',
            'Potansiyel',
            CupertinoIcons.star_fill,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '₺${_formatNumber(stats['totalBalance'] ?? 0)}',
            'Bakiye',
            CupertinoIcons.money_dollar_circle_fill,
          ),
        ),
      ],
    );
  }

  Widget _buildStatBubble(String value, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return CupertinoButton(
      onPressed: () {
        setState(() {
          _selectedFilter = label;
        });
      },
      padding: EdgeInsets.zero,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.white.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? const Color(0xFF10B981) : Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // Kompakt Müşteri Kartı
  Widget _buildCustomerCardCompact(Customer customer) {
    final statusColor = _getStatusColor(customer.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/customers/${customer.id}'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 50,
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        statusColor.withOpacity(0.2),
                        statusColor.withOpacity(0.1),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    customer.type == 'kurumsal' 
                        ? CupertinoIcons.building_2_fill
                        : CupertinoIcons.person_fill,
                    color: statusColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customer.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (customer.company != null && customer.company!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          customer.company!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (customer.email != null && customer.email!.isNotEmpty) ...[
                            Icon(
                              CupertinoIcons.mail,
                              size: 12,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                customer.email!,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _getStatusText(customer.status),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ),
                    if (customer.balance != null && customer.balance! > 0) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatCurrency(customer.balance!),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingStats() {
    return Row(
      children: List.generate(
        4,
        (index) => Expanded(
          child: Container(
            margin: EdgeInsets.only(left: index > 0 ? 10 : 0),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: Colors.white.withOpacity(0.3),
                width: 1.5,
              ),
            ),
            child: const Center(
              child: CupertinoActivityIndicator(color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.1),
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(
              CupertinoIcons.person_2,
              size: 40,
              color: Color(0xFF10B981),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty ? 'Arama sonucu bulunamadı' : 'Henüz müşteri yok',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty 
                ? 'Farklı bir arama terimi deneyin'
                : 'İlk müşterinizi ekleyin',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF8E8E93),
            ),
          ),
          if (_searchQuery.isEmpty) ...[
            const SizedBox(height: 24),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              color: const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(10),
              onPressed: () => context.go('/customers/new'),
              child: const Text(
                'Müşteri Ekle',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              CupertinoIcons.exclamationmark_triangle,
              size: 48,
              color: Color(0xFFEF4444),
            ),
            const SizedBox(height: 16),
            const Text(
              'Bir hata oluştu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF8E8E93),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              color: const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(10),
              onPressed: () => ref.invalidate(customersProvider),
              child: const Text(
                'Tekrar Dene',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Customer> _filterCustomers(List<Customer> customers) {
    var filtered = customers;

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((customer) {
        return customer.name.toLowerCase().contains(query) ||
               (customer.company?.toLowerCase().contains(query) ?? false) ||
               (customer.email?.toLowerCase().contains(query) ?? false) ||
               (customer.mobilePhone?.contains(query) ?? false);
      }).toList();
    }

    if (_selectedFilter != 'Tümü') {
      String statusFilter;
      switch (_selectedFilter) {
        case 'Aktif':
          statusFilter = 'aktif';
          break;
        case 'Pasif':
          statusFilter = 'pasif';
          break;
        case 'Potansiyel':
          statusFilter = 'potansiyel';
          break;
        default:
          statusFilter = '';
      }
      
      if (statusFilter.isNotEmpty) {
        filtered = filtered.where((customer) => customer.status == statusFilter).toList();
      }
    }

    return filtered;
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'aktif':
        return const Color(0xFF22C55E);
      case 'pasif':
        return const Color(0xFFEF4444);
      case 'potansiyel':
        return const Color(0xFFFF9500);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'aktif':
        return 'Aktif';
      case 'pasif':
        return 'Pasif';
      case 'potansiyel':
        return 'Potansiyel';
      default:
        return 'Bilinmiyor';
    }
  }

  String _formatCurrency(double amount) {
    if (amount >= 1000000) {
      return '₺${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '₺${(amount / 1000).toStringAsFixed(1)}K';
    }
    return '₺${amount.toStringAsFixed(0)}';
  }

  String _formatNumber(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    }
    return amount.toStringAsFixed(0);
  }
}
