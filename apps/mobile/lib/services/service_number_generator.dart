import 'package:supabase_flutter/supabase_flutter.dart';
import 'system_parameters_service.dart';

/// Servis numarası üretim servisi
/// Format: SRV-{YYYY}-{0001} (system_parameters tablosundan alınır)
class ServiceNumberGenerator {
  final SupabaseClient _supabase;
  final SystemParametersService _systemParametersService;

  ServiceNumberGenerator(this._supabase)
      : _systemParametersService = SystemParametersService();

  /// Servis numarası üretir
  /// Format: system_parameters tablosundan service_number_format alınır
  /// Örnek: SRV-{YYYY}-{0001} -> SRV-2025-0001
  Future<String> generateServiceNumber(String? companyId) async {
    try {
      // 1. Format'ı al (system_parameters tablosundan)
      final format = await _systemParametersService.getParameter(
        'service_number_format',
        companyId: companyId,
      );

      // Varsayılan format
      final defaultFormat = 'SRV-{YYYY}-{0001}';
      final finalFormat = format ?? defaultFormat;

      // 2. Format değişkenlerini değiştir
      final now = DateTime.now();
      String result = finalFormat;

      result = result.replaceAll('{YYYY}', now.year.toString());
      result = result.replaceAll('{YY}', now.year.toString().substring(2));
      result = result.replaceAll('{MM}', now.month.toString().padLeft(2, '0'));
      result = result.replaceAll('{DD}', now.day.toString().padLeft(2, '0'));
      result = result.replaceAll('{HH}', now.hour.toString().padLeft(2, '0'));
      result = result.replaceAll('{mm}', now.minute.toString().padLeft(2, '0'));
      result = result.replaceAll('{SS}', now.second.toString().padLeft(2, '0'));

      // 3. Sıralı numara için {0001}, {001}, {01} gibi formatları destekle
      final sequentialPattern = RegExp(r'\{0+(\d+)\}');
      if (sequentialPattern.hasMatch(result)) {
        final match = sequentialPattern.firstMatch(result)!;
        final digitCount = int.parse(match.group(1)!);

        // Format string'ini parse et (değişkenler yerine gerçek değerlerle)
        String parsedFormat = finalFormat;
        parsedFormat = parsedFormat.replaceAll('{YYYY}', now.year.toString());
        parsedFormat = parsedFormat.replaceAll('{YY}', now.year.toString().substring(2));
        parsedFormat = parsedFormat.replaceAll('{MM}', now.month.toString().padLeft(2, '0'));
        parsedFormat = parsedFormat.replaceAll('{DD}', now.day.toString().padLeft(2, '0'));
        parsedFormat = parsedFormat.replaceAll('{HH}', now.hour.toString().padLeft(2, '0'));
        parsedFormat = parsedFormat.replaceAll('{mm}', now.minute.toString().padLeft(2, '0'));
        parsedFormat = parsedFormat.replaceAll('{SS}', now.second.toString().padLeft(2, '0'));

        // Sıralı numara pozisyonunu bul
        final sequencePos = parsedFormat.indexOf(match.group(0)!);
        final prefix = parsedFormat.substring(0, sequencePos);
        final suffix = parsedFormat.substring(sequencePos + match.group(0)!.length);

        // Mevcut servis numaralarını getir (aynı prefix ve suffix'e sahip olanlar)
        dynamic query = _supabase
            .from('service_requests')
            .select('service_number')
            .not('service_number', 'is', null)
            .like('service_number', '$prefix%$suffix');

        if (companyId != null && companyId.isNotEmpty) {
          query = query.eq('company_id', companyId);
        }

        final existingNumbers = await query;

        int maxSequence = 0;
        for (final item in existingNumbers as List) {
          final serviceNumber = item['service_number']?.toString() ?? '';
          if (serviceNumber.isNotEmpty &&
              serviceNumber.startsWith(prefix) &&
              serviceNumber.endsWith(suffix) &&
              serviceNumber.length == prefix.length + digitCount + suffix.length) {
            try {
              // Sıralı numarayı çıkar
              final sequenceStr =
                  serviceNumber.substring(prefix.length, prefix.length + digitCount);
              final sequence = int.parse(sequenceStr);
              if (sequence > maxSequence) {
                maxSequence = sequence;
              }
            } catch (e) {
              // Parse hatası, devam et
            }
          }
        }

        // Yeni sıralı numara
        final nextSequence = maxSequence + 1;
        final sequenceStr = nextSequence.toString().padLeft(digitCount, '0');
        result = result.replaceAll(match.group(0)!, sequenceStr);
      }

      // 4. Bu numara kullanılıyor mu kontrol et
      final exists = await _checkNumberExists(result, companyId);
      if (exists) {
        // Varsa bir sonrakini dene (recursive)
        return await generateServiceNumber(companyId);
      }

      return result;
    } catch (e) {
      print('Servis numarası üretme hatası: $e');
      // Fallback: timestamp kullan
      return 'SRV-${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  /// Numara kullanılıyor mu kontrol eder
  Future<bool> _checkNumberExists(String number, String? companyId) async {
    try {
      dynamic query = _supabase
          .from('service_requests')
          .select('id')
          .eq('service_number', number);

      if (companyId != null && companyId.isNotEmpty) {
        query = query.eq('company_id', companyId);
      }

      final response = await query.limit(1).maybeSingle();

      return response != null;
    } catch (e) {
      print('Numara kontrol hatası: $e');
      return false; // Hata durumunda false döndür, üretime devam et
    }
  }
}
