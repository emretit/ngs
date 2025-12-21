import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/customer.dart';
import '../../models/employee.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ServiceRequestEditSelectors {
  static Widget buildCustomerSelector({
    required AsyncValue<List<Customer>> customersAsync,
    required String? selectedCustomerId,
    required Function(String?) onCustomerSelected,
    required Function(List<Customer>) onShowPicker,
  }) {
    return customersAsync.when(
      data: (customers) {
        Customer? selectedCustomer;
        if (selectedCustomerId != null) {
          try {
            selectedCustomer = customers.firstWhere(
              (c) => c.id == selectedCustomerId,
            );
          } catch (e) {
            selectedCustomer = null;
          }
        }

        return GestureDetector(
          onTap: () => onShowPicker(customers),
          child: Container(
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
              border: Border.all(
                color: Colors.grey.withOpacity(0.1),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.person_crop_circle,
                  color: ServiceFormStyles.primaryColor,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Müşteri / Tedarikçi',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.labelSize,
                          color: ServiceFormStyles.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        selectedCustomer != null
                            ? selectedCustomer.name ?? 'İsimsiz Müşteri'
                            : 'Müşteri veya Tedarikçi seçin...',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.bodySize,
                          color: selectedCustomer != null
                              ? ServiceFormStyles.textPrimary
                              : ServiceFormStyles.textSecondary.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: ServiceFormStyles.textSecondary,
                  size: 16,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: Text('Müşteriler yüklenemedi: $error'),
      ),
    );
  }

  static Widget buildTechnicianSelector({
    required AsyncValue<List<Map<String, dynamic>>> techniciansAsync,
    required String? selectedTechnicianId,
    required Function(String?) onChanged,
  }) {
    return techniciansAsync.when(
      data: (technicians) {
        return ServiceFormDropdown<String>(
          value: selectedTechnicianId ?? '',
          label: 'Teknisyen',
          icon: CupertinoIcons.wrench,
          items: [
            const DropdownMenuItem<String>(
              value: '',
              child: Text('Atanmamış'),
            ),
            ...technicians.map((t) {
              return DropdownMenuItem<String>(
                value: t['id'] as String,
                child: Text('${t['first_name']} ${t['last_name']}'),
              );
            }),
          ],
          onChanged: (value) {
            onChanged(value?.isEmpty == true ? null : value);
          },
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Text('Teknisyenler yüklenemedi'),
      ),
    );
  }

  static Widget buildReceivedBySelector({
    required AsyncValue<List<Employee>> employeesAsync,
    required String? selectedReceivedBy,
    required Function(List<Employee>) onShowPicker,
  }) {
    return employeesAsync.when(
      data: (employees) {
        Employee? selectedEmployee;
        if (selectedReceivedBy != null) {
          try {
            selectedEmployee = employees.firstWhere((e) => e.id == selectedReceivedBy);
          } catch (e) {
            selectedEmployee = null;
          }
        }

        return GestureDetector(
          onTap: () => onShowPicker(employees),
          child: Container(
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
              border: Border.all(
                color: Colors.grey.withOpacity(0.1),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.person_badge_plus,
                  color: ServiceFormStyles.primaryColor,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Talebi Alan Kişi',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.labelSize,
                          color: ServiceFormStyles.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        selectedEmployee != null
                            ? '${selectedEmployee.firstName} ${selectedEmployee.lastName}'
                            : 'Talebi alan kişiyi seçin...',
                        style: TextStyle(
                          fontSize: ServiceFormStyles.bodySize,
                          color: selectedEmployee != null
                              ? ServiceFormStyles.textPrimary
                              : ServiceFormStyles.textSecondary.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.chevron_right,
                  color: ServiceFormStyles.textSecondary,
                  size: 16,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: const Center(child: CupertinoActivityIndicator()),
      ),
      error: (error, stack) => Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: Text('Çalışanlar yüklenemedi: $error'),
      ),
    );
  }

  static Widget buildServiceTypeDropdown({
    required String selectedServiceType,
    required List<Map<String, String>> serviceTypes,
    required Function(String) onChanged,
  }) {
    return ServiceFormDropdown<String>(
      value: selectedServiceType.isEmpty ? null : selectedServiceType,
      label: 'Servis Türü',
      icon: CupertinoIcons.tag,
      hint: 'Servis türü seçin...',
      items: serviceTypes.map((type) {
        return DropdownMenuItem(
          value: type['value'],
          child: Text(type['label']!),
        );
      }).toList(),
      onChanged: (value) {
        onChanged(value ?? '');
      },
    );
  }

  static Widget buildPriorityDropdown({
    required String selectedPriority,
    required Map<String, String> priorityDisplayNames,
    required Function(String) onChanged,
  }) {
    final priorityColors = {
      'low': ServiceFormStyles.successColor,
      'medium': ServiceFormStyles.warningColor,
      'high': const Color(0xFFE67E22),
      'urgent': ServiceFormStyles.errorColor,
    };

    return ServiceFormDropdown<String>(
      value: selectedPriority,
      label: 'Öncelik',
      icon: CupertinoIcons.exclamationmark_triangle,
      items: priorityDisplayNames.entries.map((entry) {
        return DropdownMenuItem(
          value: entry.key,
          child: Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: priorityColors[entry.key] ?? Colors.grey,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(entry.value),
            ],
          ),
        );
      }).toList(),
      onChanged: (value) {
        onChanged(value!);
      },
    );
  }

  static Widget buildStatusDropdown({
    required String selectedStatus,
    required Map<String, String> statusDisplayNames,
    required Function(String) onChanged,
  }) {
    return ServiceFormDropdown<String>(
      value: selectedStatus,
      label: 'Durum',
      icon: CupertinoIcons.checkmark_circle,
      items: statusDisplayNames.entries.map((entry) {
        return DropdownMenuItem(
          value: entry.key,
          child: Text(entry.value),
        );
      }).toList(),
      onChanged: (value) {
        onChanged(value!);
      },
    );
  }
}

