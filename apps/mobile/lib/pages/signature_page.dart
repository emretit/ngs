import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:signature/signature.dart';

class SignaturePage extends StatefulWidget {
  final String title;
  final String? existingSignature;
  final int pageNumber; // YENİ: Sayfa numarası

  const SignaturePage({
    super.key,
    required this.title,
    this.existingSignature,
    this.pageNumber = 1, // Varsayılan 1
  });

  @override
  State<SignaturePage> createState() => _SignaturePageState();
}

class _SignaturePageState extends State<SignaturePage> {
  final SignatureController _controller = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
    exportPenColor: Colors.black,
  );

  // Canvas boyutları (render sonrası alınacak)
  double? _canvasWidth;
  double? _canvasHeight;

  @override
  void initState() {
    super.initState();
    // Not: SignatureController'da fromBytes metodu yok
    // Mevcut imza varsa, kullanıcı yeni imza çizebilir veya mevcut imzayı görüntüleyebiliriz
    // Şimdilik sadece yeni imza alıyoruz
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<String?> _exportSignature() async {
    if (_controller.isEmpty) {
      return null;
    }

    try {
      final Uint8List? signatureBytes = await _controller.toPngBytes(
        height: 200,
        width: 400,
      );

      if (signatureBytes != null) {
        return base64Encode(signatureBytes);
      }
      return null;
    } catch (e) {
      debugPrint('İmza export hatası: $e');
      return null;
    }
  }

  // YENİ: Koordinat bilgileri ile imza export
  Future<Map<String, dynamic>?> _exportSignatureWithCoordinates() async {
    if (_controller.isEmpty) {
      return null;
    }

    try {
      // Canvas boyutları
      final canvasWidth = _canvasWidth ?? 400.0;
      final canvasHeight = _canvasHeight ?? 200.0;

      // İmza PNG bytes
      final Uint8List? signatureBytes = await _controller.toPngBytes(
        height: canvasHeight.toInt(),
        width: canvasWidth.toInt(),
      );

      if (signatureBytes == null) {
        return null;
      }

      // Base64 encode
      final base64Signature = base64Encode(signatureBytes);

      // Bounding box hesapla (basit yaklaşım: tüm canvas)
      // Not: SignatureController'da direkt bounding box API'si yok
      // Gerçek bounding box için imza path'lerini analiz etmek gerekir
      final boundingBox = {
        'x': 0.0,
        'y': 0.0,
        'width': canvasWidth,
        'height': canvasHeight,
      };

      // Koordinat bilgileri
      final coordinates = {
        'canvas': {
          'width': canvasWidth,
          'height': canvasHeight,
        },
        'boundingBox': boundingBox,
      };

      return {
        'signature': base64Signature,
        'coordinates': coordinates,
        'pageNumber': widget.pageNumber,
      };
    } catch (e) {
      debugPrint('İmza export hatası: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(
          widget.title,
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
        leading: CupertinoButton(
          onPressed: () => Navigator.pop(context),
          child: const Icon(CupertinoIcons.back),
        ),
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Canvas boyutlarını kaydet
            _canvasWidth = constraints.maxWidth - 32; // margin çıkar
            _canvasHeight = constraints.maxHeight * 0.7; // yaklaşık yükseklik
            
            return Column(
          children: [
            // İmza alanı
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      spreadRadius: 0,
                      blurRadius: 12,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Signature(
                    controller: _controller,
                    backgroundColor: Colors.white,
                    height: double.infinity,
                    width: double.infinity,
                  ),
                ),
              ),
            ),
            
            // Alt butonlar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(
                    color: Colors.grey.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    // Temizle butonu
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: CupertinoButton(
                        onPressed: () {
                          _controller.clear();
                        },
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              CupertinoIcons.delete,
                              color: Colors.grey[700],
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Temizle',
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Kaydet butonu
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: CupertinoButton(
                        onPressed: () async {
                          if (_controller.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Lütfen imza çizin'),
                                backgroundColor: Color(0xFFEF4444),
                              ),
                            );
                            return;
                          }

                          final result = await _exportSignatureWithCoordinates();
                          if (!mounted) return;
                          if (result != null) {
                            Navigator.pop(context, result);
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('İmza kaydedilemedi'),
                                backgroundColor: Color(0xFFEF4444),
                              ),
                            );
                          }
                        },
                        color: const Color(0xFFB73D3D),
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
                              'İmzayı Kaydet',
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
                  ],
                ),
              ),
            ),
          ],
            );
          },
        ),
      ),
    );
  }
}

