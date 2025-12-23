# Flutter Servis Şablonu Entegrasyon Rehberi

Bu doküman, Web'de oluşturulan servis şablonlarının Flutter uygulamasında nasıl kullanılacağını açıklar.

## Genel Bakış

Şablonlar Supabase `service_templates` tablosunda saklanır ve hem Web hem de Flutter tarafından kullanılabilir.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web (React)   │────▶│    Supabase      │◀────│   Flutter       │
│  Şablon Oluştur │     │ service_templates│     │  Şablon Kullan  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## API Kullanımı

Flutter uygulaması şablonları direkt Supabase client ile çeker. RLS (Row Level Security) sayesinde sadece kendi şirketinin şablonlarına erişebilir.

### Tüm Şablonları Getir

```dart
final templates = await supabase
  .from('service_templates')
  .select('*')
  .eq('is_active', true)
  .order('usage_count', ascending: false)
  .order('created_at', ascending: false);

if (templates.error != null) {
  throw Exception('Failed to fetch templates: ${templates.error?.message}');
}

// Şirket bilgilerini al (opsiyonel - header'da kullanmak için)
final user = supabase.auth.currentUser;
String? companyId;
if (user != null) {
  final profile = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  companyId = profile.data?['company_id'];
}

final company = companyId != null ? await supabase
  .from('companies')
  .select('name, address, phone, email, website, logo_url, tax_number')
  .eq('id', companyId)
  .single() : null;

// Her template'i Flutter formatına dönüştür
final flutterTemplates = (templates.data ?? []).map((template) {
  final serviceDetails = template['service_details'] ?? {};
  final pdfSchema = serviceDetails['pdf_schema'] ?? {};
  
  return {
    'id': template['id'],
    'name': template['name'],
    'description': template['description'],
    'is_active': template['is_active'] ?? true,
    'usage_count': template['usage_count'] ?? 0,
    'created_at': template['created_at'],
    'updated_at': template['updated_at'],
    'pdf_schema': {
      'page': {
        'size': pdfSchema['page']?['size'] ?? 'A4',
        'padding': pdfSchema['page']?['padding'] ?? {'top': 40, 'right': 40, 'bottom': 40, 'left': 40},
        'fontSize': pdfSchema['page']?['fontSize'] ?? 12,
        'fontFamily': pdfSchema['page']?['fontFamily'] ?? 'Roboto',
        'fontColor': pdfSchema['page']?['fontColor'] ?? '#000000',
        'backgroundColor': pdfSchema['page']?['backgroundColor'] ?? '#FFFFFF',
      },
      'header': {
        'showLogo': pdfSchema['header']?['showLogo'] ?? true,
        'logoUrl': pdfSchema['header']?['logoUrl'] ?? company?.data?['logo_url'],
        'logoPosition': pdfSchema['header']?['logoPosition'] ?? 'left',
        'logoSize': pdfSchema['header']?['logoSize'] ?? 80,
        'showTitle': pdfSchema['header']?['showTitle'] ?? true,
        'title': pdfSchema['header']?['title'] ?? 'SERVİS FORMU',
        'titleFontSize': pdfSchema['header']?['titleFontSize'] ?? 18,
        'showCompanyInfo': pdfSchema['header']?['showCompanyInfo'] ?? true,
        'companyName': pdfSchema['header']?['companyName'] ?? company?.data?['name'] ?? '',
        'companyAddress': pdfSchema['header']?['companyAddress'] ?? company?.data?['address'] ?? '',
        'companyPhone': pdfSchema['header']?['companyPhone'] ?? company?.data?['phone'] ?? '',
        'companyEmail': pdfSchema['header']?['companyEmail'] ?? company?.data?['email'] ?? '',
        'companyWebsite': pdfSchema['header']?['companyWebsite'] ?? company?.data?['website'] ?? '',
        'companyTaxNumber': pdfSchema['header']?['companyTaxNumber'] ?? company?.data?['tax_number'] ?? '',
        'companyInfoFontSize': pdfSchema['header']?['companyInfoFontSize'] ?? 10,
      },
      'serviceInfo': {
        'titleFontSize': pdfSchema['serviceInfo']?['titleFontSize'] ?? 14,
        'infoFontSize': pdfSchema['serviceInfo']?['infoFontSize'] ?? 10,
        'showServiceNumber': pdfSchema['serviceInfo']?['showServiceNumber'] ?? true,
        'showServiceStatus': pdfSchema['serviceInfo']?['showServiceStatus'] ?? true,
        'showTechnician': pdfSchema['serviceInfo']?['showTechnician'] ?? true,
        'showServiceType': pdfSchema['serviceInfo']?['showServiceType'] ?? true,
        'showDates': pdfSchema['serviceInfo']?['showDates'] ?? true,
      },
      'partsTable': {
        'show': pdfSchema['partsTable']?['show'] ?? true,
        'columns': pdfSchema['partsTable']?['columns'] ?? [
          {'key': 'name', 'label': 'Ürün Adı', 'show': true, 'align': 'left'},
          {'key': 'quantity', 'label': 'Miktar', 'show': true, 'align': 'center'},
          {'key': 'unit', 'label': 'Birim', 'show': true, 'align': 'center'},
          {'key': 'unitPrice', 'label': 'Birim Fiyat', 'show': true, 'align': 'right'},
          {'key': 'total', 'label': 'Toplam', 'show': true, 'align': 'right'},
        ],
        'showRowNumber': pdfSchema['partsTable']?['showRowNumber'] ?? true,
      },
      'signatures': {
        'show': pdfSchema['signatures']?['show'] ?? true,
        'showTechnician': pdfSchema['signatures']?['showTechnician'] ?? true,
        'showCustomer': pdfSchema['signatures']?['showCustomer'] ?? true,
        'technicianLabel': pdfSchema['signatures']?['technicianLabel'] ?? 'Teknisyen',
        'customerLabel': pdfSchema['signatures']?['customerLabel'] ?? 'Müşteri',
        'fontSize': pdfSchema['signatures']?['fontSize'] ?? 10,
      },
      'notes': {
        'footer': pdfSchema['notes']?['footer'] ?? 'Servis hizmeti için teşekkür ederiz.',
        'footerFontSize': pdfSchema['notes']?['footerFontSize'] ?? 10,
        'showFooterLogo': pdfSchema['notes']?['showFooterLogo'] ?? false,
      },
    },
    'defaults': {
      'estimated_duration': serviceDetails['estimated_duration'],
      'default_location': serviceDetails['default_location'],
      'default_technician_id': serviceDetails['default_technician_id'],
      'service_type': serviceDetails['service_type'],
      'service_priority': serviceDetails['service_priority'] ?? 'medium',
    },
    'parts_list': serviceDetails['parts_list'] ?? [],
    'company': company?.data,
  };
}).toList();

return flutterTemplates.map((e) => ServiceTemplateModel.fromJson(e)).toList();
```

