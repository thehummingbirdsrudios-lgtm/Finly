import 'package:finly/core/money.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Indian grouping matches the server and the design system', () {
    final cases = {
      '0': '0',
      '7': '7',
      '999': '999',
      '1000': '1,000',
      '45000': '45,000',
      '100000': '1,00,000',
      '1234567': '12,34,567',
      '999999999999': '9,99,99,99,99,999',
    };
    cases.forEach(
      (input, expected) =>
          expect(groupIndian(BigInt.parse(input)), expected, reason: input),
    );
    expect(formatInr(BigInt.from(-2500)), '−₹2,500');
    expect(formatInr(BigInt.from(2500)), '₹2,500');
  });

  test('amounts are whole rupees: decimals, signs, letters, zero and too much are refused', () {
    expect(readAmount('1,00,000').value, BigInt.from(100000));
    expect(readAmount(' ₹ 2500 ').value, BigInt.from(2500));
    for (final bad in [
      '',
      '10.50',
      '10.',
      '-5',
      '0',
      'abc',
      '1e5',
      '9999999999999',
    ]) {
      expect(readAmount(bad).ok, isFalse, reason: bad);
      expect(readAmount(bad).error, isNotNull, reason: bad);
    }
  });

  test('server amounts are exact beyond double precision', () {
    expect(
      parseServerAmount('900719925474099300').toString(),
      '900719925474099300',
    );
    expect(parseServerAmount('-12'), BigInt.from(-12));
    expect(() => parseServerAmount('12.5'), throwsFormatException);
    expect(() => parseServerAmount(1.5), throwsFormatException);
  });
}
