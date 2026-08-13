import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/services/api_client.dart';
import '../../courses/services/course_service.dart';
import '../../profile/services/profile_service.dart';

class HomeDashboardState {
  final UserModel? user;
  final List<EnrolledCourseModel> enrolledCourses;
  final List<CertificateModel> certificates;
  final List<CourseModel> freeCourses;
  final bool isLoading;
  final String? error;

  const HomeDashboardState({
    this.user,
    this.enrolledCourses = const [],
    this.certificates = const [],
    this.freeCourses = const [],
    this.isLoading = false,
    this.error,
  });

  HomeDashboardState copyWith({
    UserModel? user,
    List<EnrolledCourseModel>? enrolledCourses,
    List<CertificateModel>? certificates,
    List<CourseModel>? freeCourses,
    bool? isLoading,
    String? error,
  }) {
    return HomeDashboardState(
      user: user ?? this.user,
      enrolledCourses: enrolledCourses ?? this.enrolledCourses,
      certificates: certificates ?? this.certificates,
      freeCourses: freeCourses ?? this.freeCourses,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class HomeDashboardNotifier extends StateNotifier<HomeDashboardState> {
  final ApiClient _api = ApiClient();
  final ProfileService _profileService = ProfileService();
  final CourseService _courseService = CourseService();

  HomeDashboardNotifier() : super(const HomeDashboardState());

  Future<void> fetchDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get(ApiConfig.profile);
      final data = response.data as Map<String, dynamic>;
      final responseData = data['data'] as Map<String, dynamic>? ?? data;
      final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
      final user = UserModel.fromJson(userData);

      final enrollmentsRaw = (userData['enrollments'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [];
      final progressRaw = (userData['progress'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          <Map<String, dynamic>>[];

      final processedIds = <int>{};
      final enrolledCourses = <EnrolledCourseModel>[];
      for (final enrollment in enrollmentsRaw) {
        final courseData = enrollment['course'] as Map<String, dynamic>?;
        if (courseData == null) continue;
        final courseId = courseData['id'] as int?;
        if (courseId == null || processedIds.contains(courseId)) continue;
        processedIds.add(courseId);
        enrolledCourses.add(EnrolledCourseModel.fromJson(enrollment, allProgress: progressRaw));
      }

      final certs = await _profileService.fetchCertificates();

      List<CourseModel> freeCourses = [];
      try {
        final freeResult = await _courseService.fetchCourses(page: 1, free: true, perPage: 8);
        freeCourses = freeResult.items;
      } catch (_) {}

      state = HomeDashboardState(
        user: user,
        enrolledCourses: enrolledCourses,
        certificates: certs,
        freeCourses: freeCourses,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }
}

final homeDashboardProvider = StateNotifierProvider<HomeDashboardNotifier, HomeDashboardState>((ref) {
  return HomeDashboardNotifier();
});