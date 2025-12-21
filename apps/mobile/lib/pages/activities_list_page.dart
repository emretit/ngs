import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/activity.dart';
import '../providers/activity_provider.dart';
import '../providers/auth_provider.dart';
import '../services/activity_service.dart';
import '../shared/widgets/activity_page_header.dart';
import '../shared/widgets/activity_filter_bar.dart';

class ActivitiesListPage extends ConsumerStatefulWidget {
  const ActivitiesListPage({super.key});

  @override
  ConsumerState<ActivitiesListPage> createState() => _ActivitiesListPageState();
}

class _ActivitiesListPageState extends ConsumerState<ActivitiesListPage> {
  String _searchQuery = '';
  bool _showCompleted = false;
  String? _selectedStatus;
  String? _selectedPriority;
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _newActivityController = TextEditingController();
  final FocusNode _newActivityFocusNode = FocusNode();
  bool _isAddingActivity = false;

  @override
  void dispose() {
    _searchController.dispose();
    _newActivityController.dispose();
    _newActivityFocusNode.dispose();
    super.dispose();
  }

  // Tarih gruplarına göre aktiviteleri ayır
  Map<String, List<Activity>> _groupActivitiesByDate(List<Activity> activities) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final nextWeek = today.add(const Duration(days: 7));

    final Map<String, List<Activity>> grouped = {
      'Bugün': [],
      'Yarın': [],
      'Bu Hafta': [],
      'Gelecek': [],
      'Geçmiş': [],
      'Tarih Yok': [],
    };

    for (var activity in activities) {
      if (activity.status == 'completed' && !_showCompleted) continue;

      if (activity.dueDate == null) {
        grouped['Tarih Yok']!.add(activity);
      } else {
        final dueDate = DateTime(
          activity.dueDate!.year,
          activity.dueDate!.month,
          activity.dueDate!.day,
        );

        if (dueDate == today) {
          grouped['Bugün']!.add(activity);
        } else if (dueDate == tomorrow) {
          grouped['Yarın']!.add(activity);
        } else if (dueDate.isBefore(today)) {
          grouped['Geçmiş']!.add(activity);
        } else if (dueDate.isBefore(nextWeek)) {
          grouped['Bu Hafta']!.add(activity);
        } else {
          grouped['Gelecek']!.add(activity);
        }
      }
    }

