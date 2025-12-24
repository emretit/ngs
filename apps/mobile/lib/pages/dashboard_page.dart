import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/activity_provider.dart';
import '../models/activity.dart';
import '../services/firebase_messaging_service.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseMessagingService.clearBadge();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final personalActivitiesAsync = ref.watch(personalActivitiesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
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
                CupertinoIcons.square_grid_2x2,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            const Text('PAFTA'),
          ],
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () => context.go('/notifications'),
            icon: const Icon(CupertinoIcons.bell, size: 22),
            color: const Color(0xFF8E8E93),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider);
          ref.invalidate(personalActivitiesProvider);
        },
        color: const Color(0xFFB73D3D),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              // Header Gradient Background
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFB73D3D), Color(0xFF8B2F2F)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    // Welcome Section
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                                width: 1.5,
                              ),
                            ),
                            child: const Icon(
                              CupertinoIcons.person_fill,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hoş geldiniz,',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  authState.user?.fullName ?? authState.user?.email?.split('@')[0] ?? 'Kullanıcı',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: -0.5,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Stats Cards Compact
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: statsAsync.when(
                        data: (stats) => _buildCompactStats(stats),
                        loading: () => _buildLoadingStats(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Main Content
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Bugünkü Görevlerim
                    _buildPersonalSection(
                      'Bugünkü Görevlerim',
                      CupertinoIcons.check_mark_circled,
                      const Color(0xFF3B82F6),
                      () => context.go('/crm'),
                    ),
                    const SizedBox(height: 12),
                    personalActivitiesAsync.when(
                      data: (activities) {
                        final today = DateTime.now();
                        final todayActivities = activities.where((a) {
                          if (a.dueDate == null) return false;
                          return a.dueDate!.day == today.day &&
                              a.dueDate!.month == today.month &&
                              a.dueDate!.year == today.year &&
                              a.status != 'completed';
                        }).toList();
                        return _buildMyTasks(todayActivities);
                      },
                      loading: () => _buildLoadingTasks(),
                      error: (_, __) => _buildEmptyTasksState(),
                    ),
                    const SizedBox(height: 24),

                    // Bekleyen Onaylarım
                    _buildPersonalSection(
                      'Bekleyen Onaylarım',
                      CupertinoIcons.checkmark_seal,
                      const Color(0xFFFF9500),
                      null,
                    ),
                    const SizedBox(height: 12),
                    statsAsync.when(
                      data: (stats) => _buildPendingApprovals(stats),
                      loading: () => _buildLoadingApprovals(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 24),

                    // Hızlı İşlemler
                    _buildQuickActions(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Kompakt İstatistik Kartları
  Widget _buildCompactStats(Map<String, dynamic> stats) {
    return Row(
      children: [
        Expanded(
          child: _buildStatBubble(
            '${stats['todayActivitiesCount'] ?? 0}',
            'Bugün',
            CupertinoIcons.calendar_today,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['pendingApprovalsCount'] ?? 0}',
            'Onay',
            CupertinoIcons.checkmark_seal,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['overdueActivitiesCount'] ?? 0}',
            'Geciken',
            CupertinoIcons.exclamationmark_triangle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['completedActivitiesCount'] ?? 0}',
            'Bitti',
            CupertinoIcons.checkmark_circle,
          ),
        ),
      ],
    );
  }

  Widget _buildStatBubble(String value, String label, IconData icon) {
    return AspectRatio(
      aspectRatio: 1.0,
      child: Container(
        padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
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
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
                fontSize: 9,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        ),
      ),
    );
  }

  // Kişisel Bölüm Başlığı
  Widget _buildPersonalSection(String title, IconData icon, Color color, VoidCallback? onViewAll) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color, color.withValues(alpha: 0.7)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF000000),
              letterSpacing: -0.5,
            ),
          ),
        ),
        if (onViewAll != null)
          CupertinoButton(
            onPressed: onViewAll,
            padding: EdgeInsets.zero,
            minSize: 0,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Tümü',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                const SizedBox(width: 2),
                Icon(
                  CupertinoIcons.chevron_right,
                  size: 14,
                  color: color,
                ),
              ],
            ),
          ),
      ],
    );
  }

  // Bugünkü Görevlerim
  Widget _buildMyTasks(List<Activity> activities) {
    if (activities.isEmpty) {
      return _buildEmptyTasksState();
    }

    final displayActivities = activities.take(3).toList();
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: displayActivities.length,
      itemBuilder: (context, index) => _buildTaskCard(displayActivities[index]),
    );
  }

  Widget _buildTaskCard(Activity activity) {
    Color priorityColor;
    String priorityLabel;
    switch (activity.priority) {
      case 'high':
      case 'urgent':
        priorityColor = const Color(0xFFEF4444);
        priorityLabel = 'Acil';
        break;
      case 'medium':
        priorityColor = const Color(0xFFFF9500);
        priorityLabel = 'Orta';
        break;
      default:
        priorityColor = const Color(0xFF10B981);
        priorityLabel = 'Normal';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey.withValues(alpha: 0.1),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/activities/${activity.id}/edit'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Checkbox
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: activity.status == 'completed'
                          ? const Color(0xFF10B981)
                          : priorityColor.withValues(alpha:0.3),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(6),
                    color: activity.status == 'completed'
                        ? const Color(0xFF10B981)
                        : Colors.transparent,
                  ),
                  child: activity.status == 'completed'
                      ? const Icon(
                          CupertinoIcons.checkmark,
                          size: 16,
                          color: Colors.white,
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activity.title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: activity.status == 'completed'
                              ? Colors.grey[400]
                              : const Color(0xFF000000),
                          decoration: activity.status == 'completed'
                              ? TextDecoration.lineThrough
                              : null,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (activity.dueDate != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              CupertinoIcons.clock,
                              size: 12,
                              color: activity.isOverdue
                                  ? const Color(0xFFEF4444)
                                  : Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTime(activity.dueDate!),
                              style: TextStyle(
                                fontSize: 11,
                                color: activity.isOverdue
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFF8E8E93),
                                fontWeight: activity.isOverdue
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
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha:0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    priorityLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: priorityColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Bekleyen Onaylarım
  Widget _buildPendingApprovals(Map<String, dynamic> stats) {
    final pendingCount = stats['pendingApprovalsCount'] ?? 0;

    if (pendingCount == 0) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF10B981).withValues(alpha:0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF10B981).withValues(alpha:0.2),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha:0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                CupertinoIcons.checkmark_circle_fill,
                color: Color(0xFF10B981),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Harika! Bekleyen onayınız yok',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF10B981),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFF9500).withValues(alpha:0.1),
            const Color(0xFFFF9500).withValues(alpha:0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFFF9500).withValues(alpha:0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFF9500).withValues(alpha:0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              CupertinoIcons.exclamationmark_circle_fill,
              color: Color(0xFFFF9500),
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$pendingCount Bekleyen Onay',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'İşlemlerinizi tamamlayın',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF8E8E93),
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            CupertinoIcons.chevron_right,
            color: Color(0xFFFF9500),
            size: 18,
          ),
        ],
      ),
    );
  }

  // Hızlı İşlemler - Küçük Butonlar
  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
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
                CupertinoIcons.add_circled_solid,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'Hızlı İşlemler',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF000000),
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionButton(
                'Yeni Servis',
                CupertinoIcons.wrench,
                const Color(0xFFB73D3D),
                () => context.go('/service/new'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                'Yeni Aktivite',
                CupertinoIcons.calendar_badge_plus,
                const Color(0xFF3B82F6),
                () => context.go('/activities/new'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionButton(
                'Yeni Fırsat',
                CupertinoIcons.star,
                const Color(0xFF9333EA),
                () => context.go('/sales/opportunities/new'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                'Tüm Modüller',
                CupertinoIcons.square_grid_2x2,
                const Color(0xFF8E8E93),
                () => context.go('/modules'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: color.withValues(alpha:0.2),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha:0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Loading ve Empty States
  Widget _buildEmptyTasksState() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withValues(alpha:0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF10B981).withValues(alpha:0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha:0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              CupertinoIcons.checkmark_circle_fill,
              color: Color(0xFF10B981),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Tebrikler, göreviniz yok',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF10B981),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingTasks() {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          height: 70,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: const Center(
            child: CupertinoActivityIndicator(),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingApprovals() {
    return Container(
      height: 80,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: const Center(
        child: CupertinoActivityIndicator(),
      ),
    );
  }

  // Boş Durum
  Widget _buildEmptyState(String message, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: Colors.grey[400]),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Loading States
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
              color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
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

  Widget _buildLoadingActivities() {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          height: 60,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: const Center(
            child: CupertinoActivityIndicator(),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final activityDate = DateTime(date.year, date.month, date.day);

    if (activityDate == today) {
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (activityDate == today.add(const Duration(days: 1))) {
      return 'Yarın';
    } else if (activityDate.isBefore(today)) {
      return 'Gecikti';
    } else {
      return '${date.day}/${date.month}';
    }
  }
}
