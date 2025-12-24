import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/activity.dart';
import '../models/employee.dart';
import '../models/opportunity.dart';
import '../models/customer.dart';
import '../providers/activity_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/hr_provider.dart';
import '../providers/sales_provider.dart';
import '../providers/customer_provider.dart';
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
  String _selectedStatus = 'todo';
  DateTime? _dueDate;
  bool _isLoading = false;
  bool _isImportant = false;
  bool _isRecurring = false;
  String _recurrenceType = 'none';
  int _recurrenceInterval = 1;
  DateTime? _recurrenceEndDate;
  List<String> _recurrenceDays = [];
  int _recurrenceDayOfMonth = 1;
  
  String? _selectedAssigneeId;
  String? _selectedOpportunityId;
  String? _selectedCustomerId;

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
        _selectedStatus = activity.status;
        _dueDate = activity.dueDate;
        _isImportant = activity.isImportant ?? false;
        _isRecurring = activity.isRecurring ?? false;
        _recurrenceType = activity.recurrenceType ?? 'none';
        _recurrenceInterval = activity.recurrenceInterval ?? 1;
        _recurrenceEndDate = activity.recurrenceEndDate;
        _recurrenceDays = activity.recurrenceDays ?? [];
        _recurrenceDayOfMonth = activity.recurrenceDayOfMonth ?? 1;
        _selectedAssigneeId = activity.assigneeId;
        _selectedOpportunityId = activity.opportunityId;
        // Customer ID'yi related_item_id'den al (eğer related_item_type == 'customer' ise)
        if (activity.relatedItemType == 'customer') {
          _selectedCustomerId = activity.relatedItemId;
        }
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
          status: _selectedStatus,
          companyId: authState.user?.companyId,
          userId: authState.user?.id,
          assigneeId: _selectedAssigneeId,
          opportunityId: _selectedOpportunityId,
          relatedItemId: _selectedCustomerId,
          relatedItemType: _selectedCustomerId != null ? 'customer' : null,
          relatedItemTitle: null, // Customer name'i service'de çekilebilir
          isImportant: _isImportant,
          isRecurring: _isRecurring,
          recurrenceType: _isRecurring ? _recurrenceType : null,
          recurrenceInterval: _isRecurring && _recurrenceType == 'custom' ? _recurrenceInterval : null,
          recurrenceEndDate: _isRecurring && _recurrenceEndDate != null ? _recurrenceEndDate!.toIso8601String().split('T')[0] : null,
          recurrenceDays: _isRecurring && _recurrenceType == 'weekly' && _recurrenceDays.isNotEmpty ? _recurrenceDays : null,
          recurrenceDayOfMonth: _isRecurring && _recurrenceType == 'monthly' ? _recurrenceDayOfMonth : null,
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
          status: _selectedStatus,
          assigneeId: _selectedAssigneeId,
          opportunityId: _selectedOpportunityId,
          isImportant: _isImportant,
          isRecurring: _isRecurring,
          recurrenceType: _isRecurring ? _recurrenceType : null,
          recurrenceInterval: _isRecurring && _recurrenceType == 'custom' ? _recurrenceInterval : null,
          recurrenceEndDate: _isRecurring && _recurrenceEndDate != null ? _recurrenceEndDate!.toIso8601String().split('T')[0] : null,
          recurrenceDays: _isRecurring && _recurrenceType == 'weekly' && _recurrenceDays.isNotEmpty ? _recurrenceDays : null,
          recurrenceDayOfMonth: _isRecurring && _recurrenceType == 'monthly' ? _recurrenceDayOfMonth : null,
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
    final employeesAsync = ref.watch(employeesProvider);
    final opportunitiesAsync = ref.watch(opportunitiesProvider);
    final customersAsync = ref.watch(customersProvider);

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

              // Durum Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.circle_fill,
                title: 'Durum',
                subtitle: _getStatusLabel(_selectedStatus),
                onTap: () {
                  _showStatusPicker(context);
                },
                trailing: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _getStatusColor(_selectedStatus),
                    shape: BoxShape.circle,
                  ),
                ),
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
              const SizedBox(height: 8),

              // Görevli Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.person_fill,
                title: 'Görevli',
                subtitle: employeesAsync.when(
                  data: (employees) => _getAssigneeName(employees),
                  loading: () => 'Yükleniyor...',
                  error: (_, __) => 'Görevli seçin',
                ),
                onTap: () {
                  _showAssigneePicker(context);
                },
                trailing: _selectedAssigneeId != null
                    ? CupertinoButton(
                        onPressed: () {
                          setState(() {
                            _selectedAssigneeId = null;
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

              // Fırsat Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.chart_bar_alt_fill,
                title: 'Fırsat',
                subtitle: opportunitiesAsync.when(
                  data: (opportunities) => _getOpportunityName(opportunities),
                  loading: () => 'Yükleniyor...',
                  error: (_, __) => 'Fırsat seçin',
                ),
                onTap: () {
                  _showOpportunityPicker(context);
                },
                trailing: _selectedOpportunityId != null
                    ? CupertinoButton(
                        onPressed: () {
                          setState(() {
                            _selectedOpportunityId = null;
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

              // Müşteri Seçimi
              _buildOptionTile(
                icon: CupertinoIcons.person_2_fill,
                title: 'Müşteri',
                subtitle: customersAsync.when(
                  data: (customers) => _getCustomerName(customers),
                  loading: () => 'Yükleniyor...',
                  error: (_, __) => 'Müşteri seçin',
                ),
                onTap: () {
                  _showCustomerPicker(context);
                },
                trailing: _selectedCustomerId != null
                    ? CupertinoButton(
                        onPressed: () {
                          setState(() {
                            _selectedCustomerId = null;
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

              // Önemli Switch
              _buildSwitchTile(
                icon: CupertinoIcons.star_fill,
                title: 'Önemli',
                value: _isImportant,
                onChanged: (value) {
                  setState(() {
                    _isImportant = value;
                  });
                },
                activeColor: const Color(0xFFFFD700),
              ),
              const SizedBox(height: 8),

              // Tekrar Eden Görev Switch
              _buildSwitchTile(
                icon: CupertinoIcons.repeat,
                title: 'Tekrar Eden Görev',
                value: _isRecurring,
                onChanged: (value) {
                  setState(() {
                    _isRecurring = value;
                    if (!value) {
                      _recurrenceType = 'none';
                    }
                  });
                },
                activeColor: const Color(0xFF007AFF),
              ),

              // Tekrar Ayarları
              if (_isRecurring) ...[
                const SizedBox(height: 8),
                _buildRecurrenceSettings(),
              ],
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

  String _getStatusLabel(String status) {
    final statusDisplayNames = ref.read(activityStatusDisplayNamesProvider);
    return statusDisplayNames[status] ?? status;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'todo':
        return const Color(0xFFEF4444);
      case 'in_progress':
        return const Color(0xFFFF9500);
      case 'completed':
        return const Color(0xFF10B981);
      case 'cancelled':
        return const Color(0xFF8E8E93);
      default:
        return const Color(0xFF8E8E93);
    }
  }

  void _showStatusPicker(BuildContext context) {
    final statusDisplayNames = ref.read(activityStatusDisplayNamesProvider);
    
    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Durum Seç'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedStatus = 'todo';
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
                    color: Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(statusDisplayNames['todo'] ?? 'Yapılacak'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedStatus = 'in_progress';
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
                Text(statusDisplayNames['in_progress'] ?? 'Devam Ediyor'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedStatus = 'completed';
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
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(statusDisplayNames['completed'] ?? 'Tamamlandı'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _selectedStatus = 'cancelled';
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
                    color: Color(0xFF8E8E93),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Text(statusDisplayNames['cancelled'] ?? 'İptal Edildi'),
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

  String _getAssigneeName(List<Employee>? employees) {
    if (_selectedAssigneeId == null) return 'Görevli seçin';
    if (employees == null) return 'Yükleniyor...';
    try {
      final employee = employees.firstWhere(
        (e) => e.id == _selectedAssigneeId,
      );
      return '${employee.firstName} ${employee.lastName}';
    } catch (_) {
      return 'Görevli seçin';
    }
  }

  void _showAssigneePicker(BuildContext context) async {
    try {
      final employeesAsync = ref.read(employeesProvider);
      employeesAsync.when(
        data: (employees) {
          if (!mounted) return;
          showCupertinoModalPopup(
            context: context,
            builder: (context) => CupertinoActionSheet(
              title: const Text('Görevli Seç'),
              actions: [
                ...employees.map((employee) => CupertinoActionSheetAction(
                  onPressed: () {
                    setState(() {
                      _selectedAssigneeId = employee.id;
                    });
                    Navigator.pop(context);
                  },
                  child: Text('${employee.firstName} ${employee.lastName}'),
                )),
              ],
              cancelButton: CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(context),
                isDestructiveAction: true,
                child: const Text('İptal'),
              ),
            ),
          );
        },
        loading: () {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Çalışanlar yükleniyor...')),
            );
          }
        },
        error: (_, __) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Çalışanlar yüklenemedi')),
            );
          }
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Çalışanlar yüklenemedi')),
        );
      }
    }
  }

  String _getOpportunityName(List<Opportunity>? opportunities) {
    if (_selectedOpportunityId == null) return 'Fırsat seçin';
    if (opportunities == null) return 'Yükleniyor...';
    try {
      final opportunity = opportunities.firstWhere(
        (o) => o.id == _selectedOpportunityId,
      );
      return opportunity.title;
    } catch (_) {
      return 'Fırsat seçin';
    }
  }

  void _showOpportunityPicker(BuildContext context) async {
    try {
      final opportunitiesAsync = ref.read(opportunitiesProvider);
      opportunitiesAsync.when(
        data: (opportunities) {
          if (!mounted) return;
          showCupertinoModalPopup(
            context: context,
            builder: (context) => CupertinoActionSheet(
              title: const Text('Fırsat Seç'),
              actions: [
                ...opportunities.map((opportunity) => CupertinoActionSheetAction(
                  onPressed: () {
                    setState(() {
                      _selectedOpportunityId = opportunity.id;
                    });
                    Navigator.pop(context);
                  },
                  child: Text(opportunity.title),
                )),
              ],
              cancelButton: CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(context),
                isDestructiveAction: true,
                child: const Text('İptal'),
              ),
            ),
          );
        },
        loading: () {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Fırsatlar yükleniyor...')),
            );
          }
        },
        error: (_, __) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Fırsatlar yüklenemedi')),
            );
          }
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Fırsatlar yüklenemedi')),
        );
      }
    }
  }

  String _getCustomerName(List<Customer>? customers) {
    if (_selectedCustomerId == null) return 'Müşteri seçin';
    if (customers == null) return 'Yükleniyor...';
    try {
      final customer = customers.firstWhere(
        (c) => c.id == _selectedCustomerId,
      );
      return customer.name;
    } catch (_) {
      return 'Müşteri seçin';
    }
  }

  void _showCustomerPicker(BuildContext context) async {
    try {
      final customersAsync = ref.read(customersProvider);
      customersAsync.when(
        data: (customers) {
          if (!mounted) return;
          showCupertinoModalPopup(
            context: context,
            builder: (context) => CupertinoActionSheet(
              title: const Text('Müşteri Seç'),
              actions: [
                ...customers.map((customer) => CupertinoActionSheetAction(
                  onPressed: () {
                    setState(() {
                      _selectedCustomerId = customer.id;
                    });
                    Navigator.pop(context);
                  },
                  child: Text(customer.name),
                )),
              ],
              cancelButton: CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(context),
                isDestructiveAction: true,
                child: const Text('İptal'),
              ),
            ),
          );
        },
        loading: () {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Müşteriler yükleniyor...')),
            );
          }
        },
        error: (_, __) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Müşteriler yüklenemedi')),
            );
          }
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Müşteriler yüklenemedi')),
        );
      }
    }
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
    required Color activeColor,
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
          onTap: () => onChanged(!value),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: value
                        ? activeColor.withOpacity(0.15)
                        : const Color(0xFF007AFF).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    icon,
                    color: value ? activeColor : const Color(0xFF007AFF),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: value ? activeColor : const Color(0xFF000000),
                    ),
                  ),
                ),
                CupertinoSwitch(
                  value: value,
                  onChanged: onChanged,
                  activeColor: activeColor,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRecurrenceSettings() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF007AFF).withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF007AFF).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOptionTile(
            icon: CupertinoIcons.repeat,
            title: 'Tekrar Türü',
            subtitle: _getRecurrenceTypeLabel(_recurrenceType),
            onTap: () {
              _showRecurrenceTypePicker(context);
            },
            trailing: null,
          ),
          if (_recurrenceType == 'custom') ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Text(
                    'Her kaç günde:',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8E8E93),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CupertinoTextField(
                      keyboardType: TextInputType.number,
                      placeholder: '1',
                      textAlign: TextAlign.right,
                      onChanged: (value) {
                        setState(() {
                          _recurrenceInterval = int.tryParse(value) ?? 1;
                        });
                      },
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_recurrenceType == 'monthly') ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Text(
                    'Ayın günü:',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8E8E93),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CupertinoTextField(
                      keyboardType: TextInputType.number,
                      placeholder: '1',
                      textAlign: TextAlign.right,
                      onChanged: (value) {
                        setState(() {
                          _recurrenceDayOfMonth = int.tryParse(value) ?? 1;
                        });
                      },
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_recurrenceType == 'weekly') ...[
            const SizedBox(height: 8),
            _buildWeekDaysSelector(),
          ],
          const SizedBox(height: 8),
          _buildOptionTile(
            icon: CupertinoIcons.calendar,
            title: 'Bitiş Tarihi',
            subtitle: _recurrenceEndDate != null
                ? DateFormat('d MMMM yyyy', 'tr_TR').format(_recurrenceEndDate!)
                : 'Bitiş tarihi seçin (opsiyonel)',
            onTap: () async {
              final DateTime? picked = await showDatePicker(
                context: context,
                initialDate: _recurrenceEndDate ?? DateTime.now().add(const Duration(days: 30)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
                locale: const Locale('tr', 'TR'),
              );
              if (picked != null) {
                setState(() {
                  _recurrenceEndDate = picked;
                });
              }
            },
            trailing: _recurrenceEndDate != null
                ? CupertinoButton(
                    onPressed: () {
                      setState(() {
                        _recurrenceEndDate = null;
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
        ],
      ),
    );
  }

  String _getRecurrenceTypeLabel(String type) {
    switch (type) {
      case 'none':
        return 'Tekrarlanmaz';
      case 'daily':
        return 'Günlük';
      case 'weekly':
        return 'Haftalık';
      case 'monthly':
        return 'Aylık';
      case 'custom':
        return 'Özel Aralık';
      default:
        return type;
    }
  }

  void _showRecurrenceTypePicker(BuildContext context) {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Tekrar Türü Seç'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _recurrenceType = 'none';
              });
              Navigator.pop(context);
            },
            child: const Text('Tekrarlanmaz'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _recurrenceType = 'daily';
              });
              Navigator.pop(context);
            },
            child: const Text('Günlük'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _recurrenceType = 'weekly';
              });
              Navigator.pop(context);
            },
            child: const Text('Haftalık'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _recurrenceType = 'monthly';
              });
              Navigator.pop(context);
            },
            child: const Text('Aylık'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _recurrenceType = 'custom';
              });
              Navigator.pop(context);
            },
            child: const Text('Özel Aralık'),
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

  Widget _buildWeekDaysSelector() {
    final weekDays = [
      {'key': 'monday', 'label': 'Pzt'},
      {'key': 'tuesday', 'label': 'Sal'},
      {'key': 'wednesday', 'label': 'Çar'},
      {'key': 'thursday', 'label': 'Per'},
      {'key': 'friday', 'label': 'Cum'},
      {'key': 'saturday', 'label': 'Cmt'},
      {'key': 'sunday', 'label': 'Paz'},
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: weekDays.map((day) {
        final isSelected = _recurrenceDays.contains(day['key']);
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                _recurrenceDays.remove(day['key']);
              } else {
                _recurrenceDays.add(day['key']!);
              }
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFF007AFF)
                  : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF007AFF)
                    : Colors.grey.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Text(
              day['label']!,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF000000),
              ),
            ),
          ),
        );
      }).toList(),
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

