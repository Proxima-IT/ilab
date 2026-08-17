import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/screens/main_shell.dart';
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
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          _buildHeader(),
          const SizedBox(height: 20),
          if (state.certificates.isEmpty)
            _buildEmptyState(inProgress)
          else ...[
            ...state.certificates.map((cert) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, '/certificate-detail',
                    arguments: cert,
                  );
                },
                child: _buildCertificateCard(cert),
              ),
            )),
          ],
          if (inProgress.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildInProgressSection(inProgress),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              context.findAncestorStateOfType<MainShellState>()?.switchToTab(0);
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
                'My Certificates',
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

  Widget _buildCertificateCard(dynamic cert) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 15,
              spreadRadius: 1,
            ),
          ],
        ),
        child: IntrinsicHeight(
          child: Row(
            children: [
              Container(
                width: 4,
                height: double.infinity,
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      cert.courseName ?? 'Course Certificate',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172A),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (cert.issuedAt != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        cert.issuedAt!,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                    if (cert.verificationCode != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Code: ${cert.verificationCode}',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInProgressSection(List<EnrolledCourseModel> courses) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'In Progress',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          ...courses.map((course) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildInProgressCard(course),
          )),
        ],
      ),
    );
  }

  Widget _buildInProgressCard(EnrolledCourseModel course) {
    final hasImage = course.course.thumbnailUrl != null && course.course.thumbnailUrl!.isNotEmpty;

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
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: course.progress / 100,
                      backgroundColor: Colors.white.withValues(alpha: 0.3),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${course.progress.toStringAsFixed(0)}% complete',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
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

  Widget _buildEmptyState(List<EnrolledCourseModel> inProgress) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          const SizedBox(height: 48),
          Center(
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.muted,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.workspace_premium_outlined,
                    size: 64,
                    color: AppColors.mutedForeground.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'No certificates yet',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Complete a course to earn certificates',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ),
          ],
      ),
    );
  }
}