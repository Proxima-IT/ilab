import '../../../config/api_config.dart';
import '../../../shared/models/blog_post_model.dart';
import '../../../shared/services/api_client.dart';

class BlogService {
  final ApiClient _api = ApiClient();

  Future<List<BlogPostModel>> fetchPosts({int? perPage}) async {
    final params = <String, dynamic>{};
    if (perPage != null) params['per_page'] = perPage;
    final response = await _api.get(ApiConfig.blogPosts, queryParams: params.isNotEmpty ? params : null);
    final data = response.data;
    final List<dynamic> items;
    if (data is Map<String, dynamic>) {
      items = (data['data'] as List<dynamic>?) ?? (data['items'] as List<dynamic>?) ?? [];
    } else if (data is List) {
      items = data;
    } else {
      items = [];
    }
    return items.map((e) => BlogPostModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<BlogPostModel> fetchPostDetail(String slug) async {
    final response = await _api.get('${ApiConfig.blogDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final postData = data['data'] as Map<String, dynamic>? ?? data;
    return BlogPostModel.fromJson(postData);
  }
}