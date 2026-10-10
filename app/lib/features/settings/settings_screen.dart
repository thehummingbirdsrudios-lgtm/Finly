import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/config.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final me = auth is SignedIn ? auth.me : null;
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.settingsTitle)),
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
              subtitle: Text(l.settingsSignedIn),
            ),
          SectionTitle(l.settingsLanguage),
          ListTile(
            leading: const Icon(Icons.translate_rounded),
            title: Text(l.languageName),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _chooseLanguage(context, ref),
          ),
          SectionTitle(l.settingsSecurity),
          ListTile(
            leading: const Icon(Icons.password_rounded),
            title: Text(l.passwordChangeTitle),
            onTap: () => context.push('/settings/password'),
          ),
          ListTile(
            leading: const Icon(Icons.devices_rounded),
            title: Text(l.settingsPhones),
            subtitle: Text(l.settingsPhonesHelp),
            onTap: () => context.push('/settings/sessions'),
          ),
          SectionTitle(l.settingsAbout),
          ListTile(
            leading: const Icon(Icons.info_outline_rounded),
            title: Text(
              l.settingsVersion(ref.watch(deviceFactsProvider).appVersion),
            ),
            subtitle: Text(
              '${l.settingsServer(Uri.parse(apiBaseUrl).host)}\n${l.settingsOnlineOnly}',
            ),
            isThreeLine: true,
          ),
          const SizedBox(height: FyDims.space6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: FyDims.space4),
            child: OutlinedButton.icon(
              icon: const Icon(Icons.logout_rounded),
              label: Text(l.commonSignOut),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (d) => AlertDialog(
                    title: Text(l.settingsSignOutQuestion),
                    content: Text(l.settingsSignOutExplain),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(d).pop(false),
                        child: Text(l.commonCancel),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.of(d).pop(true),
                        child: Text(l.commonSignOut),
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

  /// Each language is named in its own script, so a person can find theirs whatever the screen shows now.
  Future<void> _chooseLanguage(BuildContext context, WidgetRef ref) async {
    final current = Localizations.localeOf(context).languageCode;
    final chosen = await showDialog<String>(
      context: context,
      builder: (d) => SimpleDialog(
        title: Text(context.l10n.settingsLanguage),
        children: [
          RadioGroup<String>(
            groupValue: current,
            onChanged: (v) => Navigator.of(d).pop(v),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final code in supportedLanguageCodes)
                  RadioListTile<String>(
                    value: code,
                    title: Text(
                      lookupAppLocalizations(Locale(code)).languageName,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
    if (chosen == null || chosen == current || !context.mounted) return;
    try {
      await ref.read(localeProvider.notifier).choose(chosen);
      if (context.mounted) {
        showMessage(
          context,
          lookupAppLocalizations(Locale(chosen)).settingsLanguageSaved,
        );
      }
    } catch (e) {
      if (context.mounted) showMessage(context, messageOf(context, e));
    }
  }
}

class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.settingsPhones)),
      body: AsyncView<List<SessionInfo>>(
        value: sessions,
        onRetry: () => ref.invalidate(sessionsProvider),
        builder: (items) => RefreshIndicator(
          onRefresh: () => ref.refresh(sessionsProvider.future),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [for (final s in items) _SessionTile(session: s)],
          ),
        ),
      ),
    );
  }
}

/// One signed-in phone. Signing another phone out asks first and cannot be sent twice.
class _SessionTile extends ConsumerStatefulWidget {
  const _SessionTile({required this.session});
  final SessionInfo session;

  @override
  ConsumerState<_SessionTile> createState() => _SessionTileState();
}

class _SessionTileState extends ConsumerState<_SessionTile> {
  bool _busy = false;

  Future<void> _signOut() async {
    final s = widget.session;
    final l = context.l10n;
    final name = s.deviceLabel ?? s.model ?? s.platform;
    final sure = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(l.sessionsSignOutQuestion),
        content: Text(l.sessionsSignOutExplain(name)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: Text(l.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: Text(l.commonSignOut),
          ),
        ],
      ),
    );
    if (sure != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).revokeSession(s.id);
      ref.invalidate(sessionsProvider);
      if (mounted) showMessage(context, context.l10n.sessionsSignedOut);
    } catch (e) {
      if (mounted) showMessage(context, messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.session;
    final l = context.l10n;
    return ListTile(
      leading: Icon(
        Icons.smartphone_rounded,
        color: s.current ? context.fy.brand : null,
      ),
      title: Text(s.deviceLabel ?? s.model ?? s.platform),
      subtitle: Text(
        s.current
            ? l.sessionsThisPhone
            : l.sessionsLastUsed(showDate(localDateOf(s.lastUsedAt))),
      ),
      trailing: s.current
          ? null
          : TextButton(
              onPressed: _busy ? null : _signOut,
              child: Text(l.commonSignOut),
            ),
    );
  }
}
