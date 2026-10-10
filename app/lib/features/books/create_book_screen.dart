import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../entries/form_fields.dart';
import '../../l10n/l10n.dart';

/// A new business or pool with its own separate books. Creating it does not make you its owner: you say whether
/// you are one (ADDON-18). It starts empty — no money, places or people are assumed.
class CreateBookScreen extends ConsumerStatefulWidget {
  const CreateBookScreen({super.key});

  @override
  ConsumerState<CreateBookScreen> createState() => _CreateBookScreenState();
}

class _CreateBookScreenState extends ConsumerState<CreateBookScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _share = TextEditingController();
  String? _type;
  String _opening = todayIso();
  bool? _owner;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _share.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final share = _share.text.trim().isEmpty
          ? null
          : double.tryParse(_share.text.trim());
      final id = await ref
          .read(apiProvider)
          .createBook(
            name: _name.text.trim(),
            typeKey: _type!,
            openingDate: _opening,
            creatorIsOwner: _owner!,
            sharePercent: _owner == true ? share : null,
          );
      if (!mounted) return;
      ref.invalidate(booksProvider);
      context.pushReplacement('/books/$id');
    } catch (e) {
      if (mounted) setState(() => _error = messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lookups = ref.watch(lookupsProvider);
    final types = lookups.value?.firmTypes ?? const [];
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.createBookTitle)),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(FyDims.space4),
            children: [
              Text(
                l.createBookIntro,
                style: context.text.bodyMedium?.copyWith(
                  color: context.fy.inkMuted,
                ),
              ),
              const SizedBox(height: FyDims.space4),
              if (lookups.hasError) ...[
                RetryMessage(
                  messageOf(context, lookups.error!),
                  onRetry: () => ref.invalidate(lookupsProvider),
                ),
                const SizedBox(height: FyDims.space4),
              ],
              if (_error != null) ...[
                FormMessage(_error!),
                const SizedBox(height: FyDims.space4),
              ],
              TextFormField(
                controller: _name,
                maxLength: 120,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: l.commonName),
                validator: (v) =>
                    (v ?? '').trim().isEmpty ? l.commonEnterName : null,
              ),
              const SizedBox(height: FyDims.space2),
              DropdownButtonFormField<String>(
                initialValue: _type,
                isExpanded: true,
                decoration: InputDecoration(labelText: l.commonKind),
                items: [
                  for (final t in types)
                    DropdownMenuItem(value: t.key, child: Text(t.label)),
                ],
                onChanged: (v) => setState(() => _type = v),
                validator: (v) => v == null ? l.createBookChooseKind : null,
              ),
              const SizedBox(height: FyDims.space4),
              DateField(
                value: _opening,
                label: l.createBookStartsOn,
                onChanged: (v) => setState(() => _opening = v),
              ),
              const SizedBox(height: FyDims.space4),
              ChoiceField<bool>(
                label: l.createBookOwnerQuestion,
                help: l.createBookOwnerHelp,
                options: [
                  (true, l.createBookOwnerYes),
                  (false, l.createBookOwnerNo),
                ],
                value: _owner,
                onChanged: (v) => setState(() => _owner = v),
              ),
              if (_owner == true) ...[
                const SizedBox(height: FyDims.space4),
                TextFormField(
                  controller: _share,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.createBookShare,
                    helperText: l.createBookShareHelp,
                  ),
                  validator: (v) {
                    if ((v ?? '').trim().isEmpty) return null;
                    final n = double.tryParse(v!.trim());
                    return n == null || n <= 0 || n > 100
                        ? l.createBookShareInvalid
                        : null;
                  },
                ),
              ],
              const SizedBox(height: FyDims.space8),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l.createBookCreate),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
