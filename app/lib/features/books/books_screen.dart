import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

/// Every book the person may enter: their own personal books first, then firms and pools with their access level.
class BooksScreen extends ConsumerWidget {
  const BooksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final name = auth is SignedIn ? auth.me.displayName : '';
    final books = ref.watch(booksProvider);
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.booksTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/books/new'),
        icon: const Icon(Icons.add_business_rounded),
        label: Text(l.booksNewBusiness),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(booksProvider.future),
        child: AsyncView<List<Book>>(
          value: books,
          onRetry: () => ref.invalidate(booksProvider),
          builder: (items) => ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  FyDims.space4,
                  FyDims.space4,
                  FyDims.space4,
                  0,
                ),
                child: Text(
                  l.booksHello(name),
                  style: context.text.headlineMedium,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  FyDims.space4,
                  FyDims.space1,
                  FyDims.space4,
                  FyDims.space2,
                ),
                child: Text(
                  l.booksIntro,
                  style: context.text.bodyMedium?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
              ),
              for (final b in items) _BookTile(book: b),
              // Shown until the person has a book other than their own personal one (whatever the list's length).
              if (!items.any((b) => !b.personal))
                Padding(
                  padding: const EdgeInsets.all(FyDims.space4),
                  child: EmptyView(
                    icon: Icons.storefront_outlined,
                    title: l.booksNoBusinessTitle,
                    message: l.booksNoBusinessMessage,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookTile extends StatelessWidget {
  const _BookTile({required this.book});
  final Book book;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final l = context.l10n;
    final access = switch (book.access) {
      'manage' => l.booksAccessManage,
      'write' => l.booksAccessWrite,
      _ => l.booksAccessRead,
    };
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: FyDims.space4,
        vertical: FyDims.space1,
      ),
      child: Card(
        child: ListTile(
          minVerticalPadding: FyDims.space3,
          leading: CircleAvatar(
            backgroundColor: book.personal ? fy.brandSoft : fy.surfaceSunken,
            foregroundColor: fy.brand,
            child: Icon(
              book.personal ? Icons.person_rounded : Icons.storefront_rounded,
            ),
          ),
          title: Text(
            book.personal ? l.booksMyPersonal : book.name,
            style: context.text.titleSmall,
          ),
          subtitle: Text(
            book.personal
                ? l.booksPrivateToYou
                : l.booksTypeAndAccess(book.typeLabel, access),
          ),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: () => context.push('/books/${book.id}'),
        ),
      ),
    );
  }
}
