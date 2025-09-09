import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/service_request.dart';

class ServiceRequestCard extends StatelessWidget {
  final ServiceRequest serviceRequest;
  final VoidCallback onTap;

  const ServiceRequestCard({
    super.key,
    required this.serviceRequest,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Başlık ve Durum
              Row(
                children: [
                  Expanded(
                    child: Text(
                      serviceRequest.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildStatusChip(serviceRequest.status),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Açıklama
              if (serviceRequest.description != null) ...[
                Text(
                  serviceRequest.description!,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.grey600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
              ],
              
              // Müşteri bilgisi
              if (serviceRequest.customer != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 16,
                      color: AppTheme.grey500,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        serviceRequest.customer!.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
              ],
              
              // Konum
              if (serviceRequest.location != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 16,
                      color: AppTheme.grey500,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        serviceRequest.location!,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.grey600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
              
              // Alt bilgiler
              Row(
                children: [
                  // Öncelik
                  _buildPriorityChip(serviceRequest.priority),
                  
                  const Spacer(),
                  
                  // Teslim tarihi
                  if (serviceRequest.dueDate != null) ...[
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: AppTheme.grey500,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('dd/MM/yyyy').format(serviceRequest.dueDate!),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.grey600,
                      ),
                    ),
                  ],
                ],
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
