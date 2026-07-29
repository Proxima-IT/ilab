import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/screens/main_shell.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../auth/providers/auth_provider.dart';
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

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  }

  String _firstName(String fullName) {
    return fullName.split(' ').first;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final dashboardState = ref.watch(homeDashboardProvider);
    final userName = dashboardState.user?.name ?? authState.user?.name ?? 'Student';

    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: dashboardState.isLoading && dashboardState.user == null
          ? const _DashboardShimmer()
          : dashboardState.error != null && dashboardState.user == null
              ? ErrorDisplayWidget(
                  message: dashboardState.error!,
                  onRetry: _onRefresh,
                )
              : _buildContent(dashboardState, userName),
    );
  }

  Widget _buildContent(HomeDashboardState state, String userName) {
    final inProgress = state.enrolledCourses.where((c) => c.progress > 0 && c.progress < 100).toList();
    final completed = state.enrolledCourses.where((c) => c.progress >= 100).toList();
    final certificatesCount = state.certificates.length;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(state),
          const SizedBox(height: 8),
          _buildStatsRow(state.enrolledCourses.length, completed.length, certificatesCount),
          const SizedBox(height: 8),
          if (state.freeCourses.isNotEmpty) ...[
            _buildSectionHeader('Free Courses', onSeeAll: () => Navigator.pushNamed(context, '/free-courses')),
            _buildFreeCourses(state.freeCourses),
          ],
          if (inProgress.isNotEmpty) ...[
            _buildSectionHeader('Continue Learning', onSeeAll: () {}),
            _buildInProgressCourses(inProgress),
          ],
          _buildSectionHeader('My Courses', onSeeAll: () => Navigator.pushNamed(context, '/my-courses')),
          _buildMyCourses(state.enrolledCourses),
          if (state.certificates.isNotEmpty) ...[
            _buildSectionHeader('Recent Certificates'),
            _buildCertificatesSection(state.certificates.take(3).toList()),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildHeader(HomeDashboardState state) {
    final user = state.user;
    final firstName = user != null ? _firstName(user.name) : 'Student';
    final avatarSize = 48.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 4, 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: avatarSize / 2,
            backgroundColor: AppColors.primary,
            child: _buildAvatarContent(user, avatarSize),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_greeting()}, $firstName!',
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Let\'s learn something today',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: ref.watch(notificationProvider).unreadCount > 0
                ? Badge(
                    label: Text(
                      '${ref.watch(notificationProvider).unreadCount}',
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                    child: const Icon(Icons.notifications_outlined),
                  )
                : const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarContent(UserModel? user, double size) {
    final photoUrl = user?.profilePhoto;
    debugPrint('HomeScreen _buildAvatarContent: profilePhoto=$photoUrl');
    if (photoUrl != null && photoUrl.isNotEmpty) {
      final resolved = ApiConfig.resolveImageUrl(photoUrl);
      debugPrint('HomeScreen _buildAvatarContent: resolved=$resolved');
      if (resolved != null) {
        return ClipOval(
          child: Image.network(
            resolved,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => _buildInitials(user),
          ),
        );
      }
    }
    return _buildInitials(user);
  }

  Widget _buildInitials(UserModel? user) {
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
    return Text(
      initials.toString(),
      style: TextStyle(
        color: AppColors.white,
        fontWeight: FontWeight.w600,
        fontSize: 18,
      ),
    );
  }

  Widget _buildStatsRow(int enrolledCount, int completedCount, int certCount) {
    final stats = [
      _StatItem(icon: Icons.book_outlined, value: '$enrolledCount', label: 'Enrolled', color: AppColors.primary, route: '/courses'),
      _StatItem(icon: Icons.check_circle_outline, value: '$completedCount', label: 'Completed', color: AppColors.success, route: '/courses'),
      _StatItem(icon: Icons.verified_outlined, value: '$certCount', label: 'Certificates', color: AppColors.accent, route: '/certificates'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: stats.map((stat) {
          return GestureDetector(
            onTap: () {
              if (stat.route == '/certificates') {
                Navigator.pushNamed(context, stat.route);
              }
            },
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: stat.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(stat.icon, color: stat.color, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stat.value,
                        style: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        stat.label,
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {VoidCallback? onSeeAll, MainAxisAlignment alignment = MainAxisAlignment.spaceBetween}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
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

  Widget _buildFreeCourses(List<CourseModel> courses) {
    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 16, right: 8),
        itemCount: courses.length,
        itemBuilder: (_, i) => SizedBox(
          width: 180,
          child: Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CourseCard(
              course: courses[i],
              horizontal: true,
              onTap: () => Navigator.pushNamed(context, '/course-detail', arguments: courses[i].slug),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInProgressCourses(List<EnrolledCourseModel> courses) {
    if (courses.isEmpty) return const SizedBox.shrink();

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 16, right: 8),
      shrinkWrap: true,
      itemCount: courses.length,
      itemBuilder: (_, i) => _buildInProgressCard(courses[i]),
    );
  }

  Widget _buildInProgressCard(EnrolledCourseModel course) {
    final colors = [AppColors.primary, AppColors.accent, const Color(0xFF8B5CF6), const Color(0xFF3B82F6), const Color(0xFFEC4989)];
    final color = colors[course.id % colors.length];

    return GestureDetector(
      onTap: () {
        if (course.firstLessonId != null) {
          Navigator.pushNamed(context, '/course-player', arguments: {
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

  Widget _buildMyCourses(List<EnrolledCourseModel> courses) {
    if (courses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.school_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
              const SizedBox(height: 12),
              Text(
                'You haven\'t enrolled in any courses yet.',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.findAncestorStateOfType<MainShellState>()?.switchToTab(1),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: const Text('Browse Courses'),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.85,
        ),
        itemCount: courses.length,
        itemBuilder: (_, i) => _buildCourseGridCard(courses[i]),
      ),
    );
  }

  Widget _buildCourseGridCard(EnrolledCourseModel course) {
    final colors = [AppColors.primary, AppColors.accent, const Color(0xFF8B5CF6), const Color(0xFF3B82F6), const Color(0xFFEC4999)];
    final color = colors[course.id % colors.length];
    final isCompleted = course.progress >= 100;

    return GestureDetector(
      onTap: () {
        if (course.firstLessonId != null) {
          Navigator.pushNamed(context, '/course-player', arguments: {
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 64,
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
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course.course.title,
                    style: AppTextStyles.labelMedium.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  if (isCompleted)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Completed',
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary, fontSize: 9),
                      ),
                    )
                  else ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: course.progress / 100,
                        backgroundColor: AppColors.muted,
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                        minHeight: 4,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (course.totalLessons > 0)
                      Text(
                        '${course.progress.toStringAsFixed(0)}% · ${course.completedLessons}/${course.totalLessons} lessons',
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground, fontSize: 9),
                      )
                    else
                      Text(
                        'No lessons yet',
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

  Widget _buildCertificatesSection(List<CertificateModel> certificates) {
    if (certificates.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
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
        padding: const EdgeInsets.only(left: 16, right: 8),
        itemCount: certificates.length,
        itemBuilder: (_, i) => _buildCertificateCard(certificates[i]),
      ),
    );
  }

  Widget _buildCertificateCard(CertificateModel cert) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/certificate-detail', arguments: cert.id),
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

class _StatItem {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final String route;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.route,
  });
}

class _ShimmerHeader extends StatelessWidget {
  const _ShimmerHeader();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          ShimmerCard(height: 48, width: 48),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerCard(height: 18, width: 160),
                SizedBox(height: 6),
                ShimmerCard(height: 14, width: 140),
              ],
            ),
          ),
        ],
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _ShimmerHeader(),
          const SizedBox(height: 12),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 3,
              itemBuilder: (_, _) => Container(
                width: 140,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  color: AppColors.muted,
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerCard(height: 20),
          ),
          const SizedBox(height: 8),
          const ShimmerHorizontalScroll(count: 3),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerCard(height: 20),
          ),
          const SizedBox(height: 8),
          const ShimmerGrid(count: 4),
        ],
      ),
    );
  }
}