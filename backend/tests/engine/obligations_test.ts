/**
 * Income, advances, loans, capital and withdrawals, inter-entity transfers, settlements and set-off
 * (RULEBOOK-01 §15–§30, RULEBOOK-02 §19–§62, RULEBOOK-03 §72 tests 13–20).
 */
import { assertEquals, assertThrows } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

Deno.test("income: received directly, on credit, and by someone else on the owner's behalf", () => {
  const { w, e, l } = exampleWorld();
  post(w, {
    type: 'income',
    ownerId: e.mint,
    categoryId: w.cat('sales'),
    amount: 30000n,
    receivedAt: { entityId: e.mint, locationId: l.savanBank },
  });
  assertEquals(w.balance(e.mint, 'revenue'), 30000n);
  const [credit] = post(w, {
    type: 'income',
    ownerId: e.mint,
    categoryId: w.cat('sales'),
    amount: 100000n,
    customerId: e.customer,
  });
  assertEquals(w.balance(e.mint, 'customer_receivable', { counterpartyId: e.customer }), 100000n);
  post(w, {
    type: 'settlement',
    payerId: e.customer,
    payeeId: e.mint,
    payeeLocationId: l.savanBank,
    allocations: [{ openItemId: credit, amount: 35000n }],
  });
  assertEquals(w.openItem(credit).remaining, 65000n, 'partial receipt keeps the rest outstanding');
  post(w, {
    type: 'income',
    ownerId: e.mint,
    categoryId: w.cat('commission'),
    amount: 8000n,
    receivedAt: { entityId: e.sujal, locationId: l.cashSujal },
  });
  assertEquals(w.owed(e.sujal, e.mint), 8000n, "the worker holds Mint's money and owes it");
  assertEquals(w.balance(e.sujal, 'revenue'), 0n, "not the worker's income");
  assertLedgerSound(w);
});

Deno.test('unknown money is never income: it waits in suspense', () => {
  const { w, e, l } = exampleWorld();
  post(w, { type: 'unidentified_receipt', entityId: e.mint, locationId: l.savanBank, amount: 50000n });
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertEquals(w.balance(e.mint, 'suspense'), -50000n);
  assertLedgerSound(w);
});

Deno.test('acceptance 13–16: advance given, used, overspent and returned', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  const [adv] = post(w, {
    type: 'advance_give',
    giverId: e.mint,
    fromLocationId: l.tijori,
    holderId: e.sujal,
    amount: 50000n,
  });
  assertEquals(w.balance(e.mint, 'expense'), 0n, 'an advance is not an expense when given');
  assertEquals(w.trialBalance(e.sujal), { debits: 0n, credits: 0n }, "not part of the holder's personal worth");
  post(w, { type: 'advance_account', advanceOpenItemId: adv, uses: [{ categoryId: w.cat('travel'), amount: 35000n }] });
  assertEquals(w.openItem(adv).remaining, 15000n);
  post(w, {
    type: 'advance_account',
    advanceOpenItemId: adv,
    uses: [],
    returned: { amount: 15000n, toLocationId: l.tijori },
  });
  assertEquals(w.openItem(adv).status, 'settled');
  assertEquals(w.balance(e.mint, 'advances_given', { counterpartyId: e.sujal }), 0n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 65000n);

  const [adv2] = post(w, {
    type: 'advance_give',
    giverId: e.mint,
    fromLocationId: l.tijori,
    holderId: e.sujal,
    amount: 10000n,
  });
  fund(w, e.sujal, l.cashSujal, 5000n);
  post(w, {
    type: 'advance_account',
    advanceOpenItemId: adv2,
    uses: [{ categoryId: w.cat('hotel'), amount: 12000n }],
    overspendFromLocationId: l.cashSujal,
  });
  assertEquals(w.openItem(adv2).status, 'settled');
  assertEquals(w.owed(e.mint, e.sujal), 2000n, 'the firm owes the worker the extra spent');
  assertLedgerSound(w);
});

