/**
 * F8/F9 — money given between entities (GATE-RESPONSE-04, GATE-RESPONSE-05, D-039; docs/accounting/F8-F9-model.md):
 * the eight Own/Expense scenarios, each with an explicit purpose and repayment answer; repayment Options A and B across
 * two separate transactions; outside parties; and every refusal when a choice is missing or does not fit the real
 * event. Nothing here creates a debt unless the money is repayable, and no income appears that the user did not choose.
 */
import { assertEquals, assertThrows } from '@std/assert';
import type { GiveIntent } from '../../src/domain/engine/intents.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

type World = ReturnType<typeof exampleWorld>;

/** Transaction 1 (F8): Mint gives its owner Krish ₹20,000 from the Tijori. */
function firmToOwner(x: World, choice: Partial<GiveIntent>): GiveIntent {
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
function ownerToSujal(x: World, choice: Partial<GiveIntent>): GiveIntent {
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

function mintFunded(): World {
  const x = exampleWorld();
  fund(x.w, x.e.mint, x.l.tijori, 50000n);
  return x;
}

/** A world where Krish holds ₹20,000 of his own cash, ready for Transaction 2. */
function krishWithCash(): World {
  const x = exampleWorld();
  fund(x.w, x.e.krish, x.l.cashKrish, 20000n);
  return x;
}

// ---- F8: firm → owner, the four side combinations ---------------------------------------------------------------

Deno.test('F8 1 — firm Own, owner Own: drawings reduce the investment, nothing owed, no income', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  const ids = post(
    w,
    firmToOwner(x, {
      purpose: 'drawings',
      repayable: false,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
    }),
  );
  assertEquals(ids, []);
  assertEquals(w.balance(e.mint, 'owner_drawings', { counterpartyId: e.krish }), 20000n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 20000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), -20000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertEquals(w.balance(e.krish, 'revenue'), 0n, 'a drawing is not income');
  assertLedgerSound(w);
});

Deno.test('F8 1 — firm Own, owner Own, loan: the owner owes the firm', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  const [item] = post(
    w,
    firmToOwner(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
    }),
  );
  assertEquals(w.openItem(item).remaining, 20000n);
  assertEquals(w.owed(e.krish, e.mint), 20000n);
  assertEquals(w.balance(e.mint, 'owner_drawings'), 0n);
  assertLedgerSound(w);
});

Deno.test('F8 1 — firm Own, owner Own, distribution: equity in the firm, chosen income for the owner', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  post(
    w,
    firmToOwner(x, {
      purpose: 'distribution',
      repayable: false,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      receiverIncomeCategoryId: w.cat('distribution_received'),
    }),
  );
  assertEquals(w.balance(e.mint, 'owner_distributions', { counterpartyId: e.krish }), 20000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n, 'a distribution is not an expense of the firm');
  assertEquals(w.balance(e.krish, 'revenue', { categoryId: w.cat('distribution_received') }), 20000n);
  assertLedgerSound(w);
});

Deno.test('F8 2 — firm Own, owner Expense: the owner records a personal expense; the firm none', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  post(
    w,
    firmToOwner(x, {
      purpose: 'drawings',
      repayable: false,
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('hotel'),
    }),
  );
  assertEquals(w.balance(e.krish, 'expense', { categoryId: w.cat('hotel') }), 20000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 0n, 'spent, never held');
  assertEquals(w.balance(e.mint, 'expense'), 0n, "the owner's expense is not the firm's");
  // The same as a personal benefit that must be paid back: the owner owes the firm for his expense.
  const y = mintFunded();
  post(
    y.w,
    firmToOwner(y, {
      purpose: 'personal_benefit',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: y.w.cat('hotel'),
    }),
  );
  assertEquals(y.w.owed(y.e.krish, y.e.mint), 20000n);
  assertEquals(y.w.balance(y.e.mint, 'expense'), 0n);
  assertLedgerSound(w);
  assertLedgerSound(y.w);
});

