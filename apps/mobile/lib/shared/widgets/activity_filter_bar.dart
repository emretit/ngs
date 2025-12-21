import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/activity_provider.dart';

/// Activity Filter Bar Widget
/// ServiceFilterBar'a benzer yapı - durum ve öncelik filtreleri
class ActivityFilterBar extends ConsumerStatefulWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final String? selectedStatus;
  final ValueChanged<String?> onStatusChanged;
  final String? selectedPriority;
  final ValueChanged<String?> onPriorityChanged;

  const ActivityFilterBar({
    super.key,
    required this.searchQuery,
    required this.onSearchChanged,
    this.selectedStatus,
    required this.onStatusChanged,
    this.selectedPriority,
    required this.onPriorityChanged,
  });

  @override
  ConsumerState<ActivityFilterBar> createState() => _ActivityFilterBarState();
}

class _ActivityFilterBarState extends ConsumerState<ActivityFilterBar> {
  final TextEditingController _searchController = TextEditingController();
  bool _isFiltersExpanded = false;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.searchQuery;
    _isFiltersExpanded = widget.selectedStatus != null || widget.selectedPriority != null;
  }

  @override
  void didUpdateWidget(ActivityFilterBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _searchController.text = widget.searchQuery;
    }
    if (widget.selectedStatus != oldWidget.selectedStatus ||
        widget.selectedPriority != oldWidget.selectedPriority) {
      _isFiltersExpanded = widget.selectedStatus != null || widget.selectedPriority != null;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final statusDisplayNames = ref.watch(activityStatusDisplayNamesProvider);
    final priorityDisplayNames = ref.watch(activityPriorityDisplayNamesProvider);
    final statuses = ref.watch(activityStatusesProvider);

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
                hintText: 'Aktivite ara...',
                hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF8E8E93),
                  fontSize: 14,
                ),
                prefixIcon: const Icon(
                  CupertinoIcons.search,
                  color: Color(0xFF007AFF),
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
                        ? const Color(0xFF007AFF).withOpacity(0.1)
                        : const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _isFiltersExpanded
                          ? const Color(0xFF007AFF).withOpacity(0.3)
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
                            ? const Color(0xFF007AFF) 
                            : const Color(0xFF8E8E93),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Filtrele',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: _isFiltersExpanded ? FontWeight.w600 : FontWeight.normal,
                          color: _isFiltersExpanded 
                              ? const Color(0xFF007AFF) 
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
                            ? const Color(0xFF007AFF) 
                            : const Color(0xFF8E8E93),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Seçili filtreler
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (widget.selectedStatus != null)
                        _buildSelectedFilterChip(
                          statusDisplayNames[widget.selectedStatus] ?? widget.selectedStatus!,
                          _getStatusColor(widget.selectedStatus!),
                          () => widget.onStatusChanged(null),
                        ),
                      if (widget.selectedPriority != null) ...[
                        if (widget.selectedStatus != null) const SizedBox(width: 8),
                        _buildSelectedFilterChip(
                          priorityDisplayNames[widget.selectedPriority] ?? widget.selectedPriority!,
                          _getPriorityColor(widget.selectedPriority!),
                          () => widget.onPriorityChanged(null),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Genişletilmiş filtreler
          if (_isFiltersExpanded) ...[
            const SizedBox(height: 12),
            // Durum filtreleri
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Durum',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildFilterChip(
                      'Tümü',
                      null,
                      widget.selectedStatus == null,
                      () => widget.onStatusChanged(null),
                    ),
                    ...statuses.map((status) => _buildFilterChip(
                      statusDisplayNames[status] ?? status,
                      status,
                      widget.selectedStatus == status,
                      () => widget.onStatusChanged(
                        widget.selectedStatus == status ? null : status,
                      ),
                    )),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Öncelik filtreleri
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Öncelik',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildFilterChip(
                      'Tümü',
                      null,
                      widget.selectedPriority == null,
                      () => widget.onPriorityChanged(null),
                    ),
                    _buildFilterChip(
                      priorityDisplayNames['low'] ?? 'Düşük',
                      'low',
                      widget.selectedPriority == 'low',
                      () => widget.onPriorityChanged(
                        widget.selectedPriority == 'low' ? null : 'low',
                      ),
                    ),
                    _buildFilterChip(
                      priorityDisplayNames['medium'] ?? 'Orta',
                      'medium',
                      widget.selectedPriority == 'medium',
                      () => widget.onPriorityChanged(
                        widget.selectedPriority == 'medium' ? null : 'medium',
                      ),
                    ),
                    _buildFilterChip(
                      priorityDisplayNames['high'] ?? 'Yüksek',
                      'high',
                      widget.selectedPriority == 'high',
                      () => widget.onPriorityChanged(
                        widget.selectedPriority == 'high' ? null : 'high',
                      ),
                    ),
                    _buildFilterChip(
                      priorityDisplayNames['urgent'] ?? 'Acil',
                      'urgent',
                      widget.selectedPriority == 'urgent',
                      () => widget.onPriorityChanged(
                        widget.selectedPriority == 'urgent' ? null : 'urgent',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    String? value,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return CupertinoButton(
      onPressed: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFF2F2F7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isSelected ? Colors.white : const Color(0xFF8E8E93),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedFilterChip(
    String label,
    Color color,
    VoidCallback onRemove,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(width: 6),
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
    final statusColors = ref.read(activityStatusColorsProvider);
    final colorName = statusColors[status] ?? 'blue';
    return _getColorFromName(colorName);
  }

  Color _getPriorityColor(String priority) {
    final priorityColors = ref.read(activityPriorityColorsProvider);
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
}

