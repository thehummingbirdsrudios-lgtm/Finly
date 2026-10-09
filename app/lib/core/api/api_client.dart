// The one door to the Finly API (docs/api/README.md). Online only (D-031): nothing financial is stored on the phone.
// The access token lives in memory; the refresh token and this phone's device id live in the Android Keystore-backed
// secure storage. A 401 triggers one refresh (shared by concurrent calls) and one retry; a failed refresh ends the
// session. Errors become ApiException with the server's stable code and plain-language message.
import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';

import 'session_store.dart';

class ApiException implements Exception {
  const ApiException({
    required this.status,
    required this.code,
    required this.message,
    this.question,
    this.field,
    this.requestId,
  });

  /// 0 when the server could not be reached.
  final int status;
  final String code;
  final String message;

  /// For CLASSIFICATION_REQUIRED: which choice the engine needs (purpose, repayable, giver_side…).
  final String? question;

  /// The request field the message is about, when the server named one.
  final String? field;
  final String? requestId;

  bool get isNetwork => code == 'NETWORK';
  bool get isAuth => status == 401;

  @override
  String toString() => 'ApiException($status $code: $message)';
}

class SessionTokens {
  const SessionTokens({
    required this.accessToken,
    required this.expiresIn,
    required this.refreshToken,
    required this.userId,
    required this.deviceId,
    required this.mustChangePassword,
  });

  factory SessionTokens.fromJson(Map<String, dynamic> j) => SessionTokens(
    accessToken: j['accessToken'] as String,
    expiresIn: (j['expiresIn'] as num).toInt(),
    refreshToken: j['refreshToken'] as String,
    userId: j['userId'] as String,
    deviceId: j['deviceId'] as String,
    mustChangePassword: j['mustChangePassword'] as bool,
  );

  final String accessToken;
  final int expiresIn;
  final String refreshToken;
  final String userId;
  final String deviceId;
  final bool mustChangePassword;
}

