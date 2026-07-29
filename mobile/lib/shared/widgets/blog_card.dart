import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/blog_post_model.dart';
import '../theme/app_colors.dart';

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
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: post.cover != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: SizedBox(
                        width: double.infinity,
                        height: 160,
                        child: Image.network(
                          post.cover!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            color: AppColors.muted,
                            child: const Center(
                              child: Icon(Icons.article_outlined, color: AppColors.mutedForeground, size: 32),
                            ),
                          ),
                        ),
                      ),
                    )
                  : Container(
                      color: AppColors.muted,
                      height: 160,
                      child: const Center(
                        child: Icon(Icons.article_outlined, color: AppColors.mutedForeground, size: 32),
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.primary,
                        backgroundImage: post.authorAvatar != null
                            ? NetworkImage(post.authorAvatar!)
                            : null,
                        child: post.authorAvatar == null
                            ? Text(
                                (post.author ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          post.author ?? '',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.foreground,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        post.formattedDate,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                  if (post.excerpt != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      post.excerpt!,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: AppColors.mutedForeground,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}