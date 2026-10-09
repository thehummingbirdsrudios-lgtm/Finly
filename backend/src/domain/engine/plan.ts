/**
 * The posting planner: business intent → balanced journals, open items and settlements (ACCOUNTING-ENGINE.md §5).
 * Pure and deterministic. Every plan is checked by `checkPlan` before it is returned.
 */
import { fail } from '../errors.ts';
import type { Id } from '../ids.ts';
import { checkRupees, formatInr, type Rupees, sum } from '../money.ts';
import { checkPlan } from '../ledger/invariants.ts';
import type {
  AccountRole,
  JournalKind,
  LegRef,
  OpenItemKind,
  PlannedJournal,
  PlannedLine,
  PlannedOpenItem,
  PlannedSettlement,
  PostingPlan,
  SettlementKind,
  Side,
} from '../ledger/types.ts';
import { type EngineContext, type EntityInfo, MONEY_ROLE } from './context.ts';
import type * as I from './intents.ts';

class PlanBuilder {
  private journals = new Map<string, PlannedJournal>();
  private openItems = new Map<string, PlannedOpenItem>();
  private settlements: PlannedSettlement[] = [];
  /** The intent leg the next lines belong to (expense sources and allocations, bill lines). */
  leg?: LegRef;

  constructor(private ctx: EngineContext, private kind: JournalKind = 'standard') {}

  setKind(kind: JournalKind): void {
    this.kind = kind;
  }

  private journal(entityId: Id, step: number): PlannedJournal {
    const key = `${step}:${entityId}`;
    let j = this.journals.get(key);
    if (!j) {
      j = { entityId, kind: this.kind, step, lines: [] };
      this.journals.set(key, j);
    }
    return j;
  }

  fund(entityId: Id, fundId?: Id): Id {
    return fundId ?? this.ctx.entity(entityId).defaultFundId;
  }

  /** A cash/bank/wallet line at a location, with the location's current holder recorded. */
  money(entityId: Id, locationId: Id, side: Side, amount: Rupees, fundId?: Id, step = 1): void {
    const loc = this.ctx.location(locationId);
    if (!loc.active) fail('LOCATION_INACTIVE', `"${loc.name}" is no longer in use.`, { locationId });
    const account = this.ctx.accountByRole(entityId, MONEY_ROLE[loc.kind]);
    this.push(entityId, step, {
      entityId,
      accountId: account.id,
      side,
      amount,
      fundId: this.fund(entityId, fundId),
      locationId,
      holderPersonId: loc.currentHolderId,
    });
  }

  party(entityId: Id, role: AccountRole, counterpartyId: Id, side: Side, amount: Rupees, fundId?: Id, step = 1): void {
    const account = this.ctx.accountByRole(entityId, role);
    this.push(entityId, step, {
      entityId,
      accountId: account.id,
      side,
      amount,
      fundId: this.fund(entityId, fundId),
      counterpartyId,
    });
  }

  plain(entityId: Id, role: AccountRole, side: Side, amount: Rupees, fundId?: Id, step = 1): void {
    const account = this.ctx.accountByRole(entityId, role);
    this.push(entityId, step, { entityId, accountId: account.id, side, amount, fundId: this.fund(entityId, fundId) });
  }

  category(
    entityId: Id,
    categoryId: Id,
    expected: 'expense' | 'income',
    side: Side,
    amount: Rupees,
    fundId?: Id,
    projectId?: Id,
    step = 1,
  ): void {
    const cat = this.ctx.category(categoryId);
    if (!cat.active) fail('VALIDATION', `The category "${cat.name}" is no longer in use.`, { categoryId });
    if (cat.kind !== expected) {
      fail('VALIDATION', `"${cat.name}" is not an ${expected} category.`, { categoryId });
    }
    const account = this.ctx.accountByCode(entityId, cat.accountCode);
    this.push(entityId, step, {
      entityId,
      accountId: account.id,
      side,
      amount,
      fundId: this.fund(entityId, fundId),
      categoryId,
      projectId,
    });
  }

  private push(entityId: Id, step: number, line: PlannedLine): void {
    this.journal(entityId, step).lines.push(this.leg ? { ...line, leg: this.leg } : line);
  }

  /**
   * Records who owes whom. Each side that keeps books carries the item in one fund (the fund its line was posted
   * in), so items of different funds are never merged and a settlement clears the item in the same fund.
   */
  owe(
    kind: OpenItemKind,
    debtorId: Id,
    creditorId: Id,
    amount: Rupees,
    reason: string,
    debtorRole?: AccountRole,
    creditorRole?: AccountRole,
    funds: { debtor?: Id; creditor?: Id } = {},
  ): void {
    const debtorFundId = debtorRole ? this.fund(debtorId, funds.debtor) : undefined;
    const creditorFundId = creditorRole ? this.fund(creditorId, funds.creditor) : undefined;
    const key = [kind, debtorId, creditorId, debtorRole, creditorRole, debtorFundId, creditorFundId].join(':');
    const existing = this.openItems.get(key);
    if (existing) existing.amount += amount;
    else {
      this.openItems.set(key, {
        kind,
        debtorId,
        creditorId,
        amount,
        debtorRole,
        creditorRole,
        debtorFundId,
        creditorFundId,
        reason,
      });
    }
  }

