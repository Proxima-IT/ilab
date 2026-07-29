import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pinput/pinput.dart';
import '../../../shared/services/api_client.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../services/auth_service.dart';
import '../widgets/auth_screen_layout.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _authService = AuthService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _otpSent = false;
  bool _loading = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_emailController.text.trim().contains('@')) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    setState(() => _error = null);
    setState(() => _loading = true);
    try {
      await _authService.forgotPassword(identifier: _emailController.text.trim().toLowerCase());
      setState(() => _otpSent = true);
    } catch (e) {
      setState(() => _error = _getErrorMessage(e));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Password confirmation does not match.');
      return;
    }
    setState(() => _error = null);
    setState(() => _loading = true);
    try {
      await _authService.resetPassword(
        identifier: _emailController.text.trim().toLowerCase(),
        otp: _otpController.text.trim(),
        password: _passwordController.text,
        passwordConfirmation: _confirmPasswordController.text,
      );
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
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
    return AuthScreenLayout(
      title: 'Reset your password',
      subtitle: _otpSent
          ? 'Enter the code sent to your email and set a new password.'
          : 'Enter your email and we will send a password reset code.',
      footer: GestureDetector(
        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
        child: RichText(
          text: TextSpan(
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            children: [
              const TextSpan(text: 'Remembered your password? '),
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
        child: _otpSent ? _buildResetForm() : _buildEmailForm(),
      ),
    );
  }

  Widget _buildEmailForm() {
    return Column(
      children: [
        _AuthField(
          label: 'Email',
          controller: _emailController,
          placeholder: 'you@example.com',
          icon: Icons.mail_outline,
          keyboardType: TextInputType.emailAddress,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.destructive.withOpacity( 0.3)),
              borderRadius: BorderRadius.circular(12),
              color: AppColors.destructive.withOpacity( 0.05),
            ),
            child: Text(
              _error!,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.destructive),
            ),
          ),
        ],
        const SizedBox(height: 20),
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
                  color: AppColors.accent.withOpacity( 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: _loading ? null : _sendOtp,
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
                        const Icon(Icons.send, size: 16, color: AppColors.white),
                        const SizedBox(width: 8),
                        Text(
                          'Send reset code',
                          style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white, fontSize: 15),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResetForm() {
    return Column(
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
              border: Border.all(color: AppColors.accent.withOpacity( 0.4), width: 2),
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
        _AuthField(
          label: 'New password',
          controller: _passwordController,
          placeholder: 'Enter new password',
          icon: Icons.lock_outline,
          obscureText: !_showPassword,
          suffix: IconButton(
            icon: Icon(
              _showPassword ? Icons.visibility_off : Icons.visibility,
              size: 18,
              color: AppColors.mutedForeground,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          validator: (v) => v == null || v.isEmpty ? 'Please enter a new password' : null,
        ),
        const SizedBox(height: 14),
        _AuthField(
          label: 'Confirm new password',
          controller: _confirmPasswordController,
          placeholder: 'Repeat new password',
          icon: Icons.lock_outline,
          obscureText: !_showPassword,
          validator: (v) => v == null || v.isEmpty ? 'Please confirm your password' : null,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.destructive.withOpacity( 0.3)),
              borderRadius: BorderRadius.circular(12),
              color: AppColors.destructive.withOpacity( 0.05),
            ),
            child: Text(
              _error!,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.destructive),
            ),
          ),
        ],
        const SizedBox(height: 20),
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
                  color: AppColors.accent.withOpacity( 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: _loading ? null : _resetPassword,
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
                          'Reset Password',
                          style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white, fontSize: 15),
                        ),
                      ],
                    ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _sendOtp,
          child: Text(
            'Resend code',
            style: AppTextStyles.labelLarge.copyWith(color: AppColors.accent),
          ),
        ),
      ],
    );
  }
}

class _AuthField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String placeholder;
  final IconData icon;
  final bool obscureText;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _AuthField({
    required this.label,
    required this.controller,
    required this.placeholder,
    required this.icon,
    this.obscureText = false,
    this.suffix,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelLarge.copyWith(fontSize: 13),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          style: AppTextStyles.bodyMedium,
          decoration: InputDecoration(
            hintText: placeholder,
            prefixIcon: Icon(icon, size: 18, color: AppColors.mutedForeground),
            suffixIcon: suffix,
            filled: true,
            fillColor: AppColors.card,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground.withOpacity( 0.7)),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accent.withOpacity( 0.4), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.destructive),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.destructive),
            ),
          ),
        ),
      ],
    );
  }
}