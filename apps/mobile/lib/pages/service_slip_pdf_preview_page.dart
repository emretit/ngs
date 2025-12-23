import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:signature/signature.dart';
import '../providers/service_request_provider.dart';
import '../services/service_slip_pdf_service.dart';
import '../services/service_request_service.dart';
import '../models/service_request.dart';
import '../providers/service_request_provider.dart';

class ServiceSlipPdfPreviewPage extends ConsumerStatefulWidget {
  final String serviceRequestId;
  final String? templateId;

  const ServiceSlipPdfPreviewPage({
    super.key,
    required this.serviceRequestId,
    this.templateId,
  });

  @override
  ConsumerState<ServiceSlipPdfPreviewPage> createState() => _ServiceSlipPdfPreviewPageState();
}

class _ServiceSlipPdfPreviewPageState extends ConsumerState<ServiceSlipPdfPreviewPage> {
  Uint8List? _pdfBytes;
  bool _isLoading = true;
  String? _error;
  ServiceRequest? _serviceRequest;
  
  // İmza durumları
  bool _needsTechnicianSignature = false;
  bool _needsCustomerSignature = false;
  String? _technicianSignature;
  String? _customerSignature;
  bool _isSavingSignatures = false;
  bool _isGeneratingFinalPdf = false;
  
