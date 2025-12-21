import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/activity_provider.dart';

/// Activity Page Header Widget
/// ServicePageHeader'a benzer yapı - istatistikler ve başlık içerir
class ActivityPageHeader extends ConsumerWidget {
  const ActivityPageHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(activitiesProvider);

    return activitiesAsync.when(
      data: (activities) {
        final totalActivities = activities.length;
        final completedActivities = activities.where((a) => a.status == 'completed').length;
        final todayActivities = activities.where((a) {
          if (a.dueDate == null || a.status == 'completed') return false;
          final today = DateTime.now();
          return a.dueDate!.year == today.year &&
                 a.dueDate!.month == today.month &&
                 a.dueDate!.day == today.day;
        }).length;
        final overdueActivities = activities.where((a) => a.isOverdue).length;

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Başlık ve Yeni Aktivite Butonu
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF007AFF), Color(0xFF0051D5)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF007AFF).withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      CupertinoIcons.checkmark_square,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Aktivitelerim',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Tüm aktivitelerinizi yönetin ve takip edin',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontSize: 12,
                            color: const Color(0xFF8E8E93),
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    onPressed: () => context.push('/activities/new'),
                    padding: EdgeInsets.zero,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD32F2F), Color(0xFFB71C1C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD32F2F).withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            CupertinoIcons.add,
                            color: Colors.white,
                            size: 18,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'Yeni',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // İstatistik kartları
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Toplam',
                      totalActivities.toString(),
                      const Color(0xFF007AFF),
                      CupertinoIcons.list_bullet,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Bugün',
                      todayActivities.toString(),
                      const Color(0xFFFF9500),
                      CupertinoIcons.calendar,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Tamamlanan',
                      completedActivities.toString(),
                      const Color(0xFF34C759),
                      CupertinoIcons.checkmark_circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Gecikmiş',
                      overdueActivities.toString(),
                      const Color(0xFFFF3B30),
                      CupertinoIcons.exclamationmark_triangle,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
      loading: () => Container(
        padding: const EdgeInsets.all(16),
        height: 120,
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

