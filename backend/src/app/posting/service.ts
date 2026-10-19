/**
 * The posting service (docs/database/06 §6.1–6.3, §6.7; docs/architecture/operations.md §2.1–2.4).
 *
 * submit = two transactions, both as finly_ledger with the actor set:
 *   1. prepare — claim the idempotency key, validate and authorise the request against the current books, and create
 *      the draft: header with the request encrypted (txn.intent_enc), participants and legs. Short: it holds the day's
 *      reference counter only for its own few milliseconds.
 *   2. post — lock in the global order (idempotency → txn → periods → open items → slices → holds → reference counter
 *      → journal chain → audit chain), re-plan from the stored request, re-authorise with the current rights, then
 *      either post everything or, when someone else's personal books need their acknowledgement, record the requests
 *      and hold the outgoing money.
 * A refusal is recorded in a third short transaction (idempotency `failed`, draft `failed`, audited) so a resend gets
 * the same answer. Lock timeouts, deadlocks and serialisation failures are not recorded: nothing was committed, and the
 * same key may simply be sent again — it resumes from the draft.
 */
import { type Cipher, ctx, keyVersionOf } from '../../crypto/cipher.ts';
import type { BlindIndex } from '../../crypto/blind.ts';
import { canonical, type HashChain } from '../../crypto/chain.ts';
import type { Sql } from '../../db/sql.ts';
import { decodeIntent, encodeIntent } from '../../domain/engine/codec.ts';
import type { Intent } from '../../domain/engine/intents.ts';
export type { Intent };
import { legsOf } from '../../domain/engine/legs.ts';
import { planPosting } from '../../domain/engine/plan.ts';
import { type ErrorCode, fail, FinlyError } from '../../domain/errors.ts';
import { type Id, uuidv7 } from '../../domain/ids.ts';
import type { PostingPlan } from '../../domain/ledger/types.ts';
import { appendAudit, type AuditEntry } from '../audit.ts';
import { toFinlyError } from '../db_errors.ts';
import { emit, type OutboxEvent } from '../outbox.ts';
import { httpStatus } from '../status.ts';
import { checkAvailable, endHolds, holdOutflows, lockSlices, writeBalances } from './balances.ts';
import { type DbContext, loadContext } from './context.ts';
import { authorize } from './policy.ts';
import { writeLedger } from './writer.ts';

export interface PostingKeys {
  cipher: Cipher;
  blind: BlindIndex;
  chain: HashChain;
}

export interface SubmitCommand {
  actorUserId: Id;
  /** The client's Idempotency-Key: the same key always means the same request, posted at most once. */
  idempotencyKey: Id;
  /** `txn_type.key`; its intent type must match the intent. */
  txnTypeKey: string;
  intent: Intent;
  /** YYYY-MM-DD, the day the money moved. */
  valueDate: string;
  /** The environment the entry is recorded from (one of the books it changes). */
  primaryEnvId: Id;
  reason?: string;
  deviceId?: Id;
  /**
   * An earlier posted event this one continues (F9 after F8): recorded as a `follows` link for traceability. The
   * earlier event is never re-posted and its amounts are not reused.
   */
  followsTxnId?: Id;
}

/** Whether an entry may be reversed or corrected now, answered without locking or writing anything. */
export interface UndoCheck {
  allowed: boolean;
  /** Why not, in words a person can act on (the same refusal a reversal would get). */
  problem?: { code: ErrorCode; message: string };
  /** People whose acknowledgement the reversal would wait for. */
  waitsForAcknowledgement: number;
  /**
   * What the entry recorded (a correction's replacement for a correction), to start a correction from — only when the
   * actor may see every book the entry touched.
   */
  intent?: Intent;
}

export interface PostingResult {
  txnId: Id;
  reference: string;
  status: 'posted' | 'pending_acknowledgement' | 'rejected';
  /** True when this answer is the stored result of an earlier identical request. */
  replayed: boolean;
}

const OPERATION = 'posting.submit';

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * Whether money handed into a place waits for the receiver's confirmation is the place's policy (F2: off by default),
 * applied here — the client's own flag is ignored. Only a handover to a different person can wait: moving money
 * between places nobody holds, or that the same person holds, never does.
 */
