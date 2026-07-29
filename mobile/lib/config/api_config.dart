class ApiConfig {
  static const String baseUrl = 'https://api.ilabbd.com/api/v1';
  static const String imageBaseUrl = 'https://api.ilabbd.com';

  static String? resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '$imageBaseUrl/$url';
  }

  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String google = '/auth/google';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-email-verification';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String courses = '/courses';
  static const String courseDetail = '/courses/';
  static const String lessons = '/lessons/';
  static const String blogPosts = '/blog-posts';
  static const String blogDetail = '/blog-posts/';
  static const String events = '/events';
  static const String eventDetail = '/events/';
  static const String profile = '/student/profile';
  static const String updatePassword = '/student/profile/password';
  static const String uploadAvatar = '/student/profile/avatar';
  static const String certificates = '/student/certificates';
  static const String enrollments = '/enrollments';
  static const String notificationSettings = '/student/notification-settings';
  static const String notifications = '/student/notifications';
  static const String checkoutInit = '/checkout/init';
  static const String checkoutCouponPreview = '/checkout/coupon/preview';
  static const String checkoutPayments = '/checkout/payments/';
}