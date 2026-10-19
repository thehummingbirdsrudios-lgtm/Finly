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
import '../../l10n/l10n.dart';
import 'correction.dart';
import 'form_fields.dart';

/// Undoes a posted entry with a new, linked entry (RULEBOOK-01 §56). Shows what the reversal will do in each book the
/// person may see, asks why and on which day, and confirms before sending. The original is never edited.
class ReverseScreen extends ConsumerStatefulWidget {
  const ReverseScreen({super.key, required this.txnId});
  final String txnId;

  @override
  ConsumerState<ReverseScreen> createState() => _ReverseScreenState();
}

class _ReverseScreenState extends ConsumerState<ReverseScreen> {
  final _form = GlobalKey<FormState>();
  final _reason = TextEditingController();

  /// Renewed only after a final refusal (see [outcomeUnknown]); kept across retries of an unknown outcome.
  String _requestKey = newRequestKey();
  String _date = todayIso();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  /// The reversal is recorded from a book it changes that this person may post to (any of them, when none is).
  String _bookFor(EntryDetail e) {
    final mine = ref.read(booksProvider).value ?? const <Book>[];
    return e.books
            .where((b) => mine.any((m) => m.id == b.bookId && m.canPost))
            .firstOrNull
            ?.bookId ??
        e.books.first.bookId;
  }

  Future<void> _submit(EntryDetail e) async {
    if (_busy) return;
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    final l = context.l10n;
    if (_date.compareTo(e.valueDate) < 0) {
      setState(() => _error = l.undoDateTooEarly(showDate(e.valueDate)));
      return;
    }
    final sure = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(l.undoConfirmTitle),
        content: Text(l.undoConfirmBody(e.reference)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(d).pop(false),
            child: Text(l.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(d).pop(true),
            child: Text(l.undoButton),
          ),
        ],
      ),
    );
    if (sure != true || !mounted) return;
    setState(() => _busy = true);
    try {
      final r = await ref
          .read(apiProvider)
          .reverse(
            key: _requestKey,
            txnId: e.id,
            bookId: _bookFor(e),
            valueDate: _date,
            reason: _reason.text.trim(),
          );
      if (!mounted) return;
      refreshMoney(ref);
      showMessage(
        context,
        r.status == 'posted'
            ? context.l10n.undoDone(r.reference)
            : context.l10n.undoPending(r.reference),
      );
      context.pop();
    } catch (err) {
      if (!outcomeUnknown(err)) _requestKey = newRequestKey();
      if (mounted) setState(() => _error = messageOf(context, err));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final entry = ref.watch(entryProvider(widget.txnId));
    final check = ref.watch(undoCheckProvider(widget.txnId));
    return Scaffold(
      appBar: AppBar(title: Text(l.undoTitle)),
      body: AsyncView<EntryDetail>(
        value: entry,
        onRetry: () => ref.invalidate(entryProvider(widget.txnId)),
        builder: (e) => AsyncView<UndoCheck>(
          value: check,
          onRetry: () => ref.invalidate(undoCheckProvider(widget.txnId)),
          builder: (c) => SafeArea(
            child: Form(
              key: _form,
              child: ListView(
                padding: const EdgeInsets.all(FyDims.space4),
                children: c.allowed
                    ? _allowed(e, c)
                    : [FormMessage(undoProblemText(context, c))],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _allowed(EntryDetail e, UndoCheck c) {
    final l = context.l10n;
    const gap = SizedBox(height: FyDims.space4);
    return [
      Text(
        '${e.reference} · ${showDate(e.valueDate)} · ${e.typeLabel}',
        style: context.text.titleMedium,
      ),
      const SizedBox(height: FyDims.space2),
      Text(
        l.undoHelp,
        style: context.text.bodyMedium?.copyWith(color: context.fy.inkMuted),
      ),
      gap,
      if (_error != null) ...[FormMessage(_error!), gap],
      SectionTitle(l.undoWhatHappens),
      for (final b in e.books.where((b) => b.lines.isNotEmpty))
        _MirrorPreview(book: b),
      if (e.openItems.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: FyDims.space2),
          child: Text(l.undoOwedCancelled, style: context.text.bodyMedium),
        ),
      if (c.waitsForAcknowledgement > 0)
        Padding(
          padding: const EdgeInsets.only(top: FyDims.space3),
          child: FormMessage(
            l.undoWaitsFor(c.waitsForAcknowledgement),
            error: false,
          ),
        ),
      gap,
      DateField(
        value: _date,
        earliest: e.valueDate,
        onChanged: (v) => setState(() => _date = v),
      ),
      Padding(
        padding: const EdgeInsets.only(top: FyDims.space1),
        child: Text(
          l.undoDateHelp(showDate(e.valueDate)),
          style: context.text.bodySmall,
        ),
      ),
      gap,
      TextFormField(
        controller: _reason,
        maxLength: 500,
        decoration: InputDecoration(labelText: l.undoReasonLabel),
        validator: (v) =>
            (v ?? '').trim().isEmpty ? l.undoReasonRequired : null,
      ),
      gap,
      FilledButton(
        style: FilledButton.styleFrom(backgroundColor: context.fy.error),
        onPressed: _busy ? null : () => _submit(e),
        child: _busy
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(l.undoButton),
      ),
    ];
  }
}

/// One book's lines as the reversal will post them: every side swapped, money places said in words.
class _MirrorPreview extends StatelessWidget {
  const _MirrorPreview({required this.book});
  final EntryBook book;

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: FyDims.space2),
          child: Text(book.bookName, style: context.text.titleSmall),
        ),
        for (final line in book.lines)
          ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            title: Text(
              line.place != null
                  ? (line.side == 'Dr'
                        ? l.undoOutOf(formatInr(line.amount), line.place!)
                        : l.undoBackInto(formatInr(line.amount), line.place!))
                  : '${line.accountName} · '
                        '${line.side == 'Dr' ? l.entryCredit : l.entryDebit} '
                        '${formatInr(line.amount)}',
            ),
            subtitle: line.place == null
                ? null
                : Text(
                    [
                      line.counterparty,
                      line.category,
                    ].whereType<String>().join(' · '),
                    style: context.text.bodySmall,
                  ),
          ),
      ],
    );
  }
}
