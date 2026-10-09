/**
 * Creates the credentials for a database login without the password ever being shown.
 *
 *   deno task db:login <role> <ENV_KEY> <host> <port> <user> [database]
 *
 * - generates a random 256-bit password;
 * - writes `ENV_KEY=postgresql://user:password@host:port/database?sslmode=require` into the git-ignored
 *   `backend/.env.local` (replacing an earlier line with the same key);
 * - prints only the SQL to run as the database owner, which carries a SCRAM-SHA-256 verifier, not the password.
 *
 * On Supabase's pooler the user is `<role>.<project ref>`.
 */
import { randomPassword, scramVerifier } from '../../src/db/scram.ts';

const ENV_FILE = new URL('../../.env.local', import.meta.url);
const [role, envKey, host, port, user, database = 'postgres'] = Deno.args;

if (!role || !envKey || !host || !port || !user) {
  console.error('Usage: deno task db:login <role> <ENV_KEY> <host> <port> <user> [database]');
  Deno.exit(2);
}
if (!/^[a-z_][a-z0-9_]*$/.test(role) || !/^[A-Z][A-Z0-9_]*$/.test(envKey)) {
  console.error('Role must be a lower-case identifier and ENV_KEY an upper-case variable name.');
  Deno.exit(2);
}

const password = randomPassword();
const verifier = await scramVerifier(password);
const url = `postgresql://${encodeURIComponent(user)}:${password}@${host}:${Number(port)}/${
  encodeURIComponent(database)
}?sslmode=require`;

let lines: string[] = [];
try {
  lines = (await Deno.readTextFile(ENV_FILE)).split(/\r?\n/);
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) throw e;
}
lines = lines.filter((l) => !l.startsWith(`${envKey}=`) && l !== '');
lines.push(`${envKey}=${url}`);
await Deno.writeTextFile(ENV_FILE, lines.join('\n') + '\n');

console.log(`Wrote ${envKey} to backend/.env.local (git-ignored). Run this as the database owner:\n`);
console.log(`alter role ${role} with login password '${verifier}';`);
