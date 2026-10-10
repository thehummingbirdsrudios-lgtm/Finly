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
import 'entry_kinds.dart';
import 'form_fields.dart';
import '../../l10n/l10n.dart';

/// What money given is (D-039): every purpose the engine accepts, in words a person uses.
List<(String, String, String)> givePurposes(AppLocalizations l) => [
  ('loan', l.purposeLoan, l.purposeLoanHelp),
  ('gift', l.purposeGift, l.purposeGiftHelp),
  ('donation', l.purposeDonation, l.purposeDonationHelp),
  ('remuneration', l.purposeRemuneration, l.purposeRemunerationHelp),
  ('business_expense', l.purposeBusinessExpense, l.purposeBusinessExpenseHelp),
  ('reimbursement', l.purposeReimbursement, l.purposeReimbursementHelp),
  ('drawings', l.purposeDrawings, l.purposeDrawingsHelp),
  ('distribution', l.purposeDistribution, l.purposeDistributionHelp),
  ('capital', l.purposeCapital, l.purposeCapitalHelp),
  ('personal_benefit', l.purposePersonalBenefit, l.purposePersonalBenefitHelp),
];

class EntryFormScreen extends ConsumerStatefulWidget {
  const EntryFormScreen({super.key, required this.bookId, required this.kind});
  final String bookId;
  final EntryKind kind;

  @override
  ConsumerState<EntryFormScreen> createState() => _EntryFormScreenState();
}

class _EntryFormScreenState extends ConsumerState<EntryFormScreen> {
  final _form = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _reason = TextEditingController();

  /// One key per attempt at this entry: a double tap, a retry or a lost answer can never post twice. It is renewed
  /// only after a final refusal, which the server stores under the old key (see [outcomeUnknown]).
  String _requestKey = newRequestKey();
  String _date = todayIso();
  String? _place;
  String? _toPlace;
  String? _category;
  Party? _party;
  String? _purpose;
  bool? _repayable;
  String? _giverSide;
  String? _giverCategory;
  String? _receiverSide;
  String? _receiverPlace;
  String? _receiverExpenseCategory;
  String? _receiverIncomeCategory;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  bool get _receiverIsMyBook {
    final books = ref.read(booksProvider).value ?? const <Book>[];
    return _party != null && books.any((b) => b.id == _party!.id && b.canPost);
  }

  /// Money given to someone who keeps their own books, but not books this person may post to: their side can only be
  /// recorded by them, so this form cannot record it (the server would refuse it).
  bool get _cannotRecord =>
      widget.kind == EntryKind.give &&
      _party?.keepsBooks == true &&
      !_receiverIsMyBook;

  bool get _giverKeeps =>
      _repayable == true ||
      const {'drawings', 'capital', 'distribution'}.contains(_purpose);

  String? get _receiverCredit {
    if (_repayable == true || _purpose == 'drawings' || _purpose == 'capital') {
      return null;
    }
    if (_purpose == 'reimbursement') return 'recovery';
    return 'income';
  }

  Map<String, Object?> _intent(BigInt amount) {
    final a = toWire(amount);
    final book = widget.bookId;
    return switch (widget.kind) {
      EntryKind.expense => {
        'type': 'expense',
        'sources': [
          {'entityId': book, 'locationId': _place, 'amount': a},
        ],
        'allocations': [
          {'ownerId': book, 'categoryId': _category, 'amount': a},
        ],
      },
      EntryKind.income => {
        'type': 'income',
        'ownerId': book,
        'categoryId': _category,
        'amount': a,
        'receivedAt': {'entityId': book, 'locationId': _place},
      },
      EntryKind.transfer => {
        'type': 'transfer',
        'entityId': book,
        'fromLocationId': _place,
        'toLocationId': _toPlace,
        'amount': a,
      },
      EntryKind.opening => {
        'type': 'opening_balance',
        'entityId': book,
        'locationId': _place,
        'amount': a,
      },
      EntryKind.give => {
        'type': 'give',
        'giverId': book,
        'giverLocationId': _place,
        'purpose': _purpose,
        'repayable': _repayable,
        'giverSide': _giverSide,
        if (_giverSide == 'expense') 'giverCategoryId': _giverCategory,
        'receiverId': _party?.id,
        if (_party?.keepsBooks == true) 'receiverSide': _receiverSide,
        if (_party?.keepsBooks == true && _receiverSide == 'own')
          'receiverLocationId': _receiverPlace,
        if (_party?.keepsBooks == true && _receiverSide == 'expense')
          'receiverExpenseCategoryId': _receiverExpenseCategory,
        if (_party?.keepsBooks == true && _receiverCredit == 'income')
          'receiverIncomeCategoryId': _receiverIncomeCategory,
        if (_party?.keepsBooks == true && _receiverCredit == 'recovery')
          'receiverRecoveryCategoryId': _receiverIncomeCategory,
        'amount': a,
      },
    };
  }

