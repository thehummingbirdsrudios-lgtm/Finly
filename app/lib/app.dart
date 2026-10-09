import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/config.dart';
import 'core/design_system/theme.dart';
import 'core/design_system/tokens.g.dart';
import 'core/providers.dart';
import 'core/widgets.dart';
import 'features/auth/change_password_screen.dart';
import 'features/auth/sign_in_screen.dart';
import 'features/books/add_place_screen.dart';
import 'features/books/book_screen.dart';
import 'features/books/create_book_screen.dart';
import 'features/entries/entry_detail_screen.dart';
import 'features/entries/entry_form_screen.dart';
import 'features/entries/entry_kinds.dart';
import 'features/entries/settle_screen.dart';
import 'features/home/home_screen.dart';
import 'features/settings/settings_screen.dart';

/// Re-runs the router's redirect whenever the session state changes.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authProvider, (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthListenable(ref);
  ref.onDispose(refresh.dispose);
  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final at = state.matchedLocation;
      const gates = {'/loading', '/offline', '/sign-in', '/choose-password'};
      final target = switch (auth) {
        AuthLoading() => '/loading',
        AuthOffline() => '/offline',
        SignedOut() => '/sign-in',
        SignedIn(:final me) when me.mustChangePassword => '/choose-password',
        SignedIn() => null,
      };
      if (target != null) return at == target ? null : target;
      return gates.contains(at) ? '/' : null;
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, _) => const _Gate()),
      GoRoute(path: '/offline', builder: (_, _) => const _Offline()),
      GoRoute(
        path: '/sign-in',
        builder: (_, _) {
          final auth = ref.read(authProvider);
          return SignInScreen(notice: auth is SignedOut ? auth.notice : null);
        },
      ),
      GoRoute(
        path: '/choose-password',
        builder: (_, _) => const ChangePasswordScreen(forced: true),
      ),
      GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
      GoRoute(path: '/books/new', builder: (_, _) => const CreateBookScreen()),
      GoRoute(
        path: '/books/:id',
        builder: (_, s) => BookScreen(bookId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/books/:id/places/new',
        builder: (_, s) => AddPlaceScreen(bookId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/books/:id/new/:kind',
        builder: (_, s) => EntryFormScreen(
          bookId: s.pathParameters['id']!,
          kind: EntryKind.values.firstWhere(
            (k) => k.name == s.pathParameters['kind'],
            orElse: () => EntryKind.expense,
          ),
        ),
      ),
      GoRoute(
        path: '/books/:id/settle/:item',
        builder: (_, s) => SettleScreen(
          bookId: s.pathParameters['id']!,
          openItemId: s.pathParameters['item']!,
        ),
      ),
      GoRoute(
        path: '/entries/:id',
        builder: (_, s) => EntryDetailScreen(txnId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/settings/password',
        builder: (_, _) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/settings/sessions',
        builder: (_, _) => const SessionsScreen(),
      ),
    ],
    errorBuilder: (_, _) => const Scaffold(
      body: EmptyView(
        icon: Icons.explore_off_outlined,
        title: 'Not found',
        message: 'This page does not exist.',
      ),
    ),
  );
});

class FinlyApp extends ConsumerWidget {
  const FinlyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final problem = configurationProblem;
    if (problem != null) {
      return MaterialApp(
        theme: fyTheme(Brightness.light),
        home: Scaffold(
          body: EmptyView(
            icon: Icons.gpp_bad_outlined,
            title: 'Cannot start',
            message: problem,
          ),
        ),
      );
    }
    return MaterialApp.router(
      title: 'Finly',
      debugShowCheckedModeBanner: false,
      theme: fyTheme(Brightness.light),
      darkTheme: fyTheme(Brightness.dark),
      routerConfig: ref.watch(routerProvider),
    );
  }
}

class _Gate extends StatelessWidget {
  const _Gate();

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.account_balance_wallet_rounded,
            size: 64,
            color: context.fy.brand,
          ),
          const SizedBox(height: FyDims.space4),
          Text('Finly', style: context.text.displayLarge),
          const SizedBox(height: FyDims.space6),
          const CircularProgressIndicator(),
        ],
      ),
    ),
  );
}

class _Offline extends ConsumerWidget {
  const _Offline();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      body: SafeArea(
        child: EmptyView(
          icon: Icons.wifi_off_rounded,
          title: 'You are offline',
          message: auth is AuthOffline
              ? '${auth.message}\nFinly works online only, so your books are always up to date.'
              : 'Finly works online only.',
          action: FilledButton.icon(
            onPressed: () => ref.read(authProvider.notifier).restore(),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ),
      ),
    );
  }
}
