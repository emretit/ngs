import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/proposal.dart';
import '../../providers/sales_provider.dart';
import '../../providers/customer_provider.dart';
import '../../services/sales_service.dart';
import '../../services/proposal_pdf_service.dart';
import '../../shared/widgets/service_form_widgets.dart';

class ProposalDetailPage extends ConsumerStatefulWidget {
  final String id;

  const ProposalDetailPage({
    super.key,
    required this.id,
  });

  @override
  ConsumerState<ProposalDetailPage> createState() => _ProposalDetailPageState();
}

class _ProposalDetailPageState extends ConsumerState<ProposalDetailPage> {
  bool _isPdfLoading = false;

  @override
  Widget build(BuildContext context) {
    final proposalAsync = ref.watch(proposalByIdProvider(widget.id));

    return Scaffold(
      backgroundColor: ServiceFormStyles.backgroundColor,
      appBar: _buildAppBar(),
      body: proposalAsync.when(
        data: (proposal) {
          if (proposal == null) {
            return ServiceEmptyState(
              title: 'Teklif bulunamadı',
              subtitle: 'Bu teklif silinmiş veya mevcut değil.',
              icon: CupertinoIcons.exclamationmark_triangle,
              iconColor: ServiceFormStyles.warningColor,
              buttonLabel: 'Geri Dön',
              onButtonPressed: () => context.go('/sales/proposals'),
            );
          }

          return _buildDetailsPage(proposal);
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (error, stack) => ServiceErrorState(
          error: error.toString(),
          onRetry: () => ref.invalidate(proposalByIdProvider(widget.id)),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [ServiceFormStyles.primaryGradientStart, ServiceFormStyles.primaryGradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              CupertinoIcons.doc_text_fill,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Teklif Detayı',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
      backgroundColor: ServiceFormStyles.backgroundColor,
      foregroundColor: ServiceFormStyles.textPrimary,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12.0),
          child: CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minSize: 0,
            color: ServiceFormStyles.primaryColor,
            borderRadius: BorderRadius.circular(10),
            onPressed: _shareProposalPDF,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_isPdfLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CupertinoActivityIndicator(
                      color: Colors.white,
                      radius: 8,
                    ),
                  )
                else
                  const Icon(CupertinoIcons.share, color: Colors.white, size: 16),
                const SizedBox(width: 6),
                Text(
                  _isPdfLoading ? 'Yükleniyor...' : 'PDF Paylaş',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsPage(Proposal proposal) {
    final statusColor = _getProposalStatusColor(proposal.status);
    final statusName = _getProposalStatusName(proposal.status);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(proposalByIdProvider(widget.id));
      },
      color: ServiceFormStyles.primaryColor,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Temel Bilgiler
              _buildBasicInfoSection(proposal, statusColor, statusName),
              const SizedBox(height: 16),

              // Müşteri Bilgileri
              if (proposal.customerId != null) ...[
                _buildCustomerSection(proposal.customerId!),
                const SizedBox(height: 16),
              ],

              // Açıklama
              if (proposal.description != null && proposal.description!.isNotEmpty) ...[
                _buildDescriptionSection(proposal),
                const SizedBox(height: 16),
              ],

              // Teklif Kalemleri
              if (proposal.items != null && (proposal.items as List).isNotEmpty) ...[
                _buildItemsSection(proposal),
                const SizedBox(height: 16),
              ],

              // Şartlar
              _buildTermsSection(proposal),
              const SizedBox(height: 16),

              // Notlar ve Dosyalar
              _buildNotesAndFilesSection(proposal),
              const SizedBox(height: 16),

              // Durum Değiştir
              if (proposal.status != 'accepted' && proposal.status != 'rejected' && proposal.status != 'expired') ...[
                _buildStatusChangeSection(proposal),
                const SizedBox(height: 16),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection(Proposal proposal, Color statusColor, String statusName) {
    return ServiceFormSection(
      title: 'Bilgiler',
      icon: CupertinoIcons.info_circle,
      iconColor: ServiceFormStyles.infoColor,
      children: [
        // Başlık
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Text(
            proposal.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: ServiceFormStyles.textPrimary,
              letterSpacing: -0.3,
            ),
          ),
        ),
        // Durum Badge
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: ServiceStatusBadge(
            label: statusName,
            color: statusColor,
          ),
        ),
        const ServiceDivider(height: 16),
        ServiceInfoRow(
          label: 'Teklif No',
          value: proposal.number,
          icon: CupertinoIcons.number,
          valueColor: ServiceFormStyles.primaryColor,
        ),
        ServiceInfoRow(
          label: 'Toplam Tutar',
          value: '${proposal.totalAmount.toStringAsFixed(2)} ${proposal.currency}',
          icon: CupertinoIcons.money_dollar_circle,
          valueColor: ServiceFormStyles.successColor,
        ),
        ServiceInfoRow(
          label: 'Oluşturulma',
          value: _formatDateTime(proposal.createdAt),
        ),
        if (proposal.offerDate != null)
          ServiceInfoRow(
            label: 'Teklif Tarihi',
            value: _formatDate(proposal.offerDate!),
          ),
        if (proposal.validUntil != null)
          ServiceInfoRow(
            label: 'Geçerlilik Tarihi',
            value: _formatDate(proposal.validUntil!),
            valueColor: proposal.validUntil!.isBefore(DateTime.now())
                ? ServiceFormStyles.errorColor
                : null,
          ),
        if (proposal.updatedAt != proposal.createdAt)
          ServiceInfoRow(
            label: 'Güncellenme',
            value: _formatDateTime(proposal.updatedAt),
          ),
        if (proposal.exchangeRate != 1.0)
          ServiceInfoRow(
            label: 'Kur',
            value: proposal.exchangeRate.toStringAsFixed(4),
          ),
      ],
    );
  }

  Widget _buildCustomerSection(String customerId) {
    final customerAsync = ref.watch(customerByIdProvider(customerId));

    return customerAsync.when(
      data: (customer) {
        if (customer == null) {
          return const SizedBox.shrink();
        }

        return ServiceFormSection(
          title: 'Müşteri',
          icon: CupertinoIcons.person_circle,
          iconColor: ServiceFormStyles.successColor,
          children: [
            ServiceInfoRow(
              label: 'Ad',
              value: customer.name,
              icon: CupertinoIcons.person,
            ),
            if (customer.company != null && customer.company!.isNotEmpty)
              ServiceInfoRow(
                label: 'Şirket',
                value: customer.company!,
                icon: CupertinoIcons.building_2_fill,
              ),
            if (customer.email != null && customer.email!.isNotEmpty)
              ServiceInfoRow(
                label: 'E-posta',
                value: customer.email!,
                icon: CupertinoIcons.mail,
              ),
            if (customer.mobilePhone != null && customer.mobilePhone!.isNotEmpty)
              ServiceInfoRow(
                label: 'Telefon',
                value: customer.mobilePhone!,
                icon: CupertinoIcons.phone,
              ),
            if (customer.address != null && customer.address!.isNotEmpty)
              ServiceInfoRow(
                label: 'Adres',
                value: customer.address!,
                icon: CupertinoIcons.location,
              ),
          ],
        );
      },
      loading: () => ServiceFormSection(
        title: 'Müşteri',
        icon: CupertinoIcons.person_circle,
        iconColor: ServiceFormStyles.successColor,
        children: [
          const Center(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: CupertinoActivityIndicator(),
            ),
          ),
        ],
      ),
      error: (error, stack) => const SizedBox.shrink(),
    );
  }

  Widget _buildDescriptionSection(Proposal proposal) {
    return ServiceFormSection(
      title: 'Açıklama',
      icon: CupertinoIcons.text_alignleft,
      iconColor: ServiceFormStyles.purpleColor,
      children: [
        Text(
          proposal.description!,
          style: const TextStyle(
            fontSize: ServiceFormStyles.bodySize,
            color: ServiceFormStyles.textPrimary,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildItemsSection(Proposal proposal) {
    final items = proposal.items as List;
    
    return ServiceFormSection(
      title: 'Teklif Kalemleri',
      icon: CupertinoIcons.list_bullet,
      iconColor: ServiceFormStyles.primaryColor,
      children: [
        ...items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value as Map<String, dynamic>;
          
          return Container(
            margin: EdgeInsets.only(bottom: index < items.length - 1 ? 12 : 0),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: ServiceFormStyles.inputBackground,
              borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name']?.toString() ?? 'Kalem ${index + 1}',
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.titleSize,
                    fontWeight: FontWeight.w600,
                    color: ServiceFormStyles.textPrimary,
                  ),
                ),
                if (item['description'] != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    item['description'].toString(),
                    style: const TextStyle(
                      fontSize: ServiceFormStyles.bodySize,
                      color: ServiceFormStyles.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Miktar: ${item['quantity']?.toString() ?? '1'} ${item['unit']?.toString() ?? 'adet'}',
                      style: const TextStyle(
                        fontSize: ServiceFormStyles.labelSize,
                        color: ServiceFormStyles.textSecondary,
                      ),
                    ),
                    Text(
                      '${(item['total_price'] ?? item['unit_price'] ?? 0).toStringAsFixed(2)} ${proposal.currency}',
                      style: const TextStyle(
                        fontSize: ServiceFormStyles.titleSize,
                        fontWeight: FontWeight.w600,
                        color: ServiceFormStyles.successColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildTermsSection(Proposal proposal) {
    final hasTerms = proposal.paymentTerms != null ||
        proposal.deliveryTerms != null ||
        proposal.warrantyTerms != null ||
        proposal.priceTerms != null ||
        proposal.otherTerms != null ||
        (proposal.selectedPaymentTerms != null && proposal.selectedPaymentTerms!.isNotEmpty) ||
        (proposal.selectedDeliveryTerms != null && proposal.selectedDeliveryTerms!.isNotEmpty) ||
        (proposal.selectedWarrantyTerms != null && proposal.selectedWarrantyTerms!.isNotEmpty) ||
        (proposal.selectedPricingTerms != null && proposal.selectedPricingTerms!.isNotEmpty) ||
        (proposal.selectedOtherTerms != null && proposal.selectedOtherTerms!.isNotEmpty);

    if (!hasTerms) {
      return const SizedBox.shrink();
    }

    return ServiceFormSection(
      title: 'Şartlar',
      icon: CupertinoIcons.doc_text_search,
      iconColor: ServiceFormStyles.warningColor,
      children: [
        if (proposal.paymentTerms != null && proposal.paymentTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Ödeme Şartları'),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              proposal.paymentTerms!,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (proposal.selectedPaymentTerms != null && proposal.selectedPaymentTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Seçili Ödeme Şartları'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: proposal.selectedPaymentTerms!.map((term) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  term,
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.labelSize,
                    color: ServiceFormStyles.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
        ],
        if (proposal.deliveryTerms != null && proposal.deliveryTerms!.isNotEmpty) ...[
          const ServiceDivider(height: 16),
          const ServiceSectionHeader(title: 'Teslimat Şartları'),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              proposal.deliveryTerms!,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (proposal.selectedDeliveryTerms != null && proposal.selectedDeliveryTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Seçili Teslimat Şartları'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: proposal.selectedDeliveryTerms!.map((term) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  term,
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.labelSize,
                    color: ServiceFormStyles.successColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
        ],
        if (proposal.warrantyTerms != null && proposal.warrantyTerms!.isNotEmpty) ...[
          const ServiceDivider(height: 16),
          const ServiceSectionHeader(title: 'Garanti Şartları'),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              proposal.warrantyTerms!,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (proposal.selectedWarrantyTerms != null && proposal.selectedWarrantyTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Seçili Garanti Şartları'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: proposal.selectedWarrantyTerms!.map((term) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.infoColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  term,
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.labelSize,
                    color: ServiceFormStyles.infoColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
        ],
        if (proposal.priceTerms != null && proposal.priceTerms!.isNotEmpty) ...[
          const ServiceDivider(height: 16),
          const ServiceSectionHeader(title: 'Fiyat Şartları'),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              proposal.priceTerms!,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (proposal.selectedPricingTerms != null && proposal.selectedPricingTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Seçili Fiyat Şartları'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: proposal.selectedPricingTerms!.map((term) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.warningColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  term,
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.labelSize,
                    color: ServiceFormStyles.warningColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
        ],
        if (proposal.otherTerms != null && proposal.otherTerms!.isNotEmpty) ...[
          const ServiceDivider(height: 16),
          const ServiceSectionHeader(title: 'Diğer Şartlar'),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              proposal.otherTerms!,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (proposal.selectedOtherTerms != null && proposal.selectedOtherTerms!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Seçili Diğer Şartlar'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: proposal.selectedOtherTerms!.map((term) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ServiceFormStyles.purpleColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  term,
                  style: const TextStyle(
                    fontSize: ServiceFormStyles.labelSize,
                    color: ServiceFormStyles.purpleColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildNotesAndFilesSection(Proposal proposal) {
    return ServiceFormSection(
      title: 'Notlar ve Dosyalar',
      icon: CupertinoIcons.doc_text,
      iconColor: ServiceFormStyles.warningColor,
      children: [
        if (proposal.notes != null && proposal.notes!.isNotEmpty) ...[
          const ServiceSectionHeader(title: 'Notlar'),
          Text(
            proposal.notes!,
            style: const TextStyle(
              fontSize: ServiceFormStyles.bodySize,
              color: ServiceFormStyles.textPrimary,
              height: 1.5,
            ),
          ),
        ],
        if (proposal.attachments != null && (proposal.attachments as List).isNotEmpty) ...[
          if (proposal.notes != null && proposal.notes!.isNotEmpty)
            const ServiceDivider(height: 20),
          Row(
            children: [
              const Icon(
                CupertinoIcons.paperclip,
                size: 16,
                color: ServiceFormStyles.successColor,
              ),
              const SizedBox(width: 8),
              Text(
                'Dosyalar (${(proposal.attachments as List).length})',
                style: const TextStyle(
                  fontSize: ServiceFormStyles.bodySize,
                  fontWeight: FontWeight.w600,
                  color: ServiceFormStyles.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...(proposal.attachments as List).asMap().entries.map((entry) =>
              _buildAttachmentItem(entry.value, entry.key)),
        ],
        if ((proposal.notes == null || proposal.notes!.isEmpty) &&
            (proposal.attachments == null || (proposal.attachments as List).isEmpty))
          _buildEmptyItem('Henüz not veya dosya eklenmemiş'),
      ],
    );
  }

  Widget _buildStatusChangeSection(Proposal proposal) {
    return ServiceFormSection(
      title: 'Durum Değiştir',
      icon: CupertinoIcons.arrow_2_squarepath,
      iconColor: ServiceFormStyles.primaryColor,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (proposal.status == 'draft' || proposal.status == 'taslak')
              _buildStatusButton('Gönder', 'sent', ServiceFormStyles.infoColor),
            if (proposal.status == 'sent' || proposal.status == 'gonderildi') ...[
              _buildStatusButton('Kabul Et', 'accepted', ServiceFormStyles.successColor),
              _buildStatusButton('Reddet', 'rejected', ServiceFormStyles.errorColor),
            ],
            if (proposal.status != 'accepted' && proposal.status != 'rejected' && proposal.status != 'expired')
              _buildStatusButton('İptal Et', 'cancelled', ServiceFormStyles.errorColor),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusButton(String label, String status, Color color) {
    return CupertinoButton(
      onPressed: () => _updateStatus(status),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: color,
      borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
      minSize: 0,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyItem(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ServiceFormStyles.inputBackground,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: ServiceFormStyles.bodySize,
          color: ServiceFormStyles.textSecondary,
          fontStyle: FontStyle.italic,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildAttachmentItem(dynamic attachment, int index) {
    final fileName = attachment is Map ? (attachment['name'] ?? 'Dosya') : 'Dosya';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ServiceFormStyles.successColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: ServiceFormStyles.successColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          const Icon(
            CupertinoIcons.paperclip,
            size: 16,
            color: ServiceFormStyles.successColor,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              fileName,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              // TODO: Dosya indirme
            },
            child: const Icon(
              CupertinoIcons.arrow_down_circle,
              size: 20,
              color: ServiceFormStyles.successColor,
            ),
          ),
        ],
      ),
    );
  }

  void _updateStatus(String status) async {
    try {
      final service = ref.read(salesServiceProvider);
      await service.updateProposalStatus(widget.id, status);

      ref.invalidate(proposalByIdProvider(widget.id));
      ref.invalidate(proposalsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Durum güncellendi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  void _shareProposalPDF() async {
    final proposal = await ref.read(proposalByIdProvider(widget.id).future);

    if (proposal == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Teklif bulunamadı')),
        );
      }
      return;
    }

    setState(() {
      _isPdfLoading = true;
    });

    try {
      final pdfService = ProposalPdfService();
      final pdfBytes = await pdfService.generateProposalPdfFromWeb(proposal);
      final fileName = 'Teklif_${proposal.number}.pdf';

      await pdfService.previewAndShare(pdfBytes, fileName);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PDF oluşturuldu'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('PDF oluşturma hatası: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPdfLoading = false;
        });
      }
    }
  }

  Color _getProposalStatusColor(String status) {
    if (status == 'draft' || status == 'taslak') {
      return const Color(0xFF8E8E93);
    } else if (status == 'pending' || status == 'onay_bekliyor') {
      return const Color(0xFFFF9500);
    } else if (status == 'sent' || status == 'gonderildi') {
      return const Color(0xFF3B82F6);
    } else if (status == 'accepted' || status == 'kabul_edildi') {
      return const Color(0xFF22C55E);
    } else if (status == 'rejected' || status == 'reddedildi') {
      return const Color(0xFFEF4444);
    } else if (status == 'expired' || status == 'suresi_dolmus') {
      return const Color(0xFFFF9500);
    } else if (status == 'cancelled' || status == 'iptal') {
      return const Color(0xFF8E8E93);
    }
    return const Color(0xFF8E8E93);
  }

  String _getProposalStatusName(String status) {
    if (status == 'draft' || status == 'taslak') return 'Taslak';
    if (status == 'pending' || status == 'onay_bekliyor') return 'Onay Bekliyor';
    if (status == 'sent' || status == 'gonderildi') return 'Gönderildi';
    if (status == 'accepted' || status == 'kabul_edildi') return 'Kabul Edildi';
    if (status == 'rejected' || status == 'reddedildi') return 'Reddedildi';
    if (status == 'expired' || status == 'suresi_dolmus') return 'Süresi Dolmuş';
    if (status == 'cancelled' || status == 'iptal') return 'İptal Edildi';
    return status;
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}.${dateTime.month.toString().padLeft(2, '0')}.${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}


