import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:finly/core/api/api_client.dart';
import 'package:finly/core/api/finly_api.dart';
import 'package:finly/core/api/session_store.dart';
import 'package:flutter_test/flutter_test.dart';

/// A scripted server: each request is answered by `handler`; every request is kept for inspection.
class FakeServer implements HttpClientAdapter {
  FakeServer(this.handler);

  final ResponseBody Function(RequestOptions o) handler;
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody reply(int status, Object body) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: ['application/json'],
  },
);

Map<String, Object> tokens(
  String access,
  String refresh, {
  bool mustChange = false,
}) => {
  'accessToken': access,
  'expiresIn': 600,
  'refreshToken': refresh,
  'userId': 'u1',
  'sessionId': 's1',
  'deviceId': 'd1',
  'mustChangePassword': mustChange,
};

ApiClient client(FakeServer server, SessionStore store) {
  final dio = Dio()..httpClientAdapter = server;
  return ApiClient(baseUrl: 'https://api.test', store: store, dio: dio);
}

void main() {
  test('sign-in stores only the refresh token and device id; requests carry the access token', () async {
    final store = MemorySessionStore();
    final server = FakeServer((o) {
      if (o.path == '/v1/auth/sign-in') return reply(200, tokens('A1', 'R1'));
      return reply(200, {'items': []});
    });
    final c = client(server, store);
    await c.signIn('asha', 'secret pass 123', model: 'Test');
    expect(await store.refreshToken(), 'R1');
    expect(await store.deviceId(), 'd1');
    await FinlyApi(c).books();
    expect(server.requests.last.headers['authorization'], 'Bearer A1');
    final signInBody = server.requests.first.data as Map;
    expect((signInBody['device'] as Map)['platform'], 'android');
    expect(
      (signInBody['device'] as Map).containsKey('deviceId'),
      isFalse,
      reason: 'no id before the first sign-in',
    );
  });

  test('an expired access token is refreshed once and the request retried; concurrent calls share one refresh', () async {
    final store = MemorySessionStore();
    await store.save(refreshToken: 'R1', deviceId: 'd1');
    var refreshes = 0;
    final server = FakeServer((o) {
      if (o.path == '/v1/auth/refresh') {
        refreshes++;
        return reply(200, tokens('A$refreshes', 'R${refreshes + 1}'));
      }
      if (o.headers['authorization'] == 'Bearer A1')
        return reply(200, {'items': []});
      return reply(401, {
        'code': 'UNAUTHENTICATED',
        'detail': 'Please sign in again.',
      });
    });
    final api = FinlyApi(client(server, store));
    await Future.wait([api.books(), api.books(), api.waiting()]);
    expect(refreshes, 1);
    expect(
      await store.refreshToken(),
      'R2',
      reason: 'the rotated token replaces the used one',
    );
  });

  test('a refused refresh ends the session and tells the app', () async {
    final store = MemorySessionStore();
    await store.save(refreshToken: 'R1', deviceId: 'd1');
    final server = FakeServer(
      (o) => reply(401, {
        'code': 'UNAUTHENTICATED',
        'detail': 'Please sign in again.',
      }),
    );
    final c = client(server, store);
    var ended = false;
    c.onSessionEnded = () => ended = true;
    await expectLater(
      FinlyApi(c).books(),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
    );
    expect(ended, isTrue);
    expect(await store.refreshToken(), isNull);
    expect(await store.deviceId(), 'd1', reason: 'the phone stays recognised');
  });

  test(
    'problem details become a readable error with the engine’s question',
    () async {
      final store = MemorySessionStore();
      final server = FakeServer((o) {
        if (o.path == '/v1/auth/sign-in') return reply(200, tokens('A1', 'R1'));
        return reply(422, {
          'code': 'CLASSIFICATION_REQUIRED',
          'title': 'Say what this money is.',
          'detail': 'Say what this money is.',
          'requestId': 'req-1',
          'details': {'question': 'purpose'},
        });
      });
      final c = client(server, store);
      await c.signIn('asha', 'secret pass 123', model: 'Test');
      final key = newRequestKey();
      try {
        await FinlyApi(c).submit(
          key: key,
          typeKey: 'give',
          bookId: 'b',
          valueDate: '2026-10-09',
          intent: {'type': 'give'},
        );
        fail('should refuse');
      } on ApiException catch (e) {
        expect(
          [e.status, e.code, e.question, e.requestId],
          [422, 'CLASSIFICATION_REQUIRED', 'purpose', 'req-1'],
        );
        expect(e.message, 'Say what this money is.');
      }
      expect(server.requests.last.headers['idempotency-key'], key);
    },
  );

  test(
    'no connection is a network error, not a crash, and keeps the session',
    () async {
      final store = MemorySessionStore();
      await store.save(refreshToken: 'R1', deviceId: 'd1');
      final server = FakeServer(
        (o) => throw DioException.connectionError(
          requestOptions: o,
          reason: 'offline',
        ),
      );
      final c = client(server, store);
      await expectLater(
        c.resume(),
        throwsA(
          isA<ApiException>().having((e) => e.isNetwork, 'network', true),
        ),
      );
      expect(await store.refreshToken(), 'R1');
    },
  );

  test('request keys are random version-4 UUIDs', () {
    final keys = List.generate(200, (_) => newRequestKey());
    expect(keys.toSet().length, 200);
    for (final k in keys) {
      expect(
        RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        ).hasMatch(k),
        isTrue,
        reason: k,
      );
    }
  });
}
