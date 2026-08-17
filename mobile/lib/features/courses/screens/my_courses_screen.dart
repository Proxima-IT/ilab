import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/scheduler.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/screens/main_shell.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../home/providers/home_dashboard_provider.dart';

class MyCoursesScreen extends ConsumerStatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  ConsumerState<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends ConsumerState<MyCoursesScreen> {
  Future<void> _onRefresh() async {
    await ref.read(homeDashboardProvider.notifier).fetchDashboard();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(homeDashboardProvider);
    final courses = dashboardState.enrolledCourses;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Courses'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: dashboardState.isLoading && courses.isEmpty
          ? const _MyCoursesShimmer()
          : courses.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _onRefresh,
                  child: _buildCourseList(courses),
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
            Icon(
              Icons.school_outlined,
              size: 64,
              color: AppColors.mutedForeground.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'You haven\'t enrolled in any courses yet.',
              style: AppTextStyles.titleMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Browse our catalog and start learning something new today.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
                SchedulerBinding.instance.addPostFrameCallback((_) {
                  mainShellKey.currentState?.switchToTab(1);
                });
              },
              icon: const Icon(Icons.explore_outlined, size: 18),
              label: const Text('Browse Courses'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseList(List<EnrolledCourseModel> courses) {
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Courses',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Continue your learning journey',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildCourseCard(courses[i]),
              ),
              childCount: courses.length,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCourseCard(EnrolledCourseModel course) {
    final hasImage = course.course.thumbnailUrl != null && course.course.thumbnailUrl!.isNotEmpty;
    final isCompleted = course.progress >= 100;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () {
          if (course.firstLessonId != null) {
            Navigator.pushNamed(context, '/lesson-player', arguments: {
              'slug': course.course.slug,
              'lessonId': course.firstLessonId,
            });
          } else {
            Navigator.pushNamed(context, '/course-detail', arguments: course.course.slug);
          }
        },
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  bottomLeft: Radius.circular(14),
                ),
                child: SizedBox(
                  width: 110,
                  height: 110,
                  child: hasImage
                      ? Image.network(
                          course.course.thumbnailUrl!,
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _buildPlaceholder(course, isCompleted),
                        )
                      : _buildPlaceholder(course, isCompleted),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course.course.title,
                        style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      if (isCompleted)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Completed',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                      else ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: course.progress / 100,
                            backgroundColor: AppColors.muted,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                            minHeight: 5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (course.totalLessons > 0)
                              Text(
                                '${course.completedLessons}/${course.totalLessons} lessons',
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              )
                            else
                              Text(
                                'No lessons yet',
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            const Spacer(),
                            Text(
                              '${course.progress.toStringAsFixed(0)}%',
                              style: AppTextStyles.labelSmall.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        if (course.firstLessonId != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(Icons.play_circle_filled, size: 14, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                'Continue learning',
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder(EnrolledCourseModel course, bool isCompleted) {
    final colors = [
      AppColors.primary,
      AppColors.accent,
      const Color(0xFF8B5CF6),
      const Color(0xFF3B82F6),
      const Color(0xFFEC4989),
    ];
    final color = colors[course.id % colors.length];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: isCompleted
            ? Icon(Icons.check_circle, color: AppColors.primary, size: 28)
            : Icon(Icons.book_outlined, color: color, size: 28),
      ),
    );
  }
}

class _MyCoursesShimmer extends StatelessWidget {
  const _MyCoursesShimmer();

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Courses',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Continue your learning journey',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, _) => const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: ShimmerCard(height: 110),
              ),
              childCount: 5,
            ),
          ),
        ),
      ],
    );
  }
}