import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/pdf_template_provider.dart';
import '../../models/pdf_template.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ServiceRequestEditAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String serviceRequestId;
  final bool isSaving;
  final bool isGeneratingPdf;
  final Function(String?) onPrint;

  const ServiceRequestEditAppBar({
    super.key,
    required this.serviceRequestId,
    required this.isSaving,
    required this.isGeneratingPdf,
    required this.onPrint,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 1);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      leading: IconButton(
        icon: const Icon(CupertinoIcons.back, size: 20),
        onPressed: () {
          if (Navigator.of(context).canPop()) {
            context.pop();
          } else {
            context.go('/service/detail/$serviceRequestId');
          }
        },
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: ServiceFormStyles.primaryColor.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              CupertinoIcons.pencil,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Servis Talebini Düzenle',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.3,
                    color: ServiceFormStyles.textPrimary,
                  ),
                ),
                Text(
                  'Değişiklikleri kaydedin',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: ServiceFormStyles.textSecondary.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      backgroundColor: Colors.white,
      foregroundColor: ServiceFormStyles.textPrimary,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      actions: [
        // Yazdır butonu
        Consumer(
          builder: (context, ref, child) {
            final templatesAsync = ref.watch(serviceSlipPdfTemplatesProvider);
            return templatesAsync.when(
              data: (templates) => _buildPrintButton(templates),
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) => _buildPrintButton([]),
            );
          },
        ),
        if (isSaving)
          const Padding(
            padding: EdgeInsets.all(16),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CupertinoActivityIndicator(
                color: ServiceFormStyles.primaryColor,
              ),
            ),
          ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          color: Colors.grey.withOpacity(0.1),
          height: 1,
        ),
      ),
    );
  }

  Widget _buildPrintButton(List<PdfTemplate> templates) {
    return PopupMenuButton<String>(
      icon: isGeneratingPdf
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(CupertinoIcons.printer, size: 20),
      onSelected: (templateId) {
        onPrint(templateId == 'default' ? null : templateId);
      },
      itemBuilder: (context) {
        final items = <PopupMenuEntry<String>>[];
        
        // Varsayılan şablon seçeneği
        items.add(
          const PopupMenuItem(
            value: 'default',
            child: Row(
              children: [
                Icon(CupertinoIcons.doc_text, size: 16),
                SizedBox(width: 8),
                Text('Varsayılan Şablon'),
              ],
            ),
          ),
        );
        
        if (templates.isNotEmpty) {
          items.add(const PopupMenuDivider());
          for (var template in templates) {
            items.add(
              PopupMenuItem(
                value: template.id,
                child: Row(
                  children: [
                    Icon(
                      template.isDefault ? CupertinoIcons.star_fill : CupertinoIcons.doc_text,
                      size: 16,
                      color: template.isDefault ? Colors.amber : null,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        template.name,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
        }
        
        return items;
      },
    );
  }
}

