/**
 * Session tokens (SECURITY.md "Spoofing"): short-lived signed access tokens and opaque rotating refresh tokens.
 *
 * Access token: a compact JWS (HS256) carrying only ids and a few flags, signed with a key derived from the active KEK
 * (purpose `session`); the key version is the `kid`. It is never trusted alone — every request also checks that its
 * session is still live, so sign-out and revocation take effect at once.
 * Refresh token: 256 random bits shown to the client once; the database keeps only a keyed hash of it.
 */
import type { KeyRing } from './keys.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface AccessClaims {
  /** User id. */
  sub: string;
  /** Session id. */
  sid: string;
  /** Device id. */
  did: string;
  /** True while the user must replace a temporary password; only the password change is allowed. */
  pwd?: boolean;
  iat: number;
  exp: number;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromB64url(text: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return undefined;
  try {
    const bin = atob(text.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (text.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

export class TokenSigner {
  constructor(private readonly keys: KeyRing) {}

  async sign(claims: AccessClaims): Promise<string> {
    const kid = this.keys.activeVersion();
    const header = b64url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: String(kid) })));
    const payload = b64url(encoder.encode(JSON.stringify(claims)));
    const key = await this.keys.hmacKey('session', kid);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`)));
    return `${header}.${payload}.${b64url(mac)}`;
  }

  /**
   * The claims of a valid, unexpired token signed by one of our keys, or undefined. Only HS256 with a known `kid` is
   * accepted (no `alg: none`, no algorithm confusion); `now` is seconds since the epoch.
   */
  async verify(token: string, now: number): Promise<AccessClaims | undefined> {
    const parts = token.split('.');
    if (parts.length !== 3 || token.length > 2048) return undefined;
    const [h, p, s] = parts;
    const headerBytes = fromB64url(h);
    const payloadBytes = fromB64url(p);
    const mac = fromB64url(s);
    if (!headerBytes || !payloadBytes || !mac) return undefined;
    let header: { alg?: unknown; kid?: unknown };
    let claims: AccessClaims;
    try {
      header = JSON.parse(decoder.decode(headerBytes));
      claims = JSON.parse(decoder.decode(payloadBytes));
    } catch {
      return undefined;
    }
    const kid = Number(header.kid);
    if (header.alg !== 'HS256' || !Number.isInteger(kid) || kid < 1) return undefined;
    let key: CryptoKey;
    try {
      key = await this.keys.hmacKey('session', kid);
    } catch {
      return undefined;
    }
    const ok = await crypto.subtle.verify('HMAC', key, mac as BufferSource, encoder.encode(`${h}.${p}`));
    if (!ok) return undefined;
    if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string' || typeof claims.did !== 'string') {
      return undefined;
    }
    if (typeof claims.exp !== 'number' || claims.exp <= now) return undefined;
    return claims;
  }

  /** A new refresh token: 32 random bytes, base64url. */
  newRefreshToken(): string {
    return b64url(crypto.getRandomValues(new Uint8Array(32)));
  }

  /**
   * What is stored for a refresh token: SHA-256 of its 256 random bits (never the token itself). No key is needed —
   * a random 256-bit value cannot be guessed from its hash — so key rotation never signs anyone out.
   */
  async refreshHash(token: string): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(`refresh:${token}`)));
  }

  /** A keyed hash of a username for failed sign-ins of unknown accounts (security_event.username_hash). */
  async usernameHash(username: string): Promise<Uint8Array> {
    const key = await this.keys.hmacKey('session', this.keys.activeVersion());
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`user:${username.toLowerCase()}`)))
      .slice(0, 16);
  }
}
