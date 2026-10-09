import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

/// Every book the person may enter: their own personal books first, then firms and pools with their access level.
class BooksScreen extends ConsumerWidget {
  const BooksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final name = auth is SignedIn ? auth.me.displayName : '';
    final books = ref.watch(booksProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Your books')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/books/new'),
        icon: const Icon(Icons.add_business_rounded),
        label: const Text('New business'),
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
                child: Text('Hello, $name', style: context.text.headlineMedium),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  FyDims.space4,
                  FyDims.space1,
                  FyDims.space4,
                  FyDims.space2,
                ),
                child: Text(
                  'Each book is kept separately. You see only the books you were given access to.',
                  style: context.text.bodyMedium?.copyWith(
                    color: context.fy.inkMuted,
                  ),
                ),
              ),
              for (final b in items) _BookTile(book: b),
              if (items.length == 1)
                const Padding(
                  padding: EdgeInsets.all(FyDims.space4),
                  child: EmptyView(
                    icon: Icons.storefront_outlined,
                    title: 'No business books yet',
                    message: 'Add a business, partnership or family pool to keep its books apart from your own.',
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
    final access = switch (book.access) {
      'manage' => 'You manage',
      'write' => 'You record entries',
      _ => 'View only',
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
            book.personal ? 'My personal books' : book.name,
            style: context.text.titleSmall,
          ),
          subtitle: Text(
            book.personal ? 'Private to you' : '${book.typeLabel} · $access',
          ),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: () => context.push('/books/${book.id}'),
        ),
      ),
    );
  }
}
