import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/screens/main_shell.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
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

  String _firstName(String fullName) {
    return fullName.split(' ').first;
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🔤 Active Font: ${DefaultTextStyle.of(context).style.fontFamily}');
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
    final totalHours = state.enrolledCourses.fold<double>(0, (sum, c) => sum + c.totalHours);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          _buildCustomHeader(state),
          const SizedBox(height: 20),
          _buildGreeting(state, userName),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _buildHeroCard(),
          ),
          const SizedBox(height: 20),
          _buildStatsGrid(state.enrolledCourses.length, totalHours),
          const SizedBox(height: 20),
          if (inProgress.isNotEmpty) ...[
            _buildActiveLesson(inProgress.first),
            const SizedBox(height: 20),
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

  Widget _buildCustomHeader(HomeDashboardState state) {
    final user = state.user;
    final unreadCount = ref.watch(notificationProvider).unreadCount;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.findAncestorStateOfType<MainShellState>()?.openDrawer(),
            child: Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                color: Color(0xFFE7E5ED),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.menu_rounded, color: AppColors.foreground),
            ),
          ),
          const Spacer(),
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
          const SizedBox(width: 16),
          _buildAvatar(user, 40),
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

  Widget _buildGreeting(HomeDashboardState state, String userName) {
    final user = state.user;
    final firstName = user != null ? _firstName(user.name) : 'Student';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: AppTextStyles.titleLarge.copyWith(fontSize: 28),
              children: [
                TextSpan(
                  text: 'Hello, ',
                  style: const TextStyle(fontWeight: FontWeight.w300, color: AppColors.foreground),
                ),
                TextSpan(
                  text: '$firstName!',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.foreground),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          RichText(
            text: TextSpan(
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              children: [
                const TextSpan(text: 'Welcome to '),
                TextSpan(
                  text: 'iLab',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: ' — Learn. Build. Earn.'),
              ],
            ),
          ),
        ],
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

  Widget _buildStatsGrid(int enrolledCount, double totalHours) {
    final hoursStr = totalHours >= 1
        ? '${totalHours.toStringAsFixed(1)} Hours'
        : '${(totalHours * 60).toStringAsFixed(0)} Min';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              icon: Icons.book_outlined,
              value: '$enrolledCount',
              label: 'Courses Enrolled',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              icon: Icons.timer_outlined,
              value: hoursStr,
              label: 'Hours Spent',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({required IconData icon, required String value, required String label}) {
    return Container(
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
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTextStyles.titleLarge.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTextStyles.labelMedium.copyWith(color: AppColors.mutedForeground),
          ),
        ],
      ),
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
                Navigator.pushNamed(context, '/course-player', arguments: {
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
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
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          for (int i = 0; i < courses.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            _buildMyCourseCard(courses[i]),
          ],
        ],
      ),
    );
  }

  Widget _buildMyCourseCard(EnrolledCourseModel course) {
    final hasImage = course.course.thumbnailUrl != null && course.course.thumbnailUrl!.isNotEmpty;
    final isCompleted = course.progress >= 100;
    final hoursStr = course.totalHours >= 1
        ? '${course.totalHours.toStringAsFixed(1)}h'
        : '${(course.totalHours * 60).toStringAsFixed(0)}min';

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
        height: 180,
        width: double.infinity,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Stack(
          children: [
            if (hasImage)
              Image.network(
                course.course.thumbnailUrl!,
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
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course.course.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if (course.totalLessons > 0)
                    Text(
                      '${course.completedLessons}/${course.totalLessons} lessons \u00b7 ${course.progress.toStringAsFixed(0)}%',
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    )
                  else
                    const Text(
                      'No lessons yet',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  if (isCompleted)
                    const Text(
                      'Completed',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: course.progress / 100,
                      backgroundColor: Colors.white.withValues(alpha: 0.3),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    hoursStr,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
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

class _DashboardShimmer extends StatelessWidget {
  const _DashboardShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const ShimmerCard(height: 48, width: 48),
                const Spacer(),
                const ShimmerCard(height: 28, width: 28),
                const SizedBox(width: 16),
                const ShimmerCard(height: 40, width: 40),
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