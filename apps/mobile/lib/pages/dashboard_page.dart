import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
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
    final todayActivitiesAsync = ref.watch(todayActivitiesProvider);

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
          ref.invalidate(todayActivitiesProvider);
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
                              color: Colors.white.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
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
                                    color: Colors.white.withOpacity(0.9),
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
                    // Quick Actions Grid - Kompakt
                    _buildQuickActionsGrid(),
                    const SizedBox(height: 20),
                    
                    // Today's Activities - Kompakt
                    _buildSectionHeader('Bugünkü Aktiviteler', () => context.go('/activities')),
                    const SizedBox(height: 12),
                    todayActivitiesAsync.when(
                      data: (activities) => _buildActivitiesCompact(activities),
                      loading: () => _buildLoadingActivities(),
                      error: (_, __) => _buildEmptyState('Aktiviteler yüklenemedi', CupertinoIcons.exclamationmark_triangle),
                    ),
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

  // Hızlı Aksiyonlar Grid - Daha Kompakt
  Widget _buildQuickActionsGrid() {
    final actions = [
      _QuickAction('CRM', CupertinoIcons.chart_bar_alt_fill, const Color(0xFF3B82F6), '/crm'),
      _QuickAction('Müşteriler', CupertinoIcons.person_2_fill, const Color(0xFF10B981), '/customers'),
      _QuickAction('Servis', CupertinoIcons.wrench_fill, const Color(0xFFB73D3D), '/service/management'),
      _QuickAction('Fırsatlar', CupertinoIcons.star_fill, const Color(0xFFF59E0B), '/sales/opportunities'),
      _QuickAction('Teklifler', CupertinoIcons.doc_fill, const Color(0xFF8B5CF6), '/sales/proposals'),
      _QuickAction('Finans', CupertinoIcons.money_dollar_circle_fill, const Color(0xFF06B6D4), '/finance'),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.0,
      ),
      itemCount: actions.length,
      itemBuilder: (context, index) {
        final action = actions[index];
        return _buildQuickActionCard(action);
      },
    );
  }

  Widget _buildQuickActionCard(_QuickAction action) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go(action.route),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: action.color.withOpacity(0.15),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: action.color.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      action.color.withOpacity(0.15),
                      action.color.withOpacity(0.08),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(action.icon, color: action.color, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                action.label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF000000),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Bölüm Başlığı
  Widget _buildSectionHeader(String title, VoidCallback? onViewAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF000000),
            letterSpacing: -0.5,
          ),
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Tümünü Gör',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFB73D3D),
                  ),
                ),
                const SizedBox(width: 2),
                Icon(
                  CupertinoIcons.chevron_right,
                  size: 14,
                  color: const Color(0xFFB73D3D),
                ),
              ],
            ),
          ),
      ],
    );
  }

  // Kompakt Aktiviteler
  Widget _buildActivitiesCompact(List<Activity> activities) {
    if (activities.isEmpty) {
      return _buildEmptyState('Bugün için aktivite yok', CupertinoIcons.checkmark_alt_circle);
    }

    return Column(
      children: activities.take(4).map((activity) => _buildActivityItemCompact(activity)).toList(),
    );
  }

  Widget _buildActivityItemCompact(Activity activity) {
    Color priorityColor;
    switch (activity.priority) {
      case 'high':
      case 'urgent':
        priorityColor = const Color(0xFFEF4444);
        break;
      case 'medium':
        priorityColor = const Color(0xFFF59E0B);
        break;
      default:
        priorityColor = const Color(0xFF10B981);
    }

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
          onTap: () => context.go('/activities/${activity.id}/edit'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 40,
                  decoration: BoxDecoration(
                    color: priorityColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activity.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (activity.description != null) ...[
                        const SizedBox(height: 2),
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
                    ],
                  ),
                ),
                if (activity.dueDate != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: activity.isOverdue 
                          ? const Color(0xFFEF4444).withOpacity(0.1)
                          : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          CupertinoIcons.clock,
                          size: 12,
                          color: activity.isOverdue ? const Color(0xFFEF4444) : const Color(0xFF8E8E93),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatTime(activity.dueDate!),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: activity.isOverdue ? const Color(0xFFEF4444) : const Color(0xFF8E8E93),
                          ),
                        ),
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
            border: Border.all(color: Colors.grey.withOpacity(0.1)),
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

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final String route;

  _QuickAction(this.label, this.icon, this.color, this.route);
}
