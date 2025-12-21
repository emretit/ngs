import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/service_request_provider.dart';
import '../services/firebase_messaging_service.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  void initState() {
    super.initState();
    // Sayfa açıldığında badge'i temizle
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseMessagingService.clearBadge();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final serviceRequestsAsync = ref.watch(serviceRequestsProvider);
    

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          'PAFTA',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          CupertinoButton(
            padding: const EdgeInsets.all(8),
            onPressed: () {
              ref.read(authStateProvider.notifier).signOut();
              context.go('/login');
            },
            child: const Icon(
              CupertinoIcons.square_arrow_right,
              color: Color(0xFFB73D3D),
              size: 24,
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(serviceRequestsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome message - iOS style
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20.0),
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
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: const Color(0xFFB73D3D).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(25),
                            ),
                            child: const Icon(
                              CupertinoIcons.person_fill,
                              color: Color(0xFFB73D3D),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hoş geldiniz!',
                                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                    color: const Color(0xFF8E8E93),
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  authState.user?.fullName ?? authState.user?.email ?? 'Kullanıcı',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF000000),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F2F7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              CupertinoIcons.calendar,
                              color: Color(0xFF8E8E93),
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              DateTime.now().day.toString().padLeft(2, '0') + ' ' +
                              _getMonthName(DateTime.now().month) + ' ' +
                              DateTime.now().year.toString(),
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Statistics Cards
                serviceRequestsAsync.when(
                  data: (requests) => _buildStatisticsCards(context, requests),
                  loading: () => _buildLoadingCards(),
                  error: (error, stack) => _buildErrorCard(),
                ),
                
                const SizedBox(height: 24),
                
                // Quick Actions
                Text(
                  'Hızlı İşlemler',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 16),
                
                _buildQuickActions(context),
                
                const SizedBox(height: 24),
                
                // Today's Tasks
                Text(
                  'Bugünkü Görevler',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 16),
                
                serviceRequestsAsync.when(
                  data: (requests) => _buildTodaysTasks(context, requests),
                  loading: () => _buildLoadingTasks(),
                  error: (error, stack) => _buildErrorCard(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = [
      '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[month];
  }

  Widget _buildStatisticsCards(BuildContext context, List requests) {
    final today = DateTime.now();
    final todayRequests = requests.where((request) {
      final createdAt = DateTime.parse(request.createdAt.toString());
      return createdAt.year == today.year &&
             createdAt.month == today.month &&
             createdAt.day == today.day;
    }).length;

    final newRequests = requests.where((request) => request.status == 'new').length;
    final inProgressRequests = requests.where((request) => request.status == 'in_progress').length;
    final completedRequests = requests.where((request) => request.status == 'completed').length;

    return Column(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Genel Bakış',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF000000),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Bugün',
                todayRequests.toString(),
                CupertinoIcons.calendar_today,
                const Color(0xFF34C759),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Yeni',
                newRequests.toString(),
                CupertinoIcons.plus_circle_fill,
                const Color(0xFFB73D3D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Devam Eden',
                inProgressRequests.toString(),
                CupertinoIcons.clock_fill,
                const Color(0xFFFF9500),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Tamamlanan',
                completedRequests.toString(),
                CupertinoIcons.checkmark_circle_fill,
                const Color(0xFF34C759),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF000000),
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF8E8E93),
              fontWeight: FontWeight.w500,
              letterSpacing: -0.08,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingCards() {
    return Column(
      children: [
        const Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Genel Bakış',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildLoadingCard()),
            const SizedBox(width: 12),
            Expanded(child: _buildLoadingCard()),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildLoadingCard()),
            const SizedBox(width: 12),
            Expanded(child: _buildLoadingCard()),
          ],
        ),
      ],
    );
  }

  Widget _buildLoadingCard() {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[300]!),
          ),
          const SizedBox(height: 8),
          Text(
            'Yükleniyor...',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Veriler yüklenirken bir hata oluştu',
              style: TextStyle(color: Colors.red[600]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                'Yeni Talep',
                'Hızlı talep oluştur',
                CupertinoIcons.add_circled_solid,
                const Color(0xFF34C759),
                () => context.go('/service-requests/create'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                'Taleplerim',
                'Atanmış talepler',
                CupertinoIcons.doc_text_fill,
                const Color(0xFFB73D3D),
                () => context.go('/service-requests'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                'Profil',
                'Hesap ayarları',
                CupertinoIcons.person_fill,
                const Color(0xFFFF9500),
                () => context.go('/profile'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                'Raporlar',
                'İstatistikler',
                CupertinoIcons.chart_bar_fill,
                const Color(0xFFAF52DE),
                () => context.go('/service-requests'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return CupertinoButton(
      onPressed: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
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
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF000000),
                letterSpacing: -0.32,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF8E8E93),
                fontWeight: FontWeight.w400,
                letterSpacing: -0.08,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodaysTasks(BuildContext context, List requests) {
    final today = DateTime.now();
    final todaysTasks = requests.where((request) {
      if (request.dueDate != null) {
        final dueDate = DateTime.parse(request.dueDate.toString());
        return dueDate.year == today.year &&
               dueDate.month == today.month &&
               dueDate.day == today.day;
      }
      return false;
    }).take(3).toList();

    if (todaysTasks.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(CupertinoIcons.checkmark_alt_circle, size: 48, color: const Color(0xFF8E8E93)),
            const SizedBox(height: 12),
            Text(
              'Bugün için görev yok',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Harika! Bugün için planlanmış göreviniz bulunmuyor.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        ...todaysTasks.map((task) => _buildTaskCard(context, task)).toList(),
        if (todaysTasks.length >= 3)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: TextButton(
              onPressed: () => context.go('/service-requests'),
              child: const Text('Tüm görevleri görüntüle'),
            ),
          ),
      ],
    );
  }

  Widget _buildTaskCard(BuildContext context, dynamic task) {
    Color statusColor;
    String statusText;
    
    switch (task.status) {
      case 'new':
        statusColor = const Color(0xFFB73D3D);
        statusText = 'Yeni';
        break;
      case 'in_progress':
        statusColor = Colors.orange;
        statusText = 'Devam Ediyor';
        break;
      case 'completed':
        statusColor = Colors.green;
        statusText = 'Tamamlandı';
        break;
      default:
        statusColor = Colors.grey;
        statusText = task.status;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => context.go('/service-requests/${task.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    task.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 12,
                      color: statusColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            if (task.description != null) ...[
              const SizedBox(height: 8),
              Text(
                task.description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (task.location != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(CupertinoIcons.location, size: 16, color: Color(0xFF8E8E93)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      task.location,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF8E8E93),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingTasks() {
    return Column(
      children: List.generate(2, (index) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 80,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[300]!),
          ),
        ),
      )),
    );
  }
}
