/**
 * Writes what the posting service writes for one event — header, participants, a leg per line owner, journals,
 * lines and the audit row — so database tests can exercise the guards exactly as production postings meet them.
 * Amounts are placeholder ciphertext: the database never sees plaintext money (AC7).
 */
import type { Transaction } from '@electric-sql/pglite';
import { fakeCipher, fakeHash } from './world.ts';

export interface LineSpec {
  account: string;
  fund: string;
  side: 'Dr' | 'Cr';
  location?: string;
  counterparty?: string;
  category?: string;
}

export interface JournalSpec {
  entity: string;
  period: string;
  lines: LineSpec[];
  step?: number;
  kind?: string;
  reversalOf?: string;
}

export interface PostSpec {
  actor: string;
  primaryEnv: string;
  journals: JournalSpec[];
  /** Participants; defaults to the journal entities. */
  participants?: string[];
  /** Skip the audit row (to prove the database refuses that). */
  skipAudit?: boolean;
  txnId?: string;
}

async function nextSeq(tx: Transaction): Promise<number> {
  const r = await tx.query<{ last_seq: number }>(
    `update finly.journal_chain_head set last_seq = last_seq + 1, updated_at = now() where id = 1 returning last_seq`,
  );
  return Number(r.rows[0].last_seq);
}

/** Posts an event; returns the txn id and journal ids. */
export async function postEvent(tx: Transaction, spec: PostSpec): Promise<{ txnId: string; journalIds: string[] }> {
  let txnId = spec.txnId;
  if (!txnId) {
    // Created as a draft; participants and legs are added; then it moves draft -> posted (06 §6.2).
    const t = await tx.query<{ id: string }>(
      `insert into finly.txn (reference, txn_type_id, intent_type, status, primary_env_id, value_date,
         created_by_user_id, reason)
       values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
               'transfer', 'draft', $1, current_date, $2, 'Test posting') returning id`,
      [spec.primaryEnv, spec.actor],
    );
    txnId = t.rows[0].id;
  }
  const participants = spec.participants ?? [...new Set(spec.journals.map((j) => j.entity))];
  for (const entity of participants) {
    await tx.query(
      `insert into finly.txn_entity (txn_id, entity_id, role, value_date)
       values ($1, $2, 'owner', (select value_date from finly.txn where id = $1)) on conflict do nothing`,
      [txnId, entity],
    );
  }
  // One leg per journal, carrying the fund and place of its lines — as the posting service records them.
  for (const [i, j] of spec.journals.entries()) {
    const money = j.lines.find((x) => x.location);
    await tx.query(
      `insert into finly.txn_leg (txn_id, seq, leg_kind, entity_id, fund_id, location_id, amount_enc, amount_bidx,
         amount_bucket, key_version)
       values ($1, $2, 'allocation', $3, $4, $5, $6, $7, $8, 1)`,
      [txnId, i + 1, j.entity, j.lines[0].fund, money?.location ?? null, fakeCipher(), fakeHash(), fakeHash()],
    );
  }
  await tx.query(`update finly.txn set status = 'posted', posted_at = now() where id = $1 and status = 'draft'`, [
    txnId,
  ]);
  const journalIds: string[] = [];
  for (const j of spec.journals) {
    const seq = await nextSeq(tx);
    const r = await tx.query<{ id: string }>(
      `insert into finly.journal (txn_id, entity_id, step, kind, period_id, value_date, posted_by_user_id,
         reversal_of_journal_id, chain_seq, prev_hash, content_hash, hash_key_version)
       values ($1, $2, $3, $4, $5, current_date, $6, $7, $8, $9, $10, 1) returning id`,
      [
        txnId,
        j.entity,
        j.step ?? 1,
        j.kind ?? 'standard',
        j.period,
        spec.actor,
        j.reversalOf ?? null,
        seq,
        new Uint8Array(32),
        crypto.getRandomValues(new Uint8Array(32)),
      ],
    );
    const journalId = r.rows[0].id;
    journalIds.push(journalId);
    for (const [i, l] of j.lines.entries()) {
      await tx.query(
        `insert into finly.journal_line (journal_id, entity_id, value_date, line_no, ledger_account_id, fund_id, side,
           amount_enc, key_version, location_id, counterparty_entity_id, category_id)
         values ($1, $2, current_date, $3, $4, $5, $6, $7, 1, $8, $9, $10)`,
        [
          journalId,
          j.entity,
          i + 1,
          l.account,
          l.fund,
          l.side,
          fakeCipher(),
          l.location ?? null,
          l.counterparty ?? null,
          l.category ?? null,
        ],
      );
    }
  }
  if (!spec.skipAudit) await audit(tx, spec.actor, 'txn.posted', 'txn', txnId, spec.primaryEnv, txnId);
  return { txnId, journalIds };
}

/** Appends an audit row the way the API does (the HMAC itself is computed outside the database). */
export async function audit(
  tx: Transaction,
  actor: string,
  action: string,
  objectType: string,
  objectId: string,
  env: string | null,
  txnId: string | null = null,
): Promise<void> {
  await tx.query(`update finly.audit_chain_head set last_id = last_id + 1 where id = 1`);
  await tx.query(
    `insert into finly.audit_log (actor_user_id, action, object_type, object_id, env_entity_id, txn_id, prev_hash,
       row_hash, hash_key_version)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
    [actor, action, objectType, objectId, env, txnId, new Uint8Array(32), crypto.getRandomValues(new Uint8Array(32))],
  );
}

/** Forces deferred commit-time checks to run now (so a test can observe them inside a rolled-back transaction). */
export async function commitChecks(tx: Transaction): Promise<void> {
  await tx.exec('set constraints all immediate');
}