Deno.test('advance: returning more than remains is refused', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 10000n);
  const [adv] = post(w, {
    type: 'advance_give',
    giverId: e.mint,
    fromLocationId: l.tijori,
    holderId: e.sujal,
    amount: 5000n,
  });
  const err = assertThrows(() =>
    planPosting({
      type: 'advance_account',
      advanceOpenItemId: adv,
      uses: [{ categoryId: w.cat('food'), amount: 3000n }],
      returned: { amount: 3000n, toLocationId: l.tijori },
    }, w), FinlyError);
  assertEquals(err.code, 'SETTLEMENT_EXCEEDS_REMAINING');
});

Deno.test('loan between firms: principal is no income or expense; repayment splits principal and interest', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.firmB, l.drawer, 500000n);
  const [loanItem] = post(w, {
    type: 'loan',
    lenderId: e.firmB,
    borrowerId: e.mint,
    amount: 500000n,
    lenderLocationId: l.drawer,
    borrowerLocationId: l.savanBank,
  });
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertEquals(w.balance(e.firmB, 'expense'), 0n);
  assertEquals(w.balance(e.mint, 'loans_taken', { counterpartyId: e.firmB }), 500000n);
  post(w, {
    type: 'loan_repayment',
    loanOpenItemId: loanItem,
    principal: 100000n,
    interest: 10000n,
    payerLocationId: l.savanBank,
    payeeLocationId: l.drawer,
  });
  assertEquals(w.openItem(loanItem).remaining, 400000n);
  assertEquals(w.balance(e.mint, 'expense'), 10000n, 'interest is an expense');
  assertEquals(w.balance(e.firmB, 'revenue'), 10000n, 'interest is income');
  assertLedgerSound(w);
});

Deno.test('bank loan: only the firm keeps books; principal received is a liability', () => {
  const { w, e, l } = exampleWorld();
  post(w, { type: 'loan', lenderId: e.bank, borrowerId: e.mint, amount: 980000n, borrowerLocationId: l.savanBank });
  assertEquals(w.balance(e.mint, 'loans_taken', { counterpartyId: e.bank }), 980000n);
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertLedgerSound(w);
});

Deno.test('acceptance 17: owner withdraws and later returns money; capital vs withdrawal mirror each other', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 300000n);
  post(w, {
    type: 'capital_contribution',
    personId: e.krish,
    firmId: e.mint,
    amount: 200000n,
    personLocationId: l.krishBank,
    firmLocationId: l.savanBank,
  });
  assertEquals(w.balance(e.mint, 'owner_capital', { counterpartyId: e.krish }), 200000n);
  assertEquals(w.balance(e.mint, 'revenue'), 0n, 'capital is not income');
  post(w, {
    type: 'withdrawal',
    firmId: e.mint,
    personId: e.krish,
    amount: 30000n,
    firmLocationId: l.savanBank,
    personLocationId: l.cashKrish,
  });
  assertEquals(w.balance(e.mint, 'owner_drawings', { counterpartyId: e.krish }), 30000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), 170000n);
  assertThrows(() =>
    planPosting({
      type: 'withdrawal',
      firmId: e.mint,
      personId: e.sujal,
      amount: 1n,
      firmLocationId: l.savanBank,
      personLocationId: l.cashSujal,
    }, w), FinlyError);
  assertLedgerSound(w);
});

