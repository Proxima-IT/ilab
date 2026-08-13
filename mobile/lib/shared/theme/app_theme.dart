import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';

class AppTheme {
  AppTheme._();

  static const double _radius = 14.0;

  static Radius get radiusSm => const Radius.circular(_radius - 4);
  static Radius get radiusMd => const Radius.circular(_radius - 2);
  static Radius get radiusLg => const Radius.circular(_radius);
  static Radius get radiusXl => const Radius.circular(_radius + 4);
  static Radius get radius2xl => const Radius.circular(_radius + 8);
  static Radius get radius3xl => const Radius.circular(_radius + 12);
  static Radius get radiusPill => const Radius.circular(999);

  static BorderRadius get borderRadiusSm => BorderRadius.all(radiusSm);
  static BorderRadius get borderRadiusMd => BorderRadius.all(radiusMd);
  static BorderRadius get borderRadiusLg => BorderRadius.all(radiusLg);
  static BorderRadius get borderRadiusXl => BorderRadius.all(radiusXl);
  static BorderRadius get borderRadius2xl => BorderRadius.all(radius2xl);
  static BorderRadius get borderRadius3xl => BorderRadius.all(radius3xl);
  static BorderRadius get borderRadiusPill => BorderRadius.all(radiusPill);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          onPrimary: AppColors.white,
          primaryContainer: AppColors.primaryDark,
          onPrimaryContainer: AppColors.white,
          secondary: AppColors.secondary,
          onSecondary: AppColors.secondaryForeground,
          tertiary: AppColors.accent,
          onTertiary: AppColors.white,
          surface: AppColors.background,
          onSurface: AppColors.foreground,
          surfaceContainerHighest: AppColors.surface,
          error: AppColors.destructive,
          onError: AppColors.destructiveForeground,
          outline: AppColors.border,
        ),
        scaffoldBackgroundColor: AppColors.background,
        fontFamily: AppTextStyles.fontSans,

        appBarTheme: AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.foreground,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: AppTextStyles.titleLarge,
        ),

        textTheme: TextTheme(
          displayLarge: AppTextStyles.displayLarge.copyWith(color: AppColors.foreground),
          displayMedium: AppTextStyles.displayMedium.copyWith(color: AppColors.foreground),
          displaySmall: AppTextStyles.displaySmall.copyWith(color: AppColors.foreground),
          headlineLarge: AppTextStyles.headlineLarge.copyWith(color: AppColors.foreground),
          headlineMedium: AppTextStyles.headlineMedium.copyWith(color: AppColors.foreground),
          headlineSmall: AppTextStyles.headlineSmall.copyWith(color: AppColors.foreground),
          titleLarge: AppTextStyles.titleLarge.copyWith(color: AppColors.foreground),
          titleMedium: AppTextStyles.titleMedium.copyWith(color: AppColors.foreground),
          titleSmall: AppTextStyles.titleSmall.copyWith(color: AppColors.foreground),
          bodyLarge: AppTextStyles.bodyLarge.copyWith(color: AppColors.foreground),
          bodyMedium: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
          bodySmall: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
          labelLarge: AppTextStyles.labelLarge.copyWith(color: AppColors.foreground),
          labelMedium: AppTextStyles.labelMedium.copyWith(color: AppColors.mutedForeground),
          labelSmall: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            disabledBackgroundColor: AppColors.muted,
            disabledForegroundColor: AppColors.mutedForeground,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            disabledBackgroundColor: AppColors.muted,
            disabledForegroundColor: AppColors.mutedForeground,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.foreground,
            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.glassBg,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
          border: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.glassBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.glassBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.4)),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: const BorderSide(color: AppColors.destructive),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: const BorderSide(color: AppColors.destructive),
          ),
        ),

        cardTheme: CardThemeData(
          elevation: 0,
          color: AppColors.card,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadiusXl,
            side: BorderSide(color: AppColors.border),
          ),
        ),

        dividerTheme: DividerThemeData(
          color: AppColors.border,
          thickness: 1,
          space: 1,
        ),

        chipTheme: ChipThemeData(
          backgroundColor: AppColors.muted,
          labelStyle: AppTextStyles.labelMedium.copyWith(color: AppColors.foreground),
          side: BorderSide.none,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadiusPill,
          ),
        ),

        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: AppColors.background,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.mutedForeground,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          onPrimary: AppColors.darkForeground,
          primaryContainer: AppColors.primaryDark,
          onPrimaryContainer: AppColors.white,
          secondary: AppColors.darkMuted,
          onSecondary: AppColors.darkForeground,
          tertiary: AppColors.accent,
          onTertiary: AppColors.white,
          surface: AppColors.darkBackground,
          onSurface: AppColors.darkForeground,
          surfaceContainerHighest: AppColors.darkSurface,
          error: AppColors.destructive,
          onError: AppColors.destructiveForeground,
          outline: AppColors.darkBorder,
        ),
        scaffoldBackgroundColor: AppColors.darkBackground,
        fontFamily: AppTextStyles.fontSans,

        appBarTheme: AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: AppColors.darkBackground,
          foregroundColor: AppColors.darkForeground,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: AppTextStyles.titleLarge.copyWith(color: AppColors.darkForeground),
        ),

        textTheme: TextTheme(
          displayLarge: AppTextStyles.displayLarge.copyWith(color: AppColors.darkForeground),
          displayMedium: AppTextStyles.displayMedium.copyWith(color: AppColors.darkForeground),
          displaySmall: AppTextStyles.displaySmall.copyWith(color: AppColors.darkForeground),
          headlineLarge: AppTextStyles.headlineLarge.copyWith(color: AppColors.darkForeground),
          headlineMedium: AppTextStyles.headlineMedium.copyWith(color: AppColors.darkForeground),
          headlineSmall: AppTextStyles.headlineSmall.copyWith(color: AppColors.darkForeground),
          titleLarge: AppTextStyles.titleLarge.copyWith(color: AppColors.darkForeground),
          titleMedium: AppTextStyles.titleMedium.copyWith(color: AppColors.darkForeground),
          titleSmall: AppTextStyles.titleSmall.copyWith(color: AppColors.darkForeground),
          bodyLarge: AppTextStyles.bodyLarge.copyWith(color: AppColors.darkForeground),
          bodyMedium: AppTextStyles.bodyMedium.copyWith(color: AppColors.darkMutedForeground),
          bodySmall: AppTextStyles.bodySmall.copyWith(color: AppColors.darkMutedForeground),
          labelLarge: AppTextStyles.labelLarge.copyWith(color: AppColors.darkForeground),
          labelMedium: AppTextStyles.labelMedium.copyWith(color: AppColors.darkMutedForeground),
          labelSmall: AppTextStyles.labelSmall.copyWith(color: AppColors.darkMutedForeground),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            disabledBackgroundColor: AppColors.darkMuted,
            disabledForegroundColor: AppColors.darkMutedForeground,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            disabledBackgroundColor: AppColors.darkMuted,
            disabledForegroundColor: AppColors.darkMutedForeground,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.darkForeground,
            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: AppTextStyles.buttonMedium,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadiusMd,
            ),
          ),
        ),

        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.darkGlassBg,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.darkMutedForeground),
          border: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.darkGlassBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.darkGlassBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.4)),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: const BorderSide(color: AppColors.destructive),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: borderRadiusLg,
            borderSide: const BorderSide(color: AppColors.destructive),
          ),
        ),

        cardTheme: CardThemeData(
          elevation: 0,
          color: AppColors.darkCard,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadiusXl,
            side: BorderSide(color: AppColors.darkBorder),
          ),
        ),

        dividerTheme: DividerThemeData(
          color: AppColors.darkBorder,
          thickness: 1,
          space: 1,
        ),

        chipTheme: ChipThemeData(
          backgroundColor: AppColors.darkMuted,
          labelStyle: AppTextStyles.labelMedium.copyWith(color: AppColors.darkForeground),
          side: BorderSide.none,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadiusPill,
          ),
        ),

        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: AppColors.darkBackground,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.darkMutedForeground,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
        ),
      );
}