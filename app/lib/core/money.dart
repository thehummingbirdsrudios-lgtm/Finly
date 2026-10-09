// Money on the phone (BUILD_PROMPT H14): whole rupees as exact integers (BigInt), never floating point, never paise.
// The server is the authority; these helpers only parse what a person types and show what the server sent.

/// The largest single amount Finly accepts (mirrors backend/src/domain/money.ts MAX_AMOUNT).
final BigInt maxAmount = BigInt.parse('999999999999');

/// Indian digit grouping: 1,23,45,678.
String groupIndian(BigInt value) {
  final negative = value.isNegative;
  final digits = value.abs().toString();
  String grouped;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    final last3 = digits.substring(digits.length - 3);
    var rest = digits.substring(0, digits.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    grouped = '${parts.join(',')},$last3';
  }
  return negative ? '-$grouped' : grouped;
}

/// ₹1,23,456 — with a minus sign only when the value itself is negative (direction is shown by colour and words).
String formatInr(BigInt value) {
  final g = groupIndian(value.abs());
  return value.isNegative ? '−₹$g' : '₹$g';
}

/// Parses an amount the server sent (a string of digits, possibly negative). Anything else is a programming error.
BigInt parseServerAmount(Object? raw) {
  if (raw is String && RegExp(r'^-?[0-9]{1,19}$').hasMatch(raw)) {
    return BigInt.parse(raw);
  }
  if (raw is int) return BigInt.from(raw);
  throw FormatException('Not an amount: $raw');
}

/// Result of reading what a person typed in an amount field.
class AmountInput {
  const AmountInput._(this.value, this.error);
  final BigInt? value;
  final String? error;
  bool get ok => value != null;
}

/// Whole rupees only: digits (Indian or plain grouping commas allowed), more than zero, within the limit.
AmountInput readAmount(String text) {
  final t = text
      .trim()
      .replaceAll(',', '')
      .replaceAll('₹', '')
      .replaceAll(' ', '');
  if (t.isEmpty) return const AmountInput._(null, 'Enter the amount.');
  if (RegExp(r'^[0-9]+[.][0-9]*$').hasMatch(t)) {
    return const AmountInput._(null, 'Enter whole rupees, without paise.');
  }
  if (!RegExp(r'^[0-9]{1,13}$').hasMatch(t)) {
    return const AmountInput._(null, 'Use digits only.');
  }
  final v = BigInt.parse(t);
  if (v <= BigInt.zero) {
    return const AmountInput._(null, 'The amount must be more than zero.');
  }
  if (v > maxAmount) {
    return const AmountInput._(null, 'That is larger than Finly accepts.');
  }
  return AmountInput._(v, null);
}