### Tek Şablon Getir

```dart
final template = await supabase
  .from('service_templates')
  .select('*')
  .eq('id', templateId)
  .single();

if (template.error != null) {
  throw Exception('Failed to fetch template: ${template.error?.message}');
}

// Şirket bilgilerini al
final user = supabase.auth.currentUser;
String? companyId;
if (user != null) {
  final profile = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  companyId = profile.data?['company_id'];
}

final company = companyId != null ? await supabase
  .from('companies')
  .select('name, address, phone, email, website, logo_url, tax_number')
  .eq('id', companyId)
  .single() : null;

// Template'i Flutter formatına dönüştür
final serviceDetails = template.data?['service_details'] ?? {};
final pdfSchema = serviceDetails['pdf_schema'] ?? {};

final flutterTemplate = {
  'id': template.data?['id'],
  'name': template.data?['name'],
  'description': template.data?['description'],
  'is_active': template.data?['is_active'] ?? true,
  'usage_count': template.data?['usage_count'] ?? 0,
  'created_at': template.data?['created_at'],
  'updated_at': template.data?['updated_at'],
  'pdf_schema': {
    'page': {
      'size': pdfSchema['page']?['size'] ?? 'A4',
      'padding': pdfSchema['page']?['padding'] ?? {'top': 40, 'right': 40, 'bottom': 40, 'left': 40},
      'fontSize': pdfSchema['page']?['fontSize'] ?? 12,
      'fontFamily': pdfSchema['page']?['fontFamily'] ?? 'Roboto',
      'fontColor': pdfSchema['page']?['fontColor'] ?? '#000000',
      'backgroundColor': pdfSchema['page']?['backgroundColor'] ?? '#FFFFFF',
    },
    'header': {
      'showLogo': pdfSchema['header']?['showLogo'] ?? true,
      'logoUrl': pdfSchema['header']?['logoUrl'] ?? company?.data?['logo_url'],
      'logoPosition': pdfSchema['header']?['logoPosition'] ?? 'left',
      'logoSize': pdfSchema['header']?['logoSize'] ?? 80,
      'showTitle': pdfSchema['header']?['showTitle'] ?? true,
      'title': pdfSchema['header']?['title'] ?? 'SERVİS FORMU',
      'titleFontSize': pdfSchema['header']?['titleFontSize'] ?? 18,
      'showCompanyInfo': pdfSchema['header']?['showCompanyInfo'] ?? true,
      'companyName': pdfSchema['header']?['companyName'] ?? company?.data?['name'] ?? '',
      'companyAddress': pdfSchema['header']?['companyAddress'] ?? company?.data?['address'] ?? '',
      'companyPhone': pdfSchema['header']?['companyPhone'] ?? company?.data?['phone'] ?? '',
      'companyEmail': pdfSchema['header']?['companyEmail'] ?? company?.data?['email'] ?? '',
      'companyWebsite': pdfSchema['header']?['companyWebsite'] ?? company?.data?['website'] ?? '',
      'companyTaxNumber': pdfSchema['header']?['companyTaxNumber'] ?? company?.data?['tax_number'] ?? '',
      'companyInfoFontSize': pdfSchema['header']?['companyInfoFontSize'] ?? 10,
    },
    'serviceInfo': {
      'titleFontSize': pdfSchema['serviceInfo']?['titleFontSize'] ?? 14,
      'infoFontSize': pdfSchema['serviceInfo']?['infoFontSize'] ?? 10,
      'showServiceNumber': pdfSchema['serviceInfo']?['showServiceNumber'] ?? true,
      'showServiceStatus': pdfSchema['serviceInfo']?['showServiceStatus'] ?? true,
      'showTechnician': pdfSchema['serviceInfo']?['showTechnician'] ?? true,
      'showServiceType': pdfSchema['serviceInfo']?['showServiceType'] ?? true,
      'showDates': pdfSchema['serviceInfo']?['showDates'] ?? true,
    },
    'partsTable': {
      'show': pdfSchema['partsTable']?['show'] ?? true,
      'columns': pdfSchema['partsTable']?['columns'] ?? [
        {'key': 'name', 'label': 'Ürün Adı', 'show': true, 'align': 'left'},
        {'key': 'quantity', 'label': 'Miktar', 'show': true, 'align': 'center'},
        {'key': 'unit', 'label': 'Birim', 'show': true, 'align': 'center'},
        {'key': 'unitPrice', 'label': 'Birim Fiyat', 'show': true, 'align': 'right'},
        {'key': 'total', 'label': 'Toplam', 'show': true, 'align': 'right'},
      ],
      'showRowNumber': pdfSchema['partsTable']?['showRowNumber'] ?? true,
    },
    'signatures': {
      'show': pdfSchema['signatures']?['show'] ?? true,
      'showTechnician': pdfSchema['signatures']?['showTechnician'] ?? true,
      'showCustomer': pdfSchema['signatures']?['showCustomer'] ?? true,
      'technicianLabel': pdfSchema['signatures']?['technicianLabel'] ?? 'Teknisyen',
      'customerLabel': pdfSchema['signatures']?['customerLabel'] ?? 'Müşteri',
      'fontSize': pdfSchema['signatures']?['fontSize'] ?? 10,
    },
    'notes': {
      'footer': pdfSchema['notes']?['footer'] ?? 'Servis hizmeti için teşekkür ederiz.',
      'footerFontSize': pdfSchema['notes']?['footerFontSize'] ?? 10,
      'showFooterLogo': pdfSchema['notes']?['showFooterLogo'] ?? false,
    },
  },
  'defaults': {
    'estimated_duration': serviceDetails['estimated_duration'],
    'default_location': serviceDetails['default_location'],
    'default_technician_id': serviceDetails['default_technician_id'],
    'service_type': serviceDetails['service_type'],
    'service_priority': serviceDetails['service_priority'] ?? 'medium',
  },
  'parts_list': serviceDetails['parts_list'] ?? [],
  'company': company?.data,
};

return ServiceTemplateModel.fromJson(flutterTemplate);
```

