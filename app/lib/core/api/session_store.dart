// Where the session survives an app restart: only the refresh token and this phone's device id, in the Android
// Keystore-backed secure storage (never shared preferences, never a file). No financial data is stored (D-031).
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class SessionStore {
  Future<String?> refreshToken();
  Future<String?> deviceId();
  Future<void> save({required String refreshToken, required String deviceId});

  /// Signs this phone out: the refresh token goes; the device id stays so the phone is recognised next time.
  Future<void> clearSession();
}

class SecureSessionStore implements SessionStore {
  SecureSessionStore([FlutterSecureStorage? storage])
    : _s = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _s;
  static const _refresh = 'finly.refresh_token';
  static const _device = 'finly.device_id';

  @override
  Future<String?> refreshToken() => _s.read(key: _refresh);

  @override
  Future<String?> deviceId() => _s.read(key: _device);

  @override
  Future<void> save({
    required String refreshToken,
    required String deviceId,
  }) async {
    await _s.write(key: _refresh, value: refreshToken);
    await _s.write(key: _device, value: deviceId);
  }

  @override
  Future<void> clearSession() => _s.delete(key: _refresh);
}

/// For tests and previews: the same contract, held in memory.
class MemorySessionStore implements SessionStore {
  String? _refreshToken;
  String? _deviceId;

  @override
  Future<String?> refreshToken() async => _refreshToken;

  @override
  Future<String?> deviceId() async => _deviceId;

  @override
  Future<void> save({
    required String refreshToken,
    required String deviceId,
  }) async {
    _refreshToken = refreshToken;
    _deviceId = deviceId;
  }

  @override
  Future<void> clearSession() async => _refreshToken = null;
}
