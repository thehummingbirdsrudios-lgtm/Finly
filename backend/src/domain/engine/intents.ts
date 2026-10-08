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

export interface NonOwnerPaymentIntent {
  type: 'nonowner_payment';
  firmId: Id;
  sourceLocationId: Id;
  recipientId: Id;
  route: 'direct' | 'through_owner';
  treatment: 'own' | 'expense';
  amount: Rupees;
  /** Required for treatment = expense. */
  categoryId?: Id;
  /** Required for route = through_owner. */
  ownerId?: Id;
  /** The owner's cash-in-hand location (through owner). */
  ownerCashLocationId?: Id;
  /** The recipient's cash-in-hand location (treatment = own). */
  recipientCashLocationId?: Id;
  fundId?: Id;
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

export interface InterEntityTransferIntent {
  type: 'interentity_transfer';
  from: MoneyAt;
  to: MoneyAt;
  amount: Rupees;
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
  | NonOwnerPaymentIntent
  | IncomeIntent
  | UnidentifiedReceiptIntent
  | AdvanceGiveIntent
  | AdvanceAccountIntent
  | LoanIntent
  | LoanRepaymentIntent
  | CapitalIntent
  | WithdrawalIntent
  | InterEntityTransferIntent
  | SettlementIntent
  | OffsetIntent
  | OpeningBalanceIntent
  | CashAdjustmentIntent;
