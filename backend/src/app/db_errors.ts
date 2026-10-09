/**
 * Database refusals as domain errors with safe messages. Finly's guards raise SQLSTATE class F1 (migration 0001);
 * PostgreSQL's own codes cover uniqueness, privileges, locks and serialisation. Raw database text never reaches a
 * user: only the guard messages, which are written for users, are passed through.
 */
import { type ErrorCode, FinlyError } from '../domain/errors.ts';

const GUARD: Record<string, ErrorCode> = {
  F1001: 'CONFLICT', // immutable history
  F1002: 'PERIOD_CLOSED',
  F1003: 'LOCKED', // emergency write freeze
  F1004: 'VALIDATION', // inactive or archived master
  F1005: 'INTEGRITY', // journal structure — a bug if it ever reaches here
  F1006: 'VALIDATION', // required dimension missing
  F1007: 'CONFLICT', // status transition refused
  F1008: 'FORBIDDEN', // personal-finance rule
  F1009: 'INTEGRITY', // audit row missing — a bug
  F1010: 'CONFLICT', // submitted transaction frozen
  F1011: 'FORBIDDEN', // segregation of duties
  F1012: 'VALIDATION', // wrong kind of entity
};

/** SQLSTATEs after which the same request may simply be sent again (nothing was committed). */
export const RETRYABLE = new Set(['40001', '40P01', '55P03', '57014']);

export function sqlStateOf(e: unknown): string | undefined {
  const code = (e as { code?: unknown })?.code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
}

/**
 * Converts a database error into a FinlyError; FinlyErrors pass through unchanged. The original error is kept as a
 * non-enumerable `cause` for server-side logs — it is never serialised to a client.
 */
export function toFinlyError(e: unknown): FinlyError {
  if (e instanceof FinlyError) return e;
  const err = translate(e);
  Object.defineProperty(err, 'cause', { value: e, enumerable: false });
  return err;
}

function translate(e: unknown): FinlyError {
  const state = sqlStateOf(e);
  const text = (e as Error)?.message ?? '';
  if (state && GUARD[state]) {
    const code = GUARD[state];
    const safe = code === 'INTEGRITY' ? 'Finly stopped this to protect your records. Nothing was saved.' : text;
    return new FinlyError(code, safe, { sqlstate: state });
  }
  switch (state) {
    case '23505':
      return new FinlyError('CONFLICT', 'This was already recorded.', { sqlstate: state });
    case '42501':
      return new FinlyError('FORBIDDEN', 'You do not have access to do this.', { sqlstate: state });
    case '40001':
    case '40P01':
      return new FinlyError('CONFLICT', 'Someone else changed the same records at the same moment. Please try again.', {
        sqlstate: state,
        retryable: true,
      });
    case '55P03':
    case '57014':
      return new FinlyError('LOCKED', 'These records are busy right now. Please try again in a moment.', {
        sqlstate: state,
        retryable: true,
      });
    default:
      return new FinlyError('INTERNAL', 'Something went wrong. Nothing was saved.', { sqlstate: state });
  }
}
