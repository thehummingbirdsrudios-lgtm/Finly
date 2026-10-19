import 'package:flutter/widgets.dart';

import '../../core/api/models.dart';
import '../../l10n/l10n.dart';
import 'entry_kinds.dart';

/// The everyday form that can show exactly what an entry recorded, and whose books it is in — or null when no form
/// can (a split or shared expense, money given, a settlement, a fund other than the default): such entries are
/// corrected by reversing them and recording them again, never by a form that would silently drop a detail.
({EntryKind kind, String bookId})? correctionTarget(Json? intent) {
  if (intent == null) return null;
  bool plain(Map<dynamic, dynamic> m) => m['fundId'] == null;
  switch (intent['type']) {
    case 'expense':
      final sources = intent['sources'] as List? ?? const [];
      final allocations = intent['allocations'] as List? ?? const [];
      if (sources.length != 1 || allocations.length != 1) return null;
      final source = sources.first as Map;
      final allocation = allocations.first as Map;
      final simple =
          source['entityId'] == allocation['ownerId'] &&
          source['amount'] == allocation['amount'] &&
          plain(source) &&
          plain(allocation) &&
          allocation['projectId'] == null &&
          allocation['ownerPersonalTreatment'] == null;
      return simple
          ? (kind: EntryKind.expense, bookId: source['entityId'] as String)
          : null;
    case 'income':
      final at = intent['receivedAt'] as Map?;
      final simple =
          at != null &&
          at['entityId'] == intent['ownerId'] &&
          intent['customerId'] == null &&
          plain(intent) &&
          plain(at);
      return simple
          ? (kind: EntryKind.income, bookId: intent['ownerId'] as String)
          : null;
    case 'transfer':
      return plain(intent)
          ? (kind: EntryKind.transfer, bookId: intent['entityId'] as String)
          : null;
    case 'opening_balance':
      return plain(intent)
          ? (kind: EntryKind.opening, bookId: intent['entityId'] as String)
          : null;
  }
  return null;
}

/// Why an entry cannot be reversed or corrected now, in the person's language where Finly knows the reason.
String undoProblemText(BuildContext context, UndoCheck check) {
  final l = context.l10n;
  return switch (check.problemCode) {
    'ALREADY_REVERSED' => l.undoAlready,
    'REVERSAL_BLOCKED_BY_SETTLEMENT' => l.undoBlockedBySettlement,
    'CONFLICT' when check.problemMessage?.startsWith('A reversal') == true =>
      l.undoWaitingAlready,
    _ => check.problemMessage ?? l.commonSomethingWrong,
  };
}
