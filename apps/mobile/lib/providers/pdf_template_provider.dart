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

// Service Slip Templates Provider
final serviceSlipPdfTemplatesProvider = FutureProvider<List<PdfTemplate>>((ref) async {
  try {
    final companyId = await _getCurrentUserCompanyId();
    if (companyId == null) {
      return [];
    }

    final response = await Supabase.instance.client
        .from('pdf_templates')
        .select('*')
        .eq('type', 'service_slip')
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
