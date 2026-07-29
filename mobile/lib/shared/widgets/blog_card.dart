import 'package:flutter/material.dart';
import '../models/blog_post_model.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class BlogCard extends StatelessWidget {
  final BlogPostModel post;
  final VoidCallback? onTap;

  const BlogCard({super.key, required this.post, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (post.cover != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.network(
                  post.cover!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: AppColors.muted,
                    child: const Center(
                      child: Icon(Icons.article_outlined, color: AppColors.mutedForeground, size: 32),
                    ),
                  ),
                ),
              )
            else
              Container(
                color: AppColors.muted,
                height: 120,
                child: const Center(
                  child: Icon(Icons.article_outlined, color: AppColors.mutedForeground, size: 32),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (post.category != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            post.category!,
                            style: AppTextStyles.labelSmall.copyWith(color: AppColors.primaryDark, fontSize: 10),
                          ),
                        ),
                      const Spacer(),
                      if (post.date != null)
                        Text(
                          post.formattedDate,
                          style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground, fontSize: 10),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.title,
                    style: AppTextStyles.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (post.excerpt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      post.excerpt!,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 14, color: AppColors.mutedForeground),
                      const SizedBox(width: 4),
                      Text(
                        post.readTimeMinutes != null ? '${post.readTimeMinutes} min read' : '',
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}