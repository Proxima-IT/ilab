import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/course_model.dart';
import '../theme/app_colors.dart';

class CourseCard extends StatelessWidget {
  final CourseModel course;
  final VoidCallback? onView;
  final VoidCallback? onEnroll;

  const CourseCard({super.key, required this.course, this.onView, this.onEnroll});

  String get _format {
    return course.level?.toLowerCase() == 'beginner' ? 'Recorded' : 'Live';
  }

  Color _levelBgColor() {
    switch (course.level?.toLowerCase()) {
      case 'beginner':
        return const Color(0xFFD1FAE5);
      case 'intermediate':
        return const Color(0xFFFEF3C7);
      case 'advanced':
        return const Color(0xFFFFE4E6);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  Color _levelTextColor() {
    switch (course.level?.toLowerCase()) {
      case 'beginner':
        return const Color(0xFF047857);
      case 'intermediate':
        return const Color(0xFFB45309);
      case 'advanced':
        return const Color(0xFFBE123C);
      default:
        return const Color(0xFF475569);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildImage(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCategory(),
                const SizedBox(height: 6),
                _buildTitle(),
                const SizedBox(height: 8),
                _buildBadges(),
                const SizedBox(height: 12),
                _buildFooter(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImage() {
    return AspectRatio(
      aspectRatio: 16 / 10,
      child: Stack(
        children: [
          if (course.thumbnailUrl != null && course.thumbnailUrl!.isNotEmpty)
            Image.network(
              course.thumbnailUrl!,
              width: double.infinity,
              height: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, e, s) => _imagePlaceholder(),
              loadingBuilder: (_, child, progress) {
                if (progress == null) return child;
                return _imagePlaceholder();
              },
            )
          else
            _imagePlaceholder(),
          if (course.tag != null)
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF76A21), Color(0xFFFF8A4C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  course.tag!,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.muted,
      child: const Center(
        child: Icon(Icons.school_outlined, color: AppColors.mutedForeground, size: 32),
      ),
    );
  }

  Widget _buildCategory() {
    if (course.category == null) return const SizedBox.shrink();
    return Text(
      course.category!.toUpperCase(),
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.primaryDark,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildTitle() {
    return Text(
      course.title,
      style: GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.foreground,
        height: 1.25,
      ),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildBadges() {
    final children = <Widget>[];
    if (course.level != null) {
      children.add(_badge(course.level!, _levelBgColor(), _levelTextColor()));
    }
    if (course.mode != null) {
      children.add(_badge(course.mode!, const Color(0xFFE0F2FE), const Color(0xFF0369A1)));
    }
    children.add(_badge(_format, const Color(0xFFEDE9FE), const Color(0xFF6D28D9)));
    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: children,
    );
  }

  Widget _badge(String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildMetadata() {
    final children = <Widget>[];
    if (course.rating != null && course.rating! > 0) {
      children.add(_metaItem(
        Icons.star,
        course.rating!.toStringAsFixed(1),
        fill: true,
        iconColor: AppColors.accent,
      ));
    }
    if (course.enrollmentCount != null && course.enrollmentCount! > 0) {
      children.add(_metaItem(
        Icons.people_outline,
        _formatNumber(course.enrollmentCount!),
      ));
    }
    if (course.totalHours != null && course.totalHours! > 0) {
      children.add(_metaItem(
        Icons.access_time,
        '${course.totalHours}h',
      ));
    }
    if (course.lessonCount != null && course.lessonCount! > 0) {
      children.add(_metaItem(
        Icons.menu_book,
        '${course.lessonCount}',
      ));
    }
    return Wrap(
      spacing: 12,
      runSpacing: 6,
      children: children,
    );
  }

  Widget _metaItem(IconData icon, String text, {bool fill = false, Color? iconColor}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: iconColor ?? AppColors.mutedForeground,
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: fill ? FontWeight.w700 : FontWeight.w400,
            color: iconColor ?? AppColors.mutedForeground,
          ),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(child: _buildMetadata()),
            const SizedBox(width: 12),
            _buildPrice(),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildViewButton()),
            const SizedBox(width: 8),
            Expanded(child: _buildEnrollButton()),
          ],
        ),
      ],
    );
  }

  Widget _buildPrice() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '৳${course.effectivePrice.toStringAsFixed(0)}',
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.foreground,
          ),
        ),
        if (course.hasDiscount)
          Text(
            '৳${course.price.toStringAsFixed(0)}',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: AppColors.mutedForeground,
              decoration: TextDecoration.lineThrough,
            ),
          ),
      ],
    );
  }

  Widget _buildViewButton() {
    return SizedBox(
      height: 36,
      child: OutlinedButton(
        onPressed: onView,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          minimumSize: const Size(0, 36),
          side: BorderSide(color: AppColors.primary, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          foregroundColor: AppColors.primaryDark,
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        child: Text(
          'View',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryDark,
          ),
        ),
      ),
    );
  }

  Widget _buildEnrollButton() {
    return SizedBox(
      height: 36,
      child: ElevatedButton(
        onPressed: onEnroll,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          minimumSize: const Size(0, 36),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
        ).copyWith(
          backgroundColor: WidgetStateProperty.all(Colors.transparent),
        ),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, AppColors.primaryLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Container(
            alignment: Alignment.center,
            child: Text(
              'Enroll',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatNumber(int n) {
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(n % 1000 == 0 ? 0 : 1)}k';
    }
    return n.toString();
  }
}