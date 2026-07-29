import '../../../config/api_config.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../../../shared/services/api_client.dart';

class EventService {
  final ApiClient _api = ApiClient();

  Future<({List<EventModel> items, PaginationMeta meta})> fetchEvents({int page = 1, int perPage = 12}) async {
    final params = <String, dynamic>{'page': page, 'per_page': perPage};
    final response = await _api.get(ApiConfig.events, queryParams: params);
    final data = response.data as Map<String, dynamic>;
    final List<dynamic> itemsList = (data['data'] as List<dynamic>?) ?? [];
    final items = itemsList.map((e) => EventModel.fromJson(e as Map<String, dynamic>)).toList();
    final meta = PaginationMeta.fromJson((data['meta'] as Map<String, dynamic>?) ?? {});
    return (items: items, meta: meta);
  }

  Future<EventModel> fetchEventDetail(String slug) async {
    final response = await _api.get('${ApiConfig.eventDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final eventData = data['data'] as Map<String, dynamic>? ?? data;
    return EventModel.fromJson(eventData);
  }
}