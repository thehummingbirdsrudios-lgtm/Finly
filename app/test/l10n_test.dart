// English, Hindi and Gujarati stay in step (ADDON-23 §9): every key exists in all three with the same placeholders,
// and a real screen renders in each language.
import 'dart:convert';
import 'dart:io';

import 'package:finly/core/design_system/theme.dart';
import 'package:finly/features/auth/sign_in_screen.dart';
import 'package:finly/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, String> _messages(String locale) {
  final raw = jsonDecode(
    File('lib/l10n/app_$locale.arb').readAsStringSync(),
  ) as Map<String, dynamic>;
  return {
    for (final e in raw.entries)
      if (!e.key.startsWith('@')) e.key: e.value as String,
  };
}

Set<String> _placeholders(String text) =>
    RegExp(r'\{(\w+)[,}]').allMatches(text).map((m) => m.group(1)!).toSet();

void main() {
  test('every message exists in English, Hindi and Gujarati with the same placeholders', () {
    final en = _messages('en');
    for (final locale in ['hi', 'gu']) {
      final other = _messages(locale);
      expect(other.keys.toSet(), en.keys.toSet(), reason: locale);
      for (final key in en.keys) {
        expect(
          _placeholders(other[key]!),
          _placeholders(en[key]!),
          reason: '$locale $key',
        );
      }
    }
  });

  for (final (locale, button, tagline) in [
    ('en', 'Sign in', 'Every rupee, explained.'),
    ('hi', 'साइन इन', 'हर रुपये का पूरा हिसाब।'),
    ('gu', 'સાઇન ઇન', 'દરેક રૂપિયાનો પૂરો હિસાબ.'),
  ]) {
    testWidgets('the sign-in screen speaks $locale', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: fyTheme(Brightness.light),
            locale: Locale(locale),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: const SignInScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text(button), findsOneWidget);
      expect(find.text(tagline), findsOneWidget);
    });
  }
}
