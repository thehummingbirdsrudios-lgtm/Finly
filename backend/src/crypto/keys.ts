/**
 * Key management (D-026; docs/security/encryption-architecture.md). The database never holds key material: every key
 * is derived with HKDF-SHA-256 from a versioned key-encryption key (KEK) held outside the database — the function
 * secret store in production, `.env.local` in development. Derived keys are non-extractable WebCrypto keys.
 */
import { fail } from '../domain/errors.ts';

export type KeyPurpose = 'data' | 'blind_index' | 'hash_chain' | 'file' | 'mpin_pepper';

/** Supplies KEK bytes by version. Implementations: environment/secret store now, a cloud KMS later. */
export interface KekSource {
  /** The version new data is written with. */
  activeVersion(): number;
  /** Raw 32-byte KEK for a version, or undefined when that version is not available (retired or missing). */
  kek(version: number): Uint8Array | undefined;
}

const SALT = new TextEncoder().encode('finly/hkdf/salt/v1');

function base64Decode(text: string): Uint8Array {
  const bin = atob(text.trim());
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/**
 * Reads `FINLY_KEK_ACTIVE` and `FINLY_KEK_V<n>` (base64, 32 bytes each) from the environment. Old versions stay
 * configured while any data or backup still needs them (decrypt-only).
 */
export class EnvKekSource implements KekSource {
  private readonly keks = new Map<number, Uint8Array>();
  private readonly active: number;

  constructor(env: { get(name: string): string | undefined } = Deno.env) {
    const active = Number(env.get('FINLY_KEK_ACTIVE') ?? 'NaN');
    if (!Number.isInteger(active) || active < 1) fail('INTERNAL', 'Encryption is not configured.');
    for (let v = 1; v <= active; v++) {
      const raw = env.get(`FINLY_KEK_V${v}`);
      if (!raw) continue;
      const bytes = base64Decode(raw);
      if (bytes.length !== 32) fail('INTERNAL', 'Encryption is misconfigured.');
      this.keks.set(v, bytes);
    }
    if (!this.keks.has(active)) fail('INTERNAL', 'Encryption is misconfigured.');
    this.active = active;
  }

  activeVersion(): number {
    return this.active;
  }

  kek(version: number): Uint8Array | undefined {
    return this.keks.get(version);
  }
}

/** A fixed in-memory source, for tests and tools. */
export class StaticKekSource implements KekSource {
  constructor(private readonly keks: Map<number, Uint8Array>, private readonly active: number) {}
  activeVersion(): number {
    return this.active;
  }
  kek(version: number): Uint8Array | undefined {
    return this.keks.get(version);
  }
}

/** Derives and caches purpose keys. One instance per process; keys never leave WebCrypto. */
export class KeyRing {
  private readonly cache = new Map<string, Promise<CryptoKey>>();

  constructor(private readonly source: KekSource) {}

  activeVersion(): number {
    return this.source.activeVersion();
  }

  /** AES-256-GCM key for `data` or `file`. */
  aesKey(purpose: 'data' | 'file', version: number): Promise<CryptoKey> {
    return this.derive(purpose, version, { name: 'AES-GCM', length: 256 }, ['encrypt', 'decrypt']);
  }

  /** HMAC-SHA-256 key for blind indexes, hash chains and the M-PIN pepper. */
  hmacKey(purpose: 'blind_index' | 'hash_chain' | 'mpin_pepper', version: number): Promise<CryptoKey> {
    return this.derive(purpose, version, { name: 'HMAC', hash: 'SHA-256', length: 256 }, ['sign', 'verify']);
  }

  private derive(
    purpose: KeyPurpose,
    version: number,
    algorithm: AesKeyGenParams | HmacKeyGenParams,
    usages: KeyUsage[],
  ): Promise<CryptoKey> {
    const id = `${purpose}/${version}`;
    let key = this.cache.get(id);
    if (!key) {
      key = (async () => {
        const kek = this.source.kek(version);
        // A missing key version is never papered over: the caller's operation fails as a whole.
        if (!kek) fail('INTEGRITY', 'A stored value uses a key version that is not available.', { version, purpose });
        const base = await crypto.subtle.importKey('raw', kek as BufferSource, 'HKDF', false, ['deriveKey']);
        return crypto.subtle.deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: SALT, info: new TextEncoder().encode(`finly/${id}`) },
          base,
          algorithm,
          false,
          usages,
        );
      })();
      this.cache.set(id, key);
      key.catch(() => this.cache.delete(id));
    }
    return key;
  }
}
