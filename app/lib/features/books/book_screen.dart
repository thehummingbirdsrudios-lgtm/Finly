import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/money.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../entries/entry_kinds.dart';
import 'entries_list.dart';
import '../../l10n/l10n.dart';

/// One book: what it has (money by place, and separately what is owed each way), what happened, and what is due.
class BookScreen extends ConsumerWidget {
  const BookScreen({super.key, required this.bookId});
  final String bookId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final books = ref.watch(booksProvider);
    return books.when(
      loading: () => const Scaffold(body: LoadingView()),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: ErrorView(error: e, onRetry: () => ref.invalidate(booksProvider)),
      ),
      data: (items) {
        final book = items.where((b) => b.id == bookId).firstOrNull;
        if (book == null) {
          return Scaffold(
            appBar: AppBar(),
            body: EmptyView(
              icon: Icons.lock_outline_rounded,
              title: context.l10n.commonNotAvailable,
              message: context.l10n.bookNotAvailableMessage,
            ),
          );
        }
        return DefaultTabController(
          length: 3,
          child: Scaffold(
            appBar: AppBar(
              title: Text(
                book.personal ? context.l10n.booksMyPersonal : book.name,
              ),
              bottom: TabBar(
                tabs: [
                  Tab(text: context.l10n.bookTabOverview),
                  Tab(text: context.l10n.bookTabEntries),
                  Tab(text: context.l10n.bookTabDues),
                ],
              ),
            ),
            floatingActionButton: book.canPost
                ? FloatingActionButton.extended(
                    onPressed: () => showEntryKinds(context, book),
                    icon: const Icon(Icons.add_rounded),
                    label: Text(context.l10n.bookAddEntry),
                  )
                : null,
            body: TabBarView(
              children: [
                _Overview(book: book),
                EntriesList(bookId: book.id),
                _Dues(book: book),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Overview extends ConsumerWidget {
  const _Overview({required this.book});
  final Book book;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(summaryProvider(book.id));
    final places = ref.watch(placesProvider(book.id));
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(summaryProvider(book.id));
        ref.invalidate(placesProvider(book.id));
        await ref.read(summaryProvider(book.id).future);
      },
      child: ListView(
        padding: const EdgeInsets.only(bottom: 96),
        children: [
          AsyncView<BookSummary>(
            value: summary,
            onRetry: () => ref.invalidate(summaryProvider(book.id)),
            builder: (s) => _SummaryCards(summary: s, personal: book.personal),
          ),
          SectionTitle(
            context.l10n.bookMoneyPlaces,
            trailing: book.canManage
                ? TextButton.icon(
                    onPressed: () =>
                        context.push('/books/${book.id}/places/new'),
                    icon: const Icon(Icons.add_rounded),
                    label: Text(context.l10n.bookAddPlace),
                  )
                : null,
          ),
          AsyncView<List<Place>>(
            value: places,
            onRetry: () => ref.invalidate(placesProvider(book.id)),
            builder: (items) => items.isEmpty
                ? EmptyView(
                    icon: Icons.savings_outlined,
                    title: context.l10n.bookNoPlacesTitle,
                    message: context.l10n.bookNoPlacesMessage,
                  )
                : Column(
                    children: [for (final p in items) _PlaceTile(place: p)],
                  ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCards extends StatelessWidget {
  const _SummaryCards({required this.summary, required this.personal});
  final BookSummary summary;
  final bool personal;

  @override
  Widget build(BuildContext context) {
    final s = summary;
    final l = context.l10n;
    final tiles = <(String, BigInt, String)>[
      (l.bookMoney, s.money, l.bookMoneyHelp),
      (l.bookOthersOwe, s.receivables, l.bookOthersOweHelp),
      (l.bookOwedToOthers, s.payables, l.bookOwedToOthersHelp),
      (
        personal ? l.bookNetWorth : l.bookNetPosition,
        s.netPosition,
        l.bookNetHelp,
      ),
    ];
    return Padding(
      padding: const EdgeInsets.all(FyDims.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: FyDims.space3,
            crossAxisSpacing: FyDims.space3,
            childAspectRatio: 1.55,
            children: [
              for (final t in tiles)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(FyDims.space3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.$1, style: context.text.labelMedium),
                        const Spacer(),
                        MoneyText(t.$2, style: context.text.titleLarge),
                        Text(
                          t.$3,
                          style: context.text.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          if (s.inTransit != BigInt.zero ||
              s.unidentified != BigInt.zero ||
              s.investments != BigInt.zero)
            Padding(
              padding: const EdgeInsets.only(top: FyDims.space3),
              child: Wrap(
                spacing: FyDims.space2,
                runSpacing: FyDims.space2,
                children: [
                  if (s.inTransit != BigInt.zero)
                    Chip(label: Text(l.bookInTransit(formatInr(s.inTransit)))),
                  if (s.investments != BigInt.zero)
                    Chip(
                      label: Text(
                        l.bookInvestedInFirms(formatInr(s.investments)),
                      ),
                    ),
                  if (s.unidentified != BigInt.zero)
                    Chip(
                      label: Text(
                        l.bookUnidentified(formatInr(s.unidentified)),
                      ),
                    ),
                ],
              ),
            ),
          const SizedBox(height: FyDims.space3),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(FyDims.space3),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.bookEarnedThisMonth,
                          style: context.text.labelMedium,
                        ),
                        MoneyText(
                          s.monthIncome,
                          direction: MoneyDirection.incoming,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.bookSpentThisMonth,
                          style: context.text.labelMedium,
                        ),
                        MoneyText(
                          s.monthExpense,
                          direction: MoneyDirection.outgoing,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: FyDims.space2),
            child: Text(l.bookNotIncomeNote, style: context.text.bodySmall),
          ),
        ],
      ),
    );
  }
}

class _PlaceTile extends StatelessWidget {
  const _PlaceTile({required this.place});
  final Place place;

  @override
  Widget build(BuildContext context) {
    final p = place;
    final l = context.l10n;
    final icon = switch (p.kind) {
      'bank' => Icons.account_balance_rounded,
      'wallet' => Icons.account_balance_wallet_rounded,
      _ => Icons.payments_rounded,
    };
    final detail = [
      p.typeLabel,
      if (p.bank?.bankName != null) p.bank!.bankName!,
      if (p.bank?.last4 != null) '•••• ${p.bank!.last4}',
      if (p.bank?.accountHolder != null) l.placeHolder(p.bank!.accountHolder!),
      if (p.custodian != null) l.placeWith(p.custodian!),
      if (!p.active) l.placeClosed,
    ].join(' · ');
    return ListTile(
      leading: Icon(icon, color: context.fy.brand),
      title: Text(p.name),
      subtitle: Text(detail),
      trailing: MoneyText(p.balance),
    );
  }
}

class _Dues extends ConsumerWidget {
  const _Dues({required this.book});
  final Book book;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(openItemsProvider(book.id));
    return RefreshIndicator(
      onRefresh: () => ref.refresh(openItemsProvider(book.id).future),
      child: AsyncView<List<OpenItem>>(
        value: items,
        onRetry: () => ref.invalidate(openItemsProvider(book.id)),
        builder: (list) {
          if (list.isEmpty) {
            return ListView(
              children: [
                const SizedBox(height: 80),
                EmptyView(
                  icon: Icons.handshake_outlined,
                  title: context.l10n.duesNothingTitle,
                  message: context.l10n.duesNothingMessage,
                ),
              ],
            );
          }
          final receivable = list
              .where((o) => o.direction == 'receivable')
              .toList();
          final payable = list.where((o) => o.direction == 'payable').toList();
          return ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              if (receivable.isNotEmpty)
                SectionTitle(context.l10n.duesOthersOweThisBook),
              for (final o in receivable) _DueTile(item: o, book: book),
              if (payable.isNotEmpty)
                SectionTitle(context.l10n.duesThisBookOwes),
              for (final o in payable) _DueTile(item: o, book: book),
            ],
          );
        },
      ),
    );
  }
}

class _DueTile extends StatelessWidget {
  const _DueTile({required this.item, required this.book});
  final OpenItem item;
  final Book book;

  @override
  Widget build(BuildContext context) {
    final o = item;
    final receivable = o.direction == 'receivable';
    return ListTile(
      title: Text(o.counterparty),
      subtitle: Text(
        context.l10n.duesOfOriginal(
          o.reason,
          o.reference,
          formatInr(o.original),
        ),
      ),
      isThreeLine: true,
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          MoneyText(
            o.remaining,
            direction: receivable
                ? MoneyDirection.incoming
                : MoneyDirection.outgoing,
          ),
          StatusBadge(o.status),
        ],
      ),
      onTap: book.canPost
          ? () => context.push('/books/${book.id}/settle/${o.id}')
          : null,
    );
  }
}
