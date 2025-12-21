import 'dart:convert';
import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/service_request.dart';

class ServiceSlipPdfService {
  // Servis fişi PDF'i oluştur
  Future<Uint8List> generateServiceSlipPdf(ServiceRequest serviceRequest) async {
    final pdf = pw.Document();

    // Müşteri bilgileri
    final customerData = serviceRequest.customerData ?? {};
    final customerName = customerData['name'] ?? serviceRequest.customerName ?? 'Müşteri';
    final customerPhone = customerData['phone'] ?? serviceRequest.contactPhone ?? '-';
    final customerAddress = customerData['address'] ?? serviceRequest.location ?? '-';

    // Ekipman bilgileri
    final equipmentData = serviceRequest.equipmentData ?? {};
    final equipmentBrand = equipmentData['brand'] ?? '-';
    final equipmentModel = equipmentData['model'] ?? '-';
    final equipmentSerial = equipmentData['serial_number'] ?? '-';

    // Servis detayları
    final serviceDetails = serviceRequest.serviceDetails ?? {};
    final problemDescription = serviceDetails['problem_description'] ?? serviceRequest.description ?? '-';
    final servicePerformed = serviceDetails['service_performed'] ?? serviceRequest.serviceResult ?? '-';
    final notes = serviceDetails['notes'] ?? '-';
    final usedProducts = serviceDetails['used_products'] as List<dynamic>? ?? [];

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

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (pw.Context context) {
          return [
            // Başlık
            pw.Header(
              level: 0,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Text(
                    'SERVİS FİŞİ',
                    style: pw.TextStyle(
                      fontSize: 24,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.red700,
                    ),
                  ),
                  if (serviceRequest.serviceNumber != null)
                    pw.Text(
                      'Servis No: ${serviceRequest.serviceNumber}',
                      style: const pw.TextStyle(fontSize: 14),
                    ),
                  if (serviceRequest.slipNumber != null)
                    pw.Text(
                      'Fiş No: ${serviceRequest.slipNumber}',
                      style: const pw.TextStyle(fontSize: 14),
                    ),
                ],
              ),
            ),
            pw.SizedBox(height: 20),

            // Tarih bilgileri
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Oluşturulma Tarihi:',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text(_formatDate(serviceRequest.createdAt)),
                  ],
                ),
                if (serviceRequest.issueDate != null)
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'İşlem Tarihi:',
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      ),
                      pw.Text(_formatDate(serviceRequest.issueDate!)),
                    ],
                  ),
                if (serviceRequest.completionDate != null)
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Tamamlanma Tarihi:',
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      ),
                      pw.Text(_formatDate(serviceRequest.completionDate!)),
                    ],
                  ),
              ],
            ),
            pw.SizedBox(height: 20),

            // Müşteri Bilgileri
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'MÜŞTERİ BİLGİLERİ',
                    style: pw.TextStyle(
                      fontSize: 16,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.blue700,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  _buildInfoRow('Ad Soyad:', customerName),
                  _buildInfoRow('Telefon:', customerPhone),
                  _buildInfoRow('Adres:', customerAddress),
                ],
              ),
            ),
            pw.SizedBox(height: 15),

            // Ekipman Bilgileri
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'EKİPMAN BİLGİLERİ',
                    style: pw.TextStyle(
                      fontSize: 16,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.blue700,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  _buildInfoRow('Marka:', equipmentBrand),
                  _buildInfoRow('Model:', equipmentModel),
                  _buildInfoRow('Seri No:', equipmentSerial),
                ],
              ),
            ),
            pw.SizedBox(height: 15),

            // Servis Bilgileri
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'SERVİS BİLGİLERİ',
                    style: pw.TextStyle(
                      fontSize: 16,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.blue700,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Başlık:',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text(serviceRequest.title),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Arıza Açıklaması:',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text(problemDescription),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Yapılan İşlemler:',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text(servicePerformed),
                  if (notes != '-' && notes.isNotEmpty) ...[
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'Notlar:',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text(notes),
                  ],
                ],
              ),
            ),
            pw.SizedBox(height: 15),

            // Kullanılan Ürünler
            if (usedProducts.isNotEmpty) ...[
              pw.Container(
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'KULLANILAN ÜRÜNLER',
                      style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.blue700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Table(
                      border: pw.TableBorder.all(color: PdfColors.grey300),
                      children: [
                        // Başlık satırı
                        pw.TableRow(
                          decoration: const pw.BoxDecoration(
                            color: PdfColors.grey200,
                          ),
                          children: [
                            pw.Padding(
                              padding: const pw.EdgeInsets.all(8),
                              child: pw.Text(
                                'Ürün Adı',
                                style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.all(8),
                              child: pw.Text(
                                'Miktar',
                                style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                                textAlign: pw.TextAlign.center,
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.all(8),
                              child: pw.Text(
                                'Birim Fiyat',
                                style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                                textAlign: pw.TextAlign.right,
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.all(8),
                              child: pw.Text(
                                'Toplam',
                                style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                                textAlign: pw.TextAlign.right,
                              ),
                            ),
                          ],
                        ),
                        // Ürün satırları
                        ...usedProducts.map((product) {
                          final name = product['name'] ?? '-';
                          final quantity = product['quantity']?.toString() ?? '0';
                          final unit = product['unit'] ?? 'adet';
                          final price = product['price']?.toString() ?? '0';
                          final total = (double.tryParse(quantity) ?? 0) * (double.tryParse(price) ?? 0);
                          
                          return pw.TableRow(
                            children: [
                              pw.Padding(
                                padding: const pw.EdgeInsets.all(8),
                                child: pw.Text(name),
                              ),
                              pw.Padding(
                                padding: const pw.EdgeInsets.all(8),
                                child: pw.Text(
                                  '$quantity $unit',
                                  textAlign: pw.TextAlign.center,
                                ),
                              ),
                              pw.Padding(
                                padding: const pw.EdgeInsets.all(8),
                                child: pw.Text(
                                  '$price TL',
                                  textAlign: pw.TextAlign.right,
                                ),
                              ),
                              pw.Padding(
                                padding: const pw.EdgeInsets.all(8),
                                child: pw.Text(
                                  '${total.toStringAsFixed(2)} TL',
                                  textAlign: pw.TextAlign.right,
                                ),
                              ),
                            ],
                          );
                        }),
                      ],
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 15),
            ],

            // İmzalar
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Teknisyen İmzası
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300),
                      borderRadius: pw.BorderRadius.circular(8),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Text(
                          'TEKNİSYEN İMZASI',
                          style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        if (technicianSignatureBytes != null)
                          pw.Image(
                            pw.MemoryImage(technicianSignatureBytes),
                            width: 200,
                            height: 80,
                            fit: pw.BoxFit.contain,
                          )
                        else
                          pw.Container(
                            width: 200,
                            height: 80,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400),
                            ),
                            child: pw.Center(
                              child: pw.Text(
                                'İmza Yok',
                                style: pw.TextStyle(color: PdfColors.grey600),
                              ),
                            ),
                          ),
                        pw.SizedBox(height: 8),
                        pw.Text(
                          serviceRequest.technicianName ?? 'Teknisyen',
                          style: const pw.TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
                pw.SizedBox(width: 20),
                // Müşteri İmzası
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300),
                      borderRadius: pw.BorderRadius.circular(8),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Text(
                          'MÜŞTERİ İMZASI',
                          style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        if (customerSignatureBytes != null)
                          pw.Image(
                            pw.MemoryImage(customerSignatureBytes),
                            width: 200,
                            height: 80,
                            fit: pw.BoxFit.contain,
                          )
                        else
                          pw.Container(
                            width: 200,
                            height: 80,
                            decoration: pw.BoxDecoration(
                              border: pw.Border.all(color: PdfColors.grey400),
                            ),
                            child: pw.Center(
                              child: pw.Text(
                                'İmza Yok',
                                style: pw.TextStyle(color: PdfColors.grey600),
                              ),
                            ),
                          ),
                        pw.SizedBox(height: 8),
                        pw.Text(
                          customerName,
                          style: const pw.TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 20),

            // Alt bilgi
            pw.Divider(),
            pw.SizedBox(height: 10),
            pw.Text(
              'Bu belge elektronik ortamda oluşturulmuştur.',
              style: pw.TextStyle(
                fontSize: 10,
                color: PdfColors.grey600,
                fontStyle: pw.FontStyle.italic,
              ),
              textAlign: pw.TextAlign.center,
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 100,
            child: pw.Text(
              label,
              style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Expanded(
            child: pw.Text(value),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
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

  // Edge function kullanarak PDF oluştur
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

      print('📄 Servis fişi PDF oluşturuluyor: ${serviceRequest.id}');

      // Call Edge Function
      final response = await supabase.functions.invoke(
        'generate-service-slip-pdf',
        body: {
          'serviceRequestId': serviceRequest.id,
          if (templateId != null) 'templateId': templateId,
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
      // Fallback to local PDF generation
      print('🔄 Yerel PDF oluşturucuya geçiliyor...');
      return await generateServiceSlipPdf(serviceRequest);
    }
  }
}

