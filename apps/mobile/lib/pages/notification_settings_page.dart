import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'notifications_page.dart';

class NotificationSettingsPage extends ConsumerStatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  ConsumerState<NotificationSettingsPage> createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends ConsumerState<NotificationSettingsPage> {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  bool _serviceAssignments = true;
  bool _statusUpdates = true;
  bool _serviceCompleted = true;
  bool _appointmentReminders = true;
  bool _emergencyNotifications = true;
  bool _generalNotifications = true;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final response = await _supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

      if (response != null) {
        setState(() {
          _serviceAssignments = response['service_assignments'] ?? true;
          _statusUpdates = response['status_updates'] ?? true;
          _serviceCompleted = response['service_completed'] ?? true;
          _appointmentReminders = response['appointment_reminders'] ?? true;
          _emergencyNotifications = response['emergency_notifications'] ?? true;
          _generalNotifications = response['general_notifications'] ?? true;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Ayarlar yüklenemedi: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveSettings() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      await _supabase.from('notification_settings').upsert({
        'user_id': user.id,
        'service_assignments': _serviceAssignments,
        'status_updates': _statusUpdates,
        'service_completed': _serviceCompleted,
        'appointment_reminders': _appointmentReminders,
        'emergency_notifications': _emergencyNotifications,
        'general_notifications': _generalNotifications,
        'updated_at': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ayarlar kaydedildi'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ayarlar kaydedilemedi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirim Ayarları'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveSettings,
            child: const Text('Kaydet'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget()
              : _buildSettingsList(),
    );
  }

  Widget _buildErrorWidget() {
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
            _error!,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadSettings,
            child: const Text('Tekrar Dene'),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsList() {
    return ListView(
      children: [
        _buildSectionHeader('Servis Bildirimleri'),
        _buildSwitchTile(
          title: 'Servis Atamaları',
          subtitle: 'Yeni servis talepleri atandığında bildirim al',
          value: _serviceAssignments,
          onChanged: (value) => setState(() => _serviceAssignments = value),
          icon: Icons.assignment,
        ),
        _buildSwitchTile(
          title: 'Durum Güncellemeleri',
          subtitle: 'Servis talebi durumu değiştiğinde bildirim al',
          value: _statusUpdates,
          onChanged: (value) => setState(() => _statusUpdates = value),
          icon: Icons.update,
        ),
        _buildSwitchTile(
          title: 'Servis Tamamlandı',
          subtitle: 'Servis tamamlandığında bildirim al',
          value: _serviceCompleted,
          onChanged: (value) => setState(() => _serviceCompleted = value),
          icon: Icons.check_circle,
        ),
        _buildSwitchTile(
          title: 'Randevu Hatırlatmaları',
          subtitle: 'Randevu saatinden önce hatırlatma al',
          value: _appointmentReminders,
          onChanged: (value) => setState(() => _appointmentReminders = value),
          icon: Icons.schedule,
        ),
        
        const SizedBox(height: 24),
        _buildSectionHeader('Sistem Bildirimleri'),
        _buildSwitchTile(
          title: 'Acil Durum Bildirimleri',
          subtitle: 'Acil durum bildirimlerini her zaman al',
          value: _emergencyNotifications,
          onChanged: (value) => setState(() => _emergencyNotifications = value),
          icon: Icons.warning,
          isImportant: true,
        ),
        _buildSwitchTile(
          title: 'Genel Bildirimler',
          subtitle: 'Sistem duyuruları ve genel bildirimler',
          value: _generalNotifications,
          onChanged: (value) => setState(() => _generalNotifications = value),
          icon: Icons.notifications,
        ),
        
        const SizedBox(height: 24),
        _buildSectionHeader('Test'),
        ListTile(
          leading: const Icon(Icons.notifications_active),
          title: const Text('Test Bildirimi Gönder'),
          subtitle: const Text('Bildirim sistemini test et'),
          onTap: () {
            _showTestNotificationDialog();
          },
        ),
        
        const SizedBox(height: 24),
        _buildSectionHeader('Bildirim Geçmişi'),
        ListTile(
          leading: const Icon(Icons.history),
          title: const Text('Bildirim Geçmişi'),
          subtitle: const Text('Tüm bildirimleri görüntüle'),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NotificationsPage(),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: Theme.of(context).primaryColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required IconData icon,
    bool isImportant = false,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SwitchListTile(
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isImportant ? FontWeight.bold : FontWeight.normal,
            color: isImportant ? Colors.red : null,
          ),
        ),
        subtitle: Text(subtitle),
        value: value,
        onChanged: onChanged,
        secondary: Icon(
          icon,
          color: isImportant ? Colors.red : null,
        ),
        activeColor: Theme.of(context).primaryColor,
      ),
    );
  }

  void _showTestNotificationDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Test Bildirimi'),
        content: const Text('Test bildirimi gönderilsin mi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _sendTestNotification();
            },
            child: const Text('Gönder'),
          ),
        ],
      ),
    );
  }

  Future<void> _sendTestNotification() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      // Test bildirimi gönder
      final response = await _supabase.functions.invoke(
        'send-push-notification',
        body: {
          'user_id': user.id,
          'title': 'Test Bildirimi',
          'body': 'Bu bir test bildirimidir. Bildirim ayarlarınız çalışıyor!',
          'data': {
            'type': 'test',
            'action': 'open_notifications',
          },
        },
      );

      if (mounted) {
        if (response.status == 200) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Test bildirimi gönderildi'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Test bildirimi gönderilemedi'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Test bildirimi hatası: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
