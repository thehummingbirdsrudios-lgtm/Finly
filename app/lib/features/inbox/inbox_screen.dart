import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

/// Entries someone recorded that change this person's own books: nothing posts until they accept (D-029).
class InboxScreen extends ConsumerWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final waiting = ref.watch(waitingProvider);
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.inboxTitle)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(waitingProvider.future),
        child: AsyncView<List<WaitingAnswer>>(
          value: waiting,
          onRetry: () => ref.invalidate(waitingProvider),
          builder: (items) => items.isEmpty
              ? ListView(
                  children: [
                    const SizedBox(height: 80),
                    EmptyView(
                      icon: Icons.inbox_outlined,
                      title: l.inboxNothingTitle,
                      message: l.inboxNothingMessage,
                    ),
                  ],
                )
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, i) => _WaitingTile(item: items[i]),
                ),
        ),
      ),
    );
  }
}

class _WaitingTile extends ConsumerStatefulWidget {
  const _WaitingTile({required this.item});
  final WaitingAnswer item;

  @override
  ConsumerState<_WaitingTile> createState() => _WaitingTileState();
}

class _WaitingTileState extends ConsumerState<_WaitingTile> {
  bool _busy = false;

  Future<void> _answer(bool accept) async {
    final note = await showDialog<String?>(
      context: context,
      builder: (_) => _AnswerDialog(accept: accept, item: widget.item),
    );
    if (note == null) return;
    setState(() => _busy = true);
    try {
      final api = ref.read(apiProvider);
      final r = accept
          ? await api.acknowledge(
              widget.item.txnId,
              note: note.isEmpty ? null : note,
            )
          : await api.reject(
              widget.item.txnId,
              note: note.isEmpty ? null : note,
            );
      if (!mounted) return;
      refreshMoney(ref);
      showMessage(
        context,
        accept
            ? context.l10n.inboxAccepted(r.reference)
            : context.l10n.inboxRejected(r.reference),
      );
    } catch (e) {
      if (mounted) showMessage(context, messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = widget.item;
    final l = context.l10n;
    return Padding(
      padding: const EdgeInsets.all(FyDims.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  w.reason?.isNotEmpty == true ? w.reason! : w.typeLabel,
                  style: context.text.titleSmall,
                ),
              ),
              if (w.moneyIn > BigInt.zero)
                MoneyText(w.moneyIn, direction: MoneyDirection.incoming),
              if (w.moneyOut > BigInt.zero)
                MoneyText(w.moneyOut, direction: MoneyDirection.outgoing),
            ],
          ),
          Text(
            l.inboxFrom(
              w.reference,
              showDate(w.valueDate),
              w.from ?? l.inboxSomeone,
            ),
            style: context.text.bodySmall,
          ),
          const SizedBox(height: FyDims.space2),
          Row(
            children: [
              TextButton(
                onPressed: () => context.push('/entries/${w.txnId}'),
                child: Text(l.commonDetails),
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: _busy ? null : () => _answer(false),
                child: Text(l.inboxReject),
              ),
              const SizedBox(width: FyDims.space2),
              FilledButton(
                onPressed: _busy ? null : () => _answer(true),
                child: Text(l.inboxAccept),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AnswerDialog extends StatefulWidget {
  const _AnswerDialog({required this.accept, required this.item});
  final bool accept;
  final WaitingAnswer item;

  @override
  State<_AnswerDialog> createState() => _AnswerDialogState();
}

class _AnswerDialogState extends State<_AnswerDialog> {
  final _note = TextEditingController();

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return AlertDialog(
      title: Text(
        widget.accept ? l.inboxAcceptQuestion : l.inboxRejectQuestion,
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.accept ? l.inboxAcceptExplain : l.inboxRejectExplain,
            style: context.text.bodyMedium,
          ),
          const SizedBox(height: FyDims.space3),
          TextField(
            controller: _note,
            maxLength: 500,
            decoration: InputDecoration(
              labelText: widget.accept
                  ? l.commonNoteOptional
                  : l.inboxWhyOptional,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(l.commonCancel),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(_note.text.trim()),
          child: Text(widget.accept ? l.inboxAccept : l.inboxReject),
        ),
      ],
    );
  }
}
