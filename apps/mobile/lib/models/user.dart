class User {
  final String id;
  final String email;
  final String? fullName;
  final String? companyId;

  User({
    required this.id,
    required this.email,
    this.fullName,
    this.companyId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'],
      companyId: json['company_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'company_id': companyId,
    };
  }
}
