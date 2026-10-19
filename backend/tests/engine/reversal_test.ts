/**
 * Reversal and correction (RULEBOOK-01 §56–57, RULEBOOK-02 §90–92, RULEBOOK-03 §52–53, ADDON-16 §6.9): the original
 * stays, its mirror undoes exactly its effect, once; settled obligations block it until their settlements are undone;
 * a correction is the reversal and the right entry together.
 */
import { assert, assertEquals, assertThrows } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import type { Id } from '../../src/domain/ids.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

function code(fn: () => unknown): string {
  return assertThrows(fn, FinlyError).code;
}

Deno.test('a reversal mirrors the entry exactly, keeps the original, and happens once', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.tijori, amount: 20000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('hotel'), amount: 20000n }],
  });
  const original = w.lastTxnId!;
  const linesBefore = w.lines.length;
  post(w, { type: 'reversal', txnId: original });

  assertEquals(w.moneyAt(l.tijori, e.mint), 100000n, 'the money is back where it was');
  assertEquals(w.balance(e.mint, 'expense'), 0n, 'the expense is gone');
  assertEquals(w.lines.length, linesBefore * 2 - 2, 'nothing was edited: the mirror adds a line for each line');
  assertEquals(w.postedEvent(original).status, 'reversed');
  const reversal = w.postedEvent(w.lastTxnId!);
  const originalJournals = w.postedEvent(original).journals;
  assertEquals(reversal.journals.map((j) => j.reversalOfJournalId), originalJournals.map((j) => j.id));
  for (const [i, j] of reversal.journals.entries()) {
    assertEquals(j.kind, 'reversal');
    for (const [k, line] of j.lines.entries()) {
      const was = originalJournals[i].lines[k];
      assertEquals({ ...line, side: was.side }, was, 'same account, amount and dimensions');
      assert(line.side !== was.side, 'the side is swapped');
    }
  }
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: original }, w)), 'ALREADY_REVERSED');
  assertEquals(
    code(() => planPosting({ type: 'reversal', txnId: w.lastTxnId! }, w)),
    'VALIDATION',
    'a reversal is never itself reversed',
  );
  assertLedgerSound(w);
});

Deno.test('reversing an entry that left someone owing removes what is owed, in both books', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  const [item] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.savanBank, amount: 50000n }],
    allocations: [{ ownerId: e.firmB, categoryId: w.cat('travel'), amount: 50000n }],
  });
  assertEquals(w.owed(e.firmB, e.mint), 50000n);
  post(w, { type: 'reversal', txnId: w.lastTxnId! });
  assertEquals(w.openItem(item).status, 'reversed');
  assertEquals(w.owed(e.firmB, e.mint), 0n);
  assertEquals(w.balance(e.mint, 'interentity_receivable', { counterpartyId: e.firmB }), 0n);
  assertEquals(w.balance(e.firmB, 'interentity_payable', { counterpartyId: e.mint }), 0n);
  assertEquals(w.balance(e.firmB, 'expense'), 0n);
  assertEquals(w.moneyAt(l.savanBank, e.mint), 100000n);
  assertLedgerSound(w);
});

Deno.test('an entry whose obligation was settled is reversed only after its settlements are', () => {
  const { w, e, l } = exampleWorld();
  const [credit] = post(w, {
    type: 'income',
    ownerId: e.mint,
    categoryId: w.cat('sales'),
    amount: 100000n,
    customerId: e.customer,
  });
  const sale = w.lastTxnId!;
  post(w, {
    type: 'settlement',
    payerId: e.customer,
    payeeId: e.mint,
    payeeLocationId: l.savanBank,
    allocations: [{ openItemId: credit, amount: 35000n }],
  });
  const receipt = w.lastTxnId!;
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: sale }, w)), 'REVERSAL_BLOCKED_BY_SETTLEMENT');

  post(w, { type: 'reversal', txnId: receipt });
  assertEquals(w.openItem(credit).remaining, 100000n, 'the receipt given back: owed in full again');
  assertEquals(w.openItem(credit).status, 'open');
  assertEquals(w.moneyAt(l.savanBank, e.mint), 0n);

  post(w, { type: 'reversal', txnId: sale });
  assertEquals(w.openItem(credit).status, 'reversed');
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertEquals(w.balance(e.mint, 'customer_receivable', { counterpartyId: e.customer }), 0n);
  assertLedgerSound(w);
});