  settle(openItemId: Id, amount: Rupees, kind: SettlementKind): void {
    this.settlements.push({ openItemId, amount, kind });
  }

  build(): PostingPlan {
    const journals = [...this.journals.values()].sort((a, b) => a.step - b.step);
    const plan = { journals, openItems: [...this.openItems.values()], settlements: this.settlements };
    checkPlan(plan, this.ctx);
    return plan;
  }
}

function withBooks(ctx: EngineContext, id: Id): EntityInfo {
  const e = ctx.entity(id);
  if (!e.active) fail('ENTITY_INACTIVE', `${e.name} is no longer active.`, { entityId: id });
  if (e.kind === 'party') fail('VALIDATION', `${e.name} does not keep books in Finly.`, { entityId: id });
  return e;
}

function active(ctx: EngineContext, id: Id): EntityInfo {
  const e = ctx.entity(id);
  if (!e.active) fail('ENTITY_INACTIVE', `${e.name} is no longer active.`, { entityId: id });
  return e;
}

function hasBooks(e: EntityInfo): boolean {
  return e.kind !== 'party';
}

// ---------------------------------------------------------------------------------------------- intents

function transfer(ctx: EngineContext, it: I.TransferIntent): PostingPlan {
  checkRupees(it.amount);
  withBooks(ctx, it.entityId);
  if (it.fromLocationId === it.toLocationId) {
    fail('SAME_SOURCE_DESTINATION', 'Choose a different place to move the money to.');
  }
  const b = new PlanBuilder(ctx, 'transfer');
  b.money(it.entityId, it.fromLocationId, 'Cr', it.amount, it.fundId);
  if (it.viaTransit) b.plain(it.entityId, 'cash_in_transit', 'Dr', it.amount, it.fundId);
  else b.money(it.entityId, it.toLocationId, 'Dr', it.amount, it.fundId);
  return b.build();
}

function transitConfirm(ctx: EngineContext, it: I.TransitConfirmIntent): PostingPlan {
  checkRupees(it.amount);
  withBooks(ctx, it.entityId);
  const b = new PlanBuilder(ctx, 'transfer');
  b.money(it.entityId, it.toLocationId, 'Dr', it.amount, it.fundId);
  b.plain(it.entityId, 'cash_in_transit', 'Cr', it.amount, it.fundId);
  return b.build();
}

function expense(ctx: EngineContext, it: I.ExpenseIntent): PostingPlan {
  if (it.sources.length === 0) fail('VALIDATION', 'Choose where the money came from.');
  if (it.allocations.length === 0) fail('VALIDATION', 'Choose who this expense belongs to.');
  it.sources.forEach((s) => checkRupees(s.amount));
  it.allocations.forEach((a) => checkRupees(a.amount));
  const paid = sum(it.sources.map((s) => s.amount));
  const allocated = sum(it.allocations.map((a) => a.amount));
  if (paid !== allocated) {
    fail(
      'ALLOCATION_MISMATCH',
      `The shares add up to ${formatInr(allocated)}, but the expense is ${formatInr(paid)}. ` +
        'Adjust the shares so they match exactly.',
      { paid, allocated, difference: paid - allocated },
    );
  }

  const b = new PlanBuilder(ctx);
  // Match allocations to funding in the order entered (documented, deterministic).
  let si = 0;
  let sourceLeft = it.sources[0].amount;
  for (const [ai, alloc] of it.allocations.entries()) {
    const owner = withBooks(ctx, alloc.ownerId);
    let need = alloc.amount;
    while (need > 0n) {
      const src = it.sources[si];
      const payer = withBooks(ctx, src.entityId);
      const portion = need < sourceLeft ? need : sourceLeft;
      expensePortion(ctx, b, owner, payer, { ...src, index: si }, { ...alloc, index: ai }, portion);
      need -= portion;
      sourceLeft -= portion;
      if (sourceLeft === 0n && si + 1 < it.sources.length) {
        si += 1;
        sourceLeft = it.sources[si].amount;
      }
    }
  }
  return b.build();
}

