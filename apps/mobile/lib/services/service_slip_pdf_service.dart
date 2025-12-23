import 'dart:convert';
import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import '../models/service_request.dart';
import 'service_request_service.dart';

class ServiceSlipPdfService {
  // Servis fişi PDF'i oluştur (şablon desteği ile)
  Future<Uint8List> generateServiceSlipPdf(
    ServiceRequest serviceRequest, {
    String? templateId,
  }) async {
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

    // 1. Şablonu çek (eğer templateId verilmişse)
    Map<String, dynamic>? pdfSchema;
    if (templateId != null) {
      try {
        print('📋 Şablon çekiliyor: $templateId');
        final response = await supabase
            .from('service_templates')
            .select('*')
            .eq('id', templateId)
            .single();
        
        // 2. pdf_schema'yı parse et
        if (response != null && response['service_details'] != null) {
          final serviceDetails = response['service_details'] as Map<String, dynamic>?;
          print('📦 service_details keys: ${serviceDetails?.keys.toList()}');
          
          if (serviceDetails != null && serviceDetails['pdf_schema'] != null) {
            pdfSchema = Map<String, dynamic>.from(serviceDetails['pdf_schema']);
            print('✅ Şablon yüklendi: ${response['name']}');
            print('📄 pdf_schema keys: ${pdfSchema.keys.toList()}');
            
            // Header ayarlarını logla
            if (pdfSchema['header'] != null) {
              final header = pdfSchema['header'] as Map<String, dynamic>;
              print('📋 Header ayarları:');
              print('  - showLogo: ${header['showLogo']}');
              print('  - showTitle: ${header['showTitle']}');
              print('  - title: ${header['title']}');
              print('  - companyName: ${header['companyName']}');
              print('  - logoUrl: ${header['logoUrl']}');
            }
            
            // Page ayarlarını logla
            if (pdfSchema['page'] != null) {
              final page = pdfSchema['page'] as Map<String, dynamic>;
              print('📄 Page ayarları:');
              print('  - fontSize: ${page['fontSize']}');
              print('  - fontFamily: ${page['fontFamily']}');
              print('  - fontColor: ${page['fontColor']}');
              print('  - backgroundColor: ${page['backgroundColor']}');
            }
          } else {
            print('⚠️ Şablon bulundu ama pdf_schema yok');
            print('   serviceDetails: $serviceDetails');
          }
        } else {
          print('⚠️ Şablon bulundu ama service_details yok');
          print('   response keys: ${response?.keys.toList()}');
        }
      } catch (e) {
        print('❌ Şablon yüklenirken hata: $e');
        // Hata durumunda şablon olmadan devam et
      }
    }

    // Header ayarları (şablon ayarlarından şirket bilgilerini al)
    final headerSettings = pdfSchema?['header'] ?? {};
    
    // Şirket bilgilerini şablon ayarlarından al, yoksa companyData'dan
    final companyName = headerSettings['companyName']?.toString().trim() ?? 
                       companyData?['name']?.toString().trim() ?? 
                       'Şirket Adı';
    final companyAddress = headerSettings['companyAddress']?.toString().trim() ?? 
                          companyData?['address']?.toString().trim() ?? '';
    final companyPhone = headerSettings['companyPhone']?.toString().trim() ?? 
                        companyData?['phone']?.toString().trim() ?? '';
    final companyEmail = headerSettings['companyEmail']?.toString().trim() ?? 
                       companyData?['email']?.toString().trim() ?? '';
    final companyWebsite = headerSettings['companyWebsite']?.toString().trim() ?? 
                          companyData?['website']?.toString().trim() ?? '';
    final companyTaxNumber = headerSettings['companyTaxNumber']?.toString().trim() ?? 
                            companyData?['tax_number']?.toString().trim() ?? '';
    
    // Logo URL'i şablon ayarlarından al, yoksa companyData'dan
    String? companyLogoUrl;
    if (headerSettings['logoUrl'] != null && headerSettings['logoUrl'].toString().trim().isNotEmpty) {
      companyLogoUrl = headerSettings['logoUrl'].toString().trim();
    } else {
      companyLogoUrl = companyData?['logo_url']?.toString().trim();
    }

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

    // 3. Bu schema'ya göre PDF oluştur
    // - pdfSchema['page']['fontSize'] → Font boyutu
    // - pdfSchema['header']['showLogo'] → Logo göster mi?
    // - pdfSchema['signatures']['show'] → İmza alanı göster mi?
    // vs...
    
    // Şablon ayarlarından sayfa formatını al
    final pageSettings = pdfSchema?['page'] ?? {};
    final pageSize = pageSettings['size'] ?? 'A4';
    final padding = pageSettings['padding'] ?? {'top': 40, 'right': 40, 'bottom': 40, 'left': 40};
    final fontSize = (pageSettings['fontSize'] ?? 12).toDouble();
    final fontFamilyName = pageSettings['fontFamily']?.toString() ?? 'Roboto';
    final fontColor = _parseColor(pageSettings['fontColor'] ?? '#000000');
    final backgroundColor = _parseColor(pageSettings['backgroundColor'] ?? '#FFFFFF');
    
    // Font bilgisini logla
    print('🔤 Font ayarları:');
    print('  - fontFamily: $fontFamilyName');
    print('  - fontSize: $fontSize');
    print('  - fontColor: ${pageSettings['fontColor']}');
    
    // Google Fonts'dan font yükle
    pw.Font? fontRegular;
    pw.Font? fontBold;
    
    try {
      // Google Fonts API'den font dosyalarını direkt indir
      if (fontFamilyName.toLowerCase() == 'roboto') {
        // Roboto Regular
        try {
          final regularResponse = await http.get(
            Uri.parse('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf'),
          );
          if (regularResponse.statusCode == 200) {
            final regularBytes = regularResponse.bodyBytes;
            fontRegular = pw.Font.ttf(regularBytes.buffer.asByteData());
            print('✅ Roboto Regular font yüklendi');
          }
        } catch (e) {
          print('⚠️ Roboto Regular yüklenemedi: $e');
        }
        
        // Roboto Bold
        try {
          final boldResponse = await http.get(
            Uri.parse('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf'),
          );
          if (boldResponse.statusCode == 200) {
            final boldBytes = boldResponse.bodyBytes;
            fontBold = pw.Font.ttf(boldBytes.buffer.asByteData());
            print('✅ Roboto Bold font yüklendi');
          }
        } catch (e) {
          print('⚠️ Roboto Bold yüklenemedi: $e');
        }
      } else {
        // Diğer fontlar için Google Fonts API'den deneyelim
        // Font adını URL-friendly hale getir
        final fontNameUrl = fontFamilyName.replaceAll(' ', '%20');
        try {
          // Regular font için
          final regularResponse = await http.get(
            Uri.parse('https://fonts.googleapis.com/css2?family=$fontNameUrl:wght@400&display=swap'),
          );
          
          // CSS'den font URL'ini parse et
          if (regularResponse.statusCode == 200) {
            final cssContent = regularResponse.body;
            final urlMatch = RegExp(r'url\(([^)]+)\)').firstMatch(cssContent);
            if (urlMatch != null) {
              final fontUrl = urlMatch.group(1)?.replaceAll("'", '').replaceAll('"', '');
              if (fontUrl != null) {
                final fontResponse = await http.get(Uri.parse(fontUrl));
                if (fontResponse.statusCode == 200) {
                  final fontBytes = fontResponse.bodyBytes;
                  fontRegular = pw.Font.ttf(fontBytes.buffer.asByteData());
                  print('✅ $fontFamilyName Regular font yüklendi');
                }
              }
            }
          }
          
          // Bold font için
          final boldResponse = await http.get(
            Uri.parse('https://fonts.googleapis.com/css2?family=$fontNameUrl:wght@700&display=swap'),
          );
          if (boldResponse.statusCode == 200) {
            final cssContent = boldResponse.body;
            final urlMatch = RegExp(r'url\(([^)]+)\)').firstMatch(cssContent);
            if (urlMatch != null) {
              final fontUrl = urlMatch.group(1)?.replaceAll("'", '').replaceAll('"', '');
              if (fontUrl != null) {
                final fontResponse = await http.get(Uri.parse(fontUrl));
                if (fontResponse.statusCode == 200) {
                  final fontBytes = fontResponse.bodyBytes;
                  fontBold = pw.Font.ttf(fontBytes.buffer.asByteData());
                  print('✅ $fontFamilyName Bold font yüklendi');
                }
              }
            }
          }
        } catch (e) {
          print('⚠️ $fontFamilyName font yüklenemedi, standart font kullanılıyor: $e');
        }
      }
    } catch (e) {
      print('⚠️ Google Fonts yüklenirken hata: $e');
    }
    
    // Font yüklenemediyse standart fontları kullan
    fontRegular ??= pw.Font.helvetica();
    fontBold ??= pw.Font.helveticaBold();

    // Sayfa formatını oluştur
    PdfPageFormat pageFormat;
    if (pageSize == 'A4') {
      pageFormat = PdfPageFormat.a4.copyWith(
        marginTop: (padding['top'] ?? 40).toDouble(),
        marginBottom: (padding['bottom'] ?? 40).toDouble(),
        marginLeft: (padding['left'] ?? 40).toDouble(),
        marginRight: (padding['right'] ?? 40).toDouble(),
      );
    } else {
      // Varsayılan A4
      pageFormat = PdfPageFormat.a4.copyWith(
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
      );
    }

    // Header ayarları (zaten yukarıda tanımlandı, sadece diğer ayarları al)
    final showLogo = headerSettings['showLogo'] ?? true;
    final logoPosition = headerSettings['logoPosition'] ?? 'left';
    final logoSize = (headerSettings['logoSize'] ?? 80).toDouble();
    final showTitle = headerSettings['showTitle'] ?? true;
    final title = headerSettings['title']?.toString().trim() ?? 'SERVİS FORMU';
    final titleFontSize = (headerSettings['titleFontSize'] ?? 18).toDouble();
    final showCompanyInfo = headerSettings['showCompanyInfo'] ?? true;
    final companyInfoFontSize = (headerSettings['companyInfoFontSize'] ?? 10).toDouble();

    // Service Info ayarları
    final serviceInfoSettings = pdfSchema?['serviceInfo'] ?? {};
    final serviceInfoTitleFontSize = (serviceInfoSettings['titleFontSize'] ?? 14).toDouble();
    final serviceInfoFontSize = (serviceInfoSettings['infoFontSize'] ?? 10).toDouble();
    final showServiceNumber = serviceInfoSettings['showServiceNumber'] ?? true;
    final showServiceStatus = serviceInfoSettings['showServiceStatus'] ?? true;
    final showTechnician = serviceInfoSettings['showTechnician'] ?? true;
    final showServiceType = serviceInfoSettings['showServiceType'] ?? true;
    final showDates = serviceInfoSettings['showDates'] ?? true;

    // Parts Table ayarları
    final partsTableSettings = pdfSchema?['partsTable'] ?? {};
    final showPartsTable = partsTableSettings['show'] ?? true;
    final showRowNumber = partsTableSettings['showRowNumber'] ?? true;
    final tableColumns = partsTableSettings['columns'] ?? [
      {'key': 'name', 'label': 'Ürün Adı', 'show': true, 'align': 'left'},
      {'key': 'quantity', 'label': 'Miktar', 'show': true, 'align': 'center'},
      {'key': 'unit', 'label': 'Birim', 'show': true, 'align': 'center'},
      {'key': 'unitPrice', 'label': 'Birim Fiyat', 'show': true, 'align': 'right'},
      {'key': 'total', 'label': 'Toplam', 'show': true, 'align': 'right'},
    ];

    // Signature ayarları
    final signatureSettings = pdfSchema?['signatures'] ?? {};
    final showSignatures = signatureSettings['show'] ?? true;
    final showTechnicianSignature = signatureSettings['showTechnician'] ?? true;
    final showCustomerSignature = signatureSettings['showCustomer'] ?? true;
    final technicianLabel = signatureSettings['technicianLabel'] ?? 'Teknisyen';
    final customerLabel = signatureSettings['customerLabel'] ?? 'Müşteri';
    final signatureFontSize = (signatureSettings['fontSize'] ?? 10).toDouble();

    // Notes ayarları
    final notesSettings = pdfSchema?['notes'] ?? {};
    final footer = notesSettings['footer'] ?? 'Servis hizmeti için teşekkür ederiz.';
    final footerFontSize = (notesSettings['footerFontSize'] ?? 10).toDouble();

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
            if (showLogo || showCompanyInfo || showTitle)
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
                          if (showLogo && logoImage != null)
                            pw.Container(
                              width: logoSize,
                              height: logoSize,
                              margin: const pw.EdgeInsets.only(right: 6),
                              child: pw.Image(logoImage, fit: pw.BoxFit.contain),
                            ),
                          // Şirket Bilgileri
                          if (showCompanyInfo)
                            pw.Expanded(
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text(
                                    companyName,
                                    style: pw.TextStyle(
                                      fontSize: companyInfoFontSize,
                                      fontWeight: pw.FontWeight.bold,
                                      color: fontColor,
                                    ),
                                  ),
                                  if (companyAddress.isNotEmpty) ...[
                                    pw.SizedBox(height: 1),
                                    pw.Text(
                                      companyAddress,
                                      style: pw.TextStyle(fontSize: companyInfoFontSize - 2, color: fontColor),
                                    ),
                                  ],
                                  if (companyPhone.isNotEmpty) ...[
                                    pw.SizedBox(height: 1),
                                    pw.Text(
                                      'Tel: $companyPhone',
                                      style: pw.TextStyle(fontSize: companyInfoFontSize - 2, color: fontColor),
                                    ),
                                  ],
                                  if (companyEmail.isNotEmpty) ...[
                                    pw.SizedBox(height: 1),
                                    pw.Text(
                                      'E-posta: $companyEmail',
                                      style: pw.TextStyle(fontSize: companyInfoFontSize - 2, color: fontColor),
                                    ),
                                  ],
                                  if (companyWebsite.isNotEmpty) ...[
                                    pw.SizedBox(height: 1),
                                    pw.Text(
                                      'Web: $companyWebsite',
                                      style: pw.TextStyle(fontSize: companyInfoFontSize - 2, color: fontColor),
                                    ),
                                  ],
                                  if (companyTaxNumber.isNotEmpty) ...[
                                    pw.SizedBox(height: 1),
                                    pw.Text(
                                      companyTaxNumber,
                                      style: pw.TextStyle(fontSize: companyInfoFontSize - 2, color: fontColor),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Sağ taraf - Başlık
                    if (showTitle)
                      pw.Container(
                        alignment: pw.Alignment.centerRight,
                        child: pw.Text(
                          title,
                          style: pw.TextStyle(
                            fontSize: titleFontSize,
                            fontWeight: pw.FontWeight.bold,
                            color: fontColor,
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
                          fontSize: serviceInfoTitleFontSize,
                          fontWeight: pw.FontWeight.bold,
                          color: fontColor,
                        ),
                      ),
                      pw.Container(
                        width: double.infinity,
                        height: 1,
                        color: PdfColors.grey300,
                        margin: const pw.EdgeInsets.only(top: 1, bottom: 2),
                      ),
                      if (showServiceNumber)
                        _buildCompactInfoRow('Servis No:', serviceRequest.serviceNumber ?? '-', serviceInfoFontSize, fontColor),
                      _buildCompactInfoRow('Servis Başlığı:', serviceRequest.title, serviceInfoFontSize, fontColor),
                      if (showServiceStatus)
                        _buildCompactInfoRow('Servis Durumu:', _translateStatus(serviceRequest.status), serviceInfoFontSize, fontColor),
                      if (showServiceType)
                        _buildCompactInfoRow('Servis Tipi:', serviceRequest.serviceType ?? '-', serviceInfoFontSize, fontColor),
                      if (showDates)
                        _buildCompactInfoRow('Bildirme Tarihi:', _formatDate(serviceRequest.issueDate ?? serviceRequest.createdAt), serviceInfoFontSize, fontColor),
                      if (showTechnician)
                        _buildCompactInfoRow('Teknisyen:', technicianName, serviceInfoFontSize, fontColor),
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
                          fontSize: serviceInfoTitleFontSize,
                          fontWeight: pw.FontWeight.bold,
                          color: fontColor,
                        ),
                      ),
                      pw.Container(
                        width: double.infinity,
                        height: 1,
                        color: PdfColors.grey300,
                        margin: const pw.EdgeInsets.only(top: 1, bottom: 2),
                      ),
                      if (customerCompany.isNotEmpty)
                        _buildCompactInfoRow('Şirket:', customerCompany, serviceInfoFontSize, fontColor),
                      _buildCompactInfoRow('Ad:', customerName, serviceInfoFontSize, fontColor),
                      _buildCompactInfoRow('Telefon:', customerPhone, serviceInfoFontSize, fontColor),
                      if (customerEmail != '-')
                        _buildCompactInfoRow('E-posta:', customerEmail, serviceInfoFontSize, fontColor),
                      _buildCompactInfoRow('Adres:', customerAddress, serviceInfoFontSize, fontColor),
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
                  fontSize: serviceInfoTitleFontSize,
                  fontWeight: pw.FontWeight.bold,
                  color: fontColor,
                ),
              ),
              pw.SizedBox(height: 1),
              pw.Text(
                problemDescription,
                style: pw.TextStyle(fontSize: serviceInfoFontSize, color: fontColor),
              ),
              pw.SizedBox(height: 4),
            ],

