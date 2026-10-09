/**
 * F8/F9 — money given between entities (GATE-RESPONSE-04; docs/accounting/F8-F9-model.md): the eight Own/Expense
 * scenarios, repayment Options A and B across two separate transactions, outside parties, and every refusal when a
 * choice is missing or incoherent. Nothing here creates a debt unless the arrangement says `repayable`.
 */
import { assertEquals, assertThrows } from '@std/assert';
import type { GiveIntent } from '../../src/domain/engine/intents.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

/** Transaction 1 (F8): Mint gives its owner Krish ₹20,000 from the Tijori. */
function firmToOwner(x: ReturnType<typeof exampleWorld>, choice: Partial<GiveIntent>): GiveIntent {
  return {
    type: 'give',
    giverId: x.e.mint,
    giverLocationId: x.l.tijori,
    receiverId: x.e.krish,
    amount: 20000n,
    ...choice,
  };
}

/** Transaction 2 (F9): Krish gives Sujal ₹8,000 from his cash in hand. */
function ownerToSujal(x: ReturnType<typeof exampleWorld>, choice: Partial<GiveIntent>): GiveIntent {
  return {
    type: 'give',
    giverId: x.e.krish,
    giverLocationId: x.l.cashKrish,
    receiverId: x.e.sujal,
    amount: 8000n,
    ...choice,
  };
}

function refused(fn: () => unknown): FinlyError {
  return assertThrows(fn, FinlyError);
}

Deno.test('F8 scenario 1A — firm Own, owner Own, drawings: nothing owed, investment reduced', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  const ids = post(
    w,
    firmToOwner(x, { giverSide: 'own', receiverSide: 'own', receiverLocationId: l.cashKrish, arrangement: 'drawings' }),
  );
  assertEquals(ids, []);
  assertEquals(w.balance(e.mint, 'owner_drawings', { counterpartyId: e.krish }), 20000n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 20000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), -20000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertLedgerSound(w);
});

Deno.test('F8 scenario 1B — firm Own, owner Own, repayable: the owner owes the firm', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  const [item] = post(
    w,
    firmToOwner(x, {
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      arrangement: 'repayable',
    }),
  );
  assertEquals(w.openItem(item).remaining, 20000n);
  assertEquals(w.owed(e.krish, e.mint), 20000n);
  assertEquals(w.balance(e.mint, 'owner_drawings'), 0n);
  assertLedgerSound(w);
});

Deno.test('F8 scenario 2 — firm Own, owner Expense: the owner records a personal expense; the firm none', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  post(
    w,
    firmToOwner(x, {
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('hotel'),
      arrangement: 'drawings',
    }),
  );
  assertEquals(w.balance(e.krish, 'expense', { categoryId: w.cat('hotel') }), 20000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 0n, 'spent, never held');
  assertEquals(w.balance(e.mint, 'expense'), 0n, "the owner's expense is not the firm's");
  // 2B: the same with repayment — the owner owes the firm for his expense.
  const y = exampleWorld();
  fund(y.w, y.e.mint, y.l.tijori, 50000n);
  post(
    y.w,
    firmToOwner(y, {
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: y.w.cat('hotel'),
      arrangement: 'repayable',
    }),
  );
  assertEquals(y.w.owed(y.e.krish, y.e.mint), 20000n);
  assertLedgerSound(w);
  assertLedgerSound(y.w);
});

Deno.test('F8 scenario 3 — firm Expense (C), owner Own: firm cost, owner income, no debt', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  const plan = planPosting(
    firmToOwner(x, {
      giverSide: 'expense',
      giverCategoryId: w.cat('salary'),
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      receiverIncomeCategoryId: w.cat('salary_received'),
      arrangement: 'none',
    }),
    w,
  );
  assertEquals(plan.openItems, [], 'an expense is never a debt');
  w.apply(plan);
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('salary') }), 20000n);
  assertEquals(w.balance(e.krish, 'revenue', { categoryId: w.cat('salary_received') }), 20000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 20000n);
  assertLedgerSound(w);
});

Deno.test('F8 scenario 4 — firm Expense, owner Expense: each book once; the owner nets to zero', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  post(
    w,
    firmToOwner(x, {
      giverSide: 'expense',
      giverCategoryId: w.cat('travel'),
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('travel'),
      receiverIncomeCategoryId: w.cat('other_income'),
      arrangement: 'none',
    }),
  );
  assertEquals(w.balance(e.mint, 'expense'), 20000n);
  assertEquals(w.balance(e.krish, 'expense'), 20000n);
  assertEquals(w.balance(e.krish, 'revenue'), 20000n);
  assertEquals(w.moneyAt(l.cashKrish), 0n);
  assertEquals(w.owed(e.krish, e.mint), 0n);
  assertLedgerSound(w);
});

