import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/service_request.dart';
import '../providers/service_request_provider.dart';
import '../providers/customer_provider.dart';
import '../providers/hr_provider.dart';
import '../providers/inventory_provider.dart';
import '../services/auth_service.dart';
import '../models/employee.dart';
import '../models/product.dart';
import '../shared/widgets/service_form_widgets.dart';

class ServiceRequestFormPage extends ConsumerStatefulWidget {
  final String? id;

  const ServiceRequestFormPage({
    super.key,
    this.id,
  });

  @override
  ConsumerState<ServiceRequestFormPage> createState() => _ServiceRequestFormPageState();
}

class _ServiceRequestFormPageState extends ConsumerState<ServiceRequestFormPage> {
  final _formKey = GlobalKey<FormState>();
  
  // Temel bilgiler
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _slipNumberController = TextEditingController();
  final _serviceNumberController = TextEditingController();
  
  // İletişim bilgileri
  final _contactPersonController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _contactEmailController = TextEditingController();
  
  // Notlar ve sonuç
  final _notesController = TextEditingController();
  final _serviceResultController = TextEditingController();

  String _selectedPriority = 'medium';
  String _selectedStatus = 'new';
  String _selectedServiceType = '';
  String? _selectedCustomerId;
  String? _selectedSupplierId;
  String? _selectedTechnicianId;
  String? _selectedReceivedBy;
  DateTime? _dueDate;
  TimeOfDay? _dueTime;
  DateTime _reportedDate = DateTime.now();
  DateTime? _serviceStartDate;
  TimeOfDay? _serviceStartTime;
  DateTime? _serviceEndDate;
  TimeOfDay? _serviceEndTime;
  bool _isLoading = false;

  List<Map<String, dynamic>> _usedProducts = [];

  // Warranty bilgileri
  bool _isUnderWarranty = false;
  final _warrantyNotesController = TextEditingController();
  DateTime? _warrantyStartDate;
  DateTime? _warrantyEndDate;

  // Attachments
  List<Map<String, dynamic>> _attachments = [];

