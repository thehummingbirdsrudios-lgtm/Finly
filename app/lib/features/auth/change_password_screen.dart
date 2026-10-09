import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

/// Replaces the temporary password at first sign-in (forced) or the current one later (from Settings).
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key, this.forced = false});
  final bool forced;

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _again = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _fieldError;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _again.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _fieldError = null);
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .changePassword(_current.text, _next.text);
      if (!mounted) return;
      if (!widget.forced) {
        showMessage(
          context,
          'Your password is changed. Other phones were signed out.',
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          if (e.field == 'newPassword' || e.field == 'currentPassword') {
            _fieldError = e.message;
          } else {
            _error = e.message;
          }
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.forced ? 'Choose your password' : 'Change password'),
        automaticallyImplyLeading: !widget.forced,
        actions: [
          if (widget.forced)
            TextButton(
              onPressed: _busy
                  ? null
                  : () => ref.read(authProvider.notifier).signOut(),
              child: const Text('Sign out'),
            ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(FyDims.space4),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.forced)
                  Text(
                    'You signed in with a temporary password. Choose your own to continue — nobody else, not even '
                    'an administrator, will ever see it.',
                    style: context.text.bodyLarge,
                  ),
                const SizedBox(height: FyDims.space4),
                if (_error != null) ...[
                  FormMessage(_error!),
                  const SizedBox(height: FyDims.space4),
                ],
                TextFormField(
                  controller: _current,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: widget.forced
                        ? 'Temporary password'
                        : 'Current password',
                  ),
                  autofillHints: const [AutofillHints.password],
                  validator: (v) => (v ?? '').isEmpty
                      ? 'Enter it to confirm it is you.'
                      : null,
                ),
                const SizedBox(height: FyDims.space4),
                TextFormField(
                  controller: _next,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'New password',
                    helperText: 'At least 10 characters. A short sentence is easy to remember and hard to guess.',
                    helperMaxLines: 2,
                    errorText: _fieldError,
                    errorMaxLines: 2,
                  ),
                  autofillHints: const [AutofillHints.newPassword],
                  validator: (v) => (v ?? '').length < 10
                      ? 'Use at least 10 characters.'
                      : null,
                ),
                const SizedBox(height: FyDims.space4),
                TextFormField(
                  controller: _again,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'New password again',
                  ),
                  validator: (v) => v != _next.text
                      ? 'The two passwords are not the same.'
                      : null,
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: FyDims.space8),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save password'),
                ),
                const SizedBox(height: FyDims.space4),
                Text(
                  'Changing your password signs out every other phone using your account.',
                  style: context.text.bodySmall?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
