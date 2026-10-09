/**
 * The books a person works in, and what is in them (ADDON-19 §9, ADDON-21 §2.1): their books and their access, money
 * places with balances, a summary that keeps money, receivables, payables and net position apart, receivables and
 * payables, parties, and self-service creation of a firm. Every read runs as `finly_api` with the actor set, so the
 * database's row-level security decides what exists for this person; amounts are decrypted here and never cached.
 */
import { appendAudit } from '../audit.ts';
import { type Cipher, ctx } from '../../crypto/cipher.ts';
import type { BlindIndex } from '../../crypto/blind.ts';
import type { HashChain } from '../../crypto/chain.ts';
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import { toFinlyError } from '../db_errors.ts';

export interface BooksKeys {
  cipher: Cipher;
  blind: BlindIndex;
  chain: HashChain;
}

export interface Book {
  id: Id;
  kind: 'person' | 'firm' | 'pool';
  name: string;
  typeLabel: string;
  personal: boolean;
  access: 'read' | 'write' | 'manage';
  canPost: boolean;
  canManage: boolean;
}

export interface Place {
  id: Id;
  name: string;
  kind: 'cash' | 'bank' | 'wallet';
  typeKey: string;
  typeLabel: string;
  custodian: string | null;
  bank:
    | { bankName: string | null; accountHolder: string | null; last4: string | null; accountType: string | null }
    | null;
  /** This book's money at the place (whole rupees, may be negative only where overdraft is allowed). */
  balance: bigint;
  active: boolean;
}

export interface BookSummary {
  bookId: Id;
  money: bigint;
  inTransit: bigint;
  receivables: bigint;
  investments: bigint;
  payables: bigint;
  unidentified: bigint;
  totalAssets: bigint;
  totalLiabilities: bigint;
  /** Assets − liabilities (ADDON-21 §2.1). */
  netPosition: bigint;
  /** This month, from the period totals: income and expense recognised (never transfers or loans). */
  monthIncome: bigint;
  monthExpense: bigint;
  periodStart: string | null;
}

export interface OpenItemView {
  id: Id;
  reference: string;
  kind: string;
  /** Seen from the book: `receivable` = someone owes this book; `payable` = this book owes. */
  direction: 'receivable' | 'payable';
  counterpartyId: Id;
  counterparty: string;
  original: bigint;
  remaining: bigint;
  status: string;
  dueDate: string | null;
  reason: string;
  originReference: string;
  originTxnId: Id;
  createdAt: string;
}

export interface Party {
  id: Id;
  kind: 'person' | 'firm' | 'pool' | 'party';
  name: string;
  typeLabel: string;
  keepsBooks: boolean;
  /** Recorded in this book's list of people and businesses. */
  recordedHere: boolean;
}

export interface NewFirm {
  name: string;
  typeKey: string;
  openingDate: string;
  creatorIsOwner: boolean;
  /** Ownership share in basis points (1–10000) when the creator is an owner and knows it. */
  shareBp?: number;
}

export interface NewPlace {
  name: string;
  kind: 'cash' | 'bank' | 'wallet';
  typeKey: string;
  custodyPersonId?: Id;
  bank?: {
    bankName?: string;
    branch?: string;
    ifsc?: string;
    accountHolder?: string;
    accountNumber?: string;
    accountType?: 'savings' | 'current' | 'overdraft' | 'cash_credit' | 'wallet' | 'upi' | 'other';
  };
}

const MONEY_ROLES = new Set(['cash', 'bank', 'wallet']);
const RECEIVABLE_ROLES = new Set(['interentity_receivable', 'advances_given', 'loans_given', 'customer_receivable']);
const PAYABLE_ROLES = new Set(['interentity_payable', 'supplier_payable', 'loans_taken', 'advances_received']);

export class BooksService {
  constructor(private readonly db: Sql, private readonly keys: BooksKeys) {}

  /** One transaction as the API role, attributed to the actor (RLS and audit). */
  async asApi<T>(actor: Id, fn: (tx: Sql) => Promise<T>): Promise<T> {
    try {
      return await this.db.transaction(async (tx) => {
        await tx.exec('set local role finly_api');
        await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
        return await fn(tx);
      });
    } catch (e) {
      throw toFinlyError(e);
    }
  }