/** A world where Krish holds ₹20,000 of his own cash, ready for Transaction 2. */
function krishWithCash() {
  const x = exampleWorld();
  fund(x.w, x.e.krish, x.l.cashKrish, 20000n);
  return x;
}

Deno.test('F9 scenario 5 — owner Own, recipient Own, repayable (C2): Sujal owes Krish; the rest stays with Krish', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const [item] = post(
    w,
    ownerToSujal(x, {
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      arrangement: 'repayable',
    }),
  );
  assertEquals(w.openItem(item).debtorId, e.sujal);
  assertEquals(w.owed(e.sujal, e.krish), 8000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 12000n);
  assertEquals(w.moneyAt(l.cashSujal, e.sujal), 8000n);
  assertLedgerSound(w);
});

Deno.test('F9 scenario 5 with capital — owner Own into his own firm: capital, not a debt', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const ids = post(w, {
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    giverSide: 'own',
    receiverId: e.mint,
    receiverSide: 'own',
    receiverLocationId: l.tijori,
    arrangement: 'capital',
    amount: 8000n,
  });
  assertEquals(ids, []);
  assertEquals(w.balance(e.mint, 'owner_capital', { counterpartyId: e.krish }), 8000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), 8000n);
  assertLedgerSound(w);
});

Deno.test('F9 scenario 6 — owner Own, recipient Expense, repayable: Sujal records the expense and owes Krish', () => {
  const x = krishWithCash();
  const { w, e } = x;
  post(
    w,
    ownerToSujal(x, {
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('food'),
      arrangement: 'repayable',
    }),
  );
  assertEquals(w.balance(e.sujal, 'expense', { categoryId: w.cat('food') }), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 8000n);
  assertEquals(w.moneyAt(x.l.cashSujal), 0n, 'spent, never held by Sujal');
  assertLedgerSound(w);
});

Deno.test('F9 scenario 7 — owner Expense, recipient Own (C1): final expense for Krish, income for Sujal', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const plan = planPosting(
    ownerToSujal(x, {
      giverSide: 'expense',
      giverCategoryId: w.cat('other_expense'),
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      receiverIncomeCategoryId: w.cat('other_income'),
      arrangement: 'none',
    }),
    w,
  );
  assertEquals(plan.openItems, []);
  w.apply(plan);
  assertEquals(w.balance(e.krish, 'expense'), 8000n);
  assertEquals(w.balance(e.sujal, 'revenue'), 8000n);
  assertEquals(w.moneyAt(l.cashSujal, e.sujal), 8000n);
  assertLedgerSound(w);
});

Deno.test('F9 scenario 8 — owner Expense, recipient Expense: each records its side once, nothing owed', () => {
  const x = krishWithCash();
  const { w, e } = x;
  post(
    w,
    ownerToSujal(x, {
      giverSide: 'expense',
      giverCategoryId: w.cat('other_expense'),
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('food'),
      receiverIncomeCategoryId: w.cat('other_income'),
      arrangement: 'none',
    }),
  );
  assertEquals(w.balance(e.krish, 'expense'), 8000n);
  assertEquals(w.balance(e.sujal, 'expense'), 8000n);
  assertEquals(w.balance(e.sujal, 'revenue'), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 0n);
  assertLedgerSound(w);
});

Deno.test('Option A — two separate transactions, two linked debts; the first amount is never posted twice', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  const [krishOwesMint] = post(
    w,
    firmToOwner(x, {
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      arrangement: 'repayable',
    }),
  );
  const journalsAfterFirst = w.journals.length;
  const [sujalOwesKrish] = post(
    w,
    ownerToSujal(x, {
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      arrangement: 'repayable',
    }),
  );
  assertEquals(w.journals.length - journalsAfterFirst, 2, 'the second event posts only its own two journals');
  assertEquals(w.openItem(krishOwesMint).remaining, 20000n, 'Krish still owes Mint in full');
  assertEquals(w.openItem(sujalOwesKrish).remaining, 8000n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 12000n, 'the rest stays with Krish');
  assertLedgerSound(w);
});

