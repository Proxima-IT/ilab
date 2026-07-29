import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/event_model.dart';
import '../services/event_service.dart';

class EventListState {
  final List<EventModel> events;
  final bool isLoading;
  final String? error;

  const EventListState({this.events = const [], this.isLoading = false, this.error});

  EventListState copyWith({List<EventModel>? events, bool? isLoading, String? error}) {
    return EventListState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class EventListNotifier extends StateNotifier<EventListState> {
  final EventService _service = EventService();

  EventListNotifier() : super(const EventListState());

  Future<void> fetchEvents() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final events = await _service.fetchEvents();
      state = EventListState(events: events);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final eventListProvider = StateNotifierProvider<EventListNotifier, EventListState>((ref) {
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
      state = EventDetailState(error: e.toString());
    }
  }
}

final eventDetailProvider = StateNotifierProvider.family<EventDetailNotifier, EventDetailState, String>((ref, slug) {
  return EventDetailNotifier(slug);
});