/**
 * Authenticated encryption of amounts and sensitive text (AES-256-GCM, WebCrypto). Format v1:
 *
 *   byte 0      format (1)
 *   bytes 1–2   key version (uint16, big-endian)
 *   bytes 3–14  random 96-bit nonce
 *   bytes 15–   ciphertext ‖ 128-bit tag
 *
 * The associated data binds the header and a caller-chosen context (`table.column:row-id`), so a ciphertext cannot be
 * moved to another row or column, and its key version cannot be altered, without failing authentication. Amounts are a
 * fixed-width signed 64-bit integer, so the ciphertext length never reveals magnitude. Any failure raises INTEGRITY —
 * a value is never guessed, defaulted or skipped.
 */
import { fail } from '../domain/errors.ts';
import type { KeyRing } from './keys.ts';

const FORMAT = 1;
const HEADER = 3;
const NONCE = 12;
const TAG = 16;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function aad(header: Uint8Array, context: string): Uint8Array {
  const ctx = encoder.encode(`finly:v1:${context}`);
  const out = new Uint8Array(header.length + ctx.length);
  out.set(header);
  out.set(ctx, header.length);
  return out;
}

/** The key version a ciphertext was written with (to find rows needing re-encryption). */
export function keyVersionOf(ciphertext: Uint8Array): number {
  if (ciphertext.length < HEADER + NONCE + TAG || ciphertext[0] !== FORMAT) {
    fail('INTEGRITY', 'A stored value is not in a recognised encrypted format.');
  }
  return (ciphertext[1] << 8) | ciphertext[2];
}

export class Cipher {
  constructor(private readonly keys: KeyRing) {}

  async encryptBytes(plain: Uint8Array, context: string, version = this.keys.activeVersion()): Promise<Uint8Array> {
    if (version < 1 || version > 0xffff) fail('INTERNAL', 'Invalid key version.');
    const header = Uint8Array.of(FORMAT, version >> 8, version & 0xff);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE));
    const key = await this.keys.aesKey('data', version);
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: nonce as BufferSource,
          additionalData: aad(header, context) as BufferSource,
          tagLength: 128,
        },
        key,
        plain as BufferSource,
      ),
    );
    const out = new Uint8Array(HEADER + NONCE + sealed.length);
    out.set(header);
    out.set(nonce, HEADER);
    out.set(sealed, HEADER + NONCE);
    return out;
  }

  async decryptBytes(ciphertext: Uint8Array, context: string): Promise<Uint8Array> {
    const version = keyVersionOf(ciphertext);
    const header = ciphertext.subarray(0, HEADER);
    const nonce = ciphertext.subarray(HEADER, HEADER + NONCE);
    const key = await this.keys.aesKey('data', version);
    try {
      return new Uint8Array(
        await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: nonce as BufferSource,
            additionalData: aad(header, context) as BufferSource,
            tagLength: 128,
          },
          key,
          ciphertext.subarray(HEADER + NONCE) as BufferSource,
        ),
      );
    } catch {
      // Wrong key, wrong row, or altered bytes: the operation stops; nothing is shown or posted.
      return fail('INTEGRITY', 'A stored value failed its integrity check.', { context: context.split(':')[0] });
    }
  }

  /** Encrypts a signed whole-rupee amount (balances may be negative; line amounts are always positive). */
  encryptAmount(value: bigint, context: string, version?: number): Promise<Uint8Array> {
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigInt64(0, value);
    return this.encryptBytes(buf, context, version);
  }

  async decryptAmount(ciphertext: Uint8Array, context: string): Promise<bigint> {
    const plain = await this.decryptBytes(ciphertext, context);
    if (plain.length !== 8) fail('INTEGRITY', 'A stored amount has the wrong length.');
    return new DataView(plain.buffer, plain.byteOffset, 8).getBigInt64(0);
  }

  encryptText(value: string, context: string, version?: number): Promise<Uint8Array> {
    return this.encryptBytes(encoder.encode(value), context, version);
  }

  async decryptText(ciphertext: Uint8Array, context: string): Promise<string> {
    try {
      return decoder.decode(await this.decryptBytes(ciphertext, context));
    } catch (e) {
      if ((e as { code?: string }).code === 'INTEGRITY') throw e;
      return fail('INTEGRITY', 'A stored text value is not valid UTF-8.');
    }
  }

  /** Re-encrypts under the active key version (key rotation). Decrypts first, so a bad value is never carried forward. */
  async reencrypt(ciphertext: Uint8Array, context: string): Promise<Uint8Array> {
    return this.encryptBytes(await this.decryptBytes(ciphertext, context), context);
  }
}

/** The associated-data context for a column of a row: `table.column:row-id`. */
export function ctx(table: string, column: string, rowId: string): string {
  return `${table}.${column}:${rowId}`;
}
