import 'dart:convert';
import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import '../models/service_request.dart';
import 'service_request_service.dart';

class ServiceSlipPdfService {
  // Servis fişi PDF'i oluştur
  Future<Uint8List> generateServiceSlipPdf(ServiceRequest serviceRequest) async {
    final pdf = pw.Document();

    // Şirket bilgilerini Supabase'den çek
    final supabase = Supabase.instance.client;
    final userId = supabase.auth.currentUser?.id;

    Map<String, dynamic>? companyData;
    if (userId != null) {
      try {
        // Kullanıcının company_id'sini al
        final profileResponse = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .maybeSingle();

        final companyId = profileResponse?['company_id'];

        if (companyId != null) {
          // Şirket bilgilerini çek
          final companyResponse = await supabase
              .from('companies')
              .select('*')
              .eq('id', companyId)
              .eq('is_active', true)
              .maybeSingle();

          companyData = companyResponse;
        }
      } catch (e) {
        print('Şirket bilgileri çekilirken hata: $e');
      }
    }

    // Şirket bilgilerini hazırla
    final companyName = companyData?['name'] ?? 'Şirket Adı';
    final companyAddress = companyData?['address'] ?? '';
    final companyPhone = companyData?['phone'] ?? '';
    final companyEmail = companyData?['email'] ?? '';
    final companyWebsite = companyData?['website'] ?? '';
    final companyTaxNumber = companyData?['tax_number'] ?? '';
    final companyLogoUrl = companyData?['logo_url'];

    // Müşteri bilgileri
    final customerData = serviceRequest.customerData ?? {};
    final customerName = customerData['name'] ?? serviceRequest.customerName ?? 'Müşteri';
    final customerCompany = customerData['company'] ?? '';
    final customerPhone = customerData['mobile_phone'] ?? serviceRequest.contactPhone ?? '-';
    final customerEmail = customerData['email'] ?? '-';
    final customerAddress = customerData['address'] ?? serviceRequest.location ?? '-';

    // Teknisyen bilgisi
    final technicianName = serviceRequest.technicianName ?? '-';

    // Servis detayları
    final serviceDetails = serviceRequest.serviceDetails ?? {};
    final problemDescription = serviceDetails['problem_description'] ?? serviceRequest.description ?? '';
    final servicePerformed = serviceDetails['service_performed'] ?? serviceRequest.serviceResult ?? '';

    // Kullanılan ürünleri service_items tablosundan çek
    List<Map<String, dynamic>> usedProducts = [];
    try {
      final serviceRequestService = ServiceRequestService();
      usedProducts = await serviceRequestService.getServiceItems(serviceRequest.id);
    } catch (e) {
      print('Ürünler çekilirken hata: $e');
      // Hata durumunda serviceDetails içinden deneyebiliriz (eski veriler için)
      if (serviceDetails['used_products'] != null) {
        usedProducts = List<Map<String, dynamic>>.from(serviceDetails['used_products']);
      }
    }

    // İmzalar
    Uint8List? technicianSignatureBytes;
    Uint8List? customerSignatureBytes;

    if (serviceRequest.technicianSignature != null && serviceRequest.technicianSignature!.isNotEmpty) {
      try {
        technicianSignatureBytes = base64Decode(serviceRequest.technicianSignature!);
      } catch (e) {
        // İmza decode hatası - sessizce devam et
      }
    }

    if (serviceRequest.customerSignature != null && serviceRequest.customerSignature!.isNotEmpty) {
      try {
        customerSignatureBytes = base64Decode(serviceRequest.customerSignature!);
      } catch (e) {
        // İmza decode hatası - sessizce devam et
      }
    }

    // Logo yükle (eğer varsa)
    pw.ImageProvider? logoImage;
    if (companyLogoUrl != null && companyLogoUrl.isNotEmpty) {
      try {
        final response = await http.get(Uri.parse(companyLogoUrl));
        if (response.statusCode == 200) {
          logoImage = pw.MemoryImage(response.bodyBytes);
        }
      } catch (e) {
        print('Logo yüklenirken hata: $e');
      }
    }

    // Roboto fontlarını yükle
    final fontRegular = await PdfGoogleFonts.robotoRegular();
    final fontBold = await PdfGoogleFonts.robotoBold();

    // Standart A4 formatı
    final pageFormat = PdfPageFormat.a4.copyWith(
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
    );

    pdf.addPage(
      pw.MultiPage(
        pageFormat: pageFormat,
        theme: pw.ThemeData.withFont(
          base: fontRegular,
          bold: fontBold,
        ),
        build: (pw.Context context) {
          return [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
            // HEADER - Logo ve Şirket Bilgileri (Sol) + Başlık (Sağ)
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 4),
              margin: const pw.EdgeInsets.only(bottom: 6),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(width: 1.5, color: PdfColors.grey300)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Sol taraf - Logo + Şirket Bilgileri
                  pw.Expanded(
                    flex: 2,
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        // Logo
                        if (logoImage != null)
                          pw.Container(
                            width: 60,
                            height: 60,
                            margin: const pw.EdgeInsets.only(right: 6),
                            child: pw.Image(logoImage, fit: pw.BoxFit.contain),
                          ),
                        // Şirket Bilgileri
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text(
                                companyName,
                                style: pw.TextStyle(
                                  fontSize: 12,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColors.grey900,
                                ),
                              ),
                              if (companyAddress.isNotEmpty) ...[
                                pw.SizedBox(height: 1),
                                pw.Text(
                                  companyAddress,
                                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                                ),
                              ],
                              if (companyPhone.isNotEmpty) ...[
                                pw.SizedBox(height: 1),
                                pw.Text(
                                  'Tel: $companyPhone',
                                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                                ),
                              ],
                              if (companyEmail.isNotEmpty) ...[
                                pw.SizedBox(height: 1),
                                pw.Text(
                                  'E-posta: $companyEmail',
                                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                                ),
                              ],
                              if (companyWebsite.isNotEmpty) ...[
                                pw.SizedBox(height: 1),
                                pw.Text(
                                  'Web: $companyWebsite',
                                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                                ),
                              ],
                              if (companyTaxNumber.isNotEmpty) ...[
                                pw.SizedBox(height: 1),
                                pw.Text(
                                  companyTaxNumber,
                                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Sağ taraf - Başlık
                  pw.Container(
                    alignment: pw.Alignment.centerRight,
                    child: pw.Text(
                      'SERVİS FORMU',
                      style: pw.TextStyle(
                        fontSize: 18,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.grey900,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 4),

            // İKİ SÜTUNLU LAYOUT - Servis Bilgileri (Sol) + Müşteri Bilgileri (Sağ)
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Sol Sütun - Servis Bilgileri
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Servis Bilgileri',
                        style: pw.TextStyle(
                          fontSize: 14,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.grey800,
                        ),
                      ),
                      pw.Container(
                        width: double.infinity,
                        height: 1,
                        color: PdfColors.grey300,
                        margin: const pw.EdgeInsets.only(top: 1, bottom: 2),
                      ),
                      _buildCompactInfoRow('Servis No:', serviceRequest.serviceNumber ?? '-'),
                      _buildCompactInfoRow('Servis Başlığı:', serviceRequest.title),
                      _buildCompactInfoRow('Servis Durumu:', _translateStatus(serviceRequest.status)),
                      _buildCompactInfoRow('Servis Tipi:', serviceRequest.serviceType ?? '-'),
                      _buildCompactInfoRow('Bildirme Tarihi:', _formatDate(serviceRequest.issueDate ?? serviceRequest.createdAt)),
                      _buildCompactInfoRow('Teknisyen:', technicianName),
                    ],
                  ),
                ),

                pw.SizedBox(width: 15),

                // Sağ Sütun - Müşteri Bilgileri
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Müşteri Bilgileri',
                        style: pw.TextStyle(
                          fontSize: 14,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.grey800,
                        ),
                      ),
                      pw.Container(
                        width: double.infinity,
                        height: 1,
                        color: PdfColors.grey300,
                        margin: const pw.EdgeInsets.only(top: 1, bottom: 2),
                      ),
                      if (customerCompany.isNotEmpty)
                        _buildCompactInfoRow('Şirket:', customerCompany),
                      _buildCompactInfoRow('Ad:', customerName),
                      _buildCompactInfoRow('Telefon:', customerPhone),
                      if (customerEmail != '-')
                        _buildCompactInfoRow('E-posta:', customerEmail),
                      _buildCompactInfoRow('Adres:', customerAddress),
                    ],
                  ),
                ),
              ],
            ),

            pw.SizedBox(height: 4),

            // Servis Açıklaması
            if (problemDescription.isNotEmpty) ...[
              pw.Text(
                'Servis Açıklaması:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.grey800,
                ),
              ),
              pw.SizedBox(height: 1),
              pw.Text(
                problemDescription,
                style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
              ),
              pw.SizedBox(height: 4),
            ],

            // Servis Sonucu
            if (servicePerformed.isNotEmpty) ...[
              pw.Text(
                'Servis Sonucu:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.grey800,
                ),
              ),
              pw.SizedBox(height: 1),
              pw.Text(
                servicePerformed,
                style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
              ),
              pw.SizedBox(height: 4),
            ],

            // Kullanılan Parçalar Tablosu
            if (usedProducts.isNotEmpty) ...[
              pw.Text(
                'Kullanılan Parçalar',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.grey800,
                ),
              ),
              pw.SizedBox(height: 2),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                columnWidths: {
                  0: const pw.FixedColumnWidth(30),  // #
                  1: const pw.FlexColumnWidth(3),    // Parça Adı
                  2: const pw.FlexColumnWidth(1.2),  // Miktar
                  3: const pw.FlexColumnWidth(1),    // Birim
                  4: const pw.FlexColumnWidth(1.5),  // Birim Fiyat
                  5: const pw.FlexColumnWidth(1.5),  // Toplam
                },
                children: [
                  // Header
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _buildTableHeader('#'),
                      _buildTableHeader('Parça Adı'),
                      _buildTableHeader('Miktar'),
                      _buildTableHeader('Birim'),
                      _buildTableHeader('Birim Fiyat'),
                      _buildTableHeader('Toplam'),
                    ],
                  ),
                  // Rows
                  ...usedProducts.asMap().entries.map((entry) {
                    final index = entry.key;
                    final product = entry.value;
                    final name = product['name'] ?? '-';
                    final quantityValue = (product['quantity'] is num)
                        ? (product['quantity'] as num).toDouble()
                        : double.tryParse(product['quantity']?.toString() ?? '0') ?? 0;
                    final unit = product['unit'] ?? 'adet';
                    final unitPriceValue = (product['unit_price'] ?? product['price'] ?? 0);
                    final priceValue = (unitPriceValue is num)
                        ? unitPriceValue.toDouble()
                        : double.tryParse(unitPriceValue.toString()) ?? 0;
                    final total = quantityValue * priceValue;

                    return pw.TableRow(
                      children: [
                        _buildTableCell('${index + 1}', pw.TextAlign.center),
                        _buildTableCell(name, pw.TextAlign.left),
                        _buildTableCell(quantityValue.toInt().toString(), pw.TextAlign.center),
                        _buildTableCell(unit, pw.TextAlign.center),
                        _buildTableCell('${priceValue.toStringAsFixed(2)} TL', pw.TextAlign.right),
                        _buildTableCell('${total.toStringAsFixed(2)} TL', pw.TextAlign.right),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 4),
            ],

            pw.SizedBox(height: 12),

            // İmza Alanları
            pw.Container(
              padding: const pw.EdgeInsets.only(top: 8),
              margin: const pw.EdgeInsets.only(top: 6),
              decoration: const pw.BoxDecoration(
                border: pw.Border(top: pw.BorderSide(width: 1, color: PdfColors.grey300)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Teknisyen İmzası
                  pw.Container(
                    width: 180,
                    child: pw.Column(
                      children: [
                        if (technicianSignatureBytes != null)
                          pw.Container(
                            width: 130,
                            height: 50,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400, style: pw.BorderStyle.dashed),
                            ),
                            child: pw.Image(
                              pw.MemoryImage(technicianSignatureBytes),
                              fit: pw.BoxFit.contain,
                            ),
                          )
                        else
                          pw.Container(
                            width: 130,
                            height: 50,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400, style: pw.BorderStyle.dashed),
                              color: PdfColors.grey50,
                            ),
                          ),
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'Teknisyen',
                          style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          technicianName,
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                  ),
                  // Müşteri İmzası
                  pw.Container(
                    width: 180,
                    child: pw.Column(
                      children: [
                        if (customerSignatureBytes != null)
                          pw.Container(
                            width: 130,
                            height: 50,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400, style: pw.BorderStyle.dashed),
                            ),
                            child: pw.Image(
                              pw.MemoryImage(customerSignatureBytes),
                              fit: pw.BoxFit.contain,
                            ),
                          )
                        else
                          pw.Container(
                            width: 130,
                            height: 50,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400, style: pw.BorderStyle.dashed),
                              color: PdfColors.grey50,
                            ),
                          ),
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'Müşteri',
                          style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          customerName,
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  // Kompakt info satırı oluşturucu
  pw.Widget _buildCompactInfoRow(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 1, top: 1),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 100,
            child: pw.Text(
              label,
              style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey800),
            ),
          ),
        ],
      ),
    );
  }

  // Tablo header oluşturucu
  pw.Widget _buildTableHeader(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Text(
        text,
        style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  // Tablo cell oluşturucu
  pw.Widget _buildTableCell(String text, pw.TextAlign align) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Text(
        text,
        style: const pw.TextStyle(fontSize: 9),
        textAlign: align,
      ),
    );
  }

  // Tarih formatlama
  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  // Status çevirme
  String _translateStatus(String? status) {
    if (status == null) return '-';
    const statusMap = {
      'new': 'Yeni',
      'assigned': 'Atandı',
      'in_progress': 'Devam Ediyor',
      'on_hold': 'Beklemede',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
    };
    return statusMap[status] ?? status;
  }

  // PDF'i görüntüle ve paylaş
  Future<void> previewAndShare(Uint8List pdfBytes, String fileName) async {
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
    );
  }

  // PDF'i paylaş
  Future<void> sharePdf(Uint8List pdfBytes, String fileName) async {
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: fileName,
    );
  }

  // Edge function kullanarak PDF önizlemesi oluştur (imzasız)
  Future<Uint8List> generateServiceSlipPdfPreview(
    ServiceRequest serviceRequest, {
    String? templateId,
  }) async {
    try {
      final supabase = Supabase.instance.client;
      
      // Get current session
      final session = supabase.auth.currentSession;
      if (session == null) {
        throw Exception('Kullanıcı oturumu bulunamadı');
      }

      print('📄 Servis fişi PDF önizlemesi oluşturuluyor: ${serviceRequest.id}');

      // Call Edge Function with preview mode
      final response = await supabase.functions.invoke(
        'generate-service-slip-pdf',
        body: {
          'serviceRequestId': serviceRequest.id,
          if (templateId != null) 'templateId': templateId,
          'preview': true, // Preview mode - imzasız PDF
        },
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );

      print('📄 Edge function yanıtı: status=${response.status}');

      // Check for errors
      if (response.data == null) {
        throw Exception('PDF oluşturulamadı: Boş yanıt');
      }

      final responseData = response.data as Map<String, dynamic>;
      
      // Check if the response indicates an error
      if (responseData['success'] != true) {
        final errorMessage = responseData['error'] ?? 'PDF oluşturulamadı';
        print('❌ PDF oluşturma hatası: $errorMessage');
        throw Exception(errorMessage);
      }

      // Decode base64 PDF data
      final pdfBase64 = responseData['pdfData'] as String?;
      if (pdfBase64 == null || pdfBase64.isEmpty) {
        throw Exception('PDF verisi alınamadı');
      }
      
      final pdfBytes = base64Decode(pdfBase64);
      print('✅ PDF önizlemesi başarıyla oluşturuldu: ${pdfBytes.length} bytes');

      return pdfBytes;
    } catch (e) {
      print('❌ PDF önizleme hatası: $e');
      rethrow;
    }
  }

  // Edge function kullanarak PDF oluştur (imzalı)
  Future<Uint8List> generateServiceSlipPdfFromWeb(
    ServiceRequest serviceRequest, {
    String? templateId,
  }) async {
    try {
      final supabase = Supabase.instance.client;
      
      // Get current session
      final session = supabase.auth.currentSession;
      if (session == null) {
        throw Exception('Kullanıcı oturumu bulunamadı');
      }

      // İmzaları service_signatures tablosundan al
      final signaturesResponse = await supabase
          .from('service_signatures')
          .select('*')
          .eq('service_request_id', serviceRequest.id);

      final signatures = (signaturesResponse as List).cast<Map<String, dynamic>>();
      
      Map<String, dynamic>? technicianSignature;
      Map<String, dynamic>? customerSignature;
      
      for (var sig in signatures) {
        if (sig['signature_type'] == 'technician') {
          technicianSignature = {
            'data': sig['signature_data'],
            'coordinates': sig['coordinates'],
            'pageNumber': sig['page_number'],
            'userName': sig['user_name'],
          };
        } else if (sig['signature_type'] == 'customer') {
          customerSignature = {
            'data': sig['signature_data'],
            'coordinates': sig['coordinates'],
            'pageNumber': sig['page_number'],
            'userName': sig['user_name'],
          };
        }
      }

      print('📄 Servis fişi PDF oluşturuluyor (imzalı): ${serviceRequest.id}');

      // Call Edge Function with signatures
      final response = await supabase.functions.invoke(
        'generate-service-slip-pdf',
        body: {
          'serviceRequestId': serviceRequest.id,
          if (templateId != null) 'templateId': templateId,
          'preview': false, // Final PDF - imzalı
          if (technicianSignature != null) 'technicianSignature': technicianSignature,
          if (customerSignature != null) 'customerSignature': customerSignature,
        },
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );

      print('📄 Edge function yanıtı: status=${response.status}');

      // Check for errors
      if (response.data == null) {
        throw Exception('PDF oluşturulamadı: Boş yanıt');
      }

      final responseData = response.data as Map<String, dynamic>;
      
      // Check if the response indicates an error
      if (responseData['success'] != true) {
        final errorMessage = responseData['error'] ?? 'PDF oluşturulamadı';
        print('❌ PDF oluşturma hatası: $errorMessage');
        throw Exception(errorMessage);
      }

      // Decode base64 PDF data
      final pdfBase64 = responseData['pdfData'] as String?;
      if (pdfBase64 == null || pdfBase64.isEmpty) {
        throw Exception('PDF verisi alınamadı');
      }
      
      final pdfBytes = base64Decode(pdfBase64);
      print('✅ PDF başarıyla oluşturuldu: ${pdfBytes.length} bytes');

      return pdfBytes;
    } catch (e) {
      print('❌ Web PDF generation error: $e');
      rethrow;
    }
  }
}

