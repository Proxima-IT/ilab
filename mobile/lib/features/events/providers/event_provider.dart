import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../../../shared/services/api_client.dart';
import '../services/event_service.dart';

class EventListState {
  final List<EventModel> events;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const EventListState({
    this.events = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  EventListState copyWith({
    List<EventModel>? events,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return EventListState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class EventListNotifier extends StateNotifier<EventListState> {
  final EventService _service = EventService();

  EventListNotifier() : super(const EventListState());

  Future<void> fetchEvents() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.fetchEvents(page: 1);
      state = EventListState(
        events: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null, isLoadingMore: false);
    try {
      final result = await _service.fetchEvents(page: 1);
      state = EventListState(
        events: result.items,
        currentPage: 1,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true, error: null);
    try {
      final nextPage = state.currentPage + 1;
      final result = await _service.fetchEvents(page: nextPage);
      state = EventListState(
        events: [...state.events, ...result.items],
        currentPage: nextPage,
        hasMore: result.meta.hasMore,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: formatErrorMessage(e));
    }
  }
}

final eventListProvider = StateNotifierProvider.autoDispose<EventListNotifier, EventListState>((ref) {
  return EventListNotifier();
});

class EventDetailState {
  final EventModel? event;
  final bool isLoading;
  final String? error;

  const EventDetailState({this.event, this.isLoading = false, this.error});
}

class EventDetailNotifier extends StateNotifier<EventDetailState> {
  final EventService _service = EventService();

  EventDetailNotifier(String slug) : super(const EventDetailState(isLoading: true)) {
    fetchDetail(slug);
  }

  Future<void> fetchDetail(String slug) async {
    state = const EventDetailState(isLoading: true);
    try {
      final event = await _service.fetchEventDetail(slug);
      state = EventDetailState(event: event);
    } catch (e) {
      state = EventDetailState(error: formatErrorMessage(e));
    }
  }
}

final eventDetailProvider = StateNotifierProvider.autoDispose.family<EventDetailNotifier, EventDetailState, String>((ref, slug) {
  return EventDetailNotifier(slug);
});