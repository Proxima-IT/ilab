import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/models/next_batch_schedule_model.dart';
import '../../../shared/services/api_client.dart';
import '../../courses/services/course_service.dart';
import '../../profile/services/profile_service.dart';

class HomeDashboardState {
  final UserModel? user;
  final List<EnrolledCourseModel> enrolledCourses;
  final List<CertificateModel> certificates;
  final List<CourseModel> courses;
  final List<CourseModel> freeCourses;
  final NextBatchScheduleModel? nextBatchSchedule;
  final bool isLoading;
  final String? error;

  const HomeDashboardState({
    this.user,
    this.enrolledCourses = const [],
    this.certificates = const [],
    this.courses = const [],
    this.freeCourses = const [],
    this.nextBatchSchedule,
    this.isLoading = false,
    this.error,
  });

  HomeDashboardState copyWith({
    UserModel? user,
    List<EnrolledCourseModel>? enrolledCourses,
    List<CertificateModel>? certificates,
    List<CourseModel>? courses,
    List<CourseModel>? freeCourses,
    NextBatchScheduleModel? nextBatchSchedule,
    bool? isLoading,
    String? error,
  }) {
    return HomeDashboardState(
      user: user ?? this.user,
      enrolledCourses: enrolledCourses ?? this.enrolledCourses,
      certificates: certificates ?? this.certificates,
      courses: courses ?? this.courses,
      freeCourses: freeCourses ?? this.freeCourses,
      nextBatchSchedule: nextBatchSchedule ?? this.nextBatchSchedule,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class HomeDashboardNotifier extends StateNotifier<HomeDashboardState> {
  final ApiClient _api = ApiClient();
  final ProfileService _profileService = ProfileService();
  final CourseService _courseService = CourseService();
  bool _isFetching = false;

  HomeDashboardNotifier() : super(const HomeDashboardState());

  Future<void> fetchDashboard() async {
    debugPrint('🔍 fetchDashboard: START');
    if (_isFetching) {
      debugPrint('🔍 fetchDashboard: Already fetching, skipping');
      return;
    }
    _isFetching = true;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get(ApiConfig.profile);
      final data = response.data as Map<String, dynamic>;
      final responseData = data['data'] as Map<String, dynamic>? ?? data;
      final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
      final user = UserModel.fromJson(userData);
      debugPrint('🔍 fetchDashboard: Profile fetch SUCCESS');

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

      List<CertificateModel> certs = [];
      try {
        certs = await _profileService.fetchCertificates();
        debugPrint('🔍 fetchDashboard: Certificates fetch SUCCESS');
      } catch (e) {
        debugPrint('🔍 fetchDashboard: ERROR at certificates fetch - $e');
      }

      List<CourseModel> courses = [];
      try {
        final result = await _courseService.fetchCourses(page: 1, perPage: 3);
        courses = result.items;
        debugPrint('🔍 fetchDashboard: Courses fetch SUCCESS');
      } catch (e) {
        debugPrint('🔍 fetchDashboard: ERROR at courses fetch - $e');
      }

      List<CourseModel> freeCourses = [];
      try {
        final freeResult = await _courseService.fetchCourses(page: 1, free: true, perPage: 8);
        freeCourses = freeResult.items;
        debugPrint('🔍 fetchDashboard: Free courses fetch SUCCESS');
      } catch (e) {
        debugPrint('🔍 fetchDashboard: ERROR at free courses fetch - $e');
      }

      NextBatchScheduleModel? nextBatchSchedule;
      try {
        final settingsResponse = await _api.get(ApiConfig.websiteSettings);
        final settingsData = settingsResponse.data as Map<String, dynamic>;
        final data = settingsData['data'] as Map<String, dynamic>? ?? settingsData;
        final scheduleData = data['next_batch_schedule'] as Map<String, dynamic>?;
        if (scheduleData != null) {
          nextBatchSchedule = NextBatchScheduleModel.fromJson(scheduleData);
        }
        debugPrint('🔍 fetchDashboard: Website settings fetch SUCCESS');
      } catch (e) {
        debugPrint('🔍 fetchDashboard: ERROR at website settings fetch - $e');
      }

      debugPrint('🔍 fetchDashboard: All fetches complete, updating state');
      state = HomeDashboardState(
        user: user,
        enrolledCourses: enrolledCourses,
        certificates: certs,
        courses: courses,
        freeCourses: freeCourses,
        nextBatchSchedule: nextBatchSchedule,
      );
    } catch (e, stackTrace) {
      debugPrint('🔍 fetchDashboard: ERROR at profile fetch - $e');
      debugPrint('🔍 fetchDashboard: STACK TRACE - $stackTrace');
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    } finally {
      _isFetching = false;
    }
  }
}

final homeDashboardProvider = StateNotifierProvider.autoDispose<HomeDashboardNotifier, HomeDashboardState>((ref) {
  return HomeDashboardNotifier();
});