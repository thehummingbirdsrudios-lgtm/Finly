/**
 * Keyed blind indexes over encrypted values (05 §5.7): exact-amount search, amount bands for range filters, and
 * phone or account-number lookup. HMAC-SHA-256 truncated to 16 bytes; amount indexes are keyed per environment, so
 * equal amounts in different environments do not share an index value.
 */
import type { KeyRing } from './keys.ts';

const encoder = new TextEncoder();

/** Band boundaries in whole rupees (lower bounds). The last band is open-ended. */
export const AMOUNT_BANDS: readonly bigint[] = [
  0n,
  1_000n,
  5_000n,
  10_000n,
  25_000n,
  50_000n,
  1_00_000n,
  5_00_000n,
  10_00_000n,
  1_00_00_000n,
];

export function bandOf(amount: bigint): number {
  const a = amount < 0n ? -amount : amount;
  let band = 0;
  for (let i = 0; i < AMOUNT_BANDS.length; i++) if (a >= AMOUNT_BANDS[i]) band = i;
  return band;
}

/** Bands that overlap the inclusive range [min, max] (both whole rupees). */
export function bandsFor(min: bigint, max: bigint): number[] {
  const from = bandOf(min);
  const to = bandOf(max);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export class BlindIndex {
  constructor(private readonly keys: KeyRing) {}

  private async mac(text: string, version = this.keys.activeVersion()): Promise<Uint8Array> {
    const key = await this.keys.hmacKey('blind_index', version);
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text))).slice(0, 16);
  }

  amount(envId: string, amount: bigint): Promise<Uint8Array> {
    return this.mac(`amount:${envId}:${amount}`);
  }

  band(envId: string, band: number): Promise<Uint8Array> {
    return this.mac(`band:${envId}:${band}`);
  }

  amountBand(envId: string, amount: bigint): Promise<Uint8Array> {
    return this.band(envId, bandOf(amount));
  }

  /** Normalised Indian mobile number (last 10 digits) — for recipient lookup and duplicate detection. */
  phone(phone: string): Promise<Uint8Array> {
    return this.mac(`phone:${phone.replace(/\D/g, '').slice(-10)}`);
  }

  accountNumber(accountNumber: string): Promise<Uint8Array> {
    return this.mac(`account:${accountNumber.replace(/\s/g, '').toUpperCase()}`);
  }

  /** A keyed hash of an attempted username (security events never store a failed attempt in plaintext). */
  username(username: string): Promise<Uint8Array> {
    return this.mac(`username:${username.trim().toLowerCase()}`);
  }
}
