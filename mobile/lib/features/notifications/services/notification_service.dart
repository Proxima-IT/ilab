import '../../../config/api_config.dart';
import '../../../shared/models/notification_model.dart';
import '../../../shared/services/api_client.dart';

class NotificationService {
  final ApiClient _api = ApiClient();

  Future<List<NotificationModel>> getNotifications() async {
    final response = await _api.get(ApiConfig.notifications);
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    final notifications = (responseData['notifications'] as List<dynamic>?)
            ?.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return notifications;
  }

  Future<NotificationModel> markAsRead(int id) async {
    final response = await _api.put('/student/notifications/$id/read');
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    return NotificationModel.fromJson(responseData);
  }
}