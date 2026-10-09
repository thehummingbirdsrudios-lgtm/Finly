/**
 * The wire format (docs/api/README.md): JSON with amounts as strings of whole rupees (never JSON numbers, which lose
 * precision above 2^53), errors as RFC 9457 problem details with a stable `code` and the request id, and no caching.
 */
import { FinlyError } from '../domain/errors.ts';
import { httpStatus } from '../app/status.ts';

/** JSON with every bigint written as a decimal string. */
export function toJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export function json(body: unknown, status = 200, requestId?: string): Response {
  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
  if (requestId) headers['x-request-id'] = requestId;
  return new Response(toJson(body), { status, headers });
}

export function noContent(requestId?: string): Response {
  const headers: Record<string, string> = { 'cache-control': 'no-store' };
  if (requestId) headers['x-request-id'] = requestId;
  return new Response(null, { status: 204, headers });
}

/** Safe details a client may act on (which field, which question); anything else stays in the server logs. */
const SAFE_DETAILS = new Set([
  'field',
  'question',
  'lockedUntil',
  'status',
  'retryable',
  'replayed',
  'purpose',
  'reason',
]);

export function problem(err: FinlyError, requestId: string): Response {
  const status = httpStatus(err.code);
  const details: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(err.details)) if (SAFE_DETAILS.has(k)) details[k] = v;
  const body = {
    type: `https://finly.app/problems/${err.code.toLowerCase().replaceAll('_', '-')}`,
    title: status >= 500 ? 'Something went wrong on our side.' : err.message,
    status,
    code: err.code,
    detail: status >= 500 ? 'Please try again. If it keeps happening, tell your administrator.' : err.message,
    requestId,
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };
  const res = json(body, status, requestId);
  res.headers.set('content-type', 'application/problem+json; charset=utf-8');
  if (status === 429 || status === 423) res.headers.set('retry-after', '60');
  return res;
}

/** Reads a JSON body of at most `max` bytes; anything else is a validation error, never a crash. */
export async function readJson(req: Request, max = 64 * 1024): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > max) throw new FinlyError('VALIDATION', 'The request is too large.');
  const type = req.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new FinlyError('VALIDATION', 'Send the request as JSON.');
  }
  const text = await req.text();
  if (text.length > max) throw new FinlyError('VALIDATION', 'The request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new FinlyError('VALIDATION', 'The request is not valid JSON.');
  }
}
