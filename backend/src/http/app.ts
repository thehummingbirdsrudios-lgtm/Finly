/**
 * The Finly HTTP API, version 1 (docs/api/README.md). One handler for every client (Android now; iOS and web later):
 * validates input, establishes the caller from the access token and a live session, and calls the application
 * services — which, with the database's row-level security, make every authorisation decision. Nothing here trusts a
 * client-supplied id, role or ownership claim.
 */
import { z } from 'zod';
import type { Actor, ClientInfo, IdentityService, SessionTokens } from '../app/identity/service.ts';
import type { BooksService } from '../app/books/service.ts';
import type { ActivityService } from '../app/books/activity.ts';
import type { PostingService } from '../app/posting/service.ts';
import { toFinlyError } from '../app/db_errors.ts';
import { fail, FinlyError } from '../domain/errors.ts';
import { isUuid } from '../domain/ids.ts';
import { parseIntent } from './intents.ts';
import { json, noContent, problem, readJson } from './wire.ts';

export interface ApiDeps {
  identity: IdentityService;
  books: BooksService;
  activity: ActivityService;
  posting: PostingService;
  /** Liveness of the database, for the health check. */
  ping?: () => Promise<void>;
  /** Structured log sink (one JSON object per line). Never receives bodies, tokens or amounts. */
  log?: (entry: Record<string, unknown>) => void;
  /** Server version reported by the health check. */
  version?: string;
}

interface Ctx {
  req: Request;
  url: URL;
  params: Record<string, string>;
  requestId: string;
  client: ClientInfo;
  actor?: Actor;
}

type Handler = (c: Ctx) => Promise<Response>;

interface Route {
  method: string;
  pattern: string;
  parts: string[];
  auth: 'none' | 'any' | 'full';
  handler: Handler;
}

const uuid = z.string().refine(isUuid, 'Not a valid id.');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
const device = z.object({
  deviceId: uuid.optional(),
  platform: z.enum(['android', 'ios', 'web']),
  model: z.string().max(80).optional(),
  osVersion: z.string().max(40).optional(),
  appVersion: z.string().max(40).optional(),
  label: z.string().max(80).optional(),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    const issue = r.error.issues[0];
    fail('VALIDATION', issue?.message ?? 'The request is not valid.', { field: issue?.path.join('.') || undefined });
  }
  return r.data;
}

function tokensBody(t: SessionTokens) {
  return {
    accessToken: t.accessToken,
    expiresIn: t.expiresIn,
    refreshToken: t.refreshToken,
    userId: t.userId,
    sessionId: t.sessionId,
    deviceId: t.deviceId,
    mustChangePassword: t.mustChangePassword,
  };
}

/** The server-side cause of an unexpected error, for the log: code and first line of its message. */
function causeOf(err: FinlyError): string | undefined {
  const cause = (err as { cause?: unknown }).cause as { code?: unknown; message?: unknown } | undefined;
  if (!cause) return undefined;
  const code = typeof cause.code === 'string' ? cause.code : '';
  const message = typeof cause.message === 'string' ? cause.message.split(/\r?\n/)[0].slice(0, 300) : '';
  return `${code} ${message}`.trim();
}

function clientOf(req: Request, remote?: string): ClientInfo {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return { ip: forwarded || remote, userAgent: req.headers.get('user-agent') ?? undefined };
}

