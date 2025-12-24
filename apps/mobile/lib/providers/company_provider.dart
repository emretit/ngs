import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/company_service.dart';
import 'auth_provider.dart';

final companyServiceProvider = Provider<CompanyService>((ref) {
  return CompanyService();
});

/// Kullanıcının bağlı olduğu şirketler
final userCompaniesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(companyServiceProvider);
  final authState = ref.read(authStateProvider);
  final userId = authState.user?.id;

  if (userId == null) {
    throw Exception('Kullanıcı giriş yapmamış');
  }

  return await service.getUserCompanies(userId);
});