Deno.test('F8 3 — firm Expense, owner Own: remuneration is a firm cost and income the owner chose, no debt', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  const plan = planPosting(
    firmToOwner(x, {
      purpose: 'remuneration',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('salary'),
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      receiverIncomeCategoryId: w.cat('salary_received'),
    }),
    w,
  );
  assertEquals(plan.openItems, [], 'remuneration is never a debt');
  w.apply(plan);
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('salary') }), 20000n);
  assertEquals(w.balance(e.krish, 'revenue', { categoryId: w.cat('salary_received') }), 20000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 20000n);
  assertLedgerSound(w);
});

Deno.test('F8 4 — firm Expense, owner Expense: a personal benefit paid straight to the owner’s bill, each book once', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  post(
    w,
    firmToOwner(x, {
      purpose: 'personal_benefit',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('electricity'),
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('electricity'),
      receiverIncomeCategoryId: w.cat('other_income'),
    }),
  );
  assertEquals(w.balance(e.mint, 'expense'), 20000n);
  assertEquals(w.balance(e.krish, 'expense'), 20000n);
  assertEquals(w.balance(e.krish, 'revenue'), 20000n);
  assertEquals(w.moneyAt(l.cashKrish), 0n);
  assertEquals(w.owed(e.krish, e.mint), 0n);
  assertLedgerSound(w);
});

// ---- F9: owner → anyone, the four side combinations -------------------------------------------------------------

Deno.test('F9 5 — owner Own, recipient Own, loan: Sujal owes Krish; the rest stays with Krish', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const [item] = post(
    w,
    ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
    }),
  );
  assertEquals(w.openItem(item).debtorId, e.sujal);
  assertEquals(w.owed(e.sujal, e.krish), 8000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 12000n);
  assertEquals(w.moneyAt(l.cashSujal, e.sujal), 8000n);
  assertEquals(w.balance(e.krish, 'expense'), 0n, 'money lent is not spent');
  assertLedgerSound(w);
});

Deno.test('F9 5 — owner Own into his own firm: capital, not a debt and not a gift', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const capital: GiveIntent = {
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    purpose: 'capital',
    repayable: false,
    giverSide: 'own',
    receiverId: e.mint,
    receiverSide: 'own',
    receiverLocationId: l.tijori,
    amount: 8000n,
  };
  assertEquals(post(w, capital), []);
  assertEquals(w.balance(e.mint, 'owner_capital', { counterpartyId: e.krish }), 8000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), 8000n);
  const asGift = refused(() =>
    planPosting({
      ...capital,
      purpose: 'gift',
      giverSide: 'expense',
      giverCategoryId: w.cat('gifts_given'),
      receiverIncomeCategoryId: w.cat('gift_received'),
    }, w)
  );
  assertEquals(asGift.code, 'CLASSIFICATION_CONFLICT');
  assertLedgerSound(w);
});

Deno.test('F9 6 — owner Own, recipient Expense, loan: Sujal records the expense and owes Krish', () => {
  const x = krishWithCash();
  const { w, e } = x;
  post(
    w,
    ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('food'),
    }),
  );
  assertEquals(w.balance(e.sujal, 'expense', { categoryId: w.cat('food') }), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 8000n);
  assertEquals(w.moneyAt(x.l.cashSujal), 0n, 'spent, never held by Sujal');
  assertLedgerSound(w);
});

Deno.test('F9 7 — owner Expense, recipient Own, gift: Krish’s gift expense, Sujal’s chosen gift income', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const plan = planPosting(
    ownerToSujal(x, {
      purpose: 'gift',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('gifts_given'),
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      receiverIncomeCategoryId: w.cat('gift_received'),
    }),
    w,
  );
  assertEquals(plan.openItems, []);
  w.apply(plan);
  assertEquals(w.balance(e.krish, 'expense', { categoryId: w.cat('gifts_given') }), 8000n);
  assertEquals(w.balance(e.sujal, 'revenue', { categoryId: w.cat('gift_received') }), 8000n);
  assertEquals(w.moneyAt(l.cashSujal, e.sujal), 8000n);
  assertLedgerSound(w);
});

