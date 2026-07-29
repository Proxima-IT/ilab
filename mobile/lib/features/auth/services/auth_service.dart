import 'package:flutter/foundation.dart';
import '../../../config/api_config.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/services/api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  String _getDeviceId() {
    return 'flutter-${DateTime.now().millisecondsSinceEpoch}-${_randomString(8)}';
  }

  String _randomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final result = List.generate(length, (_) => chars.split('')[DateTime.now().microsecondsSinceEpoch % chars.length]);
    return result.join();
  }

  Future<ApiAuthResponse> login({
    required String login,
    required String password,
    String? fcmToken,
  }) async {
    final response = await _api.post(ApiConfig.login, data: {
      'login': login,
      'password': password,
      'portal': 'student',
      'device_id': _getDeviceId(),
      'platform': 'android',
      'fcm_token': fcmToken,
    });
    return ApiAuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ApiAuthResponse> register({
    required String name,
    required String email,
    String? phone,
    required String password,
    required String passwordConfirmation,
    String? fcmToken,
  }) async {
    final response = await _api.post(ApiConfig.register, data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'password_confirmation': passwordConfirmation,
      'device_id': _getDeviceId(),
      'platform': 'android',
      'fcm_token': fcmToken,
    });
    return ApiAuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> getProfile() async {
    final response = await _api.get(ApiConfig.profile);
    final data = response.data as Map<String, dynamic>;
    if (data['success'] == true && data['data'] != null) {
      final wrapped = data['data'] as Map<String, dynamic>;
      return UserModel.fromJson(wrapped['user'] as Map<String, dynamic>);
    }
    throw ApiException(message: data['message'] as String? ?? 'Failed to fetch profile');
  }

  Future<void> logout() async {
    await _api.post(ApiConfig.logout);
  }

  Future<ApiAuthResponse> verifyOtp({
    required String email,
    required String otp,
    String? fcmToken,
  }) async {
    final response = await _api.post(ApiConfig.verifyEmail, data: {
      'email': email,
      'otp': otp,
      'device_id': _getDeviceId(),
      'platform': 'android',
      'fcm_token': fcmToken,
    });
    return ApiAuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> resendOtp({required String email}) async {
    await _api.post(ApiConfig.resendVerification, data: {
      'email': email,
    });
  }

  Future<void> forgotPassword({required String identifier}) async {
    await _api.post(ApiConfig.forgotPassword, data: {
      'identifier': identifier,
    });
  }

  Future<void> resetPassword({
    required String identifier,
    required String otp,
    required String password,
    required String passwordConfirmation,
  }) async {
    await _api.post(ApiConfig.resetPassword, data: {
      'identifier': identifier,
      'otp': otp,
      'password': password,
      'password_confirmation': passwordConfirmation,
    });
  }

  Future<ApiAuthResponse> googleAuth({
    required String idToken,
    String? fcmToken,
  }) async {
    final endpoint = ApiConfig.google;
    final body = {
      'id_token': idToken,
      'portal': 'student',
      'device_id': _getDeviceId(),
      'platform': 'android',
      'fcm_token': fcmToken,
    };
    debugPrint('AuthService.googleAuth: Sending to $endpoint');
    debugPrint('AuthService.googleAuth: Body = $body');
    try {
      final response = await _api.post(endpoint, data: body);
      debugPrint('AuthService.googleAuth: Response = $response');
      return ApiAuthResponse.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      debugPrint('AuthService.googleAuth: Error = $e');
      rethrow;
    }
  }
}

class ApiAuthResponse {
  final bool success;
  final ApiAuthData? data;
  final String message;
  final Map<String, dynamic>? errors;

  const ApiAuthResponse({
    required this.success,
    this.data,
    required this.message,
    this.errors,
  });

  factory ApiAuthResponse.fromJson(Map<String, dynamic> json) {
    return ApiAuthResponse(
      success: json['success'] as bool? ?? false,
      data: json['data'] != null ? ApiAuthData.fromJson(json['data'] as Map<String, dynamic>) : null,
      message: json['message'] as String? ?? '',
      errors: json['errors'] as Map<String, dynamic>?,
    );
  }
}

class ApiAuthData {
  final UserModel user;
  final String token;
  final String? tokenType;
  final bool? profileCompleted;
  final bool? phoneVerificationRequired;
  final bool? emailVerificationRequired;

  const ApiAuthData({
    required this.user,
    required this.token,
    this.tokenType,
    this.profileCompleted,
    this.phoneVerificationRequired,
    this.emailVerificationRequired,
  });

  factory ApiAuthData.fromJson(Map<String, dynamic> json) {
    return ApiAuthData(
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      token: json['token'] as String? ?? '',
      tokenType: json['token_type'] as String?,
      profileCompleted: json['profile_completed'] as bool?,
      phoneVerificationRequired: json['phone_verification_required'] as bool?,
      emailVerificationRequired: json['email_verification_required'] as bool?,
    );
  }
}