  /** Fails with NOT_FOUND unless the actor may enter these books (never says whether they exist). */
  private async requireBook(tx: Sql, bookId: Id, level: 'read' | 'write' | 'manage' = 'read'): Promise<void> {
    const [r] = await tx.query<{ ok: boolean }>(`select $1::uuid = any (finly.actor_env_ids($2)) as ok`, [
      bookId,
      level,
    ]);
    if (!r?.ok) fail('NOT_FOUND', 'Those books were not found.');
  }

  async myBooks(actor: Id): Promise<Book[]> {
    return await this.asApi(actor, async (tx) => {
      const rows = await tx.query<{
        id: string;
        kind: Book['kind'];
        name: string;
        type_label: string;
        personal: boolean;
        level: Book['access'];
        can_post: boolean;
        can_manage: boolean;
      }>(
        `with r as (select unnest(finly.actor_env_ids('read')) as id),
              w as (select unnest(finly.actor_env_ids('write')) as id),
              m as (select unnest(finly.actor_env_ids('manage')) as id)
         select e.id, e.kind, e.display_name as name, et.label as type_label,
                e.id = finly.actor_person_id() as personal,
                case when e.id in (select id from m) then 'manage'
                     when e.id in (select id from w) then 'write' else 'read' end as level,
                (e.id = finly.actor_person_id()
                 or (e.id in (select id from w)
                     and (finly.actor_has_permission('txn.create', e.id) or finly.actor_has_permission('txn.create'))))
                  as can_post,
                (e.id = finly.actor_person_id() or finly.actor_can_manage(e.id)) as can_manage
         from finly.entity e join finly.entity_type et on et.id = e.entity_type_id
         where e.id in (select id from r) and e.kind in ('person', 'firm', 'pool') and e.status = 'active'
         order by (e.id = finly.actor_person_id()) desc, e.display_name, e.id`,
      );
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        typeLabel: r.type_label,
        personal: r.personal,
        access: r.level,
        canPost: r.can_post,
        canManage: r.can_manage,
      }));
    });
  }

  /** Creates a firm or pool owned or administered by the actor, with its books set up (0017). */
  async createFirm(actor: Id, f: NewFirm): Promise<Id> {
    const name = f.name.trim();
    if (name.length < 1 || name.length > 120) {
      fail('VALIDATION', 'Enter a name of up to 120 characters.', { field: 'name' });
    }
    return await this.asApi(actor, async (tx) => {
      const [r] = await tx.query<{ id: string }>(
        `select finly.create_firm($1, $2, $3::date, $4, $5) as id`,
        [name, f.typeKey, f.openingDate, f.creatorIsOwner, f.shareBp ?? null],
      );
      await appendAudit(tx, this.keys.chain, [{
        actorUserId: actor,
        action: 'entity.created',
        objectType: 'entity',
        objectId: r.id,
        envEntityId: r.id,
        reason: f.creatorIsOwner ? 'creator is a declared owner' : 'creator administers',
      }]);
      return r.id;
    });
  }

  /** The money places of a book with this book's balance at each. */
  async places(actor: Id, bookId: Id): Promise<Place[]> {
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId);
      const rows = await tx.query<{
        id: string;
        name: string;
        kind: Place['kind'];
        type_key: string;
        type_label: string;
        custodian: string | null;
        bank_name: string | null;
        account_holder: string | null;
        last4: string | null;
        account_type: string | null;
        has_bank: boolean;
        status: string;
      }>(
        `select l.id, l.name, l.kind, lv.key as type_key, lv.label as type_label, c.display_name as custodian,
                b.bank_name, b.account_holder, b.account_number_last4 as last4, b.account_type,
                b.location_id is not null as has_bank, l.status
         from finly.location l
         join finly.lookup_value lv on lv.id = l.type_id
         left join finly.entity c on c.id = l.custody_person_id
         left join finly.bank_account_detail b on b.location_id = l.id
         where l.managed_in_env_id = $1
            or exists (select 1 from finly.balance_slice s where s.location_id = l.id and s.entity_id = $1)
         order by l.status, l.kind, l.name, l.id`,
        [bookId],
      );
      const balances = await this.moneyByPlace(tx, bookId);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        typeKey: r.type_key,
        typeLabel: r.type_label,
        custodian: r.custodian,
        bank: r.has_bank
          ? { bankName: r.bank_name, accountHolder: r.account_holder, last4: r.last4, accountType: r.account_type }
          : null,
        balance: balances.get(r.id) ?? 0n,
        active: r.status === 'active',
      }));
    });
  }

  private async moneyByPlace(tx: Sql, bookId: Id): Promise<Map<Id, bigint>> {
    const rows = await tx.query<{ location_id: string; slice_id: string; balance_enc: Uint8Array }>(
      `select s.location_id, bc.slice_id, bc.balance_enc
       from finly.balance_slice s
       join finly.balance_current bc on bc.slice_id = s.id
       join finly.ledger_account a on a.id = s.ledger_account_id
       where s.entity_id = $1 and s.location_id is not null and a.role in ('cash', 'bank', 'wallet')`,
      [bookId],
    );
    const out = new Map<Id, bigint>();
    for (const r of rows) {
      const v = await this.keys.cipher.decryptAmount(
        new Uint8Array(r.balance_enc),
        ctx('balance_current', 'balance_enc', r.slice_id),
      );
      out.set(r.location_id, (out.get(r.location_id) ?? 0n) + v);
    }
    return out;
  }

  /** Adds a money place to a book (cash place, bank account or wallet). Account numbers are encrypted at once. */
  async addPlace(actor: Id, bookId: Id, p: NewPlace): Promise<Id> {
    const name = p.name.trim();
    if (name.length < 1 || name.length > 80) {
      fail('VALIDATION', 'Enter a name of up to 80 characters.', { field: 'name' });
    }
    if (p.custodyPersonId && p.kind !== 'cash') fail('VALIDATION', 'Only cash is held by a person.');
    if (p.bank && p.kind === 'cash') fail('VALIDATION', 'Bank details belong to a bank account or wallet.');
    const number = p.bank?.accountNumber?.replace(/\s/g, '');
    if (number !== undefined && number !== '' && !/^[0-9A-Za-z]{4,34}$/.test(number)) {
      fail('VALIDATION', 'Enter the account number with digits and letters only.', { field: 'accountNumber' });
    }
    const ifsc = p.bank?.ifsc?.trim().toUpperCase();
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      fail('VALIDATION', 'That IFSC code is not valid.', { field: 'ifsc' });
    }
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId, 'write');
      const [t] = await tx.query<{ id: string }>(
        `select id from finly.lookup_value where list_key = 'location_type' and key = $1 and status = 'active'`,
        [p.typeKey],
      );
      if (!t) fail('VALIDATION', 'Choose what kind of place this is.', { field: 'typeKey' });
      const [l] = await tx.query<{ id: string }>(
        `insert into finly.location (name, kind, type_id, custody_person_id, managed_in_env_id, created_by)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [name, p.kind, t.id, p.custodyPersonId ?? null, bookId, actor],
      );
      await tx.query(
        `insert into finly.location_ownership (location_id, owner_entity_id, set_by, reason)
         values ($1, $2, $3, 'Added with the place')`,
        [l.id, bookId, actor],
      );
      if (p.bank) {
        const enc = number
          ? await this.keys.cipher.encryptText(number, ctx('bank_account_detail', 'account_number_enc', l.id))
          : null;
        await tx.query(
          `insert into finly.bank_account_detail (location_id, bank_name, branch, ifsc, account_holder,
             account_number_enc, account_number_last4, account_number_bidx, account_type, key_version)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            l.id,
            p.bank.bankName?.trim() || null,
            p.bank.branch?.trim() || null,
            ifsc || null,
            p.bank.accountHolder?.trim() || null,
            enc,
            number && /[0-9]{4}$/.test(number) ? number.slice(-4) : null,
            number ? await this.keys.blind.accountNumber(number) : null,
            p.bank.accountType ?? null,
            enc ? this.keys.cipher.activeVersion() : null,
          ],
        );
      }
      await appendAudit(tx, this.keys.chain, [{
        actorUserId: actor,
        action: 'location.created',
        objectType: 'location',
        objectId: l.id,
        envEntityId: bookId,
      }]);
      return l.id;
    });
  }

  /** Money, receivables, payables and net position of one book, never mixed into one "balance". */
  async summary(actor: Id, bookId: Id): Promise<BookSummary> {
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId);
      const rows = await tx.query<{ slice_id: string; balance_enc: Uint8Array; class: string; role: string | null }>(
        `select bc.slice_id, bc.balance_enc, a.class, a.role
         from finly.balance_slice s
         join finly.balance_current bc on bc.slice_id = s.id
         join finly.ledger_account a on a.id = s.ledger_account_id
         where s.entity_id = $1`,
        [bookId],
      );
      const s: BookSummary = {
        bookId,
        money: 0n,
        inTransit: 0n,
        receivables: 0n,
        investments: 0n,
        payables: 0n,
        unidentified: 0n,
        totalAssets: 0n,
        totalLiabilities: 0n,
        netPosition: 0n,
        monthIncome: 0n,
        monthExpense: 0n,
        periodStart: null,
      };
      for (const r of rows) {
        const v = await this.keys.cipher.decryptAmount(
          new Uint8Array(r.balance_enc),
          ctx('balance_current', 'balance_enc', r.slice_id),
        );
        const role = r.role ?? '';
        if (MONEY_ROLES.has(role)) s.money += v;
        else if (role === 'cash_in_transit') s.inTransit += v;
        else if (RECEIVABLE_ROLES.has(role)) s.receivables += v;
        else if (role === 'investment_in_firms') s.investments += v;
        else if (role === 'suspense') s.unidentified += v;
        else if (PAYABLE_ROLES.has(role)) s.payables -= v;
        if (r.class === 'asset' || r.class === 'contra_asset') s.totalAssets += v;
        if (r.class === 'liability') s.totalLiabilities -= v;
      }
      s.netPosition = s.totalAssets - s.totalLiabilities;
      const period = await tx.query<{ id: string; start: string }>(
        `select id, period_start::text as start from finly.accounting_period
         where entity_id = $1 and current_date between period_start and period_end`,
        [bookId],
      );
      if (period[0]) {
        s.periodStart = period[0].start;
        const totals = await tx.query<
          { slice_id: string; debits_enc: Uint8Array; credits_enc: Uint8Array; class: string }
        >(
          `select bp.slice_id, bp.debits_enc, bp.credits_enc, a.class
           from finly.balance_period bp
           join finly.balance_slice s on s.id = bp.slice_id
           join finly.ledger_account a on a.id = s.ledger_account_id
           where bp.entity_id = $1 and bp.period_id = $2 and a.class in ('revenue', 'expense', 'cogs')`,
          [bookId, period[0].id],
        );
        for (const t of totals) {
          const key = `${t.slice_id}:${period[0].id}`;
          const dr = await this.keys.cipher.decryptAmount(
            new Uint8Array(t.debits_enc),
            ctx('balance_period', 'debits_enc', key),
          );
          const cr = await this.keys.cipher.decryptAmount(
            new Uint8Array(t.credits_enc),
            ctx('balance_period', 'credits_enc', key),
          );
          if (t.class === 'revenue') s.monthIncome += cr - dr;
          else s.monthExpense += dr - cr;
        }
      }
      return s;
    });
  }

  /** What others owe this book and what it owes, with the remaining amount of each. */
  async openItems(actor: Id, bookId: Id, includeClosed = false): Promise<OpenItemView[]> {
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId);
      const rows = await tx.query<{
        id: string;
        reference: string;
        kind: string;
        debtor_entity_id: string;
        creditor_entity_id: string;
        debtor: string | null;
        creditor: string | null;
        original_enc: Uint8Array;
        remaining_enc: Uint8Array;
        item_status: string;
        due_date: string | null;
        reason: string;
        origin_reference: string | null;
        origin_txn_id: string;
        created_at: string;
      }>(
        `select o.id, o.reference, o.kind, o.debtor_entity_id, o.creditor_entity_id,
                d.display_name as debtor, c.display_name as creditor, o.original_enc, o.remaining_enc, o.item_status,
                o.due_date::text, o.reason, t.reference as origin_reference, o.origin_txn_id, o.created_at::text
         from finly.open_item o
         left join finly.entity d on d.id = o.debtor_entity_id
         left join finly.entity c on c.id = o.creditor_entity_id
         left join finly.txn t on t.id = o.origin_txn_id
         where (o.debtor_entity_id = $1 or o.creditor_entity_id = $1)
           and ($2 or o.item_status in ('open', 'partially_settled'))
         order by o.created_at desc, o.id
         limit 500`,
        [bookId, includeClosed],
      );
      const out: OpenItemView[] = [];
      for (const r of rows) {
        const receivable = r.creditor_entity_id === bookId;
        out.push({
          id: r.id,
          reference: r.reference,
          kind: r.kind,
          direction: receivable ? 'receivable' : 'payable',
          counterpartyId: receivable ? r.debtor_entity_id : r.creditor_entity_id,
          counterparty: (receivable ? r.debtor : r.creditor) ?? 'Someone outside these books',
          original: await this.keys.cipher.decryptAmount(
            new Uint8Array(r.original_enc),
            ctx('open_item', 'original_enc', r.id),
          ),
          remaining: await this.keys.cipher.decryptAmount(
            new Uint8Array(r.remaining_enc),
            ctx('open_item', 'remaining_enc', r.id),
          ),
          status: r.item_status,
          dueDate: r.due_date,
          reason: r.reason,
          originReference: r.origin_reference ?? '',
          originTxnId: r.origin_txn_id,
          createdAt: r.created_at,
        });
      }
      return out;
    });
  }

  /** People, businesses and books this book can deal with: what the actor may see, never more. */
  async parties(actor: Id, bookId: Id): Promise<Party[]> {
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId);
      const rows = await tx.query<{
        id: string;
        kind: Party['kind'];
        name: string;
        type_label: string;
        recorded_here: boolean;
      }>(
        `select e.id, e.kind, e.display_name as name, et.label as type_label,
                e.managed_in_env_id is not distinct from $1::uuid as recorded_here
         from finly.entity e join finly.entity_type et on et.id = e.entity_type_id
         where e.id <> $1 and e.status = 'active'
         order by (e.managed_in_env_id is not distinct from $1::uuid) desc, e.display_name, e.id
         limit 1000`,
        [bookId],
      );
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        typeLabel: r.type_label,
        keepsBooks: r.kind !== 'party',
        recordedHere: r.recorded_here,
      }));
    });
  }

  /** Records a person or business outside Finly (keeps no books) in this book's list. */
  async addParty(actor: Id, bookId: Id, p: { name: string; typeKey: string }): Promise<Id> {
    const name = p.name.trim();
    if (name.length < 1 || name.length > 120) {
      fail('VALIDATION', 'Enter a name of up to 120 characters.', { field: 'name' });
    }
    return await this.asApi(actor, async (tx) => {
      await this.requireBook(tx, bookId, 'write');
      const [t] = await tx.query<{ id: string }>(
        `select id from finly.entity_type where key = $1 and kind = 'party' and status = 'active'`,
        [p.typeKey],
      );
      if (!t) fail('VALIDATION', 'Choose what kind of person or business this is.', { field: 'typeKey' });
      const [e] = await tx.query<{ id: string }>(
        `insert into finly.entity (kind, entity_type_id, display_name, managed_in_env_id, created_by)
         values ('party', $1, $2, $3, $4) returning id`,
        [t.id, name, bookId, actor],
      );
      await appendAudit(tx, this.keys.chain, [{
        actorUserId: actor,
        action: 'entity.created',
        objectType: 'entity',
        objectId: e.id,
        envEntityId: bookId,
      }]);
      return e.id;
    });
  }

  /** The lists a form needs: categories, entry types, place types, party and business types. */
  async lookups(actor: Id): Promise<{
    categories: { id: Id; key: string; name: string; kind: 'expense' | 'income' }[];
    entryTypes: { key: string; label: string; intentType: string }[];
    placeTypes: { key: string; label: string }[];
    partyTypes: { key: string; label: string }[];
    firmTypes: { key: string; label: string; kind: string }[];
  }> {
    return await this.asApi(actor, async (tx) => ({
      categories: await tx.query(
        `select id, key, name, kind from finly.category where status = 'active' order by kind, sort_order, name`,
      ),
      entryTypes: await tx.query(
        `select key, label, intent_type as "intentType" from finly.txn_type where status = 'active' order by sort_order`,
      ),
      placeTypes: await tx.query(
        `select key, label from finly.lookup_value where list_key = 'location_type' and status = 'active'
         order by sort_order`,
      ),
      partyTypes: await tx.query(
        `select key, label from finly.entity_type where kind = 'party' and status = 'active' order by label`,
      ),
      firmTypes: await tx.query(
        `select key, label, kind from finly.entity_type where kind in ('firm', 'pool') and status = 'active'
         order by kind, label`,
      ),
    }));
  }
}
