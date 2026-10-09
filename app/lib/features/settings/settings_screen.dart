import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/api/models.dart';
import '../../core/config.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final me = auth is SignedIn ? auth.me : null;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          if (me != null)
            ListTile(
              leading: CircleAvatar(
                child: Text(
                  me.displayName.isEmpty
                      ? '?'
                      : me.displayName[0].toUpperCase(),
                ),
              ),
              title: Text(me.displayName),
              subtitle: const Text('Signed in'),
            ),
          const SectionTitle('Security'),
          ListTile(
            leading: const Icon(Icons.password_rounded),
            title: const Text('Change password'),
            onTap: () => context.push('/settings/password'),
          ),
          ListTile(
            leading: const Icon(Icons.devices_rounded),
            title: const Text('Phones signed in'),
            subtitle: const Text('Sign out a lost or old phone'),
            onTap: () => context.push('/settings/sessions'),
          ),
          const SectionTitle('About'),
          ListTile(
            leading: const Icon(Icons.info_outline_rounded),
            title: const Text('Finly $appVersion'),
            subtitle: Text(
              'Server: ${Uri.parse(apiBaseUrl).host}\nOnline only — nothing financial is stored on this phone.',
            ),
            isThreeLine: true,
          ),
          const SizedBox(height: FyDims.space6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: FyDims.space4),
            child: OutlinedButton.icon(
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign out'),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (d) => AlertDialog(
                    title: const Text('Sign out?'),
                    content: const Text(
                      'You will need your username and password to sign in again.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(d).pop(false),
                        child: const Text('Cancel'),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.of(d).pop(true),
                        child: const Text('Sign out'),
                      ),
                    ],
                  ),
                );
                if (ok == true) await ref.read(authProvider.notifier).signOut();
              },
            ),
          ),
          const SizedBox(height: FyDims.space8),
        ],
      ),
    );
  }
}

class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Phones signed in')),
      body: AsyncView<List<SessionInfo>>(
        value: sessions,
        onRetry: () => ref.invalidate(sessionsProvider),
        builder: (items) => ListView(
          children: [
            for (final s in items)
              ListTile(
                leading: Icon(
                  Icons.smartphone_rounded,
                  color: s.current ? context.fy.brand : null,
                ),
                title: Text(s.deviceLabel ?? s.model ?? s.platform),
                subtitle: Text(
                  s.current
                      ? 'This phone'
                      : 'Last used ${showDate(s.lastUsedAt)}',
                ),
                trailing: s.current
                    ? null
                    : TextButton(
                        onPressed: () async {
                          try {
                            await ref.read(apiProvider).revokeSession(s.id);
                            ref.invalidate(sessionsProvider);
                            if (context.mounted) {
                              showMessage(context, 'That phone is signed out.');
                            }
                          } on ApiException catch (e) {
                            if (context.mounted) {
                              showMessage(context, e.message);
                            }
                          }
                        },
                        child: const Text('Sign out'),
                      ),
              ),
          ],
        ),
      ),
    );
  }
}
