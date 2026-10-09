/**
 * Checks a deployed `finly_app` login through the pooler: it connects, reads nothing on its own, can enter
 * `finly_api`, and cannot enter `finly_owner`. Prints only those facts, never the URL.
 *
 *   deno task db:app-check [ENV_KEY]   (default FINLY_SUPABASE_APP_URL in backend/.env.local)
 */
import { openPostgres } from '../../src/db/postgres.ts';

const envKey = Deno.args[0] ?? 'FINLY_SUPABASE_APP_URL';
const url = Deno.env.get(envKey);
if (!url) {
  console.error(`${envKey} is not set in backend/.env.local`);
  Deno.exit(2);
}
const { client, sql } = openPostgres(url, { max: 1, prepare: false, applicationName: 'finly-app-check' });
const out: Record<string, unknown> = {};
try {
  const [me] = await sql.query<{ u: string; v: string }>(
    `select current_user as u, current_setting('server_version') as v`,
  );
  out.connectedAs = me.u;
  out.server = me.v;
  try {
    await sql.query(`select count(*) from finly.entity`);
    out.readsAlone = true;
  } catch (e) {
    out.readsAlone = (e as { code?: string }).code !== '42501';
  }
  out.asApi = await sql.transaction(async (tx) => {
    await tx.exec('set local role finly_api');
    const [r] = await tx.query<{ n: number }>(`select count(*)::int as n from finly.entity`);
    return { rowsVisibleWithoutActor: r.n };
  });
  try {
    await sql.transaction(async (tx) => {
      await tx.exec('set local role finly_owner');
    });
    out.canBecomeOwner = true;
  } catch {
    out.canBecomeOwner = false;
  }
} finally {
  await client.end();
}
console.log(JSON.stringify(out));
