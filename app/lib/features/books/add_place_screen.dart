import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../entries/form_fields.dart';

/// Where money of a book is kept: a cash place, a bank account (with its exact holder) or a wallet. Account numbers
/// are encrypted on the server at once; only the last four digits are ever shown again.
class AddPlaceScreen extends ConsumerStatefulWidget {
  const AddPlaceScreen({super.key, required this.bookId});
  final String bookId;

  @override
  ConsumerState<AddPlaceScreen> createState() => _AddPlaceScreenState();
}

class _AddPlaceScreenState extends ConsumerState<AddPlaceScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _bankName = TextEditingController();
  final _holder = TextEditingController();
  final _number = TextEditingController();
  final _ifsc = TextEditingController();
  String? _kind;
  String? _type;
  String? _accountType;
  bool _busy = false;
  String? _error;

  static const _typesByKind = {
    'cash': [
      'vault',
      'drawer',
      'locker',
      'wardrobe',
      'hand_cash',
      'office_cash',
      'other',
    ],
    'bank': ['bank_savings', 'bank_current', 'other'],
    'wallet': ['wallet', 'upi', 'other'],
  };

  @override
  void dispose() {
    for (final c in [_name, _bankName, _holder, _number, _ifsc]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final bank = _kind == 'cash'
        ? null
        : {
            if (_bankName.text.trim().isNotEmpty)
              'bankName': _bankName.text.trim(),
            if (_holder.text.trim().isNotEmpty)
              'accountHolder': _holder.text.trim(),
            if (_number.text.trim().isNotEmpty)
              'accountNumber': _number.text.trim(),
            if (_ifsc.text.trim().isNotEmpty)
              'ifsc': _ifsc.text.trim().toUpperCase(),
            'accountType': ?_accountType,
          };
    try {
      await ref.read(apiProvider).addPlace(widget.bookId, {
        'name': _name.text.trim(),
        'kind': _kind,
        'typeKey': _type,
        if (bank != null && bank.isNotEmpty) 'bank': bank,
      });
      if (!mounted) return;
      ref.invalidate(placesProvider(widget.bookId));
      showMessage(
        context,
        'Added. Its balance is ₹0 until you record money there.',
      );
      context.pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final placeTypes = ref.watch(lookupsProvider).value?.placeTypes ?? const [];
    final allowed = _kind == null ? const <String>[] : _typesByKind[_kind]!;
    final types = placeTypes.where((t) => allowed.contains(t.key)).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Add money place')),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(FyDims.space4),
            children: [
              if (_error != null) ...[
                FormMessage(_error!),
                const SizedBox(height: FyDims.space4),
              ],
              ChoiceField<String>(
                label: 'What is it?',
                options: const [
                  ('cash', 'Cash'),
                  ('bank', 'Bank account'),
                  ('wallet', 'Wallet / UPI'),
                ],
                value: _kind,
                onChanged: (v) => setState(() {
                  _kind = v;
                  _type = null;
                }),
              ),
              const SizedBox(height: FyDims.space4),
              TextFormField(
                controller: _name,
                maxLength: 80,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  hintText: 'Shop Tijori, HDFC savings…',
                ),
                validator: (v) =>
                    (v ?? '').trim().isEmpty ? 'Enter a name.' : null,
              ),
              if (_kind != null) ...[
                const SizedBox(height: FyDims.space2),
                DropdownButtonFormField<String>(
                  key: ValueKey(_kind),
                  initialValue: _type,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: [
                    for (final t in types)
                      DropdownMenuItem(value: t.key, child: Text(t.label)),
                  ],
                  onChanged: (v) => setState(() => _type = v),
                  validator: (v) => v == null ? 'Choose a type.' : null,
                ),
              ],
              if (_kind == 'bank' || _kind == 'wallet') ...[
                const SectionTitle('Account details'),
                Text(
                  'Who the bank says holds this account matters: it may be you, the business, or someone else.',
                  style: context.text.bodySmall?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
                const SizedBox(height: FyDims.space3),
                TextFormField(
                  controller: _bankName,
                  decoration: const InputDecoration(
                    labelText: 'Bank or provider',
                  ),
                ),
                const SizedBox(height: FyDims.space3),
                TextFormField(
                  controller: _holder,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Account holder (as the bank records it)',
                  ),
                ),
                const SizedBox(height: FyDims.space3),
                TextFormField(
                  controller: _number,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Account number (optional)',
                    helperText:
                        'Stored encrypted. Finly shows only the last 4 digits.',
                  ),
                ),
                const SizedBox(height: FyDims.space3),
                TextFormField(
                  controller: _ifsc,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    labelText: 'IFSC (optional)',
                  ),
                ),
                const SizedBox(height: FyDims.space3),
                DropdownButtonFormField<String>(
                  initialValue: _accountType,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Account type (optional)',
                  ),
                  items: const [
                    DropdownMenuItem(value: 'savings', child: Text('Savings')),
                    DropdownMenuItem(value: 'current', child: Text('Current')),
                    DropdownMenuItem(
                      value: 'overdraft',
                      child: Text('Overdraft'),
                    ),
                    DropdownMenuItem(
                      value: 'cash_credit',
                      child: Text('Cash credit'),
                    ),
                    DropdownMenuItem(value: 'wallet', child: Text('Wallet')),
                    DropdownMenuItem(value: 'upi', child: Text('UPI')),
                    DropdownMenuItem(value: 'other', child: Text('Other')),
                  ],
                  onChanged: (v) => setState(() => _accountType = v),
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
                    : const Text('Add place'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
