import 'package:dio/dio.dart';
import '../../../config/api_config.dart';
import '../../../shared/services/api_client.dart';

class CheckoutResult {
  final bool isFree;
  final String invoiceId;
  final String? paymentUrl;

  const CheckoutResult({
    required this.isFree,
    required this.invoiceId,
    this.paymentUrl,
  });
}

class PaymentInvoice {
  final String invoiceId;
  final String status;
  final double amount;
  final String method;
  final String? transactionId;
  final String? paymentMethod;
  final String? senderNumber;
  final String? gatewayTransactionId;
  final int courseId;
  final String courseTitle;
  final String courseSlug;
  final String? coupon;
  final String? paidAt;
  final String? createdAt;

  const PaymentInvoice({
    required this.invoiceId,
    required this.status,
    required this.amount,
    required this.method,
    this.transactionId,
    this.paymentMethod,
    this.senderNumber,
    this.gatewayTransactionId,
    required this.courseId,
    required this.courseTitle,
    required this.courseSlug,
    this.coupon,
    this.paidAt,
    this.createdAt,
  });

  factory PaymentInvoice.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    final course = data['course'] as Map<String, dynamic>? ?? {};
    return PaymentInvoice(
      invoiceId: (data['invoice_id'] ?? '').toString(),
      status: data['status'] as String? ?? 'pending',
      amount: (data['amount'] as num?)?.toDouble() ?? 0,
      method: data['method'] as String? ?? '',
      transactionId: data['transaction_id'] as String?,
      paymentMethod: data['payment_method'] as String?,
      senderNumber: data['sender_number'] as String?,
      gatewayTransactionId: data['gateway_transaction_id'] as String?,
      courseId: course['id'] as int? ?? 0,
      courseTitle: course['title'] as String? ?? '',
      courseSlug: course['slug'] as String? ?? '',
      coupon: data['coupon'] as String?,
      paidAt: data['paid_at'] as String?,
      createdAt: data['created_at'] as String?,
    );
  }
}

class EnrollmentService {
  final ApiClient _api = ApiClient();

  Future<CheckoutResult> initiateCheckout({
    required int courseId,
    String? couponCode,
    String? phone,
  }) async {
    try {
      final response = await _api.post(
        ApiConfig.checkoutInit,
        data: {
          'course_id': courseId,
          if (couponCode != null) 'coupon_code': couponCode,
          if (phone != null) 'phone': phone,
        },
      );

      final body = response.data as Map<String, dynamic>;
      final data = body['data'] as Map<String, dynamic>? ?? {};

      return CheckoutResult(
        isFree: data['is_free'] == true,
        invoiceId: (data['invoice_id'] ?? '').toString(),
        paymentUrl: data['payment_url'] as String?,
      );
    } on DioException catch (e) {
      final responseData = e.response?.data as Map<String, dynamic>?;
      final message = responseData?['message'] as String? ?? 'Checkout could not be initialized.';
      throw Exception(message);
    }
  }

  Future<PaymentInvoice> fetchInvoice(String invoiceId) async {
    try {
      final response = await _api.get('${ApiConfig.checkoutPayments}$invoiceId');
      final body = response.data as Map<String, dynamic>;
      return PaymentInvoice.fromJson(body);
    } on DioException catch (e) {
      final responseData = e.response?.data as Map<String, dynamic>?;
      final message = responseData?['message'] as String? ?? 'Could not fetch invoice.';
      throw Exception(message);
    }
  }
}