/**
 * The spec's example world in a migrated database (seed/test data only). Built as the migration user, the way the
 * one-time bootstrap will run. Then tests act as Finly's roles through `as()`.
 *
 * People: Krish (Super Admin, owner of Mint and JSK), Father (owner of Mint, Family Admin), Sujal (worker with write
 * access to Mint), Savan (Super Admin who owns nothing). Firms: Mint, JSK. Party: Hotel Shreeji.
 */
import { migratedDb, type TestDb, type TestTx } from './harness.ts';

export interface DbWorld {
  db: TestDb;
  u: { krish: string; father: string; sujal: string; savan: string };
  e: { mint: string; jsk: string; krish: string; father: string; sujal: string; savan: string; hotel: string };
  f: { mint: string; mintPrivate: string; jsk: string; krish: string; father: string; sujal: string };
  l: { tijori: string; savanBank: string; krishBank: string; cashSujal: string; wardrobe: string };
  p: { mint: string; jsk: string; krish: string; father: string; sujal: string };
  cat: (key: string) => string;
  account: (entityId: string, code: string) => string;
}

type Q = TestTx;

async function one<T>(db: Q, sql: string, params: unknown[] = []): Promise<T> {
  const rows = (await db.query<T>(sql, params)).rows;
  if (rows.length !== 1) throw new Error(`expected one row, got ${rows.length}: ${sql}`);
  return rows[0];
}

async function entity(db: Q, kind: string, typeKey: string, name: string, managedIn?: string): Promise<string> {
  const r = await one<{ id: string }>(
    db,
    `insert into finly.entity (kind, entity_type_id, display_name, managed_in_env_id)
     values ($1, (select id from finly.entity_type where key = $2), $3, $4) returning id`,
    [kind, typeKey, name, managedIn ?? null],
  );
  if (kind !== 'party') {
    await db.query(
      `insert into finly.ledger_account (entity_id, code, name, class, role, requires_location, requires_counterparty,
         requires_category, is_system)
       select $1, code, name, class, role, requires_location, requires_counterparty, requires_category, true
       from finly.coa_template_account where entity_kind = $2`,
      [r.id, kind],
    );
    await db.query(
      `insert into finly.accounting_period (entity_id, period_start, period_end)
       values ($1, date_trunc('month', current_date)::date,
               (date_trunc('month', current_date) + interval '1 month - 1 day')::date)`,
      [r.id],
    );
  }
  return r.id;
}

async function fund(db: Q, entityId: string, key: string, isDefault: boolean, confidentiality?: string) {
  const r = await one<{ id: string }>(
    db,
    `insert into finly.fund (entity_id, key, name, kind_id, is_default, confidentiality_level_id)
     values ($1, $2, initcap($2), (select id from finly.lookup_value where list_key = 'fund_kind' and key = 'general'),
             $3, (select id from finly.confidentiality_level where key = $4)) returning id`,
    [entityId, key, isDefault, confidentiality ?? null],
  );
  return r.id;
}

async function user(db: Q, personId: string, username: string, roleKey: string): Promise<string> {
  const r = await one<{ id: string }>(
    db,
    `insert into finly.app_user (person_entity_id, username, display_name, status, must_change_password, activated_at)
     values ($1, $2, $2, 'active', false, now()) returning id`,
    [personId, username],
  );
  await db.query(
    `insert into finly.env_access (user_id, env_entity_id, level, source) values ($1, $2, 'manage', 'self')`,
    [r.id, personId],
  );
  await db.query(
    `insert into finly.user_role (user_id, role_id) values ($1, (select id from finly.role where key = $2))`,
    [r.id, roleKey],
  );
  return r.id;
}

async function location(
  db: Q,
  name: string,
  kind: string,
  typeKey: string,
  managedIn: string,
  opts: { custody?: string; disclosure?: string } = {},
): Promise<string> {
  const r = await one<{ id: string }>(
    db,
    `insert into finly.location (name, kind, type_id, managed_in_env_id, custody_person_id, disclosure)
     values ($1, $2, (select id from finly.lookup_value where list_key = 'location_type' and key = $3), $4, $5,
             coalesce($6, 'name')) returning id`,
    [name, kind, typeKey, managedIn, opts.custody ?? null, opts.disclosure ?? null],
  );
  return r.id;
}

