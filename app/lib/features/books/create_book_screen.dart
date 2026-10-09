import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../entries/form_fields.dart';

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
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final types = ref.watch(lookupsProvider).value?.firmTypes ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('New business')),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(FyDims.space4),
            children: [
              Text(
                'Its books are kept apart from yours and from every other business. It starts empty.',
                style: context.text.bodyMedium?.copyWith(
                  color: context.fy.inkMuted,
                ),
              ),
              const SizedBox(height: FyDims.space4),
              if (_error != null) ...[
                FormMessage(_error!),
                const SizedBox(height: FyDims.space4),
              ],
              TextFormField(
                controller: _name,
                maxLength: 120,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: (v) =>
                    (v ?? '').trim().isEmpty ? 'Enter a name.' : null,
              ),
              const SizedBox(height: FyDims.space2),
              DropdownButtonFormField<String>(
                initialValue: _type,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Kind'),
                items: [
                  for (final t in types)
                    DropdownMenuItem(value: t.key, child: Text(t.label)),
                ],
                onChanged: (v) => setState(() => _type = v),
                validator: (v) =>
                    v == null ? 'Choose what kind of business this is.' : null,
              ),
              const SizedBox(height: FyDims.space4),
              DateField(
                value: _opening,
                label: 'Books start on',
                onChanged: (v) => setState(() => _opening = v),
              ),
              const SizedBox(height: FyDims.space4),
              ChoiceField<bool>(
                label: 'Are you an owner of it?',
                help: 'Being the one who sets it up does not make you an owner. Say what is true.',
                options: const [
                  (true, 'Yes, I own it or part of it'),
                  (false, 'No, I run it for others'),
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
                  decoration: const InputDecoration(
                    labelText: 'Your share in % (optional)',
                    helperText: 'Leave empty if you are not sure. It can be confirmed later.',
                  ),
                  validator: (v) {
                    if ((v ?? '').trim().isEmpty) return null;
                    final n = double.tryParse(v!.trim());
                    return n == null || n <= 0 || n > 100
                        ? 'Enter a number above 0 and up to 100.'
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
                    : const Text('Create'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
