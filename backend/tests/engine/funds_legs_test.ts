/**
 * Funds on obligations, settlement kinds and leg references — what the database must be able to store exactly
 * (docs/database review: open items carry funds, settlements their kind, lines their business leg).
 */
import { assertEquals, assertThrows } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import { assertLedgerSound, exampleWorld, fund, post } from '../support/world.ts';

Deno.test('a bill charged to the reserve fund is cleared in the reserve fund, not the default one', () => {
  const { w, e, l } = exampleWorld();
  const reserve = `${e.mint}:reserve`;
  post(w, { type: 'opening_balance', entityId: e.mint, locationId: l.savanBank, amount: 50000n, fundId: reserve });
  const [item] = post(w, {
    type: 'bill',
    ownerId: e.mint,
    supplierId: e.hotelVendor,
    lines: [{ categoryId: w.cat('hotel'), amount: 10000n, fundId: reserve }],
  });
  assertEquals(w.openItem(item).debtorFundId, reserve);
  const plan = planPosting({
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.hotelVendor,
    payerLocationId: l.savanBank,
    allocations: [{ openItemId: item, amount: 10000n }],
  }, w);
  assertEquals(new Set(plan.journals.flatMap((j) => j.lines.map((x) => x.fundId))), new Set([reserve]));
  w.apply(plan);
  assertEquals(w.balance(e.mint, 'supplier_payable', { counterpartyId: e.hotelVendor, fundId: reserve }), 0n);
  assertLedgerSound(w);
});

Deno.test('a bill spread over two funds creates one open item per fund', () => {
  const { w, e } = exampleWorld();
  const items = post(w, {
    type: 'bill',
    ownerId: e.mint,
    supplierId: e.hotelVendor,
    lines: [
      { categoryId: w.cat('hotel'), amount: 6000n },
      { categoryId: w.cat('food'), amount: 4000n, fundId: `${e.mint}:travel` },
    ],
  });
  assertEquals(items.length, 2);
  assertEquals(items.map((id) => w.openItem(id).original).sort(), [4000n, 6000n]);
  assertLedgerSound(w);
});

Deno.test('an advance accounted for records "used" and "returned" as two settlements of their own kind', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.tijori, 50000n);
  const [adv] = post(w, {
    type: 'advance_give',
    giverId: e.mint,
    fromLocationId: l.tijori,
    holderId: e.sujal,
    amount: 50000n,
  });
  const plan = planPosting({
    type: 'advance_account',
    advanceOpenItemId: adv,
    uses: [{ categoryId: w.cat('travel'), amount: 42000n }],
    returned: { amount: 8000n, toLocationId: l.tijori },
  }, w);
  assertEquals(plan.settlements.map((s) => [s.kind, s.amount]), [['advance_use', 42000n], ['advance_return', 8000n]]);
  w.apply(plan);
  assertEquals(w.openItem(adv).status, 'settled');
  assertLedgerSound(w);
});

Deno.test('payments, set-offs and loan repayments carry their settlement kind', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 20000n);
  const [item] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 10000n }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('travel'), amount: 10000n }],
  });
  const plan = planPosting({
    type: 'settlement',
    payerId: e.mint,
    payeeId: e.krish,
    payerLocationId: l.savanBank,
    payeeLocationId: l.krishBank,
    allocations: [{ openItemId: item, amount: 1000n }],
  }, w);
  assertEquals(plan.settlements[0].kind, 'payment');
});

Deno.test('expense lines point at the source and allocation legs that produced them', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.krish, l.krishBank, 50000n);
  const plan = planPosting({
    type: 'expense',
    sources: [{ entityId: e.krish, locationId: l.krishBank, amount: 45000n }],
    allocations: [
      { ownerId: e.mint, categoryId: w.cat('hotel'), amount: 30000n },
      { ownerId: e.jsk, categoryId: w.cat('travel'), amount: 5000n },
      { ownerId: e.krish, categoryId: w.cat('food'), amount: 10000n },
    ],
  }, w);
  const mint = plan.journals.find((j) => j.entityId === e.mint)!;
  assertEquals(mint.lines.map((x) => x.leg), [{ kind: 'allocation', index: 0 }, { kind: 'allocation', index: 0 }]);
  const krish = plan.journals.find((j) => j.entityId === e.krish)!;
  const krishMoney = krish.lines.filter((x) => x.locationId === l.krishBank);
  assertEquals(krishMoney.every((x) => x.leg?.kind === 'source' && x.leg.index === 0), true);
  const krishFood = krish.lines.find((x) => x.categoryId === w.cat('food'))!;
  assertEquals(krishFood.leg, { kind: 'allocation', index: 2 });
});

Deno.test('an entity paying its own expense from one fund and charging another is refused', () => {
  const { w, e, l } = exampleWorld();
  const err = assertThrows(() =>
    planPosting({
      type: 'expense',
      sources: [{ entityId: e.mint, locationId: l.tijori, amount: 1000n }],
      allocations: [{ ownerId: e.mint, categoryId: w.cat('rent'), amount: 1000n, fundId: `${e.mint}:reserve` }],
    }, w), FinlyError);
  assertEquals(err.code, 'FUND_MISMATCH');
});

Deno.test('set-off of items carried in different funds is refused', () => {
  const { w, e, l } = exampleWorld();
  fund(w, e.mint, l.savanBank, 100000n);
  fund(w, e.firmB, l.drawer, 100000n);
  const [bOwesA] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.mint, locationId: l.savanBank, amount: 5000n }],
    allocations: [{ ownerId: e.firmB, categoryId: w.cat('rent'), amount: 5000n }],
  });
  post(w, { type: 'opening_balance', entityId: e.firmB, locationId: l.drawer, amount: 5000n, fundId: `${e.firmB}:x` });
  const [aOwesB] = post(w, {
    type: 'expense',
    sources: [{ entityId: e.firmB, locationId: l.drawer, amount: 2000n, fundId: `${e.firmB}:x` }],
    allocations: [{ ownerId: e.mint, categoryId: w.cat('rent'), amount: 2000n }],
  });
  const err = assertThrows(
    () => planPosting({ type: 'offset', itemAId: bOwesA, itemBId: aOwesB, amount: 2000n }, w),
    FinlyError,
  );
  assertEquals(err.code, 'FUND_MISMATCH');
});
