class CertificateModel {
  final String id;
  final String? verificationCode;
  final String? courseName;
  final String? authorizedSignatoryName;
  final String? authorizedSignatoryTitle;
  final int? eligibleProgress;
  final String? issuedAt;

  const CertificateModel({
    required this.id,
    this.verificationCode,
    this.courseName,
    this.authorizedSignatoryName,
    this.authorizedSignatoryTitle,
    this.eligibleProgress,
    this.issuedAt,
  });

  factory CertificateModel.fromJson(Map<String, dynamic> json) {
    return CertificateModel(
      id: json['id']?.toString() ?? '',
      verificationCode: json['verification_code'] as String? ??
          json['code'] as String?,
      courseName: json['course_name'] as String? ??
          json['course'] as String? ??
          (json['course'] is Map ? (json['course'] as Map<String, dynamic>)['title'] as String? : null),
      authorizedSignatoryName: json['authorized_signatory_name'] as String?,
      authorizedSignatoryTitle: json['authorized_signatory_title'] as String?,
      eligibleProgress: json['eligible_progress'] as int?,
      issuedAt: json['issued_at'] as String?,
    );
  }
}