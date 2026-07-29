import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 16),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 0, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Settings',
                  style: AppTextStyles.titleLarge.copyWith(color: AppColors.foreground),
                ),
                const SizedBox(height: 2),
                Text(
                  'Manage your app preferences',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                ),
              ],
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
                  icon: Icons.info_outline,
                  title: 'About iLab',
                  onTap: () => _showAboutDialog(context),
                ),
                const Divider(height: 1, indent: 56),
                _buildMenuItem(
                  icon: Icons.notifications_outlined,
                  title: 'Notification Settings',
                  onTap: () => Navigator.pushNamed(context, '/notification-settings'),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.info, color: AppColors.primary, size: 22),
                  title: Text(
                    'App Version',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.foreground,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  trailing: Text(
                    '1.0.0',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Column(
          children: [
            Icon(Icons.science_outlined, color: AppColors.primary, size: 48),
            const SizedBox(height: 12),
            Text(
              'iLab',
              style: AppTextStyles.titleLarge.copyWith(color: AppColors.foreground),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Version 1.0.0',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Learn. Build. Earn.',
              style: AppTextStyles.bodyLarge.copyWith(color: AppColors.foreground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'Powered by iLab BD',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: AppTextStyles.buttonMedium.copyWith(color: AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(
        title,
        style: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.foreground,
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