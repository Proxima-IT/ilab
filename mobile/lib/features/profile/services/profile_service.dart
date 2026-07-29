import 'package:dio/dio.dart';
import '../../../config/api_config.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/services/api_client.dart';

class ProfileService {
  final ApiClient _api = ApiClient();

  Future<UserModel> fetchProfile() async {
    final response = await _api.get(ApiConfig.profile);
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
    return UserModel.fromJson(userData);
  }

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

  Future<UserModel> updateProfile({
    String? name,
    String? email,
    String? phone,
    String? bio,
    String? district,
    String? educationLevel,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;
    if (bio != null) body['bio'] = bio;
    if (district != null) body['district'] = district;
    if (educationLevel != null) body['education_level'] = educationLevel;

    final response = await _api.put(ApiConfig.profile, data: body);
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
    return UserModel.fromJson(userData);
  }

  Future<UserModel> updatePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _api.put(
      ApiConfig.updatePassword,
      data: {
        'current_password': currentPassword,
        'password': newPassword,
        'password_confirmation': confirmPassword,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
    return UserModel.fromJson(userData);
  }

  Future<UserModel> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(filePath, filename: 'avatar.jpg'),
    });
    final response = await _api.postFormData(ApiConfig.uploadAvatar, formData);
    final data = response.data as Map<String, dynamic>;
    final responseData = data['data'] as Map<String, dynamic>? ?? data;
    final userData = responseData['user'] as Map<String, dynamic>? ?? responseData;
    return UserModel.fromJson(userData);
  }
}