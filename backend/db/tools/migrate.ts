/**
 * Applies pending migrations to a real database with the checksummed runner (D-027).
 *
 *   deno task db:migrate <ENV_KEY>          e.g. FINLY_SUPABASE_MIGRATOR_URL (read from backend/.env.local)
 *   deno task db:migrate <ENV_KEY> --check  only report what is applied and what is pending
 *
 * The connection URL never appears in output. Each migration runs in its own transaction; a changed applied file
 * or an unknown applied version stops the run before anything is written.
 */
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { openPostgres } from '../../src/db/postgres.ts';

const [envKey, flag] = Deno.args;
const url = envKey ? Deno.env.get(envKey) : undefined;
if (!envKey || !url) {
  console.error('Usage: deno task db:migrate <ENV_KEY> [--check]   (ENV_KEY must be set, e.g. in backend/.env.local)');
  Deno.exit(2);
}

const migrations = await loadMigrations(new URL('../migrations/', import.meta.url));
const { client, sql } = openPostgres(url, { max: 1, applicationName: 'finly-migrate' });
try {
  const [server] = await sql.query<{ version: string; db: string; who: string }>(
    `select current_setting('server_version') as version, current_database() as db, current_user as who`,
  );
  console.log(`Connected: PostgreSQL ${server.version}, database ${server.db}, as ${server.who}.`);
  if (flag === '--check') {
    const exists = await sql.query<{ ok: boolean }>(`select to_regclass('finly.schema_migration') is not null as ok`);
    const applied = exists[0].ok
      ? (await sql.query<{ version: string }>(`select version from finly.schema_migration order by version`))
        .map((r) => r.version)
      : [];
    const pending = migrations.filter((m) => !applied.includes(m.version)).map((m) => m.name);
    console.log(`Applied: ${applied.join(', ') || 'none'}. Pending: ${pending.join(', ') || 'none'}.`);
  } else {
    const started = performance.now();
    const done = await migrate(sql, migrations);
    const ms = Math.round(performance.now() - started);
    console.log(done.length ? `Applied ${done.join(', ')} in ${ms} ms.` : 'Nothing to apply; the database is current.');
  }
} finally {
  await client.end();
}
