import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/event_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/event_provider.dart';

class EventListScreen extends ConsumerStatefulWidget {
  const EventListScreen({super.key});

  @override
  ConsumerState<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends ConsumerState<EventListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(eventListProvider.notifier).fetchEvents());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(eventListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(eventListProvider.notifier).fetchEvents(),
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
      return const EmptyStateWidget(
        icon: Icons.event,
        title: 'No events yet',
        subtitle: 'Check back later for upcoming events.',
      );
    }
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Events',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Upcoming events & workshops',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: EventCard(
                  event: state.events[i],
                  onTap: () => Navigator.pushNamed(context, '/event-detail', arguments: state.events[i].slug),
                ),
              ),
              childCount: state.events.length,
            ),
          ),
        ),
      ],
    );
  }
}