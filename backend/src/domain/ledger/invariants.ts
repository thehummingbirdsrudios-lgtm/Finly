/**
 * Hard posting invariants (BUILD_PROMPT AC6, RULEBOOK-01 §2, §54, §93). Any violation rejects the whole operation;
 * nothing is ever auto-fixed.
 */
import { fail } from '../errors.ts';
import { MAX_AMOUNT, type Rupees } from '../money.ts';
import type { EngineContext } from '../engine/context.ts';
import { type PlannedJournal, type PostingPlan, ROLE_REQUIRES } from './types.ts';

const MONEY_ROLES = new Set(['cash', 'bank', 'wallet']);

export function checkJournal(journal: PlannedJournal, ctx: EngineContext): void {
  if (journal.lines.length < 2) fail('UNBALANCED_JOURNAL', 'This entry could not be balanced.', { reason: 'lines' });
  let dr = 0n;
  let cr = 0n;
  const perFund = new Map<string, Rupees>();
  for (const line of journal.lines) {
    if (typeof line.amount !== 'bigint' || line.amount <= 0n || line.amount > MAX_AMOUNT) {
      fail('AMOUNT_INVALID', 'Every amount must be a whole number of rupees above zero.');
    }
    if (line.entityId !== journal.entityId) fail('UNBALANCED_JOURNAL', 'This entry could not be balanced.');
    const account = ctx.account(line.accountId);
    if (account.entityId !== line.entityId) fail('ACCOUNT_NOT_FOUND', 'An account in this entry belongs elsewhere.');
    if (!account.active) {
      fail('ACCOUNT_INACTIVE', `The account "${account.name}" is no longer active.`, { accountId: account.id });
    }
    for (const dim of ROLE_REQUIRES[account.role]) {
      const present = dim === 'location'
        ? line.locationId
        : dim === 'counterparty'
        ? line.counterpartyId
        : line.categoryId;
      if (!present) fail('DIMENSION_MISSING', 'Some details of this entry are missing.', { dim, role: account.role });
    }
    if (line.locationId && !MONEY_ROLES.has(account.role)) {
      fail('DIMENSION_MISSING', 'A place can only be set on cash, bank or wallet lines.', { role: account.role });
    }
    const signed = line.side === 'Dr' ? line.amount : -line.amount;
    if (line.side === 'Dr') dr += line.amount;
    else cr += line.amount;
    perFund.set(line.fundId, (perFund.get(line.fundId) ?? 0n) + signed);
  }
  if (dr !== cr) fail('UNBALANCED_JOURNAL', 'This entry could not be balanced.', { debits: dr, credits: cr });
  for (const [fundId, net] of perFund) {
    if (net !== 0n) fail('UNBALANCED_JOURNAL', 'This entry does not balance within its fund.', { fundId });
  }
}

export function checkPlan(plan: PostingPlan, ctx: EngineContext): void {
  if (plan.journals.length === 0) fail('VALIDATION', 'There is nothing to post.');
  for (const journal of plan.journals) checkJournal(journal, ctx);
  for (const item of plan.openItems) {
    if (item.amount <= 0n) fail('AMOUNT_INVALID', 'An amount owed must be more than zero.');
    if (item.debtorId === item.creditorId) fail('VALIDATION', 'Someone cannot owe themselves.');
  }
}