function expensePortion(
  ctx: EngineContext,
  b: PlanBuilder,
  owner: EntityInfo,
  payer: EntityInfo,
  src: I.ExpenseSource & { index: number },
  alloc: I.ExpenseAllocation & { index: number },
  amount: Rupees,
): void {
  const ownerSide: LegRef = { kind: 'allocation', index: alloc.index };
  const payerSide: LegRef = { kind: 'source', index: src.index };
  if (owner.id === payer.id) {
    if (b.fund(owner.id, alloc.fundId) !== b.fund(payer.id, src.fundId)) {
      fail(
        'FUND_MISMATCH',
        'This expense is charged to a different fund from the one that paid it. ' +
          'Pay it from the same fund, or move the money between funds first.',
        { sourceFundId: src.fundId, allocationFundId: alloc.fundId },
      );
    }
    b.leg = ownerSide;
    b.category(owner.id, alloc.categoryId, 'expense', 'Dr', amount, alloc.fundId, alloc.projectId);
    b.leg = payerSide;
    b.money(payer.id, src.locationId, 'Cr', amount, src.fundId);
    b.leg = undefined;
    return;
  }
  const ownersPersonal = payer.kind === 'firm' && owner.kind === 'person' && ctx.isOwner(payer.id, owner.id);
  if (ownersPersonal) {
    if (!alloc.ownerPersonalTreatment) {
      fail(
        'CLASSIFICATION_REQUIRED',
        `${payer.name}'s money is paying ${owner.name}'s personal expense. ` +
          'Choose whether it is a withdrawal or an amount owed back to the firm.',
        { question: 'owner_personal_treatment', payerId: payer.id, ownerId: owner.id },
      );
    }
    if (alloc.ownerPersonalTreatment === 'withdrawal') {
      b.leg = payerSide;
      b.party(payer.id, 'owner_drawings', owner.id, 'Dr', amount, src.fundId);
      b.money(payer.id, src.locationId, 'Cr', amount, src.fundId);
      b.leg = ownerSide;
      b.category(owner.id, alloc.categoryId, 'expense', 'Dr', amount, alloc.fundId, alloc.projectId);
      b.party(owner.id, 'investment_in_firms', payer.id, 'Cr', amount, alloc.fundId);
      b.leg = undefined;
      return;
    }
  }
  // General case: the owner records the expense and owes the payer.
  b.leg = ownerSide;
  b.category(owner.id, alloc.categoryId, 'expense', 'Dr', amount, alloc.fundId, alloc.projectId);
  b.party(owner.id, 'interentity_payable', payer.id, 'Cr', amount, alloc.fundId);
  b.leg = payerSide;
  b.party(payer.id, 'interentity_receivable', owner.id, 'Dr', amount, src.fundId);
  b.money(payer.id, src.locationId, 'Cr', amount, src.fundId);
  b.leg = undefined;
  b.owe(
    'interentity',
    owner.id,
    payer.id,
    amount,
    `${payer.name} paid an expense of ${owner.name}`,
    'interentity_payable',
    'interentity_receivable',
    { debtor: alloc.fundId, creditor: src.fundId },
  );
}

function bill(ctx: EngineContext, it: I.BillIntent): PostingPlan {
  const owner = withBooks(ctx, it.ownerId);
  const supplier = active(ctx, it.supplierId);
  if (hasBooks(supplier)) {
    fail('VALIDATION', 'A bill from an entity with books is an inter-entity expense; record it as an expense.');
  }
  if (it.lines.length === 0) fail('VALIDATION', 'Add at least one line to the bill.');
  it.lines.forEach((l) => checkRupees(l.amount));
  const b = new PlanBuilder(ctx);
  const byFund = new Map<Id, Rupees>();
  for (const [index, l] of it.lines.entries()) {
    b.leg = { kind: 'allocation', index };
    b.category(owner.id, l.categoryId, 'expense', 'Dr', l.amount, l.fundId, l.projectId);
    const f = b.fund(owner.id, l.fundId);
    byFund.set(f, (byFund.get(f) ?? 0n) + l.amount);
  }
  b.leg = undefined;
  // One payable, and one open item, per fund the bill is charged to.
  for (const [fundId, amount] of byFund) {
    b.party(owner.id, 'supplier_payable', supplier.id, 'Cr', amount, fundId);
    b.owe(
      'supplier_payable',
      owner.id,
      supplier.id,
      amount,
      `Bill from ${supplier.name}`,
      'supplier_payable',
      undefined,
      {
        debtor: fundId,
      },
    );
  }
  return b.build();
}

/** How each purpose reads in a message ("A loan …"). */
const PURPOSE_LABEL: Record<I.GivePurpose, string> = {
  loan: 'A loan',
  drawings: 'A drawing',
  capital: 'Capital',
  distribution: 'A distribution of profit',
  remuneration: 'Remuneration',
  reimbursement: 'A reimbursement',
  gift: 'A gift',
  donation: 'A donation',
  business_expense: 'A business expense',
  personal_benefit: 'A personal benefit',
};

/** Purposes where the giver keeps the value (a receivable, its equity or an investment) rather than spending it. */
const GIVER_KEEPS: ReadonlySet<I.GivePurpose> = new Set(['drawings', 'capital', 'distribution']);

/**
 * Money given from one entity to another — F8 (firm → owner) and F9 (owner → anyone) alike, as two independent
 * events (docs/accounting/F8-F9-model.md). The purpose, whether it is repayable, the giver's side and the receiver's
 * side are explicit and validated together against the parties (D-039, §6 of the model): a missing choice is
 * CLASSIFICATION_REQUIRED, an incoherent one CLASSIFICATION_CONFLICT. Only a repayable gift of money creates a debt,
 * and the receiver's income is always a category the user chose, never a mirror of the giver's expense.
 */
