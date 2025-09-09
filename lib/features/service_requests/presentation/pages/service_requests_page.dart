import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/service_request.dart';
import '../providers/service_requests_provider.dart';
import '../widgets/service_request_card.dart';

class ServiceRequestsPage extends ConsumerStatefulWidget {
  const ServiceRequestsPage({super.key});

  @override
  ConsumerState<ServiceRequestsPage> createState() => _ServiceRequestsPageState();
}

class _ServiceRequestsPageState extends ConsumerState<ServiceRequestsPage> {
  @override
  void initState() {
    super.initState();
    // Sayfa yüklendiğinde servis taleplerini getir
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(serviceRequestsProvider.notifier).loadServiceRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final serviceRequestsState = ref.watch(serviceRequestsProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(serviceRequestsProvider.notifier).loadServiceRequests();
        },
        child: serviceRequestsState.isLoading
            ? const Center(
                child: CircularProgressIndicator(),
              )
            : serviceRequestsState.serviceRequests.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: serviceRequestsState.serviceRequests.length,
                    itemBuilder: (context, index) {
                      final serviceRequest = serviceRequestsState.serviceRequests[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ServiceRequestCard(
                          serviceRequest: serviceRequest,
                          onTap: () {
                            // Servis talebi detayına git
                            _showServiceRequestDetails(serviceRequest);
                          },
                        ),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Yeni servis talebi oluştur (opsiyonel)
          _showCreateServiceRequestDialog();
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 80,
            color: AppTheme.grey400,
          ),
          const SizedBox(height: 16),
          Text(
            'Henüz görev atanmamış',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: AppTheme.grey600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Size atanan görevler burada görünecek',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.grey500,
            ),
          ),
        ],
      ),
    );
  }

  void _showServiceRequestDetails(ServiceRequest serviceRequest) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(20),
            ),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.grey300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        serviceRequest.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (serviceRequest.description != null) ...[
                        Text(
                          'Açıklama',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.grey700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          serviceRequest.description!,
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Durum ve Öncelik
                      Row(
                        children: [
                          _buildStatusChip(serviceRequest.status),
                          const SizedBox(width: 8),
                          _buildPriorityChip(serviceRequest.priority),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Müşteri bilgileri
                      if (serviceRequest.customer != null) ...[
                        Text(
                          'Müşteri Bilgileri',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.grey700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.grey50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                serviceRequest.customer!.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (serviceRequest.customer!.company != null)
                                Text(
                                  serviceRequest.customer!.company!,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.grey600,
                                  ),
                                ),
                              if (serviceRequest.customer!.mobilePhone != null)
                                Text(
                                  'Tel: ${serviceRequest.customer!.mobilePhone}',
                                  style: const TextStyle(fontSize: 14),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Konum
                      if (serviceRequest.location != null) ...[
                        Text(
                          'Konum',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.grey700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          serviceRequest.location!,
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Teslim tarihi
                      if (serviceRequest.dueDate != null) ...[
                        Text(
                          'Teslim Tarihi',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.grey700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${serviceRequest.dueDate!.day}/${serviceRequest.dueDate!.month}/${serviceRequest.dueDate!.year}',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              // Action Buttons
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: AppTheme.grey200),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        child: const Text('Kapat'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          // Görev durumunu güncelle
                          _showStatusUpdateDialog(serviceRequest);
                        },
                        child: const Text('Durumu Güncelle'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String text;
    
    switch (status) {
      case 'new':
        color = AppTheme.statusNew;
        text = 'Yeni';
        break;
      case 'assigned':
        color = AppTheme.statusAssigned;
        text = 'Atandı';
        break;
      case 'in_progress':
        color = AppTheme.statusInProgress;
        text = 'Devam Ediyor';
        break;
      case 'completed':
        color = AppTheme.statusCompleted;
        text = 'Tamamlandı';
        break;
      case 'cancelled':
        color = AppTheme.statusCancelled;
        text = 'İptal';
        break;
      case 'on_hold':
        color = AppTheme.statusOnHold;
        text = 'Beklemede';
        break;
      default:
        color = AppTheme.grey500;
        text = status;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildPriorityChip(String priority) {
    Color color;
    String text;
    
    switch (priority) {
      case 'low':
        color = AppTheme.priorityLow;
        text = 'Düşük';
        break;
      case 'medium':
        color = AppTheme.priorityMedium;
        text = 'Orta';
        break;
      case 'high':
        color = AppTheme.priorityHigh;
        text = 'Yüksek';
        break;
      case 'urgent':
        color = AppTheme.priorityUrgent;
        text = 'Acil';
        break;
      default:
        color = AppTheme.grey500;
        text = priority;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  void _showStatusUpdateDialog(ServiceRequest serviceRequest) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Durum Güncelle'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Görev durumunu güncellemek istediğinizden emin misiniz?'),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: serviceRequest.status,
              decoration: const InputDecoration(
                labelText: 'Yeni Durum',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'in_progress', child: Text('Devam Ediyor')),
                DropdownMenuItem(value: 'completed', child: Text('Tamamlandı')),
                DropdownMenuItem(value: 'on_hold', child: Text('Beklemede')),
                DropdownMenuItem(value: 'cancelled', child: Text('İptal')),
              ],
              onChanged: (value) {
                // Durum güncelleme işlemi
                if (value != null) {
                  ref.read(serviceRequestsProvider.notifier)
                      .updateServiceRequestStatus(serviceRequest.id, value);
                  Navigator.pop(context);
                  Navigator.pop(context); // Modal'ı da kapat
                }
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
        ],
      ),
    );
  }

  void _showCreateServiceRequestDialog() {
    // Yeni servis talebi oluşturma dialog'u
    // Bu özellik opsiyonel olarak eklenebilir
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Yeni görev oluşturma özelliği yakında eklenecek'),
      ),
    );
  }
}
