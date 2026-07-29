import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../providers/certificate_provider.dart';

class CertificateListScreen extends ConsumerStatefulWidget {
  const CertificateListScreen({super.key});

  @override
  ConsumerState<CertificateListScreen> createState() => _CertificateListScreenState();
}

class _CertificateListScreenState extends ConsumerState<CertificateListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(certificateProvider.notifier).fetchCertificates());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(certificateProvider);
    final dashboardState = ref.watch(homeDashboardProvider);

    final certificateCourseIds = state.certificates
        .map((c) => c.courseName)
        .whereType<String>()
        .toSet();
    final inProgress = dashboardState.enrolledCourses
        .where((c) => c.progress < 100 && !certificateCourseIds.contains(c.course.title))
        .toList();

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(certificateProvider.notifier).fetchCertificates();
        await ref.read(homeDashboardProvider.notifier).fetchDashboard();
      },
      child: _buildBody(state, inProgress),
    );
  }

  Widget _buildBody(CertificateListState state, List<EnrolledCourseModel> inProgress) {
    if (state.isLoading && state.certificates.isEmpty) {
      return const LoadingWidget();
    }
    if (state.error != null && state.certificates.isEmpty) {
      return ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(certificateProvider.notifier).fetchCertificates(),
      );
    }
    if (state.certificates.isEmpty) {
      return _EmptyCertificates(inProgressCourses: inProgress);
    }
    return ListView(
      padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
      children: [
        _buildHeader(),
        const SizedBox(height: 16),
        ...state.certificates.map((cert) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildCertificateCard(cert),
        )),
        if (inProgress.isNotEmpty) ...[
          const SizedBox(height: 8),
          _buildInProgressSection(inProgress),
        ],
      ],
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'My Certificates',
          style: AppTextStyles.titleLarge,
        ),
        const SizedBox(height: 4),
        Text(
          'Certificates you have earned from completed courses.',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
        ),
      ],
    );
  }

  Widget _buildCertificateCard(dynamic cert) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.verified, color: AppColors.primary, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    cert.courseName ?? 'Course Certificate',
                    style: AppTextStyles.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  if (cert.issuedAt != null)
                    Text(
                      'Issued: ${cert.issuedAt}',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                    ),
                  if (cert.verificationCode != null)
                    Text(
                      'Code: ${cert.verificationCode}',
                      style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
                    ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.mutedForeground),
          ],
        ),
      ),
    );
  }

  Widget _buildInProgressSection(List<EnrolledCourseModel> courses) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'In Progress',
          style: AppTextStyles.titleMedium,
        ),
        const SizedBox(height: 12),
        ...courses.map((course) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildInProgressCard(course),
        )),
      ],
    );
  }

  Widget _buildInProgressCard(EnrolledCourseModel course) {
    final isEligible = course.progress >= 90;
    final remaining = 100 - course.progress;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: (isEligible ? AppColors.accent : AppColors.primary).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isEligible ? Icons.verified_outlined : Icons.lock_outline,
                    color: isEligible ? AppColors.accent : AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    course.course.title,
                    style: AppTextStyles.titleSmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: course.progress / 100,
                minHeight: 6,
                backgroundColor: AppColors.muted,
                valueColor: AlwaysStoppedAnimation(
                  isEligible ? AppColors.accent : AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isEligible
                  ? '${course.progress.toInt()}% complete - certificate eligible'
                  : '${course.progress.toInt()}% complete - ${remaining.toInt()}% more to earn certificate',
              style: AppTextStyles.bodySmall.copyWith(
                color: isEligible ? AppColors.accent : AppColors.mutedForeground,
                fontWeight: isEligible ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCertificates extends StatelessWidget {
  final List<EnrolledCourseModel> inProgressCourses;

  const _EmptyCertificates({this.inProgressCourses = const []});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildHeaderSection(),
        const SizedBox(height: 48),
        Center(
          child: Column(
            children: [
              Icon(Icons.verified_outlined, size: 64, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              Text('No certificates yet', style: AppTextStyles.titleMedium),
              const SizedBox(height: 8),
              Text(
                'Complete courses to earn certificates.',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              ),
            ],
          ),
        ),
        if (inProgressCourses.isNotEmpty) ...[
          const SizedBox(height: 32),
          _buildInProgressSection(),
        ],
      ],
    );
  }

  Widget _buildHeaderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'My Certificates',
          style: AppTextStyles.titleLarge,
        ),
        const SizedBox(height: 4),
        Text(
          'Certificates you have earned from completed courses.',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
        ),
      ],
    );
  }

  Widget _buildInProgressSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'In Progress',
          style: AppTextStyles.titleMedium,
        ),
        const SizedBox(height: 12),
        ...inProgressCourses.map((course) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _InProgressCard(course: course),
        )),
      ],
    );
  }
}

class _InProgressCard extends StatelessWidget {
  final EnrolledCourseModel course;

  const _InProgressCard({required this.course});

  @override
  Widget build(BuildContext context) {
    final isEligible = course.progress >= 90;
    final remaining = 100 - course.progress;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: (isEligible ? AppColors.accent : AppColors.primary).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isEligible ? Icons.verified_outlined : Icons.lock_outline,
                    color: isEligible ? AppColors.accent : AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    course.course.title,
                    style: AppTextStyles.titleSmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: course.progress / 100,
                minHeight: 6,
                backgroundColor: AppColors.muted,
                valueColor: AlwaysStoppedAnimation(
                  isEligible ? AppColors.accent : AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isEligible
                  ? '${course.progress.toInt()}% complete - certificate eligible'
                  : '${course.progress.toInt()}% complete - ${remaining.toInt()}% more to earn certificate',
              style: AppTextStyles.bodySmall.copyWith(
                color: isEligible ? AppColors.accent : AppColors.mutedForeground,
                fontWeight: isEligible ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}