import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/learning_service.dart';

class LearningPlayerState {
  final PlayerData? playerData;
  final bool isLoading;
  final String? error;
  final int watchSeconds;
  final bool isPlaying;
  final bool isTracking;
  final bool isSaving;
  final String activeTab;
  final Set<int> expandedModules;
  final String noteText;
  final String questionText;
  final int questionPage;
  final int questionsPerPage;

  const LearningPlayerState({
    this.playerData,
    this.isLoading = false,
    this.error,
    this.watchSeconds = 0,
    this.isPlaying = false,
    this.isTracking = false,
    this.isSaving = false,
    this.activeTab = 'overview',
    this.expandedModules = const {},
    this.noteText = '',
    this.questionText = '',
    this.questionPage = 1,
    this.questionsPerPage = 5,
  });

  LearningPlayerState copyWith({
    PlayerData? playerData,
    bool? isLoading,
    String? error,
    int? watchSeconds,
    bool? isPlaying,
    bool? isTracking,
    bool? isSaving,
    String? activeTab,
    Set<int>? expandedModules,
    String? noteText,
    String? questionText,
    int? questionPage,
    int? questionsPerPage,
  }) {
    return LearningPlayerState(
      playerData: playerData ?? this.playerData,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      watchSeconds: watchSeconds ?? this.watchSeconds,
      isPlaying: isPlaying ?? this.isPlaying,
      isTracking: isTracking ?? this.isTracking,
      isSaving: isSaving ?? this.isSaving,
      activeTab: activeTab ?? this.activeTab,
      expandedModules: expandedModules ?? this.expandedModules,
      noteText: noteText ?? this.noteText,
      questionText: questionText ?? this.questionText,
      questionPage: questionPage ?? this.questionPage,
      questionsPerPage: questionsPerPage ?? this.questionsPerPage,
    );
  }

  int get duration => playerData?.lesson.duration ?? 0;
  int get watchPercent => duration > 0 ? (watchSeconds * 100 ~/ duration).clamp(0, 100) : 0;
  String get currentLessonId => playerData?.lesson.id.toString() ?? '';
  List<PlayerLesson> get allLessons =>
      playerData?.course.sections.expand((s) => s.lessons).toList() ?? [];
  int get currentIndex => allLessons.indexWhere((l) => l.id.toString() == currentLessonId);
  PlayerLesson? get previousLesson => currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  PlayerLesson? get nextLesson =>
      currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  List<LessonQuestion> get questions => playerData?.lesson.questions ?? [];
  int get totalQuestionPages => (questions.isNotEmpty)
      ? ((questions.length - 1) ~/ questionsPerPage) + 1
      : 1;
  List<LessonQuestion> get visibleQuestions {
    final start = (questionPage - 1) * questionsPerPage;
    return questions.skip(start).take(questionsPerPage).toList();
  }
}

class LearningPlayerNotifier extends StateNotifier<LearningPlayerState> {
  final LearningService _service = LearningService();
  final String courseSlug;
  String currentLessonId;

  LearningPlayerNotifier({
    required this.courseSlug,
    required String lessonId,
  }) : currentLessonId = lessonId,
       super(const LearningPlayerState(isLoading: true)) {
    loadPlayer();
  }

