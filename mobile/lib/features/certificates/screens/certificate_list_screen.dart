import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
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

    return RefreshIndicator(
      onRefresh: () => ref.read(certificateProvider.notifier).fetchCertificates(),
      child: _buildBody(state),
    );
  }

  Widget _buildBody(CertificateListState state) {
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
      return const _EmptyCertificates();
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildHeader(),
        const SizedBox(height: 16),
        ...state.certificates.map((cert) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildCertificateCard(cert),
        )),
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
}

class _EmptyCertificates extends StatelessWidget {
  const _EmptyCertificates();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 32),
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
}