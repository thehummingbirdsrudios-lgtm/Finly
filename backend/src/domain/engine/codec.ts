/**
 * Intents as text and back, exactly: amounts are `bigint` paise and survive as `{"$paise":"500000"}`, never as JSON
 * numbers (which would lose precision above 2^53). Used to store the request an event was created from
 * (txn.intent_enc). Requests stored before D-045 tagged whole rupees as `{"$rupees":"5000"}`; they read as paise.
 */
import { fail } from '../errors.ts';
import type { Intent } from './intents.ts';

const TAG = '$paise';
const LEGACY_RUPEES = '$rupees';

export function encodeIntent(intent: Intent): string {
  return JSON.stringify(intent, (_key, value) => (typeof value === 'bigint' ? { [TAG]: value.toString() } : value));
}

export function decodeIntent(text: string): Intent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text, (_key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && (TAG in value || LEGACY_RUPEES in value)) {
        const legacy = !(TAG in value);
        const digits = (value as Record<string, unknown>)[legacy ? LEGACY_RUPEES : TAG];
        if (typeof digits !== 'string' || !/^-?[0-9]{1,19}$/.test(digits)) {
          fail('INTEGRITY', 'A stored amount is malformed.');
        }
        return legacy ? BigInt(digits) * 100n : BigInt(digits);
      }
      return value;
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'INTEGRITY') throw e;
    return fail('INTEGRITY', 'A stored request could not be read.');
  }
  if (!parsed || typeof parsed !== 'object' || typeof (parsed as { type?: unknown }).type !== 'string') {
    return fail('INTEGRITY', 'A stored request has no type.');
  }
  return parsed as Intent;
}
