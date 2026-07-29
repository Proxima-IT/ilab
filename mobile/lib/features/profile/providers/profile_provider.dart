import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/services/api_client.dart';
import '../services/profile_service.dart';

class ProfileState {
  final UserModel? user;
  final List<CertificateModel> certificates;
  final bool isLoading;
  final String? error;

  final bool isSavingProfile;
  final bool isSavingPassword;
  final bool isUploadingAvatar;
  final String? successMessage;
  final String? profileError;
  final String? passwordError;

  const ProfileState({
    this.user,
    this.certificates = const [],
    this.isLoading = false,
    this.error,
    this.isSavingProfile = false,
    this.isSavingPassword = false,
    this.isUploadingAvatar = false,
    this.successMessage,
    this.profileError,
    this.passwordError,
  });

  ProfileState copyWith({
    UserModel? user,
    List<CertificateModel>? certificates,
    bool? isLoading,
    String? error,
    bool? isSavingProfile,
    bool? isSavingPassword,
    bool? isUploadingAvatar,
    String? successMessage,
    String? profileError,
    String? passwordError,
  }) {
    return ProfileState(
      user: user ?? this.user,
      certificates: certificates ?? this.certificates,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isSavingProfile: isSavingProfile ?? this.isSavingProfile,
      isSavingPassword: isSavingPassword ?? this.isSavingPassword,
      isUploadingAvatar: isUploadingAvatar ?? this.isUploadingAvatar,
      successMessage: successMessage,
      profileError: profileError,
      passwordError: passwordError,
    );
  }
}

class ProfileNotifier extends StateNotifier<ProfileState> {
  final ProfileService _service = ProfileService();

  ProfileNotifier() : super(const ProfileState());

  Future<void> fetchProfile() async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final user = await _service.fetchProfile();
      final certs = await _service.fetchCertificates();
      state = ProfileState(user: user, certificates: certs);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _formatError(e));
    }
  }

  Future<bool> updateProfile({
    String? name,
    String? email,
    String? phone,
    String? bio,
    String? district,
    String? educationLevel,
  }) async {
    state = state.copyWith(
      isSavingProfile: true,
      profileError: null,
      successMessage: null,
    );
    try {
      final user = await _service.updateProfile(
        name: name,
        email: email,
        phone: phone,
        bio: bio,
        district: district,
        educationLevel: educationLevel,
      );
      state = state.copyWith(
        user: user,
        isSavingProfile: false,
        successMessage: 'Profile updated successfully.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSavingProfile: false,
        profileError: _formatError(e),
      );
      return false;
    }
  }

  Future<bool> updatePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    state = state.copyWith(
      isSavingPassword: true,
      passwordError: null,
      successMessage: null,
    );
    try {
      final user = await _service.updatePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      state = state.copyWith(
        user: user,
        isSavingPassword: false,
        successMessage: 'Password updated successfully.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSavingPassword: false,
        passwordError: _formatError(e),
      );
      return false;
    }
  }

  Future<bool> uploadAvatar(String filePath) async {
    state = state.copyWith(
      isUploadingAvatar: true,
      successMessage: null,
    );
    try {
      final user = await _service.uploadAvatar(filePath);
      state = state.copyWith(
        user: user,
        isUploadingAvatar: false,
        successMessage: 'Avatar updated successfully.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isUploadingAvatar: false,
        error: _formatError(e),
      );
      return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(
      successMessage: null,
      profileError: null,
      passwordError: null,
      error: null,
    );
  }

  String _formatError(dynamic error) {
    if (error is ApiException) {
      return error.message;
    }
    final str = error.toString();
    if (str.startsWith('Exception: ')) {
      return str.substring(11);
    }
    return str;
  }
}

final profileProvider = StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  return ProfileNotifier();
});