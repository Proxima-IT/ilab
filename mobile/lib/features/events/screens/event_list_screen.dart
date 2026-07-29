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
      return const EmptyStateWidget(
        icon: Icons.event,
        title: 'No events yet',
        subtitle: 'Check back later for upcoming events.',
      );
    }
    return CustomScrollView(
      controller: _scrollController,
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
        SliverToBoxAdapter(
          child: _buildFooter(state),
        ),
      ],
    );
  }

  Widget _buildFooter(EventListState state) {
    if (state.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (!state.hasMore && state.events.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No more events',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
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
            label: const Text('Retry'),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}