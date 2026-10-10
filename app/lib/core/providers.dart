// Dependency wiring and server-backed state. Every data provider fetches from the API; after any change the affected
// providers are invalidated so screens show the server's new truth, never a locally computed guess.

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api/api_client.dart';
import 'api/finly_api.dart';
import 'api/models.dart';
import 'api/session_store.dart';
import 'config.dart';
import 'device.dart';

final sessionStoreProvider = Provider<SessionStore>(
  (ref) => SecureSessionStore(),
);

/// Make, model, Android version and app version, read once in main(); tests use the generic fallback.
final deviceFactsProvider = Provider<DeviceFacts>(
  (ref) => DeviceFacts.fallback,
);

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(
    baseUrl: apiBaseUrl,
    store: ref.watch(sessionStoreProvider),
    appVersion: ref.watch(deviceFactsProvider).appVersion,
  ),
);

final apiProvider = Provider<FinlyApi>(
  (ref) => FinlyApi(ref.watch(apiClientProvider)),
);

// ---- Authentication ------------------------------------------------------------------------------------------

sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

/// The server could not be reached while restoring the session (Finly is online only).
class AuthOffline extends AuthState {
  const AuthOffline(this.message);
  final String message;
}

class SignedOut extends AuthState {
  const SignedOut([this.notice]);
  final String? notice;
}

class SignedIn extends AuthState {
  const SignedIn(this.me);
  final Me me;
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    final client = ref.read(apiClientProvider);
    client.onSessionEnded = () =>
        state = const SignedOut('Your session ended. Please sign in again.');
    Future.microtask(restore);
    return const AuthLoading();
  }

  FinlyApi get _api => ref.read(apiProvider);
  ApiClient get _client => ref.read(apiClientProvider);

  /// Resumes the saved session, if any.
  Future<void> restore() async {
    state = const AuthLoading();
    try {
      if (await _client.resume()) {
        state = SignedIn(await _api.me());
      } else {
        state = const SignedOut();
      }
    } on ApiException catch (e) {
      state = e.isNetwork ? AuthOffline(e.message) : const SignedOut();
    } catch (_) {
      // The phone's secure storage failed (e.g. keys reset after a backup restore): start clean rather than hang on
      // the splash screen. Nothing financial is lost — it all lives on the server.
      state = const SignedOut(
        'This phone could not read the saved sign-in. Please sign in again.',
      );
    }
  }

  Future<void> signIn(String username, String password) async {
    await _client.signIn(
      username,
      password,
      model: ref.read(deviceFactsProvider).model,
      osVersion: ref.read(deviceFactsProvider).osVersion,
    );
    state = SignedIn(await _api.me());
  }

  Future<void> changePassword(String current, String next) async {
    await _client.changePassword(current, next);
    state = SignedIn(await _api.me());
  }

  Future<void> signOut() async {
    await _client.signOut();
    state = const SignedOut();
  }
}

final authProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

// ---- Server data ---------------------------------------------------------------------------------------------

/// Choice lists from the server. Kept for the session once loaded; a failed load is not kept, so the next screen that
/// needs it (or "Try again") asks again.
final lookupsProvider = FutureProvider.autoDispose<Lookups>((ref) async {
  final lookups = await ref.watch(apiProvider).lookups();
  ref.keepAlive();
  return lookups;
});

final booksProvider = FutureProvider.autoDispose<List<Book>>(
  (ref) => ref.watch(apiProvider).books(),
);

final summaryProvider = FutureProvider.autoDispose.family<BookSummary, String>(
  (ref, bookId) => ref.watch(apiProvider).summary(bookId),
);

final placesProvider = FutureProvider.autoDispose.family<List<Place>, String>(
  (ref, bookId) => ref.watch(apiProvider).places(bookId),
);

final partiesProvider = FutureProvider.autoDispose.family<List<Party>, String>(
  (ref, bookId) => ref.watch(apiProvider).parties(bookId),
);

final openItemsProvider = FutureProvider.autoDispose
    .family<List<OpenItem>, String>(
      (ref, bookId) => ref.watch(apiProvider).openItems(bookId),
    );

final entryProvider = FutureProvider.autoDispose.family<EntryDetail, String>(
  (ref, txnId) => ref.watch(apiProvider).entry(txnId),
);

final waitingProvider = FutureProvider.autoDispose<List<WaitingAnswer>>(
  (ref) => ref.watch(apiProvider).waiting(),
);

final sessionsProvider = FutureProvider.autoDispose<List<SessionInfo>>(
  (ref) => ref.watch(apiProvider).sessions(),
);

/// Bumped after every successful change, so entry lists reload from the first page.
class ChangeCounter extends Notifier<int> {
  @override
  int build() => 0;

  void bump() => state++;
}

final entriesVersionProvider = NotifierProvider<ChangeCounter, int>(
  ChangeCounter.new,
);

/// After an entry posts or an answer is given: everything that shows money is fetched again.
void refreshMoney(WidgetRef ref) {
  ref.invalidate(summaryProvider);
  ref.invalidate(placesProvider);
  ref.invalidate(openItemsProvider);
  ref.invalidate(entryProvider);
  ref.invalidate(waitingProvider);
  ref.invalidate(booksProvider);
  ref.read(entriesVersionProvider.notifier).bump();
}
