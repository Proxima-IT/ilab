import '../../../config/api_config.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/services/api_client.dart';

class CertificateService {
  final ApiClient _api = ApiClient();

  Future<List<CertificateModel>> fetchCertificates() async {
    final response = await _api.get(ApiConfig.certificates);
    final data = response.data;
    final List<dynamic> items;
    if (data is Map<String, dynamic>) {
      final raw = data['data'];
      if (raw is List) {
        items = raw;
      } else if (raw is Map<String, dynamic>) {
        items = (raw['certificates'] as List<dynamic>?) ?? [];
      } else {
        items = [];
      }
    } else if (data is List) {
      items = data;
    } else {
      items = [];
    }
    return items
        .map((e) => CertificateModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}