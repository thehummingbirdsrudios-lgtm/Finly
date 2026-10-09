/**
 * Turns a client's entry request into an engine intent. Only the intents a person may record directly are accepted
 * (cash adjustments go through their own approval route); amounts arrive as strings of whole rupees and become exact
 * integers; everything else about meaning is decided by the engine and the posting service, never here.
 */
import { fail } from '../domain/errors.ts';
import { parseRupees } from '../domain/money.ts';
import type { Intent } from '../app/posting/service.ts';

export const CLIENT_INTENTS = new Set([
  'transfer',
  'transit_confirm',
  'expense',
  'bill',
  'give',
  'income',
  'unidentified_receipt',
  'advance_give',
  'advance_account',
  'loan',
  'loan_repayment',
  'capital_contribution',
  'withdrawal',
  'settlement',
  'offset',
  'opening_balance',
]);

/** Amount fields; `interest` may also be zero (a repayment of principal only). */
const AMOUNT_KEYS = new Set(['amount', 'principal', 'interest']);
const MAX_DEPTH = 6;
const MAX_ITEMS = 200;

function convert(value: unknown, key: string | undefined, depth: number): unknown {
  if (depth > MAX_DEPTH) fail('VALIDATION', 'The entry is nested too deeply.');
  if (key !== undefined && AMOUNT_KEYS.has(key)) {
    if (key === 'interest' && (value === '0' || value === 0)) return 0n;
    return parseRupees(value);
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ITEMS) fail('VALIDATION', 'The entry has too many lines.');
    return value.map((v) => convert(v, undefined, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') fail('VALIDATION', 'The entry is not valid.');
      out[k] = convert(v, k, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) fail('VALIDATION', 'A value in the entry is too long.');
  return value;
}

export function parseIntent(raw: unknown): Intent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('VALIDATION', 'Describe the entry.');
  const type = (raw as { type?: unknown }).type;
  if (typeof type !== 'string' || !CLIENT_INTENTS.has(type)) {
    fail('VALIDATION', 'This kind of entry cannot be recorded here.', { field: 'intent.type' });
  }
  return convert(raw, undefined, 0) as Intent;
}
