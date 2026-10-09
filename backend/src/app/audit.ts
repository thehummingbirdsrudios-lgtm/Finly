/**
 * Appends audit rows to the global HMAC chain (AC7, U2). Always the last write of a transaction (06 §6.3): the chain
 * head is locked only for the final milliseconds. The hashed content is exactly what is stored, so the Integrity
 * Verifier can recompute every link from the row alone (`auditContent`).
 */
import type { HashChain } from '../crypto/chain.ts';
import type { Sql } from '../db/sql.ts';
import type { Id } from '../domain/ids.ts';

export interface AuditEntry {
  actorUserId: Id;
  /** Dotted verb, e.g. `txn.posted`. */
  action: string;
  objectType: string;
  objectId?: Id;
  /** Whose environment this row belongs to (who may see it). */
  envEntityId?: Id;
  txnId?: Id;
  reason?: string;
}

/** The hashed content of an audit row; the verifier rebuilds it from the stored columns. */
export function auditContent(e: AuditEntry, occurredAt: string): Record<string, unknown> {
  return {
    actor: e.actorUserId,
    action: e.action,
    object_type: e.objectType,
    object_id: e.objectId ?? null,
    env: e.envEntityId ?? null,
    txn: e.txnId ?? null,
    reason: e.reason ?? null,
    at: occurredAt,
  };
}

export async function appendAudit(tx: Sql, chain: HashChain, entries: AuditEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const [head] = await tx.query<{ last_hash: Uint8Array; at: string }>(
    `select last_hash, to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as at
     from finly.audit_chain_head where id = 1 for update`,
  );
  let prev: Uint8Array = new Uint8Array(head.last_hash);
  let lastId = 0;
  const version = chain.activeVersion();
  for (const e of entries) {
    const rowHash = await chain.link(prev, auditContent(e, head.at), version);
    const [row] = await tx.query<{ id: string }>(
      `insert into finly.audit_log (occurred_at, actor_user_id, action, object_type, object_id, env_entity_id, txn_id,
         reason, prev_hash, row_hash, hash_key_version)
       values ($1::timestamptz, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
      [
        head.at,
        e.actorUserId,
        e.action,
        e.objectType,
        e.objectId ?? null,
        e.envEntityId ?? null,
        e.txnId ?? null,
        e.reason ?? null,
        prev,
        rowHash,
        version,
      ],
    );
    lastId = Number(row.id);
    prev = rowHash;
  }
  await tx.query(`update finly.audit_chain_head set last_id = $1, last_hash = $2, updated_at = now() where id = 1`, [
    lastId,
    prev,
  ]);
}
