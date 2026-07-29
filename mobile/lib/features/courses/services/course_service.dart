import '../../../config/api_config.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/services/api_client.dart';

class CourseService {
  final ApiClient _api = ApiClient();

  Future<List<CourseModel>> fetchCourses({int? perPage}) async {
    final params = <String, dynamic>{};
    if (perPage != null) params['per_page'] = perPage;
    final response = await _api.get(ApiConfig.courses, queryParams: params.isNotEmpty ? params : null);
    final data = response.data;
    final List<dynamic> items;
    if (data is Map<String, dynamic>) {
      items = (data['data'] as List<dynamic>?) ?? (data['items'] as List<dynamic>?) ?? [];
    } else if (data is List) {
      items = data;
    } else {
      items = [];
    }
    return items.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CourseDetailModel> fetchCourseDetail(String slug) async {
    final response = await _api.get('${ApiConfig.courseDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final courseData = data['data'] as Map<String, dynamic>? ?? data;
    return CourseDetailModel.fromJson(courseData);
  }
}