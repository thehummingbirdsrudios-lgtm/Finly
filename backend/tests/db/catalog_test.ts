/**
 * The schema as a whole: security posture of every table, and parity with the design document and the engine, so
 * neither can drift silently (docs/database/README review checklist; add-on 11 item 29).
 */
import { assertEquals } from '@std/assert';
import { ACCOUNT_TEMPLATE, CATEGORY_TEMPLATE } from '../../src/domain/ledger/coa.ts';
import { JOURNAL_KINDS, OPEN_ITEM_KINDS, ROLE_REQUIRES, SETTLEMENT_KINDS } from '../../src/domain/ledger/types.ts';
import { DICTIONARY_FILE, renderDictionary } from '../../db/tools/dictionary.ts';
import { migratedDb } from './harness.ts';

const db = await migratedDb();
const rows = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;
const tables = (await rows<{ name: string }>(
  `select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'finly' and c.relkind = 'r' order by 1`,
)).map((r) => r.name);

/** Values listed in a CHECK (column in (...)) constraint. */
async function checkValues(table: string, column: string): Promise<string[]> {
  const defs = await rows<{ def: string }>(
    `select pg_get_constraintdef(oid) as def from pg_constraint
     where conrelid = ('finly.' || $1)::regclass and contype = 'c'`,
    [table],
  );
  // The list CHECK is the one naming the most values (a column may also appear in other, rule-like CHECKs).
  const def = defs.map((d) => d.def)
    .filter((d) => d.includes(`(${column} = ANY`) || d.includes(`((${column} = ANY`))
    .sort((a, b) => b.length - a.length)[0];
  if (!def) throw new Error(`no CHECK on ${table}.${column}`);
  return [...def.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1]).sort();
}

Deno.test('every table has row-level security enabled', async () => {
  const off = await rows<{ relname: string }>(
    `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'finly' and c.relkind = 'r' and not c.relrowsecurity`,
  );
  assertEquals(off, []);
});

Deno.test('every table is documented with a comment', async () => {
  const missing = await rows<{ relname: string }>(
    `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'finly' and c.relkind = 'r' and obj_description(c.oid, 'pg_class') is null
       and c.relname <> 'schema_migration'`,
  );
  assertEquals(missing, []);
});

Deno.test('every table except the migration log has at least one policy (no table is reachable by accident)', async () => {
  const bare = await rows<{ relname: string }>(
    `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'finly' and c.relkind = 'r' and c.relname <> 'schema_migration'
       and not exists (select 1 from pg_policies p where p.schemaname = 'finly' and p.tablename = c.relname)`,
  );
  assertEquals(bare, []);
});

Deno.test("nothing is granted to PUBLIC; credentials are out of the API role's reach", async () => {
  const pub = await rows(
    `select table_name from information_schema.role_table_grants where table_schema = 'finly' and grantee = 'PUBLIC'`,
  );
  assertEquals(pub, []);
  const creds = await rows(
    `select table_name, privilege_type from information_schema.role_table_grants
     where table_schema = 'finly' and grantee = 'finly_api'
       and table_name in ('user_credential', 'mfa_factor', 'recovery_code', 'unlock_credential', 'refresh_token',
                          'auth_session', 'device', 'app_user')`,
  );
  assertEquals(creds, []);
});

Deno.test('the API role may delete only its own draft legs and tags; nobody may delete or truncate history', async () => {
  const deletes = await rows<{ grantee: string; table_name: string }>(
    `select grantee, table_name from information_schema.role_table_grants
     where table_schema = 'finly' and privilege_type in ('DELETE', 'TRUNCATE') and grantee like 'finly_%'
       and grantee <> 'finly_owner' order by 1, 2`,
  );
  assertEquals(deletes, [
    { grantee: 'finly_api', table_name: 'txn_leg' },
    { grantee: 'finly_api', table_name: 'txn_tag' },
    { grantee: 'finly_system', table_name: 'idempotency_record' },
  ]);
});

Deno.test('every table of the design document exists, and nothing else does', async () => {
  const doc = await Deno.readTextFile(new URL('../../../docs/database/03-schema.md', import.meta.url));
  const listed = [...doc.matchAll(/^\| \d+ \| `([a-z_]+)` \|/gm)].map((m) => m[1]).sort();
  assertEquals(tables.filter((t) => !listed.includes(t)), [], 'tables missing from docs/database/03-schema.md');
  assertEquals(listed.filter((t) => !tables.includes(t)), [], 'documented tables missing from the migrations');
});

Deno.test('the chart-of-accounts and category seeds equal the engine templates', async () => {
  const seeded = await rows<{ entity_kind: string; code: string; class: string; role: string }>(
    `select entity_kind, code, class, role from finly.coa_template_account order by entity_kind, code`,
  );
  const expected = ACCOUNT_TEMPLATE.flatMap((t) =>
    t.kinds.filter((k) => k !== 'party').map((k) => ({ entity_kind: k, code: t.code, class: t.cls, role: t.role }))
  ).sort((a, b) => a.entity_kind.localeCompare(b.entity_kind) || a.code.localeCompare(b.code));
  assertEquals(seeded, expected);
  const cats = await rows(`select key, kind, account_code as "accountCode", name from finly.category order by key`);
  assertEquals(
    cats,
    [...CATEGORY_TEMPLATE].sort((a, b) => a.key.localeCompare(b.key)).map((c) => ({
      key: c.key,
      kind: c.kind,
      accountCode: c.accountCode,
      name: c.name,
    })),
  );
});

Deno.test("database kind lists equal the engine's (journal kinds, open items, settlements, account roles)", async () => {
  assertEquals(await checkValues('journal', 'kind'), [...JOURNAL_KINDS].sort());
  assertEquals(await checkValues('open_item', 'kind'), [...OPEN_ITEM_KINDS].sort());
  const settlement = await checkValues('settlement_allocation', 'kind');
  assertEquals(SETTLEMENT_KINDS.filter((k) => !settlement.includes(k)), []);
  assertEquals(settlement.filter((k) => !(SETTLEMENT_KINDS as readonly string[]).includes(k)), ['reversal']);
  assertEquals(await checkValues('ledger_account', 'role'), Object.keys(ROLE_REQUIRES).sort());
});

Deno.test('the committed data dictionary matches the schema (run `deno task db:dictionary` after a migration)', async () => {
  assertEquals(await renderDictionary(), await Deno.readTextFile(DICTIONARY_FILE));
});

Deno.test('every function pins its search_path (Supabase advisor 0011: no role-mutable search_path)', async () => {
  const loose = await rows<{ fn: string }>(
    `select p.oid::regprocedure::text as fn from pg_proc p
     where p.pronamespace = 'finly'::regnamespace
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
     order by 1`,
  );
  assertEquals(loose, []);
});

Deno.test('no table has two permissive policies for the same role and command (each row checked once)', async () => {
  const doubled = await rows<{ t: string; role: string; cmd: string; n: number }>(
    // Cross product of roles × commands (two unnests in one select list would pair them up instead).
    `select p.tablename as t, r.role, c.cmd, count(*)::int as n
     from pg_policies p
     cross join lateral unnest(p.roles) as r(role)
     cross join lateral unnest(case p.cmd when 'ALL' then array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
                                          else array[p.cmd] end) as c(cmd)
     where p.schemaname = 'finly' and p.permissive = 'PERMISSIVE'
     group by 1, 2, 3 having count(*) > 1 order by 1, 2, 3`,
  );
  assertEquals(doubled, []);
});