**Not:** 
- RLS (Row Level Security) sayesinde kullanıcı sadece kendi şirketinin şablonlarına erişebilir
- `service_details.pdf_schema` içinde tam PDF şema yapısı saklanır
- `service_details.parts_list` içinde parça listesi şablonu saklanır
- `service_details` içinde varsayılan değerler (estimated_duration, default_location, vb.) saklanır

## Dart Model Sınıfları

### ServiceTemplateModel

```dart
import 'dart:convert';

class ServiceTemplateModel {
  final String id;
  final String name;
  final String? description;
  final bool isActive;
  final int usageCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final PdfSchemaModel pdfSchema;
  final TemplateDefaultsModel defaults;
  final List<PartItemModel> partsList;
  final CompanyInfoModel? company;

  ServiceTemplateModel({
    required this.id,
    required this.name,
    this.description,
    required this.isActive,
    required this.usageCount,
    required this.createdAt,
    required this.updatedAt,
    required this.pdfSchema,
    required this.defaults,
    required this.partsList,
    this.company,
  });

  factory ServiceTemplateModel.fromJson(Map<String, dynamic> json) {
    return ServiceTemplateModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      isActive: json['is_active'] ?? true,
      usageCount: json['usage_count'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      pdfSchema: PdfSchemaModel.fromJson(json['pdf_schema'] ?? {}),
      defaults: TemplateDefaultsModel.fromJson(json['defaults'] ?? {}),
      partsList: (json['parts_list'] as List?)
          ?.map((e) => PartItemModel.fromJson(e))
          .toList() ?? [],
      company: json['company'] != null 
          ? CompanyInfoModel.fromJson(json['company']) 
          : null,
    );
  }
}
```

