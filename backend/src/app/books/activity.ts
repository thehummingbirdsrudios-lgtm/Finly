/**
 * What happened in a book (ADDON-19 §9, §10): the entries list with money in and out of this book, one entry in full
 * (each visible book's journal lines, legs while it waits, acknowledgements, links), and the entries waiting for the
 * person's own answer. Posted entries are read from their journals; entries not yet posted from their legs, and are
 * always marked as pending — never shown as if they had happened.
 */
import { type Cipher, ctx } from '../../crypto/cipher.ts';
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import type { BooksService } from './service.ts';

export interface EntryRow {
  id: Id;
  reference: string;
  typeKey: string;
  typeLabel: string;
  intentType: string;
  status: string;
  valueDate: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
  /** Money into this book's places (cash, bank, wallet). */
  moneyIn: bigint;
  /** Money out of this book's places. */
  moneyOut: bigint;
  /** The size of the entry in this book (its debits), for entries that move no money (a bill, a settlement offset). */
  total: bigint;
  /** True until every effect is posted (for example while someone's acknowledgement is awaited). */
  pending: boolean;
}

export interface EntryLine {
  side: 'Dr' | 'Cr';
  amount: bigint;
  accountCode: string;
  accountName: string;
  place: string | null;
  counterparty: string | null;
  category: string | null;
}

export interface EntryDetail extends Omit<EntryRow, 'moneyIn' | 'moneyOut' | 'total'> {
  books: {
    bookId: Id;
    bookName: string;
    lines: EntryLine[];
    legs: { kind: string; amount: bigint; place: string | null }[];
  }[];
  acknowledgements: { personId: Id; name: string; status: string; decidedAt: string | null; note: string | null }[];
  links: { kind: string; direction: 'to' | 'from'; txnId: Id; reference: string | null }[];
  openItems: { id: Id; reference: string; remaining: bigint; status: string }[];
}

export interface WaitingAnswer {
  txnId: Id;
  reference: string;
  typeLabel: string;
  valueDate: string;
  reason: string | null;
  from: string | null;
  requestedAt: string;
  /** The effect on the person's own books: money in and out of their places. */
  moneyIn: bigint;
  moneyOut: bigint;
}

const MONEY = new Set(['cash', 'bank', 'wallet']);

function encodeCursor(date: string, id: string): string {
  return btoa(`${date}|${id}`).replaceAll('=', '');
}

function decodeCursor(c: string): { date: string; id: string } {
  try {
    const [date, id] = atob(c).split('|');
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && /^[0-9a-f-]{36}$/.test(id)) return { date, id };
  } catch { /* fall through */ }
  return fail('VALIDATION', 'That page link is not valid.');
}

export class ActivityService {
  constructor(private readonly books: BooksService, private readonly cipher: Cipher) {}

  private async amountsFor(
    tx: Sql,
    bookId: Id,
    txnIds: Id[],
  ): Promise<Map<Id, { moneyIn: bigint; moneyOut: bigint; total: bigint }>> {
    const out = new Map<Id, { moneyIn: bigint; moneyOut: bigint; total: bigint }>();
    const get = (id: Id) => {
      let v = out.get(id);
      if (!v) out.set(id, v = { moneyIn: 0n, moneyOut: 0n, total: 0n });
      return v;
    };
    if (txnIds.length === 0) return out;
    const lines = await tx.query<
      { txn_id: string; id: string; side: 'Dr' | 'Cr'; amount_enc: Uint8Array; role: string | null }
    >(
      `select j.txn_id, l.id, l.side, l.amount_enc, a.role
       from finly.journal_line l
       join finly.journal j on j.id = l.journal_id
       join finly.ledger_account a on a.id = l.ledger_account_id
       where j.txn_id = any ($1::uuid[]) and l.entity_id = $2`,
      [txnIds, bookId],
    );
    const posted = new Set<Id>();
    for (const l of lines) {
      posted.add(l.txn_id);
      const v = get(l.txn_id);
      const amount = await this.cipher.decryptAmount(
        new Uint8Array(l.amount_enc),
        ctx('journal_line', 'amount_enc', l.id),
      );
      if (l.side === 'Dr') v.total += amount;
      if (MONEY.has(l.role ?? '')) {
        if (l.side === 'Dr') v.moneyIn += amount;
        else v.moneyOut += amount;
      }
    }
    const waiting = txnIds.filter((id) => !posted.has(id));
    if (waiting.length > 0) {
      const legs = await tx.query<
        { txn_id: string; id: string; leg_kind: string; amount_enc: Uint8Array; location_id: string | null }
      >(
        `select txn_id, id, leg_kind, amount_enc, location_id from finly.txn_leg
         where txn_id = any ($1::uuid[]) and entity_id = $2`,
        [waiting, bookId],
      );
      for (const l of legs) {
        const v = get(l.txn_id);
        const amount = await this.cipher.decryptAmount(
          new Uint8Array(l.amount_enc),
          ctx('txn_leg', 'amount_enc', l.id),
        );
        if (l.leg_kind === 'source' && l.location_id) v.moneyOut += amount;
        else if (l.leg_kind === 'destination' && l.location_id) v.moneyIn += amount;
        v.total += amount;
      }
    }
    return out;
  }

