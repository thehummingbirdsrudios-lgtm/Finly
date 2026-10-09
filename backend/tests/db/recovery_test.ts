/**
 * Key-recovery and restore drill (gate response 03, Q2): encrypted data + an escrowed KEK survive pg_dump → drop →
 * pg_restore into a new database, on the real PostgreSQL 17. The KEK is held only in a separate "escrow" file, never
 * in the database or the dump. Real servers only (needs pg_dump / pg_restore). Runbook: docs/operations/key-recovery.md
 */
import { assertEquals, assertRejects } from '@std/assert';
import { Cipher, ctx } from '../../src/crypto/cipher.ts';
import { KeyRing, StaticKekSource } from '../../src/crypto/keys.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { openPostgres } from '../../src/db/postgres.ts';
import { testTarget } from './harness.ts';
import { dbWorld } from './world.ts';

const target = testTarget();
const binDir = Deno.env.get(target === 'pg18' ? 'FINLY_PG18_BIN' : 'FINLY_PG17_BIN') ??
  `C:\\Program Files\\PostgreSQL\\${target === 'pg18' ? 18 : 17}\\bin`;

function connection(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || '5432',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    db: u.pathname.slice(1),
  };
}

async function run(tool: string, args: string[], password: string): Promise<void> {
  const out = await new Deno.Command(`${binDir}\\${tool}`, { args, env: { PGPASSWORD: password }, stderr: 'piped' })
    .output();
  if (!out.success) throw new Error(`${tool} failed: ${new TextDecoder().decode(out.stderr).slice(0, 400)}`);
}

Deno.test({
  name: 'recovery drill: encrypted data and an escrowed key survive dump, loss of the database and restore',
  ignore: target === 'pglite',
  async fn() {
    const adminUrl = Deno.env.get(target === 'pg18' ? 'FINLY_PG18_ADMIN_URL' : 'FINLY_PG17_ADMIN_URL')!;
    const admin = connection(adminUrl);
    const work = await Deno.makeTempDir({ prefix: 'finly-drill-' });

    // 1. A KEK exists only in the escrow file (as the owner's offline copy would).
    const kek = crypto.getRandomValues(new Uint8Array(32));
    const escrow = `${work}/kek-escrow-v1.txt`;
    await Deno.writeTextFile(escrow, btoa(String.fromCharCode(...kek)));

    // 2. A migrated database with the example world and 200 encrypted amounts.
    const w = await dbWorld();
    const cipher = new Cipher(new KeyRing(new StaticKekSource(new Map([[1, kek]]), 1)));
    await w.db.exec(`create table public.recovery_probe (id text primary key, amount_enc bytea not null)`);
    const amounts = Array.from({ length: 200 }, (_, i) => BigInt((i + 1) * 1250));
    for (const [i, amount] of amounts.entries()) {
      await w.db.query(`insert into public.recovery_probe values ($1, $2)`, [
        `p${i}`,
        await cipher.encryptAmount(amount, ctx('recovery_probe', 'amount_enc', `p${i}`)),
      ]);
    }
    const sourceDb = (await w.db.query<{ db: string }>(`select current_database() as db`)).rows[0].db;
    const counts = async (db: { query: typeof w.db.query }) =>
      (await db.query<{ t: string; n: number }>(
        `select 'entity' as t, count(*)::int as n from finly.entity union all
         select 'ledger_account', count(*)::int from finly.ledger_account union all
         select 'recovery_probe', count(*)::int from public.recovery_probe order by 1`,
      )).rows;
    const before = await counts(w.db);
    await w.db.close();

    // 3. Back up, then lose the database entirely.
    const dump = `${work}/finly.dump`;
    await run(
      'pg_dump.exe',
      ['-h', admin.host, '-p', admin.port, '-U', admin.user, '-Fc', '-f', dump, sourceDb],
      admin.password,
    );
    const adminConn = openPostgres(adminUrl, { max: 1 });
    await adminConn.sql.exec(`drop database ${sourceDb} with (force)`);

    // 4. Restore into a brand-new database.
    const restored = `finly_t_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
    await adminConn.sql.exec(`create database ${restored}`);
    await adminConn.client.end();
    await run('pg_restore.exe', [
      '-h',
      admin.host,
      '-p',
      admin.port,
      '-U',
      admin.user,
      '-d',
      restored,
      '--exit-on-error',
      dump,
    ], admin.password);

    // 5. Recover the key from escrow only, and read every amount back.
    const recoveredKek = Uint8Array.from(atob(await Deno.readTextFile(escrow)), (c) => c.charCodeAt(0));
    const recovered = new Cipher(new KeyRing(new StaticKekSource(new Map([[1, recoveredKek]]), 1)));
    const db = openPostgres(adminUrl.replace(/\/[^/?]*(\?|$)/, `/${restored}$1`), { max: 1 });
    const rows = await db.sql.query<{ id: string; amount_enc: Uint8Array }>(
      `select id, amount_enc from public.recovery_probe order by length(id), id`,
    );
    const values = await Promise.all(
      rows.map((r) => recovered.decryptAmount(r.amount_enc, ctx('recovery_probe', 'amount_enc', r.id))),
    );
    assertEquals(values, amounts);
    const after = await db.sql.query<{ t: string; n: number }>(
      `select 'entity' as t, count(*)::int as n from finly.entity union all
       select 'ledger_account', count(*)::int from finly.ledger_account union all
       select 'recovery_probe', count(*)::int from public.recovery_probe order by 1`,
    );
    assertEquals(after, before, 'the schema and the books come back whole');

    // 6. Without the escrowed key, the restored amounts are unreadable — and the failure is loud, not a wrong number.
    const wrong = new Cipher(
      new KeyRing(new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1)),
    );
    const err = await assertRejects(
      () => wrong.decryptAmount(rows[0].amount_enc, ctx('recovery_probe', 'amount_enc', rows[0].id)),
      FinlyError,
    );
    assertEquals(err.code, 'INTEGRITY');
    await db.client.end();
    await Deno.remove(work, { recursive: true });
  },
});
