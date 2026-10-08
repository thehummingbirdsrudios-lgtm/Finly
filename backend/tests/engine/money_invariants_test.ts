import { assertEquals, assertThrows } from '@std/assert';
import { formatInr, groupIndian, parseRupees } from '../../src/domain/money.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { checkJournal } from '../../src/domain/ledger/invariants.ts';
import { exampleWorld } from '../support/world.ts';

Deno.test('money: Indian grouping and the rupee sign', () => {
  assertEquals(groupIndian(500n), '500');
  assertEquals(groupIndian(20000n), '20,000');
  assertEquals(groupIndian(500000n), '5,00,000');
  assertEquals(groupIndian(10000000n), '1,00,00,000');
  assertEquals(formatInr(1200000n), '₹12,00,000');
  assertEquals(formatInr(-5000n), '−₹5,000');
});

Deno.test('money: only whole positive rupees are accepted', () => {
  assertEquals(parseRupees('45000'), 45000n);
  assertEquals(parseRupees(45000), 45000n);
  for (const bad of ['45000.50', '-5', '0', '1,000', '', ' 5', 1.5, -1, 0, null, undefined, 'abc', '9999999999999']) {
    assertThrows(() => parseRupees(bad), FinlyError);
  }
});

Deno.test('invariants: an unbalanced journal is refused', () => {
  const { w, e, l } = exampleWorld();
  const cash = w.accountByRole(e.mint, 'cash');
  const capital = w.accountByRole(e.mint, 'opening_balance_equity');
  const fundId = w.entity(e.mint).defaultFundId;
  const err = assertThrows(() =>
    checkJournal({
      entityId: e.mint,
      kind: 'standard',
      step: 1,
      lines: [
        { entityId: e.mint, accountId: cash.id, side: 'Dr', amount: 5000n, fundId, locationId: l.tijori },
        { entityId: e.mint, accountId: capital.id, side: 'Cr', amount: 4000n, fundId },
      ],
    }, w), FinlyError);
  assertEquals(err.code, 'UNBALANCED_JOURNAL');
});

Deno.test('invariants: every fund balances on its own', () => {
  const { w, e, l } = exampleWorld();
  const cash = w.accountByRole(e.mint, 'cash');
  const obe = w.accountByRole(e.mint, 'opening_balance_equity');
  const err = assertThrows(() =>
    checkJournal({
      entityId: e.mint,
      kind: 'standard',
      step: 1,
      lines: [
        { entityId: e.mint, accountId: cash.id, side: 'Dr', amount: 5000n, fundId: 'fund-a', locationId: l.tijori },
        { entityId: e.mint, accountId: obe.id, side: 'Cr', amount: 5000n, fundId: 'fund-b' },
      ],
    }, w), FinlyError);
  assertEquals(err.code, 'UNBALANCED_JOURNAL');
});

Deno.test('invariants: cash lines need a place, party lines need a counterparty', () => {
  const { w, e } = exampleWorld();
  const cash = w.accountByRole(e.mint, 'cash');
  const obe = w.accountByRole(e.mint, 'opening_balance_equity');
  const fundId = w.entity(e.mint).defaultFundId;
  const err = assertThrows(() =>
    checkJournal({
      entityId: e.mint,
      kind: 'standard',
      step: 1,
      lines: [
        { entityId: e.mint, accountId: cash.id, side: 'Dr', amount: 5000n, fundId },
        { entityId: e.mint, accountId: obe.id, side: 'Cr', amount: 5000n, fundId },
      ],
    }, w), FinlyError);
  assertEquals(err.code, 'DIMENSION_MISSING');
});

Deno.test('invariants: zero, negative and fractional line amounts are refused', () => {
  const { w, e, l } = exampleWorld();
  const cash = w.accountByRole(e.mint, 'cash');
  const obe = w.accountByRole(e.mint, 'opening_balance_equity');
  const fundId = w.entity(e.mint).defaultFundId;
  for (const amount of [0n, -100n]) {
    assertThrows(() =>
      checkJournal({
        entityId: e.mint,
        kind: 'standard',
        step: 1,
        lines: [
          { entityId: e.mint, accountId: cash.id, side: 'Dr', amount, fundId, locationId: l.tijori },
          { entityId: e.mint, accountId: obe.id, side: 'Cr', amount, fundId },
        ],
      }, w), FinlyError);
  }
});

Deno.test('invariants: an inactive account cannot be posted to', () => {
  const { w, e, l } = exampleWorld();
  const cash = w.accountByRole(e.mint, 'cash');
  cash.active = false;
  const obe = w.accountByRole(e.mint, 'opening_balance_equity');
  const fundId = w.entity(e.mint).defaultFundId;
  const err = assertThrows(() =>
    checkJournal({
      entityId: e.mint,
      kind: 'standard',
      step: 1,
      lines: [
        { entityId: e.mint, accountId: cash.id, side: 'Dr', amount: 100n, fundId, locationId: l.tijori },
        { entityId: e.mint, accountId: obe.id, side: 'Cr', amount: 100n, fundId },
      ],
    }, w), FinlyError);
  assertEquals(err.code, 'ACCOUNT_INACTIVE');
});
