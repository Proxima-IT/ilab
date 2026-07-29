import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/course_model.dart';
import '../services/course_service.dart';

class CourseListState {
  final List<CourseModel> courses;
  final bool isLoading;
  final String? error;

  const CourseListState({
    this.courses = const [],
    this.isLoading = false,
    this.error,
  });

  CourseListState copyWith({List<CourseModel>? courses, bool? isLoading, String? error}) {
    return CourseListState(
      courses: courses ?? this.courses,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CourseListNotifier extends StateNotifier<CourseListState> {
  final CourseService _service = CourseService();

  CourseListNotifier() : super(const CourseListState());

  Future<void> fetchCourses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final courses = await _service.fetchCourses();
      state = CourseListState(courses: courses);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final courseListProvider = StateNotifierProvider<CourseListNotifier, CourseListState>((ref) {
  return CourseListNotifier();
});

class CourseDetailState {
  final CourseDetailModel? detail;
  final bool isLoading;
  final String? error;

  const CourseDetailState({this.detail, this.isLoading = false, this.error});

  CourseDetailState copyWith({CourseDetailModel? detail, bool? isLoading, String? error}) {
    return CourseDetailState(
      detail: detail ?? this.detail,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CourseDetailNotifier extends StateNotifier<CourseDetailState> {
  final CourseService _service = CourseService();

  CourseDetailNotifier(String slug) : super(const CourseDetailState(isLoading: true)) {
    fetchDetail(slug);
  }

  Future<void> fetchDetail(String slug) async {
    state = const CourseDetailState(isLoading: true);
    try {
      final detail = await _service.fetchCourseDetail(slug);
      state = CourseDetailState(detail: detail);
    } catch (e) {
      state = CourseDetailState(error: e.toString());
    }
  }
}

final courseDetailProvider = StateNotifierProvider.family<CourseDetailNotifier, CourseDetailState, String>((ref, slug) {
  return CourseDetailNotifier(slug);
});