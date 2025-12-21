import 'package:flutter/cupertino.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ServiceRequestEditDateSection extends StatelessWidget {
  final DateTime? reportedDate;
  final DateTime? dueDate;
  final DateTime? serviceStartDate;
  final DateTime? serviceEndDate;
  final VoidCallback onSelectReportedDate;
  final VoidCallback onSelectDueDate;
  final VoidCallback onSelectServiceStartDate;
  final VoidCallback onSelectServiceEndDate;

  const ServiceRequestEditDateSection({
    super.key,
    required this.reportedDate,
    required this.dueDate,
    required this.serviceStartDate,
    required this.serviceEndDate,
    required this.onSelectReportedDate,
    required this.onSelectDueDate,
    required this.onSelectServiceStartDate,
    required this.onSelectServiceEndDate,
  });

  @override
  Widget build(BuildContext context) {
    return ServiceFormSection(
      title: 'Tarih Bilgileri',
      icon: CupertinoIcons.calendar,
      iconColor: ServiceFormStyles.purpleColor,
      children: [
        // Kompakt 2x2 grid layout
        Row(
          children: [
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Bildirim',
                date: reportedDate,
                onTap: onSelectReportedDate,
                icon: CupertinoIcons.calendar_today,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Hedef Teslim',
                date: dueDate,
                onTap: onSelectDueDate,
                icon: CupertinoIcons.calendar_badge_plus,
                isOptional: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Başlama',
                date: serviceStartDate,
                onTap: onSelectServiceStartDate,
                icon: CupertinoIcons.play_circle,
                isOptional: true,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ServiceFormDateSelector(
                label: 'Bitirme',
                date: serviceEndDate,
                onTap: onSelectServiceEndDate,
                icon: CupertinoIcons.stop_circle,
                isOptional: true,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

