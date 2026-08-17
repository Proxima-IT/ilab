import 'course_model.dart';

class EnrolledCourseModel {
  final int id;
  final String enrollmentId;
  final String status;
  final CourseModel course;
  final double progress;
  final int completedLessons;
  final int totalLessons;
  final double totalHours;
  final String? firstLessonId;

  const EnrolledCourseModel({
    required this.id,
    required this.enrollmentId,
    required this.status,
    required this.course,
    required this.progress,
    required this.completedLessons,
    required this.totalLessons,
    required this.totalHours,
    this.firstLessonId,
  });

  factory EnrolledCourseModel.fromJson(Map<String, dynamic> json, {List<Map<String, dynamic>>? allProgress}) {
    final courseData = json['course'] as Map<String, dynamic>? ?? {};
    final course = CourseModel.fromJson(courseData);

    final sections = (courseData['sections'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];
    final lessons = sections.expand((s) {
      return (s['lessons'] as List<dynamic>?)
              ?.map((l) => l as Map<String, dynamic>)
              .toList() ??
          [];
    }).toList();

    final totalLessons = lessons.length;
    final courseIdStr = course.id.toString();
    final lessonIds = lessons.map((l) => l['id'].toString()).toSet();

    final completedLessons = (allProgress ?? <Map<String, dynamic>>[])
        .where((p) {
          final progLessonId = p['lesson_id'];
          final lessonSection = p['lesson'] as Map<String, dynamic>?;
          final section = lessonSection?['section'] as Map<String, dynamic>?;
          final progressCourseId = section?['course_id'];
          return _isTruthy(p['is_completed']) &&
              lessonIds.contains(progLessonId.toString()) &&
              progressCourseId?.toString() == courseIdStr;
        })
        .length;

    final progress = totalLessons > 0
        ? ((completedLessons / totalLessons) * 100).roundToDouble()
        : 0.0;

    final totalSeconds = lessons.fold<int>(0, (sum, l) {
      final duration = l['duration'];
      return sum + (duration is num ? duration.toInt() : 0);
    });
    final totalHours = (totalSeconds / 3600 * 10).roundToDouble() / 10;

    final firstLesson = lessons.isNotEmpty ? lessons.first : null;
    final firstLessonId = firstLesson?['id'].toString();

    return EnrolledCourseModel(
      id: course.id,
      enrollmentId: json['id']?.toString() ?? '',
      status: json['status'] as String? ?? 'active',
      course: course,
      progress: progress,
      completedLessons: completedLessons,
      totalLessons: totalLessons,
      totalHours: totalHours,
      firstLessonId: firstLessonId,
    );
  }
}

bool _isTruthy(dynamic value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  return false;
}