function give(ctx: EngineContext, it: I.GiveIntent): PostingPlan {
  checkRupees(it.amount);
  const giver = withBooks(ctx, it.giverId);
  const receiver = active(ctx, it.receiverId);
  if (giver.id === receiver.id) fail('SAME_SOURCE_DESTINATION', 'Money is given to someone else.');
  const books = hasBooks(receiver);
  const ask = (question: string, message: string): never =>
    fail('CLASSIFICATION_REQUIRED', message, { question, giverId: giver.id, receiverId: receiver.id });
  const conflict = (message: string): never => fail('CLASSIFICATION_CONFLICT', message);

  if (!it.purpose) {
    ask(
      'purpose',
      'Say what this money is: a loan, drawings, capital, a distribution of profit, remuneration, a reimbursement, ' +
        'a gift, a donation, a business expense or a personal benefit.',
    );
  }
  const purpose = it.purpose!;
  if (!PURPOSE_LABEL[purpose]) fail('VALIDATION', 'This purpose is not supported.', { purpose });
  const label = PURPOSE_LABEL[purpose];
  if (it.repayable === undefined) ask('repayable', `Say whether ${receiver.name} has to pay this back.`);
  const repayable = it.repayable!;
  checkGivePurpose(ctx, giver, receiver, purpose, repayable, conflict);

  const giverKeeps = repayable || GIVER_KEEPS.has(purpose);
  if (!it.giverSide) ask('giver_side', `Choose how ${giver.name} records this: Own or Expense.`);
  if (giverKeeps && it.giverSide !== 'own') {
    conflict(
      repayable
        ? `Money that is paid back is not spent. Choose Own for ${giver.name}.`
        : `${label} is not an expense of ${giver.name}. Choose Own.`,
    );
  }
  if (!giverKeeps && it.giverSide !== 'expense') {
    conflict(
      `${label} that is not paid back leaves ${giver.name} for good. Choose Expense, ` +
        'or say it is repayable if it has to come back.',
    );
  }
  if (books && !it.receiverSide) ask('receiver_side', `Choose how ${receiver.name} records this: Own or Expense.`);
  const receiverCredit = repayable
    ? 'payable'
    : purpose === 'drawings'
    ? 'investment'
    : purpose === 'capital'
    ? 'capital'
    : purpose === 'reimbursement'
    ? 'recovery'
    : 'income';
  if (receiverCredit !== 'income' && it.receiverIncomeCategoryId) {
    conflict(`${label} ${repayable ? 'that is paid back ' : ''}is not income for ${receiver.name}.`);
  }
  if (receiverCredit !== 'recovery' && it.receiverRecoveryCategoryId) {
    conflict('Only a reimbursement recovers an expense of the receiver.');
  }
  if (purpose === 'reimbursement' && it.receiverSide === 'expense') {
    conflict(`A reimbursement repays money ${receiver.name} already spent. Choose Own for ${receiver.name}.`);
  }

  const b = new PlanBuilder(ctx);
  const gf = it.giverFundId;
  const rf = it.receiverFundId;

  // The giver's books: the money leaves, and what it became.
  b.leg = { kind: 'source', index: 0 };
  if (repayable) {
    b.party(giver.id, 'interentity_receivable', receiver.id, 'Dr', it.amount, gf);
  } else if (purpose === 'drawings') {
    b.party(giver.id, 'owner_drawings', receiver.id, 'Dr', it.amount, gf);
  } else if (purpose === 'distribution') {
    b.party(giver.id, 'owner_distributions', receiver.id, 'Dr', it.amount, gf);
  } else if (purpose === 'capital') {
    b.party(giver.id, 'investment_in_firms', receiver.id, 'Dr', it.amount, gf);
  } else {
    if (!it.giverCategoryId) ask('giver_category', `Choose what kind of expense this is for ${giver.name}.`);
    b.category(giver.id, it.giverCategoryId!, 'expense', 'Dr', it.amount, gf);
  }
  b.money(giver.id, it.giverLocationId, 'Cr', it.amount, gf);

  // The receiver's books, when it keeps any: where the money went, and what it is to them.
  if (books) {
    if (it.receiverSide === 'own') {
      b.leg = { kind: 'destination', index: 0 };
      if (!it.receiverLocationId) ask('receiver_location', `Choose where ${receiver.name} received the money.`);
      b.money(receiver.id, it.receiverLocationId!, 'Dr', it.amount, rf);
    } else {
      b.leg = { kind: 'allocation', index: 0 };
      if (it.receiverLocationId) {
        conflict(`An expense of ${receiver.name} is spent, not kept: leave out where it was received, or choose Own.`);
      }
      if (!it.receiverExpenseCategoryId) {
        ask('receiver_category', `Choose what kind of expense this is for ${receiver.name}.`);
      }
      b.category(receiver.id, it.receiverExpenseCategoryId!, 'expense', 'Dr', it.amount, rf);
    }
    switch (receiverCredit) {
      case 'payable':
        b.party(receiver.id, 'interentity_payable', giver.id, 'Cr', it.amount, rf);
        break;
      case 'investment':
        b.party(receiver.id, 'investment_in_firms', giver.id, 'Cr', it.amount, rf);
        break;
      case 'capital':
        b.party(receiver.id, 'owner_capital', giver.id, 'Cr', it.amount, rf);
        break;
      case 'recovery':
        if (!it.receiverRecoveryCategoryId) {
          ask(
            'receiver_recovery_category',
            `Choose which of ${receiver.name}'s expenses this reimbursement recovers.`,
          );
        }
        b.category(receiver.id, it.receiverRecoveryCategoryId!, 'expense', 'Cr', it.amount, rf);
        break;
      case 'income':
        if (!it.receiverIncomeCategoryId) {
          ask(
            'receiver_income_category',
            `Choose how ${receiver.name} records receiving ${label.toLowerCase()} (an income category).`,
          );
        }
        b.category(receiver.id, it.receiverIncomeCategoryId!, 'income', 'Cr', it.amount, rf);
        break;
    }
  }
  b.leg = undefined;

  if (repayable) {
    b.owe(
      'interentity',
      receiver.id,
      giver.id,
      it.amount,
      `${giver.name} gave ${receiver.name} money to be paid back`,
      books ? 'interentity_payable' : undefined,
      'interentity_receivable',
      { debtor: rf, creditor: gf },
    );
  }
  return b.build();
}