Deno.test('F9 8 — owner Expense, recipient Expense: a gift that pays Sujal’s bill, each side once, nothing owed', () => {
  const x = krishWithCash();
  const { w, e } = x;
  post(
    w,
    ownerToSujal(x, {
      purpose: 'gift',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('gifts_given'),
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('food'),
      receiverIncomeCategoryId: w.cat('gift_received'),
    }),
  );
  assertEquals(w.balance(e.krish, 'expense'), 8000n);
  assertEquals(w.balance(e.sujal, 'expense'), 8000n);
  assertEquals(w.balance(e.sujal, 'revenue'), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 0n);
  assertLedgerSound(w);
});

// ---- Purposes beyond the eight combinations ---------------------------------------------------------------------

Deno.test('a reimbursement recovers the receiver’s own expense: no income, no debt', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  // Sujal paid ₹2,000 of courier from his pocket for Mint and recorded it as his expense; Mint pays him back.
  fund(w, e.sujal, l.cashSujal, 2000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.sujal, locationId: l.cashSujal, amount: 2000n }],
    allocations: [{ ownerId: e.sujal, categoryId: w.cat('courier'), amount: 2000n }],
  });
  post(w, {
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.tijori,
    purpose: 'reimbursement',
    repayable: false,
    giverSide: 'expense',
    giverCategoryId: w.cat('courier'),
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    receiverRecoveryCategoryId: w.cat('courier'),
    amount: 2000n,
  });
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('courier') }), 2000n, 'the firm bears the cost');
  assertEquals(w.balance(e.sujal, 'expense'), 0n, 'his expense is recovered');
  assertEquals(w.balance(e.sujal, 'revenue'), 0n, 'a reimbursement is not income');
  assertEquals(w.moneyAt(l.cashSujal, e.sujal), 2000n);
  assertLedgerSound(w);
});

Deno.test('a donation to an outside party: only the giver posts, as the expense it chose', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const plan = planPosting({
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    purpose: 'donation',
    repayable: false,
    giverSide: 'expense',
    giverCategoryId: w.cat('donations'),
    receiverId: e.hotelVendor,
    amount: 3000n,
  }, w);
  assertEquals(plan.journals.map((j) => j.entityId), [e.krish]);
  assertEquals(plan.openItems, []);
});

Deno.test('a business expense paid to an owner (rent for his premises) is the firm’s cost and the owner’s chosen income', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  post(
    w,
    firmToOwner(x, {
      purpose: 'business_expense',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('rent'),
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
      receiverIncomeCategoryId: w.cat('rent_received'),
    }),
  );
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('rent') }), 20000n);
  assertEquals(w.balance(e.krish, 'revenue', { categoryId: w.cat('rent_received') }), 20000n);
  assertLedgerSound(w);
});

// ---- Two transactions, two books, one movement each -------------------------------------------------------------

Deno.test('Option A — two separate transactions, two linked debts; the first amount is never posted twice', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  const [krishOwesMint] = post(
    w,
    firmToOwner(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashKrish,
    }),
  );
  const journalsAfterFirst = w.journals.length;
  const [sujalOwesKrish] = post(
    w,
    ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
    }),
  );
  assertEquals(w.journals.length - journalsAfterFirst, 2, 'the second event posts only its own two journals');
  assertEquals(w.openItem(krishOwesMint).remaining, 20000n, 'Krish still owes Mint in full');
  assertEquals(w.openItem(sujalOwesKrish).remaining, 8000n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.moneyAt(l.cashKrish, e.krish), 12000n, 'the remaining ₹12,000 stays with Krish');
  assertLedgerSound(w);
});

