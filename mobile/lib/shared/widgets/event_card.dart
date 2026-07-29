import 'package:flutter/material.dart';
import '../models/event_model.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class EventCard extends StatelessWidget {
  final EventModel event;
  final VoidCallback? onTap;

  const EventCard({super.key, required this.event, this.onTap});

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
            _buildHeader(),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: AppTextStyles.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (event.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      event.description!,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 10),
                  _infoRow(Icons.calendar_today, event.formattedStartDate),
                  if (event.location != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: _infoRow(Icons.location_on, event.location!),
                    ),
                  if (event.registrationCount != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: _infoRow(Icons.people, '${event.registrationCount} registered'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    if (event.coverUrl != null) {
      return Stack(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Image.network(
              event.coverUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: AppColors.muted,
                child: const Center(
                  child: Icon(Icons.event, color: AppColors.mutedForeground, size: 32),
                ),
              ),
            ),
          ),
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: event.isFinished ? AppColors.mutedForeground : AppColors.primary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                event.isFinished ? 'Finished' : (event.type ?? 'Event'),
                style: AppTextStyles.labelSmall.copyWith(color: AppColors.white, fontSize: 10),
              ),
            ),
          ),
        ],
      );
    }
    return Container(
      color: AppColors.muted,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Icon(Icons.event, color: AppColors.mutedForeground, size: 32),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.mutedForeground),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground, fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}