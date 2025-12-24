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
import 'service_request_form/product_selection_dialog.dart';

class ServiceSlipFormPage extends ConsumerStatefulWidget {
  final String serviceRequestId;

  const ServiceSlipFormPage({
    super.key,
    required this.serviceRequestId,
  });

  @override
  ConsumerState<ServiceSlipFormPage> createState() => _ServiceSlipFormPageState();
}

class _ServiceSlipFormPageState extends ConsumerState<ServiceSlipFormPage> {
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
  final _partsUsedController = TextEditingController();
  final _notesController = TextEditingController();
  
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _selectedTechnicianId;
  
  // Kullanılan ürünler listesi
  List<Map<String, dynamic>> _usedProducts = [];

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
    _partsUsedController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _initializeFormData(ServiceRequest serviceRequest) async {
    if (_isInitialized) return;
    
    // Mevcut servis fişi varsa onun verilerini yükle
    if (serviceRequest.hasServiceSlip) {
      _technicianNameController.text = serviceRequest.technicianName ?? '';
      
      // Müşteri bilgileri
      if (serviceRequest.customerData != null) {
        final customerData = serviceRequest.customerData!;
        _customerNameController.text = customerData['name']?.toString() ?? '';
        _customerPhoneController.text = customerData['phone']?.toString() ?? '';
        _customerAddressController.text = customerData['address']?.toString() ?? '';
      }
      
      // Ekipman bilgileri
      if (serviceRequest.equipmentData != null) {
        final equipmentData = serviceRequest.equipmentData!;
        _equipmentBrandController.text = equipmentData['brand']?.toString() ?? '';
        _equipmentModelController.text = equipmentData['model']?.toString() ?? '';
        _equipmentSerialController.text = equipmentData['serial_number']?.toString() ?? '';
      }
      
      // Servis detayları
      if (serviceRequest.serviceDetails != null) {
        final serviceDetails = serviceRequest.serviceDetails!;
        _problemDescriptionController.text = serviceDetails['problem_description']?.toString() ?? '';
        _servicePerformedController.text = serviceDetails['service_performed']?.toString() ?? '';
        _notesController.text = serviceDetails['notes']?.toString() ?? '';
      }
      
      // Kullanılan ürünleri service_items tablosundan yükle
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
        print('Ürünler yüklenirken hata: $e');
        // Fallback: Eski yöntem (serviceDetails içinden)
        if (mounted) {
          setState(() {
            if (serviceRequest.serviceDetails != null) {
              final serviceDetails = serviceRequest.serviceDetails!;
              if (serviceDetails['used_products'] != null) {
                _usedProducts = List<Map<String, dynamic>>.from(serviceDetails['used_products']);
              }
            }
            _isInitialized = true;
          });
        }
      }
    } else {
      // Yeni servis fişi oluşturuluyorsa, mevcut talep bilgilerinden faydalanılabilecek alanları doldur
      _problemDescriptionController.text = serviceRequest.description ?? '';
      if (serviceRequest.location != null) {
        _customerAddressController.text = serviceRequest.location!;
      }
      _isInitialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final serviceRequestAsync = ref.watch(serviceRequestByIdProvider(widget.serviceRequestId));

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          'Servis Fişi',
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
      body: serviceRequestAsync.when(
        data: (serviceRequest) {
          if (serviceRequest == null) {
            return const Center(
              child: Text('Servis talebi bulunamadı'),
            );
          }

          // Form verilerini başlat - async olarak (await olmadan)
          if (!_isInitialized) {
            _initializeFormData(serviceRequest).then((_) {
              // setState zaten metod içinde yapılıyor
            }).catchError((e) {
              print('Form verileri yüklenirken hata: $e');
            });
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Servis Talebi Özeti
                  Container(
                    padding: const EdgeInsets.all(20),
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
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFFB73D3D).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(
                                CupertinoIcons.doc_text_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Servis Talebi Özeti',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF000000),
                                ),
                              ),
                            ),
                            if (serviceRequest.hasServiceSlip)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.green,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  serviceRequest.slipStatusDisplayName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2F2F7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInfoRow('Başlık', serviceRequest.title),
                              if (serviceRequest.description != null)
                                _buildInfoRow('Açıklama', serviceRequest.description!),
                              _buildInfoRow('Durum', serviceRequest.statusDisplayName),
                              _buildInfoRow('Öncelik', serviceRequest.priorityDisplayName),
                              if (serviceRequest.location != null)
                                _buildInfoRow('Konum', serviceRequest.location!),
                              if (serviceRequest.serviceType != null)
                                _buildInfoRow('Servis Tipi', serviceRequest.serviceType!),
                              if (serviceRequest.hasServiceSlip)
                                _buildInfoRow('Fiş No', serviceRequest.slipNumber!),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Teknisyen bilgileri
                  Container(
                    padding: const EdgeInsets.all(20),
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
                        const Text(
                          'Teknisyen Bilgileri',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Consumer(
                          builder: (context, ref, child) {
                            final techniciansAsync = ref.watch(techniciansProvider);
                            
                            return techniciansAsync.when(
                              data: (technicians) {
                                return Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 10,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedTechnicianId,
                                    decoration: InputDecoration(
                                      labelText: 'Teknisyen *',
                                      labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: const Color(0xFF8E8E93),
                                      ),
                                      prefixIcon: const Icon(
                                        CupertinoIcons.person_fill,
                                        color: Color(0xFFB73D3D),
                                        size: 20,
                                      ),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 16,
                                      ),
                                    ),
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
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Teknisyen seçimi gereklidir';
                                      }
                                      return null;
                                    },
                                  ),
                                );
                              },
                              loading: () => const Center(child: CircularProgressIndicator()),
                              error: (error, stack) => Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Teknisyen listesi yüklenemedi: $error',
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Müşteri bilgileri
                  Container(
                    padding: const EdgeInsets.all(20),
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
                        const Text(
                          'Müşteri Bilgileri',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _customerNameController,
                            decoration: InputDecoration(
                              labelText: 'Müşteri Adı',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.person_circle,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _customerPhoneController,
                            decoration: InputDecoration(
                              labelText: 'Telefon',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.phone_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                            keyboardType: TextInputType.phone,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _customerAddressController,
                            decoration: InputDecoration(
                              labelText: 'Adres',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.location_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                            maxLines: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Ekipman bilgileri
                  Container(
                    padding: const EdgeInsets.all(20),
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
                        const Text(
                          'Ekipman Bilgileri',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _equipmentBrandController,
                            decoration: InputDecoration(
                              labelText: 'Marka',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.bag_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _equipmentModelController,
                            decoration: InputDecoration(
                              labelText: 'Model',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.device_phone_portrait,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _equipmentSerialController,
                            decoration: InputDecoration(
                              labelText: 'Seri No',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.barcode,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Servis detayları
                  Container(
                    padding: const EdgeInsets.all(20),
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
                        const Text(
                          'Servis Detayları',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _problemDescriptionController,
                            decoration: InputDecoration(
                              labelText: 'Sorun Açıklaması',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.exclamationmark_triangle_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                            maxLines: 3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _servicePerformedController,
                            decoration: InputDecoration(
                              labelText: 'Yapılan İşlemler',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.wrench_fill,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                            maxLines: 3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Kullanılan ürünler listesi
                        _buildUsedProductsSection(),
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextFormField(
                            controller: _notesController,
                            decoration: InputDecoration(
                              labelText: 'Notlar',
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF8E8E93),
                              ),
                              prefixIcon: const Icon(
                                CupertinoIcons.doc_text,
                                color: Color(0xFFB73D3D),
                                size: 20,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                            maxLines: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Kaydet butonu
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: CupertinoButton(
                      onPressed: _isLoading ? null : _saveServiceSlip,
                      color: const Color(0xFFB73D3D),
                      borderRadius: BorderRadius.circular(12),
                      child: _isLoading
                          ? const CupertinoActivityIndicator(
                              color: Colors.white,
                            )
                          : Text(
                              'Kaydet',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
              const SizedBox(height: 16),
              Text('Hata: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(serviceRequestByIdProvider(widget.serviceRequestId));
                },
                child: const Text('Tekrar Dene'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              '$label:',
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Color(0xFF000000),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsedProductsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Kullanılan Ürünler',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF000000),
              ),
            ),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: const Color(0xFFB73D3D),
              borderRadius: BorderRadius.circular(8),
              onPressed: () => _showProductSelectionDialog(),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(CupertinoIcons.add, color: Colors.white, size: 18),
                  SizedBox(width: 4),
                  Text(
                    'Ürün Ekle',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_usedProducts.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF2F2F7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'Henüz ürün eklenmemiş',
              style: TextStyle(
                color: Color(0xFF8E8E93),
                fontStyle: FontStyle.italic,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          )
        else
          ...(_usedProducts.asMap().entries.map((entry) {
            final index = entry.key;
            final product = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    spreadRadius: 0,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product['name'] ?? 'Bilinmeyen Ürün',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: Color(0xFF000000),
                          ),
                        ),
                        if (product['description'] != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              product['description'],
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 13,
                              ),
                            ),
                          ),
                        const SizedBox(height: 6),
                        Text(
                          'Miktar: ${product['quantity']} ${product['unit'] ?? 'adet'}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    minSize: 0,
                    onPressed: () => _removeProduct(index),
                    child: const Icon(
                      CupertinoIcons.delete,
                      color: Color(0xFFB73D3D),
                      size: 24,
                    ),
                  ),
                ],
              ),
            );
          }).toList()),
      ],
    );
  }

  void _saveServiceSlip() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final service = ref.read(serviceRequestServiceProvider);
      
      // Müşteri bilgilerini hazırla
      final customerData = {
        'name': _customerNameController.text,
        'phone': _customerPhoneController.text,
        'address': _customerAddressController.text,
      };

      // Ekipman bilgilerini hazırla
      final equipmentData = {
        'brand': _equipmentBrandController.text,
        'model': _equipmentModelController.text,
        'serial_number': _equipmentSerialController.text,
      };

      // Servis detaylarını hazırla (used_products hariç - artık service_items tablosunda)
      final serviceDetails = {
        'problem_description': _problemDescriptionController.text,
        'service_performed': _servicePerformedController.text,
        'notes': _notesController.text,
      };

      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      
      if (serviceRequest?.hasServiceSlip == true) {
        // Mevcut servis fişini güncelle
        await service.updateServiceSlip(
          widget.serviceRequestId,
          technicianName: _technicianNameController.text.isNotEmpty ? _technicianNameController.text : null,
          customerData: customerData,
          equipmentData: equipmentData,
          serviceDetails: serviceDetails,
        );
      } else {
        // Yeni servis fişi oluştur
        await service.createServiceSlip(
          widget.serviceRequestId,
          technicianName: _technicianNameController.text,
          customerData: customerData,
          equipmentData: equipmentData,
          serviceDetails: serviceDetails,
        );
      }
      
      // Ürünleri service_items tablosuna kaydet
      await service.deleteAllServiceItems(widget.serviceRequestId);
      if (_usedProducts.isNotEmpty) {
        await service.addServiceItems(widget.serviceRequestId, _usedProducts);
      }

      // Provider'ı yenile
      ref.invalidate(serviceRequestByIdProvider(widget.serviceRequestId));

      if (mounted) {
        final message = serviceRequest?.hasServiceSlip == true 
            ? 'Servis fişi başarıyla güncellendi'
            : 'Servis fişi başarıyla oluşturuldu';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
        context.go('/service-requests/${widget.serviceRequestId}');
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
        'id': product['id'], // product_id olarak kullanılacak
        'product_id': product['id'], // service_items tablosuna kaydedilecek
        'name': product['name'],
        'description': product['description'],
        'unit': product['unit'] ?? 'adet',
        'quantity': quantity,
        'price': product['price'] ?? 0,
        'unit_price': product['price'] ?? 0,
        'tax_rate': 20, // Varsayılan KDV oranı
        'discount_rate': 0,
      });
    });
  }

  void _removeProduct(int index) {
    setState(() {
      _usedProducts.removeAt(index);
    });
  }
}