  Future<void> loadPlayer() async {
    if (courseSlug.isEmpty || currentLessonId.isEmpty) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _service.getPlayer(courseSlug, currentLessonId);
      final expandedIds = data.course.sections.map((s) => s.id).toSet();
      state = LearningPlayerState(
        playerData: data,
        watchSeconds: data.lesson.watchSeconds ?? 0,
        expandedModules: expandedIds,
        questionPage: 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void setWatchSeconds(int seconds) {
    if (state.duration > 0) {
      seconds = seconds > state.duration ? state.duration : seconds;
    }
    state = state.copyWith(watchSeconds: seconds);
  }

  void setIsPlaying(bool playing) {
    state = state.copyWith(isPlaying: playing);
  }

  void setIsTracking(bool tracking) {
    state = state.copyWith(isTracking: tracking);
  }

  void setIsSaving(bool saving) {
    state = state.copyWith(isSaving: saving);
  }

  void setActiveTab(String tab) {
    state = state.copyWith(activeTab: tab);
  }

  void setNoteText(String text) {
    state = state.copyWith(noteText: text);
  }

  void setQuestionText(String text) {
    state = state.copyWith(questionText: text);
  }

  void setQuestionPage(int page) {
    state = state.copyWith(questionPage: page);
  }

  void toggleModule(int sectionId) {
    final modules = Set<int>.from(state.expandedModules);
    if (modules.contains(sectionId)) {
      modules.remove(sectionId);
    } else {
      modules.add(sectionId);
    }
    state = state.copyWith(expandedModules: modules);
  }

  Future<void> syncWatchTime() async {
    if (state.watchSeconds <= 0) return;
    try {
      await _service.syncWatchTime(currentLessonId, state.watchSeconds);
    } catch (_) {}
  }

  Future<void> markComplete() async {
    state = state.copyWith(isSaving: true);
    try {
      await _service.syncWatchTime(currentLessonId, state.watchSeconds);
      await _service.markComplete(currentLessonId);
      await loadPlayer();
    } finally {
      state = state.copyWith(isSaving: false);
    }
  }

  Future<void> saveNote() async {
    if (state.noteText.trim().isEmpty) return;
    state = state.copyWith(isSaving: true);
    try {
      final note = await _service.addNote(
        currentLessonId,
        state.noteText.trim(),
        state.watchSeconds,
      );
      final current = state.playerData;
      if (current != null) {
        final updatedLesson = PlayerLesson(
          id: current.lesson.id,
          title: current.lesson.title,
          type: current.lesson.type,
          duration: current.lesson.duration,
          order: current.lesson.order,
          isAvailable: current.lesson.isAvailable,
          isCompleted: current.lesson.isCompleted,
          watchSeconds: current.lesson.watchSeconds,
          content: current.lesson.content,
          videoEmbedUrl: current.lesson.videoEmbedUrl,
          resources: current.lesson.resources,
          notes: [...current.lesson.notes, note],
          questions: current.lesson.questions,
        );
        final updatedData = PlayerData(
          course: current.course,
          lesson: updatedLesson,
          watermark: current.watermark,
        );
        state = state.copyWith(playerData: updatedData, noteText: '');
      }
    } finally {
      state = state.copyWith(isSaving: false);
    }
  }

  Future<void> deleteNote(int noteId) async {
    try {
      await _service.deleteNote(currentLessonId, noteId.toString());
      final current = state.playerData;
      if (current != null) {
        final updatedLesson = PlayerLesson(
          id: current.lesson.id,
          title: current.lesson.title,
          type: current.lesson.type,
          duration: current.lesson.duration,
          order: current.lesson.order,
          isAvailable: current.lesson.isAvailable,
          isCompleted: current.lesson.isCompleted,
          watchSeconds: current.lesson.watchSeconds,
          content: current.lesson.content,
          videoEmbedUrl: current.lesson.videoEmbedUrl,
          resources: current.lesson.resources,
          notes: current.lesson.notes.where((n) => n.id != noteId).toList(),
          questions: current.lesson.questions,
        );
        final updatedData = PlayerData(
          course: current.course,
          lesson: updatedLesson,
          watermark: current.watermark,
        );
        state = state.copyWith(playerData: updatedData);
      }
    } catch (_) {}
  }

  Future<void> askQuestion() async {
    if (state.questionText.trim().isEmpty) return;
    state = state.copyWith(isSaving: true);
    try {
      final question = await _service.addQuestion(
        currentLessonId,
        state.questionText.trim(),
      );
      final current = state.playerData;
      if (current != null) {
        final updatedLesson = PlayerLesson(
          id: current.lesson.id,
          title: current.lesson.title,
          type: current.lesson.type,
          duration: current.lesson.duration,
          order: current.lesson.order,
          isAvailable: current.lesson.isAvailable,
          isCompleted: current.lesson.isCompleted,
          watchSeconds: current.lesson.watchSeconds,
          content: current.lesson.content,
          videoEmbedUrl: current.lesson.videoEmbedUrl,
          resources: current.lesson.resources,
          notes: current.lesson.notes,
          questions: [question, ...current.lesson.questions],
        );
        final updatedData = PlayerData(
          course: current.course,
          lesson: updatedLesson,
          watermark: current.watermark,
        );
        state = state.copyWith(playerData: updatedData, questionText: '', questionPage: 1);
      }
    } finally {
      state = state.copyWith(isSaving: false);
    }
  }

  Future<void> navigateToLesson(String lessonId) async {
    currentLessonId = lessonId;
    state = state.copyWith(
      watchSeconds: 0,
      isPlaying: false,
      isTracking: false,
      activeTab: 'overview',
      questionPage: 1,
    );
    await loadPlayer();
  }
}

final learningPlayerProvider = StateNotifierProvider.family<LearningPlayerNotifier, LearningPlayerState, Map<String, String>>(
  (ref, args) {
    return LearningPlayerNotifier(
      courseSlug: args['slug'] ?? '',
      lessonId: args['lessonId'] ?? '',
    );
  },
);