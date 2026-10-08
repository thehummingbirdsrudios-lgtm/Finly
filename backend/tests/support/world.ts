/**
 * The spec's example world (BUILD_PROMPT F3; seed/test data only, never constants in product code):
 * firms Mint, JSK and Firm B; people Krish (owner of Mint and JSK), Father (owner of Mint), Sujal (worker);
 * places Tijori, Office drawer, Savan Bank (Mint), HDFC (JSK), Krish's bank, and cash-in-hand for each person.
 */
import { assertEquals } from '@std/assert';
import { MemoryLedger } from '../../src/domain/ledger/memory.ts';
import type { Intent } from '../../src/domain/engine/intents.ts';
import { planPosting } from '../../src/domain/engine/plan.ts';
import type { Id } from '../../src/domain/ids.ts';

export function exampleWorld() {
  const w = new MemoryLedger();
  const mint = w.addEntity('Mint', 'firm');
  const jsk = w.addEntity('JSK', 'firm');
  const firmB = w.addEntity('Firm B', 'firm');
  const krish = w.addEntity('Krish', 'person');
  const father = w.addEntity('Father', 'person');
  const sujal = w.addEntity('Sujal', 'person');
  const hotelVendor = w.addEntity('Hotel Shreeji', 'party');
  const bank = w.addEntity('State Bank', 'party');
  const customer = w.addEntity('Ramesh Traders', 'party');
  w.setOwner(mint, krish);
  w.setOwner(mint, father);
  w.setOwner(jsk, krish);
  w.setOwner(firmB, father);
  const tijori = w.addLocation('Tijori', 'cash', father);
  const drawer = w.addLocation('Office drawer', 'cash');
  const savanBank = w.addLocation('Savan Bank', 'bank');
  const hdfc = w.addLocation('HDFC current', 'bank');
  const krishBank = w.addLocation('Krish savings', 'bank');
  const cashKrish = w.addLocation('Cash with Krish', 'cash', krish);
  const cashFather = w.addLocation('Cash with Father', 'cash', father);
  const cashSujal = w.addLocation('Cash with Sujal', 'cash', sujal);
  return {
    w,
    e: { mint, jsk, firmB, krish, father, sujal, hotelVendor, bank, customer },
    l: { tijori, drawer, savanBank, hdfc, krishBank, cashKrish, cashFather, cashSujal },
  };
}

export type World = ReturnType<typeof exampleWorld>;

/** Plans, checks and applies an intent; returns created open item ids. */
export function post(w: MemoryLedger, intent: Intent): Id[] {
  return w.apply(planPosting(intent, w));
}

/** Every entity's trial balance balances and inter-entity balances are reciprocal. */
export function assertLedgerSound(w: MemoryLedger): void {
  for (const e of w.entities.values()) {
    if (e.kind === 'party') continue;
    const tb = w.trialBalance(e.id);
    assertEquals(tb.debits, tb.credits, `trial balance of ${e.name}`);
  }
  assertEquals(w.reciprocityBreaks(), []);
}

/** Gives an entity opening cash at a location so later spending has a source. */
export function fund(w: MemoryLedger, entityId: Id, locationId: Id, amount: bigint): void {
  post(w, { type: 'opening_balance', entityId, locationId, amount });
}