/**
 * Whether a purpose fits the parties (§6 of the model): who may give it, who may receive it, the ownership it needs,
 * and whether it can be repayable. Repayment expectation and purpose are separate answers that must agree.
 */
function checkGivePurpose(
  ctx: EngineContext,
  giver: EntityInfo,
  receiver: EntityInfo,
  purpose: I.GivePurpose,
  repayable: boolean,
  conflict: (message: string) => never,
): void {
  const label = PURPOSE_LABEL[purpose];
  const notAnOwner = (firm: EntityInfo, person: EntityInfo): never =>
    fail('NOT_AN_OWNER', `${person.name} is not an owner of ${firm.name}.`, { personId: person.id });
  if (purpose === 'loan' && !repayable) {
    conflict('A loan is paid back. Say it is repayable, or choose the purpose that fits.');
  }
  if (repayable && purpose !== 'loan' && purpose !== 'personal_benefit') {
    conflict(`${label} is not paid back. Choose a loan if ${receiver.name} has to repay it.`);
  }
  switch (purpose) {
    case 'drawings':
      if (giver.kind !== 'firm' || receiver.kind !== 'person') {
        conflict('A drawing is money a firm gives one of its owners.');
      }
      if (!ctx.isOwner(giver.id, receiver.id)) notAnOwner(giver, receiver);
      break;
    case 'distribution':
      if (giver.kind !== 'firm') conflict('A distribution of profit is made by a firm to its owners.');
      if (!ctx.isOwner(giver.id, receiver.id)) notAnOwner(giver, receiver);
      break;
    case 'capital':
      if (giver.kind !== 'person' || receiver.kind !== 'firm') conflict('Capital goes from a person to a firm.');
      if (!ctx.isOwner(receiver.id, giver.id)) notAnOwner(receiver, giver);
      break;
    case 'personal_benefit':
      if (giver.kind === 'person' || receiver.kind !== 'person') {
        conflict('A personal benefit is something a firm pays for one of its owners.');
      }
      if (!ctx.isOwner(giver.id, receiver.id)) {
        conflict(
          `${receiver.name} is not an owner of ${giver.name}. For someone else choose remuneration, a gift or a ` +
            'business expense.',
        );
      }
      break;
    case 'remuneration':
      if (receiver.kind !== 'person' && receiver.kind !== 'party') {
        conflict(`${receiver.name} is not a person. A firm is paid for goods or services: choose a business expense.`);
      }
      break;
    case 'gift':
    case 'donation':
      if (receiver.kind !== 'person' && receiver.kind !== 'party' && ctx.isOwner(receiver.id, giver.id)) {
        conflict(
          `Money ${giver.name} puts into ${receiver.name}, which they own, is capital or a loan, not ${
            purpose === 'gift' ? 'a gift' : 'a donation'
          }.`,
        );
      }
      if (giver.kind !== 'person' && ctx.isOwner(giver.id, receiver.id)) {
        conflict(
          `${giver.name} does not give its owner ${receiver.name} gifts: choose drawings, a distribution, ` +
            'remuneration or a personal benefit.',
        );
      }
      break;
    case 'loan':
    case 'reimbursement':
    case 'business_expense':
      break;
  }
}

function income(ctx: EngineContext, it: I.IncomeIntent): PostingPlan {
  checkRupees(it.amount);
  const owner = withBooks(ctx, it.ownerId);
  if (!!it.receivedAt === !!it.customerId) {
    fail('VALIDATION', 'Choose where the money was received, or the customer who owes it.');
  }
  const b = new PlanBuilder(ctx);
  b.category(owner.id, it.categoryId, 'income', 'Cr', it.amount, it.fundId);
  if (it.customerId) {
    const customer = active(ctx, it.customerId);
    b.party(owner.id, 'customer_receivable', customer.id, 'Dr', it.amount, it.fundId);
    b.owe(
      'customer_receivable',
      customer.id,
      owner.id,
      it.amount,
      `Sale on credit to ${customer.name}`,
      undefined,
      'customer_receivable',
      { creditor: it.fundId },
    );
    return b.build();
  }
  const at = it.receivedAt!;
  const receiver = withBooks(ctx, at.entityId);
  if (receiver.id === owner.id) {
    b.money(owner.id, at.locationId, 'Dr', it.amount, it.fundId);
    return b.build();
  }
  b.party(owner.id, 'interentity_receivable', receiver.id, 'Dr', it.amount, it.fundId);
  b.money(receiver.id, at.locationId, 'Dr', it.amount, at.fundId);
  b.party(receiver.id, 'interentity_payable', owner.id, 'Cr', it.amount, at.fundId);
  b.owe(
    'interentity',
    receiver.id,
    owner.id,
    it.amount,
    `${receiver.name} received ${owner.name}'s income`,
    'interentity_payable',
    'interentity_receivable',
    { debtor: at.fundId, creditor: it.fundId },
  );
  return b.build();
}