/// A random UUID (version 4) for Idempotency-Key headers: one per entry the person submits, reused on retries.
String newRequestKey() {
  final r = Random.secure();
  final b = List<int>.generate(16, (_) => r.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
}

/// Decodes a JSON object; anything else is a FormatException.
Map<String, dynamic> jsonDecodeObject(String text) {
  final v = jsonDecode(text);
  if (v is Map<String, dynamic>) return v;
  throw const FormatException('Not a JSON object');
}

class ApiClient {
  ApiClient({
    required String baseUrl,
    required this.store,
    Dio? dio,
    this.appVersion = '1.0.0',
  }) : _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl
      ..connectTimeout = const Duration(seconds: 10)
      ..receiveTimeout = const Duration(seconds: 25)
      ..sendTimeout = const Duration(seconds: 15)
      ..responseType = ResponseType.plain
      ..validateStatus = (_) => true;
  }

  final Dio _dio;
  final SessionStore store;
  final String appVersion;
  String? _access;
  DateTime? _accessExpiry;
  Future<void>? _refreshing;

  /// Called when the session cannot continue (refresh refused): the app returns to the sign-in screen.
  void Function()? onSessionEnded;

  bool get hasAccessToken => _access != null;

  Dio get dio => _dio;

  // ---- Session ------------------------------------------------------------------------------------------------

  Future<SessionTokens> signIn(
    String username,
    String password, {
    required String model,
    String? osVersion,
  }) async {
    final deviceId = await store.deviceId();
    final body = {
      'username': username.trim(),
      'password': password,
      'device': {
        'deviceId': ?deviceId,
        'platform': 'android',
        'model': model,
        'osVersion': ?osVersion,
        'appVersion': appVersion,
      },
    };
    final j = await _send(
      'POST',
      '/v1/auth/sign-in',
      body: body,
      authorized: false,
    );
    return _adopt(SessionTokens.fromJson(j));
  }

  Future<SessionTokens> changePassword(String current, String next) async {
    final j = await _send(
      'POST',
      '/v1/auth/password',
      body: {'currentPassword': current, 'newPassword': next},
    );
    return _adopt(SessionTokens.fromJson(j));
  }

  /// Restores a session from the stored refresh token; false when there is none or it was refused.
  Future<bool> resume() async {
    final token = await store.refreshToken();
    if (token == null) return false;
    try {
      await _refresh();
      return true;
    } on ApiException catch (e) {
      if (e.isNetwork) rethrow;
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      if (_access != null) await _send('POST', '/v1/auth/sign-out');
    } on ApiException {
      // Signing out locally must work even when the server cannot be reached.
    } finally {
      await _forget();
    }
  }

  Future<SessionTokens> _adopt(SessionTokens t) async {
    _access = t.accessToken;
    _accessExpiry = DateTime.now().add(Duration(seconds: t.expiresIn - 30));
    await store.save(refreshToken: t.refreshToken, deviceId: t.deviceId);
    return t;
  }

  Future<void> _forget() async {
    _access = null;
    _accessExpiry = null;
    await store.clearSession();
  }

  Future<void> _refresh() {
    return _refreshing ??= () async {
      try {
        final token = await store.refreshToken();
        if (token == null) {
          throw const ApiException(
            status: 401,
            code: 'UNAUTHENTICATED',
            message: 'Please sign in.',
          );
        }
        final j = await _send(
          'POST',
          '/v1/auth/refresh',
          body: {'refreshToken': token},
          authorized: false,
        );
        await _adopt(SessionTokens.fromJson(j));
      } on ApiException catch (e) {
        if (!e.isNetwork) {
          await _forget();
          onSessionEnded?.call();
        }
        rethrow;
      } finally {
        _refreshing = null;
      }
    }();
  }

  // ---- Requests -----------------------------------------------------------------------------------------------

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<Map<String, dynamic>> post(
    String path,
    Object body, {
    String? idempotencyKey,
  }) => _send('POST', path, body: body, idempotencyKey: idempotencyKey);

  Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    String? idempotencyKey,
    bool authorized = true,
    bool retried = false,
  }) async {
    if (authorized &&
        (_access == null ||
            (_accessExpiry?.isBefore(DateTime.now()) ?? true))) {
      await _refresh();
    }
    final headers = <String, String>{'accept': 'application/json'};
    if (authorized && _access != null) {
      headers['authorization'] = 'Bearer $_access';
    }
    if (idempotencyKey != null) headers['idempotency-key'] = idempotencyKey;
    Response<String> res;
    try {
      res = await _dio.request<String>(
        path,
        data: body,
        queryParameters: query,
        options: Options(
          method: method,
          headers: headers,
          contentType: body == null ? null : 'application/json',
        ),
      );
    } on DioException catch (e) {
      throw ApiException(
        status: 0,
        code: 'NETWORK',
        message:
            e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.receiveTimeout
            ? 'Finly is taking too long to answer. Check the internet and try again.'
            : 'No connection to Finly. Check the internet and try again.',
      );
    }
    final status = res.statusCode ?? 0;
    final text = res.data ?? '';
    Map<String, dynamic> j = const {};
    if (text.isNotEmpty) {
      try {
        j = jsonDecodeObject(text);
      } on FormatException {
        throw ApiException(
          status: status,
          code: 'BAD_RESPONSE',
          message: 'Finly sent an answer this app cannot read.',
        );
      }
    }
    if (status >= 200 && status < 300) return j;
    if (status == 401 && authorized && !retried) {
      await _refresh();
      return _send(
        method,
        path,
        body: body,
        query: query,
        idempotencyKey: idempotencyKey,
        retried: true,
      );
    }
    final details = j['details'] is Map
        ? (j['details'] as Map).cast<String, dynamic>()
        : const <String, dynamic>{};
    throw ApiException(
      status: status,
      code: (j['code'] as String?) ?? 'HTTP_$status',
      message:
          (j['detail'] as String?) ??
          (j['title'] as String?) ??
          'Something went wrong. Please try again.',
      question: details['question'] as String?,
      field: details['field'] as String?,
      requestId: j['requestId'] as String?,
    );
  }
}
