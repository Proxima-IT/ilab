import 'package:flutter/material.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';

class AuthScreenLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final Widget footer;
  final bool compact;

  const AuthScreenLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.footer,
    this.compact = false,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 900;
          if (isWide) return _buildWideLayout();
          return _buildNarrowLayout();
        },
      ),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      children: [
        Expanded(child: _buildLeftPanel()),
        Expanded(child: _buildRightPanel()),
      ],
    );
  }

  Widget _buildNarrowLayout() {
    return SingleChildScrollView(
      child: _buildRightPanel(),
    );
  }

  Widget _buildLeftPanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.primary, AppColors.primaryDark],
        ),
      ),
      padding: EdgeInsets.all(compact ? 32 : 48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.white.withValues(alpha:0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    'i',
                    style: AppTextStyles.headlineSmall.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'iLab',
                style: AppTextStyles.titleLarge.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.white.withValues(alpha:0.15),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              'Join 25,000+ learners',
              style: AppTextStyles.labelMedium.copyWith(color: AppColors.white),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Build a future-ready career with iLab.',
            style: (compact ? AppTextStyles.headlineSmall : AppTextStyles.headlineLarge).copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: compact ? 16 : 24),
          _buildBullet('Live mentors from top tech companies'),
          SizedBox(height: compact ? 8 : 12),
          _buildBullet('Hands-on, project-based curriculum'),
          SizedBox(height: compact ? 8 : 12),
          _buildBullet('Job assistance and interview prep'),
          const Spacer(),
          Text(
            '© 2026 iLab. Future-ready learning.',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.white.withValues(alpha:0.8)),
          ),
        ],
      ),
    );
  }

  Widget _buildBullet(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AppColors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: (compact ? AppTextStyles.bodyMedium : AppTextStyles.bodyLarge).copyWith(
              color: AppColors.white.withValues(alpha:0.9),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel() {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: 24,
        vertical: compact ? 20 : 40,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: (compact ? AppTextStyles.headlineSmall : AppTextStyles.headlineMedium).copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: compact ? 4 : 8),
                Text(
                  subtitle,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                ),
                SizedBox(height: compact ? 20 : 32),
                child,
                SizedBox(height: compact ? 16 : 24),
                Center(
                  child: Text(
                    '',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                  ),
                ),
                footer,
              ],
            ),
          ),
        ],
      ),
    );
  }
}