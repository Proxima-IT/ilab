import '../../../config/api_config.dart';
import '../../../shared/models/blog_post_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../../../shared/services/api_client.dart';

class BlogService {
  final ApiClient _api = ApiClient();

  Future<({List<BlogPostModel> items, PaginationMeta meta})> fetchPosts({int page = 1, int perPage = 12}) async {
    final params = <String, dynamic>{'page': page, 'per_page': perPage};
    final response = await _api.get(ApiConfig.blogPosts, queryParams: params);
    final data = response.data as Map<String, dynamic>;
    final List<dynamic> itemsList = (data['data'] as List<dynamic>?) ?? [];
    final items = itemsList.map((e) => BlogPostModel.fromJson(e as Map<String, dynamic>)).toList();
    final meta = PaginationMeta.fromJson((data['meta'] as Map<String, dynamic>?) ?? {});
    return (items: items, meta: meta);
  }

  Future<BlogPostModel> fetchPostDetail(String slug) async {
    final response = await _api.get('${ApiConfig.blogDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final postData = data['data'] as Map<String, dynamic>? ?? data;
    return BlogPostModel.fromJson(postData);
  }
}