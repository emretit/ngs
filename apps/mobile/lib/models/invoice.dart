class Invoice {
  final String id;
  final String? faturaNo;
  final String? orderId;
  final String customerId;
  final String? employeeId;
  final DateTime faturaTarihi;
  final DateTime? vadeTarihi;
  final String? aciklama;
  final String? notlar;
  final String paraBirimi;
  final double araToplam;
  final double kdvTutari;
  final double indirimTutari;
  final double toplamTutar;
  final double odenenTutar;
  final String odemeDurumu;
  final String? documentType;
  final String durum;
  final String? odemeSekli;
  final String? bankaBilgileri;
  final String? pdfUrl;
  final Map<String, dynamic>? xmlData;
  final List<dynamic>? ekBelgeler;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String? einvoiceStatus;
  final String? nilveraInvoiceId;
  final String? nilveraTransferId;
  final int? einvoiceTransferState;
  final int? einvoiceInvoiceState;
  final int? einvoiceAnswerType;
  final DateTime? einvoiceSentAt;
  final DateTime? einvoiceDeliveredAt;
  final DateTime? einvoiceRespondedAt;
  final String? einvoiceErrorMessage;
  final String? einvoiceErrorCode;
  final Map<String, dynamic>? einvoiceNilveraResponse;
  final String? einvoiceXmlContent;
  final String? proposalId;

  Invoice({
    required this.id,
    this.faturaNo,
    this.orderId,
    required this.customerId,
    this.employeeId,
    required this.faturaTarihi,
    this.vadeTarihi,
    this.aciklama,
    this.notlar,
    required this.paraBirimi,
    required this.araToplam,
    required this.kdvTutari,
    required this.indirimTutari,
    required this.toplamTutar,
    required this.odenenTutar,
    required this.odemeDurumu,
    this.documentType,
    required this.durum,
    this.odemeSekli,
    this.bankaBilgileri,
    this.pdfUrl,
    this.xmlData,
    this.ekBelgeler,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    this.einvoiceStatus,
    this.nilveraInvoiceId,
    this.nilveraTransferId,
    this.einvoiceTransferState,
    this.einvoiceInvoiceState,
    this.einvoiceAnswerType,
    this.einvoiceSentAt,
    this.einvoiceDeliveredAt,
    this.einvoiceRespondedAt,
    this.einvoiceErrorMessage,
    this.einvoiceErrorCode,
    this.einvoiceNilveraResponse,
    this.einvoiceXmlContent,
    this.proposalId,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] ?? '',
      faturaNo: json['fatura_no'],
      orderId: json['order_id'],
      customerId: json['customer_id'] ?? '',
      employeeId: json['employee_id'],
      faturaTarihi: json['fatura_tarihi'] != null
          ? DateTime.parse(json['fatura_tarihi'])
          : DateTime.now(),
      vadeTarihi: json['vade_tarihi'] != null
          ? DateTime.parse(json['vade_tarihi'])
          : null,
      aciklama: json['aciklama'],
      notlar: json['notlar'],
      paraBirimi: json['para_birimi'] ?? 'TRY',
      araToplam: (json['ara_toplam'] ?? 0).toDouble(),
      kdvTutari: (json['kdv_tutari'] ?? 0).toDouble(),
      indirimTutari: (json['indirim_tutari'] ?? 0).toDouble(),
      toplamTutar: (json['toplam_tutar'] ?? 0).toDouble(),
      odenenTutar: (json['odenen_tutar'] ?? 0).toDouble(),
      odemeDurumu: json['odeme_durumu'] ?? 'odenmedi',
      documentType: json['document_type'],
      durum: json['durum'] ?? 'taslak',
      odemeSekli: json['odeme_sekli'],
      bankaBilgileri: json['banka_bilgileri'],
      pdfUrl: json['pdf_url'],
      xmlData: json['xml_data'] != null
          ? Map<String, dynamic>.from(json['xml_data'])
          : null,
      ekBelgeler: json['ek_belgeler'] != null
          ? List<dynamic>.from(json['ek_belgeler'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      einvoiceStatus: json['einvoice_status'],
      nilveraInvoiceId: json['nilvera_invoice_id'],
      nilveraTransferId: json['nilvera_transfer_id'],
      einvoiceTransferState: json['einvoice_transfer_state'],
      einvoiceInvoiceState: json['einvoice_invoice_state'],
      einvoiceAnswerType: json['einvoice_answer_type'],
      einvoiceSentAt: json['einvoice_sent_at'] != null
          ? DateTime.parse(json['einvoice_sent_at'])
          : null,
      einvoiceDeliveredAt: json['einvoice_delivered_at'] != null
          ? DateTime.parse(json['einvoice_delivered_at'])
          : null,
      einvoiceRespondedAt: json['einvoice_responded_at'] != null
          ? DateTime.parse(json['einvoice_responded_at'])
          : null,
      einvoiceErrorMessage: json['einvoice_error_message'],
      einvoiceErrorCode: json['einvoice_error_code'],
      einvoiceNilveraResponse: json['einvoice_nilvera_response'] != null
          ? Map<String, dynamic>.from(json['einvoice_nilvera_response'])
          : null,
      einvoiceXmlContent: json['einvoice_xml_content'],
      proposalId: json['proposal_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fatura_no': faturaNo,
      'order_id': orderId,
      'customer_id': customerId,
      'employee_id': employeeId,
      'fatura_tarihi': faturaTarihi.toIso8601String(),
      'vade_tarihi': vadeTarihi?.toIso8601String(),
      'aciklama': aciklama,
      'notlar': notlar,
      'para_birimi': paraBirimi,
      'ara_toplam': araToplam,
      'kdv_tutari': kdvTutari,
      'indirim_tutari': indirimTutari,
      'toplam_tutar': toplamTutar,
      'odenen_tutar': odenenTutar,
      'odeme_durumu': odemeDurumu,
      'document_type': documentType,
      'durum': durum,
      'odeme_sekli': odemeSekli,
      'banka_bilgileri': bankaBilgileri,
      'pdf_url': pdfUrl,
      'xml_data': xmlData,
      'ek_belgeler': ekBelgeler,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'einvoice_status': einvoiceStatus,
      'nilvera_invoice_id': nilveraInvoiceId,
      'nilvera_transfer_id': nilveraTransferId,
      'einvoice_transfer_state': einvoiceTransferState,
      'einvoice_invoice_state': einvoiceInvoiceState,
      'einvoice_answer_type': einvoiceAnswerType,
      'einvoice_sent_at': einvoiceSentAt?.toIso8601String(),
      'einvoice_delivered_at': einvoiceDeliveredAt?.toIso8601String(),
      'einvoice_responded_at': einvoiceRespondedAt?.toIso8601String(),
      'einvoice_error_message': einvoiceErrorMessage,
      'einvoice_error_code': einvoiceErrorCode,
      'einvoice_nilvera_response': einvoiceNilveraResponse,
      'einvoice_xml_content': einvoiceXmlContent,
      'proposal_id': proposalId,
    };
  }
}