function unidentifiedReceipt(ctx: EngineContext, it: I.UnidentifiedReceiptIntent): PostingPlan {
  checkRupees(it.amount);
  withBooks(ctx, it.entityId);
  const b = new PlanBuilder(ctx);
  b.money(it.entityId, it.locationId, 'Dr', it.amount);
  b.plain(it.entityId, 'suspense', 'Cr', it.amount);
  return b.build();
}

function advanceGive(ctx: EngineContext, it: I.AdvanceGiveIntent): PostingPlan {
  checkRupees(it.amount);
  const giver = withBooks(ctx, it.giverId);
  const holder = active(ctx, it.holderId);
  if (giver.id === holder.id) fail('SAME_SOURCE_DESTINATION', 'An advance must go to someone else.');
  const b = new PlanBuilder(ctx);
  b.party(giver.id, 'advances_given', holder.id, 'Dr', it.amount, it.fundId);
  b.money(giver.id, it.fromLocationId, 'Cr', it.amount, it.fundId);
  b.owe('advance', holder.id, giver.id, it.amount, `Advance to ${holder.name}`, undefined, 'advances_given', {
    creditor: it.fundId,
  });
  return b.build();
}

function advanceAccount(ctx: EngineContext, it: I.AdvanceAccountIntent): PostingPlan {
  const item = ctx.openItem(it.advanceOpenItemId);
  if (item.kind !== 'advance') fail('VALIDATION', 'This is not an advance.');
  if (item.status === 'settled' || item.status === 'reversed' || item.status === 'written_off') {
    fail('VALIDATION', 'This advance is already closed.');
  }
  const giver = withBooks(ctx, item.creditorId);
  const holder = active(ctx, item.debtorId);
  it.uses.forEach((u) => checkRupees(u.amount));
  const used = sum(it.uses.map((u) => u.amount));
  const returned = it.returned ? checkRupees(it.returned.amount) : 0n;
  if (used === 0n && returned === 0n) fail('VALIDATION', 'Enter what was spent or returned.');
  const b = new PlanBuilder(ctx);
  const gf = item.creditorFundId; // the giver's fund the advance was given from
  for (const u of it.uses) b.category(giver.id, u.categoryId, 'expense', 'Dr', u.amount, gf);

  if (used > item.remaining) {
    if (returned > 0n) fail('VALIDATION', 'Nothing can be returned when more than the advance was spent.');
    const excess = used - item.remaining;
    if (!hasBooks(holder) || !it.overspendFromLocationId) {
      fail('VALIDATION', `Choose where ${holder.name} paid the extra ${formatInr(excess)} from.`);
    }
    b.party(giver.id, 'advances_given', holder.id, 'Cr', item.remaining, gf);
    b.party(giver.id, 'interentity_payable', holder.id, 'Cr', excess, gf);
    b.party(holder.id, 'interentity_receivable', giver.id, 'Dr', excess);
    b.money(holder.id, it.overspendFromLocationId, 'Cr', excess);
    b.settle(item.id, item.remaining, 'advance_use');
    b.owe(
      'interentity',
      giver.id,
      holder.id,
      excess,
      `${holder.name} spent more than the advance`,
      'interentity_payable',
      'interentity_receivable',
      { debtor: gf },
    );
    return b.build();
  }

  if (used + returned > item.remaining) {
    fail(
      'SETTLEMENT_EXCEEDS_REMAINING',
      `Only ${formatInr(item.remaining)} of this advance is still open.`,
      { remaining: item.remaining },
    );
  }
  if (used > 0n) {
    b.party(giver.id, 'advances_given', holder.id, 'Cr', used, gf);
    b.settle(item.id, used, 'advance_use');
  }
  if (returned > 0n) {
    b.money(giver.id, it.returned!.toLocationId, 'Dr', returned, gf);
    b.party(giver.id, 'advances_given', holder.id, 'Cr', returned, gf);
    b.settle(item.id, returned, 'advance_return');
  }
  return b.build();
}

function loan(ctx: EngineContext, it: I.LoanIntent): PostingPlan {
  checkRupees(it.amount);
  const lender = active(ctx, it.lenderId);
  const borrower = active(ctx, it.borrowerId);
  if (lender.id === borrower.id) fail('SAME_SOURCE_DESTINATION', 'A loan must be between two different parties.');
  if (!hasBooks(lender) && !hasBooks(borrower)) fail('VALIDATION', 'One side of the loan must keep books in Finly.');
  const b = new PlanBuilder(ctx);
  if (hasBooks(lender)) {
    if (!it.lenderLocationId) fail('VALIDATION', `Choose where ${lender.name}'s money came from.`);
    b.party(lender.id, 'loans_given', borrower.id, 'Dr', it.amount);
    b.money(lender.id, it.lenderLocationId, 'Cr', it.amount);
  }
  if (hasBooks(borrower)) {
    if (!it.borrowerLocationId) fail('VALIDATION', `Choose where ${borrower.name} received the money.`);
    b.money(borrower.id, it.borrowerLocationId, 'Dr', it.amount);
    b.party(borrower.id, 'loans_taken', lender.id, 'Cr', it.amount);
  }
  b.owe(
    'loan',
    borrower.id,
    lender.id,
    it.amount,
    `Loan from ${lender.name} to ${borrower.name}`,
    hasBooks(borrower) ? 'loans_taken' : undefined,
    hasBooks(lender) ? 'loans_given' : undefined,
  );
  return b.build();
}

