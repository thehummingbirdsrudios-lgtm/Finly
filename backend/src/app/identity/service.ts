/**
 * The identity service (SECURITY.md "Spoofing", ADDON-19 §6): sign-in with throttling and lockout, short-lived access
 * tokens with rotating refresh tokens (reuse revokes the session), sign-out, the temporary → permanent password step,
 * and the sessions list. Runs only as `finly_auth`, the one role that can read credentials; nothing here ever returns
 * or logs a password, a hash or a refresh token after it is issued.
 */
import { dummyHash, hashPassword, needsRehash, verifyPassword } from '../../crypto/password.ts';
import type { BlindIndex } from '../../crypto/blind.ts';
import type { AccessClaims, TokenSigner } from '../../crypto/token.ts';
import type { Sql } from '../../db/sql.ts';
import { fail } from '../../domain/errors.ts';
import type { Id } from '../../domain/ids.ts';
import { checkNewPassword } from './password_policy.ts';

export const ACCESS_TTL_SECONDS = 10 * 60;
const IDLE_DAYS = 14;
const ABSOLUTE_DAYS = 30;
/** Consecutive failures before the account locks; each further failure doubles the lock (capped at a day). */
const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

export interface DeviceInfo {
  /** The id this phone received at its first sign-in, if it has one. */
  deviceId?: Id;
  platform: 'android' | 'ios' | 'web';
  model?: string;
  osVersion?: string;
  appVersion?: string;
  label?: string;
}

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export interface SessionTokens {
  accessToken: string;
  /** Seconds the access token stays valid. */
  expiresIn: number;
  refreshToken: string;
  userId: Id;
  sessionId: Id;
  deviceId: Id;
  /** The account still has a temporary password: only the password change is allowed until it is replaced. */
  mustChangePassword: boolean;
}

/** Who is calling, established from a valid access token and a live session. */
export interface Actor {
  userId: Id;
  sessionId: Id;
  deviceId: Id;
  personEntityId: Id;
  displayName: string;
  mustChangePassword: boolean;
}

