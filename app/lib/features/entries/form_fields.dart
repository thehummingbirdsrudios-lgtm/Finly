import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/design_system/theme.dart';
import '../../core/design_system/tokens.g.dart';
import '../../core/money.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';
import '../../l10n/l10n.dart';

/// Rupees, with paise after a point when needed, typed with the number pad; shows the amount as Finly will read it.
class AmountField extends StatelessWidget {
  const AmountField({super.key, required this.controller, this.label});
  final TextEditingController controller;
  final String? label;

  static String? problemText(AppLocalizations l, AmountProblem? p) =>
      switch (p) {
        AmountProblem.empty => l.amountEnter,
        AmountProblem.tooManyDecimals => l.amountTwoDecimals,
        AmountProblem.notDigits => l.amountDigitsOnly,
        AmountProblem.notPositive => l.amountPositive,
        AmountProblem.tooLarge => l.amountTooLarge,
        null => null,
      };

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        final read = readAmount(value.text);
        final l = context.l10n;
        return TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9,.]')),
          ],
          decoration: InputDecoration(
            labelText: label ?? l.amountLabel,
            prefixText: '₹ ',
            helperText: read.ok ? formatInr(read.value!) : l.amountHelp,
          ),
          style: context.text.titleLarge,
          validator: (v) => problemText(l, readAmount(v ?? '').problem),
        );
      },
    );
  }
}

/// The day the money moved: today or earlier.
class DateField extends StatelessWidget {
  const DateField({
    super.key,
    required this.value,
    required this.onChanged,
    this.label,
  });
  final String value;
  final ValueChanged<String> onChanged;
  final String? label;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(FyDims.radiusMd),
      onTap: () async {
        final now = DateTime.now();
        final current = DateTime.tryParse(value) ?? now;
        final picked = await showDatePicker(
          context: context,
          initialDate: current.isAfter(now) ? now : current,
          firstDate: DateTime(2000),
          lastDate: now,
          helpText: context.l10n.dateWhenMoved,
        );
        if (picked != null) {
          onChanged(
            '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-'
            '${picked.day.toString().padLeft(2, '0')}',
          );
        }
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label ?? context.l10n.commonDate,
          suffixIcon: const Icon(Icons.calendar_today_rounded),
        ),
        child: Text(showDate(value)),
      ),
    );
  }
}

/// A money place of one book.
class PlaceField extends ConsumerWidget {
  const PlaceField({
    super.key,
    required this.bookId,
    required this.value,
    required this.onChanged,
    this.label,
    this.exclude,
  });
  final String bookId;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String? label;
  final String? exclude;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final places = ref.watch(placesProvider(bookId));
    return places.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => FormMessage(messageOf(context, e)),
      data: (items) {
        final usable = items.where((p) => p.active && p.id != exclude).toList();
        if (usable.isEmpty) return FormMessage(context.l10n.fieldNoPlaces);
        return DropdownButtonFormField<String>(
          key: ValueKey('$label$value'),
          initialValue: usable.any((p) => p.id == value) ? value : null,
          isExpanded: true,
          decoration: InputDecoration(
            labelText: label ?? context.l10n.fieldMoneyPlace,
          ),
          items: [
            for (final p in usable)
              DropdownMenuItem(
                value: p.id,
                child: Text(
                  '${p.name} · ${formatInr(p.balance)}',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
          onChanged: onChanged,
          validator: (v) => v == null ? context.l10n.fieldChoosePlace : null,
        );
      },
    );
  }
}

/// An expense or income category.
class CategoryField extends ConsumerWidget {
  const CategoryField({
    super.key,
    required this.kind,
    required this.value,
    required this.onChanged,
    required this.label,
    this.helper,
  });
  final String kind;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String label;
  final String? helper;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lookups = ref.watch(lookupsProvider);
    return lookups.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => RetryMessage(
        messageOf(context, e),
        onRetry: () => ref.invalidate(lookupsProvider),
      ),
      data: (l) {
        final cats = l.categoriesOf(kind);
        return DropdownButtonFormField<String>(
          key: ValueKey('$label$value'),
          initialValue: cats.any((c) => c.id == value) ? value : null,
          isExpanded: true,
          decoration: InputDecoration(
            labelText: label,
            helperText: helper,
            helperMaxLines: 2,
          ),
          items: [
            for (final c in cats)
              DropdownMenuItem(value: c.id, child: Text(c.name)),
          ],
          onChanged: onChanged,
          validator: (v) => v == null ? context.l10n.fieldChooseCategory : null,
        );
      },
    );
  }
}

