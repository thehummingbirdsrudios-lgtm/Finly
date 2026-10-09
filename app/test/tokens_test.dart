import 'dart:io';

import 'package:finly/core/design_system/theme.dart';
import 'package:finly/core/design_system/tokens.g.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('the committed Dart tokens match design-system/project/tokens.json', () {
    final r = Process.runSync(
      Platform.resolvedExecutable.contains('flutter')
          ? 'dart'
          : Platform.resolvedExecutable,
      ['run', 'tool/gen_tokens.dart', '--check'],
      runInShell: true,
    );
    expect(r.exitCode, 0, reason: '${r.stdout}${r.stderr}');
  });

  test('the theme takes every colour from the tokens', () {
    final light = fyTheme(Brightness.light);
    final dark = fyTheme(Brightness.dark);
    expect(light.colorScheme.primary, fyLight.brand);
    expect(dark.colorScheme.primary, fyDark.brand);
    expect(light.scaffoldBackgroundColor, fyLight.surface);
    expect(light.extension<FyColors>()!.p.moneyIn, fyLight.moneyIn);
    expect(dark.extension<FyColors>()!.p.moneyOut, fyDark.moneyOut);
  });
}
