import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/event_provider.dart';

class EventDetailScreen extends ConsumerStatefulWidget {
  const EventDetailScreen({super.key});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  String _eventStatus(EventModel event) {
    if (event.isFinished) return 'Finished';
    final now = DateTime.now();
    if (event.startDateTime != null) {
      final start = DateTime.tryParse(event.startDateTime!);
      if (start != null && start.isBefore(now)) {
        if (event.finishDateTime != null) {
          final end = DateTime.tryParse(event.finishDateTime!);
          if (end != null && end.isAfter(now)) return 'Ongoing';
          if (end != null && end.isBefore(now)) return 'Finished';
        }
        return 'Ongoing';
      }
    }
    return 'Upcoming';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Upcoming':
        return AppColors.success;
      case 'Ongoing':
        return AppColors.warning;
      case 'Finished':
        return AppColors.mutedForeground;
      default:
        return AppColors.mutedForeground;
    }
  }

  @override
  Widget build(BuildContext context) {
    final slug = ModalRoute.of(context)!.settings.arguments as String;
    final state = ref.watch(eventDetailProvider(slug));

    if (state.isLoading && state.event == null) {
      return const Scaffold(body: _DetailShimmer());
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
    final status = _eventStatus(event);
    final statusColor = _statusColor(status);

    return Scaffold(
      body: Column(
        children: [
          _buildHero(event, status, statusColor),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              child: _buildInfoSection(event),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(event, status),
    );
  }

  Widget _buildHero(EventModel event, String status, Color statusColor) {
    final hasImage = event.coverUrl != null && event.coverUrl!.isNotEmpty;

    return SizedBox(
      height: 220,
      child: Stack(
        children: [
          if (hasImage)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 220,
                child: Image.network(
                  event.coverUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => _heroPlaceholder(),
                ),
              ),
            )
          else
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: _heroPlaceholder(),
            ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.center,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.6)],
                ),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFFE7E5ED),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A), size: 22),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.calendar_today, size: 12, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    event.formattedStartDate,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 130,
            bottom: 16,
            child: Text(
              event.title,
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroPlaceholder() {
    return Container(
      width: double.infinity,
      height: 220,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.event, color: AppColors.white, size: 48),
      ),
    );
  }

  Widget _buildInfoSection(EventModel event) {
    return Container(
      margin: const EdgeInsets.only(top: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 15,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoRow(Icons.calendar_today, 'Date & Time', '${event.formattedStartDate}${event.finishDateTime != null ? ' - ${event.formattedFinishDate}' : ''}'),
          const SizedBox(height: 16),
          if (event.location != null) ...[
            _infoRow(Icons.location_on, 'Location', event.location!),
            const SizedBox(height: 16),
          ],
          if (event.registrationCount != null) ...[
            _infoRow(Icons.people, 'Registered', '${event.registrationCount} attendees'),
            const SizedBox(height: 16),
          ],
          if (event.seats != null) ...[
            _infoRow(Icons.event_seat, 'Seats', '${event.seats} available'),
            const SizedBox(height: 16),
          ],
          if (event.description != null && event.description!.isNotEmpty) ...[
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 16),
            Text(
              'About This Event',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              event.description!,
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: AppColors.mutedForeground,
                height: 1.6,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(EventModel event, String status) {
    final isFinished = status == 'Finished';

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isFinished ? null : () {},
            borderRadius: BorderRadius.circular(24),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isFinished
                      ? [AppColors.mutedForeground, AppColors.mutedForeground]
                      : [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Center(
                child: Text(
                  isFinished ? 'Event Ended' : 'Register Now',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailShimmer extends StatelessWidget {
  const _DetailShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
            child: const ShimmerCard(height: 220, width: double.infinity),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: ShimmerCard(height: 200, width: double.infinity),
          ),
        ],
      ),
    );
  }
}