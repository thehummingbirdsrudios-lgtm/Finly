import 'package:finly/core/money.dart';
import 'package:flutter_test/flutter_test.dart';

BigInt p(int value) => BigInt.from(value);

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
  });

  test('amounts show paise only when there are any (D-045)', () {
    expect(formatInr(p(250000)), '₹2,500');
    expect(formatInr(p(-250000)), '−₹2,500');
    expect(formatInr(p(105050)), '₹1,050.50');
    expect(formatInr(p(5)), '₹0.05');
    expect(toWire(p(105050)), '1050.50');
    expect(toWire(p(700000)), '7000');
    expect(toWire(p(-250)), '-2.50');
  });

  test(
    'typed amounts are rupees with at most two decimals, read as exact paise',
    () {
      expect(readAmount('1,00,000').value, p(10000000));
      expect(readAmount(' ₹ 2500 ').value, p(250000));
      expect(readAmount('10.5').value, p(1050));
      expect(readAmount('10.50').value, p(1050));
      expect(readAmount('10.').value, p(1000));
      expect(readAmount('0.01').value, p(1));
      for (final bad in [
        '',
        '-5',
        '0',
        '0.00',
        'abc',
        '1e5',
        '9999999999999',
      ]) {
        expect(readAmount(bad).ok, isFalse, reason: bad);
        expect(readAmount(bad).problem, isNotNull, reason: bad);
      }
    },
  );

  test(
    'each refusal names its reason, so the field can say it in any language',
    () {
      expect(readAmount('').problem, AmountProblem.empty);
      expect(readAmount('10.505').problem, AmountProblem.tooManyDecimals);
      expect(readAmount('abc').problem, AmountProblem.notDigits);
      expect(readAmount('0').problem, AmountProblem.notPositive);
      expect(readAmount('9999999999999').problem, AmountProblem.tooLarge);
    },
  );

  test('server amounts are exact beyond double precision and carry paise', () {
    expect(
      parseServerAmount('900719925474099300').toString(),
      '90071992547409930000',
    );
    expect(parseServerAmount('-12'), p(-1200));
    expect(parseServerAmount('1050.5'), p(105050));
    expect(parseServerAmount('1050.05'), p(105005));
    expect(() => parseServerAmount('12.505'), throwsFormatException);
    expect(() => parseServerAmount(1.5), throwsFormatException);
  });
}
