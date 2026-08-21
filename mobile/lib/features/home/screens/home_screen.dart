import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/screens/main_shell.dart';
import '../../../shared/screens/webview_screen.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../notifications/providers/notification_provider.dart';
import '../providers/home_dashboard_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(homeDashboardProvider.notifier).fetchDashboard());
  }

  Future<void> _onRefresh() async {
    await ref.read(homeDashboardProvider.notifier).fetchDashboard();
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🔤 Active Font: ${DefaultTextStyle.of(context).style.fontFamily}');
    final dashboardState = ref.watch(homeDashboardProvider);
    debugPrint('🔍 HomeScreen build: error=${dashboardState.error} isLoading=${dashboardState.isLoading} hasData=${dashboardState.user != null}');

    if (dashboardState.error != null && dashboardState.user == null) {
      debugPrint('🔍 HomeScreen: Rendering ERROR widget');
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ErrorDisplayWidget(
          message: dashboardState.error!,
          onRetry: _onRefresh,
        ),
      );
    }

    if (dashboardState.isLoading && dashboardState.user == null) {
      debugPrint('🔍 HomeScreen: Rendering SHIMMER widget');
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: const _DashboardShimmer(),
      );
    }

    debugPrint('🔍 HomeScreen: Rendering CONTENT widget');
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: _buildContent(dashboardState),
    );
  }

  Widget _buildContent(HomeDashboardState state) {
    final inProgress = state.enrolledCourses.where((c) => c.progress > 0 && c.progress < 100).toList();

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 88),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          _buildCustomHeader(state),
          const SizedBox(height: 16),
          _buildQuickNavCircles(),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _buildHeroCard(),
          ),
          const SizedBox(height: 20),
          _buildUpcomingBatchSchedule(state),
          const SizedBox(height: 20),
          if (inProgress.isNotEmpty) ...[
            _buildActiveLesson(inProgress.first),
            const SizedBox(height: 20),
          ],
          if (inProgress.isNotEmpty) ...[
            _buildSectionHeader('Continue Learning', onSeeAll: () {}),
            _buildInProgressCourses(inProgress),
          ],
          if (state.courses.isNotEmpty) ...[
            _buildSectionHeader('Our Courses', onSeeAll: () => context.findAncestorStateOfType<MainShellState>()?.switchToTab(1)),
            _buildHorizontalCourses(state.courses.take(3).toList()),
            const SizedBox(height: 20),
          ],
          if (state.certificates.isNotEmpty) ...[
            _buildSectionHeader('Recent Certificates'),
            _buildCertificatesSection(state.certificates.take(3).toList()),
          ],
          if (state.freeCourses.isNotEmpty) ...[
            const SizedBox(height: 20),
            _buildSectionHeader('Free Courses', onSeeAll: () => Navigator.pushNamed(context, '/free-courses')),
            _buildHorizontalCourses(state.freeCourses.take(4).toList()),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildCustomHeader(HomeDashboardState state) {
    final user = state.user;
    final unreadCount = ref.watch(notificationProvider).unreadCount;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _buildAvatar(user, 40),
          const Expanded(
            child: Center(
              child: Text(
                'iLab Academy',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.foreground,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/notifications'),
            child: Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                color: Color(0xFFE7E5ED),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Stack(
                  children: [
                    const Icon(Icons.notifications_outlined, size: 28, color: AppColors.foreground),
                    if (unreadCount > 0)
                      Positioned(
                        right: 2,
                        top: 2,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.destructive,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(UserModel? user, double size) {
    final photoUrl = user?.profilePhoto;
    if (photoUrl != null && photoUrl.isNotEmpty) {
      final resolved = ApiConfig.resolveImageUrl(photoUrl);
      if (resolved != null) {
        return ClipOval(
          child: Image.network(
            resolved,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => _buildInitials(user, size),
          ),
        );
      }
    }
    return _buildInitials(user, size);
  }

  Widget _buildInitials(UserModel? user, double size) {
    if (user == null) return const SizedBox.shrink();
    final name = user.name;
    final parts = name.split(' ');
    final initials = StringBuffer();
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      initials.write(parts[0][0].toUpperCase());
    }
    if (parts.length > 1 && parts.last.isNotEmpty) {
      initials.write(parts.last[0].toUpperCase());
    }
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppColors.primary,
      child: Text(
        initials.toString(),
        style: TextStyle(
          color: AppColors.white,
          fontWeight: FontWeight.w600,
          fontSize: size * 0.45,
        ),
      ),
    );
  }

  Widget _buildQuickNavCircles() {
    const items = [
      _QuickNavItem(label: 'My Courses', icon: Icons.menu_book, gradient: [Color(0xFF0D9488), Color(0xFF14B8A6)], route: '/my-courses'),
      _QuickNavItem(label: 'Events', icon: Icons.event, gradient: [Color(0xFFF76A21), Color(0xFFFF8A4C)], route: 'switch_to_events'),
      _QuickNavItem(label: 'Reviews', icon: Icons.reviews, gradient: [Color(0xFF8B5CF6), Color(0xFFA78BFA)], route: 'reviews'),
      _QuickNavItem(label: 'Blog', icon: Icons.article_rounded, gradient: [Color(0xFF3B82F6), Color(0xFF60A5FA)], route: 'switch_to_blog'),
      _QuickNavItem(label: 'Free Courses', icon: Icons.lock_open_rounded, gradient: [Color(0xFFEC4989), Color(0xFFF472B6)], route: '/free-courses'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: items.map((item) {
          return Expanded(
            child: GestureDetector(
              onTap: () {
                switch (item.route) {
                  case 'switch_to_events':
                    context.findAncestorStateOfType<MainShellState>()?.switchToTab(3);
                    break;
                  case 'switch_to_blog':
                    context.findAncestorStateOfType<MainShellState>()?.switchToTab(2);
                    break;
                  case 'reviews':
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Reviews coming soon')),
                    );
                    break;
                  default:
                    Navigator.pushNamed(context, item.route);
                }
              },
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: item.gradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(item.icon, color: Colors.white, size: 24),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.label,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildHeroCard() {
    return GestureDetector(
      onTap: () => context.findAncestorStateOfType<MainShellState>()?.switchToTab(1),
      child: Container(
        width: double.infinity,
        height: 140,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            colors: [Color(0xFF0D9488), Color(0xFF7C3AED)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned(
              right: -10,
              top: -10,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
              ),
            ),
            Positioned(
              right: 30,
              bottom: -20,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Start your learning\njourney with iLab',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.black,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Explore Courses',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingBatchSchedule(HomeDashboardState state) {
    final schedule = state.nextBatchSchedule;
    final title = schedule?.title ?? 'Upcoming practical batch schedule (06-Sep-2026)';
    final enrollmentStart = schedule?.enrollmentStartDate ?? 'September 10, 2026';
    final enrollmentEnd = schedule?.enrollmentEndDate ?? 'September 24, 2026';
    final demoUrl = schedule?.demoUrl ?? '';
    final courseUrl = schedule?.courseUrl ?? '';
    final demoButtonLabel = schedule?.demoButtonLabel ?? 'ফ্রি ক্লাস ভিডিও';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 15,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.calendar_month_outlined, size: 16, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildScheduleRow('Enrollment Start', enrollmentStart),
            const SizedBox(height: 6),
            _buildScheduleRow('Enrollment End', enrollmentEnd),
            const SizedBox(height: 12),
            _buildActionButtons(demoUrl, courseUrl, demoButtonLabel),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleRow(String label, String value) {
    return Row(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
        ),
        const Spacer(),
        Text(
          value,
          style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildActionButtons(String demoUrl, String courseUrl, String demoButtonLabel) {
    final hasDemoUrl = demoUrl.trim().isNotEmpty;
    final hasCourseUrl = courseUrl.trim().isNotEmpty;

    void openUrl(String url) {
      if (url.isEmpty) return;
      if (url.startsWith('/')) {
        if (url == '/courses') {
          mainShellKey.currentState?.switchToTab(1);
          return;
        }
        Navigator.pushNamed(context, url);
        return;
      }
      final uri = Uri.tryParse(url);
      if (uri != null && uri.hasScheme) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => WebViewScreen(
              url: url,
              title: 'iLab',
            ),
          ),
        );
      }
    }

    void navigateToEnroll() {
      if (!hasCourseUrl) return;
      final segments = courseUrl.split('/');
      final slug = segments.lastWhere((s) => s.isNotEmpty, orElse: () => '');
      if (slug.isNotEmpty && slug != 'courses') {
        Navigator.pushNamed(context, '/course-detail', arguments: slug);
      } else {
        openUrl(courseUrl);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: hasDemoUrl ? () => openUrl(demoUrl) : null,
                icon: const Icon(Icons.play_circle_outline, size: 16),
                label: Text(demoButtonLabel, style: const TextStyle(fontSize: 13)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: hasCourseUrl ? () => openUrl(courseUrl) : null,
                icon: const Icon(Icons.description_outlined, size: 16),
                label: const Text('Course Outline', style: TextStyle(fontSize: 13)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        FilledButton.icon(
          onPressed: hasCourseUrl ? navigateToEnroll : null,
          icon: const Icon(Icons.arrow_forward, size: 16),
          label: const Text('Enroll Now!'),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            padding: const EdgeInsets.symmetric(vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveLesson(EnrolledCourseModel course) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Active Lessons',
            style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          GestureDetector(
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
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Continue Learning',
                    style: AppTextStyles.labelMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    course.course.title,
                    style: AppTextStyles.titleLarge.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: course.progress / 100,
                      backgroundColor: AppColors.muted,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${course.progress.toStringAsFixed(0)}% Complete',
                    style: AppTextStyles.labelMedium.copyWith(color: AppColors.mutedForeground),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, {VoidCallback? onSeeAll, MainAxisAlignment alignment = MainAxisAlignment.spaceBetween}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Row(
        mainAxisAlignment: alignment,
        children: [
          Text(title, style: AppTextStyles.titleMedium),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Text(
                'See All',
                style: AppTextStyles.labelMedium.copyWith(color: AppColors.primary),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInProgressCourses(List<EnrolledCourseModel> courses) {
    if (courses.isEmpty) return const SizedBox.shrink();

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 20, right: 8),
      shrinkWrap: true,
      itemCount: courses.length,
      itemBuilder: (_, i) => _buildInProgressCard(courses[i]),
    );
  }

  Widget _buildHorizontalCourses(List<CourseModel> courses) {
    return SizedBox(
      height: 400,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 20, right: 8),
        itemCount: courses.length,
        itemBuilder: (_, i) => Padding(
          padding: const EdgeInsets.only(right: 12),
          child: SizedBox(
            width: 280,
            child: CourseCard(
              course: courses[i],
              onView: () => Navigator.pushNamed(context, '/course-detail', arguments: courses[i].slug),
              onEnroll: () => Navigator.pushNamed(context, '/course-detail', arguments: courses[i].slug),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInProgressCard(EnrolledCourseModel course) {
    final colors = [AppColors.primary, AppColors.accent, const Color(0xFF8B5CF6), const Color(0xFF3B82F6), const Color(0xFFEC4989)];
    final color = colors[course.id % colors.length];

    return GestureDetector(
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
        width: 200,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0.05)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Icon(Icons.book_outlined, size: 32, color: color),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course.course.title,
                    style: AppTextStyles.titleSmall.copyWith(fontSize: 13, fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: course.progress / 100,
                      backgroundColor: AppColors.muted,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (course.totalLessons > 0)
                    Text(
                      '${course.progress.toStringAsFixed(0)}% \u00b7 ${course.completedLessons}/${course.totalLessons} lessons',
                      style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
                    )
                  else
                    Text(
                      'No lessons yet',
                      style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCertificatesSection(List<CertificateModel> certificates) {
    if (certificates.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          children: [
            Icon(Icons.verified_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(
              'Complete a course to earn certificates.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 20, right: 8),
        itemCount: certificates.length,
        itemBuilder: (_, i) => _buildCertificateCard(certificates[i]),
      ),
    );
  }

  Widget _buildCertificateCard(CertificateModel cert) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/certificate-detail', arguments: cert),
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary.withValues(alpha: 0.08), AppColors.primary.withValues(alpha: 0.02)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.verified, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    cert.courseName ?? 'Certificate',
                    style: AppTextStyles.labelMedium.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (cert.issuedAt != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      cert.issuedAt!,
                      style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground, fontSize: 9),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardShimmer extends StatelessWidget {
  const _DashboardShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 88),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const ShimmerCard(height: 40, width: 40),
                const Expanded(
                  child: Center(
                    child: ShimmerCard(height: 20, width: 120),
                  ),
                ),
                const ShimmerCard(height: 48, width: 48),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerCard(height: 28, width: 200),
                SizedBox(height: 6),
                ShimmerCard(height: 16, width: 240),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 140),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(child: ShimmerCard(height: 120)),
                SizedBox(width: 12),
                Expanded(child: ShimmerCard(height: 120)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 20),
          ),
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 120),
          ),
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 20),
          ),
          const SizedBox(height: 8),
          const ShimmerHorizontalScroll(count: 3),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 20),
          ),
          const SizedBox(height: 8),
          const ShimmerGrid(count: 4),
        ],
      ),
    );
  }
}

class _QuickNavItem {
  final String label;
  final IconData icon;
  final List<Color> gradient;
  final String route;
  const _QuickNavItem({required this.label, required this.icon, required this.gradient, required this.route});
}