/**
 * Drops the disposable finly_t_* databases the server-backed tests create. Usage:
 *   deno run --env-file=.env.local --allow-env --allow-net db/tools/drop_test_databases.ts pg17
 */
import { openPostgres } from '../../src/db/postgres.ts';

const target = Deno.args[0] === 'pg18' ? 'FINLY_PG18_ADMIN_URL' : 'FINLY_PG17_ADMIN_URL';
const url = Deno.env.get(target);
if (!url) {
  console.error(`${target} is not set`);
  Deno.exit(1);
}
const { client, sql } = openPostgres(url, { max: 1, applicationName: 'finly-test-cleanup' });
const dbs = await sql.query<{ datname: string }>(`select datname from pg_database where datname like 'finly\_t\_%'`);
for (const { datname } of dbs) {
  if (!/^finly_t_[0-9a-f]{16}$/.test(datname)) continue;
  await sql.exec(`drop database if exists ${datname} with (force)`);
}
console.log(`Dropped ${dbs.length} test database(s) on ${target.slice(6, 10)}.`);
await client.end();
