// The Finly theme, built only from the generated tokens (design-system/project/06-flutter-implementation.md): a
// Material 3 ColorScheme filled from the palette, the type scale in sp, and the full palette as a ThemeExtension so
// money and state colours are always `context.fy.moneyIn` and never a literal.
import 'package:flutter/material.dart';

import 'tokens.g.dart';

class FyColors extends ThemeExtension<FyColors> {
  const FyColors(this.p);

  final FyPalette p;

  @override
  FyColors copyWith({FyPalette? p}) => FyColors(p ?? this.p);

  @override
  FyColors lerp(covariant FyColors? other, double t) =>
      t < 0.5 ? this : (other ?? this);
}

extension FyContext on BuildContext {
  FyPalette get fy => Theme.of(this).extension<FyColors>()!.p;
  TextTheme get text => Theme.of(this).textTheme;

  /// Durations shrink to zero when the system asks for reduced motion (add-on 08).
  Duration motion(Duration d) =>
      MediaQuery.disableAnimationsOf(this) ? Duration.zero : d;
}

TextStyle _style(FyTypeStyle s, Color color) => TextStyle(
  fontSize: s.size,
  height: s.height / s.size,
  fontWeight: FontWeight.values.firstWhere(
    (w) => w.value == s.weight,
    orElse: () => FontWeight.w400,
  ),
  color: color,
  fontFeatures: const [FontFeature.tabularFigures()],
);

ThemeData fyTheme(Brightness brightness) {
  final p = brightness == Brightness.light ? fyLight : fyDark;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: p.brand,
    onPrimary: p.onBrand,
    primaryContainer: p.brandSoft,
    onPrimaryContainer: p.ink,
    secondary: p.accent,
    onSecondary: p.onAccent,
    error: p.blocked,
    onError: p.onBrand,
    errorContainer: p.blockedSoft,
    onErrorContainer: p.ink,
    surface: p.surface,
    onSurface: p.ink,
    onSurfaceVariant: p.inkMuted,
    surfaceContainerLowest: p.surfaceRaised,
    surfaceContainerLow: p.surfaceRaised,
    surfaceContainer: p.surfaceRaised,
    surfaceContainerHigh: p.surfaceSunken,
    surfaceContainerHighest: p.surfaceSunken,
    outline: p.lineStrong,
    outlineVariant: p.line,
    scrim: p.scrim,
  );
  final text = TextTheme(
    displayLarge: _style(FyType.display, p.ink),
    headlineMedium: _style(FyType.titleLg, p.ink),
    titleLarge: _style(FyType.title, p.ink),
    titleMedium: _style(FyType.section, p.ink),
    titleSmall: _style(FyType.subhead, p.ink),
    bodyLarge: _style(FyType.body, p.ink),
    bodyMedium: _style(FyType.bodySm, p.ink),
    bodySmall: _style(FyType.caption, p.inkMuted),
    labelLarge: _style(FyType.button, p.ink),
    labelMedium: _style(FyType.label, p.ink),
    labelSmall: _style(FyType.figure, p.inkMuted),
  );
  final radiusMd = BorderRadius.circular(FyDims.radiusMd);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: p.surface,
    textTheme: text,
    extensions: [FyColors(p)],
    appBarTheme: AppBarTheme(
      backgroundColor: p.surfaceRaised,
      foregroundColor: p.ink,
      elevation: 0,
      scrolledUnderElevation: 1,
      titleTextStyle: _style(FyType.title, p.ink),
      toolbarHeight: FyDims.appBar,
    ),
    cardTheme: CardThemeData(
      color: p.surfaceRaised,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FyDims.radiusLg),
        side: BorderSide(color: p.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surfaceSunken,
      border: OutlineInputBorder(
        borderRadius: radiusMd,
        borderSide: BorderSide(color: p.lineStrong),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: radiusMd,
        borderSide: BorderSide(color: p.lineStrong),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radiusMd,
        borderSide: BorderSide(color: p.focus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: radiusMd,
        borderSide: BorderSide(color: p.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: FyDims.space4,
        vertical: FyDims.space4,
      ),
      labelStyle: _style(FyType.bodySm, p.inkMuted),
      helperStyle: _style(FyType.caption, p.inkMuted),
      errorStyle: _style(FyType.caption, p.error),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(FyDims.touchMin, FyDims.touchMin),
        shape: RoundedRectangleBorder(borderRadius: radiusMd),
        textStyle: _style(FyType.button, p.onBrand),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(FyDims.touchMin, FyDims.touchMin),
        shape: RoundedRectangleBorder(borderRadius: radiusMd),
        side: BorderSide(color: p.lineStrong),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(FyDims.touchMin, FyDims.touchMin),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: p.brand,
      foregroundColor: p.onBrand,
      shape: const StadiumBorder(),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.surfaceRaised,
      indicatorColor: p.brandSoft,
      height: FyDims.navBar,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surfaceSunken,
      selectedColor: p.brandSoft,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FyDims.radiusSm),
      ),
      labelStyle: _style(FyType.label, p.ink),
    ),
    dividerTheme: DividerThemeData(color: p.line, space: 1, thickness: 1),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.ink,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surfaceRaised,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(FyDims.radiusXl),
        ),
      ),
    ),
  );
}
