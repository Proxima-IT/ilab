import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/models/notification_model.dart';
import '../providers/notification_provider.dart';

class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationProvider.notifier).fetchNotifications());
  }

  Future<void> _onRefresh() async {
    await ref.read(notificationProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: () => _markAllAsRead(state),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: state.isLoading && state.notifications.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: AppColors.destructive),
                      const SizedBox(height: 12),
                      Text(state.error!, style: AppTextStyles.bodyMedium),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _onRefresh, child: const Text('Retry')),
                    ],
                  ),
                )
              : state.notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
                          const SizedBox(height: 16),
                          Text(
                            'No notifications yet',
                            style: AppTextStyles.titleMedium.copyWith(color: AppColors.mutedForeground),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'We\'ll let you know when something new arrives.',
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _onRefresh,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: state.notifications.length,
                        separatorBuilder: (_, _) => const Divider(height: 1, indent: 72),
                        itemBuilder: (_, i) => _buildNotificationItem(state.notifications[i]),
                      ),
                    ),
    );
  }

  void _markAllAsRead(NotificationState state) {
    final unread = state.notifications.where((n) => !n.isRead).toList();
    for (final n in unread) {
      ref.read(notificationProvider.notifier).markAsRead(n.id);
    }
  }

  Widget _buildNotificationItem(NotificationModel notification) {
    final iconData = _iconForType(notification.type);
    final iconColor = _colorForType(notification.type);

    return InkWell(
      onTap: () => _onTapNotification(notification),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: notification.isRead ? null : AppColors.primary.withValues(alpha: 0.03),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(iconData, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: AppTextStyles.labelMedium.copyWith(
                            fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _timeAgo(notification.createdAt),
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.mutedForeground,
                      fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (!notification.isRead)
              Container(
                margin: const EdgeInsets.only(left: 8),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _onTapNotification(NotificationModel notification) {
    if (!notification.isRead) {
      ref.read(notificationProvider.notifier).markAsRead(notification.id);
    }

    if (notification.actionUrl != null && notification.actionUrl!.isNotEmpty) {
      // Navigate based on action_url
      final uri = notification.actionUrl!;
      if (uri.startsWith('/course')) {
        Navigator.pushNamed(context, '/course-detail', arguments: uri.split('/').last);
      } else if (uri.startsWith('/blog')) {
        Navigator.pushNamed(context, '/blog-detail', arguments: uri.split('/').last);
      } else if (uri.startsWith('/event')) {
        Navigator.pushNamed(context, '/event-detail', arguments: uri.split('/').last);
      } else if (uri.startsWith('/certificate')) {
        Navigator.pushNamed(context, '/certificates');
      }
    }
  }

  String _timeAgo(String createdAt) {
    try {
      final date = DateTime.parse(createdAt);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inSeconds < 60) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('MMM d').format(date);
    } catch (_) {
      return '';
    }
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'new_lecture':
        return Icons.play_circle_outline;
      case 'special_offer':
        return Icons.local_offer_outlined;
      case 'event':
        return Icons.event_outlined;
      case 'profile_update':
        return Icons.person_outline;
      case 'course_completion':
        return Icons.check_circle_outline;
      case 'certificate_ready':
        return Icons.verified_outlined;
      case 'admin_message':
        return Icons.admin_panel_settings_outlined;
      case 'qna_answer':
        return Icons.question_answer_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'new_lecture':
        return const Color(0xFF3B82F6);
      case 'special_offer':
        return AppColors.accent;
      case 'event':
        return const Color(0xFF8B5CF6);
      case 'profile_update':
        return AppColors.primary;
      case 'course_completion':
        return AppColors.success;
      case 'certificate_ready':
        return AppColors.primary;
      case 'admin_message':
        return AppColors.warning;
      case 'qna_answer':
        return const Color(0xFFEC4989);
      default:
        return AppColors.primary;
    }
  }
}