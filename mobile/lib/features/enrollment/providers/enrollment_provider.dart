import 'package:flutter_riverpod/flutter_riverpod.dart';

final enrollmentProvider = StateNotifierProvider<EnrollmentNotifier, AsyncValue<void>>((ref) {
  return EnrollmentNotifier();
});

class EnrollmentNotifier extends StateNotifier<AsyncValue<void>> {
  EnrollmentNotifier() : super(const AsyncValue.data(null));
}