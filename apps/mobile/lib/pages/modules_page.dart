import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';

/// Tüm Modüller Sayfası
/// Web app'teki Navbar gibi tüm sayfaları gösterir (Servis hariç)
class ModulesPage extends StatelessWidget {
  const ModulesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          'Tüm Modüller',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // CRM Modülü
            _buildModuleSection(
              context,
              'CRM',
              [
                _ModuleItem(
                  title: 'Müşteriler',
                  subtitle: 'Müşteri listesi ve yönetimi',
                  icon: CupertinoIcons.person_2_fill,
                  color: const Color(0xFF34C759),
                  route: '/customers',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Servis Modülü
            _buildModuleSection(
              context,
              'Servis',
              [
                _ModuleItem(
                  title: 'Servis Yönetimi',
                  subtitle: 'Servis talepleri ve yönetimi',
                  icon: CupertinoIcons.wrench_fill,
                  color: const Color(0xFFB73D3D),
                  route: '/service/management',
                ),
                _ModuleItem(
                  title: 'Yeni Servis Talebi',
                  subtitle: 'Yeni servis talebi oluştur',
                  icon: CupertinoIcons.add_circled_solid,
                  color: const Color(0xFFE74C3C),
                  route: '/service/new',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Satış Modülü
            _buildModuleSection(
              context,
              'Satış',
              [
                _ModuleItem(
                  title: 'Teklifler',
                  subtitle: 'Satış teklifleri',
                  icon: CupertinoIcons.doc_fill,
                  color: const Color(0xFF9333EA),
                  route: '/sales/proposals',
                ),
                _ModuleItem(
                  title: 'Siparişler',
                  subtitle: 'Satış siparişleri',
                  icon: CupertinoIcons.cart_fill,
                  color: const Color(0xFF3B82F6),
                  route: '/sales/orders',
                ),
                _ModuleItem(
                  title: 'Faturalar',
                  subtitle: 'Satış faturaları',
                  icon: CupertinoIcons.doc_text_fill,
                  color: const Color(0xFF22C55E),
                  route: '/sales/invoices',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Finans Modülü
            _buildModuleSection(
              context,
              'Finans',
              [
                _ModuleItem(
                  title: 'Finans Dashboard',
                  subtitle: 'Finansal özet ve hesaplar',
                  icon: CupertinoIcons.chart_bar_alt_fill,
                  color: const Color(0xFF3B82F6),
                  route: '/finance',
                ),
                _ModuleItem(
                  title: 'Giderler',
                  subtitle: 'Gider yönetimi',
                  icon: CupertinoIcons.arrow_down_circle_fill,
                  color: const Color(0xFFEF4444),
                  route: '/accounting/expenses',
                ),
                _ModuleItem(
                  title: 'Ödemeler',
                  subtitle: 'Tahsilat ve ödemeler',
                  icon: CupertinoIcons.creditcard_fill,
                  color: const Color(0xFF22C55E),
                  route: '/accounting/payments',
                ),
                _ModuleItem(
                  title: 'Banka Hesapları',
                  subtitle: 'Banka hesapları ve bakiyeler',
                  icon: CupertinoIcons.building_2_fill,
                  color: const Color(0xFF9333EA),
                  route: '/accounting/accounts',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Satın Alma Modülü
            _buildModuleSection(
              context,
              'Satın Alma',
              [
                _ModuleItem(
                  title: 'Satın Alma Talepleri',
                  subtitle: 'Satın alma talepleri',
                  icon: CupertinoIcons.doc_on_doc_fill,
                  color: const Color(0xFF3B82F6),
                  route: '/purchasing/requests',
                ),
                _ModuleItem(
                  title: 'Satın Alma Siparişleri',
                  subtitle: 'Satın alma siparişleri',
                  icon: CupertinoIcons.bag_fill,
                  color: const Color(0xFF22C55E),
                  route: '/purchasing/orders',
                ),
                _ModuleItem(
                  title: 'Tedarikçiler',
                  subtitle: 'Tedarikçi listesi',
                  icon: CupertinoIcons.building_2_fill,
                  color: const Color(0xFF9333EA),
                  route: '/purchasing/suppliers',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Stok Modülü
            _buildModuleSection(
              context,
              'Stok',
              [
                _ModuleItem(
                  title: 'Ürünler',
                  subtitle: 'Ürün listesi ve yönetimi',
                  icon: CupertinoIcons.cube_box_fill,
                  color: const Color(0xFF3B82F6),
                  route: '/inventory/products',
                ),
                _ModuleItem(
                  title: 'Depolar',
                  subtitle: 'Depo yönetimi',
                  icon: CupertinoIcons.building_2_fill,
                  color: const Color(0xFF22C55E),
                  route: '/inventory/warehouses',
                ),
                _ModuleItem(
                  title: 'Stok Hareketleri',
                  subtitle: 'Stok işlemleri',
                  icon: CupertinoIcons.arrow_left_right,
                  color: const Color(0xFFFF9500),
                  route: '/inventory/transactions',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // İK Modülü
            _buildModuleSection(
              context,
              'İnsan Kaynakları',
              [
                _ModuleItem(
                  title: 'Çalışanlar',
                  subtitle: 'Çalışan listesi',
                  icon: CupertinoIcons.person_2_fill,
                  color: const Color(0xFF3B82F6),
                  route: '/hr/employees',
                ),
                _ModuleItem(
                  title: 'İzinler',
                  subtitle: 'İzin yönetimi',
                  icon: CupertinoIcons.calendar,
                  color: const Color(0xFF22C55E),
                  route: '/hr/leaves',
                ),
                _ModuleItem(
                  title: 'Performans',
                  subtitle: 'Performans değerlendirme',
                  icon: CupertinoIcons.chart_bar_fill,
                  color: const Color(0xFFFF9500),
                  route: '/hr/performance',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Ayarlar
            _buildModuleSection(
              context,
              'Ayarlar',
              [
                _ModuleItem(
                  title: 'Profil',
                  subtitle: 'Hesap ayarları ve profil',
                  icon: CupertinoIcons.person_fill,
                  color: const Color(0xFFAF52DE),
                  route: '/profile',
                ),
                _ModuleItem(
                  title: 'Bildirim Ayarları',
                  subtitle: 'Bildirim tercihleri',
                  icon: CupertinoIcons.bell_slash_fill,
                  color: const Color(0xFF8E8E93),
                  route: '/notification-settings',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleSection(
    BuildContext context,
    String title,
    List<_ModuleItem> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF000000),
          ),
        ),
        const SizedBox(height: 12),
        ...items.map((item) => _buildModuleCard(context, item)),
      ],
    );
  }

  Widget _buildModuleCard(BuildContext context, _ModuleItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white,
            Color.fromRGBO(
              ((item.color.value >> 16) & 0xFF),
              ((item.color.value >> 8) & 0xFF),
              (item.color.value & 0xFF),
              0.03,
            ),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Color.fromRGBO(
            ((item.color.value >> 16) & 0xFF),
            ((item.color.value >> 8) & 0xFF),
            (item.color.value & 0xFF),
            0.1,
          ),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Color.fromRGBO(
              ((item.color.value >> 16) & 0xFF),
              ((item.color.value >> 8) & 0xFF),
              (item.color.value & 0xFF),
              0.1,
            ),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
          const BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go(item.route),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Color.fromRGBO(
                          ((item.color.value >> 16) & 0xFF),
                          ((item.color.value >> 8) & 0xFF),
                          (item.color.value & 0xFF),
                          0.2,
                        ),
                        Color.fromRGBO(
                          ((item.color.value >> 16) & 0xFF),
                          ((item.color.value >> 8) & 0xFF),
                          (item.color.value & 0xFF),
                          0.1,
                        ),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Color.fromRGBO(
                          ((item.color.value >> 16) & 0xFF),
                          ((item.color.value >> 8) & 0xFF),
                          (item.color.value & 0xFF),
                          0.2,
                        ),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    item.icon,
                    color: item.color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 13,
                          color: const Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  CupertinoIcons.chevron_right,
                  color: Colors.grey[400],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModuleItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String route;

  _ModuleItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.route,
  });
}
