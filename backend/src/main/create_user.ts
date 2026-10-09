/**
 * One-time creation of an account (the first Super Admin, add-ons 06/07; later accounts are created by administrators
 * in the app). The temporary password is generated here and written only to a git-ignored file for the person who
 * runs this command — it is never printed, logged or sent anywhere. The person must replace it at first sign-in.
 *
 *   deno task user:create <ENV_KEY> <username> "<Display name>" [role ...]
 *
 * ENV_KEY names the database URL in backend/.env.local (a login that may act as finly_auth).
 */
import { EnvKekSource } from '../crypto/keys.ts';
import { openPostgres } from '../db/postgres.ts';
import { compose } from './compose.ts';

const [envKey, username, displayName, ...roles] = Deno.args;
if (!envKey || !username || !displayName) {
  console.error('Usage: deno task user:create <ENV_KEY> <username> "<Display name>" [role ...]');
  Deno.exit(2);
}
const url = Deno.env.get(envKey);
if (!url) {
  console.error(`${envKey} is not set in backend/.env.local`);
  Deno.exit(2);
}

/** 20 characters from an unambiguous alphabet: about 103 bits of randomness. */
function temporaryPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

const { client, sql } = openPostgres(url, { max: 1, applicationName: 'finly-create-user' });
try {
  const services = compose(sql, new EnvKekSource());
  const password = temporaryPassword();
  const created = await services.identity.createUser({
    username,
    displayName,
    temporaryPassword: password,
    roleKeys: roles,
    temporaryDays: 7,
  });
  const file = new URL('../../.first-login.txt', import.meta.url);
  await Deno.writeTextFile(
    file,
    `Finly first sign-in\nusername: ${username}\ntemporary password: ${password}\n` +
      'Valid for 7 days. Finly asks for a new password at the first sign-in. Delete this file afterwards.\n',
    { mode: 0o600 },
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
