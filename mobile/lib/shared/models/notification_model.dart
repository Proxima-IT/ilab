class NotificationModel {
  final int id;
  final String type;
  final String title;
  final String message;
  final String? actionUrl;
  final dynamic data;
  final String? readAt;
  final String createdAt;

  bool get isRead => readAt != null;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.actionUrl,
    this.data,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];
    return NotificationModel(
      id: json['id'] as int,
      type: json['type'] as String? ?? 'admin_message',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      actionUrl: json['action_url'] as String?,
      data: rawData is Map<String, dynamic> ? rawData : null,
      readAt: json['read_at'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}