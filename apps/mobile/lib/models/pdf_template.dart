class PdfTemplate {
  final String id;
  final String name;
  final String? description;
  final String type;
  final String? locale;
  final Map<String, dynamic>? schemaJson;
  final int version;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? companyId;
  final String? createdBy;

  PdfTemplate({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    this.locale,
    this.schemaJson,
    required this.version,
    required this.isDefault,
    required this.createdAt,
    required this.updatedAt,
    this.companyId,
    this.createdBy,
  });

  factory PdfTemplate.fromJson(Map<String, dynamic> json) {
    return PdfTemplate(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      type: json['type'] ?? '',
      locale: json['locale'],
      schemaJson: json['schema_json'] != null
          ? Map<String, dynamic>.from(json['schema_json'])
          : null,
      version: json['version'] ?? 1,
      isDefault: json['is_default'] ?? false,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'],
      createdBy: json['created_by'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'type': type,
      'locale': locale,
      'schema_json': schemaJson,
      'version': version,
      'is_default': isDefault,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
      'created_by': createdBy,
    };
  }
}
