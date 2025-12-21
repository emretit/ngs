import 'dart:convert';
import 'dart:typed_data';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/proposal.dart';

class ProposalPdfService {
  // Edge function kullanarak PDF oluştur
  Future<Uint8List> generateProposalPdfFromWeb(Proposal proposal, {String? templateId}) async {
    try {
      final supabase = Supabase.instance.client;
      
      // Get current session
      final session = supabase.auth.currentSession;
      if (session == null) {
        throw Exception('Kullanıcı oturumu bulunamadı');
      }

      print('📄 Teklif PDF oluşturuluyor: ${proposal.id}');

      // Call Edge Function
      final response = await supabase.functions.invoke(
        'generate-proposal-pdf',
        body: {
          'proposalId': proposal.id,
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
      rethrow;
    }
  }

  // PDF'i görüntüle ve paylaş
  Future<void> previewAndShare(Uint8List pdfBytes, String fileName) async {
    await Printing.layoutPdf(
      onLayout: (format) async => pdfBytes,
    );
  }

  // PDF'i paylaş
  Future<void> sharePdf(Uint8List pdfBytes, String fileName) async {
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: fileName,
    );
  }
}
