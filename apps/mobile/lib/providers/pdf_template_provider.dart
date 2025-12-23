import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/pdf_template.dart';

// Helper function to get current user's company ID
Future<String?> _getCurrentUserCompanyId() async {
  try {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;
    
    final profileResponse = await Supabase.instance.client
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
    
    return profileResponse?['company_id'];
  } catch (e) {
    print('Company ID getirme hatası: $e');
    return null;
  }
}

// PDF Templates Provider - Proposal type için
final proposalPdfTemplatesProvider = FutureProvider<List<PdfTemplate>>((ref) async {
  try {
    final companyId = await _getCurrentUserCompanyId();
    if (companyId == null) {
      return [];
    }

    final response = await Supabase.instance.client
        .from('pdf_templates')
        .select('*')
        .eq('type', 'proposal')
        .eq('company_id', companyId)
        .order('is_default', ascending: false)
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => PdfTemplate.fromJson(json))
        .toList();
  } catch (e) {
    print('PDF şablonları getirme hatası: $e');
    return [];
  }
});

// Service Slip Templates Provider - service_templates tablosundan çekiyor (web ile aynı)
final serviceSlipPdfTemplatesProvider = FutureProvider<List<PdfTemplate>>((ref) async {
  try {
    final companyId = await _getCurrentUserCompanyId();
    if (companyId == null) {
      print('[serviceSlipPdfTemplatesProvider] Company ID bulunamadı');
      return [];
    }

    print('[serviceSlipPdfTemplatesProvider] Şablonlar yükleniyor, companyId: $companyId');

    // service_templates tablosundan şablonları çek (web ile aynı)
    // NOT: Web'de is_active filtresi kaldırılmış, mobil'de de kaldırıyoruz
    final response = await Supabase.instance.client
        .from('service_templates')
        .select('*')
        .eq('company_id', companyId)
        // .eq('is_active', true) // Web ile aynı olması için kaldırıldı
        .order('usage_count', ascending: false)
        .order('created_at', ascending: false);

    // Supabase Flutter'da response.data kullanılır
    final data = response as List<dynamic>? ?? [];
    
    print('[serviceSlipPdfTemplatesProvider] Query sonucu: ${data.length} şablon bulundu');
    if (data.isNotEmpty) {
      print('[serviceSlipPdfTemplatesProvider] Şablon isimleri: ${data.map((e) => e['name'] ?? 'isimsiz').join(', ')}');
    } else {
      print('[serviceSlipPdfTemplatesProvider] ⚠️ Hiç şablon bulunamadı!');
    }

    // service_templates formatını PdfTemplate formatına dönüştür
    return data.map((json) {
      // service_details içinden pdf_schema'yı al
      Map<String, dynamic>? pdfSchema;
      if (json['service_details'] != null) {
        final serviceDetails = json['service_details'] as Map<String, dynamic>?;
        if (serviceDetails != null && serviceDetails['pdf_schema'] != null) {
          pdfSchema = Map<String, dynamic>.from(serviceDetails['pdf_schema']);
        } else if (serviceDetails != null) {
          // Eğer pdf_schema yoksa service_details'i direkt kullan
          pdfSchema = Map<String, dynamic>.from(serviceDetails);
        }
      }

      // PdfTemplate formatına dönüştür
      return PdfTemplate(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'],
        type: 'service_slip', // Sabit değer
        locale: 'tr', // Varsayılan
        schemaJson: pdfSchema,
        version: 1, // Varsayılan
        isDefault: false, // service_templates'de is_default yok
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'])
            : DateTime.now(),
        updatedAt: json['updated_at'] != null
            ? DateTime.parse(json['updated_at'])
            : DateTime.now(),
        companyId: json['company_id'],
        createdBy: json['created_by'],
      );
    }).toList();
  } catch (e) {
    print('Servis şablonları getirme hatası: $e');
    return [];
  }
});
