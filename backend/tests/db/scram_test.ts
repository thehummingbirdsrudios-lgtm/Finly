/**
 * SCRAM verifiers: the RFC 7677 example exchange, and a real login on PostgreSQL with a verifier made here
 * (real servers only — logins are server-wide, so the test role is dropped afterwards).
 */
import { assertEquals, assertMatch } from '@std/assert';
import { randomPassword, scramVerifier } from '../../src/db/scram.ts';
import { openPostgres } from '../../src/db/postgres.ts';
import { testTarget } from './harness.ts';

const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));

async function hmac(key: Uint8Array, text: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text)));
}

Deno.test('the verifier matches the RFC 7677 example exchange (StoredKey and ServerKey)', async () => {
  const verifier = await scramVerifier('pencil', fromBase64('W22ZaJ0SNY7soEsUEjb6gQ=='), 4096);
  const [, keys] = verifier.split('$').slice(1);
  const [storedKey, serverKey] = keys.split(':').map(fromBase64);
  const nonce = 'rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0';
  const authMessage = `n=user,r=rOprNGfwEbeRWgbNEkqO,r=${nonce},s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096,c=biws,r=${nonce}`;
  // The server checks a client proof exactly like this: ClientKey = proof XOR HMAC(StoredKey, AuthMessage).
  const proof = fromBase64('dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=');
  const signature = await hmac(storedKey, authMessage);
  const clientKey = proof.map((b, i) => b ^ signature[i]);
  assertEquals(new Uint8Array(await crypto.subtle.digest('SHA-256', clientKey as BufferSource)), storedKey);
  assertEquals(toBase64(await hmac(serverKey, authMessage)), '6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=');
});

Deno.test('random passwords are 43 URL-safe characters and never repeat', () => {
  const a = randomPassword();
  assertMatch(a, /^[A-Za-z0-9_-]{43}$/);
  assertEquals(a === randomPassword(), false);
});

const target = testTarget();
Deno.test({
  name: 'PostgreSQL accepts a login created from the verifier alone',
  ignore: target === 'pglite',
  async fn() {
    const adminUrl = Deno.env.get(target === 'pg18' ? 'FINLY_PG18_ADMIN_URL' : 'FINLY_PG17_ADMIN_URL')!;
    const role = `finly_t_login_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const password = randomPassword();
    const admin = openPostgres(adminUrl, { max: 1 });
    try {
      await admin.sql.exec(`create role ${role} login password '${await scramVerifier(password)}'`);
      const url = new URL(adminUrl);
      url.username = role;
      url.password = password;
      url.pathname = '/postgres';
      const user = openPostgres(url.toString(), { max: 1 });
      try {
        const [me] = await user.sql.query<{ who: string }>('select current_user as who');
        assertEquals(me.who, role);
      } finally {
        await user.client.end();
      }
    } finally {
      await admin.sql.exec(`drop role if exists ${role}`);
      await admin.client.end();
    }
  },
});
