/**
 * Business legs of a posting plan: where money left (`source`), where it arrived (`destination`), and whose books an
 * expense or income was allocated to (`allocation`). Legs are what a transaction is searched and listed by
 * (`txn_leg`, with encrypted amounts and blind indexes); journal lines point at the leg they belong to.
 *
 * Derived from the plan alone, the same way for every intent, so the same request always yields the same legs:
 * - a line at a money location: credit → source, debit → destination, grouped by entity, fund and location;
 * - a line with a category: allocation, grouped by entity, fund and category;
 * - a plan with neither (an offset, a loan on account): one allocation per journal from its first debit line.
 */
import type { Id } from '../ids.ts';
import type { Rupees } from '../money.ts';
import type { PlannedLine, PostingPlan } from '../ledger/types.ts';

export type LegKind = 'source' | 'destination' | 'allocation';

export interface PlannedLeg {
  kind: LegKind;
  /** 1-based, per kind, in plan order. */
  seq: number;
  entityId: Id;
  fundId: Id;
  locationId?: Id;
  categoryId?: Id;
  counterpartyId?: Id;
  amount: Rupees;
}

export interface Legs {
  legs: PlannedLeg[];
  /** Index into `legs` for each line that belongs to a leg. */
  lineLeg: Map<PlannedLine, number>;
}

function legKey(line: PlannedLine): { kind: LegKind; key: string } | undefined {
  if (line.locationId) {
    const kind: LegKind = line.side === 'Cr' ? 'source' : 'destination';
    return { kind, key: `${kind}|${line.entityId}|${line.fundId}|${line.locationId}` };
  }
  if (line.categoryId) {
    return { kind: 'allocation', key: `allocation|${line.entityId}|${line.fundId}|${line.categoryId}` };
  }
  return undefined;
}

export function legsOf(plan: PostingPlan): Legs {
  const legs: PlannedLeg[] = [];
  const lineLeg = new Map<PlannedLine, number>();
  const byKey = new Map<string, number>();
  const seq: Record<LegKind, number> = { source: 0, destination: 0, allocation: 0 };
  const add = (line: PlannedLine, kind: LegKind, key: string) => {
    let index = byKey.get(key);
    if (index === undefined) {
      index = legs.push({
        kind,
        seq: ++seq[kind],
        entityId: line.entityId,
        fundId: line.fundId,
        locationId: line.locationId,
        categoryId: line.categoryId,
        counterpartyId: line.counterpartyId,
        amount: 0n,
      }) - 1;
      byKey.set(key, index);
    }
    legs[index].amount += line.amount;
    lineLeg.set(line, index);
  };
  for (const journal of plan.journals) {
    for (const line of journal.lines) {
      const k = legKey(line);
      if (k) add(line, k.kind, k.key);
    }
  }
  if (legs.length === 0) {
    for (const journal of plan.journals) {
      const first = journal.lines.find((l) => l.side === 'Dr') ?? journal.lines[0];
      if (first) add(first, 'allocation', `allocation|${journal.entityId}|${journal.step}`);
    }
  }
  return { legs, lineLeg };
}
