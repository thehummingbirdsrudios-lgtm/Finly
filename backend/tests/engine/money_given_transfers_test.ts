/**
 * Money given to people outside the firm (RULEBOOK-03 §72 tests 9–12, in the F8/F9 model of GATE-RESPONSE-04) and
 * transfers / handovers (F2).
 */
import { assertEquals, assertThrows } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

// RULEBOOK-03 §72 acceptance tests 9–12, expressed in the F8/F9 model (GATE-RESPONSE-04): the same outcomes, each
// reached by explicit choices instead of a debt or a merged two-step event being assumed.

Deno.test('acceptance 9: firm money for the worker’s own use, owed back — explicit `repayable`', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  post(w, {
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.tijori,
    giverSide: 'own',
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    arrangement: 'repayable',
    amount: 20000n,
  });
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.owed(e.sujal, e.mint), 20000n);
  assertEquals(w.balance(e.sujal, 'cash', { locationId: l.cashSujal }), 20000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertLedgerSound(w);
});

Deno.test('acceptance 10: a final firm expense paid to the worker — nothing owed', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  const plan = planPosting({
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.tijori,
    giverSide: 'expense',
    giverCategoryId: w.cat('labour'),
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    receiverIncomeCategoryId: w.cat('salary_received'),
    arrangement: 'none',
    amount: 20000n,
  }, w);
  assertEquals(plan.openItems, []);
  w.apply(plan);
  assertEquals(w.balance(e.mint, 'expense'), 20000n);
  assertEquals(w.owed(e.sujal, e.mint), 0n);
  assertEquals(w.balance(e.sujal, 'revenue'), 20000n, 'the worker records his own side (F9: both sides classify)');
  assertLedgerSound(w);
});

Deno.test('acceptance 11 (F9 Option A): two separate events — owner owes firm, worker owes owner', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  const first = planPosting({
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.tijori,
    giverSide: 'own',
    receiverId: e.krish,
    receiverSide: 'own',
    receiverLocationId: l.cashKrish,
    arrangement: 'repayable',
    amount: 20000n,
  }, w);
  assertEquals(first.journals.map((j) => j.step), [1, 1], 'one event, one step: never merged with what follows');
  w.apply(first);
  post(w, {
    type: 'give',
    giverId: e.krish,
    giverLocationId: l.cashKrish,
    giverSide: 'own',
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    arrangement: 'repayable',
    amount: 20000n,
  });
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.owed(e.krish, e.mint), 20000n);
  assertEquals(w.owed(e.sujal, e.krish), 20000n);
  assertEquals(w.balance(e.krish, 'cash', { locationId: l.cashKrish }), 0n, 'passed on in full');
  assertLedgerSound(w);
});

Deno.test('acceptance 12 (F9 Option B): the owner only carries firm cash, then the firm pays — no personal entries', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  post(w, { type: 'transfer', entityId: e.mint, fromLocationId: l.tijori, toLocationId: l.cashKrish, amount: 20000n });
  const plan = planPosting({
    type: 'give',
    giverId: e.mint,
    giverLocationId: l.cashKrish,
    giverSide: 'expense',
    giverCategoryId: w.cat('labour'),
    receiverId: e.sujal,
    receiverSide: 'own',
    receiverLocationId: l.cashSujal,
    receiverIncomeCategoryId: w.cat('salary_received'),
    arrangement: 'none',
    amount: 20000n,
  }, w);
  assertEquals(plan.openItems, []);
  w.apply(plan);
  assertEquals(w.balance(e.mint, 'expense'), 20000n);
  assertEquals(w.moneyAt(l.cashKrish, e.mint), 0n);
  assertEquals(w.trialBalance(e.krish), { debits: 0n, credits: 0n }, "firm money never entered Krish's books");
  assertLedgerSound(w);
});

Deno.test('transfer: Tijori → office drawer moves location only; no income or expense', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  post(w, { type: 'transfer', entityId: e.mint, fromLocationId: l.tijori, toLocationId: l.drawer, amount: 20000n });
  assertEquals(w.moneyAt(l.tijori, e.mint), 30000n);
  assertEquals(w.moneyAt(l.drawer, e.mint), 20000n);
  assertEquals(w.balance(e.mint, 'expense'), 0n);
  assertEquals(w.balance(e.mint, 'revenue'), 0n);
  assertLedgerSound(w);
});

Deno.test('transfer to the same place is refused', () => {
  const { w, e, l } = exampleWorld();
  const err = assertThrows(
    () =>
      planPosting(
        { type: 'transfer', entityId: e.mint, fromLocationId: l.tijori, toLocationId: l.tijori, amount: 1n },
        w,
      ),
    FinlyError,
  );
  assertEquals(err.code, 'SAME_SOURCE_DESTINATION');
});

Deno.test('custody chain: Mint money Krish → Sujal → Tijori, ownership and fund never change', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 50000n);
  post(w, {
    type: 'transfer',
    entityId: e.mint,
    fromLocationId: l.savanBank,
    toLocationId: l.cashKrish,
    amount: 50000n,
  });
  post(w, {
    type: 'transfer',
    entityId: e.mint,
    fromLocationId: l.cashKrish,
    toLocationId: l.cashSujal,
    amount: 50000n,
  });
  post(w, { type: 'transfer', entityId: e.mint, fromLocationId: l.cashSujal, toLocationId: l.tijori, amount: 50000n });
  assertEquals(w.moneyAt(l.tijori, e.mint), 50000n);
  assertEquals(w.moneyAt(l.cashKrish), 0n);
  assertEquals(w.moneyAt(l.cashSujal), 0n);
  assertEquals(w.balance(e.mint, 'cash') + w.balance(e.mint, 'bank'), 50000n);
  assertEquals(w.trialBalance(e.sujal), { debits: 0n, credits: 0n }, 'holding money is not owning it');
  assertLedgerSound(w);
});

Deno.test('handover with confirmation ON waits in transit until the receiver confirms', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.cashKrish, 10000n);
  post(w, {
    type: 'transfer',
    entityId: e.mint,
    fromLocationId: l.cashKrish,
    toLocationId: l.cashSujal,
    amount: 10000n,
    viaTransit: true,
  });
  assertEquals(w.balance(e.mint, 'cash_in_transit'), 10000n);
  assertEquals(w.moneyAt(l.cashSujal, e.mint), 0n);
  post(w, { type: 'transit_confirm', entityId: e.mint, toLocationId: l.cashSujal, amount: 10000n });
  assertEquals(w.balance(e.mint, 'cash_in_transit'), 0n);
  assertEquals(w.moneyAt(l.cashSujal, e.mint), 10000n);
  assertLedgerSound(w);
});

Deno.test("the Tijori holds several owners' money; its total is the sum of each owner's cash there", () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 400000n);
  fund(w, e.jsk, l.tijori, 300000n);
  fund(w, e.krish, l.tijori, 200000n);
  fund(w, e.father, l.tijori, 100000n);
  assertEquals(w.moneyAt(l.tijori), 1000000n);
  assertEquals(w.moneyAt(l.tijori, e.jsk), 300000n);
  assertLedgerSound(w);
});

Deno.test('cash lines record who held the place at posting time', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 1000n);
  const line = w.lines.find((x) => x.locationId === l.tijori)!;
  const planned = w.journals[line.journalIndex].lines.find((x) => x.locationId === l.tijori)!;
  assertEquals(planned.holderPersonId, e.father);
});