Deno.test('Option B — the owner only carries the firm cash: Sujal owes Mint directly; the owner books never move', () => {
  const x = exampleWorld();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  // Transaction 1 is custody inside Mint's books, not F8: the money stays Mint's while Krish holds it.
  post(w, { type: 'transfer', entityId: e.mint, fromLocationId: l.tijori, toLocationId: l.cashKrish, amount: 20000n });
  post(w, {
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.cashKrish,
    giverSide: 'own',
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    arrangement: 'repayable',
    amount: 8000n,
  });
  assertEquals(w.owed(e.sujal, e.mint), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 0n);
  assertEquals(w.trialBalance(e.krish), { debits: 0n, credits: 0n }, 'carrying cash is not owning it');
  assertEquals(w.moneyAt(l.cashKrish, e.mint), 12000n);
  assertLedgerSound(w);
});

Deno.test('an outside party keeps no books: only the giver posts; repayable makes the party the debtor', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const expense = planPosting({
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    giverSide: 'expense',
    giverCategoryId: w.cat('hotel'),
    receiverId: e.hotelVendor,
    arrangement: 'none',
    amount: 3000n,
  }, w);
  assertEquals(expense.journals.map((j) => j.entityId), [e.krish]);
  const [item] = post(w, {
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    giverSide: 'own',
    receiverId: e.customer,
    arrangement: 'repayable',
    amount: 5000n,
  });
  assertEquals(w.openItem(item).debtorId, e.customer);
  assertEquals(w.openItem(item).debtorRole, undefined, 'no payable line in books that do not exist');
  assertLedgerSound(w);
});

Deno.test('missing choices are asked for, never assumed (CLASSIFICATION_REQUIRED)', () => {
  const x = krishWithCash();
  const { w, l } = x;
  const ask = (choice: Partial<GiveIntent>) => refused(() => planPosting(ownerToSujal(x, choice), w));
  assertEquals(ask({}).details.question, 'giver_side');
  assertEquals(ask({ giverSide: 'own' }).details.question, 'receiver_side');
  assertEquals(ask({ giverSide: 'own', receiverSide: 'own' }).details.question, 'arrangement');
  assertEquals(
    ask({ giverSide: 'own', receiverSide: 'own', arrangement: 'repayable' }).details.question,
    'receiver_location',
  );
  const noIncome = ask({
    giverSide: 'expense',
    giverCategoryId: w.cat('food'),
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    arrangement: 'none',
  });
  assertEquals(noIncome.details.question, 'receiver_income_category');
  for (const err of [ask({}), noIncome]) assertEquals(err.code, 'CLASSIFICATION_REQUIRED');
});

Deno.test('incoherent combinations are explained and refused (CLASSIFICATION_CONFLICT, NOT_AN_OWNER)', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const code = (choice: Partial<GiveIntent>) => refused(() => planPosting(ownerToSujal(x, choice), w)).code;
  // Spent and owed back at once.
  assertEquals(
    code({
      giverSide: 'expense',
      giverCategoryId: w.cat('food'),
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      arrangement: 'repayable',
    }),
    'CLASSIFICATION_CONFLICT',
  );
  // Own, but nothing owed, not a drawing, not capital.
  assertEquals(
    code({ giverSide: 'own', receiverSide: 'own', receiverLocationId: l.cashSujal, arrangement: 'none' }),
    'CLASSIFICATION_CONFLICT',
  );
  // The receiver's expense cannot also arrive in a place of theirs.
  assertEquals(
    code({
      giverSide: 'own',
      receiverSide: 'expense',
      receiverLocationId: l.cashSujal,
      receiverExpenseCategoryId: w.cat('food'),
      arrangement: 'repayable',
    }),
    'CLASSIFICATION_CONFLICT',
  );
  // Drawings only to an owner of the firm.
  fund(w, e.mint, l.tijori, 1000n);
  const notOwner = refused(() =>
    planPosting({
      type: 'give',
      giverId: e.mint,
      giverLocationId: l.tijori,
      giverSide: 'own',
      receiverId: e.sujal,
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      arrangement: 'drawings',
      amount: 100n,
    }, w)
  );
  assertEquals(notOwner.code, 'NOT_AN_OWNER');
  // Giving to oneself.
  const self = ownerToSujal(x, {
    giverSide: 'own',
    receiverSide: 'own',
    receiverLocationId: l.cashKrish,
    arrangement: 'repayable',
  });
  assertEquals(refused(() => planPosting({ ...self, receiverId: e.krish }, w)).code, 'SAME_SOURCE_DESTINATION');
});
