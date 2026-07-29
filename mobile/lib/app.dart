import 'package:flutter/material.dart';
import 'shared/theme/app_theme.dart';
import 'shared/screens/main_shell.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/courses/screens/course_detail_screen.dart';
import 'features/courses/screens/lesson_player_screen.dart';
import 'features/courses/screens/my_courses_screen.dart';
import 'features/blog/screens/blog_detail_screen.dart';
import 'features/events/screens/event_detail_screen.dart';
import 'features/profile/screens/edit_profile_screen.dart';
import 'features/profile/screens/change_password_screen.dart';
import 'features/profile/screens/notification_settings_screen.dart';
import 'features/notifications/screens/notification_screen.dart';

class _RouteObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    debugPrint('App: Navigated to ${route.settings.name}');
  }
}

class ILabApp extends StatelessWidget {
  final _navigatorKey = GlobalKey<NavigatorState>();

  ILabApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'iLab',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      navigatorObservers: [
        _RouteObserver(),
      ],
      theme: AppTheme.light,
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/home': (context) => MainShell(key: mainShellKey),
        '/my-courses': (context) => const MyCoursesScreen(),
        '/course-detail': (context) => const CourseDetailScreen(),
        '/lesson-player': (context) => const LessonPlayerScreen(),
        '/blog-detail': (context) => const BlogDetailScreen(),
        '/event-detail': (context) => const EventDetailScreen(),
        '/edit-profile': (context) => const EditProfileScreen(),
        '/change-password': (context) => const ChangePasswordScreen(),
        '/notification-settings': (context) => const NotificationSettingsScreen(),
        '/notifications': (context) => const NotificationScreen(),
      },
    );
  }
}