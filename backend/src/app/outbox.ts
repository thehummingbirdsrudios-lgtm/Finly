/**
 * Writes after-commit effects into the transactional outbox (migration 0012) inside the caller's transaction, so an
 * effect exists if and only if the change committed. Payload values may only be ids or short lower-case tokens —
 * never an amount, a name or free text — which this module enforces before anything is written.
 */
import type { Sql } from '../db/sql.ts';
import { fail } from '../domain/errors.ts';
import { type Id, isUuid } from '../domain/ids.ts';

export interface OutboxEvent {
  topic: string;
  /** Unique per topic: a redelivery or a repeated write of the same effect is harmless. */
  dedupeKey: string;
  payload: Record<string, string>;
  txnId?: Id;
}

const TOKEN = /^[a-z][a-z_]{0,39}$/;

export function checkPayload(payload: Record<string, string>): void {
  for (const [key, value] of Object.entries(payload)) {
    if (!TOKEN.test(key) || !(isUuid(value) || TOKEN.test(value))) {
      fail('INTERNAL', 'An outbox payload may hold only ids and short tokens.', { key });
    }
  }
}

export async function emit(tx: Sql, events: OutboxEvent[]): Promise<void> {
  for (const e of events) {
    checkPayload(e.payload);
    await tx.query(
      `insert into finly.outbox_event (topic, dedupe_key, payload, txn_id, created_by)
       values ($1, $2, $3::text::jsonb, $4, finly.actor_user_id())
       on conflict do nothing`, // no conflict target: naming one would need SELECT, which writers must not have
      [e.topic, e.dedupeKey, JSON.stringify(e.payload), e.txnId ?? null],
    );
  }
}