            // Servis Sonucu
            if (servicePerformed.isNotEmpty) ...[
              pw.Text(
                'Servis Sonucu:',
                style: pw.TextStyle(
                  fontSize: serviceInfoTitleFontSize,
                  fontWeight: pw.FontWeight.bold,
                  color: fontColor,
                ),
              ),
              pw.SizedBox(height: 1),
              pw.Text(
                servicePerformed,
                style: pw.TextStyle(fontSize: serviceInfoFontSize, color: fontColor),
              ),
              pw.SizedBox(height: 4),
            ],

            // Kullanılan Parçalar Tablosu
            if (showPartsTable && usedProducts.isNotEmpty) ...[
              pw.Text(
                'Kullanılan Parçalar',
                style: pw.TextStyle(
                  fontSize: serviceInfoTitleFontSize,
                  fontWeight: pw.FontWeight.bold,
                  color: fontColor,
                ),
              ),
              pw.SizedBox(height: 2),
              _buildPartsTable(usedProducts, tableColumns, showRowNumber, fontColor),
              pw.SizedBox(height: 4),
            ],

            pw.SizedBox(height: 12),

            // İmza Alanları
            if (showSignatures)
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
                    if (showTechnicianSignature)
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
                              technicianLabel,
                              style: pw.TextStyle(fontSize: signatureFontSize, fontWeight: pw.FontWeight.bold, color: fontColor),
                            ),
                            pw.SizedBox(height: 2),
                            pw.Text(
                              technicianName,
                              style: pw.TextStyle(fontSize: signatureFontSize, color: fontColor),
                            ),
                          ],
                        ),
                      ),
                    // Müşteri İmzası
                    if (showCustomerSignature)
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
                              customerLabel,
                              style: pw.TextStyle(fontSize: signatureFontSize, fontWeight: pw.FontWeight.bold, color: fontColor),
                            ),
                            pw.SizedBox(height: 2),
                            pw.Text(
                              customerName,
                              style: pw.TextStyle(fontSize: signatureFontSize, color: fontColor),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

            // Footer Notu
            if (footer.isNotEmpty) ...[
              pw.SizedBox(height: 8),
              pw.Text(
                footer,
                style: pw.TextStyle(fontSize: footerFontSize, color: fontColor),
                textAlign: pw.TextAlign.center,
              ),
            ],
          ],
        ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  // Kompakt info satırı oluşturucu
  pw.Widget _buildCompactInfoRow(String label, String value, [double? fontSize, PdfColor? fontColor]) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 1, top: 1),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 100,
            child: pw.Text(
              label,
              style: pw.TextStyle(
                fontSize: fontSize ?? 10,
                fontWeight: pw.FontWeight.bold,
                color: fontColor ?? PdfColors.grey900,
              ),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: fontSize ?? 10,
                color: fontColor ?? PdfColors.grey800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Parçalar tablosu oluşturucu
  pw.Widget _buildPartsTable(
    List<Map<String, dynamic>> usedProducts,
    List<dynamic> columns,
    bool showRowNumber,
    PdfColor fontColor,
  ) {
    // Görünür kolonları filtrele
    final visibleColumns = columns.where((col) => col['show'] == true).toList();
    
    // Kolon genişliklerini hesapla (hem Fixed hem Flex desteklemek için dynamic kullan)
    final columnWidths = <int, pw.TableColumnWidth>{};
    int colIndex = 0;
    
    if (showRowNumber) {
      columnWidths[colIndex++] = const pw.FixedColumnWidth(30);
    }
    
    for (var col in visibleColumns) {
      final key = col['key'] as String;
      if (key == 'name') {
        columnWidths[colIndex++] = const pw.FlexColumnWidth(3);
      } else if (key == 'quantity') {
        columnWidths[colIndex++] = const pw.FlexColumnWidth(1.2);
      } else if (key == 'unit') {
        columnWidths[colIndex++] = const pw.FlexColumnWidth(1);
      } else if (key == 'unitPrice' || key == 'total') {
        columnWidths[colIndex++] = const pw.FlexColumnWidth(1.5);
      } else {
        columnWidths[colIndex++] = const pw.FlexColumnWidth(1);
      }
    }

    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
      columnWidths: columnWidths,
      children: [
        // Header
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          children: [
            if (showRowNumber) _buildTableHeader('#', fontColor),
            ...visibleColumns.map((col) => _buildTableHeader(
              col['label'] ?? col['key'],
              fontColor,
              _getTextAlign(col['align'] ?? 'left'),
            )),
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
              if (showRowNumber) _buildTableCell('${index + 1}', pw.TextAlign.center, fontColor),
              ...visibleColumns.map((col) {
                final key = col['key'] as String;
                final align = _getTextAlign(col['align'] ?? 'left');
                String cellValue = '-';
                
                if (key == 'name') {
                  cellValue = name;
                } else if (key == 'quantity') {
                  cellValue = quantityValue.toInt().toString();
                } else if (key == 'unit') {
                  cellValue = unit;
                } else if (key == 'unitPrice') {
                  cellValue = '${priceValue.toStringAsFixed(2)} TL';
                } else if (key == 'total') {
                  cellValue = '${total.toStringAsFixed(2)} TL';
                }
                
                return _buildTableCell(cellValue, align, fontColor);
              }),
            ],
          );
        }),
      ],
    );
  }

  // TextAlign string'den PdfTextAlign'a dönüştür
  pw.TextAlign _getTextAlign(String align) {
    switch (align.toLowerCase()) {
      case 'center':
        return pw.TextAlign.center;
      case 'right':
        return pw.TextAlign.right;
      default:
        return pw.TextAlign.left;
    }
  }

  // Renk string'den PdfColor'a dönüştür
  PdfColor _parseColor(String colorString) {
    try {
      if (colorString.startsWith('#')) {
        final hex = colorString.substring(1);
        if (hex.length == 6) {
          final r = int.parse(hex.substring(0, 2), radix: 16);
          final g = int.parse(hex.substring(2, 4), radix: 16);
          final b = int.parse(hex.substring(4, 6), radix: 16);
          // RGB değerlerini tek bir int'e dönüştür (0xRRGGBB formatında)
          final colorInt = (r << 16) | (g << 8) | b;
          return PdfColor.fromInt(colorInt);
        }
      }
    } catch (e) {
      print('Renk parse hatası: $e');
    }
    return PdfColors.black;
  }

  // Tablo header oluşturucu
  pw.Widget _buildTableHeader(String text, [PdfColor? fontColor, pw.TextAlign? align]) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 10,
          fontWeight: pw.FontWeight.bold,
          color: fontColor ?? PdfColors.black,
        ),
        textAlign: align ?? pw.TextAlign.center,
      ),
    );
  }

  // Tablo cell oluşturucu
  pw.Widget _buildTableCell(String text, pw.TextAlign align, [PdfColor? fontColor]) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 9,
          color: fontColor ?? PdfColors.black,
        ),
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

  // PDF önizlemesi oluştur (imzasız) - Artık lokal renderer kullanıyor
  Future<Uint8List> generateServiceSlipPdfPreview(
    ServiceRequest serviceRequest, {
    String? templateId,
  }) async {
    print('📄 Servis fişi PDF önizlemesi oluşturuluyor: ${serviceRequest.id}');
    // İmzasız PDF için serviceRequest'i kopyala ve imzaları temizle
    final previewRequest = ServiceRequest(
      id: serviceRequest.id,
      title: serviceRequest.title,
      description: serviceRequest.description,
      priority: serviceRequest.priority,
      status: serviceRequest.status,
      serviceType: serviceRequest.serviceType,
      serviceNumber: serviceRequest.serviceNumber,
      customerName: serviceRequest.customerName,
      contactPhone: serviceRequest.contactPhone,
      location: serviceRequest.location,
      issueDate: serviceRequest.issueDate,
      createdAt: serviceRequest.createdAt,
      updatedAt: serviceRequest.updatedAt,
      customerData: serviceRequest.customerData,
      serviceDetails: serviceRequest.serviceDetails,
      technicianName: serviceRequest.technicianName,
      serviceResult: serviceRequest.serviceResult,
      technicianSignature: null, // İmzaları temizle
      customerSignature: null,
    );
    return generateServiceSlipPdf(previewRequest, templateId: templateId);
  }

  // PDF oluştur (imzalı) - Artık lokal renderer kullanıyor
  Future<Uint8List> generateServiceSlipPdfFromWeb(
    ServiceRequest serviceRequest, {
    String? templateId,
  }) async {
    print('📄 Servis fişi PDF oluşturuluyor (imzalı): ${serviceRequest.id}');
    
    // İmzaları service_signatures tablosundan al
    final supabase = Supabase.instance.client;
    try {
      final signaturesResponse = await supabase
          .from('service_signatures')
          .select('*')
          .eq('service_request_id', serviceRequest.id);

      final signatures = (signaturesResponse as List).cast<Map<String, dynamic>>();
      
      String? technicianSignatureBase64;
      String? customerSignatureBase64;
      
      for (var sig in signatures) {
        if (sig['signature_type'] == 'technician' && sig['signature_data'] != null) {
          technicianSignatureBase64 = sig['signature_data'] as String?;
        } else if (sig['signature_type'] == 'customer' && sig['signature_data'] != null) {
          customerSignatureBase64 = sig['signature_data'] as String?;
        }
      }

      // İmzalı PDF için serviceRequest'i güncelle
      final signedRequest = ServiceRequest(
        id: serviceRequest.id,
        title: serviceRequest.title,
        description: serviceRequest.description,
        priority: serviceRequest.priority,
        status: serviceRequest.status,
        serviceType: serviceRequest.serviceType,
        serviceNumber: serviceRequest.serviceNumber,
        customerName: serviceRequest.customerName,
        contactPhone: serviceRequest.contactPhone,
        location: serviceRequest.location,
        issueDate: serviceRequest.issueDate,
        createdAt: serviceRequest.createdAt,
        updatedAt: serviceRequest.updatedAt,
        customerData: serviceRequest.customerData,
        serviceDetails: serviceRequest.serviceDetails,
        technicianName: serviceRequest.technicianName,
        serviceResult: serviceRequest.serviceResult,
        technicianSignature: technicianSignatureBase64,
        customerSignature: customerSignatureBase64,
      );
      
      return generateServiceSlipPdf(signedRequest, templateId: templateId);
    } catch (e) {
      print('⚠️ İmzalar yüklenirken hata: $e, imzasız devam ediliyor');
      // Hata durumunda imzasız devam et
      return generateServiceSlipPdf(serviceRequest, templateId: templateId);
    }
  }
}

