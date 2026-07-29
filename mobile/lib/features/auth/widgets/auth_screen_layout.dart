import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';

const Color _authPrimary = Color(0xFFF46423);
const Color _authPrimaryDark = Color(0xFFD4541C);

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
        Expanded(child: _buildRightPanel(isWide: true)),
      ],
    );
  }

  Widget _buildNarrowLayout() {
    return SingleChildScrollView(
      child: _buildRightPanel(isWide: false),
    );
  }

  Widget _buildLeftPanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [_authPrimary, _authPrimaryDark],
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
                  color: AppColors.white.withValues(alpha: 0.2),
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
              color: AppColors.white.withValues(alpha: 0.15),
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
            '\u00a9 2026 iLab. Future-ready learning.',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.white.withValues(alpha: 0.8)),
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
              color: AppColors.white.withValues(alpha: 0.9),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel({bool isWide = false}) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: 24,
        vertical: isWide ? (compact ? 20 : 40) : 0,
      ),
      child: SafeArea(
        top: !isWide,
        bottom: !isWide,
        child: Column(
crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (!isWide) ...[
              const SizedBox(height: 40),
              _buildBrandingSection(),
              const SizedBox(height: 40),
            ],
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 448),
              child: Column(
                crossAxisAlignment: isWide ? CrossAxisAlignment.start : CrossAxisAlignment.stretch,
                children: [
                  if (isWide) ...[
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
                  ],
                  child,
                  const SizedBox(height: 16),
                  Center(child: footer),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBrandingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Image.asset(
            'assets/images/ilab_logo.jpeg',
            width: 80,
            height: 80,
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Welcome to iLab',
          style: GoogleFonts.outfit(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Learn. Build. Earn.',
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: AppColors.mutedForeground,
          ),
        ),
      ],
    );
  }
}