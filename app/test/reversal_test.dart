// Reversing and correcting a posted entry against a scripted server: the actions appear only when the server's own
// rules allow them, a refusal the person can act on is said in words, and a correction starts from what the entry
// recorded, needs a reason, and goes to its own route under one Idempotency-Key.
import 'package:dio/dio.dart';
import 'package:finly/core/api/api_client.dart';
import 'package:finly/core/api/session_store.dart';
import 'package:finly/core/design_system/theme.dart';
import 'package:finly/core/providers.dart';
import 'package:finly/features/entries/correction.dart';
import 'package:finly/features/entries/entry_detail_screen.dart';
import 'package:finly/features/entries/entry_form_screen.dart';
import 'package:finly/features/entries/entry_kinds.dart';
import 'package:finly/features/entries/reverse_screen.dart';
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
  'balance': '5000',
  'active': true,
};
const _opening = {
  'type': 'opening_balance',
  'entityId': 'b1',
  'locationId': 'p1',
  'amount': '5000',
};
const _entry = {
  'id': 't1',
  'reference': 'TX-20261019-000001',
  'typeKey': 'opening_balance',
  'typeLabel': 'Opening balance',
  'intentType': 'opening_balance',
  'status': 'posted',
  'valueDate': '2026-10-19',
  'reason': null,
  'createdBy': 'Krish',
  'createdAt': '2026-10-19T05:00:00Z',
  'pending': false,
  'books': [
    {
      'bookId': 'b1',
      'bookName': 'Mint',
      'lines': [
        {
          'side': 'Dr',
          'amount': '5000',
          'accountCode': '1110',
          'accountName': 'Cash',
          'place': 'Tijori',
          'counterparty': null,
          'category': null,
        },
      ],
      'legs': [],
    },
  ],
  'acknowledgements': [],
  'links': [],
  'openItems': [],
};

/// The screen's own button (the screen title says the same words).
final _reverseButton = find.widgetWithText(FilledButton, 'Reverse entry');

FakeServer _server(Map<String, Object?> undoCheck) => FakeServer((o) {
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
    case '/v1/entries/t1':
      return reply(200, _entry);
    case '/v1/entries/t1/undo-check':
      return reply(200, undoCheck);
    case '/v1/entries/t1/reverse':
      return reply(201, {
        'txnId': 't3',
        'reference': 'TX-20261019-000003',
        'status': 'posted',
        'replayed': false,
      });
    case '/v1/entries/t1/correct':
      return reply(201, {
        'txnId': 't2',
        'reference': 'TX-20261019-000002',
        'status': 'posted',
        'replayed': false,
      });
  }
  return reply(404, {'code': 'NOT_FOUND', 'detail': 'Not found.'});
});

