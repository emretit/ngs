import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:typed_data';
import '../providers/crm_provider.dart';
import '../providers/sales_provider.dart';
import '../providers/activity_provider.dart';
import '../providers/pdf_template_provider.dart';
import '../models/opportunity.dart';
import '../models/proposal.dart';
import '../models/order.dart';
import '../models/activity.dart';
import '../models/pdf_template.dart';
import '../services/proposal_pdf_service.dart';
import 'package:intl/intl.dart';

/// CRM Dashboard Sayfası - Servis yönetimi sayfasına benzer UI/UX
class CrmPage extends ConsumerStatefulWidget {
  const CrmPage({super.key});

  @override
  ConsumerState<CrmPage> createState() => _CrmPageState();
}

class _CrmPageState extends ConsumerState<CrmPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  String? _selectedStatus;

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
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return [
            SliverAppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFB73D3D), Color(0xFF8B2F2F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                CupertinoIcons.chart_bar_alt_fill,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            const Text('CRM'),
          ],
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
              pinned: true,
              floating: false,
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(48),
                child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF8B2F2F),
              unselectedLabelColor: const Color(0xFF8E8E93),
              indicatorColor: const Color(0xFF8B2F2F),
              indicatorWeight: 3,
                    isScrollable: false,
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.normal,
              ),
              tabs: const [
                Tab(text: 'Aktiviteler'),
                Tab(text: 'Fırsatlar'),
                Tab(text: 'Teklifler'),
                Tab(text: 'Siparişler'),
              ],
            ),
          ),
              ),
            ),
          ];
        },
        body: TabBarView(
              controller: _tabController,
              children: [
                _buildActivitiesTab(context),
                _buildOpportunitiesTab(context),
                _buildProposalsTab(context),
                _buildOrdersTab(context),
              ],
            ),
      ),
    );
  }

  // Aktiviteler Tab
  Widget _buildActivitiesTab(BuildContext context) {
    final activitiesAsync = ref.watch(activitiesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activitiesProvider);
      },
      color: const Color(0xFF8B2F2F),
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: _buildHeader(
              context,
              'Aktiviteler',
              'Günlük işlemler',
              CupertinoIcons.calendar,
              const Color(0xFF3B82F6),
              () => context.go('/activities/new'),
              activitiesAsync,
            ),
          ),
          
          // Filter Bar
          SliverToBoxAdapter(
            child: _buildFilterBar(
              hintText: 'Aktivite başlığı veya açıklama ile ara...',
              onSearchChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              searchQuery: _searchQuery,
            ),
          ),
          
          // List
          activitiesAsync.when(
            data: (activities) {
              List<Activity> filtered = activities;
              
              if (_searchQuery.isNotEmpty) {
                filtered = filtered.where((a) =>
                  a.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  (a.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false)
                ).toList();
              }
              
              if (_selectedStatus != null) {
                filtered = filtered.where((a) => a.status == _selectedStatus).toList();
              }
              
              if (filtered.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState('Aktivite bulunamadı', CupertinoIcons.calendar),
                );
              }
              
              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildActivityCard(filtered[index]),
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildLoadingState(),
            ),
            error: (_, __) => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState('Aktiviteler yüklenemedi'),
            ),
          ),
        ],
      ),
    );
  }

  // Fırsatlar Tab
  Widget _buildOpportunitiesTab(BuildContext context) {
    final opportunitiesAsync = ref.watch(opportunitiesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(opportunitiesProvider);
      },
      color: const Color(0xFF8B2F2F),
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: _buildHeader(
              context,
              'Fırsatlar',
              'Satış fırsatları',
              CupertinoIcons.chart_bar_alt_fill,
              const Color(0xFF9333EA),
              () => context.go('/sales/opportunities/new'),
              opportunitiesAsync,
            ),
          ),
          
          // Filter Bar
          SliverToBoxAdapter(
            child: _buildFilterBar(
              hintText: 'Fırsat başlığı veya müşteri ile ara...',
              onSearchChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              searchQuery: _searchQuery,
            ),
          ),
          
          // List
          opportunitiesAsync.when(
            data: (opportunities) {
              List<Opportunity> filtered = opportunities;
              
              if (_searchQuery.isNotEmpty) {
                filtered = filtered.where((o) =>
                  o.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  (o.customerName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false)
                ).toList();
              }
              
              if (_selectedStatus != null) {
                filtered = filtered.where((o) => o.status == _selectedStatus).toList();
              }
              
              if (filtered.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState('Fırsat bulunamadı', CupertinoIcons.star),
                );
              }
              
              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildOpportunityCard(filtered[index]),
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildLoadingState(),
            ),
            error: (_, __) => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState('Fırsatlar yüklenemedi'),
            ),
          ),
        ],
      ),
    );
  }

  // Teklifler Tab
  Widget _buildProposalsTab(BuildContext context) {
    final proposalsAsync = ref.watch(proposalsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(proposalsProvider);
      },
      color: const Color(0xFF8B2F2F),
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: _buildHeader(
              context,
              'Teklifler',
              'Müşteri teklifleri',
              CupertinoIcons.doc_fill,
              const Color(0xFFFF9500),
              () => context.go('/sales/proposals/new'),
              proposalsAsync,
            ),
          ),
          
          // Filter Bar
          SliverToBoxAdapter(
            child: _buildFilterBar(
              hintText: 'Teklif başlığı veya numarası ile ara...',
              onSearchChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              searchQuery: _searchQuery,
            ),
          ),
          
          // List
          proposalsAsync.when(
            data: (proposals) {
              List<Proposal> filtered = proposals;
              
              if (_searchQuery.isNotEmpty) {
                filtered = filtered.where((p) =>
                  p.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  p.number.toLowerCase().contains(_searchQuery.toLowerCase())
                ).toList();
              }
              
              if (_selectedStatus != null) {
                filtered = filtered.where((p) => p.status == _selectedStatus).toList();
              }
              
              if (filtered.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState('Teklif bulunamadı', CupertinoIcons.doc),
                );
              }
              
              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildProposalCard(filtered[index]),
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildLoadingState(),
            ),
            error: (_, __) => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState('Teklifler yüklenemedi'),
            ),
          ),
        ],
      ),
    );
  }

  // Siparişler Tab
  Widget _buildOrdersTab(BuildContext context) {
    final ordersAsync = ref.watch(salesOrdersProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(salesOrdersProvider);
      },
      color: const Color(0xFF8B2F2F),
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: _buildHeader(
              context,
              'Siparişler',
              'Müşteri siparişleri',
              CupertinoIcons.cart_fill,
              const Color(0xFF22C55E),
              () => context.go('/sales/orders/new'),
              ordersAsync,
            ),
          ),
          
          // Filter Bar
          SliverToBoxAdapter(
            child: _buildFilterBar(
              hintText: 'Sipariş numarası veya başlık ile ara...',
              onSearchChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              searchQuery: _searchQuery,
            ),
          ),
          
          // List
          ordersAsync.when(
            data: (orders) {
              List<Order> filtered = orders;
              
              if (_searchQuery.isNotEmpty) {
                filtered = filtered.where((o) =>
                  o.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  o.orderNumber.toLowerCase().contains(_searchQuery.toLowerCase())
                ).toList();
              }
              
              if (_selectedStatus != null) {
                filtered = filtered.where((o) => o.status == _selectedStatus).toList();
              }
              
              if (filtered.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState('Sipariş bulunamadı', CupertinoIcons.cart),
                );
              }
              
              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildOrderCard(filtered[index]),
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildLoadingState(),
            ),
            error: (_, __) => SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState('Siparişler yüklenemedi'),
            ),
          ),
        ],
      ),
    );
  }

  // Header Widget (ServicePageHeader benzeri)
  Widget _buildHeader(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onNew,
    AsyncValue data,
  ) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Icon(icon, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: Color(0xE6FFFFFF),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                CupertinoButton(
                  onPressed: onNew,
                  padding: EdgeInsets.zero,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.3),
                        width: 1.5,
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(CupertinoIcons.add, color: Colors.white, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'Yeni',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Stats
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: data.when(
              data: (items) {
                if (items is List<Activity>) {
                  return _buildActivityStats(items);
                } else if (items is List<Opportunity>) {
                  return _buildOpportunityStats(items);
                } else if (items is List<Proposal>) {
                  return _buildProposalStats(items);
                } else if (items is List<Order>) {
                  return _buildOrderStats(items);
                }
                return const SizedBox.shrink();
              },
              loading: () => _buildLoadingStats(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
        ],
      ),
    );
  }

  // Filter Bar
  Widget _buildFilterBar({
    required String hintText,
    required ValueChanged<String> onSearchChanged,
    required String searchQuery,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.withOpacity(0.2)),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF2F2F7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: TextField(
          onChanged: onSearchChanged,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(
              color: Color(0xFF8E8E93),
              fontSize: 14,
            ),
            prefixIcon: const Icon(
              CupertinoIcons.search,
              color: Color(0xFF8B2F2F),
              size: 20,
            ),
            suffixIcon: searchQuery.isNotEmpty
                ? CupertinoButton(
                    onPressed: () => onSearchChanged(''),
                    child: const Icon(
                      CupertinoIcons.clear_circled_solid,
                      color: Color(0xFF8E8E93),
                      size: 20,
                    ),
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ),
    );
  }

  // Activity Card
  Widget _buildActivityCard(Activity activity) {
    final statusColor = _getActivityStatusColor(activity.status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/activities/${activity.id}/edit'),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              activity.title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF000000),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getActivityStatusName(activity.status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (activity.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          activity.description!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      if (activity.dueDate != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              CupertinoIcons.calendar,
                              size: 12,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatDate(activity.dueDate!),
                              style: TextStyle(
                                fontSize: 11,
                                color: activity.dueDate!.isBefore(DateTime.now())
                                    ? const Color(0xFFEF4444)
                                    : Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Opportunity Card
  Widget _buildOpportunityCard(Opportunity opportunity) {
    final statusColor = _getOpportunityStatusColor(opportunity.status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/sales/opportunities/${opportunity.id}'),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              opportunity.title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF000000),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getOpportunityStatusName(opportunity.status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (opportunity.customerName != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          opportunity.customerName!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₺${_formatCurrency(opportunity.value ?? 0)}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                    if (opportunity.expectedCloseDate != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(opportunity.expectedCloseDate!),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF8E8E93),
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

  // Proposal Card
  Widget _buildProposalCard(Proposal proposal) {
    final statusColor = _getProposalStatusColor(proposal.status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/sales/proposals/${proposal.id}'),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              proposal.title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF000000),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getProposalStatusName(proposal.status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        proposal.number,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₺${_formatCurrency(proposal.totalAmount)}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                    if (proposal.validUntil != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(proposal.validUntil!),
                        style: TextStyle(
                          fontSize: 11,
                          color: proposal.validUntil!.isBefore(DateTime.now())
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(width: 8),
                // PDF Şablon Seçimi Dropdown
                _buildPdfTemplateDropdown(proposal),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPdfTemplateDropdown(Proposal proposal) {
    final templatesAsync = ref.watch(proposalPdfTemplatesProvider);
    
    return templatesAsync.when(
      data: (templates) {
        // Şablon yoksa veya tek şablon varsa direkt yazdır
        if (templates.isEmpty) {
          return CupertinoButton(
            padding: EdgeInsets.zero,
            minSize: 0,
            onPressed: () => _shareProposalPDF(proposal, null),
            child: const Icon(
              CupertinoIcons.doc_text,
              color: Color(0xFF8B2F2F),
              size: 20,
            ),
          );
        }
        
        // Şablonlar varsa dropdown butonu
        return CupertinoButton(
          padding: EdgeInsets.zero,
          minSize: 0,
          onPressed: () => _showTemplateSelector(proposal, templates),
          child: const Icon(
            CupertinoIcons.doc_text,
            color: Color(0xFF8B2F2F),
            size: 20,
          ),
        );
      },
      loading: () => const SizedBox(
        width: 20,
        height: 20,
        child: CupertinoActivityIndicator(radius: 8),
      ),
      error: (error, stack) {
        // Hata durumunda direkt yazdır
        return CupertinoButton(
          padding: EdgeInsets.zero,
          minSize: 0,
          onPressed: () => _shareProposalPDF(proposal, null),
          child: const Icon(
            CupertinoIcons.doc_text,
            color: Color(0xFF8B2F2F),
            size: 20,
          ),
        );
      },
    );
  }

  void _showTemplateSelector(Proposal proposal, List<PdfTemplate> templates) {
    showCupertinoModalPopup(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text(
          'PDF Şablonu Seç',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          // Varsayılan şablon
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _shareProposalPDF(proposal, null);
            },
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(CupertinoIcons.doc_text, size: 18, color: Color(0xFF8B2F2F)),
                SizedBox(width: 8),
                Text('Varsayılan Şablon'),
              ],
            ),
          ),
          // Diğer şablonlar
          ...templates.map((template) {
            return CupertinoActionSheetAction(
              onPressed: () {
                Navigator.pop(context);
                _shareProposalPDF(proposal, template.id);
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    template.isDefault 
                        ? CupertinoIcons.star_fill 
                        : CupertinoIcons.doc_text,
                    size: 18,
                    color: template.isDefault 
                        ? Colors.amber 
                        : const Color(0xFF8B2F2F),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    template.name,
                    style: TextStyle(
                      fontWeight: template.isDefault 
                          ? FontWeight.w600 
                          : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('İptal'),
        ),
      ),
    );
  }

  void _shareProposalPDF(Proposal proposal, String? templateId) async {
    try {
      final pdfService = ProposalPdfService();
      
      // Edge function ile PDF oluştur
      final pdfBytes = await pdfService.generateProposalPdfFromWeb(
        proposal,
        templateId: templateId,
      );
      
      final fileName = 'Teklif_${proposal.number}.pdf';
      
      await pdfService.previewAndShare(pdfBytes, fileName);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PDF oluşturuldu'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('PDF oluşturma hatası: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  // Order Card
  Widget _buildOrderCard(Order order) {
    final statusColor = _getOrderStatusColor(order.status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/sales/orders/${order.id}'),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              order.title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF000000),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getOrderStatusName(order.status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        order.orderNumber,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₺${_formatCurrency(order.totalAmount)}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(order.orderDate),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF8E8E93),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Stats Widgets
  Widget _buildActivityStats(List<Activity> activities) {
    final todo = activities.where((a) => a.status == 'todo').length;
    final inProgress = activities.where((a) => a.status == 'in_progress').length;
    final completed = activities.where((a) => a.status == 'completed').length;
    final cancelled = activities.where((a) => a.status == 'cancelled').length;
    
    return Row(
      children: [
        Expanded(child: _buildStatBubble('${activities.length}', 'Toplam', CupertinoIcons.circle)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$todo', 'Yapılacak', CupertinoIcons.circle)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$inProgress', 'Devam', CupertinoIcons.clock)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$completed', 'Bitti', CupertinoIcons.checkmark_circle)),
      ],
    );
  }

  Widget _buildOpportunityStats(List<Opportunity> opportunities) {
    final total = opportunities.length;
    final active = opportunities.where((o) => ['new', 'qualified', 'proposal', 'negotiation'].contains(o.status)).length;
    final won = opportunities.where((o) => o.status == 'won').length;
    final totalValue = opportunities.fold<double>(0, (sum, o) => sum + (o.value ?? 0));
    
    return Row(
      children: [
        Expanded(child: _buildStatBubble('$total', 'Toplam', CupertinoIcons.star)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$active', 'Aktif', CupertinoIcons.bolt)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$won', 'Kazanılan', CupertinoIcons.checkmark_circle)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble(_formatCurrency(totalValue), 'Değer', CupertinoIcons.money_dollar_circle)),
      ],
    );
  }

  Widget _buildProposalStats(List<Proposal> proposals) {
    final total = proposals.length;
    final draft = proposals.where((p) => p.status == 'draft' || p.status == 'taslak').length;
    final sent = proposals.where((p) => p.status == 'sent' || p.status == 'gonderildi').length;
    final accepted = proposals.where((p) => p.status == 'accepted' || p.status == 'kabul_edildi').length;
    
    return Row(
      children: [
        Expanded(child: _buildStatBubble('$total', 'Toplam', CupertinoIcons.doc)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$draft', 'Taslak', CupertinoIcons.doc_text)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$sent', 'Gönderildi', CupertinoIcons.paperplane)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$accepted', 'Kabul', CupertinoIcons.checkmark_circle)),
      ],
    );
  }

  Widget _buildOrderStats(List<Order> orders) {
    final total = orders.length;
    final pending = orders.where((o) => o.status == 'pending').length;
    final processing = orders.where((o) => o.status == 'processing').length;
    final completed = orders.where((o) => o.status == 'completed').length;
    
    return Row(
      children: [
        Expanded(child: _buildStatBubble('$total', 'Toplam', CupertinoIcons.cart)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$pending', 'Bekliyor', CupertinoIcons.clock)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$processing', 'İşleniyor', CupertinoIcons.gear)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatBubble('$completed', 'Tamam', CupertinoIcons.checkmark_circle)),
      ],
    );
  }

  Widget _buildStatBubble(String value, String label, IconData icon) {
    return AspectRatio(
      aspectRatio: 1.0,
      child: Container(
        padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
        children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
                fontSize: 14,
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
                fontSize: 9,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        ),
      ),
    );
  }

  Widget _buildLoadingStats() {
    return Row(
      children: List.generate(
        4,
        (index) => Expanded(
          child: AspectRatio(
            aspectRatio: 1.0,
          child: Container(
            margin: EdgeInsets.only(left: index > 0 ? 10 : 0),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
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
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: Colors.grey[400]),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFFF2F2F7),
              shape: BoxShape.circle,
            ),
            child: const CupertinoActivityIndicator(
              radius: 16,
              color: Color(0xFF8B2F2F),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Yükleniyor...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.red.shade50,
                    Colors.red.shade100.withOpacity(0.5),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                CupertinoIcons.exclamationmark_triangle,
                size: 48,
                color: Colors.red[600],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Bir hata oluştu',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              color: const Color(0xFF8B2F2F),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                // Refresh
              },
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

  // Status Helpers
  Color _getActivityStatusColor(String status) {
    switch (status) {
      case 'todo':
        return const Color(0xFFEF4444);
      case 'in_progress':
        return const Color(0xFFFF9500);
      case 'completed':
        return const Color(0xFF22C55E);
      case 'cancelled':
        return const Color(0xFF8E8E93);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getActivityStatusName(String status) {
    switch (status) {
      case 'todo':
        return 'Yapılacak';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  }

  Color _getOpportunityStatusColor(String status) {
    switch (status) {
      case 'new':
        return const Color(0xFF3B82F6);
      case 'qualified':
        return const Color(0xFF9333EA);
      case 'proposal':
        return const Color(0xFFFF9500);
      case 'negotiation':
        return const Color(0xFF3B82F6);
      case 'won':
        return const Color(0xFF22C55E);
      case 'lost':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getOpportunityStatusName(String status) {
    switch (status) {
      case 'new':
        return 'Yeni';
      case 'qualified':
        return 'Görüşme';
      case 'proposal':
        return 'Teklif';
      case 'negotiation':
        return 'Müzakere';
      case 'won':
        return 'Kazanılan';
      case 'lost':
        return 'Kaybedildi';
      default:
        return status;
    }
  }

  Color _getProposalStatusColor(String status) {
    if (status == 'draft' || status == 'taslak') {
      return const Color(0xFF8E8E93);
    } else if (status == 'pending' || status == 'onay_bekliyor') {
      return const Color(0xFFFF9500);
    } else if (status == 'sent' || status == 'gonderildi') {
      return const Color(0xFF3B82F6);
    } else if (status == 'accepted' || status == 'kabul_edildi') {
      return const Color(0xFF22C55E);
    } else if (status == 'rejected' || status == 'reddedildi') {
      return const Color(0xFFEF4444);
    } else if (status == 'expired' || status == 'suresi_dolmus') {
      return const Color(0xFFFF9500);
    }
    return const Color(0xFF8E8E93);
  }

  String _getProposalStatusName(String status) {
    if (status == 'draft' || status == 'taslak') return 'Taslak';
    if (status == 'pending' || status == 'onay_bekliyor') return 'Onay Bekliyor';
    if (status == 'sent' || status == 'gonderildi') return 'Gönderildi';
    if (status == 'accepted' || status == 'kabul_edildi') return 'Kabul Edildi';
    if (status == 'rejected' || status == 'reddedildi') return 'Reddedildi';
    if (status == 'expired' || status == 'suresi_dolmus') return 'Süresi Dolmuş';
    return status;
  }

  Color _getOrderStatusColor(String status) {
    switch (status) {
      case 'pending':
        return const Color(0xFFFF9500);
      case 'approved':
        return const Color(0xFF3B82F6);
      case 'processing':
        return const Color(0xFF9333EA);
      case 'shipping':
        return const Color(0xFF3B82F6);
      case 'delivered':
        return const Color(0xFF22C55E);
      case 'completed':
        return const Color(0xFF22C55E);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getOrderStatusName(String status) {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'processing':
        return 'İşleniyor';
      case 'shipping':
        return 'Kargo';
      case 'delivered':
        return 'Teslim';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  }

  String _formatCurrency(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toStringAsFixed(0);
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final requestDate = DateTime(date.year, date.month, date.day);

    if (requestDate == today) {
      return 'Bugün';
    } else if (requestDate == today.add(const Duration(days: 1))) {
      return 'Yarın';
    } else if (requestDate.isBefore(today)) {
      return 'Gecikti';
    } else {
      return '${date.day}/${date.month}';
    }
  }
}
