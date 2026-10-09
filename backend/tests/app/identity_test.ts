/**
 * The identity service against the real schema (PGlite by default; PostgreSQL 17/18 with FINLY_TEST_TARGET): first
 * sign-in with a temporary password, the forced password change, throttling and lockout, rotating refresh tokens with
 * reuse detection, sign-out and session revocation, and that no secret is ever stored or returned in readable form.
 */
import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { BlindIndex } from '../../src/crypto/blind.ts';
import { KeyRing, StaticKekSource } from '../../src/crypto/keys.ts';
import { TokenSigner } from '../../src/crypto/token.ts';
import { type DeviceInfo, IdentityService } from '../../src/app/identity/service.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { dbWorld } from '../db/world.ts';

const PHONE: DeviceInfo = { platform: 'android', model: 'Test phone', osVersion: '14', appVersion: '1.0.0' };
const TEMP = 'Temporary-Pass-2026';
const NEW = 'my own Finly pass 9';

async function setup() {
  const w = await dbWorld();
  const ring = new KeyRing(new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1));
  const signer = new TokenSigner(ring);
  const ids = new IdentityService(w.db.port!, signer, new BlindIndex(ring));
  const username = `user${crypto.randomUUID().slice(0, 8)}`;
  const created = await ids.createUser({
    username,
    displayName: 'Asha Mehta',
    temporaryPassword: TEMP,
    roleKeys: [],
  });
  return { w, ids, signer, username, created };
}

async function refusal(fn: () => Promise<unknown>): Promise<FinlyError> {
  const e = await assertRejects(fn);
  assert(e instanceof FinlyError, String(e));
  return e;
}

Deno.test('a new account: personal books set up, temporary password, forced change, then active', async () => {
  const { w, ids, username, created } = await setup();
  const books = await w.db.query<{ accounts: number; funds: number; periods: number }>(
    `select (select count(*)::int from finly.ledger_account where entity_id = $1) as accounts,
            (select count(*)::int from finly.fund where entity_id = $1 and is_default) as funds,
            (select count(*)::int from finly.accounting_period where entity_id = $1) as periods`,
    [created.personEntityId],
  );
  assert(books.rows[0].accounts > 0);
  assertEquals([books.rows[0].funds, books.rows[0].periods], [1, 1]);

  const first = await ids.signIn(username, TEMP, PHONE);
  assertEquals(first.mustChangePassword, true);
  const actor = await ids.authenticate(first.accessToken);
  assertEquals([actor.userId, actor.personEntityId, actor.mustChangePassword], [
    created.userId,
    created.personEntityId,
    true,
  ]);

  const changed = await ids.changePassword(actor, TEMP, NEW);
  assertEquals(changed.mustChangePassword, false);
  assertEquals(changed.sessionId, first.sessionId, 'the same session continues');
  const [user] = (await w.db.query<{ status: string; activated: boolean }>(
    `select status, activated_at is not null as activated from finly.app_user where id = $1`,
    [created.userId],
  )).rows;
  assertEquals(user, { status: 'active', activated: true });
  assertEquals((await refusal(() => ids.signIn(username, TEMP, PHONE))).code, 'UNAUTHENTICATED');
  assertEquals((await ids.signIn(username, NEW, PHONE)).mustChangePassword, false);
});

Deno.test('a wrong password and an unknown username get the same answer; repeated failures lock the account', async () => {
  const { ids, username } = await setup();
  const unknown = await refusal(() => ids.signIn('nobody_here', TEMP, PHONE));
  const wrong = await refusal(() => ids.signIn(username, 'not the password', PHONE));
  assertEquals([unknown.code, unknown.message], [wrong.code, wrong.message]);
  for (let i = 0; i < 4; i++) await refusal(() => ids.signIn(username, 'not the password', PHONE));
  // The fifth failure above locked it: even the right password waits now.
  assertEquals((await refusal(() => ids.signIn(username, TEMP, PHONE))).code, 'LOCKED');
});

Deno.test('refresh tokens rotate; reusing an old one revokes the whole session', async () => {
  const { ids, username } = await setup();
  const s = await ids.signIn(username, TEMP, PHONE);
  const next = await ids.refresh(s.refreshToken);
  assertNotEquals(next.refreshToken, s.refreshToken);
  assertEquals(next.sessionId, s.sessionId);
  await ids.authenticate(next.accessToken);
  // The first token is presented again — as a thief would: the session ends for everyone holding it.
  assertEquals((await refusal(() => ids.refresh(s.refreshToken))).code, 'UNAUTHENTICATED');
  assertEquals((await refusal(() => ids.authenticate(next.accessToken))).code, 'UNAUTHENTICATED');
  assertEquals((await refusal(() => ids.refresh(next.refreshToken))).code, 'UNAUTHENTICATED');
});

Deno.test('signing out ends the session at once, for the access and the refresh token', async () => {
  const { ids, username } = await setup();
  const s = await ids.signIn(username, TEMP, PHONE);
  const actor = await ids.authenticate(s.accessToken);
  await ids.signOut(actor);
  assertEquals((await refusal(() => ids.authenticate(s.accessToken))).code, 'UNAUTHENTICATED');
  assertEquals((await refusal(() => ids.refresh(s.refreshToken))).code, 'UNAUTHENTICATED');
});

