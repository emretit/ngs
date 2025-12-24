import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/customer.dart';
import '../services/customer_service.dart';
import '../services/cache_service.dart';
import 'auth_provider.dart';

/// Customer Service Provider
final customerServiceProvider = Provider<CustomerService>((ref) {
  return CustomerService();
});

/// Tüm Müşteriler Provider (cache ile optimize edilmiş)
final customersProvider = AsyncNotifierProvider<CustomersNotifier, List<Customer>>(
  () => CustomersNotifier(),
);

class CustomersNotifier extends AsyncNotifier<List<Customer>> {
  @override
  Future<List<Customer>> build() async {
    final service = ref.read(customerServiceProvider);
    final authState = ref.watch(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId == null) {
      return [];
    }

    // Cache key oluştur
    final cacheKey = 'customers_$companyId';

    // Cache kontrolü
    final cached = CacheService.get<List<Customer>>(cacheKey);
    if (cached != null) {
      return cached;
    }

    // API çağrısı
    final customers = await service.getCustomers();

    // Cache'e kaydet (5 dakika TTL)
    CacheService.set(cacheKey, customers, ttl: const Duration(minutes: 5));

    return customers;
  }

  /// Cache'i temizle ve yeniden yükle
  Future<void> refresh() async {
    final authState = ref.read(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId != null) {
      final cacheKey = 'customers_$companyId';
      CacheService.remove(cacheKey);
    }

    // Tüm customer cache'lerini temizle
    CacheService.invalidate('customers_');

    // Provider'ı yeniden yükle
    ref.invalidateSelf();
  }
}

/// Aktif Müşteriler Provider
final activeCustomersProvider = FutureProvider<List<Customer>>((ref) async {
  final customers = await ref.watch(customersProvider.future);
  return customers.where((c) => c.status == 'aktif').toList();
});

/// Potansiyel Müşteriler Provider
final potentialCustomersProvider = FutureProvider<List<Customer>>((ref) async {
  final customers = await ref.watch(customersProvider.future);
  return customers.where((c) => c.status == 'potansiyel').toList();
});

/// Müşteri Detay Provider
final customerByIdProvider = FutureProvider.family<Customer?, String>((ref, id) async {
  final service = ref.read(customerServiceProvider);
  return await service.getCustomerById(id);
});

/// Müşteri İstatistikleri Provider
final customerStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.read(authStateProvider);
  
  if (!authState.isAuthenticated) {
    return {
      'totalCustomers': 0,
      'activeCustomers': 0,
      'potentialCustomers': 0,
      'totalBalance': 0.0,
    };
  }

  try {
    final customers = await ref.watch(customersProvider.future);
    
    final activeCustomers = customers.where((c) => c.status == 'aktif').length;
    final potentialCustomers = customers.where((c) => c.status == 'potansiyel').length;
    final totalBalance = customers.fold<double>(0, (sum, c) => sum + (c.balance ?? 0));

    return {
      'totalCustomers': customers.length,
      'activeCustomers': activeCustomers,
      'potentialCustomers': potentialCustomers,
      'totalBalance': totalBalance,
    };
  } catch (e) {
    return {
      'totalCustomers': 0,
      'activeCustomers': 0,
      'potentialCustomers': 0,
      'totalBalance': 0.0,
    };
  }
});

/// Müşteri Segmentleri Provider
final customerSegmentsProvider = Provider<List<String>>((ref) {
  return [
    'Küçük İşletme',
    'Orta Ölçekli',
    'Kurumsal',
    'Premium',
    'VIP',
  ];
});

/// Müşteri Kaynakları Provider
final customerSourcesProvider = Provider<List<String>>((ref) {
  return [
    'Web Sitesi',
    'Referans',
    'Sosyal Medya',
    'Reklam',
    'Fuar',
    'Doğrudan Başvuru',
    'Diğer',
  ];
});

