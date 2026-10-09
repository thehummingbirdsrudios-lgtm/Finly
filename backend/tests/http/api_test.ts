/**
 * The HTTP API end to end on the real schema (PGlite by default; PostgreSQL 17/18 with FINLY_TEST_TARGET), through the
 * same composition root as the server: a new account from first sign-in to posted entries, with the refusals that
 * matter — another person's books, missing classifications, bad amounts, replays, revoked sessions.
 */
import { assert, assertEquals, assertMatch } from '@std/assert';
import { StaticKekSource } from '../../src/crypto/keys.ts';
import { compose } from '../../src/main/compose.ts';
import { createApi } from '../../src/http/app.ts';
import { migratedDb } from '../db/harness.ts';

const db = await migratedDb();
const services = compose(db.port!, new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1));
const logs: Record<string, unknown>[] = [];
const handle = createApi({ ...services, log: (e) => logs.push(e) });
const TEMP = 'First-Login-Pass-2026';
const OWN = 'my very own pass 2026';
const DEVICE = { platform: 'android', model: 'Pixel test', appVersion: '1.0.0' };

interface Res<T = Record<string, unknown>> {
  status: number;
  body: T;
}

async function call<T = Record<string, unknown>>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; key?: string } = {},
): Promise<Res<T>> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.key) headers['idempotency-key'] = opts.key;
  const res = await handle(
    new Request(`http://finly.test${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
    '127.0.0.1',
  );
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : ({} as T) };
}

/** A new person with an account, signed in with their own password. */
async function person(name: string): Promise<{ token: string; personId: string; username: string }> {
  const username = `${name.toLowerCase()}${crypto.randomUUID().slice(0, 6)}`;
  await services.identity.createUser({ username, displayName: name, temporaryPassword: TEMP, roleKeys: [] });
  const first = await call<{ accessToken: string }>('POST', '/v1/auth/sign-in', {
    body: { username, password: TEMP, device: DEVICE },
  });
  const changed = await call<{ accessToken: string }>('POST', '/v1/auth/password', {
    token: first.body.accessToken,
    body: { currentPassword: TEMP, newPassword: OWN },
  });
  const me = await call<{ personEntityId: string }>('GET', '/v1/me', { token: changed.body.accessToken });
  return { token: changed.body.accessToken, personId: me.body.personEntityId, username };
}

const today = new Date().toISOString().slice(0, 10);

Deno.test('first sign-in: only the password change is open until the temporary password is replaced', async () => {
  const username = `asha${crypto.randomUUID().slice(0, 6)}`;
  await services.identity.createUser({ username, displayName: 'Asha', temporaryPassword: TEMP, roleKeys: [] });
  const s = await call<{ accessToken: string; mustChangePassword: boolean }>('POST', '/v1/auth/sign-in', {
    body: { username, password: TEMP, device: DEVICE },
  });
  assertEquals([s.status, s.body.mustChangePassword], [200, true]);
  const blocked = await call<{ code: string }>('GET', '/v1/books', { token: s.body.accessToken });
  assertEquals([blocked.status, blocked.body.code], [403, 'PASSWORD_CHANGE_REQUIRED']);
  assertEquals((await call('GET', '/v1/me', { token: s.body.accessToken })).status, 200);
  const changed = await call<{ accessToken: string; mustChangePassword: boolean }>('POST', '/v1/auth/password', {
    token: s.body.accessToken,
    body: { currentPassword: TEMP, newPassword: OWN },
  });
  assertEquals([changed.status, changed.body.mustChangePassword], [200, false]);
  const books = await call<{ items: { personal: boolean; name: string }[] }>('GET', '/v1/books', {
    token: changed.body.accessToken,
  });
  assertEquals(books.body.items.map((b) => [b.personal, b.name]), [[true, 'Asha']]);
});

Deno.test('a new firm starts empty; opening money, an expense and money given post once and add up', async () => {
  const me = await person('Ravi');
  const t = me.token;
  const firm = await call<{ id: string }>('POST', '/v1/books', {
    token: t,
    body: {
      name: 'Ravi Traders',
      typeKey: 'proprietorship',
      openingDate: today,
      creatorIsOwner: true,
      sharePercent: 100,
    },
  });
  assertEquals(firm.status, 201);
  const firmId = firm.body.id;
  const empty = await call<Record<string, string>>('GET', `/v1/books/${firmId}/summary`, { token: t });
  assertEquals([empty.body.money, empty.body.receivables, empty.body.netPosition], ['0', '0', '0'], 'nothing invented');
  assertEquals((await call<{ items: unknown[] }>('GET', `/v1/books/${firmId}/places`, { token: t })).body.items, []);

  const tijori = (await call<{ id: string }>('POST', `/v1/books/${firmId}/places`, {
    token: t,
    body: { name: 'Shop Tijori', kind: 'cash', typeKey: 'vault' },
  })).body.id;
  const bank = (await call<{ id: string }>('POST', `/v1/books/${me.personId}/places`, {
    token: t,
    body: {
      name: 'My savings',
      kind: 'bank',
      typeKey: 'bank_savings',
      bank: { bankName: 'Test Bank', accountHolder: 'Ravi', accountNumber: '123456789012', accountType: 'savings' },
    },
  })).body.id;
  const places = await call<{ items: { id: string; bank: { last4: string } | null }[] }>(
    'GET',
    `/v1/books/${me.personId}/places`,
    { token: t },
  );
  assertEquals(places.body.items.find((p) => p.id === bank)?.bank?.last4, '9012');
  assert(!JSON.stringify(places.body).includes('123456789012'), 'the full account number never leaves the server');

  const lookups = await call<{ categories: { id: string; key: string }[] }>('GET', '/v1/lookups', { token: t });
  const cat = (key: string) => lookups.body.categories.find((c) => c.key === key)!.id;

  const opening = {
    typeKey: 'opening_balance',
    bookId: firmId,
    valueDate: today,
    intent: { type: 'opening_balance', entityId: firmId, locationId: tijori, amount: '100000' },
  };
  const key = crypto.randomUUID();
  const first = await call<{ status: string; reference: string; replayed: boolean }>('POST', '/v1/entries', {
    token: t,
    body: opening,
    key,
  });
  assertEquals([first.status, first.body.status, first.body.replayed], [201, 'posted', false]);
  assertMatch(first.body.reference, /^TX-\d{8}-\d{6}$/);
  const again = await call<{ replayed: boolean; reference: string }>('POST', '/v1/entries', {
    token: t,
    body: opening,
    key,
  });
  assertEquals([again.status, again.body.replayed, again.body.reference], [200, true, first.body.reference]);

  const expense = await call('POST', '/v1/entries', {
    token: t,
    key: crypto.randomUUID(),
    body: {
      typeKey: 'expense',
      bookId: firmId,
      valueDate: today,
      reason: 'Shop electricity',
      intent: {
        type: 'expense',
        sources: [{ entityId: firmId, locationId: tijori, amount: '2500' }],
        allocations: [{ ownerId: firmId, categoryId: cat('electricity'), amount: '2500' }],
      },
    },
  });
  assertEquals(expense.status, 201);

  const drawing = await call('POST', '/v1/entries', {
    token: t,
    key: crypto.randomUUID(),
    body: {
      typeKey: 'give',
      bookId: firmId,
      valueDate: today,
      intent: {
        type: 'give',
        giverId: firmId,
        giverLocationId: tijori,
        purpose: 'drawings',
        repayable: false,
        giverSide: 'own',
        receiverId: me.personId,
        receiverSide: 'own',
        receiverLocationId: bank,
        amount: '10000',
      },
    },
  });
  assertEquals(drawing.status, 201, JSON.stringify(drawing.body));

  const s = await call<Record<string, string>>('GET', `/v1/books/${firmId}/summary`, { token: t });
  assertEquals([s.body.money, s.body.monthExpense], ['87500', '2500']);
  const mine = await call<Record<string, string>>('GET', `/v1/books/${me.personId}/summary`, { token: t });
  assertEquals([mine.body.money, mine.body.monthIncome], ['10000', '0'], 'a drawing is money, not income');

  const list = await call<{ items: { reference: string; moneyIn: string; moneyOut: string; pending: boolean }[] }>(
    'GET',
    `/v1/books/${firmId}/entries?limit=2`,
    { token: t },
  );
  assertEquals(list.body.items.length, 2);
  const page2 = await call<{ items: unknown[]; nextCursor: string | null }>(
    'GET',
    `/v1/books/${firmId}/entries?limit=2&cursor=${(list.body as unknown as { nextCursor: string }).nextCursor}`,
    { token: t },
  );
  assertEquals([page2.body.items.length, page2.body.nextCursor], [1, null]);
  const all = [...list.body.items, ...(page2.body.items as typeof list.body.items)];
  assertEquals(all.map((i) => [i.moneyIn, i.moneyOut]).sort(), [['0', '10000'], ['0', '2500'], ['100000', '0']].sort());
  const detail = await call<{ books: { lines: unknown[] }[]; reference: string }>(
    'GET',
    `/v1/entries/${(all.find((i) => i.moneyIn === '100000') as unknown as { id: string }).id}`,
    { token: t },
  );
  assertEquals([detail.status, detail.body.books[0].lines.length], [200, 2]);
});

Deno.test('another person cannot see, list or post into someone else’s books', async () => {
  const owner = await person('Meena');
  const other = await person('Kiran');
  const firmId = (await call<{ id: string }>('POST', '/v1/books', {
    token: owner.token,
    body: { name: 'Meena Studio', typeKey: 'company', openingDate: today, creatorIsOwner: false },
  })).body.id;
  const theirBooks = await call<{ items: { id: string }[] }>('GET', '/v1/books', { token: other.token });
  assertEquals(theirBooks.body.items.map((b) => b.id), [other.personId]);
  for (const path of [`/v1/books/${firmId}/summary`, `/v1/books/${firmId}/places`, `/v1/books/${firmId}/entries`]) {
    assertEquals((await call('GET', path, { token: other.token })).status, 404, path);
  }
  const intoTheirs = await call<{ code: string }>('POST', `/v1/books/${firmId}/places`, {
    token: other.token,
    body: { name: 'Sneaky', kind: 'cash', typeKey: 'vault' },
  });
  assertEquals(intoTheirs.status, 404);
  const post = await call<{ code: string }>('POST', '/v1/entries', {
    token: other.token,
    key: crypto.randomUUID(),
    body: {
      typeKey: 'opening_balance',
      bookId: firmId,
      valueDate: today,
      intent: { type: 'opening_balance', entityId: firmId, locationId: crypto.randomUUID(), amount: '5' },
    },
  });
  assert([403, 404].includes(post.status), `got ${post.status}`);
});

Deno.test('the API explains what is missing or wrong, and never accepts a fractional or disguised amount', async () => {
  const me = await person('Dev');
  const t = me.token;
  const place = (await call<{ id: string }>('POST', `/v1/books/${me.personId}/places`, {
    token: t,
    body: { name: 'Wallet cash', kind: 'cash', typeKey: 'hand_cash' },
  })).body.id;
  const party = (await call<{ id: string }>('POST', `/v1/books/${me.personId}/parties`, {
    token: t,
    body: { name: 'Neighbour', typeKey: 'other_party' },
  })).body.id;
  const give = (intent: Record<string, unknown>) =>
    call<{ code: string; details?: { question?: string } }>('POST', '/v1/entries', {
      token: t,
      key: crypto.randomUUID(),
      body: {
        typeKey: 'give',
        bookId: me.personId,
        valueDate: today,
        intent: {
          type: 'give',
          giverId: me.personId,
          giverLocationId: place,
          receiverId: party,
          amount: '500',
          ...intent,
        },
      },
    });
  const noPurpose = await give({});
  assertEquals([noPurpose.status, noPurpose.body.code, noPurpose.body.details?.question], [
    422,
    'CLASSIFICATION_REQUIRED',
    'purpose',
  ]);
  const fractional = await give({ purpose: 'gift', repayable: false, amount: '10.50' });
  assertEquals([fractional.status, fractional.body.code], [422, 'AMOUNT_INVALID']);
  const adjust = await call<{ code: string }>('POST', '/v1/entries', {
    token: t,
    key: crypto.randomUUID(),
    body: {
      typeKey: 'cash_adjustment',
      bookId: me.personId,
      valueDate: today,
      intent: { type: 'cash_adjustment', entityId: me.personId, locationId: place, amount: '5', direction: 'over' },
    },
  });
  assertEquals([adjust.status, adjust.body.code], [422, 'VALIDATION'], 'adjustments go through their approval route');
  const noKey = await call<{ code: string }>('POST', '/v1/entries', {
    token: t,
    body: { typeKey: 'give', bookId: me.personId, valueDate: today, intent: { type: 'give' } },
  });
  assertEquals([noKey.status, noKey.body.code], [422, 'VALIDATION']);
});

Deno.test('signed-out and forged tokens are refused; unknown routes and methods are answered plainly', async () => {
  const me = await person('Lata');
  assertEquals((await call('GET', '/v1/books')).status, 401);
  assertEquals((await call('GET', '/v1/books', { token: `${me.token}x` })).status, 401);
  assertEquals((await call('POST', '/v1/auth/sign-out', { token: me.token })).status, 204);
  assertEquals((await call('GET', '/v1/books', { token: me.token })).status, 401);
  assertEquals((await call('GET', '/v1/nothing-here')).status, 404);
  assertEquals((await call('PUT', '/v1/books')).status, 405);
  const health = await call<{ status: string }>('GET', '/v1/health');
  assertEquals([health.status, health.body.status], [200, 'ok']);
  // Logs carry routes and outcomes, never tokens, passwords or amounts.
  const text = JSON.stringify(logs);
  for (const secret of [me.token, TEMP, OWN, '100000']) assert(!text.includes(secret), 'secret in logs');
});
