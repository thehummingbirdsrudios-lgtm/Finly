/**
 * Money in Finly is INR held as exact integer paise (D-045, superseding the whole-rupee rule of BUILD_PROMPT H14):
 * `bigint` everywhere, never floating point, never rounded behind anyone's back. On the wire and in text an amount is a
 * decimal string with at most two places ("1050", "1050.5", "1050.50"); whole rupees are written without ".00".
 * Direction is never a sign on an amount; it is the journal side.
 */
import { fail } from './errors.ts';

export type Paise = bigint;

export const PAISE_PER_RUPEE = 100n;

/** Largest single amount accepted: ₹9,99,99,99,99,999.99 (twelve rupee digits), far above any configured limit. */
export const MAX_AMOUNT: Paise = 99_999_999_999_999n;

/**
 * Parses user/API input into paise: a plain decimal string with at most two places, or a `bigint` that is already in
 * paise (an engine value). Signs, separators, exponents, JSON numbers and more than two decimals are refused.
 */
export function parseMoney(input: unknown): Paise {
  if (typeof input === 'bigint') return checkMoney(input);
  if (typeof input === 'string') {
    const m = /^([0-9]{1,12})(?:\.([0-9]{1,2}))?$/.exec(input);
    if (m) return checkMoney(BigInt(m[1]) * PAISE_PER_RUPEE + BigInt((m[2] ?? '').padEnd(2, '0')));
    if (/^[0-9]+\.[0-9]{3,}$/.test(input)) fail('AMOUNT_INVALID', 'Use at most two digits after the decimal point.');
  }
  return fail('AMOUNT_INVALID', 'Enter the amount in rupees, with paise after a point if needed.');
}

/** A positive amount within the global limit. Zero and negative amounts are never valid money movements. */
export function checkMoney(value: Paise): Paise {
  if (value <= 0n) fail('AMOUNT_INVALID', 'The amount must be more than zero.');
  if (value > MAX_AMOUNT) fail('AMOUNT_INVALID', 'The amount is larger than Finly accepts.');
  return value;
}

export function sum(values: readonly Paise[]): Paise {
  return values.reduce((a, b) => a + b, 0n);
}

/** The API's decimal text for an amount: "1050" for whole rupees, "1050.50" otherwise, "-20" for a negative balance. */
export function toWire(value: Paise): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const rupees = abs / PAISE_PER_RUPEE;
  const paise = abs % PAISE_PER_RUPEE;
  const text = paise === 0n ? rupees.toString() : `${rupees}.${paise.toString().padStart(2, '0')}`;
  return negative ? `-${text}` : text;
}

/** Indian digit grouping of whole rupees: 500 → 500, 20000 → 20,000, 500000 → 5,00,000, 10000000 → 1,00,00,000. */
export function groupIndian(rupees: bigint): string {
  const digits = (rupees < 0n ? -rupees : rupees).toString();
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

/** ₹ with Indian grouping, paise only when there are any, and a true minus sign for negative balances. */
export function formatInr(value: Paise): string {
  const abs = value < 0n ? -value : value;
  const paise = abs % PAISE_PER_RUPEE;
  const text = `₹${groupIndian(abs / PAISE_PER_RUPEE)}${paise === 0n ? '' : `.${paise.toString().padStart(2, '0')}`}`;
  return value < 0n ? `−${text}` : text;
}