export async function dbWorld(): Promise<DbWorld> {
  const db = await migratedDb();
  const mint = await entity(db, 'firm', 'company', 'Mint');
  const jsk = await entity(db, 'firm', 'company', 'JSK');
  const krish = await entity(db, 'person', 'individual', 'Krish');
  const father = await entity(db, 'person', 'individual', 'Father');
  const sujal = await entity(db, 'person', 'individual', 'Sujal', mint);
  const savan = await entity(db, 'person', 'individual', 'Savan');
  const hotel = await entity(db, 'party', 'supplier', 'Hotel Shreeji', mint);

  const f = {
    mint: await fund(db, mint, 'operating', true),
    mintPrivate: await fund(db, mint, 'owner_private', false, 'owner_only'),
    jsk: await fund(db, jsk, 'operating', true),
    krish: await fund(db, krish, 'personal', true),
    father: await fund(db, father, 'personal', true),
    sujal: await fund(db, sujal, 'personal', true),
  };
  await fund(db, savan, 'personal', true);

  for (
    const [org, member, role] of [[mint, krish, 'owner'], [mint, father, 'owner'], [jsk, krish, 'owner'], [
      mint,
      sujal,
      'staff',
    ]]
  ) {
    await db.query(
      `insert into finly.entity_membership (org_entity_id, member_entity_id, engine_role) values ($1, $2, $3)`,
      [org, member, role],
    );
  }

  const u = {
    krish: await user(db, krish, 'krish', 'super_admin'),
    father: await user(db, father, 'father', 'family_admin'),
    sujal: await user(db, sujal, 'sujal', 'worker'),
    savan: await user(db, savan, 'savan', 'super_admin'),
  };
  // Firm access: owners manage their firms; the worker may write entries in Mint.
  for (
    const [userId, env, level] of [[u.krish, mint, 'manage'], [u.krish, jsk, 'manage'], [u.father, mint, 'manage'], [
      u.sujal,
      mint,
      'write',
    ]]
  ) {
    await db.query(
      `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by) values ($1, $2, $3, 'admin', $4)`,
      [userId, env, level, u.krish],
    );
  }

  const l = {
    tijori: await location(db, 'Tijori', 'cash', 'vault', mint),
    savanBank: await location(db, 'Savan Bank', 'bank', 'bank_current', mint),
    krishBank: await location(db, 'Krish savings', 'bank', 'bank_savings', krish),
    cashSujal: await location(db, 'Cash with Sujal', 'cash', 'hand_cash', mint, { custody: sujal }),
    wardrobe: await location(db, 'Wardrobe', 'cash', 'wardrobe', mint, { disclosure: 'owner_only' }),
  };
  await db.query(
    `insert into finly.location_holder (location_id, person_entity_id) values ($1, $2), ($3, null)`,
    [l.tijori, father, l.wardrobe],
  );

  const periods = await db.query<{ entity_id: string; id: string }>(
    `select entity_id, id from finly.accounting_period`,
  );
  const p = Object.fromEntries(periods.rows.map((r) => [r.entity_id, r.id]));
  const cats = new Map((await db.query<{ key: string; id: string }>(`select key, id from finly.category`)).rows.map(
    (r) => [r.key, r.id],
  ));
  const accounts = new Map(
    (await db.query<{ entity_id: string; code: string; id: string }>(
      `select entity_id, code, id from finly.ledger_account`,
    ))
      .rows.map((r) => [`${r.entity_id}:${r.code}`, r.id]),
  );
  return {
    db,
    u,
    e: { mint, jsk, krish, father, sujal, savan, hotel },
    f,
    l,
    p: { mint: p[mint], jsk: p[jsk], krish: p[krish], father: p[father], sujal: p[sujal] },
    cat: (key) => cats.get(key) ?? fail(`no category ${key}`),
    account: (entityId, code) => accounts.get(`${entityId}:${code}`) ?? fail(`no account ${code}`),
  };
}

function fail(message: string): never {
  throw new Error(message);
}

/** Runs `fn` in a transaction as `role` with `actor` set (null = no actor), then rolls back unless `commit`. */
export async function as<T>(
  db: TestDb,
  role: 'finly_api' | 'finly_ledger' | 'finly_system' | 'finly_auth' | null,
  actor: string | null,
  fn: (tx: TestTx) => Promise<T>,
  opts: { commit?: boolean } = {},
): Promise<T> {
  let result: T;
  const rollback = new Error('rollback');
  try {
    await db.transaction(async (tx) => {
      if (role) await tx.exec(`set local role ${role}`);
      if (actor) await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
      result = await fn(tx);
      if (!opts.commit) throw rollback;
    });
  } catch (e) {
    if (e !== rollback) throw e;
  }
  return result!;
}

/** Placeholder ciphertext of the right shape (37 bytes: format, nonce, 8-byte value, tag). Never a real key. */
export function fakeCipher(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(37));
}

export function fakeHash(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}
