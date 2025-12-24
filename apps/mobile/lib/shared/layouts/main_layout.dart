import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class MainLayout extends ConsumerWidget {
  final String currentRoute;
  final Widget child;

  const MainLayout({
    super.key,
    required this.currentRoute,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: child,
      drawer: _buildDrawer(context, ref),
      bottomNavigationBar: _buildBottomNavigationBar(
        context,
        ref,
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, WidgetRef ref) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFD32F2F), Color(0xFFB71C1C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'PAFTA',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    ref.read(authStateProvider).user?.fullName ?? 
                    ref.read(authStateProvider).user?.email ?? 'Kullanıcı',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            
            // Ana Modüller
            _buildDrawerSection(
              context,
              'Ana Modüller',
              [
                _buildDrawerItem(
                  context,
                  'Dashboard',
                  CupertinoIcons.house_fill,
                  '/dashboard',
                ),
                _buildDrawerItem(
                  context,
                  'CRM',
                  CupertinoIcons.chart_bar_alt_fill,
                  '/crm',
                ),
                _buildDrawerItem(
                  context,
                  'Müşteriler',
                  CupertinoIcons.person_2_fill,
                  '/customers',
                ),
                _buildDrawerItem(
                  context,
                  'Tedarikçiler',
                  CupertinoIcons.building_2_fill,
                  '/suppliers',
                ),
                _buildDrawerItem(
                  context,
                  'Faturalar',
                  CupertinoIcons.doc_text_fill,
                  '/sales/invoices',
                ),
                _buildDrawerItem(
                  context,
                  'Ürünler',
                  CupertinoIcons.cube_box_fill,
                  '/inventory/products',
                ),
                _buildDrawerItem(
                  context,
                  'Hesaplar',
                  CupertinoIcons.building_2_fill,
                  '/accounting/accounts',
                ),
                _buildDrawerItem(
                  context,
                  'Masraflar',
                  CupertinoIcons.arrow_down_circle_fill,
                  '/accounting/expenses',
                ),
              ],
            ),
            
            const Divider(),
            
            // Servis
            _buildDrawerSection(
              context,
              'Servis',
              [
                _buildDrawerItem(
                  context,
                  'Servis Yönetimi',
                  CupertinoIcons.wrench_fill,
                  '/service/management',
                ),
                _buildDrawerItem(
                  context,
                  'Yeni Servis Talebi',
                  CupertinoIcons.add_circled_solid,
                  '/service/new',
                ),
              ],
            ),
            
            const Divider(),
            
            // Ayarlar
            _buildDrawerSection(
              context,
              'Ayarlar',
              [
                _buildDrawerItem(
                  context,
                  'Bildirimler',
                  CupertinoIcons.bell_fill,
                  '/notifications',
                ),
                _buildDrawerItem(
                  context,
                  'Profil',
                  CupertinoIcons.person_fill,
                  '/profile',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerSection(
    BuildContext context,
    String title,
    List<Widget> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF8E8E93),
              letterSpacing: 0.5,
            ),
          ),
        ),
        ...items,
      ],
    );
  }

  Widget _buildDrawerItem(
    BuildContext context,
    String title,
    IconData icon,
    String route,
  ) {
    final isSelected = currentRoute == route || 
                      (route != '/dashboard' && currentRoute.startsWith(route));
    
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? const Color(0xFFD32F2F) : const Color(0xFF8E8E93),
        size: 24,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFFD32F2F) : const Color(0xFF000000),
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      onTap: () {
        Navigator.pop(context);
        context.go(route);
      },
    );
  }

  Widget _buildBottomNavigationBar(
    BuildContext context,
    WidgetRef ref,
  ) {
    final items = _getBottomNavItems();
    final currentIndex = _getCurrentIndex();
    
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF2F2F7),
        border: Border(
          top: BorderSide(
            color: const Color.fromRGBO(0, 0, 0, 0.1),
            width: 0.5,
          ),
        ),
      ),
      child: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: (index) => _onItemTapped(context, index),
        selectedItemColor: const Color(0xFFD32F2F),
        unselectedItemColor: const Color(0xFF8E8E93),
        backgroundColor: const Color(0xFFF2F2F7),
        elevation: 0,
        selectedLabelStyle: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.normal,
        ),
        items: items,
      ),
    );
  }

  List<BottomNavigationBarItem> _getBottomNavItems() {
    // Alt navigasyon çubuğu - 5 buton (Modüller ortada - index 2)
    return [
      const BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.house, size: 24),
        activeIcon: Icon(CupertinoIcons.house_fill, size: 24),
        label: 'Dashboard',
      ),
      const BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.chart_bar_alt_fill, size: 24),
        activeIcon: Icon(CupertinoIcons.chart_bar_alt_fill, size: 24),
        label: 'CRM',
      ),
      const BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.square_grid_2x2, size: 24),
        activeIcon: Icon(CupertinoIcons.square_grid_2x2_fill, size: 24),
        label: 'Modüller',
      ),
      const BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.wrench, size: 24),
        activeIcon: Icon(CupertinoIcons.wrench_fill, size: 24),
        label: 'Servis',
      ),
      const BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.person, size: 24),
        activeIcon: Icon(CupertinoIcons.person_fill, size: 24),
        label: 'Profil',
      ),
    ];
  }

  int _getCurrentIndex() {
    if (currentRoute == '/dashboard' || currentRoute == '/home') return 0;
    if (currentRoute == '/crm' || currentRoute.startsWith('/sales/opportunities')) return 1;
    if (currentRoute == '/modules') return 2; // Modüller ortada
    if (currentRoute.startsWith('/service')) return 3; // Servis sayfaları
    if (currentRoute == '/profile') return 4;
    
    // Diğer route'lar için modüller sayfasını aktif göster
    if (currentRoute.startsWith('/sales') ||
        currentRoute.startsWith('/finance') ||
        currentRoute.startsWith('/accounting') ||
        currentRoute.startsWith('/inventory') ||
        currentRoute.startsWith('/activities')) {
      return 2; // Modüller sayfası aktif (ortada)
    }
    
    return 0;
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/crm');
        break;
      case 2:
        context.go('/modules');
        break;
      case 3:
        context.go('/service/management');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }
}