  // İmza controller'ları
  final SignatureController _technicianSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
    exportPenColor: Colors.black,
  );
  
  final SignatureController _customerSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
    exportPenColor: Colors.black,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPdfPreview();
    });
  }
  
  @override
  void dispose() {
    _technicianSignatureController.dispose();
    _customerSignatureController.dispose();
    super.dispose();
  }
  
  Future<void> _loadPdfPreview() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      // Servis request'i state'e kaydet
      setState(() {
        _serviceRequest = serviceRequest;
      });

      // Mevcut imzaları yükle
      final service = ref.read(serviceRequestServiceProvider);
      final signatures = await service.getSignatures(widget.serviceRequestId);
      
      // İmza durumlarını güncelle
      setState(() {
        _needsTechnicianSignature = !(signatures['hasTechnician'] as bool);
        _needsCustomerSignature = !(signatures['hasCustomer'] as bool);
        _technicianSignature = signatures['technician'] as String?;
        _customerSignature = signatures['customer'] as String?;
      });

      // İmzalı service request oluştur
      final serviceRequestWithSignatures = ServiceRequest(
        id: serviceRequest.id,
        title: serviceRequest.title,
        description: serviceRequest.description,
        status: serviceRequest.status,
        priority: serviceRequest.priority,
        createdAt: serviceRequest.createdAt,
        updatedAt: serviceRequest.updatedAt,
        assignedTo: serviceRequest.assignedTo,
        customerId: serviceRequest.customerId,
        supplierId: serviceRequest.supplierId,
        dueDate: serviceRequest.dueDate,
        location: serviceRequest.location,
        serviceType: serviceRequest.serviceType,
        warrantyInfo: serviceRequest.warrantyInfo,
        attachments: serviceRequest.attachments,
        notes: serviceRequest.notes,
        specialInstructions: serviceRequest.specialInstructions,
        reportedDate: serviceRequest.reportedDate,
        contactPerson: serviceRequest.contactPerson,
        contactPhone: serviceRequest.contactPhone,
        contactEmail: serviceRequest.contactEmail,
        receivedBy: serviceRequest.receivedBy,
        serviceResult: serviceRequest.serviceResult,
        serviceNumber: serviceRequest.serviceNumber,
        slipNumber: serviceRequest.slipNumber,
        issueDate: serviceRequest.issueDate,
        completionDate: serviceRequest.completionDate,
        customerName: serviceRequest.customerName,
        technicianName: serviceRequest.technicianName,
        customerData: serviceRequest.customerData,
        equipmentData: serviceRequest.equipmentData,
        serviceDetails: serviceRequest.serviceDetails,
        slipStatus: serviceRequest.slipStatus,
        createdBy: serviceRequest.createdBy,
        serviceStartDate: serviceRequest.serviceStartDate,
        serviceEndDate: serviceRequest.serviceEndDate,
        // Mevcut imzaları ekle
        technicianSignature: _technicianSignature ?? serviceRequest.technicianSignature,
        customerSignature: _customerSignature ?? serviceRequest.customerSignature,
      );

      // Flutter'ın kendi PDF servisi ile imzalı önizleme oluştur
      final pdfService = ServiceSlipPdfService();
      final pdfBytes = await pdfService.generateServiceSlipPdf(serviceRequestWithSignatures);

      if (mounted) {
        setState(() {
          _pdfBytes = pdfBytes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _saveTechnicianSignature() async {
    if (_technicianSignatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen imza çizin'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() {
      _isSavingSignatures = true;
    });

    try {
      final signatureBytes = await _technicianSignatureController.toPngBytes(
        height: 200,
        width: 400,
      );

      if (signatureBytes == null) {
        throw Exception('İmza oluşturulamadı');
      }

      final base64Signature = base64Encode(signatureBytes);
      
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      final service = ref.read(serviceRequestServiceProvider);
      await service.saveSignatureWithMetadata(
        serviceRequestId: widget.serviceRequestId,
        signatureType: 'technician',
        signatureBase64: base64Signature,
        userName: serviceRequest.technicianName ?? 'Teknisyen',
        coordinates: {
          'canvas': {'width': 400.0, 'height': 200.0},
          'boundingBox': {'x': 0.0, 'y': 0.0, 'width': 400.0, 'height': 200.0},
        },
        pageNumber: 1,
      );

      setState(() {
        _technicianSignature = base64Signature;
        _needsTechnicianSignature = false;
      });

      _technicianSignatureController.clear();
      
      // PDF önizlemeyi imzalı olarak yeniden yükle
      await _loadPdfPreview();
      
      // Eğer müşteri imzası da alındıysa final PDF oluştur
      if (!_needsCustomerSignature) {
        await _generateFinalPdf();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('İmza kaydedilemedi: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      setState(() {
        _isSavingSignatures = false;
      });
    }
  }

  Future<void> _saveCustomerSignature() async {
    if (_customerSignatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen imza çizin'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() {
      _isSavingSignatures = true;
    });

    try {
      final signatureBytes = await _customerSignatureController.toPngBytes(
        height: 200,
        width: 400,
      );

      if (signatureBytes == null) {
        throw Exception('İmza oluşturulamadı');
      }

      final base64Signature = base64Encode(signatureBytes);
      
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      final service = ref.read(serviceRequestServiceProvider);
      await service.saveSignatureWithMetadata(
        serviceRequestId: widget.serviceRequestId,
        signatureType: 'customer',
        signatureBase64: base64Signature,
        userName: serviceRequest.customerName ?? 'Müşteri',
        coordinates: {
          'canvas': {'width': 400.0, 'height': 200.0},
          'boundingBox': {'x': 0.0, 'y': 0.0, 'width': 400.0, 'height': 200.0},
        },
        pageNumber: 1,
      );

      setState(() {
        _customerSignature = base64Signature;
        _needsCustomerSignature = false;
      });

      _customerSignatureController.clear();
      
      // PDF önizlemeyi imzalı olarak yeniden yükle
      await _loadPdfPreview();
      
      // Final PDF oluştur
      await _generateFinalPdf();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('İmza kaydedilemedi: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      setState(() {
        _isSavingSignatures = false;
      });
    }
  }

  Future<void> _generateFinalPdf() async {
    if (_isGeneratingFinalPdf) return;

    setState(() {
      _isGeneratingFinalPdf = true;
    });

    try {
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      // Flutter'ın kendi PDF servisi ile imzalı PDF oluştur
      // İmzaları service request'e ekle
      final serviceRequestWithSignatures = ServiceRequest(
        id: serviceRequest.id,
        title: serviceRequest.title,
        description: serviceRequest.description,
        status: serviceRequest.status,
        priority: serviceRequest.priority,
        createdAt: serviceRequest.createdAt,
        updatedAt: serviceRequest.updatedAt,
        assignedTo: serviceRequest.assignedTo,
        customerId: serviceRequest.customerId,
        supplierId: serviceRequest.supplierId,
        dueDate: serviceRequest.dueDate,
        location: serviceRequest.location,
        serviceType: serviceRequest.serviceType,
        warrantyInfo: serviceRequest.warrantyInfo,
        attachments: serviceRequest.attachments,
        notes: serviceRequest.notes,
        specialInstructions: serviceRequest.specialInstructions,
        reportedDate: serviceRequest.reportedDate,
        contactPerson: serviceRequest.contactPerson,
        contactPhone: serviceRequest.contactPhone,
        contactEmail: serviceRequest.contactEmail,
        receivedBy: serviceRequest.receivedBy,
        serviceResult: serviceRequest.serviceResult,
        serviceNumber: serviceRequest.serviceNumber,
        slipNumber: serviceRequest.slipNumber,
        issueDate: serviceRequest.issueDate,
        completionDate: serviceRequest.completionDate,
        customerName: serviceRequest.customerName,
        technicianName: serviceRequest.technicianName,
        customerData: serviceRequest.customerData,
        equipmentData: serviceRequest.equipmentData,
        serviceDetails: serviceRequest.serviceDetails,
        slipStatus: serviceRequest.slipStatus,
        createdBy: serviceRequest.createdBy,
        serviceStartDate: serviceRequest.serviceStartDate,
        serviceEndDate: serviceRequest.serviceEndDate,
        // İmzaları ekle
        technicianSignature: _technicianSignature,
        customerSignature: _customerSignature,
      );

      final pdfService = ServiceSlipPdfService();
      final pdfBytes = await pdfService.generateServiceSlipPdf(serviceRequestWithSignatures);

      // PDF'i paylaş
      await pdfService.previewAndShare(
        pdfBytes,
        'Servis_Fisi_${serviceRequest.serviceNumber ?? serviceRequest.id}.pdf',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Servis fişi PDF\'i oluşturuldu'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        context.pop();
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
          _isGeneratingFinalPdf = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.back, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFB73D3D), Color(0xFFD32F2F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFB73D3D).withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                CupertinoIcons.doc_text,
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
                  const Text(
                    'Servis Formu',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.3,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  if (_serviceRequest != null)
                    Text(
                      _serviceRequest!.serviceNumber != null
                          ? _serviceRequest!.serviceNumber!
                          : 'PDF Önizleme',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w400,
                        color: (Colors.grey[600] ?? Colors.grey).withOpacity(0.7),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey.withOpacity(0.1),
            height: 1,
          ),
        ),
      ),
      body: Column(
        children: [
          // Ana içerik
          Expanded(
            child: _isLoading
                ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CupertinoActivityIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'PDF yükleniyor...',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        CupertinoIcons.exclamationmark_triangle,
                        size: 64,
                        color: Color(0xFFEF4444),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'PDF yüklenemedi',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      CupertinoButton(
                        onPressed: _loadPdfPreview,
                        color: const Color(0xFFB73D3D),
                        child: const Text('Tekrar Dene'),
                      ),
                    ],
                  ),
                )
              : _pdfBytes != null
                  ? SingleChildScrollView(
                      child: Column(
                        children: [
                          // PDF Önizleme Bölümü
                          Container(
                            color: Colors.white,
                            child: Column(
                              children: [
                                // PDF Önizleme Başlığı - Kompakt
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border(
                                      bottom: BorderSide(
                                        color: Colors.grey.withOpacity(0.2),
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        CupertinoIcons.eye,
                                        size: 14,
                                        color: Colors.grey[700],
                                      ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'PDF Önizleme',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF1F2937),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // PDF görüntüleyici - A4 oranına göre boyutlandırma
                                // A4 oranı: 210mm x 297mm (genişlik/yükseklik ≈ 0.707)
                                LayoutBuilder(
                                  builder: (context, constraints) {
                                    final width = constraints.maxWidth;
                                    final height = width / 0.707; // A4 oranı
                                    return SizedBox(
                                      height: height.clamp(400.0, MediaQuery.of(context).size.height * 0.7),
                                      width: double.infinity,
                                      child: Container(
                                        color: Colors.white,
                                        child: PdfPreview(
                                          build: (format) => _pdfBytes!,
                                          allowPrinting: false,
                                          allowSharing: false,
                                          canChangeOrientation: false,
                                          canChangePageFormat: false,
                                          canDebug: false,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                // A4 Bilgi Çubuğu
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFB73D3D),
                                    border: Border(
                                      top: BorderSide(
                                        color: Colors.grey.withOpacity(0.2),
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        CupertinoIcons.doc_text,
                                        color: Colors.white,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'A4',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // İmza alanları
                          if (_needsTechnicianSignature || _needsCustomerSignature)
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border(
                                  top: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Teknisyen imzası
                                  if (_needsTechnicianSignature) ...[
                                    const Text(
                                      'Teknisyen İmzası',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      height: 150,
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey.withOpacity(0.3)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Signature(
                                        controller: _technicianSignatureController,
                                        backgroundColor: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: CupertinoButton(
                                            onPressed: () => _technicianSignatureController.clear(),
                                            color: Colors.grey[200],
                                            borderRadius: BorderRadius.circular(8),
                                            child: const Text(
                                              'Temizle',
                                              style: TextStyle(color: Colors.black87),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: CupertinoButton(
                                            onPressed: _isSavingSignatures ? null : _saveTechnicianSignature,
                                            color: const Color(0xFFB73D3D),
                                            borderRadius: BorderRadius.circular(8),
                                            child: _isSavingSignatures
                                                ? const CupertinoActivityIndicator()
                                                : const Text(
                                                    'Kaydet',
                                                    style: TextStyle(color: Colors.white),
                                                  ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                  ],
                                  // Müşteri imzası
                                  if (_needsCustomerSignature) ...[
                                    const Text(
                                      'Müşteri İmzası',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      height: 150,
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey.withOpacity(0.3)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Signature(
                                        controller: _customerSignatureController,
                                        backgroundColor: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: CupertinoButton(
                                            onPressed: () => _customerSignatureController.clear(),
                                            color: Colors.grey[200],
                                            borderRadius: BorderRadius.circular(8),
                                            child: const Text(
                                              'Temizle',
                                              style: TextStyle(color: Colors.black87),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: CupertinoButton(
                                            onPressed: _isSavingSignatures ? null : _saveCustomerSignature,
                                            color: const Color(0xFFB73D3D),
                                            borderRadius: BorderRadius.circular(8),
                                            child: _isSavingSignatures
                                                ? const CupertinoActivityIndicator()
                                                : const Text(
                                                    'Kaydet',
                                                    style: TextStyle(color: Colors.white),
                                                  ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          // Final PDF oluştur butonu (her iki imza da alındıysa)
                          if (!_needsTechnicianSignature && !_needsCustomerSignature && !_isGeneratingFinalPdf)
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border(
                                  top: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: SafeArea(
                                top: false,
                                child: SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: CupertinoButton(
                                    onPressed: _generateFinalPdf,
                                    color: const Color(0xFF10B981),
                                    borderRadius: BorderRadius.circular(12),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          CupertinoIcons.checkmark_circle_fill,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          'PDF Oluştur',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          if (_isGeneratingFinalPdf)
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border(
                                  top: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: const Center(
                                child: Column(
                                  children: [
                                    CupertinoActivityIndicator(),
                                    SizedBox(height: 8),
                                    Text(
                                      'PDF oluşturuluyor...',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    )
                  : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}