### PdfSchemaModel

```dart
class PdfSchemaModel {
  final PageSettingsModel page;
  final HeaderSettingsModel header;
  final ServiceInfoSettingsModel serviceInfo;
  final PartsTableSettingsModel partsTable;
  final SignatureSettingsModel signatures;
  final NotesSettingsModel notes;

  PdfSchemaModel({
    required this.page,
    required this.header,
    required this.serviceInfo,
    required this.partsTable,
    required this.signatures,
    required this.notes,
  });

  factory PdfSchemaModel.fromJson(Map<String, dynamic> json) {
    return PdfSchemaModel(
      page: PageSettingsModel.fromJson(json['page'] ?? {}),
      header: HeaderSettingsModel.fromJson(json['header'] ?? {}),
      serviceInfo: ServiceInfoSettingsModel.fromJson(json['serviceInfo'] ?? {}),
      partsTable: PartsTableSettingsModel.fromJson(json['partsTable'] ?? {}),
      signatures: SignatureSettingsModel.fromJson(json['signatures'] ?? {}),
      notes: NotesSettingsModel.fromJson(json['notes'] ?? {}),
    );
  }
}
```

### PageSettingsModel

```dart
class PageSettingsModel {
  final String size; // 'A4', 'Letter', etc.
  final EdgeInsets padding;
  final double fontSize;
  final String fontFamily;
  final String fontColor;
  final String backgroundColor;

  PageSettingsModel({
    this.size = 'A4',
    this.padding = const EdgeInsets.all(40),
    this.fontSize = 12,
    this.fontFamily = 'Roboto',
    this.fontColor = '#000000',
    this.backgroundColor = '#FFFFFF',
  });

  factory PageSettingsModel.fromJson(Map<String, dynamic> json) {
    final paddingJson = json['padding'] ?? {};
    return PageSettingsModel(
      size: json['size'] ?? 'A4',
      padding: EdgeInsets.only(
        top: (paddingJson['top'] ?? 40).toDouble(),
        right: (paddingJson['right'] ?? 40).toDouble(),
        bottom: (paddingJson['bottom'] ?? 40).toDouble(),
        left: (paddingJson['left'] ?? 40).toDouble(),
      ),
      fontSize: (json['fontSize'] ?? 12).toDouble(),
      fontFamily: json['fontFamily'] ?? 'Roboto',
      fontColor: json['fontColor'] ?? '#000000',
      backgroundColor: json['backgroundColor'] ?? '#FFFFFF',
    );
  }
}
```

