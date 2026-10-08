/**
 * An in-memory ledger: a complete EngineContext plus posted journals, open items and derived balances. It is the
 * reference implementation the database-backed ledger must agree with, and the engine test fixture.
 */
import { fail } from '../errors.ts';
import { type Id, uuidv7 } from '../ids.ts';
import type { Rupees } from '../money.ts';
import type {
  CategoryInfo,
  EngineContext,
  EntityInfo,
  LocationInfo,
  LocationKind,
  OpenItemInfo,
} from '../engine/context.ts';
import { CATEGORY_TEMPLATE, type EntityKind, templateFor } from './coa.ts';
import { type AccountRole, type LedgerAccount, NORMAL_SIDE, type PlannedJournal, type PostingPlan } from './types.ts';

export interface PostedLine {
  journalIndex: number;
  entityId: Id;
  accountId: Id;
  side: 'Dr' | 'Cr';
  amount: Rupees;
  fundId: Id;
  locationId?: Id;
  counterpartyId?: Id;
  categoryId?: Id;
}

export class MemoryLedger implements EngineContext {
  readonly entities = new Map<Id, EntityInfo>();
  readonly locations = new Map<Id, LocationInfo>();
  readonly categories = new Map<Id, CategoryInfo>();
  readonly categoryKeys = new Map<string, Id>();
  readonly accounts = new Map<Id, LedgerAccount>();
  readonly owners = new Set<string>();
  readonly openItems = new Map<Id, OpenItemInfo>();
  readonly journals: PlannedJournal[] = [];
  readonly lines: PostedLine[] = [];

  constructor() {
    for (const c of CATEGORY_TEMPLATE) {
      const id = uuidv7();
      this.categories.set(id, { id, kind: c.kind, name: c.name, accountCode: c.accountCode, active: true });
      this.categoryKeys.set(c.key, id);
    }
  }

  addEntity(name: string, kind: EntityKind): Id {
    const id = uuidv7();
    this.entities.set(id, { id, kind, name, active: true, defaultFundId: `${id}:general` });
    for (const t of templateFor(kind)) {
      const accId = uuidv7();
      this.accounts.set(accId, {
        id: accId,
        entityId: id,
        code: t.code,
        name: t.name,
        cls: t.cls,
        role: t.role,
        active: true,
      });
    }
    return id;
  }

  addLocation(name: string, kind: LocationKind, holderId?: Id): Id {
    const id = uuidv7();
    this.locations.set(id, { id, kind, name, active: true, currentHolderId: holderId });
    return id;
  }

  setOwner(firmId: Id, personId: Id): void {
    this.owners.add(`${firmId}:${personId}`);
  }

  cat(key: string): Id {
    const id = this.categoryKeys.get(key);
    if (!id) throw new Error(`unknown category ${key}`);
    return id;
  }

  // ------------------------------------------------------------------------------------------- EngineContext

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
    for (const a of this.accounts.values()) if (a.entityId === entityId && a.role === role) return a;
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

  // ------------------------------------------------------------------------------------------- posting

  /** Applies a checked plan; returns the ids of open items it created, in plan order. */
  apply(plan: PostingPlan): Id[] {
    for (const s of plan.settlements) {
      const item = this.openItem(s.openItemId);
      if (s.amount > item.remaining) fail('SETTLEMENT_EXCEEDS_REMAINING', 'Settlement exceeds what remains.');
    }
    for (const j of plan.journals) {
      const index = this.journals.push(j) - 1;
      for (const l of j.lines) this.lines.push({ ...l, journalIndex: index });
    }
    for (const s of plan.settlements) {
      const item = this.openItem(s.openItemId);
      item.remaining -= s.amount;
      item.status = item.remaining === 0n ? 'settled' : 'partially_settled';
    }
    return plan.openItems.map((o) => {
      const id = uuidv7();
      this.openItems.set(id, {
        id,
        kind: o.kind,
        debtorId: o.debtorId,
        creditorId: o.creditorId,
        original: o.amount,
        remaining: o.amount,
        debtorRole: o.debtorRole,
        creditorRole: o.creditorRole,
        status: 'open',
      });
      return id;
    });
  }

  // ------------------------------------------------------------------------------------------- queries

  /** Balance in the account's normal direction (positive = normal), optionally sliced by dimensions. */
  balance(
    entityId: Id,
    role: AccountRole,
    slice: { locationId?: Id; counterpartyId?: Id; categoryId?: Id; code?: string } = {},
  ): Rupees {
    let net = 0n;
    for (const l of this.lines) {
      if (l.entityId !== entityId) continue;
      const a = this.account(l.accountId);
      if (a.role !== role) continue;
      if (slice.code && a.code !== slice.code) continue;
      if (slice.locationId && l.locationId !== slice.locationId) continue;
      if (slice.counterpartyId && l.counterpartyId !== slice.counterpartyId) continue;
      if (slice.categoryId && l.categoryId !== slice.categoryId) continue;
      const normal = NORMAL_SIDE[a.cls];
      net += l.side === normal ? l.amount : -l.amount;
    }
    return net;
  }

  /** Total money at a location across every owner, or for one owner. */
  moneyAt(locationId: Id, entityId?: Id): Rupees {
    let net = 0n;
    for (const l of this.lines) {
      if (l.locationId !== locationId) continue;
      if (entityId && l.entityId !== entityId) continue;
      net += l.side === 'Dr' ? l.amount : -l.amount;
    }
    return net;
  }

  trialBalance(entityId: Id): { debits: Rupees; credits: Rupees } {
    let debits = 0n;
    let credits = 0n;
    for (const l of this.lines) {
      if (l.entityId !== entityId) continue;
      if (l.side === 'Dr') debits += l.amount;
      else credits += l.amount;
    }
    return { debits, credits };
  }

  /** A's net claim on B (receivable − payable, inter-entity) must equal B's net debt to A. */
  reciprocityBreaks(): string[] {
    const breaks: string[] = [];
    const ids = [...this.entities.values()].filter((e) => e.kind !== 'party').map((e) => e.id);
    for (const a of ids) {
      for (const b of ids) {
        if (a >= b) continue;
        const aOnB = this.balance(a, 'interentity_receivable', { counterpartyId: b }) -
          this.balance(a, 'interentity_payable', { counterpartyId: b });
        const bOnA = this.balance(b, 'interentity_receivable', { counterpartyId: a }) -
          this.balance(b, 'interentity_payable', { counterpartyId: a });
        if (aOnB !== -bOnA) breaks.push(`${this.entity(a).name}↔${this.entity(b).name}: ${aOnB} vs ${bOnA}`);
      }
    }
    return breaks;
  }

  /** Sum of every open item's remaining amount by (debtor, creditor). */
  owed(debtorId: Id, creditorId: Id): Rupees {
    let total = 0n;
    for (const o of this.openItems.values()) {
      if (o.debtorId === debtorId && o.creditorId === creditorId && o.status !== 'reversed') total += o.remaining;
    }
    return total;
  }
}