  /** The entries of one book, newest first, a page at a time (keyset pagination). */
  async entries(
    actor: Id,
    bookId: Id,
    page: { cursor?: string; limit?: number } = {},
  ): Promise<{ items: EntryRow[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(page.limit ?? 30, 1), 100);
    const after = page.cursor ? decodeCursor(page.cursor) : null;
    return await this.books.asApi(actor, async (tx) => {
      const [ok] = await tx.query<{ ok: boolean }>(`select $1::uuid = any (finly.actor_env_ids('read')) as ok`, [
        bookId,
      ]);
      if (!ok?.ok) fail('NOT_FOUND', 'Those books were not found.');
      const rows = await tx.query<{
        id: string;
        reference: string;
        type_key: string;
        type_label: string;
        intent_type: string;
        status: string;
        value_date: string;
        reason: string | null;
        created_by: string | null;
        created_at: string;
      }>(
        `select t.id, t.reference, tt.key as type_key, tt.label as type_label, t.intent_type, t.status,
                t.value_date::text as value_date, t.reason, u.display_name as created_by, t.entered_at::text as created_at
         from finly.txn_entity te
         join finly.txn t on t.id = te.txn_id
         join finly.txn_type tt on tt.id = t.txn_type_id
         left join finly.app_user_public u on u.id = t.created_by_user_id
         where te.entity_id = $1 and t.status not in ('draft', 'failed')
           and ($2::date is null or (t.value_date, t.id) < ($2::date, $3::uuid))
         order by t.value_date desc, t.id desc
         limit $4`,
        [bookId, after?.date ?? null, after?.id ?? null, limit + 1],
      );
      const pageRows = rows.slice(0, limit);
      const amounts = await this.amountsFor(tx, bookId, pageRows.map((r) => r.id));
      const items = pageRows.map((r) => {
        const a = amounts.get(r.id) ?? { moneyIn: 0n, moneyOut: 0n, total: 0n };
        return {
          id: r.id,
          reference: r.reference,
          typeKey: r.type_key,
          typeLabel: r.type_label,
          intentType: r.intent_type,
          status: r.status,
          valueDate: r.value_date,
          reason: r.reason,
          createdBy: r.created_by,
          createdAt: r.created_at,
          ...a,
          pending: r.status !== 'posted' && r.status !== 'reversed' && r.status !== 'corrected',
        };
      });
      const last = pageRows[pageRows.length - 1];
      return { items, nextCursor: rows.length > limit && last ? encodeCursor(last.value_date, last.id) : null };
    });
  }

