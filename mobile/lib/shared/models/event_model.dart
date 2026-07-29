import 'package:intl/intl.dart';
import '../../config/api_config.dart';

class EventModel {
  final int id;
  final String title;
  final String slug;
  final String? description;
  final String? coverUrl;
  final String? startDateTime;
  final String? finishDateTime;
  final String? location;
  final String? type;
  final int? seats;
  final int? registrationCount;
  final bool isFinished;

  const EventModel({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    this.coverUrl,
    this.startDateTime,
    this.finishDateTime,
    this.location,
    this.type,
    this.seats,
    this.registrationCount,
    this.isFinished = false,
  });

  String get formattedStartDate {
    if (startDateTime == null) return '';
    final parsed = DateTime.tryParse(startDateTime!);
    if (parsed == null) return startDateTime!;
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  String get formattedFinishDate {
    if (finishDateTime == null) return '';
    final parsed = DateTime.tryParse(finishDateTime!);
    if (parsed == null) return finishDateTime!;
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      coverUrl: ApiConfig.resolveImageUrl(
          json['cover_url'] as String? ?? json['cover'] as String?),
      startDateTime: json['starts_at'] as String? ??
          json['start_date_time'] as String? ??
          json['start_date'] as String?,
      finishDateTime: json['ends_at'] as String? ??
          json['finish_date_time'] as String? ??
          json['finish_date'] as String?,
      location: json['location'] as String?,
      type: json['event_type'] as String? ?? json['type'] as String?,
      seats: json['seats'] as int?,
      registrationCount: json['registrations_count'] as int? ??
          json['registration_count'] as int?,
      isFinished: json['is_finished'] as bool? ?? false,
    );
  }
}