### HeaderSettingsModel

```dart
class HeaderSettingsModel {
  final bool showLogo;
  final String? logoUrl;
  final String logoPosition; // 'left', 'center', 'right'
  final double logoSize;
  final bool showTitle;
  final String title;
  final double titleFontSize;
  final bool showCompanyInfo;
  final String companyName;
  final String companyAddress;
  final String companyPhone;
  final String companyEmail;
  final String companyWebsite;
  final String companyTaxNumber;
  final double companyInfoFontSize;

  HeaderSettingsModel({
    this.showLogo = true,
    this.logoUrl,
    this.logoPosition = 'left',
    this.logoSize = 80,
    this.showTitle = true,
    this.title = 'SERVİS FORMU',
    this.titleFontSize = 18,
    this.showCompanyInfo = true,
    this.companyName = '',
    this.companyAddress = '',
    this.companyPhone = '',
    this.companyEmail = '',
    this.companyWebsite = '',
    this.companyTaxNumber = '',
    this.companyInfoFontSize = 10,
  });

  factory HeaderSettingsModel.fromJson(Map<String, dynamic> json) {
    return HeaderSettingsModel(
      showLogo: json['showLogo'] ?? true,
      logoUrl: json['logoUrl'],
      logoPosition: json['logoPosition'] ?? 'left',
      logoSize: (json['logoSize'] ?? 80).toDouble(),
      showTitle: json['showTitle'] ?? true,
      title: json['title'] ?? 'SERVİS FORMU',
      titleFontSize: (json['titleFontSize'] ?? 18).toDouble(),
      showCompanyInfo: json['showCompanyInfo'] ?? true,
      companyName: json['companyName'] ?? '',
      companyAddress: json['companyAddress'] ?? '',
      companyPhone: json['companyPhone'] ?? '',
      companyEmail: json['companyEmail'] ?? '',
      companyWebsite: json['companyWebsite'] ?? '',
      companyTaxNumber: json['companyTaxNumber'] ?? '',
      companyInfoFontSize: (json['companyInfoFontSize'] ?? 10).toDouble(),
    );
  }
}
```

### ServiceInfoSettingsModel

```dart
class ServiceInfoSettingsModel {
  final double titleFontSize;
  final double infoFontSize;
  final bool showServiceNumber;
  final bool showServiceStatus;
  final bool showTechnician;
  final bool showServiceType;
  final bool showDates;

  ServiceInfoSettingsModel({
    this.titleFontSize = 14,
    this.infoFontSize = 10,
    this.showServiceNumber = true,
    this.showServiceStatus = true,
    this.showTechnician = true,
    this.showServiceType = true,
    this.showDates = true,
  });

  factory ServiceInfoSettingsModel.fromJson(Map<String, dynamic> json) {
    return ServiceInfoSettingsModel(
      titleFontSize: (json['titleFontSize'] ?? 14).toDouble(),
      infoFontSize: (json['infoFontSize'] ?? 10).toDouble(),
      showServiceNumber: json['showServiceNumber'] ?? true,
      showServiceStatus: json['showServiceStatus'] ?? true,
      showTechnician: json['showTechnician'] ?? true,
      showServiceType: json['showServiceType'] ?? true,
      showDates: json['showDates'] ?? true,
    );
  }
}
```

### PartsTableSettingsModel

```dart
class TableColumnModel {
  final String key;
  final String label;
  final bool show;
  final String align; // 'left', 'center', 'right'

  TableColumnModel({
    required this.key,
    required this.label,
    this.show = true,
    this.align = 'left',
  });

  factory TableColumnModel.fromJson(Map<String, dynamic> json) {
    return TableColumnModel(
      key: json['key'] ?? '',
      label: json['label'] ?? '',
      show: json['show'] ?? true,
      align: json['align'] ?? 'left',
    );
  }
}

class PartsTableSettingsModel {
  final bool show;
  final List<TableColumnModel> columns;
  final bool showRowNumber;

  PartsTableSettingsModel({
    this.show = true,
    this.columns = const [],
    this.showRowNumber = true,
  });

  factory PartsTableSettingsModel.fromJson(Map<String, dynamic> json) {
    return PartsTableSettingsModel(
      show: json['show'] ?? true,
      columns: (json['columns'] as List?)
          ?.map((e) => TableColumnModel.fromJson(e))
          .toList() ?? [],
      showRowNumber: json['showRowNumber'] ?? true,
    );
  }
}
```