Deno.test('a loan with repayments cannot be reversed; one without can', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 500000n);
  const [loan] = post(w, {
    type: 'loan',
    lenderId: e.krish,
    borrowerId: e.mint,
    amount: 200000n,
    lenderLocationId: l.krishBank,
    borrowerLocationId: l.savanBank,
  });
  const given = w.lastTxnId!;
  post(w, {
    type: 'loan_repayment',
    loanOpenItemId: loan,
    principal: 50000n,
    interest: 0n,
    payerLocationId: l.savanBank,
    payeeLocationId: l.krishBank,
  });
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: given }, w)), 'REVERSAL_BLOCKED_BY_SETTLEMENT');
  post(w, { type: 'reversal', txnId: w.lastTxnId! });
  post(w, { type: 'reversal', txnId: given });
  assertEquals(w.openItem(loan).status, 'reversed');
  const repay = { type: 'loan_repayment' as const, loanOpenItemId: loan, principal: 0n, interest: 100n };
  assertEquals(
    code(() => planPosting({ ...repay, payerLocationId: l.savanBank, payeeLocationId: l.krishBank }, w)),
    'VALIDATION',
    'no interest on a reversed loan',
  );
  assertEquals(w.moneyAt(l.krishBank, e.krish), 500000n);
  assertEquals(w.moneyAt(l.savanBank, e.mint), 0n);
  assertLedgerSound(w);
});

Deno.test('a set-off reversed gives both obligations back', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  fund(w, e.jsk, l.hdfc, 100000n);
  const [jskOwesMint] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.savanBank, amount: 30000n }],
    allocations: [{ ownerId: e.jsk, categoryId: w.cat('rent'), amount: 30000n }],
  });
  const [mintOwesJsk] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.jsk, locationId: l.hdfc, amount: 20000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('rent'), amount: 20000n }],
  });
  post(w, { type: 'offset', itemAId: jskOwesMint, itemBId: mintOwesJsk, amount: 20000n });
  assertEquals(w.openItem(mintOwesJsk).status, 'settled');
  post(w, { type: 'reversal', txnId: w.lastTxnId! });
  assertEquals(w.openItem(jskOwesMint).remaining, 30000n);
  assertEquals(w.openItem(mintOwesJsk).remaining, 20000n);
  assertEquals(w.openItem(mintOwesJsk).status, 'open');
  assertLedgerSound(w);
});

Deno.test('a correction replaces a wrong amount: reversal and right entry in one event', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.tijori, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('food'), amount: 10000n }],
  });
  const wrong = w.lastTxnId!;
  post(w, {
    type: 'correction',
    txnId: wrong,
    replacement: {
      type: 'expense',
      sources: [{ entityId: e.mint, locationId: l.tijori, amount: 7000n }],
      allocations: [{ ownerId: e.mint, categoryId: w.cat('food'), amount: 7000n }],
    },
  });
  const fix = w.lastTxnId!;
  assertEquals(w.postedEvent(wrong).status, 'corrected');
  assertEquals(w.balance(e.mint, 'expense', { categoryId: w.cat('food') }), 7000n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 93000n);
  const steps = w.postedEvent(fix).journals.map((j) => `${j.kind}:${j.step}`);
  assertEquals(steps, ['reversal:1', 'standard:2'], 'the mirror first, then the right entry');
  assertEquals(
    code(() => planPosting({ type: 'correction', txnId: wrong, replacement: { type: 'reversal', txnId: wrong } }, w)),
    'VALIDATION',
  );
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: wrong }, w)), 'ALREADY_REVERSED');

  // Undoing the correction removes the corrected entry and leaves the wrong one undone: nothing remains.
  post(w, { type: 'reversal', txnId: fix });
  assertEquals(w.postedEvent(fix).status, 'reversed');
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertEquals(w.moneyAt(l.tijori, e.mint), 100000n);
  assertLedgerSound(w);
});

Deno.test('a correction may settle again what the corrected payment settled', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  const [bill] = post(w, {
    type: 'bill',
    ownerId: e.mint,
    supplierId: e.hotelVendor,
    lines: [{ categoryId: w.cat('hotel'), amount: 10000n }],
  });
  post(w, {
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.hotelVendor,
    payerLocationId: l.savanBank,
    allocations: [{ openItemId: bill, amount: 10000n }],
  });
  assertEquals(w.openItem(bill).status, 'settled');
  const payment: Id = w.lastTxnId!;
  post(w, {
    type: 'correction',
    txnId: payment,
    replacement: {
      type: 'settlement',
      payerId: e.mint,
      payeeId: e.hotelVendor,
      payerLocationId: l.savanBank,
      allocations: [{ openItemId: bill, amount: 9000n }],
    },
  });
  assertEquals(w.openItem(bill).remaining, 1000n, 'only 9,000 was really paid');
  assertEquals(w.openItem(bill).status, 'partially_settled');
  assertEquals(w.moneyAt(l.savanBank, e.mint), 91000n);
  assertLedgerSound(w);
});

Deno.test('an account or place deactivated since the entry stops its reversal until reactivated (Q10)', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 100000n);
  post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.tijori, amount: 5000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('courier'), amount: 5000n }],
  });
  const original = w.lastTxnId!;
  const expenseAccount = w.accountByCode(e.mint, '5700');
  expenseAccount.active = false;
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: original }, w)), 'ACCOUNT_INACTIVE');
  expenseAccount.active = true;
  const tijori = w.location(l.tijori);
  tijori.active = false;
  assertEquals(code(() => planPosting({ type: 'reversal', txnId: original }, w)), 'LOCATION_INACTIVE');
  tijori.active = true;
  post(w, { type: 'reversal', txnId: original });
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertLedgerSound(w);
});
