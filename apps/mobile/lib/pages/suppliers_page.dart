import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supplier_provider.dart';
import '../models/supplier.dart';

class SuppliersPage extends ConsumerStatefulWidget {
  const SuppliersPage({super.key});

  @override
  ConsumerState<SuppliersPage> createState() => _SuppliersPageState();
}

class _SuppliersPageState extends ConsumerState<SuppliersPage> {
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
    final suppliersAsync = ref.watch(suppliersProvider);
    final statsAsync = ref.watch(supplierStatsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF9333EA), Color(0xFF7C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                CupertinoIcons.building_2_fill,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            const Text('Tedarikçiler'),
          ],
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () => context.go('/suppliers/new'),
            icon: const Icon(CupertinoIcons.plus_circle_fill, size: 24),
            color: const Color(0xFF9333EA),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(suppliersProvider);
          ref.invalidate(supplierStatsProvider);
        },
        color: const Color(0xFF9333EA),
        child: CustomScrollView(
          slivers: [
            // Gradient Header with Stats
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF9333EA), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    // Stats
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
                      child: statsAsync.when(
                        data: (stats) => _buildCompactStats(stats),
                        loading: () => _buildLoadingStats(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ),
                    
                    // Search and Filters
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Column(
                        children: [
                          CupertinoSearchTextField(
                            controller: _searchController,
                            placeholder: 'Tedarikçi ara...',
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
            
            // Supplier List
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: suppliersAsync.when(
                data: (suppliers) {
                  final filteredSuppliers = _filterSuppliers(suppliers);
                  
                  if (filteredSuppliers.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildEmptyState(),
                    );
                  }

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildSupplierCardCompact(filteredSuppliers[index]);
                      },
                      childCount: filteredSuppliers.length,
                    ),
                  );
                },
                loading: () => SliverFillRemaining(
                  hasScrollBody: false,
                  child: const Center(
                    child: CupertinoActivityIndicator(color: Color(0xFF9333EA)),
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
            '${stats['totalSuppliers'] ?? 0}',
            'Toplam',
            CupertinoIcons.building_2_fill,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['activeSuppliers'] ?? 0}',
            'Aktif',
            CupertinoIcons.checkmark_circle_fill,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['potentialSuppliers'] ?? 0}',
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
            color: isSelected ? const Color(0xFF9333EA) : Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // Kompakt Tedarikçi Kartı
  Widget _buildSupplierCardCompact(Supplier supplier) {
    final statusColor = _getStatusColor(supplier.status);

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
          onTap: () => context.go('/suppliers/${supplier.id}'),
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
                    supplier.type == 'kurumsal' 
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
                        supplier.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (supplier.company != null && supplier.company!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          supplier.company!,
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
                          if (supplier.email != null && supplier.email!.isNotEmpty) ...[
                            Icon(
                              CupertinoIcons.mail,
                              size: 12,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                supplier.email!,
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
                        _getStatusText(supplier.status),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ),
                    if (supplier.balance > 0) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatCurrency(supplier.balance),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF9333EA),
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
              color: const Color(0xFF9333EA).withOpacity(0.1),
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(
              CupertinoIcons.building_2_fill,
              size: 40,
              color: Color(0xFF9333EA),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty ? 'Arama sonucu bulunamadı' : 'Henüz tedarikçi yok',
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
                : 'İlk tedarikçinizi ekleyin',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF8E8E93),
            ),
          ),
          if (_searchQuery.isEmpty) ...[
            const SizedBox(height: 24),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              color: const Color(0xFF9333EA),
              borderRadius: BorderRadius.circular(10),
              onPressed: () => context.go('/suppliers/new'),
              child: const Text(
                'Tedarikçi Ekle',
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
              color: const Color(0xFF9333EA),
              borderRadius: BorderRadius.circular(10),
              onPressed: () => ref.invalidate(suppliersProvider),
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

  List<Supplier> _filterSuppliers(List<Supplier> suppliers) {
    var filtered = suppliers;

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((supplier) {
        return supplier.name.toLowerCase().contains(query) ||
               (supplier.company?.toLowerCase().contains(query) ?? false) ||
               (supplier.email?.toLowerCase().contains(query) ?? false) ||
               (supplier.mobilePhone?.contains(query) ?? false);
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
        filtered = filtered.where((supplier) => supplier.status == statusFilter).toList();
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

