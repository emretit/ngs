import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/opportunity.dart';
import 'sales_provider.dart';
import 'auth_provider.dart';

/// CRM İstatistikleri Provider
final crmStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.read(authStateProvider);
  
  if (!authState.isAuthenticated) {
    return {
      'totalOpportunities': 0,
      'activeOpportunities': 0,
      'wonOpportunities': 0,
      'totalValue': 0.0,
    };
  }

  try {
    final opportunities = await ref.watch(opportunitiesProvider.future);
    
    final activeStatuses = ['new', 'qualified', 'proposal', 'negotiation'];
    final activeOpportunities = opportunities
        .where((o) => activeStatuses.contains(o.status))
        .toList();
    final wonOpportunities = opportunities
        .where((o) => o.status == 'won')
        .toList();
    
    final totalValue = opportunities.fold<double>(
      0, 
      (sum, opp) => sum + (opp.value ?? 0),
    );

    return {
      'totalOpportunities': opportunities.length,
      'activeOpportunities': activeOpportunities.length,
      'wonOpportunities': wonOpportunities.length,
      'totalValue': totalValue,
    };
  } catch (e) {
    return {
      'totalOpportunities': 0,
      'activeOpportunities': 0,
      'wonOpportunities': 0,
      'totalValue': 0.0,
    };
  }
});

/// Aktif Fırsatlar Provider
final activeOpportunitiesProvider = FutureProvider<List<Opportunity>>((ref) async {
  final opportunities = await ref.watch(opportunitiesProvider.future);
  final activeStatuses = ['new', 'qualified', 'proposal', 'negotiation'];
  return opportunities.where((o) => activeStatuses.contains(o.status)).toList();
});

/// Kazanılan Fırsatlar Provider  
final wonOpportunitiesProvider = FutureProvider<List<Opportunity>>((ref) async {
  final opportunities = await ref.watch(opportunitiesProvider.future);
  return opportunities.where((o) => o.status == 'won').toList();
});

/// Fırsat Detayı Provider
final opportunityByIdProvider = FutureProvider.family<Opportunity?, String>((ref, id) async {
  final opportunities = await ref.watch(opportunitiesProvider.future);
  try {
    return opportunities.firstWhere((o) => o.id == id);
  } catch (_) {
    return null;
  }
});

/// Pipeline Stages Provider
final pipelineStagesProvider = Provider<List<Map<String, dynamic>>>((ref) {
  return [
    {'key': 'new', 'label': 'Yeni', 'color': 0xFF3B82F6},
    {'key': 'qualified', 'label': 'Nitelikli', 'color': 0xFFFF9500},
    {'key': 'proposal', 'label': 'Teklif', 'color': 0xFF9333EA},
    {'key': 'negotiation', 'label': 'Müzakere', 'color': 0xFFEF4444},
    {'key': 'won', 'label': 'Kazanıldı', 'color': 0xFF22C55E},
    {'key': 'lost', 'label': 'Kaybedildi', 'color': 0xFF8E8E93},
  ];
});
