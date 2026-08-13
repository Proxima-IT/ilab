import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/services/api_client.dart';
import '../services/enrollment_service.dart';

enum CheckoutStatus { idle, loading, waitingPayment, success, error, cancelled }

class CheckoutState {
  final CheckoutStatus status;
  final String? paymentUrl;
  final String? invoiceId;
  final String? errorMessage;
  final bool isFree;
  final bool isLoading;

  const CheckoutState({
    this.status = CheckoutStatus.idle,
    this.paymentUrl,
    this.invoiceId,
    this.errorMessage,
    this.isFree = false,
    this.isLoading = false,
  });

  CheckoutState copyWith({
    CheckoutStatus? status,
    String? paymentUrl,
    String? invoiceId,
    String? errorMessage,
    bool? isFree,
    bool? isLoading,
  }) {
    return CheckoutState(
      status: status ?? this.status,
      paymentUrl: paymentUrl ?? this.paymentUrl,
      invoiceId: invoiceId ?? this.invoiceId,
      errorMessage: errorMessage,
      isFree: isFree ?? this.isFree,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class EnrollmentNotifier extends StateNotifier<CheckoutState> {
  final EnrollmentService _service = EnrollmentService();

  EnrollmentNotifier() : super(const CheckoutState());

  Future<String?> initiateCheckout({
    required int courseId,
    String? couponCode,
    String? phone,
  }) async {
    state = state.copyWith(status: CheckoutStatus.loading, isLoading: true, errorMessage: null);
    try {
      final result = await _service.initiateCheckout(
        courseId: courseId,
        couponCode: couponCode,
        phone: phone,
      );

      if (result.isFree) {
        state = state.copyWith(
          status: CheckoutStatus.success,
          invoiceId: result.invoiceId,
          isFree: true,
          isLoading: false,
        );
        return result.invoiceId;
      }

      if (result.paymentUrl == null) {
        state = state.copyWith(
          status: CheckoutStatus.error,
          errorMessage: 'Payment URL not received.',
          isLoading: false,
        );
        return null;
      }

      state = state.copyWith(
        status: CheckoutStatus.waitingPayment,
        paymentUrl: result.paymentUrl,
        invoiceId: result.invoiceId,
        isFree: false,
        isLoading: false,
      );
      return result.invoiceId;
    } catch (e) {
      state = state.copyWith(
        status: CheckoutStatus.error,
        errorMessage: formatErrorMessage(e),
        isLoading: false,
      );
      return null;
    }
  }

  void onPaymentSuccess(String invoiceId) {
    state = state.copyWith(
      status: CheckoutStatus.success,
      invoiceId: invoiceId,
    );
  }

  void onPaymentCancelled() {
    state = state.copyWith(
      status: CheckoutStatus.cancelled,
      paymentUrl: null,
    );
  }

  void onPaymentError(String message) {
    state = state.copyWith(
      status: CheckoutStatus.error,
      errorMessage: message,
    );
  }

  void reset() {
    state = const CheckoutState();
  }
}

final enrollmentProvider = StateNotifierProvider<EnrollmentNotifier, CheckoutState>((ref) {
  return EnrollmentNotifier();
});