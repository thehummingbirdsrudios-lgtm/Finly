/**
 * Migration 0018 (docs/PLAN.md M1): permissions held through a firm-scoped role work in that firm's grant, role,
 * audit and approval policies; nobody grants themselves anything; platform roles open no firm and create no super
 * admins; an entry is cancelled only by its maker; months open only inside a signed-in person's entry.
 *
 * World: Krish and Savan are super admins; Krish and Father own Mint through scoped entity_owner roles and manage
 * access; Sujal records entries in Mint; Savan has no firm at all.
 */
import { assert, assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { audit } from './posting.ts';
import { as, dbWorld } from './world.ts';

const w = await dbWorld();
const { db, u, e } = w;

/** A firm nobody in the world manages (created by the database owner). */
const outside = (await db.query<{ id: string }>(
  `insert into finly.entity (kind, entity_type_id, display_name)
   values ('firm', (select id from finly.entity_type where key = 'company'), 'Outside Traders') returning id`,
)).rows[0].id;

const grantAccess = (user: string, env: string, by: string) =>
  `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by, reason)
   values ('${user}', '${env}', 'read', 'admin', '${by}', 'test')`;
const grantRole = (user: string, roleKey: string, scope: string | null, by: string) =>
  `insert into finly.user_role (user_id, role_id, scope_entity_id, granted_by)
   values ('${user}', (select id from finly.role where key = '${roleKey}'), ${scope ? `'${scope}'` : 'null'}, '${by}')`;

Deno.test('a firm owner grants access to their own firm through their scoped role, and to no other firm', async () => {
  const granted = await as(db, 'finly_api', u.father, async (tx) => {
    await tx.query(grantAccess(u.savan, e.mint, u.father));
    return (await tx.query(`select 1 from finly.env_access where user_id = $1 and env_entity_id = $2`, [
      u.savan,
      e.mint,
    ])).rows.length;
  });
  assertEquals(granted, 1);
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.father, (tx) => tx.query(grantAccess(u.savan, e.jsk, u.father))),
  );
});

Deno.test('a platform-wide access.manage opens no firm the granter does not manage (D-038)', async () => {
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.savan, (tx) => tx.query(grantAccess(u.father, e.jsk, u.savan))),
  );
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.krish, (tx) => tx.query(grantAccess(u.father, outside, u.krish))),
  );
});

Deno.test('nobody grants themselves access or a role', async () => {
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.savan, (tx) => tx.query(grantAccess(u.savan, e.mint, u.savan))),
  );
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.krish, (tx) => tx.query(grantAccess(u.krish, outside, u.krish))),
  );
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.father, (tx) => tx.query(grantRole(u.father, 'entity_admin', e.mint, u.father))),
  );
});

Deno.test('a firm owner gives firm roles in their firm; nobody makes a super admin through the API', async () => {
  const ok = await as(db, 'finly_api', u.father, async (tx) => {
    await tx.query(grantRole(u.savan, 'entity_admin', e.mint, u.father));
    return true;
  });
  assert(ok);
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.father, (tx) => tx.query(grantRole(u.savan, 'entity_admin', e.jsk, u.father))),
  );
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.father, (tx) => tx.query(grantRole(u.savan, 'super_admin', null, u.father))),
  );
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.krish, (tx) => tx.query(grantRole(u.father, 'super_admin', null, u.krish))),
  );
});

Deno.test('the identity role creates roles only for the bootstrap tool, which has no signed-in actor', async () => {
  const bootstrapped = await as(db, 'finly_auth', null, async (tx) => {
    await tx.query(
      `insert into finly.user_role (user_id, role_id)
       values ($1, (select id from finly.role where key = 'read_only'))`,
      [u.sujal],
    );
    return true;
  });
  assert(bootstrapped);
  await expectSqlError('42501', () =>
    as(db, 'finly_auth', u.krish, (tx) =>
      tx.query(
        `insert into finly.user_role (user_id, role_id) values ($1, (select id from finly.role where key = 'super_admin'))`,
        [u.sujal],
      )));
});

Deno.test('a firm owner reads their firm’s audit trail through the scoped role; a worker does not', async () => {
  const objectId = crypto.randomUUID();
  await as(db, null, null, (tx) => audit(tx, u.krish, 'test.scoped_audit', 'test', objectId, e.mint), { commit: true });
  const seenBy = (user: string) =>
    as(
      db,
      'finly_api',
      user,
      async (tx) => (await tx.query(`select 1 from finly.audit_log where object_id = $1`, [objectId])).rows.length,
    );
  assertEquals(await seenBy(u.father), 1);
  assertEquals(await seenBy(u.sujal), 0);
});

Deno.test('another person cannot touch someone else’s draft; an entry counts as approved only when its approval is', async () => {
  const draft = await as(db, 'finly_api', u.sujal, async (tx) =>
    (await tx.query<{ id: string }>(
      `insert into finly.txn (reference, txn_type_id, intent_type, status, primary_env_id, value_date, created_by_user_id)
       values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
               'transfer', 'draft', $1, current_date, $2) returning id`,
      [e.mint, u.sujal],
    )).rows[0].id, { commit: true });
  // Another person cannot even see someone else's draft, so an update touches nothing.
  const touched = await as(
    db,
    'finly_api',
    u.krish,
    async (tx) =>
      (await tx.query(`update finly.txn set status = 'cancelled' where id = $1 returning id`, [draft])).rows.length,
  );
  assertEquals(touched, 0);

  const complete = (tx: { query: typeof db.query }) =>
    tx.query<{ ok: boolean }>(`select finly.txn_approval_complete($1) as ok`, [draft]).then((r) => r.rows[0].ok);
  const step = (status: string) =>
    `insert into finly.approval_request (target_type, txn_id, target_id, required_permission, request_status,
       requested_by, decided_by, decided_at)
     values ('txn', '${draft}', '${draft}', 'txn.approve', '${status}', '${u.sujal}',
             ${status === 'pending' ? 'null, null' : `'${u.krish}', now()`})`;
  const states = await as(db, null, null, async (tx) => {
    const none = await complete(tx);
    await tx.query(step('approved'));
    const one = await complete(tx);
    await tx.query(step('pending'));
    const waiting = await complete(tx);
    return { none, one, waiting };
  });
  assertEquals(states, { none: false, one: true, waiting: false });
});

Deno.test('months open only inside a signed-in person’s entry', async () => {
  await expectSqlError(
    'F1008',
    () => as(db, 'finly_ledger', null, (tx) => tx.query(`select finly.ensure_periods($1, current_date)`, [e.mint])),
  );
  await as(db, 'finly_ledger', u.krish, (tx) => tx.query(`select finly.ensure_periods($1, current_date)`, [e.mint]));
});