export function createApi(deps: ApiDeps): (req: Request, remoteAddr?: string) => Promise<Response> {
  const routes: Route[] = [];
  const add = (method: string, pattern: string, auth: Route['auth'], handler: Handler) =>
    routes.push({ method, pattern, parts: pattern.split('/').filter(Boolean), auth, handler });
  const log = deps.log ?? ((e) => console.log(JSON.stringify(e)));
  const me = (c: Ctx) => c.actor!;
  const id = (c: Ctx, name: string) => {
    const v = c.params[name];
    if (!isUuid(v)) fail('NOT_FOUND', 'That was not found.');
    return v;
  };

  // Health ------------------------------------------------------------------------------------------------------
  add('GET', '/v1/health', 'none', async (c) => {
    await deps.ping?.();
    return json({ status: 'ok', version: deps.version ?? 'dev' }, 200, c.requestId);
  });

  // Session -----------------------------------------------------------------------------------------------------
  add('POST', '/v1/auth/sign-in', 'none', async (c) => {
    const b = parse(
      z.object({ username: z.string().min(1).max(40), password: z.string().min(1).max(256), device }),
      await readJson(c.req),
    );
    return json(tokensBody(await deps.identity.signIn(b.username, b.password, b.device, c.client)), 200, c.requestId);
  });
  add('POST', '/v1/auth/refresh', 'none', async (c) => {
    const b = parse(z.object({ refreshToken: z.string().min(1).max(100) }), await readJson(c.req));
    return json(tokensBody(await deps.identity.refresh(b.refreshToken, c.client)), 200, c.requestId);
  });
  add('POST', '/v1/auth/sign-out', 'any', async (c) => {
    await deps.identity.signOut(me(c), c.client);
    return noContent(c.requestId);
  });
  add('POST', '/v1/auth/password', 'any', async (c) => {
    const b = parse(
      z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(1).max(256) }),
      await readJson(c.req),
    );
    const t = await deps.identity.changePassword(me(c), b.currentPassword, b.newPassword, c.client);
    return json(tokensBody(t), 200, c.requestId);
  });
  add('GET', '/v1/auth/sessions', 'full', async (c) => {
    return json({ items: await deps.identity.sessions(me(c)) }, 200, c.requestId);
  });
  add('DELETE', '/v1/auth/sessions/:id', 'full', async (c) => {
    await deps.identity.revokeSession(me(c), id(c, 'id'), c.client);
    return noContent(c.requestId);
  });
  add('GET', '/v1/me', 'any', (c) => {
    const a = me(c);
    return Promise.resolve(json(
      {
        userId: a.userId,
        personEntityId: a.personEntityId,
        displayName: a.displayName,
        deviceId: a.deviceId,
        mustChangePassword: a.mustChangePassword,
      },
      200,
      c.requestId,
    ));
  });

  // Books -------------------------------------------------------------------------------------------------------
  add('GET', '/v1/lookups', 'full', async (c) => json(await deps.books.lookups(me(c).userId), 200, c.requestId));
  add(
    'GET',
    '/v1/books',
    'full',
    async (c) => json({ items: await deps.books.myBooks(me(c).userId) }, 200, c.requestId),
  );
  add('POST', '/v1/books', 'full', async (c) => {
    const b = parse(
      z.object({
        name: z.string().min(1).max(120),
        typeKey: z.string().min(1).max(63),
        openingDate: date,
        creatorIsOwner: z.boolean(),
        sharePercent: z.number().gt(0).max(100).optional(),
      }),
      await readJson(c.req),
    );
    const shareBp = b.sharePercent === undefined ? undefined : Math.round(b.sharePercent * 100);
    const created = await deps.books.createFirm(me(c).userId, { ...b, shareBp });
    return json({ id: created }, 201, c.requestId);
  });
  add('GET', '/v1/books/:id/summary', 'full', async (c) => {
    return json(await deps.books.summary(me(c).userId, id(c, 'id')), 200, c.requestId);
  });
  add('GET', '/v1/books/:id/places', 'full', async (c) => {
    return json({ items: await deps.books.places(me(c).userId, id(c, 'id')) }, 200, c.requestId);
  });
  add('POST', '/v1/books/:id/places', 'full', async (c) => {
    const b = parse(
      z.object({
        name: z.string().min(1).max(80),
        kind: z.enum(['cash', 'bank', 'wallet']),
        typeKey: z.string().min(1).max(63),
        custodyPersonId: uuid.optional(),
        bank: z.object({
          bankName: z.string().max(80).optional(),
          branch: z.string().max(80).optional(),
          ifsc: z.string().max(11).optional(),
          accountHolder: z.string().max(120).optional(),
          accountNumber: z.string().max(40).optional(),
          accountType: z.enum(['savings', 'current', 'overdraft', 'cash_credit', 'wallet', 'upi', 'other']).optional(),
        }).optional(),
      }),
      await readJson(c.req),
    );
    return json({ id: await deps.books.addPlace(me(c).userId, id(c, 'id'), b) }, 201, c.requestId);
  });
  add('GET', '/v1/books/:id/parties', 'full', async (c) => {
    return json({ items: await deps.books.parties(me(c).userId, id(c, 'id')) }, 200, c.requestId);
  });
  add('POST', '/v1/books/:id/parties', 'full', async (c) => {
    const b = parse(
      z.object({ name: z.string().min(1).max(120), typeKey: z.string().min(1).max(63) }),
      await readJson(c.req),
    );
    return json({ id: await deps.books.addParty(me(c).userId, id(c, 'id'), b) }, 201, c.requestId);
  });
  add('GET', '/v1/books/:id/open-items', 'full', async (c) => {
    const all = c.url.searchParams.get('all') === '1';
    return json({ items: await deps.books.openItems(me(c).userId, id(c, 'id'), all) }, 200, c.requestId);
  });
  add('GET', '/v1/books/:id/entries', 'full', async (c) => {
    const limit = Number(c.url.searchParams.get('limit') ?? '30');
    const page = await deps.activity.entries(me(c).userId, id(c, 'id'), {
      cursor: c.url.searchParams.get('cursor') ?? undefined,
      limit: Number.isFinite(limit) ? limit : 30,
    });
    return json(page, 200, c.requestId);
  });

  // Entries -----------------------------------------------------------------------------------------------------
  add('GET', '/v1/entries/:id', 'full', async (c) => {
    return json(await deps.activity.entry(me(c).userId, id(c, 'id')), 200, c.requestId);
  });
  add('POST', '/v1/entries', 'full', async (c) => {
    const key = c.req.headers.get('idempotency-key') ?? '';
    if (!isUuid(key)) {
      fail('VALIDATION', 'Send a new Idempotency-Key (a UUID) with every entry.', { field: 'Idempotency-Key' });
    }
    const b = parse(
      z.object({
        typeKey: z.string().min(1).max(63),
        bookId: uuid,
        valueDate: date,
        reason: z.string().max(500).optional(),
        followsTxnId: uuid.optional(),
        intent: z.unknown(),
      }),
      await readJson(c.req),
    );
    const a = me(c);
    const r = await deps.posting.submit({
      actorUserId: a.userId,
      idempotencyKey: key,
      txnTypeKey: b.typeKey,
      intent: parseIntent(b.intent),
      valueDate: b.valueDate,
      primaryEnvId: b.bookId,
      reason: b.reason,
      deviceId: a.deviceId,
      followsTxnId: b.followsTxnId,
    });
    return json(r, r.replayed ? 200 : 201, c.requestId);
  });
  add('POST', '/v1/entries/:id/acknowledge', 'full', async (c) => {
    const b = parse(z.object({ note: z.string().max(500).optional() }), await readJson(c.req));
    return json(await deps.posting.acknowledge(me(c).userId, id(c, 'id'), b.note), 200, c.requestId);
  });
  add('POST', '/v1/entries/:id/reject', 'full', async (c) => {
    const b = parse(z.object({ note: z.string().max(500).optional() }), await readJson(c.req));
    return json(await deps.posting.reject(me(c).userId, id(c, 'id'), b.note), 200, c.requestId);
  });
  add('GET', '/v1/acknowledgements', 'full', async (c) => {
    return json({ items: await deps.activity.waitingForMe(me(c).userId) }, 200, c.requestId);
  });

  function match(method: string, path: string): { route?: Route; params: Record<string, string>; allowed: string[] } {
    const parts = path.split('/').filter(Boolean);
    const allowed: string[] = [];
    for (const r of routes) {
      if (r.parts.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        if (r.parts[i].startsWith(':')) params[r.parts[i].slice(1)] = decodeURIComponent(parts[i]);
        else if (r.parts[i] !== parts[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      if (r.method === method) return { route: r, params, allowed };
      allowed.push(r.method);
    }
    return { params: {}, allowed };
  }

  return async (req: Request, remoteAddr?: string): Promise<Response> => {
    const started = performance.now();
    const requestId = crypto.randomUUID();
    const url = new URL(req.url);
    // Deployments may mount the API under a prefix (Supabase: /functions/v1/api/v1/…); routes start at the last /v1/.
    const at = url.pathname.lastIndexOf('/v1/');
    const path = at >= 0 ? url.pathname.slice(at) : url.pathname;
    const { route, params, allowed } = match(req.method, path);
    let status = 500;
    let userId: string | undefined;
    let code: string | undefined;
    try {
      if (!route) {
        if (allowed.length > 0) {
          status = 405;
          return json({ code: 'METHOD_NOT_ALLOWED', requestId }, 405, requestId);
        }
        throw new FinlyError('NOT_FOUND', 'There is nothing here.');
      }
      const c: Ctx = { req, url, params, requestId, client: clientOf(req, remoteAddr) };
      if (route.auth !== 'none') {
        const header = req.headers.get('authorization') ?? '';
        const token = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header)?.[1];
        if (!token) throw new FinlyError('UNAUTHENTICATED', 'Please sign in.');
        c.actor = await deps.identity.authenticate(token);
        userId = c.actor.userId;
        if (route.auth === 'full' && c.actor.mustChangePassword) {
          throw new FinlyError('PASSWORD_CHANGE_REQUIRED', 'Set your own password to continue.');
        }
      }
      const res = await route.handler(c);
      status = res.status;
      return res;
    } catch (e) {
      const err = toFinlyError(e);
      code = err.code;
      const res = problem(err, requestId);
      status = res.status;
      if (status >= 500) {
        log({
          level: 'error',
          requestId,
          route: route?.pattern,
          error: String(e instanceof Error ? e.stack ?? e.message : e),
          // The underlying cause (a database error), kept out of responses; SQLSTATE and message only, truncated.
          cause: causeOf(err),
        });
      }
      return res;
    } finally {
      log({
        level: 'info',
        at: new Date().toISOString(),
        requestId,
        method: req.method,
        route: route?.pattern ?? 'unmatched',
        status,
        code,
        userId,
        ms: Math.round(performance.now() - started),
      });
    }
  };
}
