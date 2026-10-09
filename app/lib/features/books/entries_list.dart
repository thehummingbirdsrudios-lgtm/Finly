import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

/// The entries of one book, newest first, loaded a page at a time as the person scrolls. Entries that are not yet
/// posted say so — they are never shown as if the money had moved.
class EntriesList extends ConsumerStatefulWidget {
  const EntriesList({super.key, required this.bookId});
  final String bookId;

  @override
  ConsumerState<EntriesList> createState() => _EntriesListState();
}

class _EntriesListState extends ConsumerState<EntriesList> {
  final _items = <EntryRow>[];
  String? _cursor;
  bool _loading = false;
  bool _done = false;
  Object? _error;
  int _version = -1;

  Future<void> _load({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _items.clear();
      _cursor = null;
      _done = false;
    }
    if (_done) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await ref
          .read(apiProvider)
          .entries(widget.bookId, cursor: _cursor);
      if (!mounted) return;
      setState(() {
        _items.addAll(page.items);
        _cursor = page.nextCursor;
        _done = page.nextCursor == null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final version = ref.watch(entriesVersionProvider);
    if (version != _version) {
      _version = version;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load(reset: true));
    }
    if (_items.isEmpty && _error != null) {
      return ErrorView(error: _error!, onRetry: () => _load(reset: true));
    }
    if (_items.isEmpty && (_loading || !_done)) return const LoadingView();
    if (_items.isEmpty) {
      return const EmptyView(
        icon: Icons.receipt_long_outlined,
        title: 'No entries yet',
        message: 'Entries you record in these books appear here, newest first.',
      );
    }
    return RefreshIndicator(
      onRefresh: () => _load(reset: true),
      child: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n.metrics.pixels > n.metrics.maxScrollExtent - 400) _load();
          return false;
        },
        child: ListView.separated(
          padding: const EdgeInsets.only(bottom: 96),
          itemCount: _items.length + 1,
          separatorBuilder: (_, _) => const Divider(height: 1),
          itemBuilder: (context, i) {
            if (i == _items.length) {
              if (_error != null) {
                return TextButton(
                  onPressed: _load,
                  child: const Text('Could not load more. Try again'),
                );
              }
              return _done
                  ? const SizedBox(height: 24)
                  : const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    );
            }
            return EntryTile(entry: _items[i]);
          },
        ),
      ),
    );
  }
}

class EntryTile extends StatelessWidget {
  const EntryTile({super.key, required this.entry});
  final EntryRow entry;

  @override
  Widget build(BuildContext context) {
    final e = entry;
    final Widget amount;
    if (e.moneyIn > BigInt.zero && e.moneyOut == BigInt.zero) {
      amount = MoneyText(e.moneyIn, direction: MoneyDirection.incoming);
    } else if (e.moneyOut > BigInt.zero && e.moneyIn == BigInt.zero) {
      amount = MoneyText(e.moneyOut, direction: MoneyDirection.outgoing);
    } else if (e.moneyIn > BigInt.zero) {
      amount = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          MoneyText(
            e.moneyIn,
            direction: MoneyDirection.incoming,
            style: context.text.bodyMedium,
          ),
          MoneyText(
            e.moneyOut,
            direction: MoneyDirection.outgoing,
            style: context.text.bodyMedium,
          ),
        ],
      );
    } else {
      amount = MoneyText(e.total);
    }
    return ListTile(
      title: Text(
        e.reason?.isNotEmpty == true ? e.reason! : e.typeLabel,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Row(
        children: [
          Flexible(
            child: Text(
              '${showDate(e.valueDate)} · ${e.typeLabel}',
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (e.pending) ...[const SizedBox(width: 8), StatusBadge(e.status)],
        ],
      ),
      trailing: amount,
      onTap: () => context.push('/entries/${e.id}'),
    );
  }
}