Deno.test('Option B — the owner only carries the firm cash: Sujal owes Mint directly; the owner books never move', () => {
  const x = mintFunded();
  const { w, e, l } = x;
  // Transaction 1 is custody inside Mint's books, not F8: the money stays Mint's while Krish holds it.
  post(w, { type: 'transfer', entityId: e.mint, fromLocationId: l.tijori, toLocationId: l.cashKrish, amount: 20000n });
  post(w, {
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.cashKrish,
    purpose: 'loan',
    repayable: true,
    giverSide: 'own',
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    amount: 8000n,
  });
  assertEquals(w.owed(e.sujal, e.mint), 8000n);
  assertEquals(w.owed(e.sujal, e.krish), 0n);
  assertEquals(w.trialBalance(e.krish), { debits: 0n, credits: 0n }, 'carrying cash is not owning it');
  assertEquals(w.moneyAt(l.cashKrish, e.mint), 12000n);
  assertLedgerSound(w);
});

Deno.test('an outside party keeps no books: only the giver posts; a loan makes the party the debtor', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  const [item] = post(w, {
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    purpose: 'loan',
    repayable: true,
    giverSide: 'own',
    receiverId: e.customer,
    amount: 5000n,
  });
  assertEquals(w.openItem(item).debtorId, e.customer);
  assertEquals(w.openItem(item).debtorRole, undefined, 'no payable line in books that do not exist');
  assertLedgerSound(w);
});

// ---- Never assumed, never manufactured --------------------------------------------------------------------------

Deno.test('missing choices are asked for, in order, never assumed (CLASSIFICATION_REQUIRED)', () => {
  const x = krishWithCash();
  const { w, l } = x;
  const ask = (choice: Partial<GiveIntent>) => refused(() => planPosting(ownerToSujal(x, choice), w));
  assertEquals(ask({}).details.question, 'purpose', 'a non-repayable transfer is never assumed to be an expense');
  assertEquals(ask({ purpose: 'loan' }).details.question, 'repayable');
  assertEquals(ask({ purpose: 'loan', repayable: true }).details.question, 'giver_side');
  assertEquals(ask({ purpose: 'loan', repayable: true, giverSide: 'own' }).details.question, 'receiver_side');
  assertEquals(
    ask({ purpose: 'loan', repayable: true, giverSide: 'own', receiverSide: 'own' }).details.question,
    'receiver_location',
  );
  const noCategory = ask({
    purpose: 'gift',
    repayable: false,
    giverSide: 'expense',
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
  });
  assertEquals(noCategory.details.question, 'giver_category');
  const noIncome = ask({
    purpose: 'gift',
    repayable: false,
    giverSide: 'expense',
    giverCategoryId: w.cat('gifts_given'),
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
  });
  assertEquals(noIncome.details.question, 'receiver_income_category', 'the receiver’s income is chosen, not mirrored');
  for (const err of [ask({}), noCategory, noIncome]) assertEquals(err.code, 'CLASSIFICATION_REQUIRED');
});

Deno.test('a firm expense never becomes the owner’s income by itself: the owner side must be chosen', () => {
  const x = mintFunded();
  const { w, l } = x;
  const err = refused(() =>
    planPosting(
      firmToOwner(x, {
        purpose: 'personal_benefit',
        repayable: false,
        giverSide: 'expense',
        giverCategoryId: w.cat('travel'),
        receiverSide: 'own',
        receiverLocationId: l.cashKrish,
      }),
      w,
    )
  );
  assertEquals([err.code, err.details.question], ['CLASSIFICATION_REQUIRED', 'receiver_income_category']);
});