Deno.test('acceptance 18: Firm A and Firm B owe each other; set-off keeps both originals and nets them', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  fund(w, e.firmB, l.drawer, 100000n);
  const [bOwesA] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.savanBank, amount: 50000n }],
    allocations: [{ ownerId: e.firmB, categoryId: w.cat('rent'), amount: 50000n }],
  });
  const [aOwesB] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.firmB, locationId: l.drawer, amount: 20000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('rent'), amount: 20000n }],
  });
  post(w, { type: 'offset', itemAId: bOwesA, itemBId: aOwesB, amount: 20000n });
  assertEquals(w.openItem(bOwesA).remaining, 30000n);
  assertEquals(w.openItem(aOwesB).status, 'settled');
  assertEquals(w.openItem(bOwesA).original, 50000n, 'the original stays');
  post(w, {
    type: 'settlement',
    payerId: e.firmB,
    payeeId: e.mint,
    payerLocationId: l.drawer,
    payeeLocationId: l.savanBank,
    allocations: [{ openItemId: bOwesA, amount: 30000n }],
  });
  assertEquals(w.owed(e.firmB, e.mint), 0n);
  assertEquals(w.balance(e.firmB, 'expense'), 50000n, 'settlement does not create a second expense');
  assertLedgerSound(w);
});

Deno.test('acceptance 19–20: one payment settles several items; one item settled by several payments', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 100000n);
  fund(w, e.mint, l.savanBank, 100000n);
  const [i1] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('travel'), amount: 10000n }],
  });
  const [i2] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 15000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('hotel'), amount: 15000n }],
  });
  post(w, {
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.krish,
    payerLocationId: l.savanBank,
    payeeLocationId: l.krishBank,
    allocations: [{ openItemId: i1, amount: 10000n }, { openItemId: i2, amount: 5000n }],
  });
  assertEquals(w.openItem(i1).status, 'settled');
  assertEquals(w.openItem(i2).remaining, 10000n);
  for (const amount of [4000n, 6000n]) {
    post(w, {
      type: 'settlement',
      payerId: e.mint,
      payeeId: e.krish,
      payerLocationId: l.savanBank,
      payeeLocationId: l.krishBank,
      allocations: [{ openItemId: i2, amount }],
    });
  }
  assertEquals(w.openItem(i2).status, 'settled');
  assertEquals(w.owed(e.mint, e.krish), 0n);
  assertLedgerSound(w);
});

Deno.test('settlement: overpaying an item, or paying the wrong party, is refused', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 10000n);
  const [item] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('travel'), amount: 10000n }],
  });
  const over = assertThrows(() =>
    planPosting({
      type: 'settlement',
      payerId: e.mint,
      payeeId: e.krish,
      payerLocationId: l.savanBank,
      payeeLocationId: l.krishBank,
      allocations: [{ openItemId: item, amount: 10001n }],
    }, w), FinlyError);
  assertEquals(over.code, 'SETTLEMENT_EXCEEDS_REMAINING');
  const wrong = assertThrows(() =>
    planPosting({
      type: 'settlement',
      payerId: e.jsk,
      payeeId: e.krish,
      payerLocationId: l.hdfc,
      payeeLocationId: l.krishBank,
      allocations: [{ openItemId: item, amount: 100n }],
    }, w), FinlyError);
  assertEquals(wrong.code, 'SETTLEMENT_PARTY_MISMATCH');
});

Deno.test('money lent between firms is never an expense or income: an explicit repayable creates the due', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.jsk, l.hdfc, 100000n);
  post(w, {
    type: 'give',
    giverId: e.jsk,
    giverLocationId: l.hdfc,
    giverSide: 'own',
    receiverId: e.mint,
    receiverSide: 'own',
    receiverLocationId: l.savanBank,
    purpose: 'loan',
    repayable: true,
    amount: 50000n,
  });
  assertEquals(w.balance(e.jsk, 'expense'), 0n);
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertEquals(w.owed(e.mint, e.jsk), 50000n);
  assertLedgerSound(w);
});

Deno.test('acceptance 21 (engine part): cash shortage is an approved adjustment, never an edited balance', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  post(w, {
    type: 'cash_adjustment',
    entityId: e.mint,
    locationId: l.tijori,
    amount: 2000n,
    direction: 'short',
    categoryId: w.cat('cash_difference'),
  });
  assertEquals(w.moneyAt(l.tijori, e.mint), 98000n);
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('cash_difference') }), 2000n);
  assertLedgerSound(w);
});
