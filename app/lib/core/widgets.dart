// Shared building blocks (the design system's reference components, in Flutter): money with its direction in words
// and colour, loading, empty and error states, and status badges. Screens compose these; they never restyle them.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api/api_client.dart';
import 'design_system/theme.dart';
import 'design_system/tokens.g.dart';
import 'money.dart';

enum MoneyDirection { incoming, outgoing, neutral }

/// An amount, coloured and announced by its direction (never by sign alone).
class MoneyText extends StatelessWidget {
  const MoneyText(
    this.amount, {
    super.key,
    this.direction = MoneyDirection.neutral,
    this.style,
  });

  final BigInt amount;
  final MoneyDirection direction;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final color = switch (direction) {
      MoneyDirection.incoming => fy.moneyIn,
      MoneyDirection.outgoing => fy.moneyOut,
      MoneyDirection.neutral => fy.ink,
    };
    final prefix = switch (direction) {
      MoneyDirection.incoming => '+',
      MoneyDirection.outgoing => '−',
      MoneyDirection.neutral => '',
    };
    final words = switch (direction) {
      MoneyDirection.incoming => 'in',
      MoneyDirection.outgoing => 'out',
      MoneyDirection.neutral => '',
    };
    return Semantics(
      label: '${formatInr(amount)} $words'.trim(),
      excludeSemantics: true,
      child: Text(
        '$prefix${formatInr(amount)}',
        style: (style ?? context.text.titleSmall)?.copyWith(color: color),
      ),
    );
  }
}

/// A plain-language message for any failure, with the action that helps.
String messageOf(Object error) {
  if (error is ApiException) return error.message;
  return 'Something went wrong. Please try again.';
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label = 'Loading…'});
  final String label;

  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(label: label, child: const CircularProgressIndicator()),
  );
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final network = error is ApiException && (error as ApiException).isNetwork;
    final denied =
        error is ApiException &&
        [403, 404].contains((error as ApiException).status);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(FyDims.space8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              network
                  ? Icons.wifi_off_rounded
                  : (denied
                        ? Icons.lock_outline_rounded
                        : Icons.error_outline_rounded),
              size: 40,
              color: network ? fy.inkMuted : fy.error,
            ),
            const SizedBox(height: FyDims.space4),
            Text(
              network
                  ? 'You are offline'
                  : (denied ? 'Not available to you' : 'Could not load this'),
              style: context.text.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: FyDims.space2),
            Text(
              messageOf(error),
              style: context.text.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null && !denied) ...[
              const SizedBox(height: FyDims.space6),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(FyDims.space8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 40, color: context.fy.inkMuted),
          const SizedBox(height: FyDims.space4),
          Text(
            title,
            style: context.text.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: FyDims.space2),
          Text(
            message,
            style: context.text.bodyMedium?.copyWith(
              color: context.fy.inkMuted,
            ),
            textAlign: TextAlign.center,
          ),
          if (action != null) ...[
            const SizedBox(height: FyDims.space6),
            action!,
          ],
        ],
      ),
    ),
  );
}

/// Renders an AsyncValue with the standard loading and error states.
class AsyncView<T> extends StatelessWidget {
  const AsyncView({
    super.key,
    required this.value,
    required this.builder,
    this.onRetry,
  });
  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => value.when(
    data: builder,
    loading: () => const LoadingView(),
    error: (e, _) => ErrorView(error: e, onRetry: onRetry),
    skipLoadingOnRefresh: true,
  );
}

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    final (label, fg, bg) = switch (status) {
      'posted' => ('Posted', fy.success, fy.successSoft),
      'pending_acknowledgement' => (
        'Waiting for acknowledgement',
        fy.pending,
        fy.pendingSoft,
      ),
      'pending_approval' => (
        'Waiting for approval',
        fy.pending,
        fy.pendingSoft,
      ),
      'rejected' => ('Rejected', fy.blocked, fy.blockedSoft),
      'reversed' => ('Reversed', fy.reversed, fy.reversedSoft),
      'open' => ('Open', fy.outstanding, fy.outstandingSoft),
      'partially_settled' => (
        'Partly settled',
        fy.outstanding,
        fy.outstandingSoft,
      ),
      'settled' => ('Settled', fy.reconciled, fy.reconciledSoft),
      'acknowledged' => ('Acknowledged', fy.success, fy.successSoft),
      'pending' => ('Waiting', fy.pending, fy.pendingSoft),
      _ => (status.replaceAll('_', ' '), fy.inkMuted, fy.surfaceSunken),
    };
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: FyDims.space2,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(FyDims.radiusSm),
      ),
      child: Text(label, style: context.text.labelMedium?.copyWith(color: fg)),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.trailing});
  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(
      FyDims.space4,
      FyDims.space6,
      FyDims.space4,
      FyDims.space2,
    ),
    child: Row(
      children: [
        Expanded(
          child: Semantics(
            header: true,
            child: Text(text, style: context.text.titleMedium),
          ),
        ),
        ?trailing,
      ],
    ),
  );
}

/// A message bar at the top of a form: what went wrong and what to do.
class FormMessage extends StatelessWidget {
  const FormMessage(this.message, {super.key, this.error = true});
  final String message;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final fy = context.fy;
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(FyDims.space3),
        decoration: BoxDecoration(
          color: error ? fy.errorSoft : fy.successSoft,
          borderRadius: BorderRadius.circular(FyDims.radiusMd),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              error
                  ? Icons.error_outline_rounded
                  : Icons.check_circle_outline_rounded,
              color: error ? fy.error : fy.success,
            ),
            const SizedBox(width: FyDims.space2),
            Expanded(child: Text(message, style: context.text.bodyMedium)),
          ],
        ),
      ),
    );
  }
}

void showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Today in the server's date format.
String todayIso() {
  final d = DateTime.now();
  return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

/// 2026-10-09 → 9 Oct 2026.
String showDate(String iso) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(iso);
  if (m == null) return iso;
  return '${int.parse(m.group(3)!)} ${months[int.parse(m.group(2)!) - 1]} ${m.group(1)}';
}
