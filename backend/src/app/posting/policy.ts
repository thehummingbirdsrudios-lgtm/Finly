/**
 * Who may change which books (docs/architecture/operations.md §2.1, §2.4). Evaluated when a request is prepared and
 * again, with the current rights, when it posts — a screen that was opened earlier never carries old rights forward.
 *
 * - The actor's own personal books: always.
 * - A firm or pool: write access to its environment and the `txn.create` permission (global or scoped to it) for
 *   what the entry adds, `txn.reverse` for what it undoes — entering entries never brings the right to reverse them
 *   (ADDON-17, ADDON-18). Owners post through their explicit `entity_owner` role; ownership itself is a business
 *   fact, not a permission, and a platform role opens no firm at all (D-038).
 * - Another person's personal books: if that person gave the actor write access to them, as for a firm — except that
 *   undoing an entry there without `txn.reverse` waits for the person instead; otherwise the person's own setting
 *   decides (D-029): `acknowledge` (the default) → the entry waits for them; `immediate` → it posts and they are told.
 *   A giver can never choose for them.
 */
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import type { PostingPlan } from '../../domain/ledger/types.ts';
import type { DbContext } from './context.ts';

export interface PostingDecision {
  /** People whose acknowledgement the entry needs before it may post. */
  needsAck: Id[];
  /** People whose books receive the entry at once under their own `immediate` setting (to be notified). */
  immediate: Id[];
}

/** The permissions each book of a plan needs: `txn.reverse` where it undoes posted journals, `txn.create` where it adds. */
export function permissionsFor(plan: PostingPlan): Map<Id, Set<'txn.create' | 'txn.reverse'>> {
  const needs = new Map<Id, Set<'txn.create' | 'txn.reverse'>>();
  for (const j of plan.journals) {
    let set = needs.get(j.entityId);
    if (!set) needs.set(j.entityId, set = new Set());
    set.add(j.kind === 'reversal' ? 'txn.reverse' : 'txn.create');
  }
  return needs;
}

/** The actor holds `permission` in `entityId`, through a global role or one scoped to it. */
async function holds(tx: Sql, permission: string, entityId: Id): Promise<boolean> {
  const [p] = await tx.query<{ ok: boolean }>(
    `select finly.actor_has_permission($2, $1) or finly.actor_has_permission($2) as ok`,
    [entityId, permission],
  );
  return p?.ok === true;
}

export async function authorize(tx: Sql, c: DbContext, plan: PostingPlan): Promise<PostingDecision> {
  const needs = permissionsFor(plan);
  const entities = [...needs.keys()].sort();
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
      if (writable.has(id)) {
        // Write access delegated by the person is not a right to undo their entries (ADDON-17, ADDON-18).
        if (needs.get(id)!.has('txn.reverse') && !(await holds(tx, 'txn.reverse', id))) decision.needsAck.push(id);
        continue;
      }
      const [s] = await tx.query<{ incoming_entries: string }>(
        `select incoming_entries from finly.personal_book_setting where entity_id = $1`,
        [id],
      );
      if ((s?.incoming_entries ?? 'acknowledge') === 'immediate') decision.immediate.push(id);
      else decision.needsAck.push(id);
      continue;
    }
    for (const permission of needs.get(id)!) {
      if (!writable.has(id) || !(await holds(tx, permission, id))) {
        // Never the entity's name: a guessed id must not reveal a firm the actor cannot see.
        fail(
          'FORBIDDEN',
          permission === 'txn.reverse'
            ? 'You cannot reverse or correct entries in these books.'
            : 'You cannot record entries in these books.',
          { entityId: id },
        );
      }
    }
  }
  return decision;
}
