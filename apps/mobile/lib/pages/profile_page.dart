import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/company_provider.dart';
import '../providers/activity_provider.dart' as activity_providers;
import '../providers/customer_provider.dart';
import '../providers/supplier_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/service_request_provider.dart';
import '../providers/profile_provider.dart';
import '../services/company_service.dart';
import '../services/activity_service.dart';
import '../utils/responsive.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _handleSwitchCompany(String companyId) async {
    final authState = ref.read(authStateProvider);
    final userId = authState.user?.id;
    final currentCompanyId = authState.user?.companyId;
    final profileNotifier = ref.read(profileStateProvider.notifier);

    if (userId == null) return;
    if (companyId == currentCompanyId) {
      profileNotifier.setShowCompanySwitcher(false);
      return;
    }

    profileNotifier.setIsSwitching(true);
    try {
      final service = ref.read(companyServiceProvider);
      await service.switchCompany(userId, companyId);
      
      // Auth state'i yenile
      await ref.read(authStateProvider.notifier).refreshUser();
      
      // Employee ID cache'ini temizle (şirket değiştiğinde employee_id değişebilir)
      ActivityService.clearCache();
      
      // Tüm company-related provider'ları invalidate et
      ref.invalidate(userCompaniesProvider);
      ref.invalidate(activity_providers.personalActivitiesProvider);
      ref.invalidate(activity_providers.activitiesProvider);
      ref.invalidate(customersProvider);
      ref.invalidate(activeCustomersProvider);
      ref.invalidate(potentialCustomersProvider);
      ref.invalidate(customerStatsProvider);
      ref.invalidate(suppliersProvider);
      ref.invalidate(activeSuppliersProvider);
      ref.invalidate(potentialSuppliersProvider);
      ref.invalidate(supplierStatsProvider);
      ref.invalidate(pendingApprovalsProvider);
      ref.invalidate(recentNotificationsProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(serviceRequestsProvider);
      ref.invalidate(serviceRequestStatsProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Şirket değiştirildi'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        profileNotifier.setShowCompanySwitcher(false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        profileNotifier.setIsSwitching(false);
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: CustomScrollView(
        slivers: [
          // Gradient Header
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFB73D3D), Color(0xFF8B2F2F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  Responsive.getHorizontalPadding(context),
                  40,
                  Responsive.getHorizontalPadding(context),
                  32
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.25),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        CupertinoIcons.person_fill,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            authState.user?.fullName ?? 'Kullanıcı',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            authState.user?.email ?? '',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Main Content
          SliverPadding(
            padding: EdgeInsets.all(Responsive.getPadding(context)),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Ayarlar Bölümü
                _buildSectionHeader('Ayarlar'),
                const SizedBox(height: 12),
                
                _buildMenuCard(
                  context: context,
                  icon: CupertinoIcons.building_2_fill,
                  title: 'Şirket Değiştir',
                  subtitle: 'Farklı bir şirkete geç',
                  color: const Color(0xFF9333EA),
                  onTap: () {
                    ref.read(profileStateProvider.notifier).setShowCompanySwitcher(true);
                    _showCompanySwitcherDialog(context);
                  },
                ),
                const SizedBox(height: 8),
                
                _buildMenuCard(
                  context: context,
                  icon: CupertinoIcons.bell,
                  title: 'Bildirimler',
                  subtitle: 'Bildirim ayarlarını yönet',
                  color: const Color(0xFF3B82F6),
                  onTap: () => context.go('/notification-settings'),
                ),
                const SizedBox(height: 8),
                
                _buildMenuCard(
                  context: context,
                  icon: CupertinoIcons.globe,
                  title: 'Dil',
                  subtitle: 'Uygulama dilini değiştir',
                  color: const Color(0xFF10B981),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Dil ayarları yakında eklenecek')),
                    );
                  },
                ),
                const SizedBox(height: 8),
                
                _buildMenuCard(
                  context: context,
                  icon: CupertinoIcons.question_circle,
                  title: 'Yardım & Destek',
                  subtitle: 'SSS ve destek merkezi',
                  color: const Color(0xFFFF9500),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Yardım sayfası yakında eklenecek')),
                    );
                  },
                ),
                const SizedBox(height: 8),
                
                _buildMenuCard(
                  context: context,
                  icon: CupertinoIcons.info_circle,
                  title: 'Hakkında',
                  subtitle: 'Uygulama versiyonu ve bilgileri',
                  color: const Color(0xFF8B5CF6),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        title: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFB73D3D), Color(0xFF8B2F2F)],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                CupertinoIcons.square_grid_2x2,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text('PAFTA'),
                          ],
                        ),
                        content: const Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Versiyon: 1.0.0'),
                            SizedBox(height: 12),
                            Text('PAFTA mobil uygulaması ile iş süreçlerinizi kolayca yönetin.'),
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Tamam'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 32),
                
                // Çıkış Butonu
                SizedBox(
                  width: double.infinity,
                  child: CupertinoButton(
                    onPressed: () {
                      ref.read(authStateProvider.notifier).signOut();
                      context.go('/login');
                    },
                    color: const Color(0xFFB73D3D),
                    borderRadius: BorderRadius.circular(16),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.square_arrow_right,
                          color: Colors.white,
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Çıkış Yap',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  void _showCompanySwitcherDialog(BuildContext context) {
    final profileState = ref.watch(profileStateProvider);
    final profileNotifier = ref.read(profileStateProvider.notifier);
    
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _CompanySwitcherDialog(
        onClose: () {
          profileNotifier.setShowCompanySwitcher(false);
        },
        onSwitchCompany: _handleSwitchCompany,
        isSwitching: profileState.isSwitching,
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF000000),
        letterSpacing: -0.5,
      ),
    );
  }

  Widget _buildMenuCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
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
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        color.withOpacity(0.15),
                        color.withOpacity(0.08),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: Color(0xFF8E8E93),
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CompanySwitcherDialog extends ConsumerWidget {
  final VoidCallback onClose;
  final Future<void> Function(String) onSwitchCompany;
  final bool isSwitching;

  const _CompanySwitcherDialog({
    required this.onClose,
    required this.onSwitchCompany,
    required this.isSwitching,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final currentCompanyId = authState.user?.companyId;
    final userCompaniesAsync = ref.watch(userCompaniesProvider);

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF9333EA), Color(0xFF7C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      CupertinoIcons.building_2_fill,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: const Text(
                      'Şirket Seç',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      Navigator.pop(context);
                      onClose();
                    },
                    icon: const Icon(
                      CupertinoIcons.xmark,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
            
            // Content
            Flexible(
              child: userCompaniesAsync.when(
                data: (companies) => _buildCompanyList(context, companies, currentCompanyId),
                loading: () => const Padding(
                  padding: EdgeInsets.all(40),
                  child: CupertinoActivityIndicator(),
                ),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        CupertinoIcons.exclamationmark_triangle,
                        size: 48,
                        color: Color(0xFFEF4444),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Şirketler yüklenirken hata oluştu',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompanyList(BuildContext context, List<Map<String, dynamic>> companies, String? currentCompanyId) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (companies.isEmpty)
            Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  const Icon(
                    CupertinoIcons.building_2_fill,
                    size: 48,
                    color: Color(0xFF8E8E93),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Henüz bir şirkete bağlı değilsiniz',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            )
          else
            ...companies.map((uc) {
              final company = uc['company'] as Map<String, dynamic>?;
              final companyId = uc['company_id'] as String;
              final isCurrent = companyId == currentCompanyId;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: isCurrent
                      ? const Color(0xFF9333EA).withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isCurrent
                        ? const Color(0xFF9333EA)
                        : Colors.grey.withOpacity(0.2),
                    width: isCurrent ? 2 : 1,
                  ),
                ),
                child: Material(
                  color: Colors.transparent,
                    child: InkWell(
                    onTap: isSwitching
                        ? null
                        : () async {
                            await onSwitchCompany(companyId);
                            if (context.mounted) {
                              Navigator.pop(context);
                            }
                          },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          if (company?['logo_url'] != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                company!['logo_url'] as String,
                                width: 40,
                                height: 40,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF9333EA).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    CupertinoIcons.building_2_fill,
                                    color: Color(0xFF9333EA),
                                    size: 20,
                                  ),
                                ),
                              ),
                            )
                          else
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFF9333EA).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                CupertinoIcons.building_2_fill,
                                color: Color(0xFF9333EA),
                                size: 20,
                              ),
                            ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  company?['name'] as String? ?? 'İsimsiz Şirket',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: isCurrent
                                        ? const Color(0xFF9333EA)
                                        : const Color(0xFF000000),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  (uc['role'] as String? ?? 'member').toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isCurrent)
                            const Icon(
                              CupertinoIcons.checkmark_circle_fill,
                              color: Color(0xFF9333EA),
                              size: 24,
                            )
                          else if (isSwitching)
                            const CupertinoActivityIndicator()
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

}
