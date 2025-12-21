import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/service_request_provider.dart';

/// Service Stats Cards Widget
/// Web app'teki ServiceStatsCards.tsx'e benzer yapı
class ServiceStatsCards extends ConsumerWidget {
  const ServiceStatsCards({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(serviceRequestStatsProvider);
    final serviceRequestsAsync = ref.watch(serviceRequestsProvider);

    return statsAsync.when(
      data: (stats) {
        return serviceRequestsAsync.when(
          data: (serviceRequests) {
            // Toplam, yeni, devam eden, tamamlanan, acil, atanmamış sayılarını hesapla
            final total = serviceRequests.length;
            final newCount = stats['new'] ?? 0;
            final inProgress = stats['in_progress'] ?? 0;
            final completed = stats['completed'] ?? 0;
            final urgent = serviceRequests.where((r) => r.priority == 'urgent').length;
            final unassigned = serviceRequests.where((r) => r.assignedTechnician == null || r.assignedTechnician!.isEmpty).length;

            return _buildStatsGrid(
              context,
              total: total,
              newCount: newCount,
              inProgress: inProgress,
              completed: completed,
              urgent: urgent,
              unassigned: unassigned,
            );
          },
          loading: () => _buildLoadingStats(),
          error: (_, __) => const SizedBox.shrink(),
        );
      },
      loading: () => _buildLoadingStats(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildStatsGrid(
    BuildContext context, {
    required int total,
    required int newCount,
    required int inProgress,
    required int completed,
    required int urgent,
    required int unassigned,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Genel Bakış',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 12),
          // İlk satır - 3 kart
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Toplam',
                  value: total.toString(),
                  icon: CupertinoIcons.calendar,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDBEAFE), Color(0xFFBFDBFE)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF1E40AF),
                  textColor: const Color(0xFF1E3A8A),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Yeni',
                  value: newCount.toString(),
                  icon: CupertinoIcons.exclamationmark_circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF92400E),
                  textColor: const Color(0xFF78350F),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Devam Ediyor',
                  value: inProgress.toString(),
                  icon: CupertinoIcons.clock,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDBEAFE), Color(0xFFBFDBFE)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF1E40AF),
                  textColor: const Color(0xFF1E3A8A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // İkinci satır - 3 kart
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Tamamlandı',
                  value: completed.toString(),
                  icon: CupertinoIcons.checkmark_circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFD1FAE5), Color(0xFFA7F3D0)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF065F46),
                  textColor: const Color(0xFF047857),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Acil',
                  value: urgent.toString(),
                  icon: CupertinoIcons.exclamationmark_triangle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFEE2E2), Color(0xFFFECACA)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF991B1B),
                  textColor: const Color(0xFFDC2626),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Atanmamış',
                  value: unassigned.toString(),
                  icon: CupertinoIcons.person,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFED7AA), Color(0xFFFDBA74)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  iconColor: const Color(0xFF9A3412),
                  textColor: const Color(0xFFEA580C),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Gradient gradient,
    required Color iconColor,
    required Color textColor,
  }) {
    return AspectRatio(
      aspectRatio: 1.0,
      child: Container(
        padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        gradient: gradient,
          borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: iconColor.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
              padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.5),
                borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                size: 16,
              ),
            ),
            const SizedBox(height: 6),
              Text(
                value,
                style: TextStyle(
                fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                  letterSpacing: -0.5,
                ),
              ),
            const SizedBox(height: 4),
          Text(
            title,
              textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 10,
              fontWeight: FontWeight.w500,
              color: textColor.withOpacity(0.8),
            ),
          ),
        ],
        ),
      ),
    );
  }

  Widget _buildLoadingStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: List.generate(3, (index) => Expanded(
          child: AspectRatio(
            aspectRatio: 1.0,
          child: Container(
            margin: EdgeInsets.only(right: index < 2 ? 12 : 0),
            decoration: BoxDecoration(
              color: Colors.grey[200],
                borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: CupertinoActivityIndicator(),
              ),
            ),
          ),
        )),
      ),
    );
  }
}

