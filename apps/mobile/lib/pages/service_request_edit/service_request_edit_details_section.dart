import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ServiceRequestEditDetailsSection extends StatelessWidget {
  final TextEditingController serviceResultController;
  final TextEditingController warrantyNotesController;
  final TextEditingController notesController;
  final bool isUnderWarranty;
  final DateTime? warrantyStartDate;
  final DateTime? warrantyEndDate;
  final List<Map<String, dynamic>> attachments;
  final Function(bool) onWarrantyChanged;
  final Function(DateTime) onWarrantyStartDateSelected;
  final Function(DateTime) onWarrantyEndDateSelected;
  final Function(Map<String, dynamic>) onRemoveAttachment;
  final VoidCallback onAddAttachment;

  const ServiceRequestEditDetailsSection({
    super.key,
    required this.serviceResultController,
    required this.warrantyNotesController,
    required this.notesController,
    required this.isUnderWarranty,
    required this.warrantyStartDate,
    required this.warrantyEndDate,
    required this.attachments,
    required this.onWarrantyChanged,
    required this.onWarrantyStartDateSelected,
    required this.onWarrantyEndDateSelected,
    required this.onRemoveAttachment,
    required this.onAddAttachment,
  });

  @override
  Widget build(BuildContext context) {
    return ServiceFormSection(
      title: 'Servis Açıklaması ve Garanti',
      icon: CupertinoIcons.doc_text_fill,
      iconColor: ServiceFormStyles.warningColor,
      children: [
        // Servis Sonucu
        ServiceFormTextField(
          controller: serviceResultController,
          label: 'Servis Sonucu',
          hint: 'Servis sonucu veya ön görüş (opsiyonel)',
          icon: CupertinoIcons.checkmark_seal,
          maxLines: 2,
        ),
        const SizedBox(height: 10),
        // Garanti durumu switch
        Container(
          decoration: BoxDecoration(
            color: ServiceFormStyles.inputBackground,
            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            border: Border.all(
              color: Colors.grey.withOpacity(0.1),
              width: 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Icon(
                CupertinoIcons.shield_lefthalf_fill,
                color: isUnderWarranty ? ServiceFormStyles.successColor : ServiceFormStyles.textSecondary,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Garanti Kapsamında',
                  style: TextStyle(
                    fontSize: ServiceFormStyles.bodySize,
                    fontWeight: FontWeight.w500,
                    color: isUnderWarranty ? ServiceFormStyles.textPrimary : ServiceFormStyles.textSecondary,
                  ),
                ),
              ),
              CupertinoSwitch(
                value: isUnderWarranty,
                activeColor: ServiceFormStyles.successColor,
                onChanged: onWarrantyChanged,
              ),
            ],
          ),
        ),

        if (isUnderWarranty) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: warrantyStartDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      onWarrantyStartDateSelected(picked);
                    }
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: ServiceFormStyles.inputBackground,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.calendar,
                          color: ServiceFormStyles.primaryColor,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Garanti Başlangıç',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.labelSize,
                                  color: ServiceFormStyles.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                warrantyStartDate != null
                                    ? '${warrantyStartDate!.day.toString().padLeft(2, '0')}.${warrantyStartDate!.month.toString().padLeft(2, '0')}.${warrantyStartDate!.year}'
                                    : 'Tarih seçin',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.bodySize,
                                  color: warrantyStartDate != null
                                      ? ServiceFormStyles.textPrimary
                                      : ServiceFormStyles.textSecondary.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: warrantyEndDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      onWarrantyEndDateSelected(picked);
                    }
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: ServiceFormStyles.inputBackground,
                      borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.calendar,
                          color: ServiceFormStyles.primaryColor,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Garanti Bitiş',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.labelSize,
                                  color: ServiceFormStyles.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                warrantyEndDate != null
                                    ? '${warrantyEndDate!.day.toString().padLeft(2, '0')}.${warrantyEndDate!.month.toString().padLeft(2, '0')}.${warrantyEndDate!.year}'
                                    : 'Tarih seçin',
                                style: TextStyle(
                                  fontSize: ServiceFormStyles.bodySize,
                                  color: warrantyEndDate != null
                                      ? ServiceFormStyles.textPrimary
                                      : ServiceFormStyles.textSecondary.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ServiceFormTextField(
            controller: warrantyNotesController,
            label: 'Garanti Notları',
            hint: 'Garanti ile ilgili özel notlar',
            icon: CupertinoIcons.text_alignleft,
            maxLines: 2,
          ),
        ],

        const SizedBox(height: 10),

        // Dosya ekleme bölümü
        Container(
          decoration: BoxDecoration(
            color: ServiceFormStyles.inputBackground,
            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    CupertinoIcons.paperclip,
                    color: ServiceFormStyles.primaryColor,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Dosyalar',
                      style: TextStyle(
                        fontSize: ServiceFormStyles.labelSize,
                        color: ServiceFormStyles.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  CupertinoButton(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    color: ServiceFormStyles.primaryColor,
                    borderRadius: BorderRadius.circular(8),
                    minSize: 0,
                    onPressed: onAddAttachment,
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(CupertinoIcons.add, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Dosya Ekle',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (attachments.isEmpty) ...[
                const SizedBox(height: 8),
                const Text(
                  'Henüz dosya eklenmemiş',
                  style: TextStyle(
                    fontSize: ServiceFormStyles.captionSize,
                    color: ServiceFormStyles.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ] else ...[
                const SizedBox(height: 8),
                ...attachments.map<Widget>((file) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          CupertinoIcons.doc,
                          size: 16,
                          color: ServiceFormStyles.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            file['name'] ?? 'Unknown',
                            style: const TextStyle(
                              fontSize: ServiceFormStyles.captionSize,
                              color: ServiceFormStyles.textPrimary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => onRemoveAttachment(file),
                          child: const Icon(
                            CupertinoIcons.xmark_circle_fill,
                            size: 16,
                            color: ServiceFormStyles.errorColor,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

