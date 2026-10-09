/**
 * Business intents: what happened in the real world, in the user's terms (source, destination, owner, purpose,
 * amount). The engine turns an intent into balanced journals (ACCOUNTING-ENGINE.md §5). Amounts are whole rupees.
 */
import type { Id } from '../ids.ts';
import type { Rupees } from '../money.ts';

/** Money leaving or entering a place in some entity's books. */
export interface MoneyAt {
  entityId: Id;
  locationId: Id;
  fundId?: Id;
}

export interface TransferIntent {
  type: 'transfer';
  entityId: Id;
  fromLocationId: Id;
  toLocationId: Id;
  amount: Rupees;
  fundId?: Id;
  /** Only when the handover-confirmation policy is ON: the money waits in transit until the receiver confirms. */
  viaTransit?: boolean;
}

export interface TransitConfirmIntent {
  type: 'transit_confirm';
  entityId: Id;
  toLocationId: Id;
  amount: Rupees;
  fundId?: Id;
}

export interface ExpenseSource extends MoneyAt {
  amount: Rupees;
}

export interface ExpenseAllocation {
  /** Who the expense belongs to: personal (a person), a firm, or any other entity with books. */
  ownerId: Id;
  categoryId: Id;
  amount: Rupees;
  fundId?: Id;
  projectId?: Id;
  /** F8: required when a firm's money pays a personal expense of one of its owners. */
  ownerPersonalTreatment?: 'withdrawal' | 'owes';
}

export interface ExpenseIntent {
  type: 'expense';
  sources: ExpenseSource[];
  allocations: ExpenseAllocation[];
}

export interface BillIntent {
  type: 'bill';
  ownerId: Id;
  supplierId: Id;
  lines: { categoryId: Id; amount: Rupees; fundId?: Id; projectId?: Id }[];
}

/**
 * What money given actually is (D-039, GATE-RESPONSE-05 §2–§3). Always chosen by the user, never inferred from the
 * parties, the amount or one side's treatment. A repayment of an existing debt is not here: it is a settlement.
 */
export const GIVE_PURPOSES = [
  'loan',
  'drawings',
  'capital',
  'distribution',
  'remuneration',
  'reimbursement',
  'gift',
  'donation',
  'business_expense',
  'personal_benefit',
] as const;
export type GivePurpose = typeof GIVE_PURPOSES[number];

/**
 * Money given from one entity to another (F8 firm → owner, F9 owner → anyone; docs/accounting/F8-F9-model.md). The
 * purpose, whether it is repayable, and each side's treatment are explicit and validated together (§6 of the model);
 * nothing is inferred from the parties or the amount.
 */
export interface GiveIntent {
  type: 'give';
  giverId: Id;
  /** The giver's place the money leaves from. */
  giverLocationId: Id;
  giverFundId?: Id;
  /** What the money is. Required. */
  purpose?: GivePurpose;
  /** Whether the receiver must pay it back — recorded separately from the purpose. Required. */
  repayable?: boolean;
  /** `expense`: spent for good in the giver's books. `own`: still the giver's value (owed back, drawings, capital). */
  giverSide?: 'own' | 'expense';
  /** The giver's expense category (giverSide = expense). */
  giverCategoryId?: Id;
  receiverId: Id;
  /** Required when the receiver keeps books: `own` = the money arrives in a place; `expense` = spent on its expense. */
  receiverSide?: 'own' | 'expense';
  /** Where the money arrives (receiverSide = own). */
  receiverLocationId?: Id;
  receiverFundId?: Id;
  /** The receiver's expense category (receiverSide = expense). */
  receiverExpenseCategoryId?: Id;
  /** The receiver's income category, chosen explicitly (remuneration, distribution, gift, donation, sale, benefit). */
  receiverIncomeCategoryId?: Id;
  /** Reimbursement: the receiver's own expense category that the reimbursement recovers. */
  receiverRecoveryCategoryId?: Id;
  amount: Rupees;
}

export interface IncomeIntent {
  type: 'income';
  ownerId: Id;
  categoryId: Id;
  amount: Rupees;
  fundId?: Id;
  /** Where the money landed — possibly in someone else's books — or on credit from a customer. */
  receivedAt?: MoneyAt;
  customerId?: Id;
}

export interface UnidentifiedReceiptIntent {
  type: 'unidentified_receipt';
  entityId: Id;
  locationId: Id;
  amount: Rupees;
}

export interface AdvanceGiveIntent {
  type: 'advance_give';
  giverId: Id;
  fromLocationId: Id;
  holderId: Id;
  amount: Rupees;
  fundId?: Id;
}

export interface AdvanceAccountIntent {
  type: 'advance_account';
  advanceOpenItemId: Id;
  uses: { categoryId: Id; amount: Rupees }[];
  returned?: { amount: Rupees; toLocationId: Id };
  /** When the holder spent more than the advance from their own money. */
  overspendFromLocationId?: Id;
}

export interface LoanIntent {
  type: 'loan';
  lenderId: Id;
  borrowerId: Id;
  amount: Rupees;
  lenderLocationId?: Id;
  borrowerLocationId?: Id;
}

export interface LoanRepaymentIntent {
  type: 'loan_repayment';
  loanOpenItemId: Id;
  principal: Rupees;
  interest: Rupees;
  payerLocationId?: Id;
  payeeLocationId?: Id;
}

export interface CapitalIntent {
  type: 'capital_contribution';
  personId: Id;
  firmId: Id;
  amount: Rupees;
  personLocationId: Id;
  firmLocationId: Id;
}

export interface WithdrawalIntent {
  type: 'withdrawal';
  firmId: Id;
  personId: Id;
  amount: Rupees;
  firmLocationId: Id;
  personLocationId: Id;
}

export interface SettlementIntent {
  type: 'settlement';
  payerId: Id;
  payeeId: Id;
  payerLocationId?: Id;
  payeeLocationId?: Id;
  allocations: { openItemId: Id; amount: Rupees }[];
}

export interface OffsetIntent {
  type: 'offset';
  itemAId: Id;
  itemBId: Id;
  amount: Rupees;
}

export interface OpeningBalanceIntent {
  type: 'opening_balance';
  entityId: Id;
  locationId: Id;
  amount: Rupees;
  fundId?: Id;
}

export interface CashAdjustmentIntent {
  type: 'cash_adjustment';
  entityId: Id;
  locationId: Id;
  amount: Rupees;
  direction: 'short' | 'over';
  categoryId: Id;
}

export type Intent =
  | TransferIntent
  | TransitConfirmIntent
  | ExpenseIntent
  | BillIntent
  | GiveIntent
  | IncomeIntent
  | UnidentifiedReceiptIntent
  | AdvanceGiveIntent
  | AdvanceAccountIntent
  | LoanIntent
  | LoanRepaymentIntent
  | CapitalIntent
  | WithdrawalIntent
  | SettlementIntent
  | OffsetIntent
  | OpeningBalanceIntent
  | CashAdjustmentIntent;
