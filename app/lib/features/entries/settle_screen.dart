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
import '../../l10n/l10n.dart';

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

  /// Renewed only after a final refusal (see [outcomeUnknown]); kept across retries of an unknown outcome.
  String _requestKey = newRequestKey();
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
        () => _error = context.l10n.settleOnlyOwed(formatInr(item.remaining)),
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
      showMessage(context, context.l10n.formRecorded(r.reference));
      context.pop();
    } catch (e) {
      if (!outcomeUnknown(e)) _requestKey = newRequestKey();
      if (mounted) setState(() => _error = messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(openItemsProvider(widget.bookId));
    final books = ref.watch(booksProvider).value ?? const <Book>[];
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.settleTitle)),
      body: AsyncView<List<OpenItem>>(
        value: items,
        onRetry: () => ref.invalidate(openItemsProvider(widget.bookId)),
        builder: (list) {
          final item = list.where((o) => o.id == widget.openItemId).firstOrNull;
          if (item == null) {
            return EmptyView(
              icon: Icons.check_circle_outline_rounded,
              title: l.settleAlreadyTitle,
              message: l.settleAlreadyMessage,
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
                      ? l.settleTheyPay(item.counterparty)
                      : l.settleWePay(item.counterparty),
                  style: context.text.titleLarge,
                ),
                const SizedBox(height: FyDims.space1),
                Text(
                  '${item.reason} · ${item.reference}',
                  style: context.text.bodySmall,
                ),
                const SizedBox(height: FyDims.space2),
                Text(
                  l.settleOriginally(
                    formatInr(item.original),
                    formatInr(item.remaining),
                  ),
                  style: context.text.bodyLarge?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
                const SizedBox(height: FyDims.space4),
                if (_error != null) ...[
                  FormMessage(_error!),
                  const SizedBox(height: FyDims.space4),
                ],
                AmountField(controller: _amount, label: l.settleAmountNow),
                const SizedBox(height: FyDims.space4),
                DateField(
                  value: _date,
                  onChanged: (v) => setState(() => _date = v),
                ),
                const SizedBox(height: FyDims.space4),
                PlaceField(
                  bookId: widget.bookId,
                  value: _myPlace,
                  label: receivable ? l.formReceivedInto : l.formPaidFrom,
                  onChanged: (v) => setState(() => _myPlace = v),
                ),
                if (counterpartyIsMine) ...[
                  const SizedBox(height: FyDims.space4),
                  PlaceField(
                    bookId: item.counterpartyId,
                    value: _theirPlace,
                    label: receivable
                        ? l.settlePaidFromOf(item.counterparty)
                        : l.settleReceivedIntoOf(item.counterparty),
                    onChanged: (v) => setState(() => _theirPlace = v),
                  ),
                ],
                const SizedBox(height: FyDims.space4),
                TextFormField(
                  controller: _reason,
                  maxLength: 500,
                  decoration: InputDecoration(labelText: l.commonNoteOptional),
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
                      : Text(l.settleRecordPayment),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
