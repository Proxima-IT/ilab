import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/services/api_client.dart';
import '../services/auth_service.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? errorMessage;
  final bool isLoading;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.isLoading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? errorMessage,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage ?? this.errorMessage,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier() : super(const AuthState());

  Future<void> checkAuthState() async {
    debugPrint('checkAuthState: STARTED');
    state = state.copyWith(isLoading: true);
    try {
      final token = await _storage.read(key: 'auth_token');
      debugPrint('checkAuthState: Token found: ${token != null}');
      if (token == null) {
        debugPrint('checkAuthState: No token, setting unauthenticated');
        state = const AuthState(status: AuthStatus.unauthenticated);
        return;
      }

      final user = await _authService.getProfile();
      debugPrint('checkAuthState: Profile success — user=${user.id}');
      await _saveSession(user, token);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: user.copyWith(token: token),
      );
    } catch (e) {
      debugPrint('checkAuthState: Profile failed: $e');
      await _clearSession();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({
    required String login,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await _authService.login(login: login, password: password);
      if (response.success && response.data != null) {
        await _saveSession(response.data!.user, response.data!.token);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: response.data!.user.copyWith(token: response.data!.token),
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.message,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getErrorMessage(e),
      );
    }
  }

  Future<void> register({
    required String name,
    required String email,
    String? phone,
    required String password,
    required String passwordConfirmation,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getErrorMessage(e),
      );
    }
  }

  Future<void> googleLogin() async {
    debugPrint('Google Sign-In: Starting...');
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
      final account = await googleSignIn.signIn();
      debugPrint('Google Sign-In: Account = ${account?.email}');
      if (account == null) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final authentication = await account.authentication;
      debugPrint('Google Sign-In: Got authentication object');
      final idToken = authentication.idToken;
      debugPrint('Google Sign-In: idToken = ${idToken?.substring(0, 20)}...');
      if (idToken == null) {
        state = state.copyWith(isLoading: false, errorMessage: 'Failed to get Google authentication token.');
        return;
      }
      debugPrint('Google Sign-In: Calling backend...');
      final response = await _authService.googleAuth(idToken: idToken);
      debugPrint('Google Sign-In: Backend response = $response');
      if (response.success && response.data != null) {
        await _saveSession(response.data!.user, response.data!.token);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: response.data!.user.copyWith(token: response.data!.token),
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.message,
        );
      }
    } catch (e, stackTrace) {
      debugPrint('Google Sign-In: Error = $e');
      debugPrint('Google Sign-In: StackTrace = $stackTrace');
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getErrorMessage(e),
      );
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
    } catch (_) {}
    await _clearSession();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> _saveSession(UserModel user, String token) async {
    await _storage.write(key: 'auth_token', value: token);
    await _storage.write(key: 'auth_user', value: jsonEncode(user.toJson()));
  }

  Future<void> _clearSession() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'auth_user');
  }

  String _getErrorMessage(dynamic error) {
    if (error is DioException) {
      final apiException = error.error;
      if (apiException is ApiException) {
        return apiException.message;
      }

      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Unable to connect to server. Please try again.';
      }

      final response = error.response;
      if (response?.data is Map<String, dynamic>) {
        final data = response!.data as Map<String, dynamic>;
        if (data['message'] is String && (data['message'] as String).isNotEmpty) {
          return data['message'] as String;
        }
        if (data['errors'] is Map) {
          final firstField = (data['errors'] as Map).values.firstWhere(
            (e) => e is List && e.isNotEmpty,
            orElse: () => null,
          );
          if (firstField != null) {
            return (firstField as List).first.toString();
          }
        }
      }
    }
    return 'An error occurred. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});