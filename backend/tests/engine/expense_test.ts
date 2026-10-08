/**
 * Expenses: source of money ≠ expense owner (owner's additional expense rule, RULEBOOK-03 §17–§19, §72 tests 1–8).
 */
import { assertEquals, assertThrows } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

Deno.test('acceptance 1: Firm A pays its own expense', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.tijori, amount: 20000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('hotel'), amount: 20000n }],
  });
  assertEquals(w.moneyAt(l.tijori, e.mint), 80000n);
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('hotel') }), 20000n);
  assertEquals(w.owed(e.mint, e.mint), 0n);
  assertLedgerSound(w);
});

Deno.test('acceptance 2: Firm A pays Firm B expense — B records the expense and owes A', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.savanBank, amount: 50000n }],
    allocations: [{ ownerId: e.firmB, categoryId: w.cat('travel'), amount: 50000n }],
  });
  assertEquals(w.moneyAt(l.savanBank, e.mint), 50000n);
  assertEquals(w.balance(e.firmB, 'expense', { categoryId: w.cat('travel') }), 50000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n, 'the payer records no expense');
  assertEquals(w.balance(e.mint, 'interentity_receivable', { counterpartyId: e.firmB }), 50000n);
  assertEquals(w.balance(e.firmB, 'interentity_payable', { counterpartyId: e.mint }), 50000n);
  assertEquals(w.owed(e.firmB, e.mint), 50000n);
  assertLedgerSound(w);
});

Deno.test('acceptance 3: Firm B pays Firm A expense', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.firmB, l.drawer, 20000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.firmB, locationId: l.drawer, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('courier'), amount: 10000n }],
  });
  assertEquals(w.owed(e.mint, e.firmB), 10000n);
  assertLedgerSound(w);
});

Deno.test('acceptance 4: personal money pays a firm expense — the firm owes the person', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 50000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('travel'), amount: 10000n }],
  });
  assertEquals(w.balance(e.mint, 'expense'), 10000n);
  assertEquals(w.balance(e.mint, 'interentity_payable', { counterpartyId: e.krish }), 10000n);
  assertEquals(w.balance(e.krish, 'interentity_receivable', { counterpartyId: e.mint }), 10000n);
  assertEquals(w.moneyAt(l.krishBank, e.krish), 40000n);
  assertEquals(w.owed(e.mint, e.krish), 10000n);
  assertLedgerSound(w);
});

Deno.test("acceptance 5 (F8): firm money pays its owner's personal expense — the treatment must be chosen", () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  const base = {
    type: 'expense' as const,
    sources: [{ entityId: e.mint, locationId: l.tijori, amount: 5000n }],
  };
  const err = assertThrows(
    () => planPosting({ ...base, allocations: [{ ownerId: e.krish, categoryId: w.cat('food'), amount: 5000n }] }, w),
    FinlyError,
  );
  assertEquals(err.code, 'CLASSIFICATION_REQUIRED');

  post(w, {
    ...base,
    allocations: [{ ownerId: e.krish, categoryId: w.cat('food'), amount: 5000n, ownerPersonalTreatment: 'withdrawal' }],
  });
  assertEquals(w.balance(e.mint, 'owner_drawings', { counterpartyId: e.krish }), 5000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n, 'not a business expense');
  assertEquals(w.balance(e.krish, 'expense'), 5000n);
  assertEquals(w.balance(e.krish, 'investment_in_firms', { counterpartyId: e.mint }), -5000n);
  assertEquals(w.owed(e.krish, e.mint), 0n, 'a withdrawal is not owed back');

  post(w, {
    ...base,
    allocations: [{ ownerId: e.krish, categoryId: w.cat('food'), amount: 5000n, ownerPersonalTreatment: 'owes' }],
  });
  assertEquals(w.owed(e.krish, e.mint), 5000n, 'owner owes the firm');
  assertLedgerSound(w);
});

Deno.test('acceptance 6–8: common expense — Mint ₹30,000 + JSK ₹5,000 + Personal ₹10,000 = ₹45,000', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 45000n }],
    allocations: [
      { ownerId: e.mint, categoryId: w.cat('hotel'), amount: 30000n },
      { ownerId: e.jsk, categoryId: w.cat('travel'), amount: 5000n },
      { ownerId: e.krish, categoryId: w.cat('food'), amount: 10000n },
    ],
  });
  assertEquals(w.moneyAt(l.krishBank, e.krish), 55000n);
  assertEquals(w.balance(e.mint, 'expense'), 30000n);
  assertEquals(w.balance(e.jsk, 'expense'), 5000n);
  assertEquals(w.balance(e.krish, 'expense'), 10000n);
  assertEquals(w.owed(e.mint, e.krish), 30000n);
  assertEquals(w.owed(e.jsk, e.krish), 5000n);
  assertLedgerSound(w);
});

