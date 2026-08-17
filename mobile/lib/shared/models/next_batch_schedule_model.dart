class NextBatchScheduleModel {
  final String eyebrow;
  final String title;
  final String enrollmentStartDate;
  final String enrollmentEndDate;
  final String courseInfo;
  final String demoButtonLabel;
  final String demoUrl;
  final String courseUrl;

  const NextBatchScheduleModel({
    this.eyebrow = '',
    this.title = 'Upcoming practical batch schedule',
    this.enrollmentStartDate = 'September 10, 2026',
    this.enrollmentEndDate = 'September 24, 2026',
    this.courseInfo = '',
    this.demoButtonLabel = 'View Demo Class',
    this.demoUrl = '',
    this.courseUrl = '',
  });

  factory NextBatchScheduleModel.fromJson(Map<String, dynamic> json) {
    return NextBatchScheduleModel(
      eyebrow: json['eyebrow'] as String? ?? '',
      title: json['title'] as String? ?? 'Upcoming practical batch schedule',
      enrollmentStartDate: json['enrollment_start_date'] as String? ?? 'September 10, 2026',
      enrollmentEndDate: json['enrollment_end_date'] as String? ?? 'September 24, 2026',
      courseInfo: json['course_info'] as String? ?? '',
      demoButtonLabel: json['demo_button_label'] as String? ?? 'View Demo Class',
      demoUrl: json['demo_url'] as String? ?? '',
      courseUrl: json['course_url'] as String? ?? '',
    );
  }
}