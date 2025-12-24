import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/service_request.dart';
import '../providers/service_request_provider.dart';
import '../services/service_request_service.dart';
import '../providers/auth_provider.dart';
import '../providers/inventory_provider.dart';
import '../models/product.dart';
import '../shared/widgets/service_form_widgets.dart';
import 'service_request_form/product_selection_dialog.dart';

class ServiceRequestDetailPage extends ConsumerStatefulWidget {
  final String id;

  const ServiceRequestDetailPage({
    super.key,
    required this.id,
  });

  @override
  ConsumerState<ServiceRequestDetailPage> createState() => _ServiceRequestDetailPageState();
}

class _ServiceRequestDetailPageState extends ConsumerState<ServiceRequestDetailPage> {
  // Servis fişi form controller'ları
  final _formKey = GlobalKey<FormState>();
  final _technicianNameController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _customerAddressController = TextEditingController();
  final _equipmentBrandController = TextEditingController();
  final _equipmentModelController = TextEditingController();
  final _equipmentSerialController = TextEditingController();
  final _problemDescriptionController = TextEditingController();
  final _servicePerformedController = TextEditingController();
  final _serviceSlipNotesController = TextEditingController();
  
  bool _isSlipLoading = false;
  String? _lastInitializedServiceId;
  String? _selectedTechnicianId;
  List<Map<String, dynamic>> _usedProducts = [];
  String? _previousStatus; // Önceki durumu takip et

  @override
  void dispose() {
    _technicianNameController.dispose();
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _customerAddressController.dispose();
    _equipmentBrandController.dispose();
    _equipmentModelController.dispose();
    _equipmentSerialController.dispose();
    _problemDescriptionController.dispose();
    _servicePerformedController.dispose();
    _serviceSlipNotesController.dispose();
    super.dispose();
  }

  Future<void> _initializeSlipFormData(ServiceRequest serviceRequest) async {
    if (_lastInitializedServiceId == serviceRequest.id) return;
    
    _technicianNameController.clear();
    _customerNameController.clear();
    _customerPhoneController.clear();
    _customerAddressController.clear();
    _equipmentBrandController.clear();
    _equipmentModelController.clear();
    _equipmentSerialController.clear();
    _problemDescriptionController.clear();
    _servicePerformedController.clear();
    _serviceSlipNotesController.clear();
    _usedProducts.clear();
    _selectedTechnicianId = null;
    
    if (serviceRequest.hasServiceSlip) {
      _technicianNameController.text = serviceRequest.technicianName ?? '';
      
      if (serviceRequest.customerData != null) {
        final customerData = serviceRequest.customerData!;
        _customerNameController.text = customerData['name']?.toString() ?? '';
        _customerPhoneController.text = customerData['phone']?.toString() ?? '';
        _customerAddressController.text = customerData['address']?.toString() ?? '';
      }
      
      if (serviceRequest.equipmentData != null) {
        final equipmentData = serviceRequest.equipmentData!;
        _equipmentBrandController.text = equipmentData['brand']?.toString() ?? '';
        _equipmentModelController.text = equipmentData['model']?.toString() ?? '';
        _equipmentSerialController.text = equipmentData['serial_number']?.toString() ?? '';
      }
      
      if (serviceRequest.serviceDetails != null) {
        final serviceDetails = serviceRequest.serviceDetails!;
        _problemDescriptionController.text = serviceDetails['problem_description']?.toString() ?? '';
        _servicePerformedController.text = serviceDetails['service_performed']?.toString() ?? '';
        _serviceSlipNotesController.text = serviceDetails['notes']?.toString() ?? '';
      }
      
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
        if (mounted && serviceRequest.serviceDetails != null) {
          final serviceDetails = serviceRequest.serviceDetails!;
          if (serviceDetails['used_products'] != null) {
            setState(() {
              _usedProducts = List<Map<String, dynamic>>.from(serviceDetails['used_products']);
            });
          }
        }
      }
    } else {
      _problemDescriptionController.text = serviceRequest.description ?? '';
      if (serviceRequest.location != null) {
        _customerAddressController.text = serviceRequest.location!;
      }
    }
    
