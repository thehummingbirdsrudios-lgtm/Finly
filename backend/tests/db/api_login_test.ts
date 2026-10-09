/**
 * The API login (db/bootstrap/api_login.sql) fails closed: on its own it can read or write nothing in Finly; it can
 * only switch to the three service roles, and never to the owner or the system role. Checked through PostgreSQL's own
 * privilege functions (the same answer a live `finly_app` connection gets; the local smoke test exercises that login).
 */
import { assertEquals } from '@std/assert';
import { dbWorld } from './world.ts';

const { db } = await dbWorld();
const bootstrap = await Deno.readTextFile(new URL('../../db/bootstrap/api_login.sql', import.meta.url));
await db.exec(bootstrap);

async function one<T>(sql: string): Promise<T> {
  return (await db.query<T>(sql)).rows[0];
}

Deno.test('finly_app has no rights of its own on any Finly table', async () => {
  const r = await one<{ readable: number; writable: number }>(
    `select count(*) filter (where has_table_privilege('finly_app', c.oid, 'select'))::int as readable,
            count(*) filter (where has_table_privilege('finly_app', c.oid, 'insert, update, delete'))::int as writable
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'finly' and c.relkind in ('r', 'v')`,
  );
  assertEquals(r, { readable: 0, writable: 0 });
  const login = await one<{ inherit: boolean; superuser: boolean; createrole: boolean; createdb: boolean }>(
    `select rolinherit as inherit, rolsuper as superuser, rolcreaterole as createrole, rolcreatedb as createdb
     from pg_roles where rolname = 'finly_app'`,
  );
  assertEquals(login, { inherit: false, superuser: false, createrole: false, createdb: false });
});

Deno.test('finly_app may become only the API, identity and ledger roles', async () => {
  const rows = (await db.query<{ role: string; member: boolean }>(
    `select r as role, pg_has_role('finly_app', r, 'MEMBER') as member
     from unnest(array['finly_api', 'finly_auth', 'finly_ledger', 'finly_owner', 'finly_system']) as r order by r`,
  )).rows;
  assertEquals(rows, [
    { role: 'finly_api', member: true },
    { role: 'finly_auth', member: true },
    { role: 'finly_ledger', member: true },
    { role: 'finly_owner', member: false },
    { role: 'finly_system', member: false },
  ]);
});

Deno.test('running the bootstrap again changes nothing and never changes whether it can log in', async () => {
  // Roles are cluster-wide: on a shared server a developer may already have enabled this login (dev:setup).
  const before = await one<{ login: boolean }>(`select rolcanlogin as login from pg_roles where rolname = 'finly_app'`);
  await db.exec(bootstrap);
  const r = await one<{ login: boolean; members: number }>(
    `select rolcanlogin as login,
            (select count(*)::int from pg_auth_members m where m.member = r.oid) as members
     from pg_roles r where rolname = 'finly_app'`,
  );
  assertEquals(r, { login: before.login, members: 3 });
});