    // Boş grupları kaldır
    grouped.removeWhere((key, value) => value.isEmpty);
    return grouped;
  }

  Future<void> _toggleActivityCompletion(Activity activity) async {
    try {
      final activityService = ref.read(activityServiceProvider);
      final newStatus = activity.status == 'completed' ? 'todo' : 'completed';
      
      await activityService.updateActivityStatus(
        id: activity.id,
        status: newStatus,
      );
      
      ref.invalidate(activitiesProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _deleteActivity(Activity activity) async {
    try {
      final activityService = ref.read(activityServiceProvider);
      await activityService.deleteActivity(activity.id);
      ref.invalidate(activitiesProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Aktivite silindi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _addActivity() async {
    final title = _newActivityController.text.trim();
    if (title.isEmpty) return;

    try {
      final activityService = ref.read(activityServiceProvider);
      final authState = ref.read(authStateProvider);
      
      await activityService.createActivity(
        title: title,
        companyId: authState.user?.companyId,
        userId: authState.user?.id,
      );
      
      _newActivityController.clear();
      _newActivityFocusNode.unfocus();
      setState(() {
        _isAddingActivity = false;
      });
      
      ref.invalidate(activitiesProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activitiesAsync = ref.watch(activitiesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(activitiesProvider);
          },
          child: CustomScrollView(
            slivers: [
              // Activity Page Header
              const SliverToBoxAdapter(
                child: ActivityPageHeader(),
              ),
              
              // Filter Bar
              SliverToBoxAdapter(
                child: ActivityFilterBar(
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
                ),
              ),
              
              // Hızlı aktivite ekleme
              SliverToBoxAdapter(
                child: AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        if (!_isAddingActivity)
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _isAddingActivity = true;
                                });
                                Future.delayed(const Duration(milliseconds: 100), () {
                                  _newActivityFocusNode.requestFocus();
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF2F2F7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      CupertinoIcons.add_circled,
                                      color: Colors.grey[600],
                                      size: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Yeni aktivite ekle...',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        else
                          Expanded(
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _newActivityController,
                                    focusNode: _newActivityFocusNode,
                                    autofocus: true,
                                    decoration: InputDecoration(
                                      hintText: 'Aktivite başlığı...',
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 12,
                                      ),
                                    ),
                                    onSubmitted: (_) => _addActivity(),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(CupertinoIcons.checkmark_circle_fill),
                                  color: const Color(0xFF007AFF),
                                  onPressed: _addActivity,
                                ),
                                IconButton(
                                  icon: const Icon(CupertinoIcons.xmark_circle),
                                  color: Colors.grey,
                                  onPressed: () {
                                    setState(() {
                                      _isAddingActivity = false;
                                      _newActivityController.clear();
                                    });
                                    _newActivityFocusNode.unfocus();
                                  },
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Aktiviteler listesi
              activitiesAsync.when(
                data: (activities) {
                  // Filtreleme
                  List<Activity> filteredActivities = activities;

                  // Durum filtresi
                  if (_selectedStatus != null) {
                    filteredActivities = filteredActivities
                        .where((activity) => activity.status == _selectedStatus)
                        .toList();
                  }

                  // Öncelik filtresi
                  if (_selectedPriority != null) {
                    filteredActivities = filteredActivities
                        .where((activity) => activity.priority == _selectedPriority)
                        .toList();
                  }

                  // Tamamlananları gizle/göster
                  if (!_showCompleted) {
                    filteredActivities = filteredActivities
                        .where((activity) => activity.status != 'completed')
                        .toList();
                  }

                  // Arama filtresi
                  if (_searchQuery.isNotEmpty) {
                    filteredActivities = filteredActivities
                        .where((activity) =>
                            activity.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                            (activity.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false))
                        .toList();
                  }

                  // Tarih gruplarına ayır
                  final grouped = _groupActivitiesByDate(filteredActivities);

                  if (grouped.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              CupertinoIcons.checkmark_circle,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _hasActiveFilters()
                                  ? 'Arama kriterlerinize uygun aktivite bulunamadı'
                                  : 'Henüz aktivite bulunmuyor',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  // SliverList ile grupları göster
                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final groupName = grouped.keys.elementAt(index);
                        final groupActivities = grouped[groupName]!;
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Grup başlığı
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: Text(
                                groupName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF8E8E93),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            // Grup aktiviteleri
                            ...groupActivities.map((activity) {
                              return AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                                child: _buildActivityItem(activity),
                              );
                            }),
                          ],
                        );
                      },
                      childCount: grouped.length,
                    ),
                  );
                },
                loading: () => SliverFillRemaining(
                  hasScrollBody: false,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                error: (error, stack) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Aktiviteler yüklenirken hata oluştu',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.red[600],
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            ref.invalidate(activitiesProvider);
                          },
                          child: const Text('Tekrar Dene'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _hasActiveFilters() {
    return _searchQuery.isNotEmpty ||
        _selectedStatus != null ||
        _selectedPriority != null;
  }

  Widget _buildActivityItem(Activity activity) {
    final isCompleted = activity.status == 'completed';
    final priorityColor = _getPriorityColor(activity.priority);

    return Dismissible(
      key: Key(activity.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(
          CupertinoIcons.delete,
          color: Colors.white,
          size: 28,
        ),
      ),
      onDismissed: (direction) {
        _deleteActivity(activity);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white,
              priorityColor.withOpacity(0.02),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: priorityColor.withOpacity(0.1),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: priorityColor.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              context.push('/activities/${activity.id}/edit');
            },
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Checkbox
                  GestureDetector(
                    onTap: () => _toggleActivityCompletion(activity),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isCompleted
                              ? const Color(0xFF34C759)
                              : const Color(0xFF8E8E93),
                          width: 2,
                        ),
                        color: isCompleted ? const Color(0xFF34C759) : Colors.transparent,
                      ),
                      child: isCompleted
                          ? const Icon(
                              CupertinoIcons.checkmark,
                              size: 16,
                              color: Colors.white,
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Aktivite içeriği
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 200),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: isCompleted
                                ? const Color(0xFF8E8E93)
                                : const Color(0xFF1A1A1A),
                            decoration: isCompleted
                                ? TextDecoration.lineThrough
                                : TextDecoration.none,
                          ),
                          child: Text(activity.title),
                        ),
                        if (activity.description != null &&
                            activity.description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              fontSize: 14,
                              color: isCompleted
                                  ? const Color(0xFF8E8E93)
                                  : const Color(0xFF8E8E93),
                              decoration: isCompleted
                                  ? TextDecoration.lineThrough
                                  : TextDecoration.none,
                            ),
                            child: Text(
                              activity.description!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                        if (activity.dueDate != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(
                                CupertinoIcons.calendar,
                                size: 14,
                                color: activity.isOverdue && !isCompleted
                                    ? Colors.red
                                    : const Color(0xFF8E8E93),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _formatDate(activity.dueDate!),
                                style: TextStyle(
                                  fontSize: 13,
                                  color: activity.isOverdue && !isCompleted
                                      ? Colors.red
                                      : const Color(0xFF8E8E93),
                                  fontWeight: activity.isOverdue && !isCompleted
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Öncelik göstergesi
                  if (activity.priority != 'medium' && !isCompleted)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 4,
                      height: 40,
                      decoration: BoxDecoration(
                        color: priorityColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    
    if (dateOnly == today) {
      return 'Bugün';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      return 'Yarın';
    } else if (dateOnly == today.subtract(const Duration(days: 1))) {
      return 'Dün';
    } else {
      return DateFormat('d MMMM yyyy', 'tr_TR').format(date);
    }
  }
}