export function withHandoverPolicy(intent: Intent, c: DbContext): Intent {
  if (intent.type === 'correction') return { ...intent, replacement: withHandoverPolicy(intent.replacement, c) };
  if (intent.type !== 'transfer') return intent;
  const policy = c.policy(intent.toLocationId).handoverConfirmation;
  const required = policy === 'required' || (policy === 'inherit' && c.handoverDefault);
  const from = c.location(intent.fromLocationId).currentHolderId;
  const to = c.location(intent.toLocationId).currentHolderId;
  return { ...intent, viaTransit: required && to !== undefined && to !== from };
}

function journalEntities(plan: PostingPlan): Id[] {
  return [...new Set(plan.journals.map((j) => j.entityId))].sort();
}

export class PostingService {
  constructor(private readonly db: Sql, private readonly keys: PostingKeys) {}

  /** Runs `fn` in one transaction as the posting role, attributed to `actor` (RLS and audit). */
  private asLedger<T>(actor: Id, fn: (tx: Sql) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.exec('set local role finly_ledger');
      await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
      return await fn(tx);
    });
  }

  private async requestHash(cmd: SubmitCommand): Promise<Uint8Array> {
    const text = canonical({
      op: OPERATION,
      type: cmd.txnTypeKey,
      intent: encodeIntent(cmd.intent),
      date: cmd.valueDate,
      env: cmd.primaryEnvId,
      reason: cmd.reason ?? null,
      follows: cmd.followsTxnId ?? null,
    });
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  }

  async submit(cmd: SubmitCommand): Promise<PostingResult> {
    if (!validDate(cmd.valueDate)) fail('VALIDATION', 'Choose a valid date.');
    if (cmd.reason !== undefined && cmd.reason.length > 500) {
      fail('VALIDATION', 'Keep the description under 500 characters.');
    }
    const hash = await this.requestHash(cmd);
    let claim: { replay: PostingResult } | { txnId: Id };
    try {
      claim = await this.asLedger(cmd.actorUserId, (tx) => this.prepare(tx, cmd, hash));
    } catch (e) {
      const err = toFinlyError(e);
      if (this.isFinal(err)) await this.recordRefusal(cmd, hash, err);
      throw err;
    }
    if ('replay' in claim) return claim.replay;
    const txnId = claim.txnId;
    try {
      return await this.asLedger(cmd.actorUserId, (tx) => this.post(tx, cmd.actorUserId, cmd.idempotencyKey, txnId));
    } catch (e) {
      const err = toFinlyError(e);
      if (this.isFinal(err)) await this.recordFailure(cmd.actorUserId, cmd.idempotencyKey, txnId, err);
      throw err;
    }
  }

  /** Refusals that will not change on a resend are recorded; transient and unexpected errors are not. */
  private isFinal(err: FinlyError): boolean {
    return !err.details.retryable && !err.details.replayed && err.code !== 'INTERNAL' && err.code !== 'INTEGRITY';
  }

  private async prepare(
    tx: Sql,
    cmd: SubmitCommand,
    hash: Uint8Array,
  ): Promise<{ replay: PostingResult } | { txnId: Id }> {
    const claimed = await tx.query(
      `insert into finly.idempotency_record (user_id, key, device_id, operation, request_hash)
       values ($1, $2, $3, $4, $5) on conflict do nothing returning key`,
      [cmd.actorUserId, cmd.idempotencyKey, cmd.deviceId ?? null, OPERATION, hash],
    );
    if (claimed.length === 0) {
      const [r] = await tx.query<
        { record_status: string; request_hash: Uint8Array; result_id: string | null; error_code: string | null }
      >(
        `select record_status, request_hash, result_id, error_code from finly.idempotency_record
         where user_id = $1 and key = $2`,
        [cmd.actorUserId, cmd.idempotencyKey],
      );
      if (!sameBytes(new Uint8Array(r.request_hash), hash)) {
        // The key is the app's promise that this is the same entry; different details mean an earlier attempt of an
        // entry reached Finly and the form changed since. The app starts a new key after this answer.
        fail(
          'DUPLICATE_REQUEST',
          'An earlier attempt of this entry reached Finly with different details. Check the entries list before ' +
            'recording it again.',
          { replayed: true },
        );
      }
      if (r.record_status === 'completed') return { replay: await this.result(tx, r.result_id!, true) };
      if (r.record_status === 'failed') {
        throw new FinlyError((r.error_code ?? 'CONFLICT') as ErrorCode, 'This request was refused earlier.', {
          replayed: true,
        });
      }
      if (!r.result_id) fail('INTERNAL', 'An earlier attempt left no draft.');
      return { txnId: r.result_id }; // resume an interrupted attempt
    }

    const [type] = await tx.query<{ id: string; intent_type: string }>(
      `select id, intent_type from finly.txn_type where key = $1 and status = 'active'`,
      [cmd.txnTypeKey],
    );
    if (!type || type.intent_type !== cmd.intent.type) {
      fail('VALIDATION', 'Choose a transaction type that matches what happened.');
    }
    const undoes = cmd.intent.type === 'reversal' || cmd.intent.type === 'correction' ? cmd.intent.txnId : null;
    if (undoes) await this.checkUndo(tx, undoes, cmd);
    const c = await loadContext(tx, this.keys.cipher, cmd.intent, cmd.valueDate, { lockOpenItems: false });
    const intent = withHandoverPolicy(cmd.intent, c);
    if (intent.type === 'transit_confirm') await this.checkConfirmation(tx, intent);
    const plan = planPosting(intent, c);
    const entities = journalEntities(plan);
    if (!entities.includes(cmd.primaryEnvId)) fail('VALIDATION', 'Record the entry from one of the books it changes.');
    await authorize(tx, c, plan);

    const txnId = uuidv7();
    const intentEnc = await this.keys.cipher.encryptText(encodeIntent(intent), ctx('txn', 'intent_enc', txnId));
    await tx.query(
      `insert into finly.txn (id, reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id,
         reason, device_id, intent_enc, key_version, reverses_txn_id)
       values ($1, finly.next_reference('TX', $2::date), $3, $4, $5, $2::date, $6, $7, $8, $9, $10, $11)`,
      [
        txnId,
        cmd.valueDate,
        type.id,
        intent.type,
        cmd.primaryEnvId,
        cmd.actorUserId,
        cmd.reason ?? null,
        cmd.deviceId ?? null,
        intentEnc,
        keyVersionOf(intentEnc),
        undoes,
      ],
    );
    for (const entity of entities) {
      await tx.query(
        `insert into finly.txn_entity (txn_id, entity_id, role, value_date) values ($1, $2, 'owner', $3::date)`,
        [txnId, entity, cmd.valueDate],
      );
      // A new month opens when its first entry arrives; closed months and dates before the books start stay shut.
      await tx.query(`select finly.ensure_periods($1, $2::date)`, [entity, cmd.valueDate]);
    }
    await this.writeLegs(tx, txnId, plan);
    if (cmd.followsTxnId) {
      const [earlier] = await tx.query<{ status: string }>(`select status from finly.txn where id = $1`, [
        cmd.followsTxnId,
      ]);
      if (earlier?.status !== 'posted') fail('VALIDATION', 'The earlier entry this continues must be posted.');
      await tx.query(
        `insert into finly.txn_link (from_txn_id, to_txn_id, kind, created_by) values ($1, $2, 'follows', $3)`,
        [txnId, cmd.followsTxnId, cmd.actorUserId],
      );
    }
    await tx.query(
      `update finly.idempotency_record set result_type = 'txn', result_id = $3 where user_id = $1 and key = $2`,
      [cmd.actorUserId, cmd.idempotencyKey, txnId],
    );
    await appendAudit(tx, this.keys.chain, [{
      actorUserId: cmd.actorUserId,
      action: 'txn.drafted',
      objectType: 'txn',
      objectId: txnId,
      envEntityId: cmd.primaryEnvId,
      txnId,
    }]);
    return { txnId };
  }

  /**
   * Undoing an entry says why, is dated on or after the entry, and starts only when no other reversal or correction of
   * it is live (the database's txn_one_live_reversal index settles a race). The engine decides the rest.
   */
  private async checkUndo(tx: Sql, txnId: Id, cmd: SubmitCommand): Promise<void> {
    if (!cmd.reason?.trim()) fail('VALIDATION', 'Say why this entry is being reversed or corrected.');
    await this.cancelStaleAttempts(tx, cmd.actorUserId, txnId);
    const t = await this.undoable(tx, txnId);
    this.mustSee(t, cmd.intent.type === 'correction');
    if (cmd.valueDate < t.valueDate) fail('VALIDATION', 'Date the reversal on or after the entry it undoes.');
    if (t.waiting) fail('CONFLICT', 'A reversal or correction of this entry is already waiting.');
  }

  /**
   * Undoing an entry needs all of it in view, before any rule can name a place or account: every book and leg, except
   * another person's personal books — that person sees and answers the reversal themselves (D-029). A correction
   * rewrites every side, so it needs every side in view.
   */
  private mustSee(t: Awaited<ReturnType<PostingService['undoable']>>, correcting: boolean): void {
    if (correcting ? !t.allVisible : !t.visibleOrAcknowledged) {
      fail('FORBIDDEN', 'Only someone who can see all of this entry can reverse or correct it.');
    }
  }

  /**
   * An attempt that never got past its draft (the app crashed, or its key expired) must not hold the entry forever:
   * after a while it is cancelled, with its own audit record, and a new attempt may start.
   */
  private async cancelStaleAttempts(tx: Sql, actor: Id, txnId: Id): Promise<void> {
    const stale = await tx.query<{ id: string; primary_env_id: string }>(
      `update finly.txn set status = 'cancelled'
       where reverses_txn_id = $1 and status = 'draft' and entered_at < now() - interval '10 minutes'
       returning id, primary_env_id`,
      [txnId],
    );
    if (stale.length === 0) return;
    await appendAudit(
      tx,
      this.keys.chain,
      stale.map((s): AuditEntry => ({
        actorUserId: actor,
        action: 'txn.cancelled',
        objectType: 'txn',
        objectId: s.id,
        envEntityId: s.primary_env_id,
        txnId: s.id,
        reason: 'stale',
      })),
    );
  }

  /**
   * The entry to undo, if the actor may see it — exactly as the API's own read rules decide: through a leg in books
   * they may read, outside any fund or place hidden from them. Its recorded request is offered back only when every
   * book and every leg is theirs to see, so a correction never reveals a hidden place, fund or book.
   */
  private async undoable(tx: Sql, txnId: Id) {
    const [t] = await tx.query<{
      value_date: string;
      waiting: boolean;
      visible: boolean;
      all_visible: boolean;
      visible_or_acknowledged: boolean;
      intent_enc: Uint8Array | null;
    }>(
      `with me as (
         select coalesce(finly.actor_env_ids('read'), '{}') as envs, finly.actor_hidden_ids('fund') as funds,
                finly.actor_hidden_ids('location') as places, finly.actor_person_id() as person
       ), legs as (
         select l.entity_id = any (me.envs)
                  and (l.fund_id is null or l.fund_id <> all (me.funds))
                  and (l.location_id is null or l.location_id <> all (me.places)) as seen,
                e.kind = 'person' and l.entity_id is distinct from me.person as theirs
         from finly.txn_leg l join finly.entity e on e.id = l.entity_id, me where l.txn_id = $1
       ), books as (
         select te.entity_id = any (me.envs) as seen,
                e.kind = 'person' and te.entity_id is distinct from me.person as theirs
         from finly.txn_entity te join finly.entity e on e.id = te.entity_id, me where te.txn_id = $1
       )
       select t.value_date::text as value_date, t.intent_enc,
              exists (select 1 from finly.txn r where r.reverses_txn_id = t.id
                        and r.status in ('draft', 'pending_approval', 'approved', 'pending_acknowledgement')) as waiting,
              exists (select 1 from legs where seen) as visible,
              not exists (select 1 from legs where not seen) and not exists (select 1 from books where not seen)
                as all_visible,
              not exists (select 1 from legs where not seen and not theirs)
                and not exists (select 1 from books where not seen and not theirs) as visible_or_acknowledged
       from finly.txn t where t.id = $1`,
      [txnId],
    );
    // Never "exists but not yours": an entry the actor cannot see is simply not found.
    if (!t?.visible) fail('NOT_FOUND', 'That entry was not found.');
    return {
      valueDate: t.value_date,
      waiting: t.waiting,
      allVisible: t.all_visible,
      visibleOrAcknowledged: t.visible_or_acknowledged,
      intentEnc: t.intent_enc,
    };
  }

  /**
   * Whether the actor may reverse or correct an entry today: the same engine and rights a reversal would meet, as a
   * dry run. A refusal comes back as the problem to show; nothing is locked or written.
   */
  async undoCheck(actor: Id, txnId: Id, today: string): Promise<UndoCheck> {
    try {
      return await this.asLedger(actor, async (tx) => {
        const t = await this.undoable(tx, txnId);
        let recorded: Intent | undefined;
        if (t.allVisible && t.intentEnc) {
          const stored = decodeIntent(await this.keys.cipher.decryptText(t.intentEnc, ctx('txn', 'intent_enc', txnId)));
          recorded = stored.type === 'correction' ? stored.replacement : stored;
        }
        try {
          this.mustSee(t, false);
          if (t.waiting) fail('CONFLICT', 'A reversal or correction of this entry is already waiting.');
          if (today < t.valueDate) fail('VALIDATION', 'Date the reversal on or after the entry it undoes.');
          const intent: Intent = { type: 'reversal', txnId };
          const c = await loadContext(tx, this.keys.cipher, intent, today, { lockOpenItems: false });
          const plan = planPosting(intent, c);
          const decision = await authorize(tx, c, plan);
          return { allowed: true, waitsForAcknowledgement: decision.needsAck.length, intent: recorded };
        } catch (e) {
          // Only the engine's and the rules' refusals are answers; anything from the database is a real error.
          if (!(e instanceof FinlyError) || e.code === 'INTERNAL' || e.code === 'INTEGRITY') throw e;
          return {
            allowed: false,
            problem: { code: e.code, message: e.message },
            waitsForAcknowledgement: 0,
            intent: recorded,
          };
        }
      });
    } catch (e) {
      throw toFinlyError(e);
    }
  }

  /**
   * A handover is confirmed by the person receiving it, for exactly the money that is waiting: same books, fund, place
   * and amount as its custody event, which must still be waiting. The event itself is marked confirmed when the
   * confirmation posts (writer), so it is confirmed once.
   */
  private async checkConfirmation(tx: Sql, it: Extract<Intent, { type: 'transit_confirm' }>): Promise<void> {
    const [ev] = await tx.query<{
      entity_id: string;
      fund_id: string;
      to_location_id: string;
      to_holder_person_id: string | null;
      custody_status: string;
      amount_enc: Uint8Array;
      receiver: boolean;
    }>(
      `select entity_id, fund_id, to_location_id, to_holder_person_id, custody_status, amount_enc,
              to_holder_person_id = finly.actor_person_id() as receiver
       from finly.custody_event where id = $1`,
      [it.custodyEventId],
    );
    if (!ev) fail('NOT_FOUND', 'That handover was not found.');
    if (ev.custody_status !== 'awaiting_confirmation') {
      fail('CONFLICT', 'This handover is not waiting for confirmation.');
    }
    if (!ev.receiver) fail('FORBIDDEN', 'Only the person receiving the money confirms it.');
    const amount = await this.keys.cipher.decryptAmount(
      ev.amount_enc,
      ctx('custody_event', 'amount_enc', it.custodyEventId),
    );
    const sameFund = it.fundId === undefined || it.fundId === ev.fund_id;
    if (ev.entity_id !== it.entityId || ev.to_location_id !== it.toLocationId || !sameFund || amount !== it.amount) {
      fail('VALIDATION', 'Confirm the handover exactly as it was sent: the same books, place and amount.');
    }
  }

  private async writeLegs(tx: Sql, txnId: Id, plan: PostingPlan): Promise<void> {
    const { cipher, blind } = this.keys;
    for (const leg of legsOf(plan).legs) {
      const id = uuidv7();
      await tx.query(
        `insert into finly.txn_leg (id, txn_id, seq, leg_kind, entity_id, location_id, fund_id, category_id,
           counterparty_entity_id, amount_enc, amount_bidx, amount_bucket, key_version)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          txnId,
          leg.seq,
          leg.kind,
          leg.entityId,
          leg.locationId ?? null,
          leg.fundId,
          leg.categoryId ?? null,
          leg.counterpartyId ?? null,
          await cipher.encryptAmount(leg.amount, ctx('txn_leg', 'amount_enc', id)),
          await blind.amount(leg.entityId, leg.amount),
          await blind.amountBand(leg.entityId, leg.amount),
          cipher.activeVersion(),
        ],
      );
    }
  }

  /** Locks the event and everything it depends on, re-plans, and posts or waits for acknowledgement. */
  private async post(tx: Sql, actor: Id, key: Id, txnId: Id): Promise<PostingResult> {
    const [rec] = await tx.query<{ record_status: string }>(
      `select record_status from finly.idempotency_record where user_id = $1 and key = $2 for update`,
      [actor, key],
    );
    if (rec?.record_status === 'completed') return await this.result(tx, txnId, true);
    const loaded = await this.lockEvent(tx, txnId, ['draft']);
    const decision = await authorize(tx, loaded.c, loaded.plan);
    const slices = await lockSlices(tx, this.keys.cipher, loaded.plan);
    // Money leaving books that wait for their owner is checked when the owner answers, not shown to whoever asked.
    await checkAvailable(tx, this.keys.cipher, loaded.c, slices, txnId, new Set(decision.needsAck));

    if (decision.needsAck.length > 0) {
      const waiting = new Set(decision.needsAck);
      for (const person of decision.needsAck) {
        await tx.query(`insert into finly.txn_acknowledgement (txn_id, entity_id) values ($1, $2)`, [txnId, person]);
      }
      await holdOutflows(tx, this.keys.cipher, loaded.c, slices, txnId, actor, waiting);
      await tx.query(`update finly.txn set status = 'pending_acknowledgement', submitted_at = now() where id = $1`, [
        txnId,
      ]);
      await this.complete(tx, actor, key);
      await emit(
        tx,
        decision.needsAck.map((person): OutboxEvent => ({
          topic: 'ack.requested',
          dedupeKey: `${txnId}:${person}`,
          payload: { txn: txnId, entity: person },
          txnId,
        })),
      );
      await appendAudit(
        tx,
        this.keys.chain,
        loaded.entities.map((entity): AuditEntry => ({
          actorUserId: actor,
          action: 'txn.acknowledgement_requested',
          objectType: 'txn',
          objectId: txnId,
          envEntityId: entity,
          txnId,
        })),
      );
      return { txnId, reference: loaded.reference, status: 'pending_acknowledgement', replayed: false };
    }

    await this.apply(tx, actor, txnId, loaded, slices, decision.immediate);
    await this.complete(tx, actor, key);
    return { txnId, reference: loaded.reference, status: 'posted', replayed: false };
  }

  /** Locks the event in one of `statuses`, its periods and open items; decrypts and re-plans its request. */
  private async lockEvent(tx: Sql, txnId: Id, statuses: string[]) {
    const [t] = await tx.query<
      { id: string; reference: string; status: string; value_date: string; intent_enc: Uint8Array | null }
    >(
      `select id, reference, status, value_date::text as value_date, intent_enc from finly.txn where id = $1 for update`,
      [txnId],
    );
    if (!t) fail('NOT_FOUND', 'That transaction was not found.');
    if (!statuses.includes(t.status)) fail('CONFLICT', 'This transaction was already handled.', { status: t.status });
    if (!t.intent_enc) fail('INTEGRITY', 'This transaction has no stored request.');
    const intent = decodeIntent(await this.keys.cipher.decryptText(t.intent_enc, ctx('txn', 'intent_enc', t.id)));
    if (intent.type === 'reversal' || intent.type === 'correction') {
      // The entry it undoes is the next lock in the global order (txn rows before periods, 06 §6.3).
      await tx.query(`select id from finly.txn where id = $1 for no key update`, [intent.txnId]);
    }
    const participants = (await tx.query<{ entity_id: string }>(
      `select entity_id from finly.txn_entity where txn_id = $1 order by entity_id`,
      [txnId],
    )).map((r) => r.entity_id);
    const periods = await tx.query<{ id: string; entity_id: string; period_status: string }>(
      `select id, entity_id, period_status from finly.accounting_period
       where entity_id = any($1::uuid[]) and $2::date between period_start and period_end
       order by entity_id, period_start for share`,
      [participants, t.value_date],
    );
    const periodOf = new Map<Id, Id>();
    for (const p of periods) if (p.period_status === 'open') periodOf.set(p.entity_id, p.id);
    for (const entity of participants) {
      if (!periodOf.has(entity)) {
        fail('PERIOD_CLOSED', 'The month of this date is closed or not set up for these books.');
      }
    }
    const c: DbContext = await loadContext(tx, this.keys.cipher, intent, t.value_date, { lockOpenItems: true });
    const plan = planPosting(intent, c);
    const entities = journalEntities(plan);
    if (entities.join() !== participants.join()) {
      fail('CONFLICT', 'The records this entry depends on changed. Please review it and send it again.');
    }
    return { reference: t.reference, valueDate: t.value_date, intent, c, plan, entities, periodOf };
  }

  private async apply(
    tx: Sql,
    actor: Id,
    txnId: Id,
    loaded: Awaited<ReturnType<PostingService['lockEvent']>>,
    slices: Awaited<ReturnType<typeof lockSlices>>,
    immediate: Id[],
  ): Promise<void> {
    const periodOf = (entity: Id) => loaded.periodOf.get(entity)!;
    const written = await writeLedger(tx, this.keys, loaded.c, {
      txnId,
      actorUserId: actor,
      valueDate: loaded.valueDate,
      intent: loaded.intent,
      plan: loaded.plan,
      periodOf,
    });
    await writeBalances(tx, this.keys.cipher, slices, periodOf, written.lastJournal);
    await endHolds(tx, txnId, actor, 'consumed');
    await tx.query(`update finly.txn set status = 'posted', posted_at = now() where id = $1`, [txnId]);
    const undone = loaded.plan.unwind?.txnId;
    if (undone) {
      // The undone entry's own history says what happened to it, in the books it was recorded from.
      const [{ env }] = await tx.query<{ env: string }>(`select primary_env_id as env from finly.txn where id = $1`, [
        undone,
      ]);
      await appendAudit(tx, this.keys.chain, [{
        actorUserId: actor,
        action: loaded.intent.type === 'correction' ? 'txn.corrected' : 'txn.reversed',
        objectType: 'txn',
        objectId: undone,
        envEntityId: env,
        txnId: undone,
        reason: `by ${loaded.reference}`,
      }]);
    }
    await emit(tx, [
      ...loaded.entities.map((entity): OutboxEvent => ({
        topic: 'nudge.data_changed',
        dedupeKey: `${txnId}:${entity}`,
        payload: { txn: txnId, entity },
        txnId,
      })),
      ...immediate.map((entity): OutboxEvent => ({
        topic: 'entry.added_to_your_books',
        dedupeKey: `${txnId}:${entity}`,
        payload: { txn: txnId, entity },
        txnId,
      })),
    ]);
    await appendAudit(
      tx,
      this.keys.chain,
      loaded.entities.map((entity): AuditEntry => ({
        actorUserId: actor,
        action: 'txn.posted',
        objectType: 'txn',
        objectId: txnId,
        envEntityId: entity,
        txnId,
      })),
    );
  }

  private async complete(tx: Sql, actor: Id, key: Id): Promise<void> {
    await tx.query(
      `update finly.idempotency_record set record_status = 'completed', http_status = 201, completed_at = now()
       where user_id = $1 and key = $2`,
      [actor, key],
    );
  }

  private async result(tx: Sql, txnId: Id, replayed: boolean): Promise<PostingResult> {
    const [t] = await tx.query<{ reference: string; status: PostingResult['status'] }>(
      `select reference, status from finly.txn where id = $1`,
      [txnId],
    );
    return { txnId, reference: t.reference, status: t.status, replayed };
  }

  /** A refusal before any draft existed: the key now answers with the same refusal. */
  private async recordRefusal(cmd: SubmitCommand, hash: Uint8Array, err: FinlyError): Promise<void> {
    await this.asLedger(cmd.actorUserId, (tx) =>
      tx.query(
        `insert into finly.idempotency_record (user_id, key, device_id, operation, request_hash, record_status,
           error_code, http_status, completed_at)
         values ($1, $2, $3, $4, $5, 'failed', $6, $7, now()) on conflict do nothing`,
        [cmd.actorUserId, cmd.idempotencyKey, cmd.deviceId ?? null, OPERATION, hash, err.code, httpStatus(err.code)],
      )).catch(() => {}); // recording the outcome must never hide the refusal itself
  }

  /** A refusal under lock: the draft is marked failed (the user may correct and resend), audited. */
  private async recordFailure(actor: Id, key: Id, txnId: Id, err: FinlyError): Promise<void> {
    await this.asLedger(actor, async (tx) => {
      await tx.query(
        `update finly.idempotency_record set record_status = 'failed', error_code = $3, http_status = $4,
           completed_at = now()
         where user_id = $1 and key = $2 and record_status = 'in_progress'`,
        [actor, key, err.code, httpStatus(err.code)],
      );
      const moved = await tx.query(
        `update finly.txn set status = 'failed' where id = $1 and status = 'draft' returning primary_env_id`,
        [txnId],
      ) as { primary_env_id: string }[];
      if (moved.length > 0) {
        await appendAudit(tx, this.keys.chain, [{
          actorUserId: actor,
          action: 'txn.failed',
          objectType: 'txn',
          objectId: txnId,
          envEntityId: moved[0].primary_env_id,
          txnId,
          reason: err.code,
        }]);
      }
    }).catch(() => {});
  }

  /**
   * The person whose books an entry waits for accepts it: in one transaction their answer is recorded and, once no
   * other answer is outstanding, the whole entry is re-validated under lock and posted (06 §6.7).
   */
  async acknowledge(actor: Id, txnId: Id, note?: string): Promise<PostingResult> {
    try {
      return await this.asLedger(actor, async (tx) => {
        await this.answer(tx, actor, txnId, 'acknowledged', note);
        const [{ open }] = await tx.query<{ open: number }>(
          `select count(*)::int as open from finly.txn_acknowledgement where txn_id = $1 and ack_status <> 'acknowledged'`,
          [txnId],
        );
        const loaded = await this.lockEvent(tx, txnId, ['pending_acknowledgement']);
        if (open > 0) return { txnId, reference: loaded.reference, status: 'pending_acknowledgement', replayed: false };
        // The giver's rights are checked again now: access revoked while the entry waited stops it here.
        const [{ creator }] = await tx.query<{ creator: string }>(
          `select created_by_user_id as creator from finly.txn where id = $1`,
          [txnId],
        );
        await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [creator]);
        await authorize(tx, loaded.c, loaded.plan);
        await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
        const slices = await lockSlices(tx, this.keys.cipher, loaded.plan);
        await checkAvailable(tx, this.keys.cipher, loaded.c, slices, txnId);
        await this.apply(tx, actor, txnId, loaded, slices, []);
        return { txnId, reference: loaded.reference, status: 'posted', replayed: false };
      });
    } catch (e) {
      throw toFinlyError(e);
    }
  }

  /** The person refuses the entry: final; the entry is rejected, its holds released, and the history kept. */
  async reject(actor: Id, txnId: Id, note?: string): Promise<PostingResult> {
    try {
      return await this.asLedger(actor, async (tx) => {
        await this.answer(tx, actor, txnId, 'rejected', note);
        const [t] = await tx.query<{ reference: string; primary_env_id: string }>(
          `select reference, primary_env_id from finly.txn where id = $1 for update`,
          [txnId],
        );
        await endHolds(tx, txnId, actor, 'released');
        await tx.query(`update finly.txn set status = 'rejected' where id = $1`, [txnId]);
        await emit(tx, [{
          topic: 'ack.rejected',
          dedupeKey: txnId,
          payload: { txn: txnId, entity: t.primary_env_id },
          txnId,
        }]);
        await appendAudit(tx, this.keys.chain, [{
          actorUserId: actor,
          action: 'txn.rejected',
          objectType: 'txn',
          objectId: txnId,
          envEntityId: t.primary_env_id,
          txnId,
          reason: note,
        }]);
        return { txnId, reference: t.reference, status: 'rejected', replayed: false };
      });
    } catch (e) {
      throw toFinlyError(e);
    }
  }

  private async answer(tx: Sql, actor: Id, txnId: Id, answer: 'acknowledged' | 'rejected', note?: string) {
    if (note !== undefined && note.length > 500) fail('VALIDATION', 'Keep the note under 500 characters.');
    const updated = await tx.query(
      `update finly.txn_acknowledgement set ack_status = $3, decided_by = $1, decided_at = now(), note = $4
       where txn_id = $2 and entity_id = finly.actor_person_id() and ack_status = 'pending'
       returning entity_id`,
      [actor, txnId, answer, note ?? null],
    );
    if (updated.length === 0) fail('NOT_FOUND', 'There is nothing waiting for your answer on this entry.');
  }
}
