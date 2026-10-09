import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/money.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import 'form_fields.dart';

/// Pays, or receives, all or part of one amount that is owed. Never more than what is still owed; the rest stays
/// open, and the original entry is never changed.
class SettleScreen extends ConsumerStatefulWidget {
  const SettleScreen({
    super.key,
    required this.bookId,
    required this.openItemId,
  });
  final String bookId;
  final String openItemId;

  @override
  ConsumerState<SettleScreen> createState() => _SettleScreenState();
}

class _SettleScreenState extends ConsumerState<SettleScreen> {
  final _form = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _reason = TextEditingController();
  final String _requestKey = newRequestKey();
  String _date = todayIso();
  String? _myPlace;
  String? _theirPlace;
  bool _busy = false;
  bool _prefilled = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit(OpenItem item, bool counterpartyIsMine) async {
    if (_busy) return;
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    final amount = readAmount(_amount.text).value!;
    if (amount > item.remaining) {
      setState(
        () => _error = 'Only ${formatInr(item.remaining)} is still owed.',
      );
      return;
    }
    final receivable = item.direction == 'receivable';
    final intent = <String, Object?>{
      'type': 'settlement',
      'payerId': receivable ? item.counterpartyId : widget.bookId,
      'payeeId': receivable ? widget.bookId : item.counterpartyId,
      if (receivable)
        'payeeLocationId': _myPlace
      else
        'payerLocationId': _myPlace,
      if (counterpartyIsMine && receivable) 'payerLocationId': _theirPlace,
      if (counterpartyIsMine && !receivable) 'payeeLocationId': _theirPlace,
      'allocations': [
        {'openItemId': item.id, 'amount': amount.toString()},
      ],
    };
    setState(() => _busy = true);
    try {
      final r = await ref
          .read(apiProvider)
          .submit(
            key: _requestKey,
            typeKey: 'settlement',
            bookId: widget.bookId,
            valueDate: _date,
            reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
            intent: intent,
          );
      if (!mounted) return;
      refreshMoney(ref);
      showMessage(context, '${r.reference} recorded.');
      context.pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(openItemsProvider(widget.bookId));
    final books = ref.watch(booksProvider).value ?? const <Book>[];
    return Scaffold(
      appBar: AppBar(title: const Text('Settle')),
      body: AsyncView<List<OpenItem>>(
        value: items,
        onRetry: () => ref.invalidate(openItemsProvider(widget.bookId)),
        builder: (list) {
          final item = list.where((o) => o.id == widget.openItemId).firstOrNull;
          if (item == null) {
            return const EmptyView(
              icon: Icons.check_circle_outline_rounded,
              title: 'Already settled',
              message: 'Nothing is owed on this any more.',
            );
          }
          if (!_prefilled) {
            _prefilled = true;
            _amount.text = item.remaining.toString();
          }
          final receivable = item.direction == 'receivable';
          final counterpartyIsMine = books.any(
            (b) => b.id == item.counterpartyId && b.canPost,
          );
          return Form(
            key: _form,
            child: ListView(
              padding: const EdgeInsets.all(FyDims.space4),
              children: [
                Text(
                  receivable
                      ? '${item.counterparty} pays this book'
                      : 'This book pays ${item.counterparty}',
                  style: context.text.titleLarge,
                ),
                const SizedBox(height: FyDims.space1),
                Text(
                  '${item.reason} · ${item.reference}',
                  style: context.text.bodySmall,
                ),
                const SizedBox(height: FyDims.space2),
                Text(
                  'Originally ${formatInr(item.original)}; still owed ${formatInr(item.remaining)}.',
                  style: context.text.bodyLarge?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
                const SizedBox(height: FyDims.space4),
                if (_error != null) ...[
                  FormMessage(_error!),
                  const SizedBox(height: FyDims.space4),
                ],
                AmountField(controller: _amount, label: 'Amount paid now (₹)'),
                const SizedBox(height: FyDims.space4),
                DateField(
                  value: _date,
                  onChanged: (v) => setState(() => _date = v),
                ),
                const SizedBox(height: FyDims.space4),
                PlaceField(
                  bookId: widget.bookId,
                  value: _myPlace,
                  label: receivable ? 'Received into' : 'Paid from',
                  onChanged: (v) => setState(() => _myPlace = v),
                ),
                if (counterpartyIsMine) ...[
                  const SizedBox(height: FyDims.space4),
                  PlaceField(
                    bookId: item.counterpartyId,
                    value: _theirPlace,
                    label: receivable
                        ? 'Paid from (${item.counterparty})'
                        : 'Received into (${item.counterparty})',
                    onChanged: (v) => setState(() => _theirPlace = v),
                  ),
                ],
                const SizedBox(height: FyDims.space4),
                TextFormField(
                  controller: _reason,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Note (optional)',
                  ),
                ),
                const SizedBox(height: FyDims.space4),
                FilledButton(
                  onPressed: _busy
                      ? null
                      : () => _submit(item, counterpartyIsMine),
                  child: _busy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Record payment'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