  String get _typeKey => switch (widget.kind) {
    EntryKind.expense => 'expense',
    EntryKind.income => 'income',
    EntryKind.transfer => 'transfer',
    EntryKind.opening => 'opening_balance',
    EntryKind.give => 'give',
  };

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    final amount = readAmount(_amount.text).value!;
    setState(() => _busy = true);
    try {
      final r = await ref
          .read(apiProvider)
          .submit(
            key: _requestKey,
            typeKey: _typeKey,
            bookId: widget.bookId,
            valueDate: _date,
            reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
            intent: _intent(amount),
          );
      if (!mounted) return;
      refreshMoney(ref);
      final l = context.l10n;
      final text = switch (r.status) {
        'posted' => l.formRecorded(r.reference),
        'pending_acknowledgement' => l.formWaitingAck(r.reference),
        _ => l.formOtherStatus(r.reference, r.status),
      };
      showMessage(context, text);
      context.pop();
    } catch (e) {
      if (!outcomeUnknown(e)) _requestKey = newRequestKey();
      if (mounted) setState(() => _error = messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = (ref.watch(booksProvider).value ?? const <Book>[])
        .where((b) => b.id == widget.bookId)
        .firstOrNull;
    final l = context.l10n;
    final bookName = book == null
        ? l.formTheseBooks
        : (book.personal ? l.formYourPersonalBooks : book.name);
    return Scaffold(
      appBar: AppBar(title: Text(widget.kind.title(l))),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(FyDims.space4),
            children: [
              Text(
                widget.kind.help(l),
                style: context.text.bodyMedium?.copyWith(
                  color: context.fy.inkMuted,
                ),
              ),
              const SizedBox(height: FyDims.space4),
              if (_error != null) ...[
                FormMessage(_error!),
                const SizedBox(height: FyDims.space4),
              ],
              AmountField(controller: _amount),
              const SizedBox(height: FyDims.space4),
              DateField(
                value: _date,
                onChanged: (v) => setState(() => _date = v),
              ),
              const SizedBox(height: FyDims.space4),
              ..._fields(bookName),
              const SizedBox(height: FyDims.space4),
              TextFormField(
                controller: _reason,
                maxLength: 500,
                decoration: InputDecoration(
                  labelText: l.commonNoteOptional,
                  hintText: l.commonNoteHint,
                ),
              ),
              const SizedBox(height: FyDims.space4),
              FilledButton(
                onPressed: _busy || _cannotRecord ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l.formRecord),
              ),
              const SizedBox(height: FyDims.space2),
              Text(
                l.formChecksNote,
                style: context.text.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _fields(String bookName) {
    const gap = SizedBox(height: FyDims.space4);
    final l = context.l10n;
    switch (widget.kind) {
      case EntryKind.expense:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: l.formPaidFrom,
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          CategoryField(
            kind: 'expense',
            value: _category,
            label: l.formExpenseKind,
            onChanged: (v) => setState(() => _category = v),
          ),
        ];
      case EntryKind.income:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: l.formReceivedInto,
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          CategoryField(
            kind: 'income',
            value: _category,
            label: l.formIncomeKind,
            onChanged: (v) => setState(() => _category = v),
          ),
        ];
      case EntryKind.transfer:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: l.formFrom,
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          PlaceField(
            bookId: widget.bookId,
            value: _toPlace,
            label: l.formTo,
            exclude: _place,
            onChanged: (v) => setState(() => _toPlace = v),
          ),
        ];
      case EntryKind.opening:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: l.formWhereMoneyIs,
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          Text(l.formOpeningNote, style: context.text.bodySmall),
        ];
      case EntryKind.give:
        return _giveFields(bookName);
    }
  }