    _lastInitializedServiceId = serviceRequest.id;
  }

  @override
  Widget build(BuildContext context) {
    final serviceRequestAsync = ref.watch(serviceRequestByIdProvider(widget.id));
    final statusDisplayNames = ref.watch(serviceRequestStatusDisplayNamesProvider);
    final priorityDisplayNames = ref.watch(serviceRequestPriorityDisplayNamesProvider);
    final statusColors = ref.watch(serviceRequestStatusColorsProvider);
    final priorityColors = ref.watch(serviceRequestPriorityColorsProvider);

    return Scaffold(
      backgroundColor: ServiceFormStyles.backgroundColor,
      appBar: _buildAppBar(),
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

          return _buildDetailsPage(
            serviceRequest,
            statusDisplayNames,
            priorityDisplayNames,
            statusColors,
            priorityColors,
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

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              CupertinoIcons.wrench_fill,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Servis Detayı',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
      backgroundColor: ServiceFormStyles.backgroundColor,
      foregroundColor: ServiceFormStyles.textPrimary,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      actions: [],
    );
  }

  Widget _buildDetailsPage(
    ServiceRequest serviceRequest,
    Map<String, String> statusDisplayNames,
    Map<String, String> priorityDisplayNames,
    Map<String, String> statusColors,
    Map<String, String> priorityColors,
  ) {
    final statusColor = _getStatusColor(serviceRequest.status, statusColors);
    final priorityColor = _getPriorityColor(serviceRequest.priority, priorityColors);
    
    // Servis yeni tamamlandıysa (durum değiştiyse) sadece bir kez düzenle sayfasına yönlendir
    if (serviceRequest.status == 'completed' && 
        _previousStatus != null && 
        _previousStatus != 'completed') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.go('/service/edit/${widget.id}');
        }
      });
    }
    
    // Mevcut durumu kaydet
    _previousStatus = serviceRequest.status;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(serviceRequestByIdProvider(widget.id));
      },
      color: ServiceFormStyles.primaryColor,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Birleşik Bilgiler ve Müşteri Kartı
              _buildUnifiedInfoSection(
                serviceRequest,
                statusDisplayNames,
                priorityDisplayNames,
                statusColor,
                priorityColor,
              ),
              const SizedBox(height: 10),

              // Servis İşlemleri - Hızlı Erişim
              _buildServiceActionsSection(serviceRequest),

              // Durum Değiştir
              if (serviceRequest.status != 'completed' && serviceRequest.status != 'cancelled') ...[
                const SizedBox(height: 12),
                _buildStatusChangeSection(serviceRequest),
              ],
              
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUnifiedInfoSection(
    ServiceRequest serviceRequest,
    Map<String, String> statusDisplayNames,
    Map<String, String> priorityDisplayNames,
    Color statusColor,
    Color priorityColor,
  ) {
    // Müşteri bilgilerini al
    String? customerName;
    String? customerPhone;
    String? customerEmail;
    String? customerAddress;
    String? customerCompany;

    if (serviceRequest.customerData != null) {
      final customerData = serviceRequest.customerData!;
      customerName = customerData['name']?.toString();
      customerPhone = customerData['phone']?.toString();
      customerEmail = customerData['email']?.toString();
      customerAddress = customerData['address']?.toString();
      customerCompany = customerData['company']?.toString();
    } else if (serviceRequest.customerName != null) {
      customerName = serviceRequest.customerName;
    }

    return ServiceFormSection(
      title: 'Servis Bilgileri',
      icon: CupertinoIcons.info_circle,
      iconColor: ServiceFormStyles.infoColor,
      children: [
        // Başlık, Badge'ler ve Tarihler - Kompakt düzen
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    serviceRequest.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: ServiceFormStyles.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Wrap(
                  spacing: 3,
                  runSpacing: 3,
                  children: [
                    ServiceStatusBadge(
                      label: statusDisplayNames[serviceRequest.status] ?? serviceRequest.status,
                      color: statusColor,
                    ),
                    ServicePriorityBadge(
                      label: priorityDisplayNames[serviceRequest.priority] ?? serviceRequest.priority,
                      color: priorityColor,
                    ),
                    if (serviceRequest.serviceType != null)
                      ServiceStatusBadge(
                        label: serviceRequest.serviceType!,
                        color: ServiceFormStyles.purpleColor,
                        showDot: false,
                      ),
                  ],
                ),
              ],
            ),
            // Tarihler - Sağ tarafta kompakt
            if (serviceRequest.createdAt != null || serviceRequest.reportedDate != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (serviceRequest.createdAt != null) ...[
                      Icon(
                        CupertinoIcons.calendar,
                        size: 11,
                        color: ServiceFormStyles.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatDateCompact(serviceRequest.createdAt),
                        style: const TextStyle(
                          fontSize: 11,
                          color: ServiceFormStyles.textSecondary,
                        ),
                      ),
                    ],
                    if (serviceRequest.createdAt != null && serviceRequest.reportedDate != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          '•',
                          style: TextStyle(
                            fontSize: 11,
                            color: ServiceFormStyles.textSecondary.withOpacity(0.5),
                          ),
                        ),
                      ),
                    if (serviceRequest.reportedDate != null) ...[
                      Icon(
                        CupertinoIcons.bell,
                        size: 11,
                        color: ServiceFormStyles.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatDateCompact(serviceRequest.reportedDate!),
                        style: const TextStyle(
                          fontSize: 11,
                          color: ServiceFormStyles.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        
        // 1. KONUM - En kritik bilgi
        if (serviceRequest.location != null)
          _buildCompactInfoRow('Konum', serviceRequest.location!, icon: CupertinoIcons.location),
        
        // 2. MÜŞTERİ BİLGİLERİ - İletişim için
        if (customerName != null) ...[
          Builder(
            builder: (context) {
              String displayValue = customerName!;
              String? contactPersonName;
              if (serviceRequest.contactPerson != null && serviceRequest.contactPerson!.isNotEmpty) {
                contactPersonName = serviceRequest.contactPerson;
              } else if (serviceRequest.customerData != null) {
                final customerData = serviceRequest.customerData!;
                contactPersonName = customerData['contact_person']?.toString() ?? 
                                   customerData['contactPerson']?.toString();
              }
              if (contactPersonName != null && contactPersonName.isNotEmpty) {
                displayValue = '$customerName / $contactPersonName';
              }
              return _buildCompactInfoRow('Müşteri', displayValue, icon: CupertinoIcons.person);
            },
          ),
        ],
        if (customerPhone != null && customerPhone.isNotEmpty)
          _buildCompactInfoRow('Telefon', customerPhone, icon: CupertinoIcons.phone, valueColor: ServiceFormStyles.infoColor),
        
        // 3. HEDEF TESLİM - Zaman baskısı
        if (serviceRequest.dueDate != null)
          _buildCompactDateRow(_DateItem(
            label: 'Hedef Teslim',
            date: serviceRequest.dueDate!,
            icon: CupertinoIcons.clock,
            valueColor: serviceRequest.dueDate!.isBefore(DateTime.now()) 
              ? ServiceFormStyles.errorColor 
              : ServiceFormStyles.warningColor,
          )),
        
        // 4. AÇIKLAMA - Kompakt gösterim
        if (serviceRequest.description != null && serviceRequest.description!.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      CupertinoIcons.text_alignleft,
                      size: 13,
                      color: ServiceFormStyles.textSecondary,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Açıklama:',
                      style: const TextStyle(
                        fontSize: 12,
                        color: ServiceFormStyles.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  serviceRequest.description!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: ServiceFormStyles.textPrimary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
        
        // 5. TEKNİSYEN - Her zaman göster
        _buildTechnicianInfo(serviceRequest),
        
        // 6. TARİH BİLGİLERİ - Kompakt tek satır
        if (serviceRequest.createdAt != null || serviceRequest.reportedDate != null ||
            serviceRequest.serviceStartDate != null || serviceRequest.serviceEndDate != null)
          _buildOtherInfoSection(serviceRequest),
      ],
    );
  }

  Widget _buildTechnicianInfo(ServiceRequest serviceRequest) {
    // Önce technicianName'i kontrol et
    if (serviceRequest.technicianName != null && serviceRequest.technicianName!.isNotEmpty) {
      return _buildCompactInfoRow('Teknisyen', serviceRequest.technicianName!, valueColor: ServiceFormStyles.successColor);
    }
    
    // technicianName yoksa assignedTo'dan teknisyen bilgisini al
    if (serviceRequest.assignedTo != null) {
      return Consumer(
        builder: (context, ref, child) {
          final techniciansAsync = ref.watch(techniciansProvider);
          return techniciansAsync.when(
            data: (technicians) {
              final technician = technicians.firstWhere(
                (t) => t['id']?.toString() == serviceRequest.assignedTo,
                orElse: () => {},
              );
              
              if (technician.isNotEmpty) {
                final fullName = '${technician['first_name'] ?? ''} ${technician['last_name'] ?? ''}'.trim();
                if (fullName.isNotEmpty) {
                  return _buildCompactInfoRow('Teknisyen', fullName, valueColor: ServiceFormStyles.successColor);
                }
              }
              
              // Teknisyen bulunamadıysa ID göster
              return _buildCompactInfoRow('Teknisyen', 'Atanmış (ID: ${serviceRequest.assignedTo})', valueColor: ServiceFormStyles.successColor);
            },
            loading: () => _buildCompactInfoRow('Teknisyen', 'Yükleniyor...', valueColor: ServiceFormStyles.successColor),
            error: (error, stack) => _buildCompactInfoRow('Teknisyen', 'Atanmış', valueColor: ServiceFormStyles.successColor),
          );
        },
      );
    }
    
    // Hiç atanmamışsa
    return _buildCompactInfoRow('Teknisyen', 'Atanmamış', valueColor: ServiceFormStyles.textSecondary);
  }

  Widget _buildOtherInfoSection(ServiceRequest serviceRequest) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Oluşturulma ve Bildirim tarihleri artık başlıkta gösteriliyor, burada sadece Başlama ve Bitirme
        if (serviceRequest.serviceStartDate != null)
          _buildCompactDateRow(_DateItem(
            label: 'Başlama',
            date: serviceRequest.serviceStartDate!,
            icon: CupertinoIcons.play_circle,
            valueColor: ServiceFormStyles.successColor,
          )),
        if (serviceRequest.serviceEndDate != null)
          _buildCompactDateRow(_DateItem(
            label: 'Bitirme',
            date: serviceRequest.serviceEndDate!,
            icon: CupertinoIcons.checkmark_circle,
            valueColor: ServiceFormStyles.infoColor,
          )),
      ],
    );
  }

  Widget _buildCompactInfoRow(String label, String value, {IconData? icon, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 14,
              color: ServiceFormStyles.textSecondary,
            ),
            const SizedBox(width: 6),
          ],
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: 12,
                color: ServiceFormStyles.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                color: valueColor ?? ServiceFormStyles.textPrimary,
                fontWeight: valueColor != null ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildCompactDateRow(_DateItem item) {
    final dateStr = _formatDateCompact(item.date);
    final timeStr = _formatTime(item.date);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            item.icon,
            size: 14,
            color: ServiceFormStyles.textSecondary,
          ),
          const SizedBox(width: 6),
          SizedBox(
            width: 80,
            child: Text(
              '${item.label}:',
              style: const TextStyle(
                fontSize: 12,
                color: ServiceFormStyles.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              '$dateStr $timeStr',
              style: TextStyle(
                fontSize: 13,
                color: item.valueColor ?? ServiceFormStyles.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildServiceActionsSection(ServiceRequest serviceRequest) {
    // Servis başlatma butonu - en önemli aksiyon
    if (serviceRequest.status == 'assigned' || serviceRequest.status == 'new') {
      return Column(
        children: [
          ServicePrimaryButton(
            label: 'Servisi Başlat',
            icon: CupertinoIcons.play_circle,
            onPressed: () => _startService(),
            color: ServiceFormStyles.successColor,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ServiceSecondaryButton(
                  label: 'Düzenle',
                  icon: CupertinoIcons.pencil,
                  onPressed: () {
                    context.go('/service/edit/${widget.id}');
                  },
                  color: ServiceFormStyles.primaryColor,
                ),
              ),
            ],
          ),
        ],
      );
    }
    
    // Servis devam ediyor
    if (serviceRequest.status == 'in_progress') {
      return Column(
        children: [
          ServicePrimaryButton(
            label: 'Servisi Bitir',
            icon: CupertinoIcons.checkmark_circle,
            onPressed: () => _completeService(),
            color: ServiceFormStyles.infoColor,
          ),
          const SizedBox(height: 10),
          ServiceSecondaryButton(
            label: 'Servisi Düzenle',
            icon: CupertinoIcons.pencil,
            onPressed: () {
              context.go('/service/edit/${widget.id}');
            },
            color: ServiceFormStyles.primaryColor,
          ),
        ],
      );
    }
    
    // Diğer durumlar için sadece düzenle butonu
    return ServiceSecondaryButton(
      label: 'Servisi Düzenle',
      icon: CupertinoIcons.pencil,
      onPressed: () {
        context.go('/service/edit/${widget.id}');
      },
      color: ServiceFormStyles.primaryColor,
    );
  }

  Widget _buildActionSection(String label, IconData icon, Color color, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      child: ServicePrimaryButton(
        label: label,
        icon: icon,
        onPressed: onTap,
        color: color,
      ),
    );
  }

  Widget _buildStatusChangeSection(ServiceRequest serviceRequest) {
    return ServiceFormSection(
      title: 'Durum Değiştir',
      icon: CupertinoIcons.arrow_2_squarepath,
      iconColor: ServiceFormStyles.primaryColor,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (serviceRequest.status == 'new')
              _buildStatusButton('Atandı', 'assigned', ServiceFormStyles.warningColor),
            if (serviceRequest.status == 'assigned')
              _buildStatusButton('Devam Ediyor', 'in_progress', ServiceFormStyles.successColor),
            if (serviceRequest.status == 'in_progress') ...[
              _buildStatusButton('Beklemede', 'on_hold', ServiceFormStyles.warningColor),
              _buildStatusButton('Tamamlandı', 'completed', ServiceFormStyles.successColor),
            ],
            if (serviceRequest.status == 'on_hold')
              _buildStatusButton('Devam Ediyor', 'in_progress', ServiceFormStyles.successColor),
            if (serviceRequest.status != 'completed' && serviceRequest.status != 'cancelled')
              _buildStatusButton('İptal Et', 'cancelled', ServiceFormStyles.errorColor),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusButton(String label, String status, Color color) {
    return CupertinoButton(
      onPressed: () => _updateStatus(status),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: color,
      borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
      minSize: 0,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildServiceSlipSection(ServiceRequest serviceRequest) {
    return ServiceFormSection(
      title: 'Servis Fişi',
      icon: CupertinoIcons.doc_text_fill,
      iconColor: ServiceFormStyles.primaryColor,
      children: [
        if (serviceRequest.hasServiceSlip && serviceRequest.slipNumber != null) ...[
          ServiceInfoRow(label: 'Fiş No', value: serviceRequest.slipNumber!, valueColor: ServiceFormStyles.primaryColor),
          if (serviceRequest.slipStatus != null)
            ServiceInfoRow(label: 'Durum', value: serviceRequest.slipStatusDisplayName, valueColor: ServiceFormStyles.successColor),
          const ServiceDivider(height: 20),
        ],
        
        // Teknisyen
        Consumer(
          builder: (context, ref, child) {
            final techniciansAsync = ref.watch(techniciansProvider);
            return techniciansAsync.when(
              data: (technicians) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const ServiceSectionHeader(title: 'Teknisyen'),
                    ServiceFormDropdown<String>(
                      value: _selectedTechnicianId,
                      label: 'Teknisyen Seç',
                      icon: CupertinoIcons.person_fill,
                      items: technicians.map((technician) {
                        final fullName = '${technician['first_name'] ?? ''} ${technician['last_name'] ?? ''}'.trim();
                        return DropdownMenuItem<String>(
                          value: technician['id']?.toString(),
                          child: Text(fullName.isEmpty ? 'İsimsiz' : fullName),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedTechnicianId = value;
                          if (value != null) {
                            final selected = technicians.firstWhere(
                              (t) => t['id']?.toString() == value,
                              orElse: () => {},
                            );
                            if (selected.isNotEmpty) {
                              final fullName = '${selected['first_name'] ?? ''} ${selected['last_name'] ?? ''}'.trim();
                              _technicianNameController.text = fullName.isEmpty ? 'İsimsiz' : fullName;
                            }
                          }
                        });
                      },
                    ),
                  ],
                );
              },
              loading: () => const Center(child: CupertinoActivityIndicator()),
              error: (error, stack) => const SizedBox.shrink(),
            );
          },
        ),
        const SizedBox(height: 16),
        
        // Müşteri Bilgileri
        const ServiceSectionHeader(title: 'Müşteri Bilgileri'),
        ServiceFormTextField(
          controller: _customerNameController,
          label: 'Müşteri Adı',
          icon: CupertinoIcons.person_circle,
        ),
        const SizedBox(height: 10),
        ServiceFormTextField(
          controller: _customerPhoneController,
          label: 'Telefon',
          icon: CupertinoIcons.phone_fill,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 10),
        ServiceFormTextField(
          controller: _customerAddressController,
          label: 'Adres',
          icon: CupertinoIcons.location_fill,
          maxLines: 2,
        ),
        const ServiceDivider(height: 20),
        
        // Ekipman Bilgileri
        const ServiceSectionHeader(title: 'Ekipman Bilgileri'),
        ServiceFormTextField(
          controller: _equipmentBrandController,
          label: 'Marka',
          icon: CupertinoIcons.bag_fill,
        ),
        const SizedBox(height: 10),
        ServiceFormTextField(
          controller: _equipmentModelController,
          label: 'Model',
          icon: CupertinoIcons.device_phone_portrait,
        ),
        const SizedBox(height: 10),
        ServiceFormTextField(
          controller: _equipmentSerialController,
          label: 'Seri No',
          icon: CupertinoIcons.barcode,
        ),
        const ServiceDivider(height: 20),
        
        // Servis Detayları
        const ServiceSectionHeader(title: 'Servis Detayları'),
        ServiceFormTextField(
          controller: _problemDescriptionController,
          label: 'Sorun Açıklaması',
          icon: CupertinoIcons.exclamationmark_triangle_fill,
          maxLines: 3,
        ),
        const SizedBox(height: 10),
        ServiceFormTextField(
          controller: _servicePerformedController,
          label: 'Yapılan İşlemler',
          icon: CupertinoIcons.wrench_fill,
          maxLines: 3,
        ),
        const SizedBox(height: 16),
        
        // Kullanılan Ürünler
        _buildUsedProductsSection(),
        const SizedBox(height: 10),
        
        ServiceFormTextField(
          controller: _serviceSlipNotesController,
          label: 'Notlar',
          icon: CupertinoIcons.doc_text,
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        
        // Servis Fişi Oluştur Butonu
        ServicePrimaryButton(
          label: 'Servis Fişi Oluştur',
          icon: CupertinoIcons.doc_on_doc,
          onPressed: () {
            // PDF şablon seçim sayfasına git
            context.push('/service/${widget.id}/slip/templates');
          },
        ),
      ],
    );
  }

  Widget _buildUsedProductsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ServiceSectionHeader(
          title: 'Kullanılan Ürünler',
          trailing: CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            minSize: 0,
            onPressed: () => _showProductSelectionDialog(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: ServiceFormStyles.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(CupertinoIcons.add, size: 16, color: ServiceFormStyles.primaryColor),
                  SizedBox(width: 4),
                  Text(
                    'Ürün Ekle',
                    style: TextStyle(
                      fontSize: 13,
                      color: ServiceFormStyles.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (_usedProducts.isEmpty)
          _buildEmptyItem('Henüz ürün eklenmemiş')
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

  Widget _buildEmptyItem(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ServiceFormStyles.inputBackground,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: ServiceFormStyles.bodySize,
          color: ServiceFormStyles.textSecondary,
          fontStyle: FontStyle.italic,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildAttachmentItem(dynamic attachment, int index) {
    final fileName = attachment is Map ? (attachment['name'] ?? 'Dosya') : 'Dosya';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ServiceFormStyles.successColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: ServiceFormStyles.successColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          const Icon(
            CupertinoIcons.paperclip,
            size: 16,
            color: ServiceFormStyles.successColor,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              fileName,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              // TODO: Dosya indirme
            },
            child: const Icon(
              CupertinoIcons.arrow_down_circle,
              size: 20,
              color: ServiceFormStyles.successColor,
            ),
          ),
        ],
      ),
    );
  }

  void _updateStatus(String status) async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      await service.updateServiceRequestStatus(widget.id, status);
      
      ref.invalidate(serviceRequestByIdProvider(widget.id));
      ref.invalidate(serviceHistoryProvider(widget.id));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Durum güncellendi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }


  void _startService() async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      final now = DateTime.now();
      
      // Status'u güncelle ve service_start_date set et
      await service.updateServiceRequestStatus(widget.id, 'in_progress');
      
      // service_start_date'i ayrıca set et
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
      if (serviceRequest != null && serviceRequest.serviceStartDate == null) {
        final updatedRequest = ServiceRequest(
          id: serviceRequest.id,
          title: serviceRequest.title,
          description: serviceRequest.description,
          serviceType: serviceRequest.serviceType,
          location: serviceRequest.location,
          priority: serviceRequest.priority,
          status: 'in_progress',
          customerId: serviceRequest.customerId,
          supplierId: serviceRequest.supplierId,
          assignedTo: serviceRequest.assignedTo,
          dueDate: serviceRequest.dueDate,
          reportedDate: serviceRequest.reportedDate,
          serviceStartDate: now,
          serviceEndDate: serviceRequest.serviceEndDate,
          contactPerson: serviceRequest.contactPerson,
          contactPhone: serviceRequest.contactPhone,
          contactEmail: serviceRequest.contactEmail,
          receivedBy: serviceRequest.receivedBy,
          serviceResult: serviceRequest.serviceResult,
          notes: serviceRequest.notes,
          warrantyInfo: serviceRequest.warrantyInfo,
          attachments: serviceRequest.attachments,
          createdAt: serviceRequest.createdAt,
          updatedAt: DateTime.now(),
          createdBy: serviceRequest.createdBy,
          serviceDetails: serviceRequest.serviceDetails,
          serviceNumber: serviceRequest.serviceNumber,
        );
        await service.updateServiceRequest(widget.id, updatedRequest);
      }
      
      ref.invalidate(serviceRequestByIdProvider(widget.id));
      ref.invalidate(serviceHistoryProvider(widget.id));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Servis başlatıldı')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  void _completeService() async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      final now = DateTime.now();
      
      // Status'u güncelle
      await service.updateServiceRequestStatus(widget.id, 'completed');
      
      // service_end_date ve completion_date'i set et
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
      if (serviceRequest != null) {
        final updatedRequest = ServiceRequest(
          id: serviceRequest.id,
          title: serviceRequest.title,
          description: serviceRequest.description,
          serviceType: serviceRequest.serviceType,
          location: serviceRequest.location,
          priority: serviceRequest.priority,
          status: 'completed',
          customerId: serviceRequest.customerId,
          supplierId: serviceRequest.supplierId,
          assignedTo: serviceRequest.assignedTo,
          dueDate: serviceRequest.dueDate,
          reportedDate: serviceRequest.reportedDate,
          serviceStartDate: serviceRequest.serviceStartDate,
          serviceEndDate: now,
          contactPerson: serviceRequest.contactPerson,
          contactPhone: serviceRequest.contactPhone,
          contactEmail: serviceRequest.contactEmail,
          receivedBy: serviceRequest.receivedBy,
          serviceResult: serviceRequest.serviceResult,
          notes: serviceRequest.notes,
          warrantyInfo: serviceRequest.warrantyInfo,
          attachments: serviceRequest.attachments,
          createdAt: serviceRequest.createdAt,
          updatedAt: DateTime.now(),
          createdBy: serviceRequest.createdBy,
          serviceDetails: serviceRequest.serviceDetails,
          serviceNumber: serviceRequest.serviceNumber,
        );
        await service.updateServiceRequest(widget.id, updatedRequest);
      }
      
      ref.invalidate(serviceRequestByIdProvider(widget.id));
      ref.invalidate(serviceHistoryProvider(widget.id));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Servis tamamlandı')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  void _showProductSelectionDialog() async {
    showDialog(
      context: context,
      builder: (context) => ProductSelectionDialog(
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

  void _saveServiceSlip() async {
    setState(() {
      _isSlipLoading = true;
    });

    try {
      final service = ref.read(serviceRequestServiceProvider);
      
      final customerData = {
        'name': _customerNameController.text,
        'phone': _customerPhoneController.text,
        'address': _customerAddressController.text,
      };

      final equipmentData = {
        'brand': _equipmentBrandController.text,
        'model': _equipmentModelController.text,
        'serial_number': _equipmentSerialController.text,
      };

      final serviceDetails = {
        'problem_description': _problemDescriptionController.text,
        'service_performed': _servicePerformedController.text,
        'notes': _serviceSlipNotesController.text,
      };

      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.id).future);
      
      if (serviceRequest?.hasServiceSlip == true) {
        await service.updateServiceSlip(
          widget.id,
          technicianName: _technicianNameController.text.isNotEmpty ? _technicianNameController.text : null,
          customerData: customerData,
          equipmentData: equipmentData,
          serviceDetails: serviceDetails,
        );
      } else {
        await service.createServiceSlip(
          widget.id,
          technicianName: _technicianNameController.text,
          customerData: customerData,
          equipmentData: equipmentData,
          serviceDetails: serviceDetails,
        );
      }
      
      await service.deleteAllServiceItems(widget.id);
      if (_usedProducts.isNotEmpty) {
        await service.addServiceItems(widget.id, _usedProducts);
      }

      ref.invalidate(serviceRequestByIdProvider(widget.id));
      ref.invalidate(serviceHistoryProvider(widget.id));

      if (mounted) {
        final message = serviceRequest?.hasServiceSlip == true 
            ? 'Servis fişi başarıyla güncellendi'
            : 'Servis fişi başarıyla oluşturuldu';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
        setState(() {
          _lastInitializedServiceId = null;
        });
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
          _isSlipLoading = false;
        });
      }
    }
  }

  Color _getStatusColor(String status, Map<String, String> statusColors) {
    final colorName = statusColors[status] ?? 'blue';
    return _getColorFromName(colorName);
  }

  Color _getPriorityColor(String priority, Map<String, String> priorityColors) {
    final colorName = priorityColors[priority] ?? 'blue';
    return _getColorFromName(colorName);
  }

  Color _getColorFromName(String colorName) {
    switch (colorName) {
      case 'red':
        return Colors.red;
      case 'orange':
        return Colors.orange;
      case 'yellow':
        return Colors.yellow[700]!;
      case 'green':
        return Colors.green;
      case 'blue':
        return Colors.blue;
      case 'purple':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}.${dateTime.month.toString().padLeft(2, '0')}.${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDateCompact(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}.${dateTime.month.toString().padLeft(2, '0')}.${dateTime.year}';
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

class _DateItem {
  final String label;
  final DateTime date;
  final IconData icon;
  final Color? valueColor;

  _DateItem({
    required this.label,
    required this.date,
    required this.icon,
    this.valueColor,
  });
}
