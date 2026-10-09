/**
 * Password hashing (BUILD_PROMPT N3, SECURITY.md): Argon2id in the PHC string format, never a recoverable value.
 * Parameters follow the OWASP Password Storage Cheat Sheet's first Argon2id option (19 MiB, 2 passes, 1 lane), which
 * keeps a sign-in cheap enough for a small server to resist floods of attempts (D-042). The parameters travel in the
 * stored string, so they can be raised later and old hashes still verify (and are re-hashed on the next sign-in).
 */
import { argon2id, argon2Verify } from 'hash-wasm';

export const ARGON2_PARAMS = { memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32 } as const;

/** Hashes a password into `$argon2id$v=19$m=…,t=…,p=…$salt$hash`. */
export function hashPassword(password: string): Promise<string> {
  return argon2id({
    password: password.normalize('NFC'),
    salt: crypto.getRandomValues(new Uint8Array(16)),
    ...ARGON2_PARAMS,
    outputType: 'encoded',
  });
}

/** Verifies a password against a stored PHC string; false for anything that is not a valid Argon2id hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('$argon2id$')) return false;
  try {
    return await argon2Verify({ password: password.normalize('NFC'), hash: stored });
  } catch {
    return false;
  }
}

/** True when a stored hash uses weaker parameters than today's, so the next successful sign-in re-hashes it. */
export function needsRehash(stored: string): boolean {
  const m = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$/.exec(stored);
  if (!m) return true;
  return Number(m[1]) < ARGON2_PARAMS.memorySize || Number(m[2]) < ARGON2_PARAMS.iterations;
}

/**
 * A fixed, valid hash of a random value. Checking a wrong or unknown username against it costs the same time as a
 * real check, so response time does not reveal which usernames exist.
 */
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(crypto.randomUUID());
  return dummy;
}