  List<Widget> _giveFields(String bookName) {
    const gap = SizedBox(height: FyDims.space4);
    final l = context.l10n;
    final purposes = givePurposes(l);
    final purpose = purposes.where((p) => p.$1 == _purpose).firstOrNull;
    final receiverBooks = _party?.keepsBooks == true;
    final fields = <Widget>[
      PlaceField(
        bookId: widget.bookId,
        value: _place,
        label: l.giveGivenFrom,
        onChanged: (v) => setState(() => _place = v),
      ),
      gap,
      PartyField(
        bookId: widget.bookId,
        value: _party,
        onChanged: (p) => setState(() {
          _party = p;
          _receiverSide = null;
          _receiverPlace = null;
        }),
      ),
      gap,
      DropdownButtonFormField<String>(
        initialValue: _purpose,
        isExpanded: true,
        decoration: InputDecoration(
          labelText: l.giveWhatIsIt,
          helperText: purpose?.$3 ?? l.giveNeverGuesses,
          helperMaxLines: 2,
        ),
        items: [
          for (final p in purposes)
            DropdownMenuItem(value: p.$1, child: Text(p.$2)),
        ],
        onChanged: (v) => setState(() => _purpose = v),
        validator: (v) => v == null ? l.giveChoosePurpose : null,
      ),
      gap,
      ChoiceField<bool>(
        label: l.givePaidBack,
        options: [(true, l.giveOwedBack), (false, l.giveNo)],
        value: _repayable,
        onChanged: (v) => setState(() => _repayable = v),
      ),
      gap,
      ChoiceField<String>(
        label: l.giveHowRecorded(bookName),
        help: _purpose == null || _repayable == null
            ? null
            : (_giverKeeps
                  ? l.giveValueStays(bookName)
                  : l.giveLeaves(bookName)),
        options: [('own', l.giveOwn), ('expense', l.giveExpense)],
        value: _giverSide,
        onChanged: (v) => setState(() => _giverSide = v),
      ),
    ];
    if (_giverSide == 'expense') {
      fields.addAll([
        gap,
        CategoryField(
          kind: 'expense',
          value: _giverCategory,
          label: l.giveWhichExpense(bookName),
          onChanged: (v) => setState(() => _giverCategory = v),
        ),
      ]);
    }
    if (receiverBooks) {
      if (!_receiverIsMyBook) {
        fields.addAll([gap, FormMessage(l.giveOtherKeepsBooks(_party!.name))]);
      } else {
        fields.addAll([
          gap,
          ChoiceField<String>(
            label: l.giveHowRecorded(_party!.name),
            help: l.giveReceiverSideHelp,
            options: [('own', l.giveOwn), ('expense', l.giveExpense)],
            value: _receiverSide,
            onChanged: (v) => setState(() => _receiverSide = v),
          ),
        ]);
        if (_receiverSide == 'own') {
          fields.addAll([
            gap,
            PlaceField(
              bookId: _party!.id,
              value: _receiverPlace,
              label: l.giveReceivedIntoOf(_party!.name),
              onChanged: (v) => setState(() => _receiverPlace = v),
            ),
          ]);
        }
        if (_receiverSide == 'expense') {
          fields.addAll([
            gap,
            CategoryField(
              kind: 'expense',
              value: _receiverExpenseCategory,
              label: l.giveWhichExpenseOf(_party!.name),
              onChanged: (v) => setState(() => _receiverExpenseCategory = v),
            ),
          ]);
        }
        if (_receiverCredit != null) {
          fields.addAll([
            gap,
            CategoryField(
              kind: _receiverCredit == 'recovery' ? 'expense' : 'income',
              value: _receiverIncomeCategory,
              label: _receiverCredit == 'recovery'
                  ? l.giveWhichPaysBack(_party!.name)
                  : l.giveHowReceives(_party!.name),
              helper: _receiverCredit == 'recovery'
                  ? l.giveReimbursementNeverIncome
                  : l.giveChosenByYou,
              onChanged: (v) => setState(() => _receiverIncomeCategory = v),
            ),
          ]);
        }
      }
    }
    return fields;
  }
}
