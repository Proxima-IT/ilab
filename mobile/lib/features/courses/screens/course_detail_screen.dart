import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';

import '../../../shared/models/course_model.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../enrollment/providers/enrollment_provider.dart';
import '../../enrollment/screens/payment_webview.dart';
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
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
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
      body: Column(
        children: [
          SafeArea(
            top: true,
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: _buildHero(course),
              ),
            ),
          ),
          _buildTabBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _AboutTab(detail: detail),
                _CurriculumTab(detail: detail),
                _ReviewsTab(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(detail, slug),
    );
  }

  Widget _buildTabBar() {
    final tabs = ['About', 'Curriculum', 'Reviews'];
    return Container(
      color: AppColors.white,
      child: Column(
        children: [
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final tabWidth = constraints.maxWidth / 3;
                return SizedBox(
                  height: 40,
                  child: Stack(
                    children: [
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                        left: _tabController.index * tabWidth + 4,
                        top: 0,
                        bottom: 0,
                        child: Container(
                          width: tabWidth - 8,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                      Row(
                        children: List.generate(3, (i) {
                          final isActive = _tabController.index == i;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => _tabController.animateTo(i),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                child: Text(
                                  tabs[i],
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isActive ? AppColors.primary : AppColors.mutedForeground,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 4),
          Divider(height: 1, color: AppColors.border),
        ],
      ),
    );
  }

  Widget _buildHero(CourseModel course) {
    final hasImage = course.thumbnailUrl != null && course.thumbnailUrl!.isNotEmpty;

    return SizedBox(
      height: 220,
      child: Stack(
        children: [
          if (hasImage)
            Image.network(
              course.thumbnailUrl!,
              width: double.infinity,
              height: 220,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _heroPlaceholder(),
            )
          else
            _heroPlaceholder(),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.center,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.6)],
                ),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: Color(0xFFE7E5ED),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Color(0xFF1A1A1A), size: 22),
              ),
            ),
          ),
          if (course.category != null || course.isFree || !course.isFree)
            Positioned(
              right: 16,
              bottom: 52,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (course.category != null)
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        course.category!,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: course.isFree ? AppColors.success : AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      course.isFree ? 'Free' : '৳${course.effectivePrice.toStringAsFixed(0)}',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Positioned(
            left: 16,
            right: 130,
            bottom: 16,
            child: Text(
              course.title,
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                height: 1.2,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroPlaceholder() {
    return Container(
      width: double.infinity,
      height: 220,
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

  Widget _buildBottomBar(CourseDetailModel detail, String slug) {
    final course = detail.course;
    final dashboardState = ref.watch(homeDashboardProvider);
    final checkoutState = ref.watch(enrollmentProvider);

    final matchingEnrollment = dashboardState.enrolledCourses.where(
      (e) => e.course.slug == course.slug && e.status != 'suspended' && e.status != 'expired',
    ).firstOrNull;
    final isEnrolled = matchingEnrollment != null;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          if (!isEnrolled)
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  course.isFree ? 'Free' : '৳${course.effectivePrice.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
                if (course.hasDiscount)
                  Text(
                    '৳${course.price.toStringAsFixed(0)}',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: AppColors.mutedForeground,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
              ],
            ),
          const Spacer(),
          Expanded(
            child: SizedBox(
              height: 48,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: checkoutState.isLoading
                      ? null
                      : isEnrolled
                          ? () {
                              final lessonId = matchingEnrollment.firstLessonId;
                              if (lessonId == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('No lessons available for this course yet.')),
                                );
                                return;
                              }
                              Navigator.pushNamed(
                                context,
                                '/lesson-player',
                                arguments: {
                                  'slug': course.slug,
                                  'lessonId': lessonId,
                                },
                              );
                            }
                          : () => _handleEnroll(course, slug),
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isEnrolled
                            ? [AppColors.success, const Color(0xFF16A34A)]
                            : [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Center(
                      child: checkoutState.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              isEnrolled
                                  ? 'Continue Learning'
                                  : 'Enroll Now',
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleEnroll(CourseModel course, String slug) async {
    final notifier = ref.read(enrollmentProvider.notifier);
    notifier.reset();

    final invoiceId = await notifier.initiateCheckout(courseId: course.id);

    if (!mounted) return;

    final state = ref.read(enrollmentProvider);

    if (state.isFree && invoiceId != null) {
      _showSuccessDialog(invoiceId);
      ref.read(homeDashboardProvider.notifier).fetchDashboard();
      ref.read(courseDetailProvider(slug).notifier).fetchDetail(slug);
      return;
    }

    if (state.status == CheckoutStatus.error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.errorMessage ?? 'Checkout failed.'),
          backgroundColor: AppColors.destructive,
        ),
      );
      return;
    }

    if (state.paymentUrl == null) return;

    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => PaymentWebViewScreen(
          paymentUrl: state.paymentUrl!,
          invoiceId: invoiceId ?? '',
        ),
      ),
    );

    if (!mounted) return;

    if (result == null) {
      notifier.onPaymentCancelled();
      return;
    }

    final success = result['success'] == true;
    final cancelled = result['cancelled'] == true;
    final resolvedInvoiceId = result['invoice_id'] as String? ?? invoiceId ?? '';
    final error = result['error'] as String?;

    if (success) {
      notifier.onPaymentSuccess(resolvedInvoiceId);
      _showSuccessDialog(resolvedInvoiceId);
      ref.read(homeDashboardProvider.notifier).fetchDashboard();
      ref.read(courseDetailProvider(slug).notifier).fetchDetail(slug);
    } else if (cancelled) {
      notifier.onPaymentCancelled();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Payment was cancelled.'),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      notifier.onPaymentError(error ?? 'Payment was not completed.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Payment was not completed.'),
          backgroundColor: AppColors.destructive,
        ),
      );
    }
  }

  void _showSuccessDialog(String invoiceId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.check_circle, color: AppColors.success),
            const SizedBox(width: 8),
            const Text('Enrolled Successfully'),
          ],
        ),
        content: Text('You have been enrolled in this course. Invoice #$invoiceId'),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  final CourseDetailModel detail;

  const _AboutTab({required this.detail});

  @override
  Widget build(BuildContext context) {
    final course = detail.course;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),

          if (detail.instructor != null) ...[
            _sectionTitle('Instructor'),
            const SizedBox(height: 12),
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
                    radius: 24,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage: detail.instructorAvatar != null
                        ? NetworkImage(detail.instructorAvatar!)
                        : null,
                    child: detail.instructorAvatar == null
                        ? Text(
                            detail.instructor![0].toUpperCase(),
                            style: AppTextStyles.titleMedium.copyWith(color: AppColors.primary),
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
                          const SizedBox(height: 2),
                          Text(
                            detail.instructorBio!,
                            style: AppTextStyles.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (detail.instructorCoursesCount > 0 || detail.instructorStudentsCount > 0) ...[
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

          if (detail.learningOutcomes.isNotEmpty) ...[
            _sectionTitle('Learning Outcomes'),
            const SizedBox(height: 12),
            ...detail.learningOutcomes.map((outcome) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, size: 12, color: AppColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      outcome,
                      style: AppTextStyles.bodyMedium.copyWith(height: 1.5),
                    ),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 24),
          ],

          if (detail.prerequisites.isNotEmpty) ...[
            _sectionTitle('Prerequisites'),
            const SizedBox(height: 12),
            ...detail.prerequisites.map((req) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 7),
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.mutedForeground,
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

          if (course.description != null && course.description!.isNotEmpty) ...[
            _sectionTitle('Description'),
            const SizedBox(height: 12),
            Text(
              course.description!.replaceAll(RegExp(r'<[^>]*>'), ''),
              style: AppTextStyles.bodyMedium.copyWith(height: 1.7, color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 24),
          ],

          if (detail.tags.isNotEmpty) ...[
            _sectionTitle('Tags'),
            const SizedBox(height: 12),
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
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
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
          const SizedBox(height: 16),
          ...detail.sections.map((section) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildSectionTile(section),
          )),
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

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() {
              if (expanded) {
                _expandedSections.remove(section.id);
              } else {
                _expandedSections.add(section.id);
              }
            }),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 200),
                    turns: expanded ? 0.25 : 0,
                    child: Icon(Icons.chevron_right, size: 20, color: AppColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      section.title,
                      style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${section.lessons.length}',
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
      ),
    );
  }

  Widget _buildLessonTile(CourseLesson lesson) {
    return Container(
      padding: const EdgeInsets.only(left: 50, right: 16, top: 12, bottom: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border.withValues(alpha: 0.3))),
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
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Preview',
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
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
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.rate_review_outlined, size: 28, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text(
              'No reviews yet',
              style: AppTextStyles.titleMedium.copyWith(color: AppColors.foreground),
            ),
            const SizedBox(height: 8),
            Text(
              'Reviews will appear here once students complete the course.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              textAlign: TextAlign.center,
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
          const ShimmerCard(height: 220, width: double.infinity),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                const ShimmerCard(height: 36, width: 80, margin: EdgeInsets.only(right: 8)),
                const ShimmerCard(height: 36, width: 60, margin: EdgeInsets.only(right: 8)),
                const ShimmerCard(height: 36, width: 70),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 60, width: double.infinity),
          ),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 20, width: 150),
          ),
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 80, width: double.infinity),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 20, width: 180),
          ),
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 24, width: double.infinity),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 24, width: double.infinity),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 24, width: 200),
          ),
        ],
      ),
    );
  }
}