  final List<Map<String, String>> _serviceTypes = [
    {'value': 'bakım', 'label': 'Bakım'},
    {'value': 'onarım', 'label': 'Onarım'},
    {'value': 'kurulum', 'label': 'Kurulum'},
    {'value': 'yazılım', 'label': 'Yazılım'},
    {'value': 'donanım', 'label': 'Donanım'},
    {'value': 'ağ', 'label': 'Ağ'},
    {'value': 'güvenlik', 'label': 'Güvenlik'},
    {'value': 'diğer', 'label': 'Diğer'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.id != null) {
      _loadServiceRequest();
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _slipNumberController.dispose();
    _serviceNumberController.dispose();
    _contactPersonController.dispose();
    _contactPhoneController.dispose();
    _contactEmailController.dispose();
    _notesController.dispose();
    _serviceResultController.dispose();
    _warrantyNotesController.dispose();
    super.dispose();
  }

  Future<void> _loadServiceRequest() async {
    final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id!).future);
    if (serviceRequest != null) {
      setState(() {
        _titleController.text = serviceRequest.title;
        _descriptionController.text = serviceRequest.description ?? '';
        _locationController.text = serviceRequest.location ?? '';
        _slipNumberController.text = serviceRequest.slipNumber ?? '';
        _serviceNumberController.text = serviceRequest.serviceNumber ?? '';
        _contactPersonController.text = serviceRequest.contactPerson ?? '';
        _contactPhoneController.text = serviceRequest.contactPhone ?? '';
        _contactEmailController.text = serviceRequest.contactEmail ?? '';
        _notesController.text = serviceRequest.notes?.join('\n') ?? '';
        _serviceResultController.text = serviceRequest.serviceResult ?? '';
        _selectedPriority = serviceRequest.priority;
        _selectedStatus = serviceRequest.status;
        _selectedServiceType = serviceRequest.serviceType ?? '';
        _selectedCustomerId = serviceRequest.customerId;
        _selectedSupplierId = serviceRequest.supplierId;
        _selectedTechnicianId = serviceRequest.assignedTo;
        _selectedReceivedBy = serviceRequest.receivedBy;
        _dueDate = serviceRequest.dueDate;
        _reportedDate = serviceRequest.reportedDate ?? DateTime.now();

        if (serviceRequest.dueDate != null) {
          _dueTime = TimeOfDay.fromDateTime(serviceRequest.dueDate!);
        }

        _serviceStartDate = serviceRequest.serviceStartDate;
        if (serviceRequest.serviceStartDate != null) {
          _serviceStartTime = TimeOfDay.fromDateTime(serviceRequest.serviceStartDate!);
        }

        _serviceEndDate = serviceRequest.serviceEndDate;
        if (serviceRequest.serviceEndDate != null) {
          _serviceEndTime = TimeOfDay.fromDateTime(serviceRequest.serviceEndDate!);
        }

        // Warranty bilgilerini yükle
        if (serviceRequest.warrantyInfo != null) {
          _isUnderWarranty = serviceRequest.warrantyInfo!['is_under_warranty'] ?? false;
          if (serviceRequest.warrantyInfo!['warranty_start'] != null) {
            _warrantyStartDate = DateTime.tryParse(serviceRequest.warrantyInfo!['warranty_start']);
          }
          if (serviceRequest.warrantyInfo!['warranty_end'] != null) {
            _warrantyEndDate = DateTime.tryParse(serviceRequest.warrantyInfo!['warranty_end']);
          }
          _warrantyNotesController.text = serviceRequest.warrantyInfo!['warranty_notes'] ?? '';
        }

        // Attachments yükle
        if (serviceRequest.attachments.isNotEmpty) {
          _attachments = List<Map<String, dynamic>>.from(serviceRequest.attachments);
        }
      });
      
      try {
        final service = ref.read(serviceRequestServiceProvider);
        final serviceItems = await service.getServiceItems(serviceRequest.id);
        if (mounted) {
          setState(() {
            _usedProducts = serviceItems.map((item) {
              return {
                'id': item['id'],
                'product_id': item['product_id'],
                'name': item['name'] ?? '',
                'description': item['description'],
                'quantity': item['quantity'],
                'unit': item['unit'] ?? 'adet',
                'price': item['unit_price'] ?? item['total_price'] ?? 0,
                'unit_price': item['unit_price'] ?? 0,
                'total_price': item['total_price'] ?? 0,
                'tax_rate': item['tax_rate'] ?? 20,
                'discount_rate': item['discount_rate'] ?? 0,
              };
            }).toList();
          });
        }
      } catch (e) {
        if (mounted && serviceRequest.serviceDetails != null && 
            serviceRequest.serviceDetails!['used_products'] != null) {
          setState(() {
            _usedProducts = List<Map<String, dynamic>>.from(
              serviceRequest.serviceDetails!['used_products']
            );
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final priorities = ref.watch(serviceRequestPrioritiesProvider);
    final statuses = ref.watch(serviceRequestStatusesProvider);
    final priorityDisplayNames = ref.watch(serviceRequestPriorityDisplayNamesProvider);
    final statusDisplayNames = ref.watch(serviceRequestStatusDisplayNamesProvider);
    final customersAsync = ref.watch(customersProvider);
    final techniciansAsync = ref.watch(techniciansProvider);
    final employeesAsync = ref.watch(employeesProvider);

    return Scaffold(
      backgroundColor: ServiceFormStyles.backgroundColor,
      appBar: _buildAppBar(),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Tarih Bilgileri (Compact)
              _buildDateSection(),
              const SizedBox(height: 12),

              // 2. Müşteri ve Temel Bilgiler (2 kolonlu - web gibi)
              _buildCustomerAndBasicInfoRow(
                customersAsync,
                employeesAsync,
                priorities,
                priorityDisplayNames,
                statuses,
                statusDisplayNames,
                techniciansAsync,
              ),
              const SizedBox(height: 12),

              // 3. Kullanılan Ürünler
              _buildProductsSection(),
              const SizedBox(height: 12),

              // 4. Servis Açıklaması, Garanti, Dosyalar ve Notlar
              _buildServiceDetailsSection(),
              const SizedBox(height: 20),

              // Kaydet Butonu
              ServicePrimaryButton(
                label: widget.id == null ? 'Servis Talebini Oluştur' : 'Değişiklikleri Kaydet',
                icon: widget.id == null ? CupertinoIcons.add_circled : CupertinoIcons.checkmark_circle,
                onPressed: _isLoading ? null : _saveServiceRequest,
                isLoading: _isLoading,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      leading: IconButton(
        icon: const Icon(CupertinoIcons.back, size: 20),
        onPressed: () {
          if (Navigator.of(context).canPop()) {
            context.pop();
          } else {
            context.go('/service/management');
          }
        },
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: ServiceFormStyles.primaryColor.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              widget.id == null ? CupertinoIcons.wrench : CupertinoIcons.pencil,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.id == null ? 'Yeni Servis Talebi' : 'Servis Talebini Düzenle',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.3,
                    color: ServiceFormStyles.textPrimary,
                  ),
                ),
                Text(
                  widget.id == null ? 'Yeni servis kaydı oluşturun' : 'Değişiklikleri kaydedin',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: ServiceFormStyles.textSecondary.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      backgroundColor: Colors.white,
      foregroundColor: ServiceFormStyles.textPrimary,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      actions: [
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.all(16),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CupertinoActivityIndicator(
                color: ServiceFormStyles.primaryColor,
              ),
            ),
          ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          color: Colors.grey.withOpacity(0.1),
          height: 1,
        ),
      ),
    );
  }

  // Web gibi 2 kolonlu layout
  Widget _buildCustomerAndBasicInfoRow(
    AsyncValue<List<dynamic>> customersAsync,
    AsyncValue<List<Employee>> employeesAsync,
    List<String> priorities,
    Map<String, String> priorityDisplayNames,
    List<String> statuses,
    Map<String, String> statusDisplayNames,
    AsyncValue<List<Map<String, dynamic>>> techniciansAsync,
  ) {
    // Mobil ekranlarda tek kolon, tablet/geniş ekranlarda 2 kolon
    final isWideScreen = MediaQuery.of(context).size.width > 600;

    if (isWideScreen) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildCustomerSection(customersAsync, employeesAsync)),
          const SizedBox(width: 12),
          Expanded(child: _buildBasicInfoSection(
            priorities, priorityDisplayNames, statuses, statusDisplayNames, techniciansAsync,
          )),
        ],
      );
    } else {
      return Column(
        children: [
          _buildCustomerSection(customersAsync, employeesAsync),
          const SizedBox(height: 12),
          _buildBasicInfoSection(
            priorities, priorityDisplayNames, statuses, statusDisplayNames, techniciansAsync,
          ),
        ],
      );
    }
  }

  Widget _buildBasicInfoSection(
    List<String> priorities,
    Map<String, String> priorityDisplayNames,
    List<String> statuses,
    Map<String, String> statusDisplayNames,
    AsyncValue<List<Map<String, dynamic>>> techniciansAsync,
  ) {
    return ServiceFormSection(
      title: 'Temel Bilgiler',
      icon: CupertinoIcons.doc_text,
      iconColor: ServiceFormStyles.infoColor,
      children: [
        ServiceFormTextField(
          controller: _titleController,
          label: 'Servis Başlığı *',
          hint: 'Örn: Klima bakımı, Elektrik arızası...',
          icon: CupertinoIcons.textformat,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Başlık gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 10),

        ServiceFormTextField(
          controller: _descriptionController,
          label: 'Servis Açıklaması *',
          hint: 'Servisin detaylarını, yapılması gereken işlemleri açıklayın...',
          icon: CupertinoIcons.text_alignleft,
          maxLines: 3,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Açıklama gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(child: _buildServiceTypeDropdown()),
            const SizedBox(width: 10),
            Expanded(child: _buildPriorityDropdown(priorities, priorityDisplayNames)),
          ],
        ),

        if (widget.id != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _buildStatusDropdown(statuses, statusDisplayNames)),
              const SizedBox(width: 10),
              Expanded(child: _buildTechnicianSelector(techniciansAsync)),
            ],
          ),
        ] else ...[
          const SizedBox(height: 10),
          _buildTechnicianSelector(techniciansAsync),
        ],
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              flex: 2,
              child: ServiceFormTextField(
                controller: _locationController,
                label: 'Lokasyon',
                hint: 'Servis yapılacak adres',
                icon: CupertinoIcons.location,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceFormTextField(
                controller: _serviceNumberController,
                label: 'Servis No',
                hint: 'Otomatik',
                icon: CupertinoIcons.number_square,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCustomerSection(AsyncValue<List<dynamic>> customersAsync, AsyncValue<List<Employee>> employeesAsync) {
    return ServiceFormSection(
      title: 'Müşteri ve İletişim',
      icon: CupertinoIcons.person_2,
      iconColor: ServiceFormStyles.successColor,
      children: [
        _buildCustomerSelector(customersAsync),
        const SizedBox(height: 10),

        ServiceFormTextField(
          controller: _contactPersonController,
          label: 'İletişim Kişisi',
          hint: 'Ad Soyad',
          icon: CupertinoIcons.person,
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: ServiceFormTextField(
                controller: _contactPhoneController,
                label: 'Telefon',
                hint: '0(555) 123 45 67',
                icon: CupertinoIcons.phone,
                keyboardType: TextInputType.phone,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceFormTextField(
                controller: _contactEmailController,
                label: 'E-posta',
                hint: 'email@ornek.com',
                icon: CupertinoIcons.mail,
                keyboardType: TextInputType.emailAddress,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        _buildReceivedBySelector(employeesAsync),
      ],
    );
  }

  Widget _buildDateSection() {
    return ServiceFormSection(
      title: 'Tarih Bilgileri',
      icon: CupertinoIcons.calendar,
      iconColor: ServiceFormStyles.purpleColor,
      children: [
        Row(
          children: [
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Bildirim Tarihi',
                date: _reportedDate,
                onTap: _selectReportedDate,
                icon: CupertinoIcons.calendar_today,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Hedef Teslim',
                date: _dueDate,
                onTap: _selectDueDate,
                icon: CupertinoIcons.calendar_badge_plus,
                isOptional: true,
              ),
            ),
            if (_dueDate != null) ...[
              const SizedBox(width: 10),
              Expanded(
                child: ServiceFormTimeSelector(
                  label: 'Teslim Saati',
                  time: _dueTime,
                  onTap: _selectDueTime,
                  icon: CupertinoIcons.clock,
                  enabled: true,
                ),
              ),
            ],
          ],
        ),
        if (widget.id != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ServiceFormDateSelector(
                  label: 'Başlama',
                  date: _serviceStartDate,
                  onTap: _selectServiceStartDate,
                  icon: CupertinoIcons.play_circle,
                  isOptional: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ServiceFormDateSelector(
                  label: 'Bitirme',
                  date: _serviceEndDate,
                  onTap: _selectServiceEndDate,
                  icon: CupertinoIcons.stop_circle,
                  isOptional: true,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildServiceDetailsSection() {
    return ServiceFormSection(
      title: 'Servis Açıklaması ve Garanti',
      icon: CupertinoIcons.doc_text_fill,
      iconColor: ServiceFormStyles.warningColor,
      children: [
        // Servis Sonucu
        ServiceFormTextField(
          controller: _serviceResultController,
          label: 'Servis Sonucu',
          hint: 'Servis sonucu veya ön görüş (opsiyonel)',
          icon: CupertinoIcons.checkmark_seal,
          maxLines: 2,
        ),
        const SizedBox(height: 10),
        // Garanti durumu switch
        Container(
          decoration: BoxDecoration(
            color: ServiceFormStyles.inputBackground,
            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            border: Border.all(
              color: Colors.grey.withOpacity(0.1),
              width: 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Icon(
                CupertinoIcons.shield_lefthalf_fill,
                color: _isUnderWarranty ? ServiceFormStyles.successColor : ServiceFormStyles.textSecondary,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Garanti Kapsamında',
                  style: TextStyle(
                    fontSize: ServiceFormStyles.bodySize,
                    fontWeight: FontWeight.w500,
                    color: _isUnderWarranty ? ServiceFormStyles.textPrimary : ServiceFormStyles.textSecondary,
                  ),
                ),
              ),
              CupertinoSwitch(
                value: _isUnderWarranty,
                activeColor: ServiceFormStyles.successColor,
                onChanged: (value) {
                  setState(() {
                    _isUnderWarranty = value;
                  });
                },
              ),
            ],
          ),
        ),

        if (_isUnderWarranty) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _warrantyStartDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setState(() {
                        _warrantyStartDate = picked;
                      });
                    }
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: ServiceFormStyles.inputBackground,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.calendar,
                          color: ServiceFormStyles.primaryColor,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Garanti Başlangıç',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.labelSize,
                                  color: ServiceFormStyles.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _warrantyStartDate != null
                                    ? '${_warrantyStartDate!.day.toString().padLeft(2, '0')}.${_warrantyStartDate!.month.toString().padLeft(2, '0')}.${_warrantyStartDate!.year}'
                                    : 'Tarih seçin',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.bodySize,
                                  color: _warrantyStartDate != null
                                      ? ServiceFormStyles.textPrimary
                                      : ServiceFormStyles.textSecondary.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _warrantyEndDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setState(() {
                        _warrantyEndDate = picked;
                      });
                    }
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: ServiceFormStyles.inputBackground,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.calendar,
                          color: ServiceFormStyles.primaryColor,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Garanti Bitiş',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.labelSize,
                                  color: ServiceFormStyles.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _warrantyEndDate != null
                                    ? '${_warrantyEndDate!.day.toString().padLeft(2, '0')}.${_warrantyEndDate!.month.toString().padLeft(2, '0')}.${_warrantyEndDate!.year}'
                                    : 'Tarih seçin',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.bodySize,
                                  color: _warrantyEndDate != null
                                      ? ServiceFormStyles.textPrimary
                                      : ServiceFormStyles.textSecondary.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ServiceFormTextField(
            controller: _warrantyNotesController,
            label: 'Garanti Notları',
            hint: 'Garanti ile ilgili özel notlar',
            icon: CupertinoIcons.text_alignleft,
            maxLines: 2,
          ),
        ],

        const SizedBox(height: 10),

        // Dosya ekleme bölümü
        Container(
          decoration: BoxDecoration(
            color: ServiceFormStyles.inputBackground,
            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    CupertinoIcons.paperclip,
                    color: ServiceFormStyles.primaryColor,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Dosyalar',
                      style: TextStyle(
                        fontSize: ServiceFormStyles.labelSize,
                        color: ServiceFormStyles.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  CupertinoButton(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    color: ServiceFormStyles.primaryColor,
                    borderRadius: BorderRadius.circular(8),
                    minSize: 0,
                    onPressed: () {
                      // TODO: Dosya ekleme işlemi (file_picker paketi gerekli)
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Dosya ekleme özelliği yakında eklenecek'),
                        ),
                      );
                    },
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(CupertinoIcons.add, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Dosya Ekle',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (_attachments.isEmpty) ...[
                const SizedBox(height: 8),
                const Text(
                  'Henüz dosya eklenmemiş',
                  style: TextStyle(
                    fontSize: ServiceFormStyles.captionSize,
                    color: ServiceFormStyles.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ] else ...[
                const SizedBox(height: 8),
                ..._attachments.map((file) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.doc,
                          size: 16,
                          color: ServiceFormStyles.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            file['name'] ?? 'Unknown',
                            style: const TextStyle(
                              fontSize: ServiceFormStyles.captionSize,
                              color: ServiceFormStyles.textPrimary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _attachments.remove(file);
                            });
                          },
                          child: const Icon(
                            CupertinoIcons.xmark_circle_fill,
                            size: 16,
                            color: ServiceFormStyles.errorColor,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ],
          ),
        ),

        const SizedBox(height: 10),

        // Şirket İçi Notlar
        ServiceFormTextField(
          controller: _notesController,
          label: 'Şirket İçi Notlar',
          hint: 'Her satır ayrı bir not olarak kaydedilir',
          icon: CupertinoIcons.text_alignleft,
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildProductsSection() {
    return ServiceFormSection(
      title: 'Kullanılan Ürünler',
      icon: CupertinoIcons.cube_box,
      iconColor: const Color(0xFF16A085),
      trailing: CupertinoButton(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        color: ServiceFormStyles.primaryColor,
        borderRadius: BorderRadius.circular(8),
        minSize: 0,
        onPressed: () => _showProductSelectionDialog(),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.add, color: Colors.white, size: 16),
            SizedBox(width: 4),
            Text(
              'Ürün Ekle',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
      children: [
        if (_usedProducts.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            ),
            child: const Column(
              children: [
                Icon(
                  CupertinoIcons.cube_box,
                  size: 32,
                  color: ServiceFormStyles.textSecondary,
                ),
                SizedBox(height: 8),
                Text(
                  'Henüz ürün eklenmemiş',
                  style: TextStyle(
                    color: ServiceFormStyles.textSecondary,
                    fontStyle: FontStyle.italic,
                    fontSize: ServiceFormStyles.bodySize,
                  ),
                ),
              ],
            ),
          )
        else
          ...(_usedProducts.asMap().entries.map((entry) {
            final index = entry.key;
            final product = entry.value;
            return ServiceProductItem(
              name: product['name'] ?? 'Bilinmeyen Ürün',
              description: product['description'],
              quantity: (product['quantity'] ?? 1).toDouble(),
              unit: product['unit'] ?? 'adet',
              price: (product['price'] ?? 0).toDouble(),
              onDelete: () => _removeProduct(index),
            );
          }).toList()),
      ],
    );
  }

  Widget _buildCustomerSelector(AsyncValue<List<dynamic>> customersAsync) {
    return customersAsync.when(
      data: (customers) {
        final selectedCustomer = _selectedCustomerId != null
            ? customers.firstWhere(
                (c) => c.id == _selectedCustomerId,
                orElse: () => null,
              )
            : null;

        return GestureDetector(
          onTap: () => _showCustomerPicker(customers),
          child: Container(
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
              border: Border.all(
                color: Colors.grey.withOpacity(0.1),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.person_crop_circle,
                  color: ServiceFormStyles.primaryColor,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Müşteri / Tedarikçi',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.labelSize,
                          color: ServiceFormStyles.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        selectedCustomer != null
                            ? selectedCustomer.name ?? 'İsimsiz Müşteri'
                            : 'Müşteri veya Tedarikçi seçin...',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.bodySize,
                          color: selectedCustomer != null
                              ? ServiceFormStyles.textPrimary
                              : ServiceFormStyles.textSecondary.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: ServiceFormStyles.textSecondary,
                  size: 16,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: Text('Müşteriler yüklenemedi: $error'),
      ),
    );
  }

  Widget _buildTechnicianSelector(AsyncValue<List<Map<String, dynamic>>> techniciansAsync) {
    return techniciansAsync.when(
      data: (technicians) {
        return ServiceFormDropdown<String>(
          value: _selectedTechnicianId ?? '',
          label: 'Teknisyen',
          icon: CupertinoIcons.wrench,
          items: [
            const DropdownMenuItem<String>(
              value: '',
              child: Text('Atanmamış'),
            ),
            ...technicians.map((t) {
              return DropdownMenuItem<String>(
                value: t['id'] as String,
                child: Text('${t['first_name']} ${t['last_name']}'),
              );
            }),
          ],
          onChanged: (value) {
            setState(() {
              _selectedTechnicianId = value?.isEmpty == true ? null : value;
            });
          },
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Text('Teknisyenler yüklenemedi'),
      ),
    );
  }

  Widget _buildReceivedBySelector(AsyncValue<List<Employee>> employeesAsync) {
    return employeesAsync.when(
      data: (employees) {
        Employee? selectedEmployee;
        if (_selectedReceivedBy != null) {
          try {
            selectedEmployee = employees.firstWhere((e) => e.id == _selectedReceivedBy);
          } catch (e) {
            selectedEmployee = null;
          }
        }

        return GestureDetector(
          onTap: () => _showEmployeePicker(employees),
          child: Container(
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
              border: Border.all(
                color: Colors.grey.withOpacity(0.1),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.person_badge_plus,
                  color: ServiceFormStyles.primaryColor,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Talebi Alan Kişi',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.labelSize,
                          color: ServiceFormStyles.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        selectedEmployee != null
                            ? '${selectedEmployee.firstName} ${selectedEmployee.lastName}'
                            : 'Talebi alan kişiyi seçin...',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.bodySize,
                          color: selectedEmployee != null
                              ? ServiceFormStyles.textPrimary
                              : ServiceFormStyles.textSecondary.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: ServiceFormStyles.textSecondary,
                  size: 16,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: Text('Çalışanlar yüklenemedi: $error'),
      ),
    );
  }

  Widget _buildServiceTypeDropdown() {
    return ServiceFormDropdown<String>(
      value: _selectedServiceType.isEmpty ? null : _selectedServiceType,
      label: 'Servis Türü',
      icon: CupertinoIcons.tag,
      hint: 'Servis türü seçin...',
      items: _serviceTypes.map((type) {
        return DropdownMenuItem(
          value: type['value'],
          child: Text(type['label']!),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedServiceType = value ?? '';
        });
      },
    );
  }

  Widget _buildPriorityDropdown(List<String> priorities, Map<String, String> displayNames) {
    final priorityColors = {
      'low': ServiceFormStyles.successColor,
      'medium': ServiceFormStyles.warningColor,
      'high': const Color(0xFFE67E22),
      'urgent': ServiceFormStyles.errorColor,
    };

    return ServiceFormDropdown<String>(
      value: _selectedPriority,
      label: 'Öncelik',
      icon: CupertinoIcons.exclamationmark_triangle,
      items: priorities.map((priority) {
        return DropdownMenuItem(
          value: priority,
          child: Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: priorityColors[priority] ?? Colors.grey,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(displayNames[priority] ?? priority),
            ],
          ),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedPriority = value!;
        });
      },
    );
  }

  Widget _buildStatusDropdown(List<String> statuses, Map<String, String> displayNames) {
    return ServiceFormDropdown<String>(
      value: _selectedStatus,
      label: 'Durum',
      icon: CupertinoIcons.checkmark_circle,
      items: statuses.map((status) {
        return DropdownMenuItem(
          value: status,
          child: Text(displayNames[status] ?? status),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedStatus = value!;
        });
      },
    );
  }

  void _showCustomerPicker(List<dynamic> customers) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Müşteri Seç',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(CupertinoIcons.xmark_circle_fill),
                      color: Colors.grey,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: customers.length,
                  itemBuilder: (context, index) {
                    final customer = customers[index];
                    final isSelected = customer.id == _selectedCustomerId;
                    
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isSelected
                            ? ServiceFormStyles.primaryColor
                            : ServiceFormStyles.inputBackground,
                        child: Text(
                          (customer.name ?? '?')[0].toUpperCase(),
                          style: TextStyle(
                            color: isSelected ? Colors.white : ServiceFormStyles.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      title: Text(
                        customer.name ?? 'İsimsiz Müşteri',
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                      subtitle: customer.email != null
                          ? Text(
                              customer.email!,
                              style: const TextStyle(fontSize: 12),
                            )
                          : null,
                      trailing: isSelected
                          ? const Icon(
                              CupertinoIcons.checkmark_circle_fill,
                              color: ServiceFormStyles.primaryColor,
                            )
                          : null,
                      onTap: () {
                        setState(() {
                          _selectedCustomerId = customer.id;
                          _selectedSupplierId = null;
                          
                          if (customer.name != null) {
                            _contactPersonController.text = customer.name!;
                          }
                          if (customer.phone != null) {
                            _contactPhoneController.text = customer.phone!;
                          }
                          if (customer.email != null) {
                            _contactEmailController.text = customer.email!;
                          }
                          if (customer.address != null) {
                            _locationController.text = customer.address!;
                          }
                        });
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEmployeePicker(List<Employee> employees) {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Colors.grey.withOpacity(0.2),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Talebi Alan Kişi Seç',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.pop(context),
                    child: const Text('İptal'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: employees.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    final isSelected = _selectedReceivedBy == null;
                    return ListTile(
                      leading: Icon(
                        CupertinoIcons.person_badge_plus,
                        color: isSelected ? ServiceFormStyles.primaryColor : Colors.grey,
                      ),
                      title: const Text('Seçiniz (Opsiyonel)'),
                      trailing: isSelected
                          ? const Icon(
                              CupertinoIcons.checkmark_circle_fill,
                              color: ServiceFormStyles.primaryColor,
                            )
                          : null,
                      onTap: () {
                        setState(() {
                          _selectedReceivedBy = null;
                        });
                        Navigator.pop(context);
                      },
                    );
                  }
                  
                  final employee = employees[index - 1];
                  final isSelected = _selectedReceivedBy == employee.id;
                  return ListTile(
                    leading: Icon(
                      CupertinoIcons.person_fill,
                      color: isSelected ? ServiceFormStyles.primaryColor : Colors.grey,
                    ),
                    title: Text('${employee.firstName} ${employee.lastName}'),
                    subtitle: employee.position != null
                        ? Text(employee.position!)
                        : null,
                    trailing: isSelected
                        ? const Icon(
                            CupertinoIcons.checkmark_circle_fill,
                            color: ServiceFormStyles.primaryColor,
                          )
                        : null,
                    onTap: () {
                      setState(() {
                        _selectedReceivedBy = employee.id;
                      });
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showProductSelectionDialog() async {
    showDialog(
      context: context,
      builder: (context) => _ProductSelectionDialog(
        onProductSelected: (product, quantity) {
          _addProduct(product, quantity);
        },
      ),
    );
  }

  void _addProduct(Map<String, dynamic> product, double quantity) {
    setState(() {
      _usedProducts.add({
        'id': product['id'],
        'product_id': product['id'],
        'name': product['name'],
        'description': product['description'],
        'unit': product['unit'] ?? 'adet',
        'quantity': quantity,
        'price': product['price'] ?? 0,
        'unit_price': product['price'] ?? 0,
        'tax_rate': 20,
        'discount_rate': 0,
      });
    });
  }

  void _removeProduct(int index) {
    setState(() {
      _usedProducts.removeAt(index);
    });
  }

  Future<void> _selectDueDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: ServiceFormStyles.primaryColor,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dueDate = picked;
      });
    }
  }

  Future<void> _selectDueTime() async {
    if (_dueDate == null) return;
    
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _dueTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: ServiceFormStyles.primaryColor,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dueTime = picked;
      });
    }
  }

  Future<void> _selectReportedDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _reportedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: ServiceFormStyles.primaryColor,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _reportedDate = picked;
      });
    }
  }

  Future<void> _selectServiceStartDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _serviceStartDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: ServiceFormStyles.primaryColor,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _serviceStartDate = picked;
      });
    }
  }

  Future<void> _selectServiceEndDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _serviceEndDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: ServiceFormStyles.primaryColor,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _serviceEndDate = picked;
      });
    }
  }

  Future<void> _saveServiceRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final service = ref.read(serviceRequestServiceProvider);

      DateTime? finalDueDate = _dueDate;
      if (_dueDate != null && _dueTime != null) {
        finalDueDate = DateTime(
          _dueDate!.year,
          _dueDate!.month,
          _dueDate!.day,
          _dueTime!.hour,
          _dueTime!.minute,
        );
      }

      DateTime? finalServiceStartDate = _serviceStartDate;
      if (_serviceStartDate != null && _serviceStartTime != null) {
        finalServiceStartDate = DateTime(
          _serviceStartDate!.year,
          _serviceStartDate!.month,
          _serviceStartDate!.day,
          _serviceStartTime!.hour,
          _serviceStartTime!.minute,
        );
      }

      DateTime? finalServiceEndDate = _serviceEndDate;
      if (_serviceEndDate != null && _serviceEndTime != null) {
        finalServiceEndDate = DateTime(
          _serviceEndDate!.year,
          _serviceEndDate!.month,
          _serviceEndDate!.day,
          _serviceEndTime!.hour,
          _serviceEndTime!.minute,
        );
      }

      final authService = AuthService();
      final currentUserInfo = await authService.getCurrentUserEmployeeInfo();
      final currentUserId = currentUserInfo?['id'];

      if (widget.id == null) {
        final serviceNumber = _serviceNumberController.text.trim().isEmpty 
            ? null 
            : _serviceNumberController.text.trim();
        
        // Warranty info hazırla
        Map<String, dynamic>? warrantyInfo;
        if (_isUnderWarranty) {
          warrantyInfo = {
            'is_under_warranty': true,
            'warranty_start': _warrantyStartDate?.toIso8601String(),
            'warranty_end': _warrantyEndDate?.toIso8601String(),
            'warranty_notes': _warrantyNotesController.text.isEmpty ? null : _warrantyNotesController.text,
          };
        }

        final serviceRequest = ServiceRequest(
          id: '',
          title: _titleController.text,
          description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
          serviceType: _selectedServiceType.isEmpty ? null : _selectedServiceType,
          location: _locationController.text.isEmpty ? null : _locationController.text,
          priority: _selectedPriority,
          status: _selectedStatus,
          customerId: _selectedCustomerId,
          supplierId: _selectedSupplierId,
          assignedTo: _selectedTechnicianId,
          dueDate: finalDueDate,
          reportedDate: _reportedDate,
          serviceStartDate: finalServiceStartDate,
          serviceEndDate: finalServiceEndDate,
          contactPerson: _contactPersonController.text.isEmpty ? null : _contactPersonController.text,
          contactPhone: _contactPhoneController.text.isEmpty ? null : _contactPhoneController.text,
          contactEmail: _contactEmailController.text.isEmpty ? null : _contactEmailController.text,
          receivedBy: _selectedReceivedBy,
          serviceResult: _serviceResultController.text.isEmpty ? null : _serviceResultController.text,
          notes: _notesController.text.isEmpty
              ? null
              : _notesController.text.split('\n').where((line) => line.trim().isNotEmpty).toList(),
          warrantyInfo: warrantyInfo,
          attachments: _attachments,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          createdBy: currentUserId,
          serviceDetails: null,
          serviceNumber: serviceNumber,
        );

        final createdRequest = await service.createServiceRequest(serviceRequest);
        
        if (_usedProducts.isNotEmpty) {
          await service.addServiceItems(createdRequest.id, _usedProducts);
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                createdRequest.serviceNumber != null
                    ? 'Servis talebi başarıyla oluşturuldu: ${createdRequest.serviceNumber}'
                    : 'Servis talebi başarıyla oluşturuldu',
              ),
              duration: const Duration(seconds: 3),
            ),
          );
          context.go('/service/management');
        }
      } else {
        final existingRequest = await ref.read(serviceRequestByIdProvider(widget.id!).future);

        // Warranty info hazırla
        Map<String, dynamic>? warrantyInfo;
        if (_isUnderWarranty) {
          warrantyInfo = {
            'is_under_warranty': true,
            'warranty_start': _warrantyStartDate?.toIso8601String(),
            'warranty_end': _warrantyEndDate?.toIso8601String(),
            'warranty_notes': _warrantyNotesController.text.isEmpty ? null : _warrantyNotesController.text,
          };
        }

        final serviceRequest = ServiceRequest(
          id: widget.id!,
          title: _titleController.text,
          description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
          serviceType: _selectedServiceType.isEmpty ? null : _selectedServiceType,
          location: _locationController.text.isEmpty ? null : _locationController.text,
          priority: _selectedPriority,
          status: _selectedStatus,
          customerId: _selectedCustomerId,
          supplierId: _selectedSupplierId,
          assignedTo: _selectedTechnicianId,
          dueDate: finalDueDate,
          reportedDate: _reportedDate,
          serviceStartDate: finalServiceStartDate,
          serviceEndDate: finalServiceEndDate,
          contactPerson: _contactPersonController.text.isEmpty ? null : _contactPersonController.text,
          contactPhone: _contactPhoneController.text.isEmpty ? null : _contactPhoneController.text,
          contactEmail: _contactEmailController.text.isEmpty ? null : _contactEmailController.text,
          receivedBy: _selectedReceivedBy,
          serviceResult: _serviceResultController.text.isEmpty ? null : _serviceResultController.text,
          notes: _notesController.text.isEmpty
              ? null
              : _notesController.text.split('\n').where((line) => line.trim().isNotEmpty).toList(),
          warrantyInfo: warrantyInfo,
          attachments: _attachments.isNotEmpty ? _attachments : (existingRequest?.attachments ?? const []),
          createdAt: existingRequest?.createdAt ?? DateTime.now(),
          updatedAt: DateTime.now(),
          createdBy: existingRequest?.createdBy ?? currentUserId,
          serviceDetails: null,
        );
        
        await service.updateServiceRequest(widget.id!, serviceRequest);
        
        await service.deleteAllServiceItems(widget.id!);
        if (_usedProducts.isNotEmpty) {
          await service.addServiceItems(widget.id!, _usedProducts);
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Servis talebi başarıyla güncellendi')),
          );
          context.go('/service/detail/${widget.id}');
        }
      }

      ref.invalidate(serviceRequestsProvider);
      if (widget.id != null) {
        ref.invalidate(serviceRequestByIdProvider(widget.id!));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
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
}

class _ProductSelectionDialog extends ConsumerStatefulWidget {
  final Function(Map<String, dynamic>, double) onProductSelected;

  const _ProductSelectionDialog({
    required this.onProductSelected,
  });

  @override
  ConsumerState<_ProductSelectionDialog> createState() => _ProductSelectionDialogState();
}

class _ProductSelectionDialogState extends ConsumerState<_ProductSelectionDialog> {
  final _searchController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  List<Product> _filteredProducts = [];
  Product? _selectedProduct;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_filterProducts);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  void _filterProducts() {
    final productsAsync = ref.read(productsProvider);
    productsAsync.whenData((products) {
      final query = _searchController.text.toLowerCase();
      setState(() {
        _filteredProducts = products.where((product) {
          return product.name.toLowerCase().contains(query) ||
                 (product.description?.toLowerCase().contains(query) ?? false);
        }).toList();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ServiceFormStyles.cardRadius),
      ),
      child: Container(
        height: 550,
        width: 380,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(ServiceFormStyles.cardRadius),
                  topRight: Radius.circular(ServiceFormStyles.cardRadius),
                ),
              ),
              child: Row(
                children: [
                  const Icon(CupertinoIcons.cube_box, color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Ürün Seç',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(
                      CupertinoIcons.xmark_circle_fill,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: ServiceFormTextField(
                controller: _searchController,
                label: 'Ürün ara...',
                icon: CupertinoIcons.search,
              ),
            ),
            
            Expanded(
              child: productsAsync.when(
                data: (products) {
                  if (_filteredProducts.isEmpty && _searchController.text.isEmpty) {
                    _filteredProducts = products;
                  }
                  
                  if (_filteredProducts.isEmpty) {
                    return const Center(
                      child: Text(
                        'Ürün bulunamadı',
                        style: TextStyle(
                          color: ServiceFormStyles.textSecondary,
                          fontSize: ServiceFormStyles.bodySize,
                        ),
                      ),
                    );
                  }
                  
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = _filteredProducts[index];
                      final isSelected = _selectedProduct?.id == product.id;
                      
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedProduct = product;
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: isSelected 
                              ? ServiceFormStyles.primaryColor.withOpacity(0.1) 
                              : Colors.white,
                            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                            border: Border.all(
                              color: isSelected 
                                ? ServiceFormStyles.primaryColor 
                                : Colors.grey.shade200,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: (isSelected 
                                      ? ServiceFormStyles.primaryColor 
                                      : ServiceFormStyles.successColor).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    CupertinoIcons.cube_box,
                                    color: isSelected 
                                      ? ServiceFormStyles.primaryColor 
                                      : ServiceFormStyles.successColor,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        product.name,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: ServiceFormStyles.titleSize,
                                          color: isSelected 
                                            ? ServiceFormStyles.primaryColor 
                                            : ServiceFormStyles.textPrimary,
                                        ),
                                      ),
                                      if (product.description != null && product.description!.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 2),
                                          child: Text(
                                            product.description!,
                                            style: const TextStyle(
                                              color: ServiceFormStyles.textSecondary,
                                              fontSize: ServiceFormStyles.captionSize,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          '${product.price} ₺',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: ServiceFormStyles.successColor,
                                            fontSize: ServiceFormStyles.labelSize,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(
                                    CupertinoIcons.checkmark_circle_fill,
                                    color: ServiceFormStyles.primaryColor,
                                    size: 24,
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CupertinoActivityIndicator()),
                error: (error, stack) => Center(
                  child: Text(
                    'Ürünler yüklenemedi',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ),
            ),
            
            if (_selectedProduct != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.inputBackground,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: ServiceFormTextField(
                        controller: _quantityController,
                        label: 'Miktar (${_selectedProduct!.unit ?? 'adet'})',
                        icon: CupertinoIcons.number,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      color: ServiceFormStyles.primaryColor,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
                      onPressed: () {
                        final quantity = double.tryParse(_quantityController.text) ?? 1;
                        widget.onProductSelected({
                          'id': _selectedProduct!.id,
                          'name': _selectedProduct!.name,
                          'description': _selectedProduct!.description,
                          'unit': _selectedProduct!.unit,
                          'price': _selectedProduct!.price,
                        }, quantity);
                        Navigator.pop(context);
                      },
                      child: const Text(
                        'Ekle',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: ServiceFormStyles.titleSize,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
