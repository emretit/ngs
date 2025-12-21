import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/service_request.dart';
import '../providers/service_request_provider.dart';
import '../shared/widgets/service_page_header.dart';
import '../shared/widgets/service_filter_bar.dart';

class ServiceRequestsListPage extends ConsumerStatefulWidget {
  const ServiceRequestsListPage({super.key});

  @override
  ConsumerState<ServiceRequestsListPage> createState() => _ServiceRequestsListPageState();
}

class _ServiceRequestsListPageState extends ConsumerState<ServiceRequestsListPage> {
  String? _selectedStatus;
  String? _selectedPriority;
  String? _selectedTechnician;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final serviceRequestsAsync = ref.watch(serviceRequestsProvider);
    final statusColors = ref.watch(serviceRequestStatusColorsProvider);
    final priorityColors = ref.watch(serviceRequestPriorityColorsProvider);
    final statusDisplayNames = ref.watch(serviceRequestStatusDisplayNamesProvider);
    final priorityDisplayNames = ref.watch(serviceRequestPriorityDisplayNamesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(serviceRequestsProvider);
            ref.invalidate(serviceRequestStatsProvider);
          },
          color: const Color(0xFFB73D3D),
          child: CustomScrollView(
            slivers: [
              // Service Page Header - Gradient
              const SliverToBoxAdapter(
                child: ServicePageHeader(),
              ),
              
              // Filter Bar
              SliverToBoxAdapter(
                child: ServiceFilterBar(
                  searchQuery: _searchQuery,
                  onSearchChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                  selectedStatus: _selectedStatus,
                  onStatusChanged: (value) {
                    setState(() {
                      _selectedStatus = value;
                    });
                  },
                  selectedPriority: _selectedPriority,
                  onPriorityChanged: (value) {
                    setState(() {
                      _selectedPriority = value;
                    });
                  },
                  selectedTechnician: _selectedTechnician,
                  onTechnicianChanged: (value) {
                    setState(() {
                      _selectedTechnician = value;
                    });
                  },
                ),
              ),
              
              // Service Requests List
              serviceRequestsAsync.when(
                data: (serviceRequests) {
                  List<ServiceRequest> filteredRequests = serviceRequests;

                  if (_selectedStatus != null) {
                    filteredRequests = filteredRequests
                        .where((request) => request.status == _selectedStatus)
                        .toList();
                  }

                  if (_selectedPriority != null) {
                    filteredRequests = filteredRequests
                        .where((request) => request.priority == _selectedPriority)
                        .toList();
                  }

                  if (_selectedTechnician != null) {
                    filteredRequests = filteredRequests
                        .where((request) => request.assignedTechnician == _selectedTechnician)
                        .toList();
                  }

                  if (_searchQuery.isNotEmpty) {
                    filteredRequests = filteredRequests
                        .where((request) =>
                            request.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                            (request.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
                            (request.location?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false))
                        .toList();
                  }

                  if (filteredRequests.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildEmptyState(),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          return _buildServiceRequestCardCompact(
                            filteredRequests[index],
                            statusColors,
                            priorityColors,
                            statusDisplayNames,
                            priorityDisplayNames,
                          );
                        },
                        childCount: filteredRequests.length,
                      ),
                    ),
                  );
                },
                loading: () => SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildLoadingState(),
                ),
                error: (error, stack) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildErrorState(context, error, ref),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Kompakt Servis Kartı - Optimize edilmiş
  Widget _buildServiceRequestCardCompact(
    ServiceRequest serviceRequest,
    Map<String, String> statusColors,
    Map<String, String> priorityColors,
    Map<String, String> statusDisplayNames,
    Map<String, String> priorityDisplayNames,
  ) {
    final statusColor = _getStatusColor(serviceRequest.status, statusColors);
    final priorityColor = _getPriorityColor(serviceRequest.priority, priorityColors);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
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
          onTap: () => context.go('/service/detail/${serviceRequest.id}'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 4,
                  height: 44,
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              serviceRequest.title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF000000),
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              statusDisplayNames[serviceRequest.status] ?? serviceRequest.status,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (serviceRequest.serviceType != null) ...[
                            Icon(
                              CupertinoIcons.wrench,
                              size: 11,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              serviceRequest.serviceType!,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[600],
                                height: 1.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (serviceRequest.location != null) ...[
                              const SizedBox(width: 8),
                              Icon(
                                CupertinoIcons.location,
                                size: 11,
                                color: Colors.grey[500],
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  serviceRequest.location!,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                    height: 1.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ] else if (serviceRequest.location != null) ...[
                            Icon(
                              CupertinoIcons.location,
                              size: 11,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                serviceRequest.location!,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                  height: 1.2,
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
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: priorityColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        priorityDisplayNames[serviceRequest.priority] ?? serviceRequest.priority,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: priorityColor,
                        ),
                      ),
                    ),
                    if (serviceRequest.dueDate != null) ...[
                      const SizedBox(height: 5),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            CupertinoIcons.calendar,
                            size: 10,
                            color: serviceRequest.dueDate!.isBefore(DateTime.now())
                                ? const Color(0xFFEF4444)
                                : Colors.grey[500],
                          ),
                          const SizedBox(width: 3),
                          Text(
                            _formatDate(serviceRequest.dueDate!),
                            style: TextStyle(
                              fontSize: 10,
                              color: serviceRequest.dueDate!.isBefore(DateTime.now())
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF8E8E93),
                              fontWeight: serviceRequest.dueDate!.isBefore(DateTime.now())
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
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

  Widget _buildEmptyState() {
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
              child: Icon(
                _hasActiveFilters() ? CupertinoIcons.search : CupertinoIcons.wrench,
                size: 48,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _hasActiveFilters()
                  ? 'Arama kriterlerinize uygun servis talebi bulunamadı'
                  : 'Henüz servis talebi bulunmuyor',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
              textAlign: TextAlign.center,
            ),
            if (!_hasActiveFilters()) ...[
              const SizedBox(height: 8),
              Text(
                'İlk servis talebinizi oluşturarak başlayın',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                color: const Color(0xFFB73D3D),
                borderRadius: BorderRadius.circular(10),
                onPressed: () => context.go('/service/new'),
                child: const Text(
                  'İlk Servis Talebini Oluştur',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
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
            decoration: BoxDecoration(
              color: const Color(0xFFF2F2F7),
              shape: BoxShape.circle,
            ),
            child: const CupertinoActivityIndicator(
              radius: 16,
              color: Color(0xFFB73D3D),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Servisler yükleniyor...',
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

  Widget _buildErrorState(BuildContext context, Object error, WidgetRef ref) {
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
              'Servis talepleri yüklenirken bir sorun oluştu.\nLütfen tekrar deneyin.',
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
              color: const Color(0xFFB73D3D),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                ref.invalidate(serviceRequestsProvider);
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

  bool _hasActiveFilters() {
    return _searchQuery.isNotEmpty ||
        _selectedStatus != null ||
        _selectedPriority != null ||
        _selectedTechnician != null;
  }

  Color _getStatusColor(String status, Map<String, String> statusColors) {
    final colorName = statusColors[status] ?? 'blue';
    return _getColorFromName(colorName);
  }

  Color _getPriorityColor(String priority, Map<String, String> priorityColors) {
    final colorName = priorityColors[priority] ?? 'blue';
    return _getColorFromName(colorName);
  }

  Color _getColorFromName(String colorName) {
    switch (colorName) {
      case 'red':
        return Colors.red;
      case 'orange':
        return Colors.orange;
      case 'yellow':
        return Colors.yellow[700]!;
      case 'green':
        return Colors.green;
      case 'blue':
        return Colors.blue;
      case 'purple':
        return Colors.purple;
      default:
        return Colors.grey;
    }
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
