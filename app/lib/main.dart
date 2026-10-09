import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/api/api_client.dart';

void main() {
  runApp(
    ProviderScope(
      // A refused request (wrong input, no access) is final; only lost connections are worth retrying.
      retry: (count, error) =>
          error is ApiException && error.isNetwork && count < 2
          ? const Duration(seconds: 2)
          : null,
      child: const FinlyApp(),
    ),
  );
}
