import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(profileProvider.notifier).fetchProfile();
      ref.read(homeDashboardProvider.notifier).fetchDashboard();
    });
  }

  Future<void> _pickAndUploadAvatar() async {
    final file = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
    );
    if (file == null) return;
    await ref.read(profileProvider.notifier).uploadAvatar(file.path);
  }

  String _getInitials(UserModel? user) {
    if (user == null) return '?';
    final parts = user.name.split(' ');
    final buf = StringBuffer();
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      buf.write(parts[0][0].toUpperCase());
    }
    if (parts.length > 1 && parts.last.isNotEmpty) {
      buf.write(parts.last[0].toUpperCase());
    }
    final initials = buf.toString();
    return initials.isNotEmpty ? initials : '?';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final profileState = ref.watch(profileProvider);
    final dashboardState = ref.watch(homeDashboardProvider);
    final user = profileState.user ?? authState.user;
    final isUploading = profileState.isUploadingAvatar;

    if (profileState.isLoading && user == null) {
      return const _ProfileShimmer();
    }

    if (profileState.error != null && user == null) {
      return ErrorDisplayWidget(
        message: profileState.error!,
        onRetry: () => ref.read(profileProvider.notifier).fetchProfile(),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(profileProvider.notifier).fetchProfile();
        await ref.read(homeDashboardProvider.notifier).fetchDashboard();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          children: [
            const SizedBox(height: 8),
            if (profileState.successMessage != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildSuccessBanner(profileState.successMessage!),
              ),
            const SizedBox(height: 16),
            _buildProfileHeader(user, isUploading),
            const SizedBox(height: 20),
            _buildStatsGrid(dashboardState.enrolledCourses, dashboardState.certificates),
            const SizedBox(height: 20),
            _buildMenuItems(context),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: AppColors.success, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.success,
              ),
            ),
          ),
          GestureDetector(
            onTap: () => ref.read(profileProvider.notifier).clearMessages(),
            child: const Icon(Icons.close, size: 16, color: AppColors.success),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(UserModel? user, bool isUploading) {
    final name = user?.name ?? 'User';
    final email = user?.email ?? '';
    final avatarUrl = user?.profilePhoto;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 15,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppColors.primary,
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null
                      ? Text(
                          _getInitials(user),
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: isUploading ? null : _pickAndUploadAvatar,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE7E5ED),
                        shape: BoxShape.circle,
                      ),
                      child: isUploading
                          ? const Padding(
                              padding: EdgeInsets.all(6),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : const Icon(Icons.camera_alt, size: 14, color: Color(0xFF0F172A)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    email,
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
      ),
    );
  }

  Widget _buildStatsGrid(List<EnrolledCourseModel> enrolledCourses, List<CertificateModel> certificates) {
    final completedCourses = enrolledCourses.where((c) => c.progress >= 100).length;
    final certificatesCount = certificates.length;
    final totalHours = enrolledCourses.fold<double>(0, (sum, c) => sum + c.totalHours);
    final hoursStr = totalHours >= 1
        ? totalHours.toStringAsFixed(1)
        : (totalHours * 60).toStringAsFixed(0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.4,
        children: [
          _buildStatCard(
            icon: Icons.book_outlined,
            value: '${enrolledCourses.length}',
            label: 'Courses Enrolled',
          ),
          _buildStatCard(
            icon: Icons.check_circle_outlined,
            value: '$completedCourses',
            label: 'Completed',
          ),
          _buildStatCard(
            icon: Icons.workspace_premium_outlined,
            value: '$certificatesCount',
            label: 'Certificates',
          ),
          _buildStatCard(
            icon: Icons.timer_outlined,
            value: '$hoursStr${totalHours >= 1 ? '' : ' Min'}',
            label: 'Hours Spent',
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
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
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItems(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _buildMenuItemCard(
            icon: Icons.edit_outlined,
            title: 'Edit Profile',
            onTap: () => Navigator.pushNamed(context, '/edit-profile'),
          ),
          const SizedBox(height: 12),
          _buildMenuItemCard(
            icon: Icons.lock_outlined,
            title: user?.isGoogleAccount == true ? 'Set Password' : 'Change Password',
            onTap: () => Navigator.pushNamed(context, '/change-password'),
          ),
          const SizedBox(height: 12),
          _buildMenuItemCard(
            icon: Icons.notifications_outlined,
            title: 'Notification Settings',
            onTap: () => Navigator.pushNamed(context, '/notification-settings'),
          ),
          const SizedBox(height: 12),
          _buildMenuItemCard(
            icon: Icons.settings_outlined,
            title: 'Settings',
            onTap: () => Navigator.pushNamed(context, '/settings'),
          ),
          const SizedBox(height: 12),
          _buildMenuItemCard(
            icon: Icons.logout_rounded,
            title: 'Logout',
            isDestructive: true,
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItemCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    final textColor = isDestructive ? AppColors.destructive : const Color(0xFF0F172A);
    final iconBgColor = isDestructive ? AppColors.destructive.withValues(alpha: 0.1) : const Color(0xFFE7E5ED);
    final iconColor = isDestructive ? AppColors.destructive : const Color(0xFF0F172A);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: textColor,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: const Color(0xFF475569).withValues(alpha: 0.6),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileShimmer extends StatelessWidget {
  const _ProfileShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ShimmerCard(height: 104),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: const [
                ShimmerCard(height: 110),
                ShimmerCard(height: 110),
                ShimmerCard(height: 110),
                ShimmerCard(height: 110),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: List.generate(
                5,
                (index) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ShimmerCard(height: 72),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}