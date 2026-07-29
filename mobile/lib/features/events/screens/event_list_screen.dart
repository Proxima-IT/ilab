import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/screens/main_shell.dart';
import '../providers/event_provider.dart';

class EventListScreen extends ConsumerStatefulWidget {
  const EventListScreen({super.key});

  @override
  ConsumerState<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends ConsumerState<EventListScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(eventListProvider.notifier).fetchEvents());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(eventListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(eventListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(eventListProvider.notifier).refresh(),
      child: _buildBody(state),
    );
  }

  Widget _buildBody(EventListState state) {
    if (state.isLoading && state.events.isEmpty) {
      return const ShimmerList();
    }
    if (state.error != null && state.events.isEmpty) {
      return ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(eventListProvider.notifier).fetchEvents(),
      );
    }
    if (state.events.isEmpty) {
      return _buildEmptyState();
    }
    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildEventCard(state.events[i]),
              ),
              childCount: state.events.length,
            ),
          ),
        ),
        SliverToBoxAdapter(child: _buildFooter(state)),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              context.findAncestorStateOfType<MainShellState>()?.switchToTab(0);
            },
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFE7E5ED),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                color: Color(0xFF0F172A),
                size: 22,
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Text(
                'Events',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ),
          const SizedBox(width: 44),
        ],
      ),
    );
  }

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

  Widget _buildEventCard(EventModel event) {
    final hasImage = event.coverUrl != null && event.coverUrl!.isNotEmpty;
    final status = _eventStatus(event);
    final statusColor = _statusColor(status);

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/event-detail', arguments: event.slug),
      child: Container(
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
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: SizedBox(
                width: double.infinity,
                height: 160,
                child: Stack(
                  children: [
                    hasImage
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: SizedBox(
                              width: double.infinity,
                              height: 160,
                              child: Image.network(
                                event.coverUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => Container(
                                  color: AppColors.muted,
                                  child: const Center(
                                    child: Icon(Icons.event, color: AppColors.mutedForeground, size: 32),
                                  ),
                                ),
                              ),
                            ),
                          )
                        : ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              color: AppColors.muted,
                              height: 160,
                              child: const Center(
                                child: Icon(Icons.event, color: AppColors.mutedForeground, size: 32),
                              ),
                            ),
                          ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        event.formattedStartDate,
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  if (event.location != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on, size: 14, color: AppColors.mutedForeground),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            event.location!,
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              color: AppColors.mutedForeground,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (event.registrationCount != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.people, size: 14, color: AppColors.mutedForeground),
                        const SizedBox(width: 6),
                        Text(
                          '${event.registrationCount} registered',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ],
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

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 100),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.6,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.muted,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.event,
                  size: 64,
                  color: AppColors.mutedForeground.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No events available',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Check back later for upcoming events',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(EventListState state) {
    if (state.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary)),
      );
    }
    if (!state.hasMore && state.events.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No more events',
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: AppColors.mutedForeground,
            ),
          ),
        ),
      );
    }
    if (state.error != null && state.events.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: TextButton.icon(
            onPressed: () => ref.read(eventListProvider.notifier).loadMore(),
            icon: const Icon(Icons.refresh, size: 18),
            label: Text(
              'Retry',
              style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}