/**
 * Chart-of-accounts templates (ACCOUNTING-ENGINE.md §3). Created for every entity with books; admins may rename labels
 * and add or deactivate accounts, never delete referenced ones. Codes are stable identifiers within an entity.
 */
import type { AccountClass, AccountRole } from './types.ts';

export type EntityKind = 'firm' | 'person' | 'pool' | 'party';

export interface AccountTemplate {
  code: string;
  name: string;
  cls: AccountClass;
  role: AccountRole;
  /** Which entity kinds get this account. */
  kinds: readonly EntityKind[];
}

const BOOKS: readonly EntityKind[] = ['firm', 'person', 'pool'];
const FIRM: readonly EntityKind[] = ['firm'];
const PERSONAL: readonly EntityKind[] = ['person', 'pool'];

export const ACCOUNT_TEMPLATE: readonly AccountTemplate[] = [
  { code: '1100', name: 'Cash', cls: 'asset', role: 'cash', kinds: BOOKS },
  { code: '1200', name: 'Bank', cls: 'asset', role: 'bank', kinds: BOOKS },
  { code: '1250', name: 'Wallet / UPI balance', cls: 'asset', role: 'wallet', kinds: BOOKS },
  { code: '1300', name: 'Inter-entity receivable', cls: 'asset', role: 'interentity_receivable', kinds: BOOKS },
  { code: '1310', name: 'Advances given', cls: 'asset', role: 'advances_given', kinds: BOOKS },
  { code: '1320', name: 'Loans given', cls: 'asset', role: 'loans_given', kinds: BOOKS },
  { code: '1330', name: 'Customer receivable', cls: 'asset', role: 'customer_receivable', kinds: BOOKS },
  { code: '1340', name: 'Investment in firms', cls: 'asset', role: 'investment_in_firms', kinds: PERSONAL },
  { code: '1390', name: 'Cash in transit', cls: 'asset', role: 'cash_in_transit', kinds: BOOKS },
  { code: '1900', name: 'Suspense (unidentified money)', cls: 'asset', role: 'suspense', kinds: BOOKS },
  { code: '2100', name: 'Inter-entity payable', cls: 'liability', role: 'interentity_payable', kinds: BOOKS },
  { code: '2110', name: 'Supplier payable', cls: 'liability', role: 'supplier_payable', kinds: BOOKS },
  { code: '2120', name: 'Loans taken', cls: 'liability', role: 'loans_taken', kinds: BOOKS },
  { code: '2130', name: 'Advances received', cls: 'liability', role: 'advances_received', kinds: BOOKS },
  { code: '3100', name: 'Owner capital', cls: 'equity', role: 'owner_capital', kinds: FIRM },
  { code: '3150', name: 'Owner drawings', cls: 'drawings', role: 'owner_drawings', kinds: FIRM },
  { code: '3160', name: 'Profit distributions', cls: 'drawings', role: 'owner_distributions', kinds: FIRM },
  { code: '3200', name: 'Opening balance equity', cls: 'equity', role: 'opening_balance_equity', kinds: BOOKS },
  { code: '3300', name: 'Retained earnings', cls: 'equity', role: 'retained_earnings', kinds: BOOKS },
  { code: '4100', name: 'Sales', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4200', name: 'Service income', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4300', name: 'Commission and brokerage', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4400', name: 'Interest income', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4500', name: 'Rental income', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4600', name: 'Salary income', cls: 'revenue', role: 'revenue', kinds: PERSONAL },
  { code: '4700', name: 'Profit share and distributions received', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4800', name: 'Gifts received', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '4900', name: 'Other income', cls: 'revenue', role: 'revenue', kinds: BOOKS },
  { code: '5100', name: 'Travel and conveyance', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5150', name: 'Hotel and lodging', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5200', name: 'Food and refreshments', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5250', name: 'Fuel', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5300', name: 'Salary and wages', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5350', name: 'Rent', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5400', name: 'Utilities', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5450', name: 'Professional fees', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5500', name: 'Repairs and maintenance', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5550', name: 'Bank charges', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5600', name: 'Marketing', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5650', name: 'Firm charges and commission paid', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5700', name: 'Courier and transport', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5800', name: 'Interest expense', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5850', name: 'Gifts and donations', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5890', name: 'Other expenses', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5900', name: 'Cash over / short', cls: 'expense', role: 'expense', kinds: BOOKS },
  { code: '5950', name: 'Bad debts and write-offs', cls: 'expense', role: 'expense', kinds: BOOKS },
];

export const CODES = {
  interestIncome: '4400',
  interestExpense: '5800',
  cashOverShort: '5900',
} as const;

/** Category master seed: each category posts to one account code (category ≠ account, RULEBOOK-01 §105). */
export interface CategoryTemplate {
  key: string;
  name: string;
  kind: 'expense' | 'income';
  accountCode: string;
}

export const CATEGORY_TEMPLATE: readonly CategoryTemplate[] = [
  { key: 'travel', name: 'Travel', kind: 'expense', accountCode: '5100' },
  { key: 'local_transport', name: 'Local transport', kind: 'expense', accountCode: '5100' },
  { key: 'hotel', name: 'Hotel', kind: 'expense', accountCode: '5150' },
  { key: 'food', name: 'Food', kind: 'expense', accountCode: '5200' },
  { key: 'petrol', name: 'Petrol', kind: 'expense', accountCode: '5250' },
  { key: 'salary', name: 'Salary', kind: 'expense', accountCode: '5300' },
  { key: 'labour', name: 'Labour', kind: 'expense', accountCode: '5300' },
  { key: 'rent', name: 'Rent', kind: 'expense', accountCode: '5350' },
  { key: 'electricity', name: 'Electricity', kind: 'expense', accountCode: '5400' },
  { key: 'internet', name: 'Internet', kind: 'expense', accountCode: '5400' },
  { key: 'professional_fees', name: 'Professional fees', kind: 'expense', accountCode: '5450' },
  { key: 'repairs', name: 'Repairs', kind: 'expense', accountCode: '5500' },
  { key: 'bank_charges', name: 'Bank charges', kind: 'expense', accountCode: '5550' },
  { key: 'marketing', name: 'Marketing', kind: 'expense', accountCode: '5600' },
  { key: 'firm_charges', name: 'Firm charges', kind: 'expense', accountCode: '5650' },
  { key: 'courier', name: 'Courier', kind: 'expense', accountCode: '5700' },
  { key: 'other_expense', name: 'Other expense', kind: 'expense', accountCode: '5890' },
  { key: 'interest_paid', name: 'Interest paid', kind: 'expense', accountCode: '5800' },
  { key: 'cash_difference', name: 'Cash difference', kind: 'expense', accountCode: '5900' },
  { key: 'bad_debt', name: 'Bad debt', kind: 'expense', accountCode: '5950' },
  { key: 'gifts_given', name: 'Gifts given', kind: 'expense', accountCode: '5850' },
  { key: 'donations', name: 'Donations', kind: 'expense', accountCode: '5850' },
  { key: 'sales', name: 'Sales', kind: 'income', accountCode: '4100' },
  { key: 'service', name: 'Service income', kind: 'income', accountCode: '4200' },
  { key: 'commission', name: 'Commission', kind: 'income', accountCode: '4300' },
  { key: 'interest', name: 'Interest', kind: 'income', accountCode: '4400' },
  { key: 'rent_received', name: 'Rent received', kind: 'income', accountCode: '4500' },
  { key: 'salary_received', name: 'Salary received', kind: 'income', accountCode: '4600' },
  { key: 'distribution_received', name: 'Profit share received', kind: 'income', accountCode: '4700' },
  { key: 'gift_received', name: 'Gift received', kind: 'income', accountCode: '4800' },
  { key: 'other_income', name: 'Other income', kind: 'income', accountCode: '4900' },
];

export function templateFor(kind: EntityKind): AccountTemplate[] {
  return ACCOUNT_TEMPLATE.filter((t) => t.kinds.includes(kind));
}
