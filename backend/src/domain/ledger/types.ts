import type { Id } from '../ids.ts';
import type { Rupees } from '../money.ts';

export type Side = 'Dr' | 'Cr';

/** Computational account classes (RULEBOOK-01 §4). The class, never the sign of a balance, decides meaning. */
export type AccountClass =
  | 'asset'
  | 'contra_asset'
  | 'liability'
  | 'equity'
  | 'drawings'
  | 'revenue'
  | 'expense'
  | 'cogs';

export const NORMAL_SIDE: Record<AccountClass, Side> = {
  asset: 'Dr',
  contra_asset: 'Cr',
  liability: 'Cr',
  equity: 'Cr',
  drawings: 'Dr',
  revenue: 'Cr',
  expense: 'Dr',
  cogs: 'Dr',
};

/** Temporary accounts are closed at period end; permanent ones carry forward (RULEBOOK-01 §67). */
export function isTemporary(cls: AccountClass): boolean {
  return cls === 'revenue' || cls === 'expense' || cls === 'cogs';
}

/**
 * System roles let the engine find an entity's account without knowing its id. A role says which dimension a line
 * on that account must carry: money accounts need a location, party accounts need a counterparty.
 */
export type AccountRole =
  | 'cash'
  | 'bank'
  | 'wallet'
  | 'interentity_receivable'
  | 'advances_given'
  | 'loans_given'
  | 'customer_receivable'
  | 'investment_in_firms'
  | 'cash_in_transit'
  | 'suspense'
  | 'interentity_payable'
  | 'supplier_payable'
  | 'loans_taken'
  | 'advances_received'
  | 'owner_capital'
  | 'owner_drawings'
  | 'opening_balance_equity'
  | 'retained_earnings'
  | 'revenue'
  | 'expense';

export type Dimension = 'location' | 'counterparty' | 'category';

export const ROLE_REQUIRES: Record<AccountRole, readonly Dimension[]> = {
  cash: ['location'],
  bank: ['location'],
  wallet: ['location'],
  interentity_receivable: ['counterparty'],
  advances_given: ['counterparty'],
  loans_given: ['counterparty'],
  customer_receivable: ['counterparty'],
  investment_in_firms: ['counterparty'],
  cash_in_transit: [],
  suspense: [],
  interentity_payable: ['counterparty'],
  supplier_payable: ['counterparty'],
  loans_taken: ['counterparty'],
  advances_received: ['counterparty'],
  owner_capital: ['counterparty'],
  owner_drawings: ['counterparty'],
  opening_balance_equity: [],
  retained_earnings: [],
  revenue: ['category'],
  expense: ['category'],
};

export interface LedgerAccount {
  id: Id;
  entityId: Id;
  code: string;
  name: string;
  cls: AccountClass;
  role: AccountRole;
  active: boolean;
}

export interface PlannedLine {
  entityId: Id;
  accountId: Id;
  side: Side;
  amount: Rupees;
  fundId: Id;
  locationId?: Id;
  counterpartyId?: Id;
  categoryId?: Id;
  projectId?: Id;
  /** Who physically held the cash at the location when posted (snapshot from the location's holder history). */
  holderPersonId?: Id;
  memo?: string;
}

export type JournalKind =
  | 'standard'
  | 'transfer'
  | 'settlement'
  | 'opening'
  | 'adjusting'
  | 'closing'
  | 'reversal'
  | 'correction';

export interface PlannedJournal {
  entityId: Id;
  kind: JournalKind;
  /** Order of journals inside one master event; through-owner flows have two linked steps. */
  step: number;
  lines: PlannedLine[];
}

export type OpenItemKind =
  | 'interentity' // one entity owes another (expense paid on behalf, own/personal money, current account)
  | 'supplier_payable'
  | 'customer_receivable'
  | 'advance'
  | 'loan';

/** An obligation with explicit direction (RULEBOOK-02 §169): the debtor owes the creditor. */
export interface PlannedOpenItem {
  kind: OpenItemKind;
  debtorId: Id;
  creditorId: Id;
  amount: Rupees;
  /** Which account each side carries it on, so a settlement can post the right lines later. */
  debtorRole?: AccountRole;
  creditorRole?: AccountRole;
  reason: string;
}

export interface PlannedSettlement {
  openItemId: Id;
  amount: Rupees;
}

export interface PostingPlan {
  journals: PlannedJournal[];
  openItems: PlannedOpenItem[];
  settlements: PlannedSettlement[];
}
