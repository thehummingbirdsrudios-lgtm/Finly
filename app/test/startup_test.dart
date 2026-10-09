import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:finly/app.dart';
import 'package:finly/core/api/api_client.dart';
import 'package:finly/core/api/session_store.dart';
import 'package:finly/core/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _Unreachable implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions o,
    Stream<Uint8List>? s,
    Future<void>? c,
  ) async =>
      throw DioException.connectionError(requestOptions: o, reason: 'offline');

  @override
  void close({bool force = false}) {}
}

Widget app(SessionStore store) {
  final dio = Dio()..httpClientAdapter = _Unreachable();
  return ProviderScope(
    overrides: [
      sessionStoreProvider.overrideWithValue(store),
      apiClientProvider.overrideWithValue(
        ApiClient(baseUrl: 'https://api.test', store: store, dio: dio),
      ),
    ],
    child: const FinlyApp(),
  );
}

void main() {
  testWidgets('without a saved session the app opens on sign-in', (
    tester,
  ) async {
    await tester.pumpWidget(app(MemorySessionStore()));
    await tester.pumpAndSettle();
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Every rupee, explained.'), findsOneWidget);
  });

  testWidgets(
    'with a saved session but no server, the app says it is offline and offers a retry',
    (tester) async {
      final store = MemorySessionStore();
      await store.save(refreshToken: 'R1', deviceId: 'd1');
      await tester.pumpWidget(app(store));
      await tester.pumpAndSettle();
      expect(find.text('You are offline'), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
      expect(
        await store.refreshToken(),
        'R1',
        reason: 'a network failure never signs the person out',
      );
    },
  );
}
