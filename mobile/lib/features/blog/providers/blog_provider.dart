import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/blog_post_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../services/blog_service.dart';

class BlogListState {
  final List<BlogPostModel> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const BlogListState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  BlogListState copyWith({
    List<BlogPostModel>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return BlogListState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class BlogListNotifier extends StateNotifier<BlogListState> {
  final BlogService _service = BlogService();

  BlogListNotifier() : super(const BlogListState());

  Future<void> fetchPosts() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.fetchPosts(page: 1);
      state = BlogListState(
        posts: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null, isLoadingMore: false);
    try {
      final result = await _service.fetchPosts(page: 1);
      state = BlogListState(
        posts: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true, error: null);
    try {
      final nextPage = state.currentPage + 1;
      final result = await _service.fetchPosts(page: nextPage);
      state = BlogListState(
        posts: [...state.posts, ...result.items],
        currentPage: nextPage,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e.toString());
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