function loanRepayment(ctx: EngineContext, it: I.LoanRepaymentIntent): PostingPlan {
  const item = ctx.openItem(it.loanOpenItemId);
  if (item.kind !== 'loan') fail('VALIDATION', 'This is not a loan.');
  if (it.principal < 0n || it.interest < 0n || it.principal + it.interest === 0n) {
    fail('AMOUNT_INVALID', 'Enter the principal and interest being repaid.');
  }
  if (it.principal > item.remaining) {
    fail('SETTLEMENT_EXCEEDS_REMAINING', `Only ${formatInr(item.remaining)} of this loan is outstanding.`);
  }
  const borrower = active(ctx, item.debtorId);
  const lender = active(ctx, item.creditorId);
  const b = new PlanBuilder(ctx, 'settlement');
  const total = it.principal + it.interest;
  const bf = item.debtorFundId;
  const lf = item.creditorFundId;
  if (hasBooks(borrower)) {
    if (!it.payerLocationId) fail('VALIDATION', `Choose where ${borrower.name} paid from.`);
    if (it.principal > 0n) b.party(borrower.id, 'loans_taken', lender.id, 'Dr', it.principal, bf);
    if (it.interest > 0n) {
      b.category(borrower.id, interestCategory(ctx, borrower.id, 'expense'), 'expense', 'Dr', it.interest, bf);
    }
    b.money(borrower.id, it.payerLocationId, 'Cr', total, bf);
  }
  if (hasBooks(lender)) {
    if (!it.payeeLocationId) fail('VALIDATION', `Choose where ${lender.name} received the money.`);
    b.money(lender.id, it.payeeLocationId, 'Dr', total, lf);
    if (it.principal > 0n) b.party(lender.id, 'loans_given', borrower.id, 'Cr', it.principal, lf);
    if (it.interest > 0n) {
      b.category(lender.id, interestCategory(ctx, lender.id, 'income'), 'income', 'Cr', it.interest, lf);
    }
  }
  if (it.principal > 0n) b.settle(item.id, it.principal, 'payment');
  return b.build();
}

/** Interest posts through the seeded interest categories; the context exposes them by well-known keys. */
function interestCategory(ctx: EngineContext, _entityId: Id, kind: 'expense' | 'income'): Id {
  return kind === 'expense' ? ctx.categoryByKey('interest_paid').id : ctx.categoryByKey('interest').id;
}

/** Capital put into a firm by one of its owners: `give` with the purpose `capital`, not repayable, both sides Own. */
function capital(ctx: EngineContext, it: I.CapitalIntent): PostingPlan {
  return give(ctx, {
    type: 'give',
    giverId: it.personId,
    giverLocationId: it.personLocationId,
    purpose: 'capital',
    repayable: false,
    giverSide: 'own',
    receiverId: it.firmId,
    receiverSide: 'own',
    receiverLocationId: it.firmLocationId,
    amount: it.amount,
  });
}

/** An owner's withdrawal (F8 A): `give` from the firm with the purpose `drawings`, not repayable, both sides Own. */
function withdrawal(ctx: EngineContext, it: I.WithdrawalIntent): PostingPlan {
  return give(ctx, {
    type: 'give',
    giverId: it.firmId,
    giverLocationId: it.firmLocationId,
    purpose: 'drawings',
    repayable: false,
    giverSide: 'own',
    receiverId: it.personId,
    receiverSide: 'own',
    receiverLocationId: it.personLocationId,
    amount: it.amount,
  });
}

function settlement(ctx: EngineContext, it: I.SettlementIntent): PostingPlan {
  if (it.allocations.length === 0) fail('VALIDATION', 'Choose what this payment settles.');
  const payer = active(ctx, it.payerId);
  const payee = active(ctx, it.payeeId);
  const b = new PlanBuilder(ctx, 'settlement');
  const seen = new Set<Id>();
  // Money moves in the fund each item is carried in, so every fund balances on its own.
  const payerByFund = new Map<Id, Rupees>();
  const payeeByFund = new Map<Id, Rupees>();
  for (const a of it.allocations) {
    checkRupees(a.amount);
    if (seen.has(a.openItemId)) fail('VALIDATION', 'The same item is listed twice.');
    seen.add(a.openItemId);
    const item = ctx.openItem(a.openItemId);
    if (item.debtorId !== payer.id || item.creditorId !== payee.id) {
      fail('SETTLEMENT_PARTY_MISMATCH', `This item is not owed by ${payer.name} to ${payee.name}.`, {
        openItemId: item.id,
      });
    }
    if (item.status === 'settled' || item.status === 'reversed' || item.status === 'written_off') {
      fail('VALIDATION', 'This item is already closed.', { openItemId: item.id });
    }
    if (a.amount > item.remaining) {
      fail(
        'SETTLEMENT_EXCEEDS_REMAINING',
        `Only ${formatInr(item.remaining)} is still owed on this item.`,
        { openItemId: item.id, remaining: item.remaining },
      );
    }
    if (item.debtorRole) {
      const f = b.fund(payer.id, item.debtorFundId);
      b.party(payer.id, item.debtorRole, payee.id, 'Dr', a.amount, f);
      payerByFund.set(f, (payerByFund.get(f) ?? 0n) + a.amount);
    }
    if (item.creditorRole) {
      const f = b.fund(payee.id, item.creditorFundId);
      b.party(payee.id, item.creditorRole, payer.id, 'Cr', a.amount, f);
      payeeByFund.set(f, (payeeByFund.get(f) ?? 0n) + a.amount);
    }
    b.settle(item.id, a.amount, 'payment');
  }
  if (payerByFund.size > 0 && !it.payerLocationId) fail('VALIDATION', `Choose where ${payer.name} paid from.`);
  if (payeeByFund.size > 0 && !it.payeeLocationId) {
    fail('VALIDATION', `Choose where ${payee.name} received the money.`);
  }
  for (const [f, amount] of payerByFund) b.money(payer.id, it.payerLocationId!, 'Cr', amount, f);
  for (const [f, amount] of payeeByFund) b.money(payee.id, it.payeeLocationId!, 'Dr', amount, f);
  return b.build();
}

