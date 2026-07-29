import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/enrolled_course_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final profileState = ref.watch(profileProvider);
    final dashboardState = ref.watch(homeDashboardProvider);
    final user = profileState.user ?? authState.user;
    final isUploading = profileState.isUploadingAvatar;

    if (profileState.isLoading && user == null) {
      return const LoadingWidget();
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
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (profileState.successMessage != null)
            _buildSuccessBanner(profileState.successMessage!),
          _buildProfileHeader(user, isUploading),
          const SizedBox(height: 24),
          _buildStatsRow(dashboardState.enrolledCourses, dashboardState.certificates, user),
          const SizedBox(height: 24),
          _buildMenuItems(context),
        ],
      ),
    );
  }

  Widget _buildSuccessBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.success),
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

    return Center(
      child: Column(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 50,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null
                    ? Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: AppTextStyles.displaySmall.copyWith(
                          color: AppColors.primary,
                          fontSize: 40,
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
                    width: 32,
                    height: 32,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: isUploading
                        ? const Padding(
                            padding: EdgeInsets.all(6),
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(name, style: AppTextStyles.titleLarge.copyWith(fontSize: 20)),
          const SizedBox(height: 4),
          Text(
            email,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 14,
            ),
          ),
          if (user?.district != null && user!.district!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                user.district!,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(List<EnrolledCourseModel> enrolledCourses, List<CertificateModel> certificates, UserModel? user) {
    final completedCourses = enrolledCourses.where((c) => c.progress >= 100).length;
    final certificatesCount = certificates.length;
    final totalHours = enrolledCourses.fold<double>(0, (sum, c) => sum + c.totalHours);

    final stats = [
      _StatData(icon: Icons.book, label: '${enrolledCourses.length} Courses Enrolled', color: AppColors.primary),
      _StatData(icon: Icons.check_circle, label: '$completedCourses Course Complete', color: AppColors.success),
      _StatData(icon: Icons.workspace_premium, label: '$certificatesCount Certificates অর্জিত', color: const Color(0xFFF59E0B)),
      _StatData(icon: Icons.timer, label: '${totalHours.toStringAsFixed(1)} Hours Spent', color: AppColors.accent),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            'Statistics',
            style: AppTextStyles.titleMedium.copyWith(color: AppColors.foreground),
          ),
        ),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: stats.map((stat) => _buildStatCard(stat)).toList(),
        ),
      ],
    );
  }

  Widget _buildStatCard(_StatData stat) {
    return Container(
      width: (MediaQuery.of(context).size.width - 52) / 2,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: stat.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(stat.icon, size: 18, color: stat.color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              stat.label,
              style: AppTextStyles.labelMedium.copyWith(
                color: AppColors.foreground,
                fontSize: 11,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItems(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            'Settings',
            style: AppTextStyles.titleMedium.copyWith(color: AppColors.foreground),
          ),
        ),
        Card(
          elevation: 0,
          color: AppColors.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              _buildMenuItem(
                icon: Icons.edit,
                title: 'Edit Profile',
                onTap: () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              const Divider(height: 1, indent: 56),
              _buildMenuItem(
                icon: Icons.lock,
                title: user?.isGoogleAccount == true ? 'Set Password' : 'Change Password',
                onTap: () => Navigator.pushNamed(context, '/change-password'),
              ),
              const Divider(height: 1, indent: 56),
              _buildMenuItem(
                icon: Icons.notifications,
                title: 'Notification Settings',
                onTap: () => Navigator.pushNamed(context, '/notification-settings'),
              ),
              const Divider(height: 1, indent: 56),
              _buildMenuItem(
                icon: Icons.logout,
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
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    final color = isDestructive ? AppColors.destructive : AppColors.foreground;
    final iconColor = isDestructive ? AppColors.destructive : AppColors.primary;

    return ListTile(
      leading: Icon(icon, color: iconColor, size: 22),
      title: Text(
        title,
        style: AppTextStyles.bodyMedium.copyWith(
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: AppColors.mutedForeground.withValues(alpha: 0.6),
        size: 20,
      ),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    );
  }
}

class _StatData {
  final IconData icon;
  final String label;
  final Color color;

  const _StatData({
    required this.icon,
    required this.label,
    required this.color,
  });
}