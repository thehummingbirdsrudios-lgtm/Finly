/**
 * Prints the catalog fingerprint (fingerprint.sql) of a database, or of a fresh database migrated from this checkout.
 *
 *   deno task db:fingerprint <ENV_KEY>             an existing database
 *   deno task db:fingerprint --fresh <ADMIN_KEY>   a throw-away database on that server, migrated, then dropped
 */
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { openPostgres } from '../../src/db/postgres.ts';

const query = await Deno.readTextFile(new URL('./fingerprint.sql', import.meta.url));
const fresh = Deno.args[0] === '--fresh';
const key = fresh ? Deno.args[1] : Deno.args[0];
const url = key ? Deno.env.get(key) : undefined;
if (!url) {
  console.error('Usage: deno task db:fingerprint <ENV_KEY> | --fresh <ADMIN_ENV_KEY>');
  Deno.exit(2);
}

async function fingerprint(target: string): Promise<unknown> {
  const { client, sql } = openPostgres(target, { max: 1, applicationName: 'finly-fingerprint' });
  try {
    const [catalog] = await sql.query<Record<string, unknown>>(query);
    const migrations = await sql.query<{ version: string; checksum: string }>(
      `select version, checksum from finly.schema_migration order by version`,
    );
    return { ...catalog, migrations: migrations.map((m) => `${m.version}:${m.checksum.slice(0, 12)}`) };
  } finally {
    await client.end();
  }
}

if (!fresh) {
  console.log(JSON.stringify(await fingerprint(url)));
} else {
  const name = `finly_t_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const admin = openPostgres(url, { max: 1, applicationName: 'finly-fingerprint' });
  await admin.sql.exec(`create database ${name}`);
  try {
    const target = new URL(url);
    target.pathname = `/${name}`;
    const db = openPostgres(target.toString(), { max: 1 });
    try {
      await migrate(db.sql, await loadMigrations(new URL('../migrations/', import.meta.url)));
    } finally {
      await db.client.end();
    }
    console.log(JSON.stringify(await fingerprint(target.toString())));
  } finally {
    await admin.sql.exec(`drop database if exists ${name} with (force)`);
    await admin.client.end();
  }
}
