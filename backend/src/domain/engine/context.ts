/**
 * What the engine needs to know about the world. The engine itself is pure: the posting service loads this context
 * from the database (or a test builds it in memory) and passes it in.
 */
import type { Id } from '../ids.ts';
import type { Paise } from '../money.ts';
import type { EntityKind } from '../ledger/coa.ts';
import type { AccountRole, LedgerAccount, OpenItemKind, PlannedJournal, SettlementKind } from '../ledger/types.ts';

export interface EntityInfo {
  id: Id;
  kind: EntityKind;
  name: string;
  active: boolean;
  defaultFundId: Id;
}

export type LocationKind = 'cash' | 'bank' | 'wallet';

export interface LocationInfo {
  id: Id;
  kind: LocationKind;
  name: string;
  active: boolean;
  /** Who holds the key or the cash right now; undefined when the location is unassigned. */
  currentHolderId?: Id;
}

export interface CategoryInfo {
  id: Id;
  kind: 'expense' | 'income';
  name: string;
  accountCode: string;
  active: boolean;
}

export type OpenItemStatus = 'open' | 'partially_settled' | 'settled' | 'reversed' | 'written_off';

export interface OpenItemInfo {
  id: Id;
  kind: OpenItemKind;
  debtorId: Id;
  creditorId: Id;
  original: Paise;
  remaining: Paise;
  debtorRole?: AccountRole;
  creditorRole?: AccountRole;
  debtorFundId?: Id;
  creditorFundId?: Id;
  status: OpenItemStatus;
}

/** A journal as it was posted, with its id (a reversal points at what it mirrors). */
export interface PostedJournal extends PlannedJournal {
  id: Id;
}

export type HandoverStatus = 'recorded' | 'awaiting_confirmation' | 'confirmed' | 'disputed' | 'cancelled';

/** A posted event as a reversal or correction sees it: what it posted, created and settled (RULEBOOK-01 §56–57). */
export interface PostedEvent {
  txnId: Id;
  intentType: string;
  status: string;
  journals: PostedJournal[];
  /** Open items the event created. */
  createdOpenItems: Id[];
  /** What the event settled and has not been given back (never `reversal` allocations themselves). */
  allocations: { id: Id; openItemId: Id; amount: Paise; kind: SettlementKind }[];
  /** Handovers (custody events) the event recorded, with their state now. */
  handovers: { id: Id; status: HandoverStatus }[];
}

export interface EngineContext {
  entity(id: Id): EntityInfo;
  location(id: Id): LocationInfo;
  category(id: Id): CategoryInfo;
  /** Seeded categories by their stable key (e.g. `interest`, `interest_paid`, `cash_difference`). */
  categoryByKey(key: string): CategoryInfo;
  account(id: Id): LedgerAccount;
  accountByRole(entityId: Id, role: AccountRole): LedgerAccount;
  accountByCode(entityId: Id, code: string): LedgerAccount;
  /** True when the person is an owner or partner of the firm on the posting date. */
  isOwner(firmId: Id, personId: Id): boolean;
  openItem(id: Id): OpenItemInfo;
  /** A posted event, for reversing or correcting it. */
  postedEvent(txnId: Id): PostedEvent;
}

export const MONEY_ROLE: Record<LocationKind, AccountRole> = {
  cash: 'cash',
  bank: 'bank',
  wallet: 'wallet',
};