  /** One entry in full, as far as the actor may see it: only the books they may enter. */
  async entry(actor: Id, txnId: Id): Promise<EntryDetail> {
    return await this.books.asApi(actor, async (tx) => {
      const [t] = await tx.query<{
        id: string;
        reference: string;
        type_key: string;
        type_label: string;
        intent_type: string;
        status: string;
        value_date: string;
        reason: string | null;
        created_by: string | null;
        created_at: string;
      }>(
        `select t.id, t.reference, tt.key as type_key, tt.label as type_label, t.intent_type, t.status,
                t.value_date::text as value_date, t.reason, u.display_name as created_by, t.entered_at::text as created_at
         from finly.txn t
         join finly.txn_type tt on tt.id = t.txn_type_id
         left join finly.app_user_public u on u.id = t.created_by_user_id
         where t.id = $1`,
        [txnId],
      );
      if (!t) fail('NOT_FOUND', 'That entry was not found.');
      const visible = await tx.query<{ entity_id: string; name: string }>(
        `select te.entity_id, e.display_name as name from finly.txn_entity te
         join finly.entity e on e.id = te.entity_id
         where te.txn_id = $1 order by e.display_name`,
        [txnId],
      );
      const lines = await tx.query<{
        id: string;
        entity_id: string;
        side: 'Dr' | 'Cr';
        amount_enc: Uint8Array;
        code: string;
        account: string;
        place: string | null;
        counterparty: string | null;
        category: string | null;
      }>(
        `select l.id, l.entity_id, l.side, l.amount_enc, a.code, a.name as account, loc.name as place,
                cp.display_name as counterparty, c.name as category
         from finly.journal_line l
         join finly.journal j on j.id = l.journal_id
         join finly.ledger_account a on a.id = l.ledger_account_id
         left join finly.location loc on loc.id = l.location_id
         left join finly.entity cp on cp.id = l.counterparty_entity_id
         left join finly.category c on c.id = l.category_id
         where j.txn_id = $1
         order by l.entity_id, j.step, l.line_no`,
        [txnId],
      );
      const legs = await tx.query<
        { id: string; entity_id: string; leg_kind: string; amount_enc: Uint8Array; place: string | null }
      >(
        `select g.id, g.entity_id, g.leg_kind, g.amount_enc, loc.name as place
         from finly.txn_leg g left join finly.location loc on loc.id = g.location_id
         where g.txn_id = $1 order by g.leg_kind, g.seq`,
        [txnId],
      );
      const books: EntryDetail['books'] = [];
      for (const v of visible) {
        const bookLines: EntryLine[] = [];
        for (const l of lines.filter((x) => x.entity_id === v.entity_id)) {
          bookLines.push({
            side: l.side,
            amount: await this.cipher.decryptAmount(
              new Uint8Array(l.amount_enc),
              ctx('journal_line', 'amount_enc', l.id),
            ),
            accountCode: l.code,
            accountName: l.account,
            place: l.place,
            counterparty: l.counterparty,
            category: l.category,
          });
        }
        const bookLegs = [];
        for (const g of legs.filter((x) => x.entity_id === v.entity_id)) {
          bookLegs.push({
            kind: g.leg_kind,
            amount: await this.cipher.decryptAmount(new Uint8Array(g.amount_enc), ctx('txn_leg', 'amount_enc', g.id)),
            place: g.place,
          });
        }
        books.push({ bookId: v.entity_id, bookName: v.name, lines: bookLines, legs: bookLegs });
      }
      const acknowledgements = await tx.query<
        { person_id: string; name: string | null; status: string; decided_at: string | null; note: string | null }
      >(
        `select a.entity_id as person_id, e.display_name as name, a.ack_status as status, a.decided_at::text, a.note
         from finly.txn_acknowledgement a left join finly.entity e on e.id = a.entity_id
         where a.txn_id = $1 order by a.requested_at`,
        [txnId],
      );
      const links = await tx.query<
        { kind: string; direction: 'to' | 'from'; txn_id: string; reference: string | null }
      >(
        `select l.kind, 'to' as direction, l.to_txn_id as txn_id, t.reference
         from finly.txn_link l left join finly.txn t on t.id = l.to_txn_id where l.from_txn_id = $1
         union all
         select l.kind, 'from', l.from_txn_id, t.reference
         from finly.txn_link l left join finly.txn t on t.id = l.from_txn_id where l.to_txn_id = $1`,
        [txnId],
      );
      const items = await tx.query<{ id: string; reference: string; remaining_enc: Uint8Array; item_status: string }>(
        `select id, reference, remaining_enc, item_status from finly.open_item where origin_txn_id = $1 order by reference`,
        [txnId],
      );
      const openItems = [];
      for (const i of items) {
        openItems.push({
          id: i.id,
          reference: i.reference,
          remaining: await this.cipher.decryptAmount(
            new Uint8Array(i.remaining_enc),
            ctx('open_item', 'remaining_enc', i.id),
          ),
          status: i.item_status,
        });
      }
      return {
        id: t.id,
        reference: t.reference,
        typeKey: t.type_key,
        typeLabel: t.type_label,
        intentType: t.intent_type,
        status: t.status,
        valueDate: t.value_date,
        reason: t.reason,
        createdBy: t.created_by,
        createdAt: t.created_at,
        pending: t.status !== 'posted' && t.status !== 'reversed' && t.status !== 'corrected',
        books,
        acknowledgements: acknowledgements.map((a) => ({
          personId: a.person_id,
          name: a.name ?? 'Someone',
          status: a.status,
          decidedAt: a.decided_at,
          note: a.note,
        })),
        links: links.map((l) => ({ kind: l.kind, direction: l.direction, txnId: l.txn_id, reference: l.reference })),
        openItems,
      };
    });
  }

  /** Entries that wait for this person's acknowledgement before they can post in their own books (D-029). */
  async waitingForMe(actor: Id): Promise<WaitingAnswer[]> {
    return await this.books.asApi(actor, async (tx) => {
      const rows = await tx.query<{
        txn_id: string;
        entity_id: string;
        reference: string;
        type_label: string;
        value_date: string;
        reason: string | null;
        from_name: string | null;
        requested_at: string;
      }>(
        `select a.txn_id, a.entity_id, t.reference, tt.label as type_label, t.value_date::text, t.reason,
                u.display_name as from_name, a.requested_at::text
         from finly.txn_acknowledgement a
         join finly.txn t on t.id = a.txn_id
         join finly.txn_type tt on tt.id = t.txn_type_id
         left join finly.app_user_public u on u.id = t.created_by_user_id
         where a.entity_id = finly.actor_person_id() and a.ack_status = 'pending'
         order by a.requested_at desc
         limit 200`,
      );
      const out: WaitingAnswer[] = [];
      for (const r of rows) {
        const a = (await this.amountsFor(tx, r.entity_id, [r.txn_id])).get(r.txn_id);
        out.push({
          txnId: r.txn_id,
          reference: r.reference,
          typeLabel: r.type_label,
          valueDate: r.value_date,
          reason: r.reason,
          from: r.from_name,
          requestedAt: r.requested_at,
          moneyIn: a?.moneyIn ?? 0n,
          moneyOut: a?.moneyOut ?? 0n,
        });
      }
      return out;
    });
  }
}
