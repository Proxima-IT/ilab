import 'package:flutter/material.dart';

class AppTextStyles {
  AppTextStyles._();

  static const String fontSans = 'Plus Jakarta Sans';
  static const String fontDisplay = 'Plus Jakarta Sans';
  static const String fontDisplayDashboard = 'Orbitron';
  static const String fontUi = 'Exo 2';
  static const String fontBangla = 'Hind Siliguri';
  static const String fontMono = 'JetBrains Mono';

  static TextStyle get displayLarge => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 64,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.02,
        height: 1.05,
      );

  static TextStyle get displayMedium => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 48,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.02,
        height: 1.05,
      );

  static TextStyle get displaySmall => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 36,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.02,
        height: 1.1,
      );

  static TextStyle get headlineLarge => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get headlineMedium => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get headlineSmall => const TextStyle(
        fontFamily: fontDisplay,
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get titleLarge => const TextStyle(
        fontFamily: fontSans,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get titleMedium => const TextStyle(
        fontFamily: fontSans,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleSmall => const TextStyle(
        fontFamily: fontSans,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get cardTitleSmall => const TextStyle(
        fontFamily: fontSans,
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  static TextStyle get bodyLarge => const TextStyle(
        fontFamily: fontSans,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => const TextStyle(
        fontFamily: fontSans,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => const TextStyle(
        fontFamily: fontSans,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get labelLarge => const TextStyle(
        fontFamily: fontSans,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelMedium => const TextStyle(
        fontFamily: fontSans,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelSmall => const TextStyle(
        fontFamily: fontSans,
        fontSize: 10,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get dashboardDisplay => const TextStyle(
        fontFamily: fontDisplayDashboard,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get uiText => const TextStyle(
        fontFamily: fontUi,
      );

  static TextStyle get banglaText => const TextStyle(
        fontFamily: fontBangla,
      );

  static TextStyle get monoText => const TextStyle(
        fontFamily: fontMono,
      );

  static TextStyle get buttonLarge => const TextStyle(
        fontFamily: fontSans,
        fontSize: 16,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get buttonMedium => const TextStyle(
        fontFamily: fontSans,
        fontSize: 14,
        fontWeight: FontWeight.w700,
      );
}