### SignatureSettingsModel

```dart
class SignatureSettingsModel {
  final bool show;
  final bool showTechnician;
  final bool showCustomer;
  final String technicianLabel;
  final String customerLabel;
  final double fontSize;

  SignatureSettingsModel({
    this.show = true,
    this.showTechnician = true,
    this.showCustomer = true,
    this.technicianLabel = 'Teknisyen',
    this.customerLabel = 'Müşteri',
    this.fontSize = 10,
  });

  factory SignatureSettingsModel.fromJson(Map<String, dynamic> json) {
    return SignatureSettingsModel(
      show: json['show'] ?? true,
      showTechnician: json['showTechnician'] ?? true,
      showCustomer: json['showCustomer'] ?? true,
      technicianLabel: json['technicianLabel'] ?? 'Teknisyen',
      customerLabel: json['customerLabel'] ?? 'Müşteri',
      fontSize: (json['fontSize'] ?? 10).toDouble(),
    );
  }
}
```

### NotesSettingsModel

```dart
class NotesSettingsModel {
  final String footer;
  final double footerFontSize;
  final bool showFooterLogo;

  NotesSettingsModel({
    this.footer = 'Servis hizmeti için teşekkür ederiz.',
    this.footerFontSize = 10,
    this.showFooterLogo = false,
  });

  factory NotesSettingsModel.fromJson(Map<String, dynamic> json) {
    return NotesSettingsModel(
      footer: json['footer'] ?? 'Servis hizmeti için teşekkür ederiz.',
      footerFontSize: (json['footerFontSize'] ?? 10).toDouble(),
      showFooterLogo: json['showFooterLogo'] ?? false,
    );
  }
}
```

### TemplateDefaultsModel

```dart
class TemplateDefaultsModel {
  final int? estimatedDuration;
  final String? defaultLocation;
  final String? defaultTechnicianId;
  final String? serviceType;
  final String servicePriority; // 'low', 'medium', 'high', 'urgent'

  TemplateDefaultsModel({
    this.estimatedDuration,
    this.defaultLocation,
    this.defaultTechnicianId,
    this.serviceType,
    this.servicePriority = 'medium',
  });

  factory TemplateDefaultsModel.fromJson(Map<String, dynamic> json) {
    return TemplateDefaultsModel(
      estimatedDuration: json['estimated_duration'],
      defaultLocation: json['default_location'],
      defaultTechnicianId: json['default_technician_id'],
      serviceType: json['service_type'],
      servicePriority: json['service_priority'] ?? 'medium',
    );
  }
}
```

### PartItemModel

```dart
class PartItemModel {
  final String? id;
  final String? productId;
  final String name;
  final String? description;
  final int quantity;
  final String unit;
  final double unitPrice;
  final double? taxRate;
  final double? discountRate;
  final double? totalPrice;
  final String currency;

  PartItemModel({
    this.id,
    this.productId,
    required this.name,
    this.description,
    required this.quantity,
    this.unit = 'adet',
    required this.unitPrice,
    this.taxRate,
    this.discountRate,
    this.totalPrice,
    this.currency = 'TRY',
  });

  factory PartItemModel.fromJson(Map<String, dynamic> json) {
    return PartItemModel(
      id: json['id'],
      productId: json['product_id'],
      name: json['name'] ?? '',
      description: json['description'],
      quantity: json['quantity'] ?? 1,
      unit: json['unit'] ?? 'adet',
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      taxRate: json['tax_rate']?.toDouble(),
      discountRate: json['discount_rate']?.toDouble(),
      totalPrice: json['total_price']?.toDouble(),
      currency: json['currency'] ?? 'TRY',
    );
  }
}
```

### CompanyInfoModel

```dart
class CompanyInfoModel {
  final String? name;
  final String? address;
  final String? phone;
  final String? email;
  final String? website;
  final String? logoUrl;
  final String? taxNumber;

  CompanyInfoModel({
    this.name,
    this.address,
    this.phone,
    this.email,
    this.website,
    this.logoUrl,
    this.taxNumber,
  });

  factory CompanyInfoModel.fromJson(Map<String, dynamic> json) {
    return CompanyInfoModel(
      name: json['name'],
      address: json['address'],
      phone: json['phone'],
      email: json['email'],
      website: json['website'],
      logoUrl: json['logo_url'],
      taxNumber: json['tax_number'],
    );
  }
}
```

