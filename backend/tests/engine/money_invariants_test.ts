import { assertEquals, assertThrows } from '@std/assert';
import { formatInr, groupIndian, parseMoney, toWire } from '../../src/domain/money.ts';
import { decodeIntent, encodeIntent } from '../../src/domain/engine/codec.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { checkJournal } from '../../src/domain/ledger/invariants.ts';
import { exampleWorld } from '../support/world.ts';

Deno.test('money: Indian grouping, the rupee sign, and paise only when there are any', () => {
  assertEquals(groupIndian(500n), '500');
  assertEquals(groupIndian(20000n), '20,000');
  assertEquals(groupIndian(500000n), '5,00,000');
  assertEquals(groupIndian(10000000n), '1,00,00,000');
  assertEquals(formatInr(120000000n), '₹12,00,000');
  assertEquals(formatInr(-500000n), '−₹5,000');
  assertEquals(formatInr(105050n), '₹1,050.50');
  assertEquals(formatInr(5n), '₹0.05');
});

Deno.test('money: amounts are rupees with at most two decimals, held as exact paise (D-045)', () => {
  assertEquals(parseMoney('45000'), 4500000n);
  assertEquals(parseMoney('45000.5'), 4500050n);
  assertEquals(parseMoney('45000.05'), 4500005n);
  assertEquals(parseMoney('0.01'), 1n);
  assertEquals(parseMoney(4500050n), 4500050n, 'an engine value is already paise');
  for (
    const bad of ['45000.505', '-5', '0', '0.00', '1,000', '', ' 5', '.5', '5.', '1e5', 45000, 1.5, -1, null, 'abc']
  ) {
    assertThrows(() => parseMoney(bad), FinlyError, undefined, String(bad));
  }
  assertThrows(() => parseMoney('9999999999999'), FinlyError, undefined, 'thirteen rupee digits');
  assertEquals(toWire(4500000n), '45000');
  assertEquals(toWire(4500050n), '45000.50');
  assertEquals(toWire(-250n), '-2.50');
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

Deno.test('money: a request stored before D-045 (whole rupees) reads back in paise; new ones round-trip', () => {
  const legacy =
    '{"type":"transfer","entityId":"e","fromLocationId":"a","toLocationId":"b","amount":{"$rupees":"7000"}}';
  assertEquals((decodeIntent(legacy) as { amount: bigint }).amount, 700000n);
  const intent = { type: 'transfer', entityId: 'e', fromLocationId: 'a', toLocationId: 'b', amount: 700050n } as const;
  assertEquals((decodeIntent(encodeIntent(intent)) as { amount: bigint }).amount, 700050n);
});
