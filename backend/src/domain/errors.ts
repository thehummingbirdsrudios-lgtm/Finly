/**
 * Domain errors. `code` is stable and machine-readable; `message` is safe to show a user (plain language, never
 * internal details or hidden data, BUILD_PROMPT U6). `details` may carry safe structured context for the caller.
 */
export type ErrorCode =
  | 'VALIDATION'
  | 'AMOUNT_INVALID'
  | 'ALLOCATION_MISMATCH'
  | 'FUNDING_MISMATCH'
  | 'FUND_MISMATCH'
  | 'UNBALANCED_JOURNAL'
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_INACTIVE'
  | 'DIMENSION_MISSING'
  | 'ENTITY_NOT_FOUND'
  | 'ENTITY_INACTIVE'
  | 'LOCATION_NOT_FOUND'
  | 'LOCATION_INACTIVE'
  | 'SAME_SOURCE_DESTINATION'
  | 'CLASSIFICATION_REQUIRED'
  | 'CLASSIFICATION_CONFLICT'
  | 'NOT_AN_OWNER'
  | 'OWNER_REQUIRED'
  | 'OPEN_ITEM_NOT_FOUND'
  | 'SETTLEMENT_EXCEEDS_REMAINING'
  | 'SETTLEMENT_PARTY_MISMATCH'
  | 'INSUFFICIENT_BALANCE'
  | 'PERIOD_CLOSED'
  | 'ALREADY_REVERSED'
  | 'REVERSAL_BLOCKED_BY_SETTLEMENT'
  | 'DUPLICATE_REQUEST'
  | 'CONFLICT'
  | 'UNAUTHENTICATED'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'LOCKED'
  | 'INTEGRITY'
  | 'INTERNAL';

export class FinlyError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'FinlyError';
  }
}

export function fail(code: ErrorCode, message: string, details: Record<string, unknown> = {}): never {
  throw new FinlyError(code, message, details);
}
