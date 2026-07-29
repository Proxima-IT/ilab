import '../../config/api_config.dart';

class CourseModel {
  final int id;
  final String title;
  final String slug;
  final String? description;
  final String? thumbnailUrl;
  final String? category;
  final String? level;
  final String? mode;
  final double price;
  final double? discountPrice;
  final int? lessonCount;
  final int? enrollmentCount;
  final double? rating;
  final bool isFree;
  final bool isPublished;
  final String? createdAt;
  final String? updatedAt;
  final String? language;
  final String? introVideo;
  final List<String> tags;

  const CourseModel({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    this.thumbnailUrl,
    this.category,
    this.level,
    this.mode,
    this.price = 0,
    this.discountPrice,
    this.lessonCount,
    this.enrollmentCount,
    this.rating,
    this.isFree = false,
    this.isPublished = true,
    this.createdAt,
    this.updatedAt,
    this.language,
    this.introVideo,
    this.tags = const [],
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    final rawCategory = json['category'];
    final categoryValue = rawCategory is Map
        ? rawCategory['name'] as String?
        : rawCategory as String?;

    final rawPrice = json['price'];
    final priceValue = rawPrice is num
        ? rawPrice.toDouble()
        : double.tryParse(rawPrice?.toString() ?? '') ?? 0;

    final rawDiscount = json['discount_price'];
    final discountValue = rawDiscount is num
        ? rawDiscount.toDouble()
        : rawDiscount != null
            ? double.tryParse(rawDiscount.toString())
            : null;

    final rawTags = json['tags'];
    final tagsList = rawTags is List ? rawTags.map((e) => e.toString()).toList() : <String>[];

    return CourseModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      thumbnailUrl: ApiConfig.resolveImageUrl(
          json['thumbnail'] as String? ??
              json['thumbnail_url'] as String? ??
              json['cover'] as String?),
      category: categoryValue ?? json['category_name'] as String?,
      level: json['level'] as String?,
      mode: json['type'] as String? ?? json['mode'] as String?,
      price: priceValue,
      discountPrice: discountValue,
      lessonCount: json['lesson_count'] as int?,
      enrollmentCount: json['enrollments_count'] as int? ??
          json['enrollment_count'] as int?,
      rating: (json['rating'] as num?)?.toDouble(),
      isFree: priceValue == 0,
      isPublished: json['status'] == 'published' ||
          json['is_published'] == true,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      language: json['language'] as String?,
      introVideo: json['intro_video'] as String?,
      tags: tagsList,
    );
  }

  double get effectivePrice => discountPrice ?? price;
  bool get hasDiscount => discountPrice != null && discountPrice! < price;
}

class CourseSection {
  final int id;
  final String title;
  final int order;
  final List<CourseLesson> lessons;

  const CourseSection({
    required this.id,
    required this.title,
    required this.order,
    this.lessons = const [],
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((e) => CourseLesson.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class CourseLesson {
  final int id;
  final String title;
  final int order;
  final String? videoUrl;
  final int? durationSeconds;
  final bool isFree;
  final String type;

  const CourseLesson({
    required this.id,
    required this.title,
    required this.order,
    this.videoUrl,
    this.durationSeconds,
    this.isFree = false,
    this.type = 'video',
  });

  String get durationFormatted {
    if (durationSeconds == null) return '';
    final minutes = durationSeconds! ~/ 60;
    if (minutes < 60) return '${minutes}min';
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? '${hours}h ${remainingMinutes}min' : '${hours}h';
  }

  factory CourseLesson.fromJson(Map<String, dynamic> json) {
    return CourseLesson(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      videoUrl: json['video_url'] as String?,
      durationSeconds: json['duration_seconds'] as int?,
      isFree: json['is_free'] as bool? ?? false,
      type: json['type'] as String? ?? 'video',
    );
  }
}

class CourseDetailModel {
  final CourseModel course;
  final List<CourseSection> sections;
  final List<String> learningOutcomes;
  final List<String> prerequisites;
  final List<String> tags;
  final String? instructor;
  final String? instructorAvatar;
  final String? instructorBio;
  final int instructorCoursesCount;
  final int instructorStudentsCount;
  final String? introVideo;
  final int totalHours;
  final int totalLessons;

  const CourseDetailModel({
    required this.course,
    this.sections = const [],
    this.learningOutcomes = const [],
    this.prerequisites = const [],
    this.tags = const [],
    this.instructor,
    this.instructorAvatar,
    this.instructorBio,
    this.instructorCoursesCount = 0,
    this.instructorStudentsCount = 0,
    this.introVideo,
    this.totalHours = 0,
    this.totalLessons = 0,
  });

  factory CourseDetailModel.fromJson(Map<String, dynamic> json) {
    final course = CourseModel.fromJson(json);

    final sections = (json['sections'] as List<dynamic>?)
            ?.map((e) => CourseSection.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final outcomes = (json['learning_outcomes'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final prerequisites = (json['prerequisites'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final tags = (json['tags'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final instructorData = json['instructor'] as Map<String, dynamic>?;
    final instructor = instructorData?['name'] as String?;
    final instructorAvatar = instructorData?['avatar'] as String?;
    final instructorBio = instructorData?['bio'] as String?;

    final instructorStats = json['instructor_stats'] as Map<String, dynamic>?;
    final instructorCoursesCount = (instructorStats?['courses_count'] as num?)?.toInt() ?? 0;
    final instructorStudentsCount = (instructorStats?['students_count'] as num?)?.toInt() ?? 0;

    final introVideo = json['intro_video'] as String? ?? course.introVideo;

    int totalLessons = 0;
    int totalDuration = 0;
    for (final section in sections) {
      totalLessons += section.lessons.length;
      for (final lesson in section.lessons) {
        totalDuration += lesson.durationSeconds ?? 0;
      }
    }
    final totalHours = totalDuration ~/ 3600;

    return CourseDetailModel(
      course: course,
      sections: sections,
      learningOutcomes: outcomes,
      prerequisites: prerequisites,
      tags: tags,
      instructor: instructor,
      instructorAvatar: instructorAvatar != null
          ? ApiConfig.resolveImageUrl(instructorAvatar)
          : null,
      instructorBio: instructorBio,
      instructorCoursesCount: instructorCoursesCount,
      instructorStudentsCount: instructorStudentsCount,
      introVideo: introVideo,
      totalHours: totalHours,
      totalLessons: totalLessons,
    );
  }
}