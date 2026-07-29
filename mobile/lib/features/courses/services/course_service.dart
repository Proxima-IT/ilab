import '../../../config/api_config.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../../../shared/services/api_client.dart';

class CourseCategory {
  final int id;
  final String name;
  final String slug;
  final int coursesCount;

  const CourseCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.coursesCount = 0,
  });

  factory CourseCategory.fromJson(Map<String, dynamic> json) {
    return CourseCategory(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      coursesCount: (json['courses_count'] as num?)?.toInt() ?? 0,
    );
  }
}

class CourseService {
  final ApiClient _api = ApiClient();

  Future<({List<CourseModel> items, PaginationMeta meta})> fetchCourses({
    int page = 1,
    int perPage = 12,
    String? search,
    String? categoryId,
    String? level,
    String? mode,
    bool? free,
  }) async {
    final params = <String, dynamic>{'page': page, 'per_page': perPage};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (categoryId != null && categoryId.isNotEmpty) params['category_id'] = categoryId;
    if (level != null && level.isNotEmpty) params['level'] = level.toLowerCase();
    if (free == true) {
      params['free'] = '1';
    } else if (mode != null && mode.isNotEmpty) {
      if (mode == 'Self-paced') {
        params['type'] = 'self_paced';
      } else if (mode == 'Live') {
        params['type'] = 'batch';
      } else {
        params['type'] = mode;
      }
    }
    final response = await _api.get(ApiConfig.courses, queryParams: params);
    final data = response.data as Map<String, dynamic>;
    final List<dynamic> itemsList = (data['data'] as List<dynamic>?) ?? [];
    final items = itemsList.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
    final meta = PaginationMeta.fromJson((data['meta'] as Map<String, dynamic>?) ?? {});
    return (items: items, meta: meta);
  }

  Future<List<CourseCategory>> fetchCategories() async {
    final response = await _api.get('/categories', queryParams: {'type': 'course'});
    final data = response.data as Map<String, dynamic>;
    final List<dynamic> itemsList = (data['data'] as List<dynamic>?) ?? [];
    return itemsList.map((e) => CourseCategory.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CourseDetailModel> fetchCourseDetail(String slug) async {
    final response = await _api.get('${ApiConfig.courseDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final courseData = data['data'] as Map<String, dynamic>? ?? data;
    return CourseDetailModel.fromJson(courseData);
  }
}