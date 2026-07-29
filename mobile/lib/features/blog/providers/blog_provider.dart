import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/blog_post_model.dart';
import '../services/blog_service.dart';

class BlogListState {
  final List<BlogPostModel> posts;
  final bool isLoading;
  final String? error;

  const BlogListState({this.posts = const [], this.isLoading = false, this.error});

  BlogListState copyWith({List<BlogPostModel>? posts, bool? isLoading, String? error}) {
    return BlogListState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class BlogListNotifier extends StateNotifier<BlogListState> {
  final BlogService _service = BlogService();

  BlogListNotifier() : super(const BlogListState());

  Future<void> fetchPosts() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final posts = await _service.fetchPosts();
      state = BlogListState(posts: posts);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final blogListProvider = StateNotifierProvider<BlogListNotifier, BlogListState>((ref) {
  return BlogListNotifier();
});

class BlogDetailState {
  final BlogPostModel? post;
  final bool isLoading;
  final String? error;

  const BlogDetailState({this.post, this.isLoading = false, this.error});
}

class BlogDetailNotifier extends StateNotifier<BlogDetailState> {
  final BlogService _service = BlogService();

  BlogDetailNotifier(String slug) : super(const BlogDetailState(isLoading: true)) {
    fetchDetail(slug);
  }

  Future<void> fetchDetail(String slug) async {
    state = const BlogDetailState(isLoading: true);
    try {
      final post = await _service.fetchPostDetail(slug);
      state = BlogDetailState(post: post);
    } catch (e) {
      state = BlogDetailState(error: e.toString());
    }
  }
}

final blogDetailProvider = StateNotifierProvider.family<BlogDetailNotifier, BlogDetailState, String>((ref, slug) {
  return BlogDetailNotifier(slug);
});