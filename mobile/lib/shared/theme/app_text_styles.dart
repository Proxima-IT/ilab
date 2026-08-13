import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTextStyles {
  AppTextStyles._();

  static const String fontSans = 'Outfit';
  static const String fontDisplay = 'Outfit';
  static const String fontDisplayDashboard = 'Orbitron';
  static const String fontUi = 'Exo 2';
  static const String fontBangla = 'Hind Siliguri';
  static const String fontMono = 'JetBrains Mono';

  static TextStyle get displayLarge => GoogleFonts.outfit(
        fontSize: 64,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
        height: 1.05,
      );

  static TextStyle get displayMedium => GoogleFonts.outfit(
        fontSize: 48,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
        height: 1.05,
      );

  static TextStyle get displaySmall => GoogleFonts.outfit(
        fontSize: 36,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
        height: 1.1,
      );

  static TextStyle get headlineLarge => GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get headlineMedium => GoogleFonts.outfit(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get headlineSmall => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
      );

  static TextStyle get titleLarge => GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleMedium => GoogleFonts.outfit(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleSmall => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get cardTitleSmall => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  static TextStyle get bodyLarge => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get labelLarge => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelMedium => GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelSmall => GoogleFonts.outfit(
        fontSize: 10,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get dashboardDisplay => TextStyle(
        fontFamily: fontDisplayDashboard,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get uiText => TextStyle(
        fontFamily: fontUi,
      );

  static TextStyle get banglaText => TextStyle(
        fontFamily: fontBangla,
      );

  static TextStyle get monoText => TextStyle(
        fontFamily: fontMono,
      );

  static TextStyle get buttonLarge => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get buttonMedium => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );
}