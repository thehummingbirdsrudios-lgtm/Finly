// The entry form against a scripted server: after a final refusal the corrected entry goes out under a new
// Idempotency-Key (otherwise every resubmission would be refused as "already used"), while a lost answer or a server
// fault keeps the key, so the retry can never post twice.
import 'package:dio/dio.dart';
import 'package:finly/core/api/api_client.dart';
import 'package:finly/core/api/session_store.dart';
import 'package:finly/core/design_system/theme.dart';
import 'package:finly/core/providers.dart';
import 'package:finly/features/entries/entry_form_screen.dart';
import 'package:finly/features/entries/entry_kinds.dart';
import 'package:finly/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'api_client_test.dart' show FakeServer, reply, tokens;

const _book = {
  'id': 'b1',
  'kind': 'firm',
  'name': 'Mint',
  'typeLabel': 'Firm',
  'personal': false,
  'access': 'manage',
  'canPost': true,
  'canManage': true,
};
const _place = {
  'id': 'p1',
  'name': 'Tijori',
  'kind': 'cash',
  'typeKey': 'vault',
  'typeLabel': 'Vault',
  'custodian': null,
  'bank': null,
  'balance': '0',
  'active': true,
};

/// Answers reads, and answers each entry submission with the next scripted outcome.
FakeServer _server(List<ResponseBody Function()> submissions) {
  var next = 0;
  return FakeServer((o) {
    switch (o.path) {
      case '/v1/auth/refresh':
        return reply(200, tokens('A1', 'R1'));
      case '/v1/books':
        return reply(200, {
          'items': [_book],
        });
      case '/v1/books/b1/places':
        return reply(200, {
          'items': [_place],
        });
      case '/v1/lookups':
        return reply(200, {
          'categories': [],
          'entryTypes': [],
          'placeTypes': [],
          'partyTypes': [],
          'firmTypes': [],
        });
      case '/v1/entries':
        return submissions[next++]();
    }
    return reply(404, {'code': 'NOT_FOUND', 'detail': 'Not found.'});
  });
}

ResponseBody _refused() =>
    reply(422, {'code': 'VALIDATION', 'detail': 'Choose a valid date.'});
ResponseBody _serverFault() =>
    reply(503, {'code': 'INTERNAL', 'detail': 'Please try again.'});

Future<List<String>> _submitTwice(
  WidgetTester tester,
  FakeServer server,
) async {
  final store = MemorySessionStore();
  await store.save(refreshToken: 'R0', deviceId: 'd1');
  final client = ApiClient(
    baseUrl: 'https://api.test',
    store: store,
    dio: Dio()..httpClientAdapter = server,
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [apiClientProvider.overrideWithValue(client)],
      child: MaterialApp(
        theme: fyTheme(Brightness.light),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const EntryFormScreen(bookId: 'b1', kind: EntryKind.opening),
      ),
    ),
  );
  await tester.pumpAndSettle();
  await tester.enterText(find.byType(TextFormField).first, '5000');
  await tester.tap(find.byType(DropdownButtonFormField<String>));
  await tester.pumpAndSettle();
  await tester.tap(find.textContaining('Tijori').last);
  await tester.pumpAndSettle();
  for (var i = 0; i < 2; i++) {
    await tester.ensureVisible(find.text('Record'));
    await tester.tap(find.text('Record'));
    await tester.pumpAndSettle();
  }
  return [
    for (final r in server.requests.where((r) => r.path == '/v1/entries'))
      r.headers['idempotency-key'] as String,
  ];
}

void main() {
  testWidgets('after a refusal, the corrected entry is sent under a new key', (
    tester,
  ) async {
    final keys = await _submitTwice(tester, _server([_refused, _refused]));
    expect(keys, hasLength(2));
    expect(keys[0], isNot(keys[1]));
    expect(find.text('Choose a valid date.'), findsOneWidget);
  });

  testWidgets('after a server fault, the retry keeps the same key', (
    tester,
  ) async {
    final keys = await _submitTwice(tester, _server([_serverFault, _refused]));
    expect(keys, hasLength(2));
    expect(keys[0], keys[1]);
  });

  test(
    'outcomeUnknown: only a lost answer or a server fault keeps the key',
    () {
      const network = ApiException(status: 0, code: 'NETWORK', message: 'x');
      const fault = ApiException(status: 500, code: 'INTERNAL', message: 'x');
      const refused = ApiException(
        status: 422,
        code: 'VALIDATION',
        message: 'x',
      );
      const reused = ApiException(
        status: 409,
        code: 'DUPLICATE_REQUEST',
        message: 'x',
      );
      expect(outcomeUnknown(network), isTrue);
      expect(outcomeUnknown(fault), isTrue);
      expect(outcomeUnknown(refused), isFalse);
      expect(outcomeUnknown(reused), isFalse);
      expect(outcomeUnknown(StateError('bug')), isFalse);
    },
  );
}
