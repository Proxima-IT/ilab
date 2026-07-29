import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        ref.read(authProvider.notifier).checkAuthState();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (prev, next) {
      debugPrint('SplashScreen: Auth state changed — prev=${prev?.status} next=${next.status}');
      if (next.status == AuthStatus.authenticated) {
        debugPrint('SplashScreen: Navigating to /home');
        Navigator.pushReplacementNamed(context, '/home');
      } else if (next.status == AuthStatus.unauthenticated && prev?.status == AuthStatus.initial) {
        debugPrint('SplashScreen: Navigating to /login');
        Navigator.pushReplacementNamed(context, '/login');
      }
    });

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(
                  'assets/images/ilab_logo.jpeg',
                  width: 200,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'iLab',
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Learn. Build. Earn.',
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 16,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(color: AppColors.white),
            ],
          ),
        ),
      ),
    );
  }
}