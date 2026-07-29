import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../services/course_service.dart';
import 'package:ilab_app/shared/models/course_model.dart';

class FreeCoursesListState {
  final List<CourseModel> courses;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const FreeCoursesListState({
    this.courses = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });
}

class FreeCoursesListNotifier extends StateNotifier<FreeCoursesListState> {
  final CourseService _service = CourseService();

  FreeCoursesListNotifier() : super(const FreeCoursesListState()) {
    fetchCourses();
  }

  Future<void> fetchCourses() async {
    state = FreeCoursesListState(isLoading: true);
    try {
      final result = await _service.fetchCourses(page: 1, free: true);
      state = FreeCoursesListState(
        courses: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = FreeCoursesListState(error: e.toString());
    }
  }

  Future<void> refresh() async {
    state = const FreeCoursesListState(isLoading: true);
    try {
      final result = await _service.fetchCourses(page: 1, free: true);
      state = FreeCoursesListState(
        courses: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = FreeCoursesListState(error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = FreeCoursesListState(
      courses: state.courses,
      isLoadingMore: true,
      currentPage: state.currentPage,
      hasMore: state.hasMore,
    );
    try {
      final nextPage = state.currentPage + 1;
      final result = await _service.fetchCourses(page: nextPage, free: true);
      state = FreeCoursesListState(
        courses: [...state.courses, ...result.items],
        currentPage: nextPage,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = FreeCoursesListState(
        courses: state.courses,
        error: e.toString(),
        currentPage: state.currentPage,
        hasMore: state.hasMore,
      );
    }
  }
}

final freeCoursesListProvider = StateNotifierProvider<FreeCoursesListNotifier, FreeCoursesListState>((ref) {
  return FreeCoursesListNotifier();
});

class FreeCoursesScreen extends ConsumerStatefulWidget {
  const FreeCoursesScreen({super.key});

  @override
  ConsumerState<FreeCoursesScreen> createState() => _FreeCoursesScreenState();
}

class _FreeCoursesScreenState extends ConsumerState<FreeCoursesScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(freeCoursesListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(freeCoursesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Free Courses'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(freeCoursesListProvider.notifier).refresh(),
        child: _buildBody(state),
      ),
    );
  }

  Widget _buildBody(FreeCoursesListState state) {
    if (state.isLoading && state.courses.isEmpty) {
      return const ShimmerGrid();
    }
    if (state.error != null && state.courses.isEmpty) {
      return ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(freeCoursesListProvider.notifier).fetchCourses(),
      );
    }
    if (state.courses.isEmpty) {
      return const EmptyStateWidget(
        icon: Icons.card_giftcard,
        title: 'No free courses available',
        subtitle: 'Check back later for new free courses.',
      );
    }
    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Free Courses',
                  style: AppTextStyles.titleLarge.copyWith(color: AppColors.foreground),
                ),
                const SizedBox(height: 4),
                Text(
                  'Start learning without any cost',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.75,
            ),
            delegate: SliverChildBuilderDelegate(
              (_, i) => CourseCard(
                course: state.courses[i],
                onTap: () => Navigator.pushNamed(context, '/course-detail', arguments: state.courses[i].slug),
              ),
              childCount: state.courses.length,
            ),
          ),
        ),
        SliverToBoxAdapter(child: _buildFooter(state)),
      ],
    );
  }

  Widget _buildFooter(FreeCoursesListState state) {
    if (state.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (!state.hasMore && state.courses.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No more courses',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
          ),
        ),
      );
    }
    if (state.error != null && state.courses.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: TextButton.icon(
            onPressed: () => ref.read(freeCoursesListProvider.notifier).loadMore(),
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}