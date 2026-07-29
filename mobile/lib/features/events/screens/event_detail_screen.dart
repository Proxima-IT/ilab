import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/event_provider.dart';

class EventDetailScreen extends ConsumerStatefulWidget {
  const EventDetailScreen({super.key});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final slug = ModalRoute.of(context)!.settings.arguments as String;
    final state = ref.watch(eventDetailProvider(slug));

    if (state.isLoading && state.event == null) {
      return const Scaffold(body: LoadingWidget());
    }

    if (state.error != null && state.event == null) {
      return Scaffold(
        body: ErrorDisplayWidget(
          message: state.error!,
          onRetry: () => ref.read(eventDetailProvider(slug).notifier).fetchDetail(slug),
        ),
      );
    }

    final event = state.event;
    if (event == null) {
      return const Scaffold(body: SizedBox.shrink());
    }

    return _buildContent(event);
  }

  Widget _buildContent(EventModel event) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: event.coverUrl != null
                  ? Image.network(event.coverUrl!, fit: BoxFit.cover)
                  : Container(color: AppColors.primary),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: event.isFinished
                              ? AppColors.mutedForeground.withValues(alpha: 0.2)
                              : AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          event.isFinished ? 'Finished' : (event.type ?? 'Event'),
                          style: AppTextStyles.labelMedium.copyWith(
                            color: event.isFinished ? AppColors.mutedForeground : AppColors.primaryDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(event.title, style: AppTextStyles.headlineSmall),
                  const SizedBox(height: 16),
                  _infoTile(Icons.calendar_today, 'Date & Time', event.formattedStartDate),
                  if (event.location != null)
                    _infoTile(Icons.location_on, 'Location', event.location!),
                  if (event.registrationCount != null)
                    _infoTile(Icons.people, 'Registered', '${event.registrationCount} attendees'),
                  if (event.seats != null)
                    _infoTile(Icons.event_seat, 'Seats', '${event.seats} available'),
                  const SizedBox(height: 24),
                  if (event.description != null) ...[
                    Text('About This Event', style: AppTextStyles.titleLarge),
                    const SizedBox(height: 8),
                    Text(event.description!, style: AppTextStyles.bodyLarge.copyWith(height: 1.6)),
                  ],
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: event.isFinished
          ? null
          : Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {},
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Register Now', style: AppTextStyles.buttonLarge),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primaryDark),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground)),
              Text(value, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.foreground)),
            ],
          ),
        ],
      ),
    );
  }
}