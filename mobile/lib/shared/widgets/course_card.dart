import 'package:flutter/material.dart';
import '../models/course_model.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class CourseCard extends StatelessWidget {
  final CourseModel course;
  final VoidCallback? onTap;
  final bool horizontal;

  const CourseCard({super.key, required this.course, this.onTap, this.horizontal = false});

  @override
  Widget build(BuildContext context) {
    if (horizontal) return _buildHorizontal();
    return _buildGrid();
  }

  Widget _buildGrid() {
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
            _buildImage(),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (course.category != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        course.category!,
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.primaryDark),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    course.title,
                    style: AppTextStyles.cardTitleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  _buildPriceBadge(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorizontal() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 220,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _buildImage(),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (course.category != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        course.category!,
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.primaryDark, fontSize: 10),
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    course.title,
                    style: AppTextStyles.cardTitleSmall.copyWith(fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  _buildPriceBadge(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage() {
    if (course.thumbnailUrl == null) {
      return Container(
        height: 120,
        color: AppColors.muted,
        child: const Center(
          child: Icon(Icons.school_outlined, color: AppColors.mutedForeground, size: 32),
        ),
      );
    }
    return Container(
      height: 120,
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(),
      child: Image.network(
        course.thumbnailUrl!,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          color: AppColors.muted,
          child: const Center(
            child: Icon(Icons.school_outlined, color: AppColors.mutedForeground, size: 32),
          ),
        ),
      ),
    );
  }

  Widget _buildPriceBadge() {
    if (course.isFree) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text('Free', style: AppTextStyles.labelSmall.copyWith(color: AppColors.success)),
      );
    }
    if (course.hasDiscount) {
      return Row(
        children: [
          Text(
            '৳${course.effectivePrice.toStringAsFixed(0)}',
            style: AppTextStyles.labelMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(width: 6),
          Text(
            '৳${course.price.toStringAsFixed(0)}',
            style: AppTextStyles.labelSmall.copyWith(
              color: AppColors.mutedForeground,
              decoration: TextDecoration.lineThrough,
            ),
          ),
        ],
      );
    }
    if (course.price > 0) {
      return Text(
        '৳${course.price.toStringAsFixed(0)}',
        style: AppTextStyles.labelMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
      );
    }
    return const SizedBox.shrink();
  }
}