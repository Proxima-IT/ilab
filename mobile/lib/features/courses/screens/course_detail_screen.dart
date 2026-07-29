import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';

import '../../../shared/models/course_model.dart';
import '../../../shared/screens/webview_screen.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../providers/course_provider.dart';

class CourseDetailScreen extends ConsumerStatefulWidget {
  const CourseDetailScreen({super.key});

  @override
  ConsumerState<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends ConsumerState<CourseDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slug = ModalRoute.of(context)!.settings.arguments as String;
    final state = ref.watch(courseDetailProvider(slug));

    if (state.isLoading && state.detail == null) {
      return const Scaffold(body: _DetailShimmer());
    }

    if (state.error != null && state.detail == null) {
      return Scaffold(
        body: ErrorDisplayWidget(
          message: state.error!,
          onRetry: () => ref.read(courseDetailProvider(slug).notifier).fetchDetail(slug),
        ),
      );
    }

    final detail = state.detail;
    if (detail == null) {
      return const Scaffold(body: SizedBox.shrink());
    }

    return _buildContent(detail, slug);
  }

  Widget _buildContent(CourseDetailModel detail, String slug) {
    final course = detail.course;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => ref.read(courseDetailProvider(slug).notifier).fetchDetail(slug),
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.foreground,
              foregroundColor: AppColors.white,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: _buildHero(course),
              ),
            ),
            SliverToBoxAdapter(
              child: _buildHeaderContent(detail),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                tabController: _tabController,
                tabCount: 3,
                labels: const ['About', 'Curriculum', 'Reviews'],
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabController,
            children: [
              _AboutTab(detail: detail),
              _CurriculumTab(detail: detail),
              _ReviewsTab(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomBar(detail, slug),
    );
  }

  Widget _buildHero(CourseModel course) {
    if (course.thumbnailUrl != null) {
      return Image.network(
        course.thumbnailUrl!,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => _heroPlaceholder(),
      );
    }
    return _heroPlaceholder();
  }

  Widget _heroPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.school_rounded, color: AppColors.white, size: 48),
      ),
    );
  }

  Widget _buildHeaderContent(CourseDetailModel detail) {
    final course = detail.course;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (course.category != null)
                _badge(course.category!, AppColors.primary, AppColors.primary.withValues(alpha: 0.1)),
              if (course.level != null) ...[
                const SizedBox(width: 8),
                _badge(course.level!, AppColors.accent, AppColors.accent.withValues(alpha: 0.1)),
              ],
              if (course.mode != null) ...[
                const SizedBox(width: 8),
                _badge(course.mode!.replaceAll('_', ' '), AppColors.mutedForeground, AppColors.muted),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Text(
            course.title,
            style: AppTextStyles.headlineSmall.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 8),
          if (course.enrollmentCount != null && course.enrollmentCount! > 0)
            Row(
              children: [
                Icon(Icons.people_outline, size: 16, color: AppColors.mutedForeground),
                const SizedBox(width: 4),
                Text(
                  '${course.enrollmentCount!} enrolled',
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                ),
              ],
            ),
          const SizedBox(height: 12),
          _buildPriceRow(course),
          const SizedBox(height: 16),
          const Divider(height: 1),
        ],
      ),
    );
  }

  Widget _badge(String text, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: AppTextStyles.labelMedium.copyWith(color: textColor),
      ),
    );
  }

  Widget _buildPriceRow(CourseModel course) {
    if (course.isFree) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'Free',
          style: AppTextStyles.titleSmall.copyWith(
            color: AppColors.success,
            fontWeight: FontWeight.w800,
          ),
        ),
      );
    }

    return Row(
      children: [
        Text(
          '৳${course.effectivePrice.toStringAsFixed(0)}',
          style: AppTextStyles.titleLarge.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        if (course.hasDiscount) ...[
          const SizedBox(width: 8),
          Text(
            '৳${course.price.toStringAsFixed(0)}',
            style: AppTextStyles.bodyMedium.copyWith(
              decoration: TextDecoration.lineThrough,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.primaryDark,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${_calculateDiscount(course.price, course.effectivePrice)}% OFF',
              style: AppTextStyles.labelSmall.copyWith(
                color: AppColors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ],
    );
  }

  int _calculateDiscount(double original, double current) {
    if (original <= 0) return 0;
    return ((original - current) / original * 100).round();
  }

  Widget _buildBottomBar(CourseDetailModel detail, String slug) {
    final course = detail.course;
    final dashboardState = ref.watch(homeDashboardProvider);

    final matchingEnrollment = dashboardState.enrolledCourses.where(
      (e) => e.course.slug == course.slug && e.status != 'suspended' && e.status != 'expired',
    ).firstOrNull;
    final isEnrolled = matchingEnrollment != null;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 52,
              child: FilledButton(
                onPressed: () {
                  if (isEnrolled) {
                    Navigator.pushNamed(
                      context,
                      '/lesson-player',
                      arguments: {
                        'slug': course.slug,
                        'lessonId': matchingEnrollment.firstLessonId,
                      },
                    );
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WebViewScreen(
                          url: 'https://ilabbd.com/enroll/${course.slug}',
                          title: 'Enroll in ${course.title}',
                        ),
                      ),
                    ).then((_) {
                      ref.read(homeDashboardProvider.notifier).fetchDashboard();
                      ref.read(courseDetailProvider(slug).notifier).fetchDetail(slug);
                    });
                  }
                },
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  backgroundColor: isEnrolled ? AppColors.success : AppColors.primary,
                ),
                child: Text(
                  isEnrolled
                      ? 'Continue Learning'
                      : course.isFree
                          ? 'Enroll Now - Free'
                          : 'Enroll Now - ৳${course.effectivePrice.toStringAsFixed(0)}',
                  style: AppTextStyles.buttonLarge.copyWith(color: AppColors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabController tabController;
  final int tabCount;
  final List<String> labels;

  _TabBarDelegate({
    required this.tabController,
    required this.tabCount,
    required this.labels,
  });

  @override
  double get minExtent => 48;
  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.background,
      child: TabBar(
        controller: tabController,
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.mutedForeground,
        indicatorColor: AppColors.primary,
        indicatorWeight: 3,
        labelStyle: AppTextStyles.labelLarge.copyWith(fontWeight: FontWeight.w700),
        unselectedLabelStyle: AppTextStyles.labelLarge,
        tabs: labels.map((label) => Tab(text: label)).toList(),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}

class _AboutTab extends StatelessWidget {
  final CourseDetailModel detail;

  const _AboutTab({required this.detail});

  @override
  Widget build(BuildContext context) {
    final course = detail.course;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (course.description != null && course.description!.isNotEmpty) ...[
            _sectionTitle('Description'),
            const SizedBox(height: 8),
            Text(
              course.description!.replaceAll(RegExp(r'<[^>]*>'), ''),
              style: AppTextStyles.bodyMedium.copyWith(height: 1.6),
            ),
            const SizedBox(height: 24),
          ],

          if (detail.learningOutcomes.isNotEmpty) ...[
            _sectionTitle('What You\'ll Learn'),
            const SizedBox(height: 8),
            ...detail.learningOutcomes.map((outcome) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, size: 12, color: AppColors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(outcome, style: AppTextStyles.bodyMedium),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 24),
          ],

          if (detail.prerequisites.isNotEmpty) ...[
            _sectionTitle('Prerequisites'),
            const SizedBox(height: 8),
            ...detail.prerequisites.map((req) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(req, style: AppTextStyles.bodyMedium)),
                ],
              ),
            )),
            const SizedBox(height: 24),
          ],

          if (detail.instructor != null) ...[
            _sectionTitle('Instructor'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage: detail.instructorAvatar != null
                        ? NetworkImage(detail.instructorAvatar!)
                        : null,
                    child: detail.instructorAvatar == null
                        ? Text(
                            detail.instructor![0].toUpperCase(),
                            style: AppTextStyles.titleLarge.copyWith(color: AppColors.primary),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          detail.instructor!,
                          style: AppTextStyles.titleSmall,
                        ),
                        if (detail.instructorBio != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            detail.instructorBio!,
                            style: AppTextStyles.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (detail.instructorCoursesCount > 0 ||
                            detail.instructorStudentsCount > 0) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              if (detail.instructorCoursesCount > 0) ...[
                                Icon(Icons.menu_book_rounded, size: 14, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Text(
                                  '${detail.instructorCoursesCount} courses',
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                                ),
                                const SizedBox(width: 12),
                              ],
                              if (detail.instructorStudentsCount > 0) ...[
                                Icon(Icons.people_rounded, size: 14, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Text(
                                  '${detail.instructorStudentsCount} students',
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          if (detail.tags.isNotEmpty) ...[
            _sectionTitle('Tags'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: detail.tags.map((tag) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Text(
                  tag,
                  style: AppTextStyles.labelMedium.copyWith(color: AppColors.primaryDark),
                ),
              )).toList(),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.w700),
    );
  }
}

class _CurriculumTab extends StatefulWidget {
  final CourseDetailModel detail;

  const _CurriculumTab({required this.detail});

  @override
  State<_CurriculumTab> createState() => _CurriculumTabState();
}

class _CurriculumTabState extends State<_CurriculumTab> {
  final Set<int> _expandedSections = {};

  @override
  void initState() {
    super.initState();
    if (widget.detail.sections.isNotEmpty) {
      _expandedSections.add(widget.detail.sections.first.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = widget.detail;

    if (detail.sections.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.menu_book_rounded, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
              const SizedBox(height: 16),
              Text(
                'No curriculum available yet',
                style: AppTextStyles.titleMedium.copyWith(color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 8),
              Text(
                'Curriculum will be published soon.',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              ),
            ],
          ),
        ),
      );
    }

    final totalLessons = detail.sections.fold(0, (sum, s) => sum + s.lessons.length);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _statChip('${detail.sections.length} sections', AppColors.primaryDark, AppColors.primary.withValues(alpha: 0.1)),
              const SizedBox(width: 8),
              _statChip('$totalLessons lessons', const Color(0xFF0369A1), const Color(0xFFE0F2FE)),
              if (detail.totalHours > 0) ...[
                const SizedBox(width: 8),
                _statChip('${detail.totalHours}h total', const Color(0xFFC2410C), const Color(0xFFFFEDD5)),
              ],
              const Spacer(),
              if (detail.sections.length > 1)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_expandedSections.length == detail.sections.length) {
                        _expandedSections.clear();
                      } else {
                        _expandedSections.addAll(detail.sections.map((s) => s.id));
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      _expandedSections.length == detail.sections.length ? 'Collapse' : 'Expand all',
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                children: detail.sections.map((section) => _buildSectionTile(section)).toList(),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _statChip(String label, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          color: textColor,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildSectionTile(CourseSection section) {
    final expanded = _expandedSections.contains(section.id);

    return Column(
      children: [
        InkWell(
          onTap: () => setState(() {
            if (expanded) {
              _expandedSections.remove(section.id);
            } else {
              _expandedSections.add(section.id);
            }
          }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.5))),
            ),
            child: Row(
              children: [
                AnimatedRotation(
                  duration: const Duration(milliseconds: 200),
                  turns: expanded ? 0.25 : 0,
                  child: Icon(Icons.chevron_right, size: 20, color: AppColors.mutedForeground),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    section.title,
                    style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${section.lessons.length} lessons',
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Column(
            children: section.lessons.map((lesson) => _buildLessonTile(lesson)).toList(),
          ),
          crossFadeState: expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }

  Widget _buildLessonTile(CourseLesson lesson) {
    return Container(
      padding: const EdgeInsets.only(left: 44, right: 16, top: 12, bottom: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.3))),
        color: AppColors.surface.withValues(alpha: 0.3),
      ),
      child: Row(
        children: [
          Icon(
            _lessonIcon(lesson.type),
            size: 18,
            color: AppColors.primary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              lesson.title,
              style: AppTextStyles.bodyMedium,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (lesson.isFree)
            Text(
              'Preview',
              style: AppTextStyles.labelSmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            )
          else
            Icon(Icons.lock_outline, size: 14, color: AppColors.mutedForeground),
          const SizedBox(width: 8),
          if (lesson.durationFormatted.isNotEmpty)
            Text(
              lesson.durationFormatted,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.mutedForeground,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
        ],
      ),
    );
  }

  IconData _lessonIcon(String type) {
    switch (type) {
      case 'pdf':
        return Icons.description_outlined;
      case 'quiz':
        return Icons.quiz_outlined;
      case 'live':
        return Icons.radio_rounded;
      default:
        return Icons.play_circle_outline;
    }
  }
}

class _ReviewsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.rate_review_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            Text(
              'Reviews coming soon',
              style: AppTextStyles.titleMedium.copyWith(color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 8),
            Text(
              'Student reviews will appear here after enrollment.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailShimmer extends StatelessWidget {
  const _DetailShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerCard(height: 200, width: double.infinity),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerCard(height: 20, width: 120),
                const SizedBox(height: 12),
                const ShimmerCard(height: 28, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 28, width: 200),
                const SizedBox(height: 16),
                const ShimmerCard(height: 16, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 16, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 16, width: 200),
                const SizedBox(height: 24),
                const ShimmerCard(height: 20, width: 150),
                const SizedBox(height: 12),
                const ShimmerCard(height: 60, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 60, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 60, width: double.infinity),
              ],
            ),
          ),
        ],
      ),
    );
  }
}