Deno.test('changing the password signs out every other phone; this one keeps working', async () => {
  const { ids, username } = await setup();
  const phoneA = await ids.signIn(username, TEMP, PHONE);
  const phoneB = await ids.signIn(username, TEMP, { ...PHONE, model: 'Second phone' });
  const changed = await ids.changePassword(await ids.authenticate(phoneA.accessToken), TEMP, NEW);
  await ids.authenticate(changed.accessToken);
  assertEquals((await refusal(() => ids.authenticate(phoneB.accessToken))).code, 'UNAUTHENTICATED');
  // Phone A's refresh token from before the change no longer works, but the session is not ended by trying it.
  assertEquals((await refusal(() => ids.refresh(phoneA.refreshToken))).code, 'UNAUTHENTICATED');
  await ids.authenticate(changed.accessToken);
  await ids.refresh(changed.refreshToken);
});

Deno.test('one phone can sign out another of the same person; nobody else’s', async () => {
  const { ids, username } = await setup();
  const a = await ids.signIn(username, TEMP, PHONE);
  const b = await ids.signIn(username, TEMP, { ...PHONE, model: 'Lost phone' });
  const actor = await ids.authenticate(a.accessToken);
  const list = await ids.sessions(actor);
  assertEquals(list.length, 2);
  assertEquals(list.filter((x) => x.current).map((x) => x.id), [a.sessionId]);
  await ids.revokeSession(actor, b.sessionId);
  assertEquals((await refusal(() => ids.authenticate(b.accessToken))).code, 'UNAUTHENTICATED');
  const other = await setup();
  const theirs = await other.ids.signIn(other.username, TEMP, PHONE);
  assertEquals((await refusal(() => ids.revokeSession(actor, theirs.sessionId))).code, 'NOT_FOUND');
});

Deno.test('forged, altered and expired tokens are refused', async () => {
  const { ids, username, signer } = await setup();
  const s = await ids.signIn(username, TEMP, PHONE);
  const [h, p, sig] = s.accessToken.split('.');
  const body = JSON.parse(atob(p.replaceAll('-', '+').replaceAll('_', '/')));
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  const forged = [
    `${h}.${enc({ ...body, sub: crypto.randomUUID() })}.${sig}`, // someone else's id, old signature
    `${enc({ alg: 'none', typ: 'JWT', kid: '1' })}.${p}.`, // no signature
    `${h}.${p}.${sig.slice(0, -2)}AA`, // altered signature
    'not-a-token',
  ];
  for (const t of forged) assertEquals((await refusal(() => ids.authenticate(t))).code, 'UNAUTHENTICATED', t);
  const expired = await signer.sign({ ...body, iat: 1, exp: 2 });
  assertEquals((await refusal(() => ids.authenticate(expired))).code, 'UNAUTHENTICATED');
});

Deno.test('a suspended account or a revoked phone cannot sign in, even with the right password', async () => {
  const { w, ids, username, created } = await setup();
  const s = await ids.signIn(username, TEMP, PHONE);
  await w.db.query(
    `update finly.device set status = 'revoked', revoked_at = now(), revoke_reason = 'lost' where id = $1`,
    [s.deviceId],
  );
  assertEquals((await refusal(() => ids.signIn(username, TEMP, { ...PHONE, deviceId: s.deviceId }))).code, 'FORBIDDEN');
  await w.db.query(`update finly.app_user set status = 'disabled' where id = $1`, [created.userId]);
  assertEquals((await refusal(() => ids.signIn(username, TEMP, PHONE))).code, 'FORBIDDEN');
  assertEquals((await refusal(() => ids.authenticate(s.accessToken))).code, 'UNAUTHENTICATED');
});

Deno.test('weak new passwords are refused with a reason', async () => {
  const { ids, username } = await setup();
  const actor = await ids.authenticate((await ids.signIn(username, TEMP, PHONE)).accessToken);
  for (const weak of ['short1', '1234567890', `${username}-2026!`, 'abababababab', TEMP]) {
    const e = await refusal(() => ids.changePassword(actor, TEMP, weak));
    assertEquals([e.code, e.details.field], ['VALIDATION', 'newPassword'], weak);
  }
  assertEquals((await refusal(() => ids.changePassword(actor, 'wrong current', NEW))).details.field, 'currentPassword');
});

Deno.test('no password, hash input or refresh token is stored readably; failed attempts are logged without them', async () => {
  const { w, ids, username } = await setup();
  const s = await ids.signIn(username, TEMP, PHONE);
  await refusal(() => ids.signIn('ghost_user', 'Some-Password-123', PHONE));
  const dump = JSON.stringify(
    (await w.db.query(
      `select (select json_agg(c) from finly.user_credential c) as creds,
              (select json_agg(t) from finly.refresh_token t) as tokens,
              (select json_agg(e) from finly.security_event e) as events`,
    )).rows,
  );
  for (const secret of [TEMP, 'Some-Password-123', s.refreshToken, 'ghost_user']) {
    assertEquals(dump.includes(secret), false, `"${secret.slice(0, 4)}…" found in stored rows`);
  }
  const events = (await w.db.query<{ event_type: string; outcome: string; has_hash: boolean }>(
    `select event_type, outcome, username_hash is not null as has_hash from finly.security_event
     where event_type = 'login_failed' and user_id is null`,
  )).rows;
  assert(events.some((e) => e.has_hash), 'an unknown username is logged as a keyed hash only');
});
