import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/supabase_service.dart';
import '../../../../shared/models/service_request.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// Service Requests State
class ServiceRequestsState {
  final List<ServiceRequest> serviceRequests;
  final bool isLoading;
  final String? error;

  const ServiceRequestsState({
    this.serviceRequests = const [],
    this.isLoading = false,
    this.error,
  });

  ServiceRequestsState copyWith({
    List<ServiceRequest>? serviceRequests,
    bool? isLoading,
    String? error,
  }) {
    return ServiceRequestsState(
      serviceRequests: serviceRequests ?? this.serviceRequests,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// Service Requests Notifier
class ServiceRequestsNotifier extends StateNotifier<ServiceRequestsState> {
  ServiceRequestsNotifier(this.ref) : super(const ServiceRequestsState());

  final Ref ref;
  final SupabaseService _supabaseService = SupabaseService.instance;

  Future<void> loadServiceRequests() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      // Auth provider'dan teknisyen ID'sini al
      final authState = ref.read(authProvider);
      final technician = authState.technician;
      
      if (technician == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Teknisyen bilgisi bulunamadı',
        );
        return;
      }

      final serviceRequestsData = await _supabaseService.getServiceRequests(technician.id);
      
      final serviceRequests = serviceRequestsData.map((data) {
        // Customer bilgisini parse et
        Customer? customer;
        if (data['customers'] != null) {
          customer = Customer.fromJson(data['customers']);
        }
        
        return ServiceRequest.fromJson({
          ...data,
          'customer': customer?.toJson(),
        });
      }).toList();
      
      state = state.copyWith(
        serviceRequests: serviceRequests,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> updateServiceRequestStatus(
    String requestId,
    String status, {
    String? notes,
    List<String>? attachments,
  }) async {
    try {
      await _supabaseService.updateServiceRequestStatus(
        requestId,
        status,
        notes: notes,
        attachments: attachments,
      );
      
      // Listeyi yenile
      await loadServiceRequests();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Provider
final serviceRequestsProvider = StateNotifierProvider<ServiceRequestsNotifier, ServiceRequestsState>((ref) {
  return ServiceRequestsNotifier(ref);
});
