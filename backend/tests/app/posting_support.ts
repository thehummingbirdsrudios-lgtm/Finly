/** Shared set-up for the posting service tests against the real schema (tests/app/*_test.ts). */
import { assert, assertRejects } from '@std/assert';
import { BlindIndex } from '../../src/crypto/blind.ts';
import { HashChain } from '../../src/crypto/chain.ts';
import { Cipher, ctx } from '../../src/crypto/cipher.ts';
import { KeyRing, StaticKekSource } from '../../src/crypto/keys.ts';
import { PostingService, type SubmitCommand } from '../../src/app/posting/service.ts';
import type { Intent } from '../../src/domain/engine/intents.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { uuidv7 } from '../../src/domain/ids.ts';
import { type DbWorld, dbWorld } from '../db/world.ts';

export function testKeys() {
  const ring = new KeyRing(new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1));
  return { cipher: new Cipher(ring), blind: new BlindIndex(ring), chain: new HashChain(ring) };
}

export async function setup() {
  const w = await dbWorld();
  const keys = testKeys();
  const svc = new PostingService(w.db.port!, keys);
  const [{ today }] = (await w.db.query<{ today: string }>(`select current_date::text as today`)).rows;
  const cmd = (actor: string, typeKey: string, intent: Intent, env: string, date = today): SubmitCommand => ({
    actorUserId: actor,
    idempotencyKey: uuidv7(),
    txnTypeKey: typeKey,
    intent,
    valueDate: date,
    primaryEnvId: env,
  });
  const open = (amount: bigint, locationId = w.l.tijori) =>
    svc.submit(
      cmd(w.u.krish, 'opening_balance', { type: 'opening_balance', entityId: w.e.mint, locationId, amount }, w.e.mint),
    );
  const transfer = (amount: bigint, from = w.l.tijori, to = w.l.savanBank, actor = w.u.krish, entity = w.e.mint) =>
    cmd(
      actor,
      'transfer',
      { type: 'transfer', entityId: entity, fromLocationId: from, toLocationId: to, amount },
      entity,
    );
  return { w, keys, svc, cmd, open, transfer, today };
}

/** Money of `entity` at `location` (Dr − Cr), decrypted from the snapshot the posting maintained. */
export async function moneyAt(
  w: DbWorld,
  keys: ReturnType<typeof testKeys>,
  entity: string,
  location: string,
): Promise<bigint> {
  const rows = (await w.db.query<{ slice_id: string; balance_enc: Uint8Array }>(
    `select bc.slice_id, bc.balance_enc from finly.balance_current bc join finly.balance_slice s on s.id = bc.slice_id
     where s.entity_id = $1 and s.location_id = $2`,
    [entity, location],
  )).rows;
  let total = 0n;
  for (const r of rows) {
    total += await keys.cipher.decryptAmount(
      new Uint8Array(r.balance_enc),
      ctx('balance_current', 'balance_enc', r.slice_id),
    );
  }
  return total;
}

export async function count(w: DbWorld, sql: string, params: unknown[] = []): Promise<number> {
  return (await w.db.query<{ n: number }>(`select count(*)::int as n from ${sql}`, params)).rows[0].n;
}

export async function refusal(fn: () => Promise<unknown>): Promise<FinlyError> {
  const e = await assertRejects(fn);
  assert(e instanceof FinlyError, String(e));
  return e;
}

export function giftToSujal(s: Awaited<ReturnType<typeof setup>>, amount: bigint, giver = s.w.u.krish) {
  return s.cmd(giver, 'give', {
    type: 'give',
    giverId: s.w.e.mint,
    giverLocationId: s.w.l.tijori,
    giverSide: 'own',
    receiverId: s.w.e.sujal,
    receiverSide: 'own',
    receiverLocationId: s.w.l.cashSujal,
    purpose: 'loan',
    repayable: true,
    amount,
  }, s.w.e.mint);
}
