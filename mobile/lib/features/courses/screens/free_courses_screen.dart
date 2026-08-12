import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:ilab_app/shared/models/course_model.dart';
import 'package:ilab_app/shared/services/api_client.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/screens/main_shell.dart';
import '../services/course_service.dart';

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
      state = FreeCoursesListState(error: formatErrorMessage(e));
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
      state = FreeCoursesListState(error: formatErrorMessage(e));
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
        error: formatErrorMessage(e),
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
      backgroundColor: AppColors.background,
      body: SafeArea(
        top: true,
        bottom: false,
        child: RefreshIndicator(
        onRefresh: () => ref.read(freeCoursesListProvider.notifier).refresh(),
        child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(child: _buildHeader()),
          _buildContent(state),
          if (state.isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary)),
              ),
            ),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      ),
    ),
  );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              final shell = context.findAncestorStateOfType<MainShellState>();
              if (shell != null) {
                shell.switchToTab(0);
              } else {
                Navigator.of(context).pop();
              }
            },
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFE7E5ED),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                color: Color(0xFF0F172A),
                size: 22,
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Text(
                'Free Courses',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ),
          const SizedBox(width: 44),
        ],
      ),
    );
  }

  Widget _buildContent(FreeCoursesListState state) {
    if (state.isLoading && state.courses.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: _FreeCoursesShimmer(),
      );
    }
    if (state.error != null && state.courses.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: ErrorDisplayWidget(
          message: state.error!,
          onRetry: () => ref.read(freeCoursesListProvider.notifier).fetchCourses(),
        ),
      );
    }
    if (state.courses.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: _buildEmptyState(),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (_, i) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildCourseCard(state.courses[i]),
          ),
          childCount: state.courses.length,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.muted,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.card_giftcard,
                size: 64,
                color: Color(0xFF475569),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No free courses available',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later for new free courses',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: const Color(0xFF475569),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(CourseModel course) {
    final hasImage = course.thumbnailUrl != null && course.thumbnailUrl!.isNotEmpty;

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/course-detail', arguments: course.slug),
      child: Container(
        height: 180,
        width: double.infinity,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 15,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Stack(
          children: [
            if (hasImage)
              Image.network(
                course.thumbnailUrl!,
                width: double.infinity,
                height: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => _buildCourseCardFallback(),
              )
            else
              _buildCourseCardFallback(),
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)],
                  ),
                ),
              ),
            ),
            if (course.category != null)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    course.category!,
                    style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white),
                  ),
                ),
              ),
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Free',
                  style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Text(
                course.title,
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCardFallback() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0D9488), Color(0xFF14B8A6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
    );
  }
}

class _FreeCoursesShimmer extends StatelessWidget {
  const _FreeCoursesShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: Row(
              children: [
                const _ShimmerBlock(width: 44, height: 44, borderRadius: 22),
                const Spacer(),
                Text(
                  'Free Courses',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A).withValues(alpha: 0.3),
                  ),
                ),
                const Spacer(),
                const SizedBox(width: 44),
              ],
            ),
          ),
          const SizedBox(height: 24),
          for (int i = 0; i < 4; i++) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: _ShimmerBlock(height: 180, borderRadius: 24),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShimmerBlock extends StatelessWidget {
  final double height;
  final double? width;
  final double borderRadius;

  const _ShimmerBlock({this.height = 120, this.width, this.borderRadius = 14});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE7E5ED),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}