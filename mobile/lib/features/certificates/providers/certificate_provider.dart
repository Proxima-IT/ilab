import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/certificate_model.dart';
import '../../../shared/services/api_client.dart';
import '../services/certificate_service.dart';

class CertificateListState {
  final List<CertificateModel> certificates;
  final bool isLoading;
  final String? error;

  const CertificateListState({
    this.certificates = const [],
    this.isLoading = false,
    this.error,
  });

  CertificateListState copyWith({List<CertificateModel>? certificates, bool? isLoading, String? error}) {
    return CertificateListState(
      certificates: certificates ?? this.certificates,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CertificateNotifier extends StateNotifier<CertificateListState> {
  final CertificateService _service = CertificateService();

  CertificateNotifier() : super(const CertificateListState());

  Future<void> fetchCertificates() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final certs = await _service.fetchCertificates();
      state = CertificateListState(certificates: certs);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }
}

final certificateProvider = StateNotifierProvider.autoDispose<CertificateNotifier, CertificateListState>((ref) {
  return CertificateNotifier();
});