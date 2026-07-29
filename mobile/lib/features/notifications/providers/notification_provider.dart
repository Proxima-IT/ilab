import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final String? error;
  final int unreadCount;

  const NotificationState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
    this.unreadCount = 0,
  });

  NotificationState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    String? error,
    int? unreadCount,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _service = NotificationService();

  NotificationNotifier() : super(const NotificationState());

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final notifications = await _service.getNotifications();
      final unreadCount = notifications.where((n) => !n.isRead).length;
      state = NotificationState(
        notifications: notifications,
        unreadCount: unreadCount,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(int id) async {
    try {
      await _service.markAsRead(id);
      final updated = state.notifications.map((n) {
        if (n.id == id) {
          return NotificationModel(
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            actionUrl: n.actionUrl,
            data: n.data,
            readAt: DateTime.now().toIso8601String(),
            createdAt: n.createdAt,
          );
        }
        return n;
      }).toList();
      final unreadCount = updated.where((n) => !n.isRead).length;
      state = state.copyWith(notifications: updated, unreadCount: unreadCount);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> refresh() async {
    await fetchNotifications();
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier();
});