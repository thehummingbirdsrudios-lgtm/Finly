import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/money.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

/// One entry in full, limited to the books the person may see: each book's journal lines (or its legs while the
/// entry waits), who still has to acknowledge it, what it continues, and what it left owing.
class EntryDetailScreen extends ConsumerWidget {
  const EntryDetailScreen({super.key, required this.txnId});
  final String txnId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entry = ref.watch(entryProvider(txnId));
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Text(l.entryTitle),
        actions: [
          if (entry.hasValue)
            IconButton(
              tooltip: l.entryShareTooltip,
              icon: const Icon(Icons.share_rounded),
              onPressed: () => _share(context, entry.value!),
            ),
        ],
      ),
      body: AsyncView<EntryDetail>(
        value: entry,
        onRetry: () => ref.invalidate(entryProvider(txnId)),
        builder: (e) => ListView(
          padding: const EdgeInsets.all(FyDims.space4),
          children: [
            Text(
              e.reason?.isNotEmpty == true ? e.reason! : e.typeLabel,
              style: context.text.headlineMedium,
            ),
            const SizedBox(height: FyDims.space2),
            Wrap(
              spacing: FyDims.space2,
              runSpacing: FyDims.space2,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                StatusBadge(e.status),
                Text(
                  '${e.reference} · ${showDate(e.valueDate)} · ${e.typeLabel}',
                  style: context.text.bodySmall,
                ),
              ],
            ),
            if (e.createdBy != null)
              Padding(
                padding: const EdgeInsets.only(top: FyDims.space1),
                child: Text(
                  l.entryRecordedBy(e.createdBy!),
                  style: context.text.bodySmall,
                ),
              ),
            if (e.pending)
              Padding(
                padding: const EdgeInsets.only(top: FyDims.space3),
                child: FormMessage(l.entryNotPosted, error: false),
              ),
            for (final b in e.books) _BookPart(book: b, pending: e.pending),
            if (e.acknowledgements.isNotEmpty) ...[
              SectionTitle(l.entryAcknowledgement),
              for (final a in e.acknowledgements)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(a.name),
                  subtitle: a.note == null ? null : Text(a.note!),
                  trailing: StatusBadge(a.status),
                ),
            ],
            if (e.openItems.isNotEmpty) ...[
              SectionTitle(l.entryLeftOwing),
              for (final o in e.openItems)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(o.reference),
                  subtitle: Text(l.entryStillOwed(formatInr(o.remaining))),
                  trailing: StatusBadge(o.status),
                ),
            ],
            if (e.links.isNotEmpty) ...[
              SectionTitle(l.entryLinked),
              for (final link in e.links)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.link_rounded),
                  title: Text(link.reference ?? l.entryHiddenLink),
                  subtitle: Text(
                    link.direction == 'to'
                        ? l.entryLinkTo(link.kind.replaceAll('_', ' '))
                        : l.entryLinkFrom(link.kind.replaceAll('_', ' ')),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  /// A plain-text summary through the Android share sheet (WhatsApp or anything else the person picks). Only what
  /// this person may see is in it; nothing is sent until they choose a recipient and send it themselves.
  Future<void> _share(BuildContext context, EntryDetail e) async {
    final l = context.l10n;
    final lines = <String>[
      'Finly · ${e.reference}',
      '${e.typeLabel} · ${showDate(e.valueDate)}',
      if (e.reason?.isNotEmpty == true) e.reason!,
      if (e.pending)
        l.entryShareStatusWaiting
      else
        l.entryShareStatus(e.status),
    ];
    for (final b in e.books) {
      final debits = b.lines
          .where((l) => l.side == 'Dr')
          .fold(BigInt.zero, (s, l) => s + l.amount);
      if (debits > BigInt.zero) {
        lines.add('${b.bookName}: ${formatInr(debits)}');
      }
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(l.entryShareQuestion),
        content: Text(lines.join('\n')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(d).pop(false),
            child: Text(l.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(d).pop(true),
            child: Text(l.commonChooseApp),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await SharePlus.instance.share(
        ShareParams(text: lines.join('\n'), subject: 'Finly ${e.reference}'),
      );
    }
  }
}

class _BookPart extends StatelessWidget {
  const _BookPart({required this.book, required this.pending});
  final EntryBook book;
  final bool pending;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final l = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(book.bookName),
        if (book.lines.isEmpty && book.legs.isNotEmpty)
          for (final g in book.legs)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(switch (g.kind) {
                'source' => l.entryOutOf(g.place ?? l.formTheseBooks),
                'destination' => l.entryInto(g.place ?? l.formTheseBooks),
                _ => l.entryAllocated,
              }),
              trailing: MoneyText(g.amount),
            ),
        if (book.lines.isNotEmpty)
          Card(
            child: Column(
              children: [
                for (final line in book.lines)
                  ListTile(
                    dense: true,
                    title: Text('${line.accountName} (${line.accountCode})'),
                    subtitle: Text(
                      [
                        line.place,
                        line.counterparty,
                        line.category,
                      ].whereType<String>().join(' · '),
                      style: context.text.bodySmall,
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${line.side == 'Dr' ? l.entryDebit : l.entryCredit} ',
                          style: context.text.labelSmall?.copyWith(
                            color: fy.inkMuted,
                          ),
                        ),
                        Text(
                          formatInr(line.amount),
                          style: context.text.titleSmall,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
