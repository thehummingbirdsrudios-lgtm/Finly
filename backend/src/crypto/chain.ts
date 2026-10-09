/**
 * Tamper-evident hash chains for journals and the audit log (AC7, U2). Each link is
 * HMAC-SHA-256(hash_chain key, previous hash ‖ canonical content). The key lives outside the database, so someone who
 * can write the database cannot re-forge the chain after editing a row. Content includes plaintext amounts, so
 * re-encrypting under a new key (rotation) never breaks the chain.
 */
import type { KeyRing } from './keys.ts';

const encoder = new TextEncoder();

/** Deterministic JSON: sorted keys, bigint as decimal strings, bytes as hex, undefined dropped. */
export function canonical(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (value instanceof Uint8Array) {
    return JSON.stringify([...value].map((b) => b.toString(16).padStart(2, '0')).join(''));
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export class HashChain {
  constructor(private readonly keys: KeyRing) {}

  /** The key version new links are made with (stored beside each link as `hash_key_version`). */
  activeVersion(): number {
    return this.keys.activeVersion();
  }

  async link(previous: Uint8Array, content: unknown, version = this.keys.activeVersion()): Promise<Uint8Array> {
    const key = await this.keys.hmacKey('hash_chain', version);
    const body = encoder.encode(canonical(content));
    const msg = new Uint8Array(previous.length + body.length);
    msg.set(previous);
    msg.set(body, previous.length);
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  }

  async verify(previous: Uint8Array, content: unknown, expected: Uint8Array, version: number): Promise<boolean> {
    const actual = await this.link(previous, content, version);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  }
}