## Flutter'da Kullanım Örneği

### Şablonları Çekme

```dart
class ServiceTemplateRepository {
  final SupabaseClient supabase;

  ServiceTemplateRepository(this.supabase);

  Future<List<ServiceTemplateModel>> getTemplates() async {
    final response = await supabase.functions.invoke(
      'get-service-template',
      method: HttpMethod.get,
    );

    if (response.status != 200) {
      throw Exception('Failed to fetch templates');
    }

    final data = response.data;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Unknown error');
    }

    return (data['templates'] as List)
        .map((e) => ServiceTemplateModel.fromJson(e))
        .toList();
  }

  Future<ServiceTemplateModel> getTemplate(String templateId) async {
    final response = await supabase.functions.invoke(
      'get-service-template',
      method: HttpMethod.get,
      queryParameters: {'template_id': templateId},
    );

    if (response.status != 200) {
      throw Exception('Failed to fetch template');
    }

    final data = response.data;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Unknown error');
    }

    return ServiceTemplateModel.fromJson(data['template']);
  }
}
```

### PDF Oluşturma

```dart
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class ServicePdfGenerator {
  final ServiceTemplateModel template;
  final ServiceData serviceData;

  ServicePdfGenerator({
    required this.template,
    required this.serviceData,
  });

  Future<pw.Document> generate() async {
    final pdf = pw.Document();
    final schema = template.pdfSchema;

    pdf.addPage(
      pw.Page(
        pageFormat: _getPageFormat(schema.page.size),
        margin: schema.page.padding,
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              if (schema.header.showTitle || schema.header.showLogo)
                _buildHeader(schema.header),
              
              pw.SizedBox(height: 20),
              
              // Service Info
              _buildServiceInfo(schema.serviceInfo),
              
              pw.SizedBox(height: 20),
              
              // Parts Table
              if (schema.partsTable.show)
                _buildPartsTable(schema.partsTable),
              
              pw.Spacer(),
              
              // Signatures
              if (schema.signatures.show)
                _buildSignatures(schema.signatures),
              
              // Footer
              _buildFooter(schema.notes),
            ],
          );
        },
      ),
    );

    return pdf;
  }

  pw.Widget _buildHeader(HeaderSettingsModel header) {
    return pw.Row(
      mainAxisAlignment: _getAlignment(header.logoPosition),
      children: [
        if (header.showLogo && header.logoUrl != null)
          pw.Image(
            pw.MemoryImage(/* logo bytes */),
            width: header.logoSize,
          ),
        if (header.showTitle)
          pw.Text(
            header.title,
            style: pw.TextStyle(
              fontSize: header.titleFontSize,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
      ],
    );
  }

  // ... diğer builder metodları
}
```

## Offline Destek

Şablonları local olarak cache'lemek için:

```dart
class TemplateCache {
  static const String _cacheKey = 'service_templates_cache';
  
  Future<void> cacheTemplates(List<ServiceTemplateModel> templates) async {
    final prefs = await SharedPreferences.getInstance();
    final json = templates.map((t) => t.toJson()).toList();
    await prefs.setString(_cacheKey, jsonEncode(json));
  }
  
  Future<List<ServiceTemplateModel>?> getCachedTemplates() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_cacheKey);
    if (cached == null) return null;
    
    final list = jsonDecode(cached) as List;
    return list.map((e) => ServiceTemplateModel.fromJson(e)).toList();
  }
}
```

## Önemli Notlar

1. **Şablon Senkronizasyonu**: Web'de yapılan değişiklikler anında Supabase'e yansır. Flutter uygulaması her açılışta veya refresh'te güncel şablonları çekmelidir.

2. **Logo Handling**: Logo URL'leri Supabase Storage'dan gelir. Flutter'da bu URL'leri kullanarak logoları indirebilirsiniz.

3. **Offline Mode**: Şablonları local cache'te saklayarak offline durumda da PDF oluşturabilirsiniz.

4. **Font Handling**: PDF'te Türkçe karakterler için uygun font kullandığınızdan emin olun (örn: Roboto, Noto Sans).
