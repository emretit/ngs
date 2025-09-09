import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final technician = authState.technician;

    if (technician == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profil Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryColor,
                    AppTheme.primaryDarkColor,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  // Avatar
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white,
                    child: technician.avatarUrl != null
                        ? ClipOval(
                            child: Image.network(
                              technician.avatarUrl!,
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Icon(
                                  Icons.person,
                                  size: 50,
                                  color: AppTheme.primaryColor,
                                );
                              },
                            ),
                          )
                        : Icon(
                            Icons.person,
                            size: 50,
                            color: AppTheme.primaryColor,
                          ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // İsim
                  Text(
                    technician.fullName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Pozisyon
                  Text(
                    technician.position,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Departman
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      technician.department,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Kişisel Bilgiler
            _buildSection(
              title: 'Kişisel Bilgiler',
              children: [
                _buildInfoTile(
                  icon: Icons.email_outlined,
                  title: 'E-posta',
                  value: technician.email,
                ),
                if (technician.phone != null)
                  _buildInfoTile(
                    icon: Icons.phone_outlined,
                    title: 'Telefon',
                    value: technician.phone!,
                  ),
                if (technician.address != null)
                  _buildInfoTile(
                    icon: Icons.location_on_outlined,
                    title: 'Adres',
                    value: technician.address!,
                  ),
                if (technician.city != null)
                  _buildInfoTile(
                    icon: Icons.location_city_outlined,
                    title: 'Şehir',
                    value: technician.city!,
                  ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // İş Bilgileri
            _buildSection(
              title: 'İş Bilgileri',
              children: [
                _buildInfoTile(
                  icon: Icons.work_outline,
                  title: 'Pozisyon',
                  value: technician.position,
                ),
                _buildInfoTile(
                  icon: Icons.business_outlined,
                  title: 'Departman',
                  value: technician.department,
                ),
                _buildInfoTile(
                  icon: Icons.calendar_today_outlined,
                  title: 'İşe Başlama',
                  value: technician.hireDate != null
                      ? '${technician.hireDate!.day}/${technician.hireDate!.month}/${technician.hireDate!.year}'
                      : 'Belirtilmemiş',
                ),
                _buildInfoTile(
                  icon: Icons.check_circle_outline,
                  title: 'Durum',
                  value: technician.isActive ? 'Aktif' : 'Pasif',
                  valueColor: technician.isActive ? AppTheme.successColor : AppTheme.errorColor,
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Ayarlar
            _buildSection(
              title: 'Ayarlar',
              children: [
                _buildActionTile(
                  icon: Icons.notifications_outlined,
                  title: 'Bildirimler',
                  subtitle: 'Bildirim ayarlarını yönet',
                  onTap: () {
                    // Bildirim ayarları sayfasına git
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Bildirim ayarları yakında eklenecek'),
                      ),
                    );
                  },
                ),
                _buildActionTile(
                  icon: Icons.dark_mode_outlined,
                  title: 'Tema',
                  subtitle: 'Açık/Koyu tema seçimi',
                  onTap: () {
                    // Tema ayarları
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Tema ayarları yakında eklenecek'),
                      ),
                    );
                  },
                ),
                _buildActionTile(
                  icon: Icons.help_outline,
                  title: 'Yardım',
                  subtitle: 'Yardım ve destek',
                  onTap: () {
                    // Yardım sayfası
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Yardım sayfası yakında eklenecek'),
                      ),
                    );
                  },
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Çıkış Yap
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final authNotifier = ref.read(authProvider.notifier);
                  await authNotifier.signOut();
                },
                icon: const Icon(Icons.logout),
                label: const Text('Çıkış Yap'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.errorColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.grey800,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String title,
    required String value,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: AppTheme.grey500,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.grey500,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: valueColor ?? AppTheme.grey800,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: AppTheme.grey500,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.grey800,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.grey500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: AppTheme.grey400,
            ),
          ],
        ),
      ),
    );
  }
}
