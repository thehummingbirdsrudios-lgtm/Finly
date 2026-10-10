import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../l10n/l10n.dart';

/// The everyday entries a person records directly. Each opens a form that asks only what that event needs.
enum EntryKind {
  expense(Icons.shopping_bag_outlined),
  income(Icons.south_west_rounded),
  transfer(Icons.swap_horiz_rounded),
  give(Icons.north_east_rounded),
  opening(Icons.flag_outlined);

  const EntryKind(this.icon);
  final IconData icon;

  String title(AppLocalizations l) => switch (this) {
    expense => l.kindExpenseTitle,
    income => l.kindIncomeTitle,
    transfer => l.kindTransferTitle,
    give => l.kindGiveTitle,
    opening => l.kindOpeningTitle,
  };

  String help(AppLocalizations l) => switch (this) {
    expense => l.kindExpenseHelp,
    income => l.kindIncomeHelp,
    transfer => l.kindTransferHelp,
    give => l.kindGiveHelp,
    opening => l.kindOpeningHelp,
  };
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
              child: Text(
                sheet.l10n.kindSheetTitle,
                style: sheet.text.titleLarge,
              ),
            ),
            const SizedBox(height: FyDims.space2),
            for (final k in EntryKind.values)
              ListTile(
                leading: Icon(k.icon, color: sheet.fy.brand),
                title: Text(k.title(sheet.l10n)),
                subtitle: Text(k.help(sheet.l10n)),
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
