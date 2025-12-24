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
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Müşteriler',
                subtitle: 'Müşteri listesi ve yönetimi',
                icon: CupertinoIcons.person_2_fill,
                color: const Color(0xFF34C759),
                route: '/customers',
              ),
            ),
            const SizedBox(height: 12),
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Tedarikçiler',
                subtitle: 'Tedarikçi listesi ve yönetimi',
                icon: CupertinoIcons.building_2_fill,
                color: const Color(0xFF9333EA),
                route: '/suppliers',
              ),
            ),
            const SizedBox(height: 12),
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Faturalar',
                subtitle: 'Satış faturaları',
                icon: CupertinoIcons.doc_text_fill,
                color: const Color(0xFF22C55E),
                route: '/sales/invoices',
              ),
            ),
            const SizedBox(height: 12),
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Ürünler',
                subtitle: 'Ürün listesi ve yönetimi',
                icon: CupertinoIcons.cube_box_fill,
                color: const Color(0xFF3B82F6),
                route: '/inventory/products',
              ),
            ),
            const SizedBox(height: 12),
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Hesaplar',
                subtitle: 'Banka hesapları ve bakiyeler',
                icon: CupertinoIcons.building_2_fill,
                color: const Color(0xFF9333EA),
                route: '/accounting/accounts',
              ),
            ),
            const SizedBox(height: 12),
            _buildModuleCard(
              context,
              _ModuleItem(
                title: 'Masraflar',
                subtitle: 'Gider yönetimi',
                icon: CupertinoIcons.arrow_down_circle_fill,
                color: const Color(0xFFEF4444),
                route: '/accounting/expenses',
              ),
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
