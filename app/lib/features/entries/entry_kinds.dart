import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';

/// The everyday entries a person records directly. Each opens a form that asks only what that event needs.
enum EntryKind {
  expense(
    'Spent money',
    'Paid for something: a bill, a purchase, a cost.',
    Icons.shopping_bag_outlined,
  ),
  income(
    'Received income',
    'Earned money: a sale, salary, rent, interest.',
    Icons.south_west_rounded,
  ),
  transfer(
    'Moved money',
    'Between two places of these books (Tijori to bank…). Not income or spending.',
    Icons.swap_horiz_rounded,
  ),
  give(
    'Gave money to someone',
    'A loan, gift, payment, drawing or capital — you say which.',
    Icons.north_east_rounded,
  ),
  opening(
    'Opening balance',
    'Money that was already in a place before you started using Finly.',
    Icons.flag_outlined,
  );

  const EntryKind(this.title, this.help, this.icon);
  final String title;
  final String help;
  final IconData icon;
}

Future<void> showEntryKinds(BuildContext context, Book book) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheet) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(bottom: FyDims.space4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: FyDims.space4),
              child: Text('What happened?', style: sheet.text.titleLarge),
            ),
            const SizedBox(height: FyDims.space2),
            for (final k in EntryKind.values)
              ListTile(
                leading: Icon(k.icon, color: sheet.fy.brand),
                title: Text(k.title),
                subtitle: Text(k.help),
                onTap: () {
                  Navigator.of(sheet).pop();
                  context.push('/books/${book.id}/new/${k.name}');
                },
              ),
          ],
        ),
      ),
    ),
  );
}
