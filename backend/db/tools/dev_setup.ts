/**
 * A local development database for running the real API against (never production):
 *
 *   deno task dev:setup
 *
 * - creates the database `finly_dev` on the server named by FINLY_PG17_ADMIN_URL (backend/.env.local) if missing;
 * - runs the platform and API-login bootstraps and every migration;
 * - gives `finly_app` a fresh random password (as a SCRAM verifier — the password is never printed);
 * - writes backend/.env.dev.local (git-ignored): FINLY_DATABASE_URL as `finly_app`, a development KEK (kept across
 *   runs, so encrypted data stays readable), and PORT.
 */
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { openPostgres } from '../../src/db/postgres.ts';
import { randomPassword, scramVerifier } from '../../src/db/scram.ts';

const admin = Deno.env.get('FINLY_PG17_ADMIN_URL');
if (!admin) {
  console.error('FINLY_PG17_ADMIN_URL is not set in backend/.env.local');
  Deno.exit(2);
}
const DEV_DB = 'finly_dev';
const ENV_FILE = new URL('../../.env.dev.local', import.meta.url);

const root = openPostgres(admin, { max: 1, applicationName: 'finly-dev-setup' });
const [exists] = await root.sql.query<{ n: number }>(`select count(*)::int as n from pg_database where datname = $1`, [
  DEV_DB,
]);
if (exists.n === 0) await root.sql.exec(`create database ${DEV_DB}`);
await root.client.end();

const devUrl = admin.replace(/\/[^/?]*(\?|$)/, `/${DEV_DB}$1`);
const dev = openPostgres(devUrl, { max: 1, applicationName: 'finly-dev-setup' });
try {
  await dev.sql.exec(await Deno.readTextFile(new URL('../bootstrap/platform_roles.sql', import.meta.url)));
  const applied = await migrate(dev.sql, await loadMigrations(new URL('../migrations/', import.meta.url)));
  await dev.sql.exec(await Deno.readTextFile(new URL('../bootstrap/api_login.sql', import.meta.url)));
  const password = randomPassword();
  await dev.sql.exec(`alter role finly_app with login password '${await scramVerifier(password)}'`);

  let kek = '';
  try {
    kek = (await Deno.readTextFile(ENV_FILE)).match(/^FINLY_KEK_V1=(.+)$/m)?.[1] ?? '';
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
  if (!kek) kek = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const u = new URL(devUrl);
  const appUrl = `postgresql://finly_app:${password}@${u.hostname}:${u.port || '5432'}/${DEV_DB}`;
  await Deno.writeTextFile(
    ENV_FILE,
    [
      '# Local development only (deno task dev:setup). Never reuse these values anywhere else.',
      `FINLY_DATABASE_URL=${appUrl}`,
      'FINLY_KEK_ACTIVE=1',
      `FINLY_KEK_V1=${kek}`,
      'PORT=8787',
      '',
    ].join('\n'),
  );
  console.log(JSON.stringify({ database: DEV_DB, migrationsApplied: applied, env: 'backend/.env.dev.local' }));
} finally {
  await dev.client.end();
}
