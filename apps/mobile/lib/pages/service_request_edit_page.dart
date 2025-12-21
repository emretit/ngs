import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/service_request.dart';
import '../providers/service_request_provider.dart';
import '../providers/customer_provider.dart';
import '../providers/hr_provider.dart';
import '../providers/inventory_provider.dart';
import '../providers/pdf_template_provider.dart';
import '../services/service_request_service.dart';
import '../services/auth_service.dart';
import '../services/service_slip_pdf_service.dart';
import '../models/employee.dart';
import '../models/product.dart';
import '../models/customer.dart';
import '../models/pdf_template.dart';
import 'dart:typed_data';
import '../shared/widgets/service_form_widgets.dart';
import 'service_request_edit/service_request_edit_app_bar.dart';
import 'service_request_edit/service_request_edit_date_section.dart';
import 'service_request_edit/service_request_edit_customer_section.dart';
import 'service_request_edit/service_request_edit_basic_info_section.dart';
import 'service_request_edit/service_request_edit_products_section.dart';
import 'service_request_edit/service_request_edit_details_section.dart';
import 'service_request_edit/service_request_edit_selectors.dart';

class ServiceRequestEditPage extends ConsumerStatefulWidget {
  final String id;

  const ServiceRequestEditPage({
    super.key,
    required this.id,
  });

  @override
  ConsumerState<ServiceRequestEditPage> createState() => _ServiceRequestEditPageState();
}

class _ServiceRequestEditPageState extends ConsumerState<ServiceRequestEditPage> {
  final _formKey = GlobalKey<FormState>();
  
