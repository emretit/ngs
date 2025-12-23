import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../pages/signature_page.dart';
import '../services/service_request_service.dart';
import '../providers/service_request_provider.dart';
import '../services/service_slip_pdf_service.dart';
import '../models/service_request.dart';

class ServiceSlipSignatureFlowPage extends ConsumerStatefulWidget {
  final String serviceRequestId;
  final String? templateId;

  const ServiceSlipSignatureFlowPage({
    super.key,
    required this.serviceRequestId,
    this.templateId,
  });

  @override
  ConsumerState<ServiceSlipSignatureFlowPage> createState() => _ServiceSlipSignatureFlowPageState();
}

class _ServiceSlipSignatureFlowPageState extends ConsumerState<ServiceSlipSignatureFlowPage> {
  String? _technicianSignature;
  String? _customerSignature;
  bool _isGeneratingPdf = false;
  bool _needsTechnicianSignature = false;
  bool _needsCustomerSignature = false;

  Future<void> _checkExistingSignatures() async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      
      // service_signatures tablosundan imzaları kontrol et
      final signatures = await service.getSignatures(widget.serviceRequestId);
      
      final hasTechnicianSignature = signatures['hasTechnician'] as bool;
      final hasCustomerSignature = signatures['hasCustomer'] as bool;
      final technicianSignature = signatures['technician'] as String?;
      final customerSignature = signatures['customer'] as String?;

      setState(() {
        _needsTechnicianSignature = !hasTechnicianSignature;
        _needsCustomerSignature = !hasCustomerSignature;
        _technicianSignature = technicianSignature;
        _customerSignature = customerSignature;
      });

      // Eğer her iki imza da varsa, direkt PDF oluştur
      if (!_needsTechnicianSignature && !_needsCustomerSignature) {
        await _generatePdf();
        return;
      }

      // Eksik imzaları al
      if (_needsTechnicianSignature) {
        await _collectTechnicianSignature();
      } else if (_needsCustomerSignature) {
        await _collectCustomerSignature();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
        context.pop();
      }
    }
  }

  Future<void> _collectTechnicianSignature() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const SignaturePage(
          title: 'Teknisyen İmzası',
          pageNumber: 1,
        ),
      ),
    );

    if (result != null && mounted) {
      final signature = result['signature'] as String?;
      if (signature != null) {
      setState(() {
        _technicianSignature = signature;
        _needsTechnicianSignature = false;
      });
        // İmzayı metadata ile kaydet
        await _saveSignatureWithMetadata(
          signatureBase64: signature,
          coordinates: result['coordinates'] as Map<String, dynamic>,
          pageNumber: result['pageNumber'] as int,
          type: 'technician',
        );
      // Müşteri imzasına geç veya PDF oluştur
      if (_needsCustomerSignature) {
        _collectCustomerSignature();
      } else {
        await _generatePdf();
        }
      }
    } else if (mounted) {
      // İmza alınmadıysa geri dön
      context.pop();
    }
  }

  Future<void> _collectCustomerSignature() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const SignaturePage(
          title: 'Müşteri İmzası',
          pageNumber: 1,
        ),
      ),
    );

    if (result != null && mounted) {
      final signature = result['signature'] as String?;
      if (signature != null) {
      setState(() {
        _customerSignature = signature;
        _needsCustomerSignature = false;
      });
        // İmzayı metadata ile kaydet
        await _saveSignatureWithMetadata(
          signatureBase64: signature,
          coordinates: result['coordinates'] as Map<String, dynamic>,
          pageNumber: result['pageNumber'] as int,
          type: 'customer',
        );
      // PDF oluştur
      await _generatePdf();
      }
    } else if (mounted) {
      // İmza alınmadıysa geri dön
      context.pop();
    }
  }

  // NOT: Eski imza kaydetme fonksiyonları kaldırıldı
  // Artık tüm imzalar _saveSignatureWithMetadata ile service_signatures tablosuna kaydediliyor

  // YENİ: Metadata ile imza kaydetme
  Future<void> _saveSignatureWithMetadata({
    required String signatureBase64,
    required Map<String, dynamic> coordinates,
    required int pageNumber,
    required String type,
  }) async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      
      // Servis talebini al (user name için)
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      final userName = type == 'technician'
        ? serviceRequest.technicianName ?? 'Teknisyen'
        : serviceRequest.customerName ?? 'Müşteri';

      await service.saveSignatureWithMetadata(
        serviceRequestId: widget.serviceRequestId,
        signatureType: type,
        signatureBase64: signatureBase64,
        userName: userName,
        coordinates: coordinates,
        pageNumber: pageNumber,
      );

      // Provider'ı yenile
      ref.invalidate(serviceRequestByIdProvider(widget.serviceRequestId));

      print('✅ $type imzası kaydedildi');
    } catch (e) {
      print('❌ İmza kaydetme hatası: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('İmza kaydedilemedi: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _generatePdf() async {
    if (_isGeneratingPdf) return;

    setState(() {
      _isGeneratingPdf = true;
    });

    try {
      // Servis verisini al
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);

      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      // Edge Function ile imzalı PDF oluştur
      final pdfService = ServiceSlipPdfService();
      Uint8List pdfBytes;
      
      try {
        pdfBytes = await pdfService.generateServiceSlipPdfFromWeb(
          serviceRequest,
          templateId: widget.templateId,
        );
      } catch (webError) {
        print('❌ Edge Function PDF oluşturma hatası: $webError');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('PDF oluşturma hatası: $webError'),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
        return;
      }

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
        // Geri dön
        if (mounted) {
          context.pop();
        }
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

  @override
  void initState() {
    super.initState();
    // Sayfa açıldığında mevcut imzaları kontrol et ve eksik olanları al
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkExistingSignatures();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: const Text(
          'İmza Alma',
          style: TextStyle(
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
      body: Center(
        child: _isGeneratingPdf
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CupertinoActivityIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'PDF oluşturuluyor...',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    CupertinoIcons.checkmark_circle,
                    size: 64,
                    color: Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  if (_technicianSignature != null && _customerSignature != null)
                    const Text(
                      'Her iki imza da alındı',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else if (_technicianSignature != null)
                    const Text(
                      'Teknisyen imzası alındı',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else
                    const Text(
                      'İmza alınıyor...',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

