/**
 * End-to-end smoke test of a running API over real HTTP (a local server, or the deployed function):
 *
 *   deno task smoke <base-url> <ADMIN_ENV_KEY>
 *
 * Creates a throw-away account directly in the database named by ADMIN_ENV_KEY (a login that may act as finly_auth;
 * for the local dev database, FINLY_DEV_ADMIN_URL is derived from FINLY_PG17_ADMIN_URL), then through the API: signs
 * in with the temporary password, sets a new one, creates a firm, adds a money place, records an opening balance and
 * a transfer, reads the summary back and signs out. Prints one JSON line per step and exits non-zero on the first
 * failure. Passwords are random and never printed.
 */
import { EnvKekSource } from '../../src/crypto/keys.ts';
import { openPostgres } from '../../src/db/postgres.ts';
import { compose } from '../../src/main/compose.ts';

const [base, adminKey] = Deno.args;
if (!base || !adminKey) {
  console.error('Usage: deno task smoke <base-url> <ADMIN_ENV_KEY>');
  Deno.exit(2);
}
let adminUrl = Deno.env.get(adminKey);
if (!adminUrl && adminKey === 'FINLY_DEV_ADMIN_URL') {
  adminUrl = Deno.env.get('FINLY_PG17_ADMIN_URL')?.replace(/\/[^/?]*(\?|$)/, '/finly_dev$1');
}
if (!adminUrl) {
  console.error(`${adminKey} is not set`);
  Deno.exit(2);
}

function step(name: string, ok: boolean, detail: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ step: name, ok, ...detail }));
  if (!ok) Deno.exit(1);
}

async function call(method: string, path: string, opts: { token?: string; body?: unknown; key?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.key) headers['idempotency-key'] = opts.key;
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : {} };
}

const random = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18)))).replace(/[+/=]/g, 'x');
const username = `smoke${crypto.randomUUID().slice(0, 8)}`;
const temporary = `Tmp-${random()}`;
const own = `own pass ${random()}`;

const health = await call('GET', '/v1/health');
step('health', health.status === 200 && health.body.status === 'ok', { status: health.status, body: health.body });

const { client, sql } = openPostgres(adminUrl, { max: 1, applicationName: 'finly-smoke' });
try {
  await compose(sql, new EnvKekSource()).identity.createUser({
    username,
    displayName: 'Smoke Test',
    temporaryPassword: temporary,
    roleKeys: [],
  });
} finally {
  await client.end();
}
step('account created', true, { username });

const device = { platform: 'android', model: 'smoke test', appVersion: 'smoke' };
const signIn = await call('POST', '/v1/auth/sign-in', { body: { username, password: temporary, device } });
step('sign in with the temporary password', signIn.status === 200 && signIn.body.mustChangePassword === true, {
  status: signIn.status,
});
const changed = await call('POST', '/v1/auth/password', {
  token: signIn.body.accessToken,
  body: { currentPassword: temporary, newPassword: own },
});
step('own password set', changed.status === 200 && changed.body.mustChangePassword === false, {
  status: changed.status,
});
const t = changed.body.accessToken as string;
const today = new Date().toISOString().slice(0, 10);

const firm = await call('POST', '/v1/books', {
  token: t,
  body: { name: 'Smoke Test Shop', typeKey: 'proprietorship', openingDate: today, creatorIsOwner: true },
});
step('firm created', firm.status === 201, { status: firm.status });
const firmId = firm.body.id as string;

const tijori = await call('POST', `/v1/books/${firmId}/places`, {
  token: t,
  body: { name: 'Tijori', kind: 'cash', typeKey: 'vault' },
});
const bank = await call('POST', `/v1/books/${firmId}/places`, {
  token: t,
  body: {
    name: 'Shop bank',
    kind: 'bank',
    typeKey: 'bank_current',
    bank: { bankName: 'Test', accountNumber: '000011112222' },
  },
});
step('places added', tijori.status === 201 && bank.status === 201, { tijori: tijori.status, bank: bank.status });

const key = crypto.randomUUID();
const opening = {
  typeKey: 'opening_balance',
  bookId: firmId,
  valueDate: today,
  intent: { type: 'opening_balance', entityId: firmId, locationId: tijori.body.id, amount: '50000' },
};
const posted = await call('POST', '/v1/entries', { token: t, body: opening, key });
const replay = await call('POST', '/v1/entries', { token: t, body: opening, key });
step('opening balance posted once', posted.status === 201 && replay.body.replayed === true, {
  status: posted.status,
  reference: posted.body.reference,
});

const transfer = await call('POST', '/v1/entries', {
  token: t,
  key: crypto.randomUUID(),
  body: {
    typeKey: 'transfer',
    bookId: firmId,
    valueDate: today,
    intent: {
      type: 'transfer',
      entityId: firmId,
      fromLocationId: tijori.body.id,
      toLocationId: bank.body.id,
      amount: '20000',
    },
  },
});
step('transfer posted', transfer.status === 201, { status: transfer.status });

const summary = await call('GET', `/v1/books/${firmId}/summary`, { token: t });
step('summary adds up', summary.body.money === '50000' && summary.body.monthIncome === '0', {
  money: summary.body.money,
});
const places = await call('GET', `/v1/books/${firmId}/places`, { token: t });
const balances = Object.fromEntries(
  (places.body.items as { name: string; balance: string }[]).map((p) => [p.name, p.balance]),
);
step('balances by place', balances['Tijori'] === '30000' && balances['Shop bank'] === '20000', { balances });

const out = await call('POST', '/v1/auth/sign-out', { token: t });
const after = await call('GET', '/v1/books', { token: t });
step('signed out', out.status === 204 && after.status === 401);
console.log(JSON.stringify({ smoke: 'passed' }));