  // Temel bilgiler
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
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
  String? _selectedPdfTemplateId;
  bool _isGeneratingPdf = false;
  DateTime? _reportedDate;
  DateTime? _serviceStartDate;
  TimeOfDay? _serviceStartTime;
  DateTime? _serviceEndDate;
  TimeOfDay? _serviceEndTime;
  bool _isSaving = false;
  bool _isInitialized = false;

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
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
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
    final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
    if (serviceRequest != null && !_isInitialized) {
      setState(() {
        _titleController.text = serviceRequest.title;
        _descriptionController.text = serviceRequest.description ?? '';
        _locationController.text = serviceRequest.location ?? '';
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
        _serviceStartDate = serviceRequest.serviceStartDate;
        _serviceEndDate = serviceRequest.serviceEndDate;

        // Müşteri bilgilerini customerData'dan doldur
        if (serviceRequest.customerData != null) {
          final customerData = serviceRequest.customerData!;
          if (customerData['name'] != null && _contactPersonController.text.isEmpty) {
            _contactPersonController.text = customerData['name'].toString();
          }
          if (customerData['phone'] != null && _contactPhoneController.text.isEmpty) {
            _contactPhoneController.text = customerData['phone'].toString();
          }
          if (customerData['email'] != null && _contactEmailController.text.isEmpty) {
            _contactEmailController.text = customerData['email'].toString();
          }
          if (customerData['address'] != null && _locationController.text.isEmpty) {
            _locationController.text = customerData['address'].toString();
          }
        }

        // Teslim saati kaldırıldı

        if (serviceRequest.serviceStartDate != null) {
          _serviceStartTime = TimeOfDay.fromDateTime(serviceRequest.serviceStartDate!);
        }

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
            _isInitialized = true;
          });
        }
      } catch (e) {
        if (mounted && serviceRequest.serviceDetails != null && 
            serviceRequest.serviceDetails!['used_products'] != null) {
          setState(() {
            _usedProducts = List<Map<String, dynamic>>.from(
              serviceRequest.serviceDetails!['used_products']
            );
            _isInitialized = true;
          });
        } else {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final serviceRequestAsync = ref.watch(serviceRequestByIdProvider(widget.id));
    final statusDisplayNames = ref.watch(serviceRequestStatusDisplayNamesProvider);
    final priorityDisplayNames = ref.watch(serviceRequestPriorityDisplayNamesProvider);
    final customersAsync = ref.watch(customersProvider);
    final techniciansAsync = ref.watch(techniciansProvider);
    final employeesAsync = ref.watch(employeesProvider);

    return Scaffold(
      backgroundColor: ServiceFormStyles.backgroundColor,
      appBar: ServiceRequestEditAppBar(
        serviceRequestId: widget.id,
        isSaving: _isSaving,
        isGeneratingPdf: _isGeneratingPdf,
        onPrint: _printServiceSlip,
      ),
      body: serviceRequestAsync.when(
        data: (serviceRequest) {
          if (serviceRequest == null) {
            return ServiceEmptyState(
              title: 'Servis talebi bulunamadı',
              subtitle: 'Bu servis talebi silinmiş veya mevcut değil.',
              icon: CupertinoIcons.exclamationmark_triangle,
              iconColor: ServiceFormStyles.warningColor,
              buttonLabel: 'Geri Dön',
              onButtonPressed: () => context.go('/service/management'),
            );
          }

          if (!_isInitialized) {
            _loadServiceRequest();
          }

          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Tarih Bilgileri
                  ServiceRequestEditDateSection(
                    reportedDate: _reportedDate,
                    dueDate: _dueDate,
                    serviceStartDate: _serviceStartDate,
                    serviceEndDate: _serviceEndDate,
                    onSelectReportedDate: _selectReportedDate,
                    onSelectDueDate: _selectDueDate,
                    onSelectServiceStartDate: _selectServiceStartDate,
                    onSelectServiceEndDate: _selectServiceEndDate,
                  ),
                  const SizedBox(height: 12),

                  // 2. Müşteri ve Temel Bilgiler (2 kolonlu - web gibi)
                  _buildCustomerAndBasicInfoRow(
                    customersAsync,
                    employeesAsync,
                    priorityDisplayNames,
                    statusDisplayNames,
                    techniciansAsync,
                  ),
                  const SizedBox(height: 12),

                  // 3. Kullanılan Ürünler
                  ServiceRequestEditProductsSection(
                    usedProducts: _usedProducts,
                    onAddProduct: _showProductSelectionDialog,
                    onRemoveProduct: _removeProduct,
                  ),
                  const SizedBox(height: 12),

                  // 4. Servis Açıklaması, Garanti, Dosyalar ve Notlar
                  ServiceRequestEditDetailsSection(
                    serviceResultController: _serviceResultController,
                    warrantyNotesController: _warrantyNotesController,
                    notesController: _notesController,
                    isUnderWarranty: _isUnderWarranty,
                    warrantyStartDate: _warrantyStartDate,
                    warrantyEndDate: _warrantyEndDate,
                    attachments: _attachments,
                    onWarrantyChanged: (value) {
                      setState(() {
                        _isUnderWarranty = value;
                      });
                    },
                    onWarrantyStartDateSelected: (date) {
                      setState(() {
                        _warrantyStartDate = date;
                      });
                    },
                    onWarrantyEndDateSelected: (date) {
                      setState(() {
                        _warrantyEndDate = date;
                      });
                    },
                    onRemoveAttachment: (file) {
                      setState(() {
                        _attachments.remove(file);
                      });
                    },
                    onAddAttachment: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Dosya ekleme özelliği yakında eklenecek'),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),

                  // Kaydet Butonu
                  ServicePrimaryButton(
                    label: 'Değişiklikleri Kaydet',
                    icon: CupertinoIcons.checkmark_circle,
                    onPressed: _isSaving ? null : _saveChanges,
                    isLoading: _isSaving,
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (error, stack) => ServiceErrorState(
          error: error.toString(),
          onRetry: () => ref.invalidate(serviceRequestByIdProvider(widget.id)),
        ),
      ),
    );
  }


  // Web gibi 2 kolonlu layout
  Widget _buildCustomerAndBasicInfoRow(
    AsyncValue<List<Customer>> customersAsync,
    AsyncValue<List<Employee>> employeesAsync,
    Map<String, String> priorityDisplayNames,
    Map<String, String> statusDisplayNames,
    AsyncValue<List<Map<String, dynamic>>> techniciansAsync,
  ) {
    // Mobil ekranlarda tek kolon, tablet/geniş ekranlarda 2 kolon
    final isWideScreen = MediaQuery.of(context).size.width > 600;

    final customerSection = ServiceRequestEditCustomerSection(
      contactPersonController: _contactPersonController,
      contactPhoneController: _contactPhoneController,
      contactEmailController: _contactEmailController,
      locationController: _locationController,
      customersAsync: customersAsync,
      employeesAsync: employeesAsync,
      selectedCustomerId: _selectedCustomerId,
      selectedReceivedBy: _selectedReceivedBy,
      onCustomerSelected: (id) {
        setState(() {
          _selectedCustomerId = id;
          _selectedSupplierId = null;
        });
      },
      onShowCustomerPicker: _showCustomerPicker,
      onShowEmployeePicker: _showEmployeePicker,
    );

    final basicInfoSection = ServiceRequestEditBasicInfoSection(
      titleController: _titleController,
      descriptionController: _descriptionController,
      locationController: _locationController,
      serviceNumberController: _serviceNumberController,
      selectedServiceType: _selectedServiceType,
      selectedPriority: _selectedPriority,
      selectedStatus: _selectedStatus,
      selectedTechnicianId: _selectedTechnicianId,
      serviceTypes: _serviceTypes,
      priorityDisplayNames: priorityDisplayNames,
      statusDisplayNames: statusDisplayNames,
      techniciansAsync: techniciansAsync,
      onServiceTypeChanged: (value) {
        setState(() {
          _selectedServiceType = value;
        });
      },
      onPriorityChanged: (value) {
        setState(() {
          _selectedPriority = value;
        });
      },
      onStatusChanged: (value) {
        setState(() {
          _selectedStatus = value;
        });
      },
      onTechnicianChanged: (value) {
        setState(() {
          _selectedTechnicianId = value;
        });
      },
    );

    if (isWideScreen) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: customerSection),
          const SizedBox(width: 12),
          Expanded(child: basicInfoSection),
        ],
      );
    } else {
      return Column(
        children: [
          customerSection,
          const SizedBox(height: 12),
          basicInfoSection,
        ],
      );
    }
  }



  Future<void> _printServiceSlip(String? templateId) async {
    setState(() {
      _isGeneratingPdf = true;
    });

    try {
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
      if (serviceRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      final pdfService = ServiceSlipPdfService();
      Uint8List pdfBytes;
      
      try {
        pdfBytes = await pdfService.generateServiceSlipPdfFromWeb(
          serviceRequest,
          templateId: templateId,
        );
      } catch (webError) {
        print('Web PDF renderer failed, using local: $webError');
        pdfBytes = await pdfService.generateServiceSlipPdf(serviceRequest);
      }

      final fileName = 'Servis_Fisi_${serviceRequest.serviceNumber ?? serviceRequest.id}.pdf';
      await pdfService.previewAndShare(pdfBytes, fileName);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PDF oluşturuldu'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('PDF oluşturma hatası: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingPdf = false;
        });
      }
    }
  }


  void _showCustomerPicker(List<Customer> customers) {
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
                          final phone = customer.mobilePhone ?? customer.officePhone;
                          if (phone != null) {
                            _contactPhoneController.text = phone;
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

  Future<void> _selectReportedDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _reportedDate ?? DateTime.now(),
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

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
      if (serviceRequest == null) {
        throw Exception('Servis talebi bulunamadı');
      }

      // Teslim saati kaldırıldı, sadece tarih kullanılıyor
      DateTime? finalDueDate = _dueDate;

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

      final updatedRequest = ServiceRequest(
        id: widget.id,
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
        reportedDate: _reportedDate ?? serviceRequest.reportedDate ?? DateTime.now(),
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
        attachments: _attachments.isNotEmpty ? _attachments : (serviceRequest.attachments.isNotEmpty ? serviceRequest.attachments : const []),
        createdAt: serviceRequest.createdAt,
        updatedAt: DateTime.now(),
        createdBy: serviceRequest.createdBy ?? currentUserId,
        serviceDetails: null,
        serviceNumber: _serviceNumberController.text.trim().isEmpty ? serviceRequest.serviceNumber : _serviceNumberController.text.trim(),
      );

      final service = ref.read(serviceRequestServiceProvider);
      await service.updateServiceRequest(widget.id, updatedRequest);
      
      await service.deleteAllServiceItems(widget.id);
      if (_usedProducts.isNotEmpty) {
        await service.addServiceItems(widget.id, _usedProducts);
      }

      ref.invalidate(serviceRequestByIdProvider(widget.id));
      ref.invalidate(serviceRequestsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Servis talebi başarıyla güncellendi')),
        );
        context.go('/service/detail/${widget.id}');
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
          _isSaving = false;
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
