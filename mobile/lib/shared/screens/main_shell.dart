import 'package:flutter/material.dart';
import 'package:animated_notch_bottom_bar/animated_notch_bottom_bar/animated_notch_bottom_bar.dart';
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
  int _activeNavIndex = 0;
  final Set<int> _visitedTabs = {0};
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  static const List<int> _navToScreen = [0, 1, 2, 4];
  late final NotchBottomBarController _notchBottomBarController;

  static const List<Widget> _screens = [
    HomeScreen(),
    CourseListScreen(),
    BlogListScreen(),
    EventListScreen(),
    ProfileScreen(),
    CertificateListScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _notchBottomBarController = NotchBottomBarController(index: 0);
    Future.microtask(() => ref.read(notificationProvider.notifier).fetchNotifications());
  }

  void switchToTab(int index) {
    final navIndex = _navToScreen.indexOf(index);
    setState(() {
      _currentIndex = index;
      _visitedTabs.add(index);
      if (navIndex != -1) {
        _activeNavIndex = navIndex;
      }
    });
    if (navIndex != -1) {
      _notchBottomBarController.jumpTo(navIndex);
    }
  }

  @override
  void dispose() {
    _notchBottomBarController.dispose();
    super.dispose();
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      extendBody: false,
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
                          const SizedBox(height: 16),
                          _buildDrawerItem(
                            icon: Icons.library_books_outlined,
                            label: 'My Courses',
                            isActive: false,
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.pushNamed(context, '/my-courses');
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
      body: SafeArea(
        top: true,
        bottom: false,
        child: IndexedStack(
          index: _currentIndex,
          children: _screens.asMap().entries.map((entry) {
            final index = entry.key;
            final screen = entry.value;
            if (index == _currentIndex || _visitedTabs.contains(index)) {
              return screen;
            }
            return const SizedBox.shrink();
          }).toList(),
        ),
      ),
      bottomNavigationBar: LayoutBuilder(
        builder: (context, constraints) {
          const double kCircleRadius = 30.0;
          const double kCircleMargin = 8.0;
          const int itemCount = 4;
          final double screenWidth = constraints.maxWidth;
          final double firstItemPos = screenWidth * 0.05;
          final double lastItemPos = screenWidth * 0.95 - (kCircleRadius + kCircleMargin) * 2;
          final double itemDistance = (lastItemPos - firstItemPos) / (itemCount - 1);
          final double activeItemPos = firstItemPos + itemDistance * _activeNavIndex;
          final double notchCenterX = activeItemPos + kCircleMargin + kCircleRadius;

          return Stack(
            clipBehavior: Clip.none,
            children: [
              SafeArea(
                bottom: true,
                left: false,
                right: false,
                top: false,
                child: AnimatedNotchBottomBar(
                  notchBottomBarController: _notchBottomBarController,
                  color: AppColors.primary,
                  notchColor: Colors.white,
                  durationInMilliSeconds: 300,
                  showLabel: true,
                  itemLabelStyle: TextStyle(fontSize: 10.0, color: Colors.white),
                  removeMargins: true,
                  kIconSize: 30.0,
                  showBottomRadius: false,
                  kBottomRadius: 0,
                  bottomBarItems: [
                    BottomBarItem(
                      inActiveItem: Icon(Icons.home_outlined, color: Colors.white),
                      activeItem: Icon(Icons.home_filled, color: AppColors.primary),
                      itemLabel: 'Home',
                    ),
                    BottomBarItem(
                      inActiveItem: Icon(Icons.menu_book_outlined, color: Colors.white),
                      activeItem: Icon(Icons.menu_book, color: AppColors.primary),
                      itemLabel: 'Courses',
                    ),
                    BottomBarItem(
                      inActiveItem: Icon(Icons.article_outlined, color: Colors.white),
                      activeItem: Icon(Icons.article, color: AppColors.primary),
                      itemLabel: 'Blog',
                    ),
                    BottomBarItem(
                      inActiveItem: Icon(Icons.person_outlined, color: Colors.white),
                      activeItem: Icon(Icons.person, color: AppColors.primary),
                      itemLabel: 'Profile',
                    ),
                  ],
                  onTap: (index) {
                    setState(() {
                      _activeNavIndex = index;
                      _currentIndex = _navToScreen[index];
                      _visitedTabs.add(_currentIndex);
                    });
                  },
                ),
              ),
              Positioned(
                top: 70.0,
                left: notchCenterX - 50,
                width: 100,
                child: IgnorePointer(
                  child: Text(
                    _labelForNavIndex(_activeNavIndex),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 10.0, color: Colors.white),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _labelForNavIndex(int navIndex) {
    const labels = ['Home', 'Courses', 'Blog', 'Profile'];
    return labels[navIndex];
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

