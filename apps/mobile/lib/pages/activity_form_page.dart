import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/activity.dart';
import '../providers/activity_provider.dart';
import '../providers/auth_provider.dart';
import '../services/activity_service.dart';

/// Microsoft To Do benzeri aktivite ekleme/düzenleme sayfası
class ActivityFormPage extends ConsumerStatefulWidget {
  final String? id; // null ise yeni oluşturma, dolu ise düzenleme

  const ActivityFormPage({
    super.key,
    this.id,
  });

  @override
  ConsumerState<ActivityFormPage> createState() => _ActivityFormPageState();
}

class _ActivityFormPageState extends ConsumerState<ActivityFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedPriority = 'medium';
  DateTime? _dueDate;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) {
      _loadActivity();
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadActivity() async {
    try {
      final activityService = ref.read(activityServiceProvider);
      final activity = await activityService.getActivityById(widget.id!);
      
      setState(() {
        _titleController.text = activity.title;
        _descriptionController.text = activity.description ?? '';
        _selectedPriority = activity.priority;
        _dueDate = activity.dueDate;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Aktivite yüklenemedi: $e'),
            backgroundColor: const Color(0xFFFF3B30),
          ),
        );
        context.pop();
      }
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('tr', 'TR'),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF007AFF),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      // Saat seçimi için time picker göster
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: _dueDate != null 
            ? TimeOfDay.fromDateTime(_dueDate!)
            : TimeOfDay.now(),
        builder: (context, child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: const ColorScheme.light(
                primary: Color(0xFF007AFF),
                onPrimary: Colors.white,
                surface: Colors.white,
                onSurface: Colors.black,
              ),
            ),
            child: child!,
          );
        },
      );
      
      if (time != null) {
        setState(() {
          _dueDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _saveActivity() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final activityService = ref.read(activityServiceProvider);
      final authState = ref.read(authStateProvider);

      if (widget.id == null) {
        // Yeni oluşturma
        await activityService.createActivity(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty 
              ? null 
              : _descriptionController.text.trim(),
          dueDate: _dueDate?.toIso8601String(),
          priority: _selectedPriority,
          companyId: authState.user?.companyId,
          userId: authState.user?.id,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Aktivite başarıyla oluşturuldu'),
              backgroundColor: Color(0xFF34C759),
            ),
          );
          context.pop();
        }
      } else {
        // Düzenleme
        await activityService.updateActivity(
          id: widget.id!,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty 
              ? null 
              : _descriptionController.text.trim(),
          dueDate: _dueDate?.toIso8601String(),
          priority: _selectedPriority,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Aktivite başarıyla güncellendi'),
              backgroundColor: Color(0xFF34C759),
            ),
          );
          context.pop();
        }
      }

      // Provider'ı yenile
      ref.invalidate(activitiesProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: $e'),
            backgroundColor: const Color(0xFFFF3B30),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'low':
        return const Color(0xFF007AFF);
      case 'medium':
        return const Color(0xFFFF9500);
      case 'high':
        return const Color(0xFFFF3B30);
      case 'urgent':
        return const Color(0xFFFF3B30);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  String _getPriorityLabel(String priority) {
    final priorityDisplayNames = ref.read(activityPriorityDisplayNamesProvider);
    return priorityDisplayNames[priority] ?? priority;
  }

  @override
  Widget build(BuildContext context) {
    final priorityDisplayNames = ref.watch(activityPriorityDisplayNamesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          widget.id == null ? 'Yeni Aktivite' : 'Aktiviteyi Düzenle',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF000000),
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: CupertinoButton(
          onPressed: () => context.pop(),
          child: const Icon(
            CupertinoIcons.back,
            color: Color(0xFF007AFF),
          ),
        ),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CupertinoActivityIndicator(
                  color: Color(0xFF007AFF),
                ),
              ),
            )
          else
            CupertinoButton(
              onPressed: _saveActivity,
              child: const Text(
                'Kaydet',
                style: TextStyle(
                  color: Color(0xFF007AFF),
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Başlık (Zorunlu)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextFormField(
                  controller: _titleController,
                  autofocus: widget.id == null,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF000000),
                  ),
                  decoration: InputDecoration(
                    hintText: 'Başlık',
                    hintStyle: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[400],
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.all(20),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Başlık gereklidir';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(height: 16),

              // Açıklama (Opsiyonel)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextFormField(
                  controller: _descriptionController,
                  maxLines: 4,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF000000),
                  ),
                  decoration: InputDecoration(
                    hintText: 'Notlar (opsiyonel)',
                    hintStyle: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[400],
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.all(20),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Tarih Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.calendar,
                title: 'Tarih',
                subtitle: _dueDate != null
                    ? DateFormat('d MMMM yyyy, EEEE', 'tr_TR').format(_dueDate!)
                    : 'Tarih ekle',
                onTap: _selectDate,
                trailing: _dueDate != null
                    ? CupertinoButton(
                        onPressed: () {
                          setState(() {
                            _dueDate = null;
                          });
                        },
                        padding: EdgeInsets.zero,
                        child: const Icon(
                          CupertinoIcons.xmark_circle_fill,
                          color: Color(0xFF8E8E93),
                          size: 20,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: 8),

              // Öncelik Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.flag_fill,
                title: 'Öncelik',
                subtitle: priorityDisplayNames[_selectedPriority] ?? _selectedPriority,
                onTap: () {
                  _showPriorityPicker(context);
                },
                trailing: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _getPriorityColor(_selectedPriority),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF007AFF).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    icon,
                    color: const Color(0xFF007AFF),
                    size: 20,
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
                          fontSize: 14,
                          color: Color(0xFF8E8E93),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Color(0xFF000000),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                if (trailing != null) ...[
                  const SizedBox(width: 12),
                  trailing,
                ] else
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

  void _showPriorityPicker(BuildContext context) {
    final priorityDisplayNames = ref.read(activityPriorityDisplayNamesProvider);
    
    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Öncelik Seç'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedPriority = 'low';
              });
              Navigator.pop(context);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFF007AFF),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(priorityDisplayNames['low'] ?? 'Düşük'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedPriority = 'medium';
              });
              Navigator.pop(context);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF9500),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(priorityDisplayNames['medium'] ?? 'Orta'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedPriority = 'high';
              });
              Navigator.pop(context);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF3B30),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(priorityDisplayNames['high'] ?? 'Yüksek'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedPriority = 'urgent';
              });
              Navigator.pop(context);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF3B30),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(priorityDisplayNames['urgent'] ?? 'Acil'),
              ],
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(context),
          isDestructiveAction: true,
          child: const Text('İptal'),
        ),
      ),
    );
  }
}

