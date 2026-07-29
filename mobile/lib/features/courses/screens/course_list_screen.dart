import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/course_provider.dart';

class CourseListScreen extends ConsumerStatefulWidget {
  const CourseListScreen({super.key});

  @override
  ConsumerState<CourseListScreen> createState() => _CourseListScreenState();
}

class _CourseListScreenState extends ConsumerState<CourseListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(courseListProvider.notifier).fetchCourses());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(courseListProvider.notifier).fetchCourses(),
      child: _buildBody(state),
    );
  }

  Widget _buildBody(CourseListState state) {
    if (state.isLoading && state.courses.isEmpty) {
      return const ShimmerGrid();
    }
    if (state.error != null && state.courses.isEmpty) {
      return ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(courseListProvider.notifier).fetchCourses(),
      );
    }
    if (state.courses.isEmpty) {
      return const EmptyStateWidget(
        icon: Icons.school_outlined,
        title: 'No courses yet',
        subtitle: 'Check back later for new courses.',
      );
    }
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'All Courses',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Browse our course catalog',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                  ),
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
      ],
    );
  }
}