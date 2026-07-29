import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
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
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  static const double _tabWidth = 56;
  static const double _tabGap = 16;
  static const double _containerPadding = 8;
  static const List<int> _navTabIndices = [0, 1, 2, 4];

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationProvider.notifier).fetchNotifications());
  }

  void switchToTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  double _getOffsetForIndex(int index) {
    final navIndex = _navTabIndices.indexOf(index);
    if (navIndex == -1) return _containerPadding;
    return navIndex * (_tabWidth + _tabGap);
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        child: SafeArea(
          child: SizedBox(
            width: MediaQuery.of(context).size.width * 0.85,
            child: ClipRRect(
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(36),
                bottomRight: Radius.circular(36),
              ),
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: AppColors.primary,
                          backgroundImage: user?.profilePhoto != null
                              ? NetworkImage(user!.profilePhoto!)
                              : null,
                          child: user?.profilePhoto == null
                              ? Text(
                                  (user?.name ?? 'U')[0].toUpperCase(),
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.w700,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          user?.name ?? 'User',
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            color: const Color(0xFF475569),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          height: 1,
                          color: Colors.black.withValues(alpha: 0.08),
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                    Expanded(
                      child: ListView(
                        padding: EdgeInsets.zero,
                        children: [
                          _buildDrawerItem(
                            icon: Icons.home_outlined,
                            label: 'Home',
                            isActive: _currentIndex == 0,
                            onTap: () {
                              switchToTab(0);
                              Navigator.pop(context);
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.menu_book_outlined,
                            label: 'Courses',
                            isActive: _currentIndex == 1,
                            onTap: () {
                              switchToTab(1);
                              Navigator.pop(context);
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.article_outlined,
                            label: 'Blog',
                            isActive: _currentIndex == 2,
                            onTap: () {
                              switchToTab(2);
                              Navigator.pop(context);
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.event_outlined,
                            label: 'Events',
                            isActive: _currentIndex == 3,
                            onTap: () {
                              switchToTab(3);
                              Navigator.pop(context);
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.workspace_premium_outlined,
                            label: 'My Certificates',
                            isActive: _currentIndex == 5,
                            onTap: () {
                              switchToTab(5);
                              Navigator.pop(context);
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.local_offer_outlined,
                            label: 'Free Courses',
                            isActive: false,
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.pushNamed(context, '/free-courses');
                            },
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 1,
                            color: Colors.black.withValues(alpha: 0.08),
                          ),
                          const SizedBox(height: 8),
                          _buildDrawerItem(
                            icon: Icons.notifications_outlined,
                            label: 'Notification Settings',
                            isActive: false,
                            badgeCount: ref.watch(notificationProvider).unreadCount,
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.pushNamed(context, '/notifications');
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.settings_outlined,
                            label: 'Settings',
                            isActive: false,
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.pushNamed(context, '/settings');
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: TextButton(
                        onPressed: () async {
                          Navigator.pop(context);
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) {
                            Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                          }
                        },
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(0xFFF5F5F5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: Text(
                          'Sign Out',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFFE53935),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          SafeArea(
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
          Positioned(
            left: 0,
            right: 0,
            bottom: 20,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(36),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_navTabIndices.contains(_currentIndex))
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                        left: _getOffsetForIndex(_currentIndex),
                        top: 8,
                        child: const SizedBox(
                          width: 56,
                          height: 56,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Color(0xFFE7E5ED),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildNavItem(
                          icon: Icons.home_outlined,
                          onTap: () => switchToTab(0),
                        ),
                        const SizedBox(width: 16),
                        _buildNavItem(
                          icon: Icons.menu_book_outlined,
                          onTap: () => switchToTab(1),
                        ),
                        const SizedBox(width: 16),
                        _buildNavItem(
                          icon: Icons.article_outlined,
                          onTap: () => switchToTab(2),
                        ),
                        const SizedBox(width: 16),
                        _buildNavItem(
                          icon: Icons.person_outlined,
                          onTap: () => switchToTab(4),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    const iconColor = Color(0xFF1A1A1A);
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 56,
        height: 56,
        child: Icon(icon, size: 28, color: iconColor),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: isActive
          ? BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
            )
          : null,
      child: GestureDetector(
        onTap: onTap,
        child: Row(
            children: [
              badgeCount > 0
                  ? Badge(
                      label: Text(
                        badgeCount > 99 ? '99+' : '$badgeCount',
                        style: const TextStyle(fontSize: 10, color: Colors.white),
                      ),
                      child: Icon(
                        icon,
                        size: 24,
                        color: isActive ? AppColors.primary : const Color(0xFF475569),
                      ),
                    )
                  : Icon(
                      icon,
                      size: 24,
                      color: isActive ? AppColors.primary : const Color(0xFF475569),
                    ),
              const SizedBox(width: 16),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? AppColors.primary : const Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
    );
  }
}