Deno.test('purposes that do not fit the real event are explained and refused (CLASSIFICATION_CONFLICT)', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 50000n);
  const conflict = (it: GiveIntent) => refused(() => planPosting(it, w)).code;
  const gift: Partial<GiveIntent> = {
    purpose: 'gift',
    repayable: false,
    giverSide: 'expense',
    giverCategoryId: w.cat('gifts_given'),
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    receiverIncomeCategoryId: w.cat('gift_received'),
  };
  // A loan that is not paid back; a gift that is.
  assertEquals(conflict(ownerToSujal(x, { ...gift, purpose: 'loan' })), 'CLASSIFICATION_CONFLICT');
  assertEquals(conflict(ownerToSujal(x, { ...gift, repayable: true })), 'CLASSIFICATION_CONFLICT');
  // A gift recorded as Own (not spent) by the giver.
  assertEquals(conflict(ownerToSujal(x, { ...gift, giverSide: 'own' })), 'CLASSIFICATION_CONFLICT');
  // A loan recorded as the giver's expense.
  assertEquals(
    conflict(ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'expense',
      giverCategoryId: w.cat('food'),
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
    })),
    'CLASSIFICATION_CONFLICT',
  );
  // A loan is not income for the borrower.
  assertEquals(
    conflict(ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      receiverIncomeCategoryId: w.cat('other_income'),
    })),
    'CLASSIFICATION_CONFLICT',
  );
  // A firm does not give its owner gifts; an owner benefit goes through its own purposes.
  assertEquals(
    conflict(firmToOwner(x, { ...gift, giverCategoryId: w.cat('gifts_given'), receiverLocationId: l.cashKrish })),
    'CLASSIFICATION_CONFLICT',
  );
  // A personal benefit is for an owner of the firm, not anyone else.
  assertEquals(
    conflict({
      type: 'give',
      giverId: e.mint,
      giverLocationId: l.tijori,
      purpose: 'personal_benefit',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('travel'),
      receiverId: e.sujal,
      receiverSide: 'own',
      receiverLocationId: l.cashSujal,
      receiverIncomeCategoryId: w.cat('other_income'),
      amount: 100n,
    }),
    'CLASSIFICATION_CONFLICT',
  );
  // A reimbursement repays money already spent: it cannot be the receiver's new expense.
  assertEquals(
    conflict(ownerToSujal(x, {
      purpose: 'reimbursement',
      repayable: false,
      giverSide: 'expense',
      giverCategoryId: w.cat('courier'),
      receiverSide: 'expense',
      receiverExpenseCategoryId: w.cat('courier'),
      receiverRecoveryCategoryId: w.cat('courier'),
    })),
    'CLASSIFICATION_CONFLICT',
  );
  // The receiver's expense cannot also arrive in a place of theirs.
  assertEquals(
    conflict(ownerToSujal(x, {
      purpose: 'loan',
      repayable: true,
      giverSide: 'own',
      receiverSide: 'expense',
      receiverLocationId: l.cashSujal,
      receiverExpenseCategoryId: w.cat('food'),
    })),
    'CLASSIFICATION_CONFLICT',
  );
});

Deno.test('ownership is checked, never assumed (NOT_AN_OWNER); giving to oneself is refused', () => {
  const x = krishWithCash();
  const { w, e, l } = x;
  fund(w, e.mint, l.tijori, 1000n);
  for (const purpose of ['drawings', 'distribution'] as const) {
    const notOwner = refused(() =>
      planPosting({
        type: 'give',
        giverId: e.mint,
        giverLocationId: l.tijori,
        purpose,
        repayable: false,
        giverSide: 'own',
        receiverId: e.sujal,
        receiverSide: 'own',
        receiverLocationId: l.cashSujal,
        receiverIncomeCategoryId: purpose === 'distribution' ? w.cat('distribution_received') : undefined,
        amount: 100n,
      }, w)
    );
    assertEquals(notOwner.code, 'NOT_AN_OWNER', purpose);
  }
  const self = ownerToSujal(x, {
    purpose: 'loan',
    repayable: true,
    giverSide: 'own',
    receiverSide: 'own',
    receiverLocationId: l.cashKrish,
  });
  assertEquals(refused(() => planPosting({ ...self, receiverId: e.krish }, w)).code, 'SAME_SOURCE_DESTINATION');
});