export interface SessionInfo {
  id: Id;
  deviceId: Id;
  deviceLabel: string | null;
  platform: string;
  model: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export interface NewUser {
  username: string;
  displayName: string;
  /** A temporary password the person must replace at first sign-in (bootstrap and administrator-created accounts). */
  temporaryPassword: string;
  /** Role keys to grant (platform or template roles). */
  roleKeys: string[];
  createdBy?: Id;
  /** How long the temporary password stays usable. */
  temporaryDays?: number;
}

const USERNAME = /^[A-Za-z0-9._-]{3,40}$/;
const WRONG = 'The username or password is not correct.';

function ipOrNull(ip?: string): string | null {
  if (!ip) return null;
  const v4 = /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split('.').every((p) => Number(p) <= 255);
  const v6 = /^[0-9a-fA-F:]{2,39}$/.test(ip) && ip.includes(':');
  return v4 || v6 ? ip : null;
}

function short(text: string | undefined, max: number): string | null {
  if (!text) return null;
  return text.slice(0, max);
}

type Tx = Sql;

export class IdentityService {
  constructor(
    private readonly db: Sql,
    private readonly signer: TokenSigner,
    private readonly blind: BlindIndex,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** One transaction as the identity role. */
  private asAuth<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.exec('set local role finly_auth');
      return await fn(tx);
    });
  }

  private async event(
    tx: Tx,
    e: {
      type: string;
      outcome: 'success' | 'failure' | 'blocked';
      userId?: Id | null;
      usernameHash?: Uint8Array | null;
      deviceId?: Id | null;
      sessionId?: Id | null;
      reason?: string;
      client?: ClientInfo;
    },
  ): Promise<void> {
    await tx.query(
      `insert into finly.security_event (user_id, username_hash, device_id, session_id, event_type, outcome,
         reason_code, ip, user_agent)
       values ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9)`,
      [
        e.userId ?? null,
        e.usernameHash ?? null,
        e.deviceId ?? null,
        e.sessionId ?? null,
        e.type,
        e.outcome,
        e.reason ?? null,
        ipOrNull(e.client?.ip),
        short(e.client?.userAgent, 300),
      ],
    );
  }

  /** Signs a person in with a username and password. The answer to a wrong username and a wrong password is identical. */
  async signIn(
    username: string,
    password: string,
    device: DeviceInfo,
    client: ClientInfo = {},
  ): Promise<SessionTokens> {
    if (!USERNAME.test(username) || password.length < 1 || password.length > 256) fail('UNAUTHENTICATED', WRONG);
    const found = await this.asAuth((tx) =>
      tx.query<{
        id: string;
        status: string;
        must_change_password: boolean;
        password_hash: string | null;
        is_temporary: boolean | null;
        temporary_expired: boolean | null;
        locked: boolean | null;
        locked_until: string | null;
      }>(
        `select u.id, u.status, u.must_change_password, c.password_hash, c.is_temporary,
                (c.is_temporary and c.temporary_expires_at < now()) as temporary_expired,
                (c.locked_until is not null and c.locked_until > now()) as locked, c.locked_until::text
         from finly.app_user u left join finly.user_credential c on c.user_id = u.id
         where u.username_key = lower($1)`,
        [username],
      )
    );
    const u = found[0];
    if (!u || !u.password_hash) {
      await verifyPassword(password, await dummyHash());
      const usernameHash = await this.blind.username(username);
      await this.asAuth((tx) => this.event(tx, { type: 'login_failed', outcome: 'failure', usernameHash, client }));
      fail('UNAUTHENTICATED', WRONG);
    }
    if (u.locked) {
      await this.asAuth((tx) =>
        this.event(tx, { type: 'lockout', outcome: 'blocked', userId: u.id, reason: 'locked', client })
      );
      fail('LOCKED', 'Too many wrong attempts. Try again later.', { lockedUntil: u.locked_until });
    }
    const ok = await verifyPassword(password, u.password_hash);
    if (!ok) {
      await this.asAuth(async (tx) => {
        await tx.query(
          `update finly.user_credential
           set failed_count = failed_count + 1,
               locked_until = case when failed_count + 1 >= $2
                 then now() + make_interval(mins => least($3 * power(2, failed_count + 1 - $2)::int, 1440)) end
           where user_id = $1`,
          [u.id, LOCK_AFTER, LOCK_MINUTES],
        );
        await this.event(tx, { type: 'login_failed', outcome: 'failure', userId: u.id, reason: 'password', client });
      });
      fail('UNAUTHENTICATED', WRONG);
    }
    if (!['active', 'invited'].includes(u.status)) {
      await this.asAuth((tx) =>
        this.event(tx, { type: 'login_failed', outcome: 'blocked', userId: u.id, reason: u.status, client })
      );
      fail('FORBIDDEN', 'This account is not active. Ask your administrator.');
    }
    if (u.temporary_expired) {
      await this.asAuth((tx) =>
        this.event(tx, { type: 'login_failed', outcome: 'blocked', userId: u.id, reason: 'temporary_expired', client })
      );
      fail('UNAUTHENTICATED', 'Your temporary password has expired. Ask your administrator for a new one.');
    }
    const rehash = needsRehash(u.password_hash) ? await hashPassword(password) : null;
    const mustChange = u.must_change_password || u.is_temporary === true;
    return await this.asAuth(async (tx) => {
      await tx.query(
        `update finly.user_credential
         set failed_count = 0, locked_until = null, last_success_at = now(),
             password_hash = coalesce($2, password_hash)
         where user_id = $1`,
        [u.id, rehash],
      );
      const deviceId = await this.device(tx, u.id, device, client);
      const [s] = await tx.query<{ id: string }>(
        `insert into finly.auth_session (user_id, device_id, auth_methods, auth_strength, remember, idle_expires_at,
           absolute_expires_at, ip, user_agent)
         values ($1, $2, array['password'], 1, true, now() + make_interval(days => $3),
                 now() + make_interval(days => $4), $5::inet, $6)
         returning id`,
        [u.id, deviceId, IDLE_DAYS, ABSOLUTE_DAYS, ipOrNull(client.ip), short(client.userAgent, 300)],
      );
      const refreshToken = await this.newRefresh(tx, s.id);
      await this.event(tx, {
        type: 'login_succeeded',
        outcome: 'success',
        userId: u.id,
        deviceId,
        sessionId: s.id,
        client,
      });
      return await this.tokens(u.id, s.id, deviceId, refreshToken, mustChange);
    });
  }

  /** Registers the phone at its first sign-in, or recognises it again. A revoked or lost phone stays out. */
  private async device(tx: Tx, userId: Id, device: DeviceInfo, client: ClientInfo): Promise<Id> {
    if (device.deviceId) {
      const known = await tx.query<{ id: string; status: string }>(
        `select id, status from finly.device where id = $1 and user_id = $2`,
        [device.deviceId, userId],
      );
      if (known[0]) {
        if (known[0].status === 'revoked' || known[0].status === 'lost') {
          fail('FORBIDDEN', 'This phone was signed out of your account. Ask your administrator.');
        }
        await tx.query(
          `update finly.device set last_seen_at = now(), app_version = coalesce($2, app_version),
             os_version = coalesce($3, os_version)
           where id = $1`,
          [known[0].id, short(device.appVersion, 40), short(device.osVersion, 40)],
        );
        return known[0].id;
      }
    }
    const [d] = await tx.query<{ id: string }>(
      `insert into finly.device (user_id, label, platform, model, os_version, app_version, status, trusted_at,
         last_seen_at)
       values ($1, $2, $3, $4, $5, $6, 'trusted', now(), now()) returning id`,
      [
        userId,
        short(device.label, 80),
        device.platform,
        short(device.model, 80),
        short(device.osVersion, 40),
        short(device.appVersion, 40),
      ],
    );
    await this.event(tx, { type: 'new_device', outcome: 'success', userId, deviceId: d.id, client });
    return d.id;
  }

  private async newRefresh(tx: Tx, sessionId: Id): Promise<string> {
    const token = this.signer.newRefreshToken();
    await tx.query(
      `insert into finly.refresh_token (session_id, token_hash, expires_at)
       select $1, $2, absolute_expires_at from finly.auth_session where id = $1`,
      [sessionId, await this.signer.refreshHash(token)],
    );
    return token;
  }

  private async tokens(
    userId: Id,
    sessionId: Id,
    deviceId: Id,
    refreshToken: string,
    mustChange: boolean,
  ): Promise<SessionTokens> {
    const iat = Math.floor(this.now().getTime() / 1000);
    const claims: AccessClaims = { sub: userId, sid: sessionId, did: deviceId, iat, exp: iat + ACCESS_TTL_SECONDS };
    if (mustChange) claims.pwd = true;
    return {
      accessToken: await this.signer.sign(claims),
      expiresIn: ACCESS_TTL_SECONDS,
      refreshToken,
      userId,
      sessionId,
      deviceId,
      mustChangePassword: mustChange,
    };
  }

  /**
   * Exchanges a refresh token for a new pair. Each refresh token works once: presenting a used one means it was copied,
   * so the whole session is revoked.
   */
  async refresh(refreshToken: string, client: ClientInfo = {}): Promise<SessionTokens> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(refreshToken)) fail('UNAUTHENTICATED', 'Please sign in again.');
    const hash = await this.signer.refreshHash(refreshToken);
    const outcome = await this.asAuth(async (tx) => {
      const [r] = await tx.query<{
        id: string;
        session_id: string;
        used: boolean;
        token_expired: boolean;
        user_id: string;
        device_id: string;
        revoked: boolean;
        session_expired: boolean;
        status: string;
        must_change: boolean;
      }>(
        `select rt.id, rt.session_id, rt.used_at is not null as used, rt.expires_at <= now() as token_expired,
                s.user_id, s.device_id, s.revoked_at is not null as revoked,
                (s.idle_expires_at <= now() or s.absolute_expires_at <= now()) as session_expired,
                u.status, (u.must_change_password or coalesce(c.is_temporary, false)) as must_change
         from finly.refresh_token rt
         join finly.auth_session s on s.id = rt.session_id
         join finly.app_user u on u.id = s.user_id
         left join finly.user_credential c on c.user_id = u.id
         where rt.token_hash = $1
         for update of rt, s`,
        [hash],
      );
      if (!r) return { error: 'unknown' as const };
      if (r.used) {
        if (!r.revoked) {
          await tx.query(
            `update finly.auth_session set revoked_at = now(), revoke_reason = 'token_reuse' where id = $1`,
            [r.session_id],
          );
        }
        await this.event(tx, {
          type: 'token_reuse',
          outcome: 'blocked',
          userId: r.user_id,
          deviceId: r.device_id,
          sessionId: r.session_id,
          client,
        });
        return { error: 'reuse' as const };
      }
      // A token that simply expired (or was retired by a password change) is refused without ending the session.
      if (r.token_expired && !r.revoked && !r.session_expired) return { error: 'expired' as const };
      if (r.revoked || r.session_expired || r.token_expired || !['active', 'invited'].includes(r.status)) {
        if (!r.revoked) {
          await tx.query(
            `update finly.auth_session set revoked_at = now(), revoke_reason = 'expired' where id = $1`,
            [r.session_id],
          );
        }
        return { error: 'expired' as const };
      }
      const next = this.signer.newRefreshToken();
      const [n] = await tx.query<{ id: string }>(
        `insert into finly.refresh_token (session_id, token_hash, expires_at)
         select $1, $2, absolute_expires_at from finly.auth_session where id = $1 returning id`,
        [r.session_id, await this.signer.refreshHash(next)],
      );
      await tx.query(`update finly.refresh_token set used_at = now(), replaced_by_id = $2 where id = $1`, [r.id, n.id]);
      await tx.query(
        `update finly.auth_session
         set last_used_at = now(), idle_expires_at = least(now() + make_interval(days => $2), absolute_expires_at)
         where id = $1`,
        [r.session_id, IDLE_DAYS],
      );
      return { ok: { userId: r.user_id, sessionId: r.session_id, deviceId: r.device_id, next, must: r.must_change } };
    });
    if ('error' in outcome) fail('UNAUTHENTICATED', 'Please sign in again.', { reason: outcome.error });
    const o = outcome.ok;
    return await this.tokens(o.userId, o.sessionId, o.deviceId, o.next, o.must);
  }

  /**
   * The caller behind an access token. The token alone is not enough: its session must still be live and the account
   * active, so signing out or revoking a phone takes effect on the next request.
   */
  async authenticate(accessToken: string): Promise<Actor> {
    const claims = await this.signer.verify(accessToken, Math.floor(this.now().getTime() / 1000));
    if (!claims) fail('UNAUTHENTICATED', 'Please sign in again.');
    const rows = await this.asAuth((tx) =>
      tx.query<{ person_entity_id: string; display_name: string; must_change: boolean }>(
        `select u.person_entity_id, u.display_name,
                (u.must_change_password or coalesce(c.is_temporary, false)) as must_change
         from finly.auth_session s
         join finly.app_user u on u.id = s.user_id
         left join finly.user_credential c on c.user_id = u.id
         where s.id = $1 and s.user_id = $2 and s.device_id = $3 and s.revoked_at is null
           and s.idle_expires_at > now() and s.absolute_expires_at > now()
           and u.status in ('active', 'invited')`,
        [claims.sid, claims.sub, claims.did],
      )
    );
    if (!rows[0]) fail('UNAUTHENTICATED', 'Please sign in again.');
    return {
      userId: claims.sub,
      sessionId: claims.sid,
      deviceId: claims.did,
      personEntityId: rows[0].person_entity_id,
      displayName: rows[0].display_name,
      mustChangePassword: rows[0].must_change,
    };
  }

  /** Ends this session. */
  async signOut(actor: Actor, client: ClientInfo = {}): Promise<void> {
    await this.asAuth(async (tx) => {
      await tx.query(
        `update finly.auth_session set revoked_at = now(), revoke_reason = 'logout'
         where id = $1 and user_id = $2 and revoked_at is null`,
        [actor.sessionId, actor.userId],
      );
      await this.event(tx, {
        type: 'logout',
        outcome: 'success',
        userId: actor.userId,
        deviceId: actor.deviceId,
        sessionId: actor.sessionId,
        client,
      });
    });
  }

  /**
   * Replaces the password (the temporary one at first sign-in, or the current one later). Every other session is signed
   * out; this one continues with fresh tokens.
   */
  async changePassword(
    actor: Actor,
    currentPassword: string,
    newPassword: string,
    client: ClientInfo = {},
  ): Promise<SessionTokens> {
    const [cred] = await this.asAuth((tx) =>
      tx.query<{ password_hash: string; username: string }>(
        `select c.password_hash, u.username from finly.user_credential c join finly.app_user u on u.id = c.user_id
         where c.user_id = $1`,
        [actor.userId],
      )
    );
    if (!cred || !(await verifyPassword(currentPassword, cred.password_hash))) {
      await this.asAuth((tx) =>
        this.event(tx, {
          type: 'password_changed',
          outcome: 'failure',
          userId: actor.userId,
          sessionId: actor.sessionId,
          reason: 'current_password',
          client,
        })
      );
      fail('VALIDATION', 'Your current password is not correct.', { field: 'currentPassword' });
    }
    checkNewPassword(newPassword, cred.username, currentPassword);
    const hash = await hashPassword(newPassword);
    return await this.asAuth(async (tx) => {
      await tx.query(
        `update finly.user_credential
         set password_hash = $2, is_temporary = false, temporary_expires_at = null, set_at = now(), failed_count = 0,
             locked_until = null, version = version + 1
         where user_id = $1`,
        [actor.userId, hash],
      );
      await tx.query(
        `update finly.app_user
         set must_change_password = false,
             status = case when status = 'invited' then 'active' else status end,
             activated_at = coalesce(activated_at, now())
         where id = $1`,
        [actor.userId],
      );
      await tx.query(
        `update finly.auth_session set revoked_at = now(), revoke_reason = 'password_changed'
         where user_id = $1 and id <> $2 and revoked_at is null`,
        [actor.userId, actor.sessionId],
      );
      // The current session continues with a fresh refresh token; older ones stop working.
      await tx.query(
        `update finly.refresh_token set expires_at = now() where session_id = $1 and used_at is null`,
        [actor.sessionId],
      );
      const refreshToken = await this.newRefresh(tx, actor.sessionId);
      await this.event(tx, {
        type: 'password_changed',
        outcome: 'success',
        userId: actor.userId,
        deviceId: actor.deviceId,
        sessionId: actor.sessionId,
        client,
      });
      return await this.tokens(actor.userId, actor.sessionId, actor.deviceId, refreshToken, false);
    });
  }

  /** The caller's live sessions (phones signed in). */
  async sessions(actor: Actor): Promise<SessionInfo[]> {
    const rows = await this.asAuth((tx) =>
      tx.query<{
        id: string;
        device_id: string;
        label: string | null;
        platform: string;
        model: string | null;
        created_at: string;
        last_used_at: string;
      }>(
        `select s.id, s.device_id, d.label, d.platform, d.model, s.created_at::text, s.last_used_at::text
         from finly.auth_session s join finly.device d on d.id = s.device_id
         where s.user_id = $1 and s.revoked_at is null and s.idle_expires_at > now() and s.absolute_expires_at > now()
         order by s.last_used_at desc limit 50`,
        [actor.userId],
      )
    );
    return rows.map((r) => ({
      id: r.id,
      deviceId: r.device_id,
      deviceLabel: r.label,
      platform: r.platform,
      model: r.model,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
      current: r.id === actor.sessionId,
    }));
  }

  /** Signs out one of the caller's own sessions (for example a lost phone). */
  async revokeSession(actor: Actor, sessionId: Id, client: ClientInfo = {}): Promise<void> {
    await this.asAuth(async (tx) => {
      const done = await tx.query(
        `update finly.auth_session set revoked_at = now(), revoke_reason = 'logout_all'
         where id = $1 and user_id = $2 and revoked_at is null returning id`,
        [sessionId, actor.userId],
      );
      if (done.length === 0) fail('NOT_FOUND', 'That session was not found.');
      await this.event(tx, {
        type: 'session_revoked',
        outcome: 'success',
        userId: actor.userId,
        sessionId,
        client,
      });
    });
  }

  /**
   * Creates an account with its own person entity, personal books, self access and roles, and a temporary password
   * the person must replace at first sign-in. Used by the one-time bootstrap and by administrators.
   */
  async createUser(u: NewUser): Promise<{ userId: Id; personEntityId: Id }> {
    if (!USERNAME.test(u.username)) fail('VALIDATION', 'Use 3–40 letters, digits, dots, dashes or underscores.');
    const name = u.displayName.trim();
    if (name.length < 1 || name.length > 120) fail('VALIDATION', 'Enter a name of up to 120 characters.');
    checkNewPassword(u.temporaryPassword, u.username);
    const hash = await hashPassword(u.temporaryPassword);
    return await this.asAuth(async (tx) => {
      const taken = await tx.query(`select 1 from finly.app_user where username_key = lower($1)`, [u.username]);
      if (taken.length > 0) fail('CONFLICT', 'That username is already in use.', { field: 'username' });
      const [person] = await tx.query<{ id: string }>(
        `insert into finly.entity (kind, entity_type_id, display_name, created_by)
         values ('person', (select id from finly.entity_type where key = 'individual'), $1, $2) returning id`,
        [name, u.createdBy ?? null],
      );
      const [user] = await tx.query<{ id: string }>(
        `insert into finly.app_user (person_entity_id, username, display_name, status, must_change_password, created_by)
         values ($1, $2, $3, 'invited', true, $4) returning id`,
        [person.id, u.username, name, u.createdBy ?? null],
      );
      await tx.query(
        `insert into finly.user_credential (user_id, password_hash, is_temporary, temporary_expires_at)
         values ($1, $2, true, now() + make_interval(days => $3))`,
        [user.id, hash, u.temporaryDays ?? 7],
      );
      await tx.query(
        `insert into finly.env_access (user_id, env_entity_id, level, source) values ($1, $2, 'manage', 'self')`,
        [user.id, person.id],
      );
      for (const key of u.roleKeys) {
        const granted = await tx.query(
          `insert into finly.user_role (user_id, role_id, granted_by)
           select $1, id, $3 from finly.role where key = $2 returning id`,
          [user.id, key, u.createdBy ?? null],
        );
        if (granted.length === 0) fail('VALIDATION', `There is no role "${key}".`);
      }
      await tx.query(`select finly.provision_books($1, current_date)`, [person.id]);
      return { userId: user.id, personEntityId: person.id };
    });
  }
}
