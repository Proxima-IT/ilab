import '../../../config/api_config.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/services/api_client.dart';

class EventService {
  final ApiClient _api = ApiClient();

  Future<List<EventModel>> fetchEvents({int? perPage}) async {
    final params = <String, dynamic>{};
    if (perPage != null) params['per_page'] = perPage;
    final response = await _api.get(ApiConfig.events, queryParams: params.isNotEmpty ? params : null);
    final data = response.data;
    final List<dynamic> items;
    if (data is Map<String, dynamic>) {
      items = (data['data'] as List<dynamic>?) ?? (data['items'] as List<dynamic>?) ?? [];
    } else if (data is List) {
      items = data;
    } else {
      items = [];
    }
    return items.map((e) => EventModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<EventModel> fetchEventDetail(String slug) async {
    final response = await _api.get('${ApiConfig.eventDetail}$slug');
    final data = response.data as Map<String, dynamic>;
    final eventData = data['data'] as Map<String, dynamic>? ?? data;
    return EventModel.fromJson(eventData);
  }
}