class CertificateModel {
  final String id;
  final String? verificationCode;
  final String? courseName;
  final String? authorizedSignatoryName;
  final String? authorizedSignatoryTitle;
  final int? eligibleProgress;
  final String? issuedAt;
  final String? userName;
  final String? courseInstructorName;

  const CertificateModel({
    required this.id,
    this.verificationCode,
    this.courseName,
    this.authorizedSignatoryName,
    this.authorizedSignatoryTitle,
    this.eligibleProgress,
    this.issuedAt,
    this.userName,
    this.courseInstructorName,
  });

  factory CertificateModel.fromJson(Map<String, dynamic> json) {
    String? extractUserName(Map<String, dynamic> json) {
      if (json['user'] is Map) {
        return (json['user'] as Map<String, dynamic>)['name'] as String?;
      }
      if (json['user_name'] is String) return json['user_name'] as String;
      return null;
    }

    String? extractCourseInstructor(Map<String, dynamic> json) {
      if (json['course'] is Map) {
        final course = json['course'] as Map<String, dynamic>;
        if (course['instructor'] is Map) {
          return (course['instructor'] as Map<String, dynamic>)['name'] as String?;
        }
      }
      if (json['course_instructor'] is String) return json['course_instructor'] as String;
      return null;
    }

    return CertificateModel(
      id: json['id']?.toString() ?? '',
      verificationCode: json['verification_code'] as String? ??
          json['code'] as String?,
      courseName: json['course_name'] as String? ??
          (json['course'] is Map ? (json['course'] as Map<String, dynamic>)['title'] as String? : null),
      authorizedSignatoryName: json['authorized_signatory_name'] as String?,
      authorizedSignatoryTitle: json['authorized_signatory_title'] as String?,
      eligibleProgress: json['eligible_progress'] as int?,
      issuedAt: json['issued_at'] as String?,
      userName: extractUserName(json),
      courseInstructorName: extractCourseInstructor(json),
    );
  }
}