/**
 * SCRAM-SHA-256 password verifiers in PostgreSQL's stored format (RFC 5802 / RFC 7677). A database login is created
 * from the verifier alone, so the password itself never has to pass through SQL, a dashboard, a log or a chat.
 */

const encoder = new TextEncoder();

function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function hmac(key: Uint8Array, message: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, encoder.encode(message)));
}

/**
 * Returns `SCRAM-SHA-256$<iterations>:<salt>$<StoredKey>:<ServerKey>`. Strength is the caller's job: logins use
 * `randomPassword()`.
 */
export async function scramVerifier(
  password: string,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16)),
  iterations = 4096,
): Promise<string> {
  // Printable ASCII only: SASLprep is then the identity, so this matches what PostgreSQL computes.
  if (!/^[\x21-\x7e]+$/.test(password)) throw new Error('Use a printable ASCII password.');
  if (iterations < 4096) throw new Error('At least 4096 iterations.');
  const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salted = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
      base,
      256,
    ),
  );
  const clientKey = await hmac(salted, 'Client Key');
  const storedKey = new Uint8Array(await crypto.subtle.digest('SHA-256', clientKey as BufferSource));
  const serverKey = await hmac(salted, 'Server Key');
  return `SCRAM-SHA-256$${iterations}:${base64(salt)}$${base64(storedKey)}:${base64(serverKey)}`;
}

/** A random URL-safe password with 256 bits of entropy (43 characters). */
export function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