Future<void> _pump(WidgetTester tester, FakeServer server, Widget home) async {
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
        home: home,
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  test('only entries a form shows exactly are corrected with a form', () {
    expect(correctionTarget(_opening)?.kind, EntryKind.opening);
    final expense = {
      'type': 'expense',
      'sources': [
        {'entityId': 'b1', 'locationId': 'p1', 'amount': '700'},
      ],
      'allocations': [
        {'ownerId': 'b1', 'categoryId': 'c1', 'amount': '700'},
      ],
    };
    expect(correctionTarget(expense)?.bookId, 'b1');
    final shared = {
      ...expense,
      'allocations': [
        {'ownerId': 'b2', 'categoryId': 'c1', 'amount': '700'},
      ],
    };
    expect(correctionTarget(shared), isNull, reason: 'borne by another book');
    expect(
      correctionTarget({
        'type': 'income',
        'ownerId': 'b1',
        'categoryId': 'c1',
        'amount': '10',
        'customerId': 'x',
      }),
      isNull,
      reason: 'on credit: no form shows it',
    );
    expect(correctionTarget({'type': 'give', 'giverId': 'b1'}), isNull);
    expect(correctionTarget(null), isNull);
  });

  testWidgets(
    'a posted entry offers Reverse and Correct when the server allows it',
    (tester) async {
      await _pump(
        tester,
        _server({
          'allowed': true,
          'waitsForAcknowledgement': 0,
          'intent': _opening,
        }),
        const EntryDetailScreen(txnId: 't1'),
      );
      await tester.scrollUntilVisible(find.text('Reverse'), 200);
      expect(find.text('Reverse'), findsOneWidget);
      expect(find.text('Correct'), findsOneWidget);
    },
  );

  testWidgets(
    'a refusal the person can act on is said in their words; a missing right shows nothing',
    (tester) async {
      await _pump(
        tester,
        _server({
          'allowed': false,
          'waitsForAcknowledgement': 0,
          'problem': {
            'code': 'REVERSAL_BLOCKED_BY_SETTLEMENT',
            'message': 'Part of what this entry left owing has been settled.',
          },
        }),
        const EntryDetailScreen(txnId: 't1'),
      );
      expect(
        find.textContaining('Reverse those settlements first'),
        findsOneWidget,
      );
      expect(find.text('Reverse'), findsNothing);

      await _pump(
        tester,
        _server({
          'allowed': false,
          'waitsForAcknowledgement': 0,
          'problem': {'code': 'FORBIDDEN', 'message': 'You cannot reverse.'},
        }),
        const EntryDetailScreen(txnId: 't1'),
      );
      expect(find.text('Reverse'), findsNothing);
      expect(find.textContaining('You cannot reverse'), findsNothing);
    },
  );

  testWidgets(
    'a correction starts from the entry, asks what was wrong, and goes to its own route',
    (tester) async {
      final server = _server({
        'allowed': true,
        'waitsForAcknowledgement': 0,
        'intent': _opening,
      });
      await _pump(
        tester,
        server,
        const EntryFormScreen(
          bookId: 'b1',
          kind: EntryKind.opening,
          correctsTxnId: 't1',
        ),
      );
      expect(find.text('Correct entry'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, '5000'), findsOneWidget);

      await tester.ensureVisible(find.text('Save correction'));
      await tester.tap(find.text('Save correction'));
      await tester.pumpAndSettle();
      expect(find.text('Say why, so the history explains it.'), findsOneWidget);
      expect(
        server.requests.where((r) => r.path.endsWith('/correct')),
        isEmpty,
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, '5000'),
        '4500.50',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'What was wrong?'),
        'Counted again',
      );
      await tester.ensureVisible(find.text('Save correction'));
      await tester.tap(find.text('Save correction'));
      await tester.pumpAndSettle();
      final sent = server.requests.where(
        (r) => r.path == '/v1/entries/t1/correct',
      );
      expect(sent, hasLength(1));
      final body = sent.single.data as Map;
      expect(body['reason'], 'Counted again');
      expect((body['replacement'] as Map)['amount'], '4500.50');
      expect(sent.single.headers['idempotency-key'], isNotEmpty);
    },
  );

  testWidgets(
    'reversing shows what it undoes, needs a reason, and asks before sending',
    (tester) async {
      final server = _server({
        'allowed': true,
        'waitsForAcknowledgement': 1,
        'intent': _opening,
      });
      await _pump(tester, server, const ReverseScreen(txnId: 't1'));
      expect(find.text('₹5,000 out of Tijori'), findsOneWidget);
      expect(
        find.textContaining('One person must accept this'),
        findsOneWidget,
      );

      await tester.scrollUntilVisible(
        _reverseButton,
        200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(_reverseButton);
      await tester.pumpAndSettle();
      expect(find.text('Say why, so the history explains it.'), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Why is it being reversed?'),
        'Entered twice',
      );
      await tester.scrollUntilVisible(
        _reverseButton,
        200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(_reverseButton);
      await tester.pumpAndSettle();
      expect(find.text('Reverse this entry?'), findsOneWidget);
      expect(
        server.requests.where((r) => r.path.endsWith('/reverse')),
        isEmpty,
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Reverse entry').last);
      await tester.pumpAndSettle();
      final sent = server.requests.where(
        (r) => r.path == '/v1/entries/t1/reverse',
      );
      expect(sent, hasLength(1));
      expect((sent.single.data as Map)['reason'], 'Entered twice');
      expect((sent.single.data as Map)['bookId'], 'b1');
    },
  );
}
