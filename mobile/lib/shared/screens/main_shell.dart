import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/courses/screens/course_list_screen.dart';
import '../../features/blog/screens/blog_list_screen.dart';
import '../../features/events/screens/event_list_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/certificates/screens/certificate_list_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';

final GlobalKey<MainShellState> mainShellKey = GlobalKey<MainShellState>();

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => MainShellState();
}

class MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;
  int _bottomNavIndex = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationProvider.notifier).fetchNotifications());
  }

  void switchToTab(int index) {
    setState(() {
      _currentIndex = index;
      if (index >= 0 && index < 5) {
        _bottomNavIndex = index;
      }
    });
  }

  static const _screenTitles = ['Home', 'Courses', 'Blog', 'Events', 'Profile', 'Certificates'];

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(_screenTitles[_currentIndex]),
      ),
      drawer: Drawer(
        child: SafeArea(
          top: true,
          bottom: false,
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
                      backgroundImage: user?.profilePhoto != null
                          ? NetworkImage(user!.profilePhoto!)
                          : null,
                      child: user?.profilePhoto == null
                          ? Text(
                              (user?.name ?? 'U')[0].toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user?.name ?? 'User',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    _buildDrawerItem(
                      icon: Icons.home,
                      label: 'Home',
                      isActive: _currentIndex == 0,
                      onTap: () {
                        switchToTab(0);
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.book,
                      label: 'Courses',
                      isActive: _currentIndex == 1,
                      onTap: () {
                        switchToTab(1);
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.article,
                      label: 'Blog',
                      isActive: _currentIndex == 2,
                      onTap: () {
                        switchToTab(2);
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.event,
                      label: 'Events',
                      isActive: _currentIndex == 3,
                      onTap: () {
                        switchToTab(3);
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.workspace_premium,
                      label: 'My Certificates',
                      isActive: _currentIndex == 5,
                      onTap: () {
                        switchToTab(5);
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.notifications,
                      label: 'Notifications',
                      isActive: false,
                      badgeCount: ref.watch(notificationProvider).unreadCount,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/notifications');
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.person,
                      label: 'Profile',
                      isActive: _currentIndex == 4,
                      onTap: () {
                        switchToTab(4);
                        Navigator.pop(context);
                      },
                    ),
                    const Divider(),
                    _buildDrawerItem(
                      icon: Icons.settings,
                      label: 'Settings',
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.logout,
                      label: 'Logout',
                      isActive: false,
                      isDestructive: true,
                      onTap: () async {
                        Navigator.pop(context);
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
          ),
        ),
      ),
      body: SafeArea(
        top: true,
        bottom: false,
        child: IndexedStack(
          index: _currentIndex,
          children: const [
            HomeScreen(),
            CourseListScreen(),
            BlogListScreen(),
            EventListScreen(),
            ProfileScreen(),
            CertificateListScreen(),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex,
          onTap: (index) => switchToTab(index),
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.mutedForeground,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          backgroundColor: AppColors.background,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.book_outlined), activeIcon: Icon(Icons.book), label: 'Courses'),
            BottomNavigationBarItem(icon: Icon(Icons.article_outlined), activeIcon: Icon(Icons.article), label: 'Blog'),
            BottomNavigationBarItem(icon: Icon(Icons.event_outlined), activeIcon: Icon(Icons.event), label: 'Events'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    bool isDestructive = false,
    int badgeCount = 0,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: isActive ? AppColors.primary.withValues(alpha: 0.1) : null,
      ),
      child: ListTile(
        leading: badgeCount > 0
            ? Badge(
                label: Text(
                  badgeCount > 99 ? '99+' : '$badgeCount',
                  style: const TextStyle(fontSize: 10, color: Colors.white),
                ),
                child: Icon(
                  icon,
                  color: isDestructive
                      ? AppColors.destructive
                      : isActive
                          ? AppColors.primary
                          : null,
                ),
              )
            : Icon(
                icon,
                color: isDestructive
                    ? AppColors.destructive
                    : isActive
                        ? AppColors.primary
                        : null,
              ),
        title: Text(
          label,
          style: TextStyle(
            color: isDestructive
                ? AppColors.destructive
                : isActive
                    ? AppColors.primary
                    : null,
            fontWeight: isActive ? FontWeight.w600 : null,
          ),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}