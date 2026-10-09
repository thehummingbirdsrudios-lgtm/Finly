/**
 * Balance snapshots under lock (docs/database/06 §6.2 steps 7–9, 14). Every slice a plan touches is created if new and
 * locked, one by one, in one global key order (entity, account, fund, location, counterparty, category), so two
 * postings on overlapping slices queue instead of deadlocking. Money leaving a place is checked against what is there
 * minus active holds, after the lock — the client's view of a balance is never trusted.
 */
import { type Cipher, ctx } from '../../crypto/cipher.ts';
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import { type Id, uuidv7 } from '../../domain/ids.ts';
import type { PlannedLine, PostingPlan } from '../../domain/ledger/types.ts';
import type { DbContext } from './context.ts';

const MONEY_ROLES = new Set(['cash', 'bank', 'wallet']);

export interface Slice {
  key: string;
  entityId: Id;
  accountId: Id;
  fundId: Id;
  locationId?: Id;
  counterpartyId?: Id;
  categoryId?: Id;
  sliceId: Id;
  /** Balance before this posting, Dr − Cr. */
  before: bigint;
  dr: bigint;
  cr: bigint;
  lines: number;
}

export function sliceKey(l: PlannedLine): string {
  return [l.entityId, l.accountId, l.fundId, l.locationId ?? '', l.counterpartyId ?? '', l.categoryId ?? ''].join('|');
}

/** Creates missing slices and locks every slice of the plan, in key order; returns them by key. */
export async function lockSlices(tx: Sql, cipher: Cipher, plan: PostingPlan): Promise<Map<string, Slice>> {
  const slices = new Map<string, Slice>();
  for (const l of plan.journals.flatMap((j) => j.lines)) {
    const key = sliceKey(l);
    const s = slices.get(key) ?? {
      key,
      entityId: l.entityId,
      accountId: l.accountId,
      fundId: l.fundId,
      locationId: l.locationId,
      counterpartyId: l.counterpartyId,
      categoryId: l.categoryId,
      sliceId: '',
      before: 0n,
      dr: 0n,
      cr: 0n,
      lines: 0,
    };
    if (l.side === 'Dr') s.dr += l.amount;
    else s.cr += l.amount;
    s.lines++;
    slices.set(key, s);
  }
  // Lower-case UUID text sorts like PostgreSQL's uuid order; '' (no dimension) sorts first, as NULLS FIRST would.
  const ordered = [...slices.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (const s of ordered) {
    const dims = [
      s.entityId,
      s.accountId,
      s.fundId,
      s.locationId ?? null,
      s.counterpartyId ?? null,
      s.categoryId ?? null,
    ];
    await tx.query(
      `insert into finly.balance_slice (entity_id, ledger_account_id, fund_id, location_id, counterparty_entity_id,
         category_id)
       values ($1, $2, $3, $4, $5, $6) on conflict do nothing`,
      dims,
    );
    const [{ id }] = await tx.query<{ id: string }>(
      `select id from finly.balance_slice
       where entity_id = $1 and ledger_account_id = $2 and fund_id = $3 and location_id is not distinct from $4
         and counterparty_entity_id is not distinct from $5 and category_id is not distinct from $6`,
      dims,
    );
    s.sliceId = id;
    const zero = await cipher.encryptAmount(0n, ctx('balance_current', 'balance_enc', id));
    await tx.query(
      `insert into finly.balance_current (slice_id, entity_id, balance_enc, key_version)
       values ($1, $2, $3, $4) on conflict (slice_id) do nothing`,
      [id, s.entityId, zero, cipher.activeVersion()],
    );
    const [row] = await tx.query<{ balance_enc: Uint8Array }>(
      `select balance_enc from finly.balance_current where slice_id = $1 for update`,
      [id],
    );
    s.before = await cipher.decryptAmount(row.balance_enc, ctx('balance_current', 'balance_enc', id));
  }
  return slices;
}

interface Hold {
  id: string;
  amount: bigint;
  txnId: string | null;
}

async function activeHolds(tx: Sql, cipher: Cipher, s: Slice): Promise<Hold[]> {
  const rows = await tx.query<{ id: string; amount_enc: Uint8Array; txn_id: string | null }>(
    `select id, amount_enc, txn_id from finly.balance_hold
     where entity_id = $1 and fund_id = $2 and location_id = $3 and hold_status = 'active' order by id for update`,
    [s.entityId, s.fundId, s.locationId],
  );
  const holds: Hold[] = [];
  for (const r of rows) {
    holds.push({
      id: r.id,
      amount: await cipher.decryptAmount(r.amount_enc, ctx('balance_hold', 'amount_enc', r.id)),
      txnId: r.txn_id,
    });
  }
  return holds;
}

/** Money slices the plan takes money out of (net credit at a cash, bank or wallet location). */
export function outflows(c: DbContext, slices: Map<string, Slice>): Slice[] {
  return [...slices.values()]
    .filter((s) => s.locationId && MONEY_ROLES.has(c.account(s.accountId).role) && s.cr > s.dr)
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * Refuses money leaving a place that does not have it: balance after posting minus active holds (other than this
 * event's own) must stay within the place's policy — `forbid`: not below zero; `allow`: not below the overdraft limit
 * (no limit when none is set); `approval`: not below zero without an approval (approvals are a separate flow).
 */
export async function checkAvailable(
  tx: Sql,
  cipher: Cipher,
  c: DbContext,
  slices: Map<string, Slice>,
  ownTxnId: Id,
): Promise<void> {
  for (const s of outflows(c, slices)) {
    const held = (await activeHolds(tx, cipher, s)).filter((h) => h.txnId !== ownTxnId).reduce(
      (t, h) => t + h.amount,
      0n,
    );
    const available = s.before + s.dr - s.cr - held;
    const policy = c.policy(s.locationId!);
    const floor = policy.negativePolicy === 'allow' ? (policy.overdraftLimit > 0n ? -policy.overdraftLimit : null) : 0n;
    if (floor !== null && available < floor) {
      fail('INSUFFICIENT_BALANCE', `There is not enough money at ${c.location(s.locationId!).name}.`, {
        locationId: s.locationId,
      });
    }
  }
}

/** Reserves the money an entry waiting for acknowledgement will take out, so it cannot be spent twice meanwhile. */
export async function holdOutflows(
  tx: Sql,
  cipher: Cipher,
  c: DbContext,
  slices: Map<string, Slice>,
  txnId: Id,
  actorUserId: Id,
  exclude: Set<Id>,
): Promise<void> {
  for (const s of outflows(c, slices)) {
    if (exclude.has(s.entityId)) continue;
    const id = uuidv7();
    await tx.query(
      `insert into finly.balance_hold (id, entity_id, fund_id, location_id, kind, amount_enc, key_version, reason,
         txn_id, created_by)
       values ($1, $2, $3, $4, 'pending_outgoing', $5, $6, 'Waiting for acknowledgement', $7, $8)`,
      [
        id,
        s.entityId,
        s.fundId,
        s.locationId,
        await cipher.encryptAmount(s.cr - s.dr, ctx('balance_hold', 'amount_enc', id)),
        cipher.activeVersion(),
        txnId,
        actorUserId,
      ],
    );
  }
}

/** Ends this event's holds: `consumed` when it posts, `released` when it is rejected or withdrawn. */
export async function endHolds(tx: Sql, txnId: Id, actorUserId: Id, how: 'consumed' | 'released'): Promise<void> {
  await tx.query(
    `update finly.balance_hold set hold_status = $2, released_at = now(), released_by = $3
     where txn_id = $1 and hold_status = 'active'`,
    [txnId, how, actorUserId],
  );
}

/** Writes the new current and period balances of every locked slice. */
export async function writeBalances(
  tx: Sql,
  cipher: Cipher,
  slices: Map<string, Slice>,
  periodOf: (entityId: Id) => Id,
  lastJournal: Map<string, Id>,
): Promise<void> {
  const version = cipher.activeVersion();
  for (const s of slices.values()) {
    const after = s.before + s.dr - s.cr;
    await tx.query(
      `update finly.balance_current set balance_enc = $2, line_count = line_count + $3, last_journal_id = $4,
         key_version = $5, version = version + 1, updated_at = now()
       where slice_id = $1`,
      [
        s.sliceId,
        await cipher.encryptAmount(after, ctx('balance_current', 'balance_enc', s.sliceId)),
        s.lines,
        lastJournal.get(s.key),
        version,
      ],
    );
    const period = periodOf(s.entityId);
    const rowKey = `${s.sliceId}:${period}`;
    const [row] = await tx.query<{ debits_enc: Uint8Array; credits_enc: Uint8Array }>(
      `select debits_enc, credits_enc from finly.balance_period where slice_id = $1 and period_id = $2 for update`,
      [s.sliceId, period],
    );
    const debits =
      (row ? await cipher.decryptAmount(row.debits_enc, ctx('balance_period', 'debits_enc', rowKey)) : 0n) +
      s.dr;
    const credits =
      (row ? await cipher.decryptAmount(row.credits_enc, ctx('balance_period', 'credits_enc', rowKey)) : 0n) +
      s.cr;
    const values = [
      s.sliceId,
      period,
      s.entityId,
      await cipher.encryptAmount(debits, ctx('balance_period', 'debits_enc', rowKey)),
      await cipher.encryptAmount(credits, ctx('balance_period', 'credits_enc', rowKey)),
      s.lines,
      version,
    ];
    if (row) {
      await tx.query(
        `update finly.balance_period set debits_enc = $4, credits_enc = $5, line_count = line_count + $6,
           key_version = $7, version = version + 1, updated_at = now()
         where slice_id = $1 and period_id = $2 and entity_id = $3`,
        values,
      );
    } else {
      await tx.query(
        `insert into finly.balance_period (slice_id, period_id, entity_id, debits_enc, credits_enc, line_count, key_version)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        values,
      );
    }
  }
}
