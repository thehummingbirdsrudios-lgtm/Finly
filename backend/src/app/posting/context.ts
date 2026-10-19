/**
 * The engine's view of the world, loaded from the database for one request (docs/database/06 §6.2 step 6). The engine
 * is synchronous and pure, so everything a request can touch is loaded up front: the ids it names, the parties of the
 * open items it settles, every book-keeping entity's accounts, all categories (seeded keys such as `interest`), and
 * the owners of the firms involved on the posting date. A reversal or correction also loads the event it undoes: its
 * journals and lines, the open items it created, what it settled and its handovers. Behaves like the reference
 * `MemoryLedger`, error for error.
 */
import type { Cipher } from '../../crypto/cipher.ts';
import { ctx as cryptoCtx } from '../../crypto/cipher.ts';
import type { Sql } from '../../db/sql.ts';
import type {
  CategoryInfo,
  EngineContext,
  EntityInfo,
  HandoverStatus,
  LocationInfo,
  LocationKind,
  OpenItemInfo,
  OpenItemStatus,
  PostedEvent,
  PostedJournal,
} from '../../domain/engine/context.ts';
import type { Intent } from '../../domain/engine/intents.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import { isUuid } from '../../domain/ids.ts';
import type { EntityKind } from '../../domain/ledger/coa.ts';
import type {
  AccountClass,
  AccountRole,
  JournalKind,
  LedgerAccount,
  OpenItemKind,
  SettlementKind,
  Side,
} from '../../domain/ledger/types.ts';

/** What the posting service needs about a place beyond the engine's view: its negative-balance and handover policies. */
export interface LocationPolicy {
  negativePolicy: 'forbid' | 'allow' | 'approval';
  overdraftLimit: bigint;
  /** Whether money handed into this place waits for the receiver's confirmation; `inherit` = the system default. */
  handoverConfirmation: 'inherit' | 'required' | 'off';
}

export class DbContext implements EngineContext {
  readonly entities = new Map<Id, EntityInfo>();
  readonly locations = new Map<Id, LocationInfo>();
  readonly policies = new Map<Id, LocationPolicy>();
  readonly categories = new Map<Id, CategoryInfo>();
  readonly categoryKeys = new Map<string, Id>();
  readonly accounts = new Map<Id, LedgerAccount>();
  readonly owners = new Set<string>();
  readonly openItems = new Map<Id, OpenItemInfo>();
  readonly events = new Map<Id, PostedEvent>();
  /** system_setting handover_confirmation_default (F2: off unless the owner turns it on). */
  handoverDefault = false;

  entity(id: Id): EntityInfo {
    return this.entities.get(id) ?? fail('ENTITY_NOT_FOUND', 'That person or firm was not found.', { id });
  }
  location(id: Id): LocationInfo {
    return this.locations.get(id) ?? fail('LOCATION_NOT_FOUND', 'That place was not found.', { id });
  }
  category(id: Id): CategoryInfo {
    return this.categories.get(id) ?? fail('VALIDATION', 'That category was not found.', { id });
  }
  categoryByKey(key: string): CategoryInfo {
    return this.category(this.categoryKeys.get(key) ?? '');
  }
  account(id: Id): LedgerAccount {
    return this.accounts.get(id) ?? fail('ACCOUNT_NOT_FOUND', 'That account was not found.', { id });
  }
  accountByRole(entityId: Id, role: AccountRole): LedgerAccount {
    for (const a of this.accounts.values()) if (a.entityId === entityId && a.role === role && a.active) return a;
    return fail('ACCOUNT_NOT_FOUND', 'This entity has no account for that kind of entry.', { entityId, role });
  }
  accountByCode(entityId: Id, code: string): LedgerAccount {
    for (const a of this.accounts.values()) if (a.entityId === entityId && a.code === code) return a;
    return fail('ACCOUNT_NOT_FOUND', 'This entity has no account for that category.', { entityId, code });
  }
  isOwner(firmId: Id, personId: Id): boolean {
    return this.owners.has(`${firmId}:${personId}`);
  }
  openItem(id: Id): OpenItemInfo {
    return this.openItems.get(id) ?? fail('OPEN_ITEM_NOT_FOUND', 'That outstanding item was not found.', { id });
  }
  postedEvent(txnId: Id): PostedEvent {
    return this.events.get(txnId) ?? fail('NOT_FOUND', 'That entry was not found.', { txnId });
  }
  policy(locationId: Id): LocationPolicy {
    return this.policies.get(locationId) ?? fail('LOCATION_NOT_FOUND', 'That place was not found.', { locationId });
  }
}

/** Every UUID mentioned anywhere in the intent. */
export function idsIn(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (isUuid(value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) idsIn(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) idsIn(v, out);
  }
  return out;
}

export interface LoadOptions {
  /**
   * Lock what the posting changes — the event a reversal undoes, then every open item touched (`FOR UPDATE`, in id
   * order) — when posting, never when only checking.
   */
  lockOpenItems: boolean;
}

/** The posted event a reversal or correction undoes, read in full; its ids join those the context loads. */
async function loadUndone(
  tx: Sql,
  cipher: Cipher,
  txnId: Id,
  lock: boolean,
): Promise<{ event: PostedEvent; ids: Set<string> }> {
  const [t] = await tx.query<{ status: string; intent_type: string }>(
    `select status, intent_type from finly.txn where id = $1 ${lock ? 'for no key update' : ''}`,
    [txnId],
  );
  if (!t) fail('NOT_FOUND', 'That entry was not found.');
  const ids = new Set<string>();
  const journals = new Map<string, PostedJournal>();
  for (
    const j of await tx.query<{ id: string; entity_id: string; step: number; kind: JournalKind }>(
      `select id, entity_id, step, kind from finly.journal where txn_id = $1 order by chain_seq`,
      [txnId],
    )
  ) {
    journals.set(j.id, { id: j.id, entityId: j.entity_id, step: j.step, kind: j.kind, lines: [] });
  }
  for (
    const l of await tx.query<{
      id: string;
      journal_id: string;
      entity_id: string;
      ledger_account_id: string;
      fund_id: string;
      side: Side;
      amount_enc: Uint8Array;
      location_id: string | null;
      counterparty_entity_id: string | null;
      category_id: string | null;
      holder_person_id: string | null;
      expense_event_id: string | null;
    }>(
      `select id, journal_id, entity_id, ledger_account_id, fund_id, side, amount_enc, location_id,
              counterparty_entity_id, category_id, holder_person_id, expense_event_id
       from finly.journal_line where journal_id = any($1::uuid[]) order by journal_id, line_no`,
      [[...journals.keys()]],
    )
  ) {
    journals.get(l.journal_id)!.lines.push({
      entityId: l.entity_id,
      accountId: l.ledger_account_id,
      side: l.side,
      amount: await cipher.decryptAmount(new Uint8Array(l.amount_enc), cryptoCtx('journal_line', 'amount_enc', l.id)),
      fundId: l.fund_id,
      locationId: l.location_id ?? undefined,
      counterpartyId: l.counterparty_entity_id ?? undefined,
      categoryId: l.category_id ?? undefined,
      projectId: l.expense_event_id ?? undefined,
      holderPersonId: l.holder_person_id ?? undefined,
    });
    for (const id of [l.entity_id, l.location_id, l.counterparty_entity_id, l.holder_person_id]) if (id) ids.add(id);
  }
  const created = await tx.query<{ id: string }>(
    `select id from finly.open_item where origin_txn_id = $1 order by id`,
    [txnId],
  );
  const allocations: PostedEvent['allocations'] = [];
  for (
    const a of await tx.query<{ id: string; open_item_id: string; amount_enc: Uint8Array; kind: SettlementKind }>(
      `select a.id, a.open_item_id, a.amount_enc, a.kind from finly.settlement_allocation a
       where a.settlement_txn_id = $1 and a.kind <> 'reversal'
         and not exists (select 1 from finly.settlement_allocation r where r.reversal_of_id = a.id)
       order by a.id`,
      [txnId],
    )
  ) {
    allocations.push({
      id: a.id,
      openItemId: a.open_item_id,
      amount: await cipher.decryptAmount(
        new Uint8Array(a.amount_enc),
        cryptoCtx('settlement_allocation', 'amount_enc', a.id),
      ),
      kind: a.kind,
    });
  }
  // Handovers are read, not locked: their state is re-checked by the conditional update that cancels them, after the
  // journal chain head, where a confirmation of the same handover also writes (06 §6.3 lock order).
  const handovers = await tx.query<{ id: string; custody_status: HandoverStatus }>(
    `select id, custody_status from finly.custody_event where txn_id = $1 order by id`,
    [txnId],
  );
  for (const o of created) ids.add(o.id);
  for (const a of allocations) ids.add(a.openItemId);
  return {
    event: {
      txnId,
      intentType: t.intent_type,
      status: t.status,
      journals: [...journals.values()],
      createdOpenItems: created.map((o) => o.id),
      allocations,
      handovers: handovers.map((h) => ({ id: h.id, status: h.custody_status })),
    },
    ids,
  };
}

interface OpenItemRow {
  id: string;
  kind: OpenItemKind;
  debtor_entity_id: string;
  creditor_entity_id: string;
  debtor_role: AccountRole | null;
  creditor_role: AccountRole | null;
  debtor_fund_id: string | null;
  creditor_fund_id: string | null;
  original_enc: Uint8Array;
  remaining_enc: Uint8Array;
  item_status: OpenItemStatus;
}

export async function loadContext(
  tx: Sql,
  cipher: Cipher,
  intent: Intent,
  valueDate: string,
  opts: LoadOptions,
): Promise<DbContext> {
  const c = new DbContext();
  const named = idsIn(intent);
  if (intent.type === 'reversal' || intent.type === 'correction') {
    const undone = await loadUndone(tx, cipher, intent.txnId, opts.lockOpenItems);
    c.events.set(intent.txnId, undone.event);
    for (const id of undone.ids) named.add(id);
  }
  const ids = [...named];

  const items = await tx.query<OpenItemRow>(
    `select id, kind, debtor_entity_id, creditor_entity_id, debtor_role, creditor_role, debtor_fund_id,
            creditor_fund_id, original_enc, remaining_enc, item_status
     from finly.open_item where id = any($1::uuid[]) order by id ${opts.lockOpenItems ? 'for update' : ''}`,
    [ids],
  );
  const entityIds = new Set(ids);
  for (const o of items) {
    c.openItems.set(o.id, {
      id: o.id,
      kind: o.kind,
      debtorId: o.debtor_entity_id,
      creditorId: o.creditor_entity_id,
      original: await cipher.decryptAmount(o.original_enc, cryptoCtx('open_item', 'original_enc', o.id)),
      remaining: await cipher.decryptAmount(o.remaining_enc, cryptoCtx('open_item', 'remaining_enc', o.id)),
      debtorRole: o.debtor_role ?? undefined,
      creditorRole: o.creditor_role ?? undefined,
      debtorFundId: o.debtor_fund_id ?? undefined,
      creditorFundId: o.creditor_fund_id ?? undefined,
      status: o.item_status,
    });
    entityIds.add(o.debtor_entity_id);
    entityIds.add(o.creditor_entity_id);
  }

  const entities = await tx.query<
    { id: string; kind: EntityKind; display_name: string; status: string; default_fund_id: string | null }
  >(
    `select e.id, e.kind, e.display_name, e.status,
            (select f.id from finly.fund f where f.entity_id = e.id and f.is_default and f.status = 'active') as default_fund_id
     from finly.entity e where e.id = any($1::uuid[])`,
    [[...entityIds]],
  );
  for (const e of entities) {
    c.entities.set(e.id, {
      id: e.id,
      kind: e.kind,
      name: e.display_name,
      active: e.status === 'active',
      // A party keeps no books, so it has no fund; the engine never asks for one.
      defaultFundId: e.default_fund_id ?? '',
    });
  }

  const locations = await tx.query<{
    id: string;
    kind: LocationKind;
    name: string;
    status: string;
    holder: string | null;
    negative_policy: LocationPolicy['negativePolicy'];
    handover_confirmation: LocationPolicy['handoverConfirmation'];
    overdraft_limit_enc: Uint8Array | null;
  }>(
    `select l.id, l.kind, l.name, l.status, l.negative_policy, l.handover_confirmation, l.overdraft_limit_enc,
            (select h.person_entity_id from finly.location_holder h
             where h.location_id = l.id and h.valid_to is null order by h.valid_from desc limit 1) as holder
     from finly.location l where l.id = any($1::uuid[])`,
    [ids],
  );
  for (const l of locations) {
    c.locations.set(l.id, {
      id: l.id,
      kind: l.kind,
      name: l.name,
      active: l.status === 'active',
      currentHolderId: l.holder ?? undefined,
    });
    c.policies.set(l.id, {
      negativePolicy: l.negative_policy,
      overdraftLimit: l.overdraft_limit_enc
        ? await cipher.decryptAmount(l.overdraft_limit_enc, cryptoCtx('location', 'overdraft_limit_enc', l.id))
        : 0n,
      handoverConfirmation: l.handover_confirmation,
    });
  }
  const [setting] = await tx.query<{ value: unknown }>(
    `select value from finly.system_setting where key = 'handover_confirmation_default'`,
  );
  c.handoverDefault = setting?.value === true;

  for (
    const k of await tx.query<
      { id: string; kind: 'expense' | 'income'; key: string; name: string; account_code: string; status: string }
    >(`select id, kind, key, name, account_code, status from finly.category`)
  ) {
    c.categories.set(k.id, {
      id: k.id,
      kind: k.kind,
      name: k.name,
      accountCode: k.account_code,
      active: k.status === 'active',
    });
    c.categoryKeys.set(k.key, k.id);
  }

  const books = [...c.entities.values()].filter((e) => e.kind !== 'party').map((e) => e.id);
  for (
    const a of await tx.query<
      {
        id: string;
        entity_id: string;
        code: string;
        name: string;
        class: AccountClass;
        role: AccountRole;
        status: string;
      }
    >(
      `select id, entity_id, code, name, class, role, status from finly.ledger_account where entity_id = any($1::uuid[])`,
      [books],
    )
  ) {
    c.accounts.set(a.id, {
      id: a.id,
      entityId: a.entity_id,
      code: a.code,
      name: a.name,
      cls: a.class,
      role: a.role,
      active: a.status === 'active',
    });
  }

  const firms = [...c.entities.values()].filter((e) => e.kind === 'firm' || e.kind === 'pool').map((e) => e.id);
  for (
    // Owners on the posting date: current, undisputed ownership records (partners are not owners, 0014).
    const o of await tx.query<{ entity_id: string; owner_entity_id: string }>(
      `select entity_id, owner_entity_id from finly.entity_ownership
       where entity_id = any($1::uuid[]) and verification <> 'disputed'
         and valid_from <= $2::date and (valid_to is null or valid_to >= $2::date)`,
      [firms, valueDate],
    )
  ) {
    c.owners.add(`${o.entity_id}:${o.owner_entity_id}`);
  }
  return c;
}
