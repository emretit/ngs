import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/notification_provider.dart';
import '../models/notification.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    // Sayfa açıldığında bildirimleri yenile
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).refreshNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationState = ref.watch(notificationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          if (notificationState.unreadCount > 0)
            TextButton(
              onPressed: () {
                ref.read(notificationProvider.notifier).markAllAsRead();
              },
              child: const Text('Tümünü Okundu İşaretle'),
            ),
          IconButton(
            onPressed: () {
              ref.read(notificationProvider.notifier).refreshNotifications();
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _buildBody(notificationState),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ref.read(notificationProvider.notifier).sendTestNotification();
        },
        child: const Icon(Icons.notifications_active),
        tooltip: 'Test Bildirimi Gönder',
      ),
    );
  }

  Widget _buildBody(NotificationState state) {
    if (state.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Hata',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                ref.read(notificationProvider.notifier).refreshNotifications();
              },
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (state.notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Henüz bildirim yok',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Yeni bildirimler burada görünecek',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(notificationProvider.notifier).refreshNotifications();
      },
      child: ListView.builder(
        itemCount: state.notifications.length,
        itemBuilder: (context, index) {
          final notification = state.notifications[index];
          return NotificationCard(
            notification: notification,
            onTap: () {
              _handleNotificationTap(notification);
            },
            onMarkAsRead: () {
              ref.read(notificationProvider.notifier).markAsRead(notification.id);
            },
            onDelete: () {
              _showDeleteDialog(notification);
            },
          );
        },
      ),
    );
  }

  void _handleNotificationTap(NotificationModel notification) {
    // Bildirimi okundu olarak işaretle
    if (!notification.isRead) {
      ref.read(notificationProvider.notifier).markAsRead(notification.id);
    }

    // Action'a göre yönlendirme yap
    switch (notification.action) {
      case 'open_service_request':
        if (notification.serviceRequestId != null) {
          // Servis talebi detay sayfasına git
          context.go('/service/detail/${notification.serviceRequestId}');
        }
        break;
      case 'open_service_requests':
        // Servis talepleri listesine git
        context.go('/service/management');
        break;
      case 'open_emergency':
        // Acil durum sayfasına git (şimdilik servis listesine)
        context.go('/service/management');
        break;
      case 'open_notifications':
        // Bildirimler sayfasında kal
        break;
      default:
        break;
    }
  }

  void _showDeleteDialog(NotificationModel notification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Bildirimi Sil'),
        content: const Text('Bu bildirimi silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(notificationProvider.notifier).deleteNotification(notification.id);
            },
            child: const Text('Sil'),
          ),
        ],
      ),
    );
  }
}

class NotificationCard extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;
  final VoidCallback onMarkAsRead;
  final VoidCallback onDelete;

  const NotificationCard({
    super.key,
    required this.notification,
    required this.onTap,
    required this.onMarkAsRead,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getColorFromHex(notification.colorHex).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    notification.iconPath,
                    style: const TextStyle(fontSize: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          notification.timeAgo,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.grey[500],
                          ),
                        ),
                        const Spacer(),
                        if (!notification.isRead)
                          TextButton(
                            onPressed: onMarkAsRead,
                            child: const Text('Okundu İşaretle'),
                          ),
                        IconButton(
                          onPressed: onDelete,
                          icon: const Icon(Icons.delete_outline),
                          iconSize: 20,
                          color: Colors.grey[500],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getColorFromHex(String hexColor) {
    final hexCode = hexColor.replaceAll('#', '');
    return Color(int.parse('FF$hexCode', radix: 16));
  }
}
