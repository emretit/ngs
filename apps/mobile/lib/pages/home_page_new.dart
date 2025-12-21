import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/service_request_provider.dart';

class HomePageNew extends ConsumerWidget {
  const HomePageNew({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final serviceRequestsAsync = ref.watch(serviceRequestsProvider);
    
    return Container(
      color: const Color(0xFFF2F2F7),
      child: Column(
        children: [
          // Custom AppBar
          Container(
            color: const Color(0xFFF2F2F7),
            padding: const EdgeInsets.only(
              top: 44, // Status bar height
              left: 16,
              right: 16,
              bottom: 8,
            ),
            child: Row(
              children: [
                Text(
                  'PAFTA',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                CupertinoButton(
                  onPressed: () async {
                    await ref.read(authStateProvider.notifier).signOut();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                  child: const Icon(
                    CupertinoIcons.square_arrow_right,
                    color: Color(0xFFB73D3D),
                    size: 24,
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(serviceRequestsProvider);
              },
              color: const Color(0xFFB73D3D),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hoş geldin mesajı
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            spreadRadius: 0,
                            blurRadius: 12,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hoş geldiniz!',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF000000),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Bugün ${_getCurrentDate()}',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: const Color(0xFF8E8E93),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Hızlı İşlemler
                    Text(
                      'Hızlı İşlemler',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    Row(
                      children: [
                        Expanded(
                          child: _buildQuickActionCard(
                            context: context,
                            icon: CupertinoIcons.plus_circle_fill,
                            title: 'Yeni Talep',
                            subtitle: 'Servis talebi oluştur',
                            onTap: () => context.go('/service-requests/create'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildQuickActionCard(
                            context: context,
                            icon: CupertinoIcons.wrench_fill,
                            title: 'Taleplerim',
                            subtitle: 'Tüm talepleri gör',
                            onTap: () => context.go('/service-requests'),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Son Servis Talepleri
                    Text(
                      'Son Servis Talepleri',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    serviceRequestsAsync.when(
                      data: (serviceRequests) {
                        if (serviceRequests.isEmpty) {
                          return Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  spreadRadius: 0,
                                  blurRadius: 12,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Icon(
                                  CupertinoIcons.wrench,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Henüz servis talebi yok',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'İlk servis talebinizi oluşturun',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }
                        
                        return Column(
                          children: serviceRequests.take(3).map((request) {
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: _buildServiceRequestCard(context, request),
                            );
                          }).toList(),
                        );
                      },
                      loading: () => const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: CupertinoActivityIndicator(
                            color: Color(0xFFB73D3D),
                          ),
                        ),
                      ),
                      error: (error, stack) => Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              spreadRadius: 0,
                              blurRadius: 12,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Icon(
                              CupertinoIcons.exclamationmark_triangle,
                              size: 48,
                              color: Colors.red[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Hata oluştu',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.red[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Servis talepleri yüklenemedi',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return CupertinoButton(
      onPressed: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              spreadRadius: 0,
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: const Color(0xFFB73D3D),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFF8E8E93),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceRequestCard(BuildContext context, serviceRequest) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            spreadRadius: 0,
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  serviceRequest.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(serviceRequest.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getStatusText(serviceRequest.status),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: _getStatusColor(serviceRequest.status),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (serviceRequest.description != null) ...[
            const SizedBox(height: 8),
            Text(
              serviceRequest.description!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF8E8E93),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                CupertinoIcons.calendar,
                size: 16,
                color: const Color(0xFF8E8E93),
              ),
              const SizedBox(width: 4),
              Text(
                _formatDate(serviceRequest.createdAt),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF8E8E93),
                ),
              ),
              const Spacer(),
              CupertinoButton(
                onPressed: () => context.go('/service-requests/${serviceRequest.id}'),
                padding: EdgeInsets.zero,
                child: Text(
                  'Detay',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFFB73D3D),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getCurrentDate() {
    final now = DateTime.now();
    return '${now.day} ${_getMonthName(now.month)} ${now.year}';
  }

  String _getMonthName(int month) {
    const months = [
      '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[month];
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'new':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'new':
        return 'Yeni';
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
}