Deno.test('allocation that does not add up is refused — nothing is assigned automatically', () => {
  const { w, e, l } = exampleWorld();
  const err = assertThrows(() =>
    planPosting({
      type: 'expense',
      sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 45000n }],
      allocations: [
        { ownerId: e.mint, categoryId: w.cat('hotel'), amount: 30000n },
        { ownerId: e.jsk, categoryId: w.cat('travel'), amount: 5000n },
        { ownerId: e.krish, categoryId: w.cat('food'), amount: 8000n },
      ],
    }, w), FinlyError);
  assertEquals(err.code, 'ALLOCATION_MISMATCH');
  assertEquals(err.details.difference, 2000n);
});

Deno.test('one expense paid from two sources (₹40,000 cash + ₹60,000 bank)', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 40000n);
  fund(w, e.mint, l.savanBank, 60000n);
  post(w, {
    type: 'expense',
    sources: [
      { entityId: e.mint, locationId: l.tijori, amount: 40000n },
      { entityId: e.mint, locationId: l.savanBank, amount: 60000n },
    ],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('rent'), amount: 100000n }],
  });
  assertEquals(w.moneyAt(l.tijori, e.mint), 0n);
  assertEquals(w.moneyAt(l.savanBank, e.mint), 0n);
  assertEquals(w.balance(e.mint, 'expense'), 100000n);
  assertLedgerSound(w);
});

Deno.test('a trip with lines owned by different entities (RULEBOOK-03 §21)', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.cashKrish, 30000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.cashKrish, amount: 21000n }],
    allocations: [
      { ownerId: e.mint, categoryId: w.cat('hotel'), amount: 12000n },
      { ownerId: e.krish, categoryId: w.cat('food'), amount: 4000n },
      { ownerId: e.jsk, categoryId: w.cat('petrol'), amount: 3000n },
      { ownerId: e.mint, categoryId: w.cat('courier'), amount: 2000n },
    ],
  });
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('hotel') }), 12000n);
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('courier') }), 2000n);
  assertEquals(w.owed(e.mint, e.krish), 14000n);
  assertEquals(w.owed(e.jsk, e.krish), 3000n);
  assertLedgerSound(w);
});

Deno.test('unpaid bill is recorded once; paying it settles the payable and creates no second expense', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 50000n);
  const [billItem] = post(w, {
    type: 'bill',
    ownerId: e.mint,
    supplierId: e.hotelVendor,
    lines: [{ categoryId: w.cat('hotel'), amount: 10000n }],
  });
  assertEquals(w.balance(e.mint, 'expense'), 10000n);
  assertEquals(w.balance(e.mint, 'supplier_payable', { counterpartyId: e.hotelVendor }), 10000n);
  post(w, {
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.hotelVendor,
    payerLocationId: l.savanBank,
    allocations: [{ openItemId: billItem, amount: 4000n }],
  });
  assertEquals(w.openItem(billItem).remaining, 6000n);
  assertEquals(w.openItem(billItem).status, 'partially_settled');
  post(w, {
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.hotelVendor,
    payerLocationId: l.savanBank,
    allocations: [{ openItemId: billItem, amount: 6000n }],
  });
  assertEquals(w.balance(e.mint, 'expense'), 10000n, 'still ₹10,000, not ₹20,000');
  assertEquals(w.balance(e.mint, 'supplier_payable', { counterpartyId: e.hotelVendor }), 0n);
  assertEquals(w.openItem(billItem).status, 'settled');
  assertEquals(w.moneyAt(l.savanBank, e.mint), 40000n);
  assertLedgerSound(w);
});

Deno.test('an expense owned by an outside party is refused (parties keep no books)', () => {
  const { w, e, l } = exampleWorld();
  assertThrows(() =>
    planPosting({
      type: 'expense',
      sources: [{ entityId: e.mint, locationId: l.tijori, amount: 1000n }],
      allocations: [{ ownerId: e.hotelVendor, categoryId: w.cat('hotel'), amount: 1000n }],
    }, w), FinlyError);
});

Deno.test('an income category cannot be used for an expense', () => {
  const { w, e, l } = exampleWorld();
  const err = assertThrows(() =>
    planPosting({
      type: 'expense',
      sources: [{ entityId: e.mint, locationId: l.tijori, amount: 1000n }],
      allocations: [{ ownerId: e.mint, categoryId: w.cat('sales'), amount: 1000n }],
    }, w), FinlyError);
  assertEquals(err.code, 'VALIDATION');
});
