import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key, this.notice});
  final SignInNotice? notice;

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _form = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _hidden = true;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .signIn(_username.text, _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final l = context.l10n;
    final notice =
        _error ??
        switch (widget.notice) {
          SignInNotice.sessionEnded => l.signInSessionEnded,
          SignInNotice.storageReset => l.signInStorageReset,
          null => null,
        };
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(FyDims.space6),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _form,
                child: AutofillGroup(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(
                        Icons.account_balance_wallet_rounded,
                        size: 56,
                        color: fy.brand,
                      ),
                      const SizedBox(height: FyDims.space4),
                      Text(
                        l.appName,
                        style: context.text.displayLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: FyDims.space2),
                      Text(
                        l.appTagline,
                        style: context.text.bodyLarge?.copyWith(
                          color: fy.inkMuted,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: FyDims.space8),
                      if (notice != null) ...[
                        FormMessage(
                          notice,
                          error: _error != null || widget.notice != null,
                        ),
                        const SizedBox(height: FyDims.space4),
                      ],
                      TextFormField(
                        controller: _username,
                        decoration: InputDecoration(
                          labelText: l.signInUsername,
                        ),
                        autofillHints: const [AutofillHints.username],
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        enableSuggestions: false,
                        validator: (v) => (v ?? '').trim().isEmpty
                            ? l.signInEnterUsername
                            : null,
                      ),
                      const SizedBox(height: FyDims.space4),
                      TextFormField(
                        controller: _password,
                        obscureText: _hidden,
                        decoration: InputDecoration(
                          labelText: l.signInPassword,
                          suffixIcon: IconButton(
                            tooltip: _hidden
                                ? l.signInShowPassword
                                : l.signInHidePassword,
                            icon: Icon(
                              _hidden
                                  ? Icons.visibility_rounded
                                  : Icons.visibility_off_rounded,
                            ),
                            onPressed: () => setState(() => _hidden = !_hidden),
                          ),
                        ),
                        autofillHints: const [AutofillHints.password],
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
                        validator: (v) =>
                            (v ?? '').isEmpty ? l.signInEnterPassword : null,
                      ),
                      const SizedBox(height: FyDims.space8),
                      FilledButton(
                        onPressed: _busy ? null : _submit,
                        child: _busy
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(l.signInButton),
                      ),
                      const SizedBox(height: FyDims.space6),
                      Text(
                        l.signInHelp,
                        style: context.text.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
