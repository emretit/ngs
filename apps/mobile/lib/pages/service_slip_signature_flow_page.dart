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
      final serviceRequest = await ref.read(serviceRequestByIdProvider(widget.serviceRequestId).future);
      if (serviceRequest == null) {
        throw Exception('Servis bulunamadı');
      }

      final hasTechnicianSignature = serviceRequest.technicianSignature != null && 
                                     serviceRequest.technicianSignature!.isNotEmpty;
      final hasCustomerSignature = serviceRequest.customerSignature != null && 
                                   serviceRequest.customerSignature!.isNotEmpty;

      setState(() {
        _needsTechnicianSignature = !hasTechnicianSignature;
        _needsCustomerSignature = !hasCustomerSignature;
        _technicianSignature = serviceRequest.technicianSignature;
        _customerSignature = serviceRequest.customerSignature;
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
    final signature = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const SignaturePage(
          title: 'Teknisyen İmzası',
        ),
      ),
    );

    if (signature != null && mounted) {
      setState(() {
        _technicianSignature = signature;
        _needsTechnicianSignature = false;
      });
      // İmzayı kaydet
      await _saveTechnicianSignature(signature);
      // Müşteri imzasına geç veya PDF oluştur
      if (_needsCustomerSignature) {
        _collectCustomerSignature();
      } else {
        await _generatePdf();
      }
    } else if (mounted) {
      // İmza alınmadıysa geri dön
      context.pop();
    }
  }

  Future<void> _collectCustomerSignature() async {
    final signature = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const SignaturePage(
          title: 'Müşteri İmzası',
        ),
      ),
    );

    if (signature != null && mounted) {
      setState(() {
        _customerSignature = signature;
        _needsCustomerSignature = false;
      });
      // İmzayı kaydet
      await _saveCustomerSignature(signature);
      // PDF oluştur
      await _generatePdf();
    } else if (mounted) {
      // İmza alınmadıysa geri dön
      context.pop();
    }
  }

  Future<void> _saveTechnicianSignature(String signature) async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      await service.signServiceSlip(widget.serviceRequestId, signature);
      ref.invalidate(serviceRequestByIdProvider(widget.serviceRequestId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Teknisyen imzası kaydedilemedi: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _saveCustomerSignature(String signature) async {
    try {
      final service = ref.read(serviceRequestServiceProvider);
      await service.signServiceSlipByCustomer(widget.serviceRequestId, signature);
      ref.invalidate(serviceRequestByIdProvider(widget.serviceRequestId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Müşteri imzası kaydedilemedi: $e'),
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

      // PDF oluştur
      final pdfService = ServiceSlipPdfService();
      Uint8List pdfBytes;
      
      try {
        pdfBytes = await pdfService.generateServiceSlipPdfFromWeb(
          serviceRequest,
          templateId: widget.templateId,
        );
      } catch (webError) {
        print('Web PDF renderer failed, using local: $webError');
        pdfBytes = await pdfService.generateServiceSlipPdf(serviceRequest);
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

