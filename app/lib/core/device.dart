// What this phone tells Finly about itself at sign-in, so a person can tell their phones apart in "Phones signed in"
// and support can see which app version made a request. Read once at start-up; nothing here is secret or personal
// beyond the make and model the person already sees in their phone's settings.
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

class DeviceFacts {
  const DeviceFacts({
    required this.model,
    required this.osVersion,
    required this.appVersion,
  });

  /// "Samsung SM-A515F", "Google Pixel 7" — never the person's chosen device name.
  final String model;
  final String osVersion;

  /// "1.0.0+1": the version and build number of this APK.
  final String appVersion;

  static const fallback = DeviceFacts(
    model: 'Android phone',
    osVersion: 'Android',
    appVersion: '1.0.0',
  );

  /// Reads the facts; any platform failure falls back to generic values rather than stopping the app.
  static Future<DeviceFacts> read() async {
    try {
      final package = await PackageInfo.fromPlatform();
      final version = package.buildNumber.isEmpty
          ? package.version
          : '${package.version}+${package.buildNumber}';
      if (!Platform.isAndroid) {
        return DeviceFacts(
          model: Platform.operatingSystem,
          osVersion: _short(Platform.operatingSystemVersion),
          appVersion: version,
        );
      }
      final android = await DeviceInfoPlugin().androidInfo;
      final maker = android.manufacturer.isEmpty
          ? ''
          : '${android.manufacturer[0].toUpperCase()}${android.manufacturer.substring(1)} ';
      return DeviceFacts(
        model: _short('$maker${android.model}'.trim()),
        osVersion: 'Android ${android.version.release}',
        appVersion: version,
      );
    } catch (_) {
      return fallback;
    }
  }

  static String _short(String s) => s.length > 40 ? s.substring(0, 40) : s;
}
