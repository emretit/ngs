import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/service_form_widgets.dart';
import 'service_request_edit_selectors.dart';

class ServiceRequestEditBasicInfoSection extends StatelessWidget {
  final TextEditingController titleController;
  final TextEditingController descriptionController;
  final TextEditingController locationController;
  final TextEditingController serviceNumberController;
  final String selectedServiceType;
  final String selectedPriority;
  final String selectedStatus;
  final String? selectedTechnicianId;
  final List<Map<String, String>> serviceTypes;
  final Map<String, String> priorityDisplayNames;
  final Map<String, String> statusDisplayNames;
  final AsyncValue<List<Map<String, dynamic>>> techniciansAsync;
  final Function(String) onServiceTypeChanged;
  final Function(String) onPriorityChanged;
  final Function(String) onStatusChanged;
  final Function(String?) onTechnicianChanged;

  const ServiceRequestEditBasicInfoSection({
    super.key,
    required this.titleController,
    required this.descriptionController,
    required this.locationController,
    required this.serviceNumberController,
    required this.selectedServiceType,
    required this.selectedPriority,
    required this.selectedStatus,
    required this.selectedTechnicianId,
    required this.serviceTypes,
    required this.priorityDisplayNames,
    required this.statusDisplayNames,
    required this.techniciansAsync,
    required this.onServiceTypeChanged,
    required this.onPriorityChanged,
    required this.onStatusChanged,
    required this.onTechnicianChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ServiceFormSection(
      title: 'Temel Bilgiler',
      icon: CupertinoIcons.doc_text,
      iconColor: ServiceFormStyles.infoColor,
      children: [
        ServiceFormTextField(
          controller: titleController,
          label: 'Servis Başlığı *',
          hint: 'Örn: Klima bakımı, Elektrik arızası...',
          icon: CupertinoIcons.textformat,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Başlık gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 10),

        ServiceFormTextField(
          controller: descriptionController,
          label: 'Servis Açıklaması *',
          hint: 'Servisin detaylarını, yapılması gereken işlemleri açıklayın...',
          icon: CupertinoIcons.text_alignleft,
          maxLines: 3,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Açıklama gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: ServiceRequestEditSelectors.buildServiceTypeDropdown(
                selectedServiceType: selectedServiceType,
                serviceTypes: serviceTypes,
                onChanged: onServiceTypeChanged,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceRequestEditSelectors.buildPriorityDropdown(
                selectedPriority: selectedPriority,
                priorityDisplayNames: priorityDisplayNames,
                onChanged: onPriorityChanged,
              ),
            ),
          ],
        ),

        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: ServiceRequestEditSelectors.buildStatusDropdown(
                selectedStatus: selectedStatus,
                statusDisplayNames: statusDisplayNames,
                onChanged: onStatusChanged,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceRequestEditSelectors.buildTechnicianSelector(
                techniciansAsync: techniciansAsync,
                selectedTechnicianId: selectedTechnicianId,
                onChanged: onTechnicianChanged,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              flex: 2,
              child: ServiceFormTextField(
                controller: locationController,
                label: 'Lokasyon',
                hint: 'Servis yapılacak adres',
                icon: CupertinoIcons.location,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceFormTextField(
                controller: serviceNumberController,
                label: 'Servis No',
                hint: 'Otomatik',
                icon: CupertinoIcons.number_square,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

