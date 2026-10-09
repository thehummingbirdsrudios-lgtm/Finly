/**
 * Who may change which books (docs/architecture/operations.md §2.1, §2.4). Evaluated when a request is prepared and
 * again, with the current rights, when it posts — a screen that was opened earlier never carries old rights forward.
 *
 * - The actor's own personal books: always.
 * - A firm or pool: write access to its environment, and either the `txn.create` permission (global or scoped to it)
 *   or being one of its owners (a Super Admin role alone grants no posting rights: system administration is not
 *   bookkeeping).
 * - Another person's personal books: if that person gave the actor write access to them, as for a firm; otherwise
 *   the person's own setting decides (D-029): `acknowledge` (the default) → the entry waits for them;
 *   `immediate` → it posts and they are told. A giver can never choose for them.
 */
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import type { DbContext } from './context.ts';

export interface PostingDecision {
  /** People whose acknowledgement the entry needs before it may post. */
  needsAck: Id[];
  /** People whose books receive the entry at once under their own `immediate` setting (to be notified). */
  immediate: Id[];
}

export async function authorize(tx: Sql, c: DbContext, entities: Id[]): Promise<PostingDecision> {
  const [me] = await tx.query<{ person: string | null; writable: string[] | null }>(
    `select finly.actor_person_id() as person, finly.actor_env_ids('write') as writable`,
  );
  if (!me?.person) fail('FORBIDDEN', 'Your account is not linked to a person yet.');
  const writable = new Set(me.writable ?? []);
  const decision: PostingDecision = { needsAck: [], immediate: [] };
  for (const id of entities) {
    if (id === me.person) continue;
    const e = c.entity(id);
    if (e.kind === 'person') {
      if (writable.has(id)) continue;
      const [s] = await tx.query<{ incoming_entries: string }>(
        `select incoming_entries from finly.personal_book_setting where entity_id = $1`,
        [id],
      );
      if ((s?.incoming_entries ?? 'acknowledge') === 'immediate') decision.immediate.push(id);
      else decision.needsAck.push(id);
      continue;
    }
    const [p] = await tx.query<{ ok: boolean }>(
      `select finly.actor_has_permission('txn.create', $1) or finly.actor_has_permission('txn.create')
              or finly.actor_owns_entity($1) as ok`,
      [id],
    );
    if (!writable.has(id) || !p?.ok) {
      // Never the entity's name: a guessed id must not reveal a firm the actor cannot see.
      fail('FORBIDDEN', 'You cannot record entries in these books.', { entityId: id });
    }
  }
  return decision;
}