function offset(ctx: EngineContext, it: I.OffsetIntent): PostingPlan {
  checkRupees(it.amount);
  const a = ctx.openItem(it.itemAId);
  const c = ctx.openItem(it.itemBId);
  if (a.kind !== 'interentity' || c.kind !== 'interentity') {
    fail('VALIDATION', 'Only amounts owed between entities can be set off against each other.');
  }
  if (a.debtorId !== c.creditorId || a.creditorId !== c.debtorId) {
    fail('VALIDATION', 'These two items are not owed in opposite directions between the same two entities.');
  }
  if (it.amount > a.remaining || it.amount > c.remaining) {
    fail('SETTLEMENT_EXCEEDS_REMAINING', 'The set-off is larger than what remains on one of the items.');
  }
  const x = a.debtorId; // x owes y on item A; y owes x on item B
  const y = a.creditorId;
  const b = new PlanBuilder(ctx, 'settlement');
  const xf = b.fund(x, a.debtorFundId);
  const yf = b.fund(y, a.creditorFundId);
  if (xf !== b.fund(x, c.creditorFundId) || yf !== b.fund(y, c.debtorFundId)) {
    fail('FUND_MISMATCH', 'These amounts are carried in different funds; settle them separately.');
  }
  b.party(x, 'interentity_payable', y, 'Dr', it.amount, xf);
  b.party(x, 'interentity_receivable', y, 'Cr', it.amount, xf);
  b.party(y, 'interentity_payable', x, 'Dr', it.amount, yf);
  b.party(y, 'interentity_receivable', x, 'Cr', it.amount, yf);
  b.settle(a.id, it.amount, 'offset');
  b.settle(c.id, it.amount, 'offset');
  return b.build();
}

function openingBalance(ctx: EngineContext, it: I.OpeningBalanceIntent): PostingPlan {
  checkRupees(it.amount);
  withBooks(ctx, it.entityId);
  const b = new PlanBuilder(ctx, 'opening');
  b.money(it.entityId, it.locationId, 'Dr', it.amount, it.fundId);
  b.plain(it.entityId, 'opening_balance_equity', 'Cr', it.amount, it.fundId);
  return b.build();
}

function cashAdjustment(ctx: EngineContext, it: I.CashAdjustmentIntent): PostingPlan {
  checkRupees(it.amount);
  withBooks(ctx, it.entityId);
  const b = new PlanBuilder(ctx, 'adjusting');
  if (it.direction === 'short') {
    b.category(it.entityId, it.categoryId, 'expense', 'Dr', it.amount);
    b.money(it.entityId, it.locationId, 'Cr', it.amount);
  } else {
    b.money(it.entityId, it.locationId, 'Dr', it.amount);
    b.category(it.entityId, it.categoryId, 'expense', 'Cr', it.amount);
  }
  return b.build();
}

/** Business intent → posting plan. Throws `FinlyError` with a plain-language message when the intent is invalid. */
export function planPosting(intent: I.Intent, ctx: EngineContext): PostingPlan {
  switch (intent.type) {
    case 'transfer':
      return transfer(ctx, intent);
    case 'transit_confirm':
      return transitConfirm(ctx, intent);
    case 'expense':
      return expense(ctx, intent);
    case 'bill':
      return bill(ctx, intent);
    case 'give':
      return give(ctx, intent);
    case 'income':
      return income(ctx, intent);
    case 'unidentified_receipt':
      return unidentifiedReceipt(ctx, intent);
    case 'advance_give':
      return advanceGive(ctx, intent);
    case 'advance_account':
      return advanceAccount(ctx, intent);
    case 'loan':
      return loan(ctx, intent);
    case 'loan_repayment':
      return loanRepayment(ctx, intent);
    case 'capital_contribution':
      return capital(ctx, intent);
    case 'withdrawal':
      return withdrawal(ctx, intent);
    case 'settlement':
      return settlement(ctx, intent);
    case 'offset':
      return offset(ctx, intent);
    case 'opening_balance':
      return openingBalance(ctx, intent);
    case 'cash_adjustment':
      return cashAdjustment(ctx, intent);
  }
}

/** The exact mirror of posted journals: same lines and dimensions, sides swapped (RULEBOOK-01 §56). */
export function mirror(journals: readonly PlannedJournal[]): PlannedJournal[] {
  return journals.map((j) => ({
    entityId: j.entityId,
    kind: 'reversal',
    step: j.step,
    lines: j.lines.map((l) => ({ ...l, side: l.side === 'Dr' ? 'Cr' : 'Dr' })),
  }));
}
