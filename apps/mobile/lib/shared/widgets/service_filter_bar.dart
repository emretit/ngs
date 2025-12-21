import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/service_request_provider.dart';

/// Service Filter Bar Widget
/// Web app'teki ServiceFilterBar.tsx'e benzer yapı (mobil için uyarlanmış)
class ServiceFilterBar extends ConsumerStatefulWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final String? selectedStatus;
  final ValueChanged<String?> onStatusChanged;
  final String? selectedPriority;
  final ValueChanged<String?> onPriorityChanged;
  final String? selectedTechnician;
  final ValueChanged<String?> onTechnicianChanged;

  const ServiceFilterBar({
    super.key,
    required this.searchQuery,
    required this.onSearchChanged,
    this.selectedStatus,
    required this.onStatusChanged,
    this.selectedPriority,
    required this.onPriorityChanged,
    this.selectedTechnician,
    required this.onTechnicianChanged,
  });

  @override
  ConsumerState<ServiceFilterBar> createState() => _ServiceFilterBarState();
}

class _ServiceFilterBarState extends ConsumerState<ServiceFilterBar> {
  final TextEditingController _searchController = TextEditingController();
  bool _isFiltersExpanded = false;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.searchQuery;
    // Eğer bir filtre seçiliyse, başlangıçta genişletilmiş göster
    _isFiltersExpanded = widget.selectedStatus != null || 
                        widget.selectedPriority != null || 
                        widget.selectedTechnician != null;
  }

  @override
  void didUpdateWidget(ServiceFilterBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _searchController.text = widget.searchQuery;
    }
    // Filtre değiştiğinde genişletilmiş durumu güncelle
    if (widget.selectedStatus != oldWidget.selectedStatus ||
        widget.selectedPriority != oldWidget.selectedPriority ||
        widget.selectedTechnician != oldWidget.selectedTechnician) {
      _isFiltersExpanded = widget.selectedStatus != null || 
                          widget.selectedPriority != null || 
                          widget.selectedTechnician != null;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final techniciansAsync = ref.watch(techniciansProvider);
    final statusDisplayNames = ref.watch(serviceRequestStatusDisplayNamesProvider);
    final priorityDisplayNames = ref.watch(serviceRequestPriorityDisplayNamesProvider);
    final statuses = ref.watch(serviceRequestStatusesProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          // Arama çubuğu
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF2F2F7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Servis başlığı, numarası veya müşteri ile ara...',
                hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF8E8E93),
                  fontSize: 14,
                ),
                prefixIcon: const Icon(
                  CupertinoIcons.search,
                  color: Color(0xFFD32F2F),
                  size: 20,
                ),
                suffixIcon: widget.searchQuery.isNotEmpty
                    ? CupertinoButton(
                        onPressed: () {
                          _searchController.clear();
                          widget.onSearchChanged('');
                        },
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
              onChanged: widget.onSearchChanged,
            ),
          ),
          const SizedBox(height: 12),
          // Filtre butonu ve seçili filtreler
          Row(
            children: [
              // Filtre butonu
              CupertinoButton(
                onPressed: () {
                  setState(() {
                    _isFiltersExpanded = !_isFiltersExpanded;
                  });
                },
                padding: EdgeInsets.zero,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _isFiltersExpanded 
                        ? const Color(0xFFD32F2F).withOpacity(0.1)
                        : const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _isFiltersExpanded
                          ? const Color(0xFFD32F2F).withOpacity(0.3)
                          : Colors.transparent,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        CupertinoIcons.slider_horizontal_3,
                        size: 16,
                        color: _isFiltersExpanded 
                            ? const Color(0xFFD32F2F) 
                            : const Color(0xFF8E8E93),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Filtrele',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: _isFiltersExpanded ? FontWeight.w600 : FontWeight.normal,
                          color: _isFiltersExpanded 
                              ? const Color(0xFFD32F2F) 
                              : const Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        _isFiltersExpanded 
                            ? CupertinoIcons.chevron_up 
                            : CupertinoIcons.chevron_down,
                        size: 12,
                        color: _isFiltersExpanded 
                            ? const Color(0xFFD32F2F) 
                            : const Color(0xFF8E8E93),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Seçili filtreler - Yatay scroll
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Seçili durum chip'i
                      if (widget.selectedStatus != null)
                        _buildSelectedFilterChip(
                          context,
                          statusDisplayNames[widget.selectedStatus] ?? widget.selectedStatus!,
                          _getStatusColor(widget.selectedStatus!),
                          () => widget.onStatusChanged(null),
                        ),
                      // Seçili öncelik chip'i
                      if (widget.selectedPriority != null) ...[
                        if (widget.selectedStatus != null) const SizedBox(width: 8),
                        _buildSelectedFilterChip(
                          context,
                          priorityDisplayNames[widget.selectedPriority] ?? widget.selectedPriority!,
                          _getPriorityColor(widget.selectedPriority!),
                          () => widget.onPriorityChanged(null),
                        ),
                      ],
                      // Seçili teknisyen chip'i
                      techniciansAsync.when(
                        data: (technicians) {
                          if (widget.selectedTechnician == null || technicians.isEmpty) {
                            return const SizedBox.shrink();
                          }
                          final tech = technicians.firstWhere(
                            (t) => t['id'].toString() == widget.selectedTechnician,
                            orElse: () => {},
                          );
                          if (tech.isEmpty) return const SizedBox.shrink();
                          return Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (widget.selectedStatus != null || widget.selectedPriority != null)
                                const SizedBox(width: 8),
                              _buildSelectedFilterChip(
                                context,
                                '${tech['first_name']} ${tech['last_name']}',
                                const Color(0xFF8E8E93),
                                () => widget.onTechnicianChanged(null),
                              ),
                            ],
                          );
                        },
                        loading: () => const SizedBox.shrink(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Genişletilmiş filtre seçenekleri
          if (_isFiltersExpanded) ...[
            const SizedBox(height: 12),
            // Durum filtreleri
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Durum',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF8E8E93),
                    ),
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(
                        context,
                        'Tümü',
                        widget.selectedStatus == null,
                        null,
                        () => widget.onStatusChanged(null),
                      ),
                      const SizedBox(width: 8),
                      ...statuses.map((status) {
                        final isSelected = widget.selectedStatus == status;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _buildFilterChip(
                            context,
                            statusDisplayNames[status] ?? status,
                            isSelected,
                            _getStatusColor(status),
                            () => widget.onStatusChanged(isSelected ? null : status),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Öncelik filtreleri
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Öncelik',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF8E8E93),
                    ),
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(
                        context,
                        'Tümü',
                        widget.selectedPriority == null,
                        null,
                        () => widget.onPriorityChanged(null),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        context,
                        '🟢 ${priorityDisplayNames['low'] ?? 'Düşük'}',
                        widget.selectedPriority == 'low',
                        Colors.green,
                        () => widget.onPriorityChanged(widget.selectedPriority == 'low' ? null : 'low'),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        context,
                        '🟡 ${priorityDisplayNames['medium'] ?? 'Orta'}',
                        widget.selectedPriority == 'medium',
                        Colors.blue,
                        () => widget.onPriorityChanged(widget.selectedPriority == 'medium' ? null : 'medium'),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        context,
                        '🟠 ${priorityDisplayNames['high'] ?? 'Yüksek'}',
                        widget.selectedPriority == 'high',
                        Colors.orange,
                        () => widget.onPriorityChanged(widget.selectedPriority == 'high' ? null : 'high'),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        context,
                        '🔴 ${priorityDisplayNames['urgent'] ?? 'Acil'}',
                        widget.selectedPriority == 'urgent',
                        Colors.red,
                        () => widget.onPriorityChanged(widget.selectedPriority == 'urgent' ? null : 'urgent'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Teknisyen filtresi
            techniciansAsync.when(
              data: (technicians) {
                if (technicians.isEmpty) {
                  return const SizedBox.shrink();
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        'Teknisyen',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF8E8E93),
                        ),
                      ),
                    ),
                    _buildFilterDropdown(
                      context,
                      label: 'Teknisyen',
                      value: widget.selectedTechnician ?? 'all',
                      items: [
                        {'value': 'all', 'label': 'Tüm Teknisyenler', 'color': null},
                        ...technicians.map((tech) => {
                              'value': tech['id'].toString(),
                              'label': '${tech['first_name']} ${tech['last_name']}',
                              'color': null,
                            }),
                      ],
                      onChanged: (value) {
                        widget.onTechnicianChanged(value == 'all' ? null : value);
                      },
                      icon: CupertinoIcons.person,
                    ),
                  ],
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterDropdown(
    BuildContext context, {
    required String label,
    required String value,
    required List<Map<String, dynamic>> items,
    required ValueChanged<String> onChanged,
    required IconData icon,
  }) {
    final selectedItem = items.firstWhere(
      (item) => item['value'] == value,
      orElse: () => items.first,
    );
    final hasSelection = value != 'all';

    return Container(
      decoration: BoxDecoration(
        color: hasSelection
            ? const Color(0xFFD32F2F).withOpacity(0.1)
            : const Color(0xFFF2F2F7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasSelection
              ? const Color(0xFFD32F2F).withOpacity(0.3)
              : Colors.transparent,
          width: 1,
        ),
      ),
      child: PopupMenuButton<String>(
        onSelected: onChanged,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: hasSelection ? const Color(0xFFD32F2F) : const Color(0xFF8E8E93),
              ),
              const SizedBox(width: 6),
              Text(
                selectedItem['label'] as String,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: hasSelection ? FontWeight.w600 : FontWeight.normal,
                  color: hasSelection ? const Color(0xFFD32F2F) : const Color(0xFF000000),
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                CupertinoIcons.chevron_down,
                size: 12,
                color: hasSelection ? const Color(0xFFD32F2F) : const Color(0xFF8E8E93),
              ),
            ],
          ),
        ),
        itemBuilder: (context) => items.map((item) {
          final isSelected = item['value'] == value;
          return PopupMenuItem<String>(
            value: item['value'] as String,
            child: Row(
              children: [
                if (item['color'] != null)
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: item['color'] as Color,
                      shape: BoxShape.circle,
                    ),
                  )
                else
                  const SizedBox(width: 12),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item['label'] as String,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      color: isSelected ? const Color(0xFFD32F2F) : const Color(0xFF000000),
                    ),
                  ),
                ),
                if (isSelected)
                  const Icon(
                    CupertinoIcons.checkmark,
                    size: 16,
                    color: Color(0xFFD32F2F),
                  ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String label,
    bool isSelected,
    Color? color,
    VoidCallback onTap,
  ) {
    final chipColor = color ?? const Color(0xFF8E8E93);
    
    return CupertinoButton(
      onPressed: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? chipColor.withOpacity(0.15)
              : const Color(0xFFF2F2F7),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected 
                ? chipColor.withOpacity(0.5)
                : const Color(0xFFE5E5EA),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (color != null) ...[
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: chipColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected 
                    ? chipColor 
                    : const Color(0xFF000000),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectedFilterChip(
    BuildContext context,
    String label,
    Color color,
    VoidCallback onRemove,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.4),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: Icon(
              CupertinoIcons.xmark_circle_fill,
              size: 16,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'new':
        return Colors.blue;
      case 'assigned':
        return Colors.purple;
      case 'in_progress':
        return Colors.yellow.shade700;
      case 'on_hold':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.blue;
      case 'high':
        return Colors.orange;
      case 'urgent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

