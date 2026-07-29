import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/screens/webview_screen.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_screen_layout.dart';

const Color _authPrimary = Color(0xFFF46423);
const Color _authPrimaryDark = Color(0xFFD4541C);

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _showPassword = false;
  bool _agree = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  int _scorePassword(String pw) {
    int score = 0;
    if (pw.length >= 8) score++;
    if (RegExp(r'[A-Za-z]').hasMatch(pw)) score++;
    if (RegExp(r'\d').hasMatch(pw)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(pw)) score++;
    return score;
  }

  String get _strengthLabel {
    final score = _scorePassword(_passwordController.text);
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score.clamp(0, 4)];
  }

  Color get _strengthColor {
    final score = _scorePassword(_passwordController.text);
    const colors = [
      AppColors.destructive,
      AppColors.destructive,
      AppColors.warning,
      AppColors.primary,
      AppColors.success,
    ];
    return colors[score.clamp(0, 4)];
  }

  void _onSubmit() {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password confirmation does not match.')),
      );
      return;
    }
    if (_scorePassword(_passwordController.text) < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters and include letters, numbers, and a symbol.')),
      );
      return;
    }
    if (!_agree) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the terms to continue.')),
      );
      return;
    }
    ref.read(authProvider.notifier).register(
      name: _nameController.text.trim(),
      email: _emailController.text.trim().toLowerCase(),
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      password: _passwordController.text,
      passwordConfirmation: _confirmPasswordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (!next.isLoading && next.errorMessage == null && prev?.isLoading == true) {
        Navigator.pushReplacementNamed(
          context,
          '/verify-email',
          arguments: _emailController.text.trim().toLowerCase(),
        );
      }
    });

    return AuthScreenLayout(
      compact: true,
      title: 'Create your account',
      subtitle: 'Start learning with mentors from top tech companies.',
      footer: GestureDetector(
        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
        child: RichText(
          text: TextSpan(
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: AppColors.mutedForeground,
            ),
            children: [
              const TextSpan(text: 'Already have an account? '),
              TextSpan(
                text: 'Login',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: _authPrimary,
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
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton.icon(
                onPressed: authState.isLoading ? null : () => ref.read(authProvider.notifier).googleLogin(),
                icon: SvgPicture.asset(
                  'assets/images/google_logo.svg',
                  width: 24,
                  height: 24,
                ),
                label: Text(
                  'Continue with Google',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: AppColors.foreground,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.foreground,
                  side: const BorderSide(color: Color(0xFFE0E0E0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w500),
                ),
              ),
            ),
            if (authState.isLoading)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                    const SizedBox(width: 8),
                    Text(
                      'Signing up with Google...',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            _Divider(text: 'or'),
            const SizedBox(height: 20),
            _AuthField(
              label: 'Full Name',
              controller: _nameController,
              placeholder: 'Your name',
              icon: Icons.person_outline,
              keyboardType: TextInputType.name,
              validator: (v) => v == null || v.trim().isEmpty ? 'Please enter your name' : null,
            ),
            const SizedBox(height: 16),
            _AuthField(
              label: 'Email',
              controller: _emailController,
              placeholder: 'you@example.com',
              icon: Icons.mail_outline,
              keyboardType: TextInputType.emailAddress,
              validator: (v) => v == null || v.trim().isEmpty ? 'Please enter your email' : null,
            ),
            const SizedBox(height: 16),
            _AuthField(
              label: 'Phone (optional)',
              controller: _phoneController,
              placeholder: '01700000000',
              icon: Icons.phone_android_outlined,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            _AuthField(
              label: 'Password',
              controller: _passwordController,
              placeholder: 'At least 8 characters',
              icon: Icons.lock_outline,
              obscureText: !_showPassword,
              suffix: IconButton(
                icon: Icon(
                  _showPassword ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                  color: AppColors.mutedForeground,
                ),
                onPressed: () => setState(() => _showPassword = !_showPassword),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Please enter a password' : null,
            ),
            if (_passwordController.text.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: _scorePassword(_passwordController.text) / 4,
                        backgroundColor: AppColors.muted,
                        valueColor: AlwaysStoppedAnimation<Color>(_strengthColor),
                        minHeight: 6,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _strengthLabel,
                    style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            _AuthField(
              label: 'Confirm Password',
              controller: _confirmPasswordController,
              placeholder: 'Repeat your password',
              icon: Icons.lock_outline,
              obscureText: !_showPassword,
              validator: (v) => v == null || v.isEmpty ? 'Please confirm your password' : null,
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 20,
                  width: 20,
                  child: Checkbox(
                    value: _agree,
                    onChanged: (v) => setState(() => _agree = v ?? true),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    side: const BorderSide(color: AppColors.border),
                    activeColor: _authPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: AppColors.mutedForeground,
                      ),
                      children: [
                        const TextSpan(text: 'By registering, you agree to our '),
                        TextSpan(
                          text: 'Terms',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _authPrimary,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const WebViewScreen(
                                  url: 'https://ilabbd.com/terms',
                                  title: 'Terms & Conditions',
                                ),
                              ),
                            ),
                        ),
                        const TextSpan(text: ' and '),
                        TextSpan(
                          text: 'Privacy Policy',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _authPrimary,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const WebViewScreen(
                                  url: 'https://ilabbd.com/privacy',
                                  title: 'Privacy Policy',
                                ),
                              ),
                            ),
                        ),
                        const TextSpan(text: '.'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            if (authState.errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.destructive.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.destructive.withValues(alpha: 0.05),
                ),
                child: Text(
                  authState.errorMessage!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.destructive),
                ),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: const LinearGradient(
                    colors: [_authPrimary, _authPrimaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _authPrimary.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: authState.isLoading ? null : _onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    disabledBackgroundColor: Colors.transparent,
                  ),
                  child: authState.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'Register',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.white,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
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
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.mutedForeground,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: AppColors.foreground,
          ),
          decoration: InputDecoration(
            hintText: placeholder,
            prefixIcon: Icon(icon, size: 20, color: AppColors.mutedForeground),
            suffixIcon: suffix,
            filled: true,
            fillColor: const Color(0xFFE7E5ED),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            hintStyle: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: AppColors.mutedForeground.withValues(alpha: 0.5),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: _authPrimary, width: 1),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.destructive),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.destructive),
            ),
          ),
        ),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  final String text;
  const _Divider({required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.border, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            text,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: AppColors.mutedForeground,
            ),
          ),
        ),
        const Expanded(child: Divider(color: AppColors.border, thickness: 1)),
      ],
    );
  }
}