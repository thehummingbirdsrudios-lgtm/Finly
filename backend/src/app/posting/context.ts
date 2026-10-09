/**
 * The engine's view of the world, loaded from the database for one request (docs/database/06 §6.2 step 6). The engine
 * is synchronous and pure, so everything a request can touch is loaded up front: the ids it names, the parties of the
 * open items it settles, every book-keeping entity's accounts, all categories (seeded keys such as `interest`), and
 * the owners of the firms involved on the posting date. Behaves like the reference `MemoryLedger`, error for error.
 */
import type { Cipher } from '../../crypto/cipher.ts';
import { ctx as cryptoCtx } from '../../crypto/cipher.ts';
import type { Sql } from '../../db/sql.ts';
import type {
  CategoryInfo,
  EngineContext,
  EntityInfo,
  LocationInfo,
  LocationKind,
  OpenItemInfo,
  OpenItemStatus,
} from '../../domain/engine/context.ts';
import type { Intent } from '../../domain/engine/intents.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import { isUuid } from '../../domain/ids.ts';
import type { EntityKind } from '../../domain/ledger/coa.ts';
import type { AccountClass, AccountRole, LedgerAccount, OpenItemKind } from '../../domain/ledger/types.ts';

/** What the posting service needs about a place beyond the engine's view: its negative-balance policy. */
export interface LocationPolicy {
  negativePolicy: 'forbid' | 'allow' | 'approval';
  overdraftLimit: bigint;
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
  /** Lock the open items the intent names (`FOR UPDATE`, in id order) — when posting, never when only checking. */
  lockOpenItems: boolean;
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
  const ids = [...idsIn(intent)];

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
    overdraft_limit_enc: Uint8Array | null;
  }>(
    `select l.id, l.kind, l.name, l.status, l.negative_policy, l.overdraft_limit_enc,
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
    });
  }

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
