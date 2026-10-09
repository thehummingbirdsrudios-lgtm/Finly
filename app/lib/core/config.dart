// Build-time configuration only (no secrets — the API needs none in the app): the API address is passed with
//   flutter build apk --dart-define=FINLY_API_URL=https://<your-api-host>
// A debug build defaults to the Android emulator's view of a local server (deno task api).
import 'package:flutter/foundation.dart';

const String _configuredApiUrl = String.fromEnvironment('FINLY_API_URL');

String get apiBaseUrl =>
    _configuredApiUrl.isNotEmpty ? _configuredApiUrl : 'http://10.0.2.2:8787';

/// A release build must talk to an HTTPS API; anything else is a build mistake the app reports instead of running.
String? get configurationProblem {
  if (kReleaseMode && !apiBaseUrl.startsWith('https://')) {
    return 'This copy of Finly was built without a secure server address. Install the official build.';
  }
  return null;
}

const String appVersion = '1.0.0';
