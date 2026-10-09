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

/// What money given is (D-039): every purpose the engine accepts, in words a person uses.
const givePurposes = <(String, String, String)>[
  ('loan', 'A loan', 'They will pay it back.'),
  ('gift', 'A gift', 'Given freely; nothing comes back.'),
  ('donation', 'A donation', 'To a temple, trust or cause.'),
  (
    'remuneration',
    'Salary or payment for work',
    'Wages, fees, commission to a person.',
  ),
  (
    'business_expense',
    'Payment for goods or services',
    'Rent, a purchase, a service from a business or person.',
  ),
  (
    'reimbursement',
    'Paying back what they spent for us',
    'They paid a cost of these books from their own money.',
  ),
  (
    'drawings',
    'Owner drawing',
    'A business gives one of its owners money for their own use.',
  ),
  (
    'distribution',
    'Profit share to an owner',
    'A business shares its profit with an owner.',
  ),
  (
    'capital',
    'Capital into a business I own',
    'An owner puts money into their business.',
  ),
  (
    'personal_benefit',
    'Owner\'s personal expense paid by the business',
    'The business pays something for an owner personally.',
  ),
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

  /// One key per form: a double tap, a retry or a lost answer can never post twice.
  final String _requestKey = newRequestKey();
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
    final a = amount.toString();
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
      final text = switch (r.status) {
        'posted' => '${r.reference} recorded.',
        'pending_acknowledgement' =>
          '${r.reference} is waiting for the other person to acknowledge it.',
        _ => '${r.reference}: ${r.status}.',
      };
      showMessage(context, text);
      context.pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = (ref.watch(booksProvider).value ?? const <Book>[])
        .where((b) => b.id == widget.bookId)
        .firstOrNull;
    final bookName = book == null
        ? 'these books'
        : (book.personal ? 'your personal books' : book.name);
    return Scaffold(
      appBar: AppBar(title: Text(widget.kind.title)),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(FyDims.space4),
            children: [
              Text(
                widget.kind.help,
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
                decoration: const InputDecoration(
                  labelText: 'Note (optional)',
                  hintText: 'What was it for?',
                ),
              ),
              const SizedBox(height: FyDims.space4),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Record'),
              ),
              const SizedBox(height: FyDims.space2),
              Text(
                'Finly checks the entry before anything is recorded. If something is missing or does not fit, '
                'it tells you what to change.',
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
    switch (widget.kind) {
      case EntryKind.expense:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: 'Paid from',
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          CategoryField(
            kind: 'expense',
            value: _category,
            label: 'What kind of expense',
            onChanged: (v) => setState(() => _category = v),
          ),
        ];
      case EntryKind.income:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: 'Received into',
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          CategoryField(
            kind: 'income',
            value: _category,
            label: 'What kind of income',
            onChanged: (v) => setState(() => _category = v),
          ),
        ];
      case EntryKind.transfer:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: 'From',
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          PlaceField(
            bookId: widget.bookId,
            value: _toPlace,
            label: 'To',
            exclude: _place,
            onChanged: (v) => setState(() => _toPlace = v),
          ),
        ];
      case EntryKind.opening:
        return [
          PlaceField(
            bookId: widget.bookId,
            value: _place,
            label: 'Where the money is',
            onChanged: (v) => setState(() => _place = v),
          ),
          gap,
          Text(
            'Record only money that really is there today. Its owner is these books; if you are unsure, leave it out '
            'and add it when you know.',
            style: context.text.bodySmall,
          ),
        ];
      case EntryKind.give:
        return _giveFields(bookName);
    }
  }

  List<Widget> _giveFields(String bookName) {
    const gap = SizedBox(height: FyDims.space4);
    final purpose = givePurposes.where((p) => p.$1 == _purpose).firstOrNull;
    final receiverBooks = _party?.keepsBooks == true;
    final fields = <Widget>[
      PlaceField(
        bookId: widget.bookId,
        value: _place,
        label: 'Given from',
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
          labelText: 'What is this money?',
          helperText:
              purpose?.$3 ?? 'Say what it really is; Finly never guesses.',
          helperMaxLines: 2,
        ),
        items: [
          for (final p in givePurposes)
            DropdownMenuItem(value: p.$1, child: Text(p.$2)),
        ],
        onChanged: (v) => setState(() => _purpose = v),
        validator: (v) => v == null ? 'Choose what this money is.' : null,
      ),
      gap,
      ChoiceField<bool>(
        label: 'Does it have to be paid back?',
        options: const [(true, 'Yes, it is owed back'), (false, 'No')],
        value: _repayable,
        onChanged: (v) => setState(() => _repayable = v),
      ),
      gap,
      ChoiceField<String>(
        label: 'How $bookName record it',
        help: _purpose == null || _repayable == null
            ? null
            : (_giverKeeps
                  ? 'For this, the value stays with $bookName (owed back, a drawing, capital or a profit share): choose Own.'
                  : 'This money leaves $bookName for good: choose Expense.'),
        options: const [('own', 'Own'), ('expense', 'Expense')],
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
          label: 'Which expense of $bookName',
          onChanged: (v) => setState(() => _giverCategory = v),
        ),
      ]);
    }
    if (receiverBooks) {
      if (!_receiverIsMyBook) {
        fields.addAll([
          gap,
          FormMessage(
            '${_party!.name} keeps their own books in Finly. Their side needs a money place in their books, which '
            'only they can choose — ask them to record it, or choose someone outside Finly.',
          ),
        ]);
      } else {
        fields.addAll([
          gap,
          ChoiceField<String>(
            label: 'How ${_party!.name} records it',
            help: 'Own: the money arrives in one of their places. Expense: it paid one of their costs directly.',
            options: const [('own', 'Own'), ('expense', 'Expense')],
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
              label: 'Received into (${_party!.name})',
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
              label: 'Which expense of ${_party!.name}',
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
                  ? 'Which of ${_party!.name}\'s expenses this pays back'
                  : 'How ${_party!.name} records receiving it',
              helper: _receiverCredit == 'recovery'
                  ? 'A reimbursement is never income.'
                  : 'Chosen by you — Finly never turns one book\'s expense into another\'s income by itself.',
              onChanged: (v) => setState(() => _receiverIncomeCategory = v),
            ),
          ]);
        }
      }
    }
    return fields;
  }
}
