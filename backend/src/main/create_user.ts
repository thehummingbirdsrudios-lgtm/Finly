/**
 * One-time creation of an account (the first Super Admin, add-ons 06/07; later accounts are created by administrators
 * in the app). The temporary password is generated here and written only to a git-ignored file for the person who
 * runs this command — it is never printed, logged or sent anywhere. The person must replace it at first sign-in.
 *
 *   deno task user:create <ENV_KEY> <username> "<Display name>" [role ...]
 *
 * ENV_KEY names the database URL in backend/.env.local (a login that may act as finly_auth).
 */
import { IdentityService } from '../app/identity/service.ts';
import { BlindIndex } from '../crypto/blind.ts';
import { type KekSource, KeyRing } from '../crypto/keys.ts';
import { TokenSigner } from '../crypto/token.ts';
import { openPostgres } from '../db/postgres.ts';

/** Creating an account encrypts nothing, so no key-encryption key is needed (or loaded) on this computer. */
const noKeys: KekSource = {
  activeVersion: () => {
    throw new Error('Encryption keys are not available to the account-creation tool.');
  },
  kek: () => undefined,
};

const [envKey, username, displayName, ...roles] = Deno.args;
if (!envKey || !username || !displayName) {
  console.error('Usage: deno task user:create <ENV_KEY> <username> "<Display name>" [role ...]');
  Deno.exit(2);
}
// The local development database (deno task dev:setup) lives on the PostgreSQL 17 server of FINLY_PG17_ADMIN_URL.
const url = Deno.env.get(envKey) ??
  (envKey === 'FINLY_DEV_ADMIN_URL'
    ? Deno.env.get('FINLY_PG17_ADMIN_URL')?.replace(/\/[^/?]*(\?|$)/, '/finly_dev$1')
    : undefined);
if (!url) {
  console.error(`${envKey} is not set in backend/.env.local`);
  Deno.exit(2);
}

/** 20 characters from an unambiguous 55-letter alphabet (about 115 bits), drawn without modulo bias. */
function temporaryPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const limit = 256 - (256 % alphabet.length);
  let out = '';
  while (out.length < 20) {
    for (const b of crypto.getRandomValues(new Uint8Array(32))) {
      if (b < limit && out.length < 20) out += alphabet[b % alphabet.length];
    }
  }
  return out;
}

const { client, sql } = openPostgres(url, { max: 1, applicationName: 'finly-create-user' });
try {
  const ring = new KeyRing(noKeys);
  const identity = new IdentityService(sql, new TokenSigner(ring), new BlindIndex(ring));
  const password = temporaryPassword();
  const created = await identity.createUser({
    username,
    displayName,
    temporaryPassword: password,
    roleKeys: roles,
    temporaryDays: 7,
  });
  const file = new URL('../../.first-login.txt', import.meta.url);
  await Deno.writeTextFile(
    file,
    `Finly first sign-in — ${displayName}\nusername: ${username}\ntemporary password: ${password}\n` +
      'Valid for 7 days. Finly asks for a new password at the first sign-in. Delete this file afterwards.\n\n',
    { mode: 0o600, append: true },
  );
  console.log(JSON.stringify({
    created: true,
    userId: created.userId,
    roles,
    temporaryPasswordFile: 'backend/.first-login.txt (git-ignored)',
  }));
} finally {
  await client.end();
}
