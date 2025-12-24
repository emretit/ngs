import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/supplier.dart';
import '../services/supplier_service.dart';
import '../services/cache_service.dart';
import 'auth_provider.dart';

/// Supplier Service Provider
final supplierServiceProvider = Provider<SupplierService>((ref) {
  return SupplierService();
});

/// Tüm Tedarikçiler Provider (cache ile optimize edilmiş)
final suppliersProvider = AsyncNotifierProvider<SuppliersNotifier, List<Supplier>>(
  () => SuppliersNotifier(),
);

class SuppliersNotifier extends AsyncNotifier<List<Supplier>> {
  @override
  Future<List<Supplier>> build() async {
    final service = ref.read(supplierServiceProvider);
    final authState = ref.watch(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId == null) {
      return [];
    }

    // Cache key oluştur
    final cacheKey = 'suppliers_$companyId';

    // Cache kontrolü
    final cached = CacheService.get<List<Supplier>>(cacheKey);
    if (cached != null) {
      return cached;
    }

    // API çağrısı
    final suppliers = await service.getSuppliers();

    // Cache'e kaydet (5 dakika TTL)
    CacheService.set(cacheKey, suppliers, ttl: const Duration(minutes: 5));

    return suppliers;
  }

  /// Cache'i temizle ve yeniden yükle
  Future<void> refresh() async {
    final authState = ref.read(authStateProvider);
    final companyId = authState.user?.companyId;

    if (companyId != null) {
      final cacheKey = 'suppliers_$companyId';
      CacheService.remove(cacheKey);
    }

    // Tüm supplier cache'lerini temizle
    CacheService.invalidate('suppliers_');

    // Provider'ı yeniden yükle
    ref.invalidateSelf();
  }
}

/// Aktif Tedarikçiler Provider
final activeSuppliersProvider = FutureProvider<List<Supplier>>((ref) async {
  final suppliers = await ref.watch(suppliersProvider.future);
  return suppliers.where((s) => s.status == 'aktif').toList();
});

/// Potansiyel Tedarikçiler Provider
final potentialSuppliersProvider = FutureProvider<List<Supplier>>((ref) async {
  final suppliers = await ref.watch(suppliersProvider.future);
  return suppliers.where((s) => s.status == 'potansiyel').toList();
});

/// Tedarikçi Detay Provider
final supplierByIdProvider = FutureProvider.family<Supplier?, String>((ref, id) async {
  final service = ref.read(supplierServiceProvider);
  return await service.getSupplierById(id);
});

/// Tedarikçi İstatistikleri Provider
final supplierStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.read(authStateProvider);
  
  if (!authState.isAuthenticated) {
    return {
      'totalSuppliers': 0,
      'activeSuppliers': 0,
      'potentialSuppliers': 0,
      'totalBalance': 0.0,
    };
  }

  try {
    final suppliers = await ref.watch(suppliersProvider.future);
    
    final activeSuppliers = suppliers.where((s) => s.status == 'aktif').length;
    final potentialSuppliers = suppliers.where((s) => s.status == 'potansiyel').length;
    final totalBalance = suppliers.fold<double>(0, (sum, s) => sum + s.balance);

    return {
      'totalSuppliers': suppliers.length,
      'activeSuppliers': activeSuppliers,
      'potentialSuppliers': potentialSuppliers,
      'totalBalance': totalBalance,
    };
  } catch (e) {
    return {
      'totalSuppliers': 0,
      'activeSuppliers': 0,
      'potentialSuppliers': 0,
      'totalBalance': 0.0,
    };
  }
});

/// Tedarikçi Segmentleri Provider
final supplierSegmentsProvider = Provider<List<String>>((ref) {
  return [
    'Küçük İşletme',
    'Orta Ölçekli',
    'Kurumsal',
    'Premium',
    'VIP',
  ];
});

/// Tedarikçi Kaynakları Provider
final supplierSourcesProvider = Provider<List<String>>((ref) {
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

