import 'package:intl/intl.dart';
import '../../config/api_config.dart';

class BlogPostModel {
  final int id;
  final String title;
  final String slug;
  final String? excerpt;
  final String? content;
  final String? cover;
  final String? category;
  final String? author;
  final String? authorAvatar;
  final String? date;
  final int? readTimeMinutes;

  const BlogPostModel({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    this.content,
    this.cover,
    this.category,
    this.author,
    this.authorAvatar,
    this.date,
    this.readTimeMinutes,
  });

  String get formattedDate {
    if (date == null) return '';
    final parsed = DateTime.tryParse(date!);
    if (parsed == null) return date!;
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return dateStr;
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  factory BlogPostModel.fromJson(Map<String, dynamic> json) {
    final rawCategory = json['category'];
    final categoryValue = rawCategory is Map
        ? rawCategory['name'] as String?
        : rawCategory as String?;

    final rawAuthor = json['author'];
    final authorValue = rawAuthor is Map
        ? rawAuthor['name'] as String?
        : rawAuthor as String?;
    final authorAvatarValue = rawAuthor is Map
        ? rawAuthor['avatar'] as String?
        : null;
    final topLevelAvatar = json['author_avatar'] as String?;

    return BlogPostModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      excerpt: json['excerpt'] as String?,
      content: json['content'] as String? ?? json['body'] as String?,
      cover: ApiConfig.resolveImageUrl(
        json['cover_url'] as String? ?? json['cover'] as String?),
      category: categoryValue ?? json['category_name'] as String?,
      author: authorValue ?? json['author_name'] as String?,
      authorAvatar: ApiConfig.resolveImageUrl(
        authorAvatarValue ?? topLevelAvatar),
      date: json['published_at'] as String? ??
          json['date'] as String?,
      readTimeMinutes: json['read_time_minutes'] as int? ??
          json['read_time'] as int?,
    );
  }
}