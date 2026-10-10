// Money on the phone (D-045): exact integer paise in a BigInt, never floating point. People type and read rupees
// with paise after a point only when there are any ("1,050", "1,050.50"); the API carries the same decimal text
// ("1050", "1050.50"). The server is the authority; these helpers only parse what a person types and show what the
// server sent.

final BigInt _hundred = BigInt.from(100);

/// The largest single amount Finly accepts, in paise (mirrors backend/src/domain/money.ts MAX_AMOUNT).
final BigInt maxAmount = BigInt.parse('99999999999999');

/// Indian digit grouping of whole rupees: 1,23,45,678.
String groupIndian(BigInt rupees) {
  final negative = rupees.isNegative;
  final digits = rupees.abs().toString();
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

String _paiseSuffix(BigInt paise) {
  final p = paise.remainder(_hundred);
  return p == BigInt.zero ? '' : '.${p.toString().padLeft(2, '0')}';
}

/// ₹1,23,456 or ₹1,23,456.50 — with a minus sign only when the value itself is negative (direction is shown by colour
/// and words).
String formatInr(BigInt paise) {
  final abs = paise.abs();
  final text = '₹${groupIndian(abs ~/ _hundred)}${_paiseSuffix(abs)}';
  return paise.isNegative ? '−$text' : text;
}

/// The API's decimal text for an amount in paise: "1050" for whole rupees, "1050.50" otherwise.
String toWire(BigInt paise) {
  final abs = paise.abs();
  final text = '${abs ~/ _hundred}${_paiseSuffix(abs)}';
  return paise.isNegative ? '-$text' : text;
}

/// Parses an amount the server sent ("1050", "-20", "1050.50") into paise. Anything else is a programming error.
BigInt parseServerAmount(Object? raw) {
  if (raw is String) {
    final m = RegExp(r'^(-?)([0-9]{1,19})(?:\.([0-9]{1,2}))?$').firstMatch(raw);
    if (m != null) {
      final value =
          BigInt.parse(m.group(2)!) * _hundred +
          BigInt.parse((m.group(3) ?? '').padRight(2, '0'));
      return m.group(1) == '-' ? -value : value;
    }
  }
  if (raw is int) return BigInt.from(raw) * _hundred;
  throw FormatException('Not an amount: $raw');
}

/// Why a typed amount cannot be used; the amount field says it in the person's language.
enum AmountProblem { empty, tooManyDecimals, notDigits, notPositive, tooLarge }

/// Result of reading what a person typed in an amount field.
class AmountInput {
  const AmountInput._(this.value, this.problem);

  /// Paise.
  final BigInt? value;
  final AmountProblem? problem;
  bool get ok => value != null;
}

/// Rupees with at most two digits of paise after a point (Indian or plain grouping commas allowed), more than zero,
/// within the limit.
AmountInput readAmount(String text) {
  final t = text
      .trim()
      .replaceAll(',', '')
      .replaceAll('₹', '')
      .replaceAll(' ', '');
  if (t.isEmpty) return const AmountInput._(null, AmountProblem.empty);
  if (RegExp(r'^[0-9]*\.[0-9]{3,}$').hasMatch(t)) {
    return const AmountInput._(null, AmountProblem.tooManyDecimals);
  }
  final m = RegExp(r'^([0-9]{1,13})(?:\.([0-9]{0,2}))?$').firstMatch(t);
  if (m == null) return const AmountInput._(null, AmountProblem.notDigits);
  final v =
      BigInt.parse(m.group(1)!) * _hundred +
      BigInt.parse((m.group(2) ?? '').padRight(2, '0'));
  if (v <= BigInt.zero) {
    return const AmountInput._(null, AmountProblem.notPositive);
  }
  if (v > maxAmount) return const AmountInput._(null, AmountProblem.tooLarge);
  return AmountInput._(v, null);
}