/// Someone this book deals with: another of the person's books, or a person or business outside Finly — with a
/// way to add a new one without leaving the form.
class PartyField extends ConsumerWidget {
  const PartyField({
    super.key,
    required this.bookId,
    required this.value,
    required this.onChanged,
    this.label,
  });
  final String bookId;
  final Party? value;
  final ValueChanged<Party?> onChanged;
  final String? label;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parties = ref.watch(partiesProvider(bookId));
    return parties.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => FormMessage(messageOf(context, e)),
      data: (items) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<String>(
            key: ValueKey('$label${value?.id}'),
            initialValue: items.any((p) => p.id == value?.id)
                ? value!.id
                : null,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: label ?? context.l10n.fieldToWhom,
            ),
            items: [
              for (final p in items)
                DropdownMenuItem(
                  value: p.id,
                  child: Text(
                    context.l10n.fieldPartyOption(
                      p.name,
                      p.keepsBooks ? context.l10n.fieldKeepsBooks : p.typeLabel,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (id) =>
                onChanged(items.where((p) => p.id == id).firstOrNull),
            validator: (v) => v == null ? context.l10n.fieldChooseWho : null,
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              icon: const Icon(Icons.person_add_alt_1_rounded),
              label: Text(context.l10n.fieldSomeoneNew),
              onPressed: () async {
                final created = await showDialog<String>(
                  context: context,
                  builder: (_) => AddPartyDialog(bookId: bookId),
                );
                if (created == null) return;
                ref.invalidate(partiesProvider(bookId));
                final list = await ref.read(partiesProvider(bookId).future);
                onChanged(list.where((p) => p.id == created).firstOrNull);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class AddPartyDialog extends ConsumerStatefulWidget {
  const AddPartyDialog({super.key, required this.bookId});
  final String bookId;

  @override
  ConsumerState<AddPartyDialog> createState() => _AddPartyDialogState();
}

class _AddPartyDialogState extends ConsumerState<AddPartyDialog> {
  final _name = TextEditingController();
  String? _type;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || _type == null) {
      setState(() => _error = context.l10n.partyNewMissing);
      return;
    }
    setState(() => _busy = true);
    try {
      final id = await ref
          .read(apiProvider)
          .addParty(widget.bookId, name: _name.text.trim(), typeKey: _type!);
      if (mounted) Navigator.of(context).pop(id);
    } catch (e) {
      if (mounted) setState(() => _error = messageOf(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lookups = ref.watch(lookupsProvider);
    final types = lookups.value?.partyTypes ?? const [];
    final l = context.l10n;
    return AlertDialog(
      title: Text(l.fieldSomeoneNew),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l.partyNewIntro, style: context.text.bodySmall),
            const SizedBox(height: FyDims.space3),
            if (lookups.hasError) ...[
              RetryMessage(
                messageOf(context, lookups.error!),
                onRetry: () => ref.invalidate(lookupsProvider),
              ),
              const SizedBox(height: FyDims.space3),
            ],
            if (_error != null) ...[
              FormMessage(_error!),
              const SizedBox(height: FyDims.space3),
            ],
            TextField(
              controller: _name,
              decoration: InputDecoration(labelText: l.commonName),
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: FyDims.space3),
            DropdownButtonFormField<String>(
              initialValue: _type,
              isExpanded: true,
              decoration: InputDecoration(labelText: l.commonKind),
              items: [
                for (final t in types)
                  DropdownMenuItem(value: t.key, child: Text(t.label)),
              ],
              onChanged: (v) => setState(() => _type = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.of(context).pop(),
          child: Text(l.commonCancel),
        ),
        FilledButton(onPressed: _busy ? null : _save, child: Text(l.commonAdd)),
      ],
    );
  }
}

/// A required either/or answer with no answer chosen in advance (the engine never assumes one, D-039).
class ChoiceField<T> extends StatelessWidget {
  const ChoiceField({
    super.key,
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
    this.help,
  });
  final String label;
  final List<(T, String)> options;
  final T? value;
  final ValueChanged<T> onChanged;
  final String? help;

  @override
  Widget build(BuildContext context) {
    return FormField<T>(
      initialValue: value,
      validator: (_) => value == null ? context.l10n.commonChooseOne : null,
      builder: (state) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: context.text.labelMedium),
          if (help != null) Text(help!, style: context.text.bodySmall),
          const SizedBox(height: FyDims.space2),
          SegmentedButton<T>(
            emptySelectionAllowed: true,
            showSelectedIcon: false,
            segments: [
              for (final o in options)
                ButtonSegment(value: o.$1, label: Text(o.$2)),
            ],
            selected: value == null ? <T>{} : {value as T},
            onSelectionChanged: (s) {
              if (s.isNotEmpty) {
                onChanged(s.first);
                state.didChange(s.first);
              }
            },
          ),
          if (state.hasError)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                state.errorText!,
                style: context.text.bodySmall?.copyWith(
                  color: context.fy.error,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
