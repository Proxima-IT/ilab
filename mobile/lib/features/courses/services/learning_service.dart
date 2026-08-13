import '../../../shared/services/api_client.dart';

class PlayerLesson {
  final int id;
  final String title;
  final String type;
  final int? duration;
  final int? order;
  final bool? isAvailable;
  final bool? isCompleted;
  final int? watchSeconds;
  final String? content;
  final String? videoEmbedUrl;
  final List<LessonResource> resources;
  final List<LessonNote> notes;
  final List<LessonQuestion> questions;

  const PlayerLesson({
    required this.id,
    required this.title,
    this.type = 'video',
    this.duration,
    this.order,
    this.isAvailable,
    this.isCompleted,
    this.watchSeconds,
    this.content,
    this.videoEmbedUrl,
    this.resources = const [],
    this.notes = const [],
    this.questions = const [],
  });

  factory PlayerLesson.fromJson(Map<String, dynamic> json) {
    return PlayerLesson(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      type: json['type'] as String? ?? 'video',
      duration: json['duration'] as int?,
      order: json['order'] as int?,
      isAvailable: json['is_available'] as bool?,
      isCompleted: json['is_completed'] as bool?,
      watchSeconds: json['watch_seconds'] as int?,
      content: json['content'] as String?,
      videoEmbedUrl: json['video_embed_url'] as String?,
      resources: (json['resources'] as List<dynamic>?)
              ?.map((e) => LessonResource.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      notes: (json['notes'] as List<dynamic>?)
              ?.map((e) => LessonNote.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      questions: (json['questions'] as List<dynamic>?)
              ?.map((e) => LessonQuestion.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class PlayerSection {
  final int id;
  final String title;
  final int order;
  final List<PlayerLesson> lessons;

  const PlayerSection({
    required this.id,
    required this.title,
    required this.order,
    this.lessons = const [],
  });

  factory PlayerSection.fromJson(Map<String, dynamic> json) {
    return PlayerSection(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((e) => PlayerLesson.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class LessonResource {
  final int id;
  final String title;
  final String url;
  final String type;
  final String? fileSize;

  const LessonResource({
    required this.id,
    required this.title,
    required this.url,
    required this.type,
    this.fileSize,
  });

  factory LessonResource.fromJson(Map<String, dynamic> json) {
    return LessonResource(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      url: json['url'] as String? ?? '',
      type: json['type'] as String? ?? '',
      fileSize: json['file_size'] as String?,
    );
  }
}

class LessonNote {
  final int id;
  final String note;
  final int timestampSeconds;
  final String? createdAt;

  const LessonNote({
    required this.id,
    required this.note,
    required this.timestampSeconds,
    this.createdAt,
  });

  factory LessonNote.fromJson(Map<String, dynamic> json) {
    return LessonNote(
      id: json['id'] as int? ?? 0,
      note: json['note'] as String? ?? '',
      timestampSeconds: json['timestamp_seconds'] as int? ?? 0,
      createdAt: json['created_at'] as String?,
    );
  }
}

class LessonAnswer {
  final int id;
  final String answer;
  final bool isInstructorAnswer;
  final String? createdAt;
  final LessonAnswerUser? user;

  const LessonAnswer({
    required this.id,
    required this.answer,
    this.isInstructorAnswer = false,
    this.createdAt,
    this.user,
  });

  factory LessonAnswer.fromJson(Map<String, dynamic> json) {
    return LessonAnswer(
      id: json['id'] as int? ?? 0,
      answer: json['answer'] as String? ?? '',
      isInstructorAnswer: json['is_instructor_answer'] as bool? ?? false,
      createdAt: json['created_at'] as String?,
      user: json['user'] != null
          ? LessonAnswerUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}

class LessonAnswerUser {
  final int id;
  final String name;
  final String? email;
  final String? avatar;
  final String? role;

  const LessonAnswerUser({
    required this.id,
    required this.name,
    this.email,
    this.avatar,
    this.role,
  });

  factory LessonAnswerUser.fromJson(Map<String, dynamic> json) {
    return LessonAnswerUser(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      avatar: json['avatar'] as String?,
      role: json['role'] as String?,
    );
  }
}

class LessonQuestion {
  final int id;
  final String question;
  final String status;
  final String? createdAt;
  final LessonQuestionUser? user;
  final List<LessonAnswer> answers;

  const LessonQuestion({
    required this.id,
    required this.question,
    this.status = 'open',
    this.createdAt,
    this.user,
    this.answers = const [],
  });

  factory LessonQuestion.fromJson(Map<String, dynamic> json) {
    return LessonQuestion(
      id: json['id'] as int? ?? 0,
      question: json['question'] as String? ?? '',
      status: json['status'] as String? ?? 'open',
      createdAt: json['created_at'] as String?,
      user: json['user'] != null
          ? LessonQuestionUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      answers: (json['answers'] as List<dynamic>?)
              ?.map((e) => LessonAnswer.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class LessonQuestionUser {
  final int id;
  final String name;
  final String? email;
  final String? avatar;

  const LessonQuestionUser({
    required this.id,
    required this.name,
    this.email,
    this.avatar,
  });

  factory LessonQuestionUser.fromJson(Map<String, dynamic> json) {
    return LessonQuestionUser(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      avatar: json['avatar'] as String?,
    );
  }
}

class PlayerData {
  final PlayerCourse course;
  final PlayerLesson lesson;
  final PlayerWatermark watermark;

  const PlayerData({
    required this.course,
    required this.lesson,
    required this.watermark,
  });

  factory PlayerData.fromJson(Map<String, dynamic> json) {
    return PlayerData(
      course: PlayerCourse.fromJson(json['course'] as Map<String, dynamic>? ?? {}),
      lesson: PlayerLesson.fromJson(json['lesson'] as Map<String, dynamic>? ?? {}),
      watermark: PlayerWatermark.fromJson(json['watermark'] as Map<String, dynamic>? ?? {}),
    );
  }
}

class PlayerCourse {
  final int id;
  final String title;
  final String slug;
  final String? description;
  final PlayerCourseInstructor? instructor;
  final List<PlayerSection> sections;

  const PlayerCourse({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    this.instructor,
    this.sections = const [],
  });

  factory PlayerCourse.fromJson(Map<String, dynamic> json) {
    return PlayerCourse(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      instructor: json['instructor'] != null
          ? PlayerCourseInstructor.fromJson(json['instructor'] as Map<String, dynamic>)
          : null,
      sections: (json['sections'] as List<dynamic>?)
              ?.map((e) => PlayerSection.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class PlayerCourseInstructor {
  final int id;
  final String name;
  final String? avatar;

  const PlayerCourseInstructor({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory PlayerCourseInstructor.fromJson(Map<String, dynamic> json) {
    return PlayerCourseInstructor(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      avatar: json['avatar'] as String?,
    );
  }
}

class PlayerWatermark {
  final String? email;
  final String? name;

  const PlayerWatermark({this.email, this.name});

  factory PlayerWatermark.fromJson(Map<String, dynamic> json) {
    return PlayerWatermark(
      email: json['email'] as String?,
      name: json['name'] as String?,
    );
  }
}

class LearningService {
  final ApiClient _api = ApiClient();

  Future<PlayerData> getPlayer(String courseSlug, String lessonId) async {
    final response = await _api.get('/learn/courses/$courseSlug/player/$lessonId');
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    return PlayerData.fromJson(responseData);
  }

  Future<void> syncWatchTime(String lessonId, int watchSeconds) async {
    await _api.put('/learn/lessons/$lessonId/time', data: {
      'watch_seconds': watchSeconds,
    });
  }

  Future<void> markComplete(String lessonId) async {
    await _api.post('/learn/lessons/$lessonId/complete');
  }

  Future<LessonNote> addNote(String lessonId, String note, int timestampSeconds) async {
    final response = await _api.post('/learn/lessons/$lessonId/notes', data: {
      'note': note,
      'timestamp_seconds': timestampSeconds,
    });
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    return LessonNote.fromJson(responseData);
  }

  Future<void> deleteNote(String lessonId, String noteId) async {
    await _api.delete('/learn/lessons/$lessonId/notes/$noteId');
  }

  Future<LessonQuestion> addQuestion(String lessonId, String question) async {
    final response = await _api.post('/learn/lessons/$lessonId/questions', data: {
      'question': question,
    });
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    return LessonQuestion.fromJson(responseData);
  }
}