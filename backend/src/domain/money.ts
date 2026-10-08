/**
 * Money in Finly is INR whole rupees as exact integers (BUILD_PROMPT H14). Amounts are `bigint` everywhere in the
 * engine: no floating point, no paise, no rounding. Direction is never a sign on an amount; it is the journal side.
 */
import { fail } from './errors.ts';

export type Rupees = bigint;

/** Largest single amount accepted: ₹99,99,99,99,999 (12 digits), far above any configured limit. */
export const MAX_AMOUNT: Rupees = 999_999_999_999n;

/** Parses user/API input into whole rupees, refusing decimals, signs, separators and anything not a plain integer. */
export function parseRupees(input: unknown): Rupees {
  if (typeof input === 'bigint') return checkRupees(input);
  if (typeof input === 'number') {
    if (!Number.isSafeInteger(input)) fail('AMOUNT_INVALID', 'Enter the amount in whole rupees.');
    return checkRupees(BigInt(input));
  }
  if (typeof input === 'string' && /^[0-9]{1,13}$/.test(input)) return checkRupees(BigInt(input));
  return fail('AMOUNT_INVALID', 'Enter the amount in whole rupees.');
}

/** A positive amount within the global limit. Zero and negative amounts are never valid money movements. */
export function checkRupees(value: Rupees): Rupees {
  if (value <= 0n) fail('AMOUNT_INVALID', 'The amount must be more than zero.');
  if (value > MAX_AMOUNT) fail('AMOUNT_INVALID', 'The amount is larger than Finly accepts.');
  return value;
}

export function sum(values: readonly Rupees[]): Rupees {
  return values.reduce((a, b) => a + b, 0n);
}

/** Indian digit grouping: 500 → 500, 20000 → 20,000, 500000 → 5,00,000, 10000000 → 1,00,00,000. */
export function groupIndian(value: Rupees): string {
  const digits = (value < 0n ? -value : value).toString();
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

/** ₹ followed by Indian grouping, with a true minus sign for negative balances. */
export function formatInr(value: Rupees): string {
  return `${value < 0n ? '−' : ''}₹${groupIndian(value)}`;
}
