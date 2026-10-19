/**
 * An in-memory ledger: a complete EngineContext plus posted journals, open items and derived balances. It is the
 * reference implementation the database-backed ledger must agree with, and the engine test fixture.
 */
import { fail } from '../errors.ts';
import { type Id, uuidv7 } from '../ids.ts';
import type { Paise } from '../money.ts';
import type {
  CategoryInfo,
  EngineContext,
  EntityInfo,
  LocationInfo,
  LocationKind,
  OpenItemInfo,
  PostedEvent,
} from '../engine/context.ts';
import { CATEGORY_TEMPLATE, type EntityKind, templateFor } from './coa.ts';
import { type AccountRole, type LedgerAccount, NORMAL_SIDE, type PlannedJournal, type PostingPlan } from './types.ts';

export interface PostedLine {
  journalIndex: number;
  entityId: Id;
  accountId: Id;
  side: 'Dr' | 'Cr';
  amount: Paise;
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
  /** Posted events by id, as the database keeps them (txn, journal, open_item, settlement_allocation). */
  readonly events = new Map<Id, PostedEvent>();

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
  postedEvent(txnId: Id): PostedEvent {
    return this.events.get(txnId) ?? fail('NOT_FOUND', 'That entry was not found.', { txnId });
  }

  // ------------------------------------------------------------------------------------------- posting

  /**
   * Applies a checked plan as one posted event (`txnId`, generated when not given); returns the ids of open items it
   * created, in plan order. An unwind is applied first, so a correction's replacement may settle what it gave back.
   */
  apply(plan: PostingPlan, event: { txnId?: Id; intentType?: string } = {}): Id[] {
    const txnId = event.txnId ?? uuidv7();
    if (this.events.has(txnId)) fail('CONFLICT', 'This entry was already posted.');
    const restored = new Map<Id, Paise>();
    for (const a of plan.unwind?.restoredAllocations ?? []) {
      restored.set(a.openItemId, (restored.get(a.openItemId) ?? 0n) + a.amount);
    }
    const settling = new Map<Id, Paise>();
    for (const s of plan.settlements) settling.set(s.openItemId, (settling.get(s.openItemId) ?? 0n) + s.amount);
    for (const [id, amount] of settling) {
      if (amount > this.openItem(id).remaining + (restored.get(id) ?? 0n)) {
        fail('SETTLEMENT_EXCEEDS_REMAINING', 'Settlement exceeds what remains.');
      }
    }
    if (plan.unwind) {
      const original = this.postedEvent(plan.unwind.txnId);
      if (original.status !== 'posted') fail('ALREADY_REVERSED', 'This entry was already reversed or corrected.');
      original.status = plan.journals.some((j) => j.kind !== 'reversal') ? 'corrected' : 'reversed';
      for (const a of plan.unwind.restoredAllocations) {
        const item = this.openItem(a.openItemId);
        item.remaining += a.amount;
        item.status = item.remaining === item.original ? 'open' : 'partially_settled';
      }
      for (const id of plan.unwind.reversedOpenItems) this.openItem(id).status = 'reversed';
    }
    const posted: PostedEvent = {
      txnId,
      intentType: event.intentType ?? 'unknown',
      status: 'posted',
      journals: [],
      createdOpenItems: [],
      allocations: [],
      handovers: [],
    };
    for (const j of plan.journals) {
      const journal = { ...j, id: uuidv7() };
      posted.journals.push(journal);
      const index = this.journals.push(journal) - 1;
      for (const l of j.lines) this.lines.push({ ...l, journalIndex: index });
    }
    for (const s of plan.settlements) {
      const item = this.openItem(s.openItemId);
      item.remaining -= s.amount;
      item.status = item.remaining === 0n ? 'settled' : 'partially_settled';
      posted.allocations.push({ id: uuidv7(), openItemId: s.openItemId, amount: s.amount, kind: s.kind });
    }
    this.events.set(txnId, posted);
    this.lastTxnId = txnId;
    const created = plan.openItems.map((o) => {
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
        debtorFundId: o.debtorFundId,
        creditorFundId: o.creditorFundId,
        status: 'open',
      });
      return id;
    });
    posted.createdOpenItems.push(...created);
    return created;
  }

  /** The event the last `apply` posted. */
  lastTxnId?: Id;

  // ------------------------------------------------------------------------------------------- queries

  /** Balance in the account's normal direction (positive = normal), optionally sliced by dimensions. */
  balance(
    entityId: Id,
    role: AccountRole,
    slice: { locationId?: Id; counterpartyId?: Id; categoryId?: Id; fundId?: Id; code?: string } = {},
  ): Paise {
    let net = 0n;
    for (const l of this.lines) {
      if (l.entityId !== entityId) continue;
      const a = this.account(l.accountId);
      if (a.role !== role) continue;
      if (slice.code && a.code !== slice.code) continue;
      if (slice.locationId && l.locationId !== slice.locationId) continue;
      if (slice.counterpartyId && l.counterpartyId !== slice.counterpartyId) continue;
      if (slice.categoryId && l.categoryId !== slice.categoryId) continue;
      if (slice.fundId && l.fundId !== slice.fundId) continue;
      const normal = NORMAL_SIDE[a.cls];
      net += l.side === normal ? l.amount : -l.amount;
    }
    return net;
  }

  /** Total money at a location across every owner, or for one owner. */
  moneyAt(locationId: Id, entityId?: Id): Paise {
    let net = 0n;
    for (const l of this.lines) {
      if (l.locationId !== locationId) continue;
      if (entityId && l.entityId !== entityId) continue;
      net += l.side === 'Dr' ? l.amount : -l.amount;
    }
    return net;
  }

  trialBalance(entityId: Id): { debits: Paise; credits: Paise } {
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
  owed(debtorId: Id, creditorId: Id): Paise {
    let total = 0n;
    for (const o of this.openItems.values()) {
      if (o.debtorId === debtorId && o.creditorId === creditorId && o.status !== 'reversed') total += o.remaining;
    }
    return total;
  }
}
