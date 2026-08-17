import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pinput/pinput.dart';
import '../../../shared/services/api_client.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../widgets/auth_screen_layout.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _authService = AuthService();
  final _otpController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;

  String get _email => ModalRoute.of(context)?.settings.arguments as String? ?? '';

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    if (!_formKey.currentState!.validate()) return;
    if (_otpController.text.trim().length < 6) {
      setState(() => _error = 'Please enter the complete verification code.');
      return;
    }
    setState(() => _error = null);
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).verifyEmail(
        email: _email,
        otp: _otpController.text.trim(),
      );
    } catch (e) {
      setState(() => _error = _getErrorMessage(e));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resendOtp() async {
    setState(() => _error = null);
    setState(() => _loading = true);
    try {
      await _authService.resendOtp(email: _email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code resent to your email.')),
        );
      }
    } catch (e) {
      setState(() => _error = _getErrorMessage(e));
    } finally {
      setState(() => _loading = false);
    }
  }

  String _getErrorMessage(dynamic error) {
    if (error is DioException) {
      final apiException = error.error;
      if (apiException is ApiException) {
        return apiException.message;
      }

      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Unable to connect to server. Please try again.';
      }

      final response = error.response;
      if (response?.data is Map<String, dynamic>) {
        final data = response!.data as Map<String, dynamic>;
        if (data['message'] is String && (data['message'] as String).isNotEmpty) {
          return data['message'] as String;
        }
        if (data['errors'] is Map) {
          final firstField = (data['errors'] as Map).values.firstWhere(
            (e) => e is List && e.isNotEmpty,
            orElse: () => null,
          );
          if (firstField != null) {
            return (firstField as List).first.toString();
          }
        }
      }
    }
    return 'An error occurred. Please try again.';
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.status == AuthStatus.authenticated) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    });

    return AuthScreenLayout(
      title: 'Verify your email',
      subtitle: 'Enter the verification code sent to\n$_email',
      footer: GestureDetector(
        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
        child: RichText(
          text: TextSpan(
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            children: [
              const TextSpan(text: 'Go back to '),
              TextSpan(
                text: 'Log in',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            Pinput(
              controller: _otpController,
              length: 6,
              defaultPinTheme: PinTheme(
                width: 48,
                height: 54,
                textStyle: AppTextStyles.headlineSmall.copyWith(fontWeight: FontWeight.w600),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              focusedPinTheme: PinTheme(
                width: 48,
                height: 54,
                textStyle: AppTextStyles.headlineSmall.copyWith(fontWeight: FontWeight.w600),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: AppColors.accent.withOpacity(0.4), width: 2),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              errorPinTheme: PinTheme(
                width: 48,
                height: 54,
                textStyle: AppTextStyles.headlineSmall.copyWith(fontWeight: FontWeight.w600),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: AppColors.destructive),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.destructive.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.destructive.withOpacity(0.05),
                ),
                child: Text(
                  _error!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.destructive),
                ),
              ),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  gradient: const LinearGradient(
                    colors: [AppColors.accent, AppColors.accentLight],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accent.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: _loading ? null : _verifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    disabledBackgroundColor: Colors.transparent,
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Verify Email',
                              style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white, fontSize: 15),
                            ),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _loading ? null : _resendOtp,
              child: Text(
                'Resend code',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.accent),
              ),
            ),
          ],
        ),
      ),
    );
  }
}