# Flutter implementation

The app is Flutter + Dart, Android first. This system is its single theme source; no screen defines its own colours, sizes or durations.

## Tokens become Dart

- `tokens.json` is generated into `lib/core/design_system/tokens.g.dart` by a script in the repository, never edited by hand. Changing a value means changing `design-system/tools/palette.json` or the generator, regenerating both outputs, and committing them together.
- Colours live in a `FyColors` `ThemeExtension` with a light and a dark instance, so every token, including money and state colours, is available as `context.fy.moneyIn` and so on.
- Material 3 is the base where it fits. The `ColorScheme` is filled from the tokens: `primary` = `brand`, `onPrimary` = `on-brand`, `primaryContainer` = `brand-soft`, `surface` = `surface`, `surfaceContainerLowest` = `surface-raised`, `surfaceContainerHigh` = `surface-sunken`, `onSurface` = `ink`, `onSurfaceVariant` = `ink-muted`, `outline` = `line-strong`, `outlineVariant` = `line`, `error` = `blocked`, `scrim` = `scrim`. Material widgets then look right without per-screen styling.
- Type styles live in a `FyText` extension and fill the `TextTheme`. Sizes are in sp so they follow the system font size; spacing, radius and sizes are in logical pixels (dp).
- Durations and curves live in `FyMotion`, which returns zero durations when `MediaQuery.disableAnimationsOf(context)` is true.

## Fonts and icons

- Mukta and Mukta Vaani (SIL Open Font License 1.1) are bundled as assets — no runtime font download, so the app works offline and makes no third-party request. Their licence is recorded with the other third-party notices.
- Icons are Flutter's built-in Material icons, Rounded style, mapped in the README's Iconography table. No icon package.

## Widgets

- Each reference component becomes one `Fy…` widget in `lib/core/design_system/widgets/` (each component's guidelines name it and what it builds on). Feature screens compose these widgets; they do not restyle them.
- Every widget gets widget tests for its states and golden tests in light, dark and at 200% text, plus semantics tests for its screen-reader labels.
- The money formatter (grouping, signs, words for screen readers, refusal of non-integers) is pure Dart in the domain layer and unit-tested against the same cases as `design-system/tools/render-check.js`.

## Which packages

Flutter is fixed; everything beyond the SDK is chosen in the Stack Decision Record (`docs/DECISIONS.md`) against Flutter's built-ins first, and approved at Gate 1. This system assumes nothing beyond the Flutter SDK.
