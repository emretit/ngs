import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/service_request_provider.dart';

/// Service Page Header Widget - Dashboard ile aynı tasarım dili
class ServicePageHeader extends ConsumerWidget {
  const ServicePageHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(serviceRequestStatsProvider);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFB73D3D), Color(0xFF8B2F2F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          // Header Content
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
                    CupertinoIcons.wrench_fill,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Servis Yönetimi',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 1),
                      Text(
                        'Tüm servis taleplerinizi yönetin',
                        style: const TextStyle(
                          color: Color(0xE6FFFFFF), // white.withOpacity(0.9)
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                CupertinoButton(
                  onPressed: () => context.go('/service/new'),
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
                        Icon(
                          CupertinoIcons.add,
                          color: Colors.white,
                          size: 16,
                        ),
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
            child: statsAsync.when(
              data: (stats) => _buildCompactStats(stats),
              loading: () => _buildLoadingStats(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactStats(Map<String, int> stats) {
    return Row(
      children: [
        Expanded(
          child: _buildStatBubble(
            '${stats['new'] ?? 0}',
            'Yeni',
            CupertinoIcons.circle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['in_progress'] ?? 0}',
            'Devam',
            CupertinoIcons.clock,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['completed'] ?? 0}',
            'Bitti',
            CupertinoIcons.checkmark_circle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatBubble(
            '${stats['cancelled'] ?? 0}',
            'İptal',
            CupertinoIcons.xmark_circle,
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
}
