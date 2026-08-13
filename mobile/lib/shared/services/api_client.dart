import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../config/api_config.dart';
import 'connectivity_service.dart';

class ApiException implements Exception {
  final String message;
  final Map<String, dynamic>? errors;
  final int? statusCode;

  const ApiException({
    required this.message,
    this.errors,
    this.statusCode,
  });

  @override
  String toString() => message;
}

String formatErrorMessage(dynamic error) {
  if (error is ApiException) return error.message;
  if (error is DioException) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'No internet connection. Please check your network and try again.';
    }
    final apiError = error.error;
    if (apiError is ApiException) return apiError.message;
    return 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.type == DioExceptionType.connectionError ||
              error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout) {
            ConnectivityService.instance.showOverlay();
            handler.next(DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: const ApiException(
                message: 'No internet connection. Please check your network and try again.',
              ),
              message: 'No internet connection. Please check your network and try again.',
            ));
            return;
          }

          if (error.response?.statusCode == 401) {
            _storage.delete(key: 'auth_token');
            _storage.delete(key: 'auth_user');
          }

          final responseData = error.response?.data;
          if (responseData is Map<String, dynamic>) {
            final message = responseData['message'] as String?;
            final errors = responseData['errors'] as Map<String, dynamic>?;
            if (message != null || errors != null) {
              handler.next(DioException(
                requestOptions: error.requestOptions,
                response: error.response,
                type: error.type,
                error: ApiException(
                  message: message ?? 'Validation failed',
                  errors: errors,
                  statusCode: error.response?.statusCode,
                ),
                message: message,
              ));
              return;
            }
          }

          handler.next(error);
        },
      ),
    );

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) async {
    return _dio.get(path, queryParameters: queryParams);
  }

  Future<Response> post(String path, {Map<String, dynamic>? data}) async {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {Map<String, dynamic>? data}) async {
    return _dio.put(path, data: data);
  }

  Future<Response> postFormData(String path, FormData formData) async {
    return _dio.post(path, data: formData);
  }

  Future<Response> delete(String path) async {
    return _dio.delete(path);
  }
}