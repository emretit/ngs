import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/customer.dart';
import '../services/customer_service.dart';
import 'auth_provider.dart';

/// Customer Service Provider
final customerServiceProvider = Provider<CustomerService>((ref) {
  return CustomerService();
});

/// Tüm Müşteriler Provider
final customersProvider = FutureProvider<List<Customer>>((ref) async {
  final service = ref.read(customerServiceProvider);
  return await service.getCustomers();
});

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

