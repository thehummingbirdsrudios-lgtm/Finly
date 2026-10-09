/** The HTTP status each error code maps to; stored with refusals so a resend answers the same way. */
import type { ErrorCode } from '../domain/errors.ts';

export function httpStatus(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION':
    case 'AMOUNT_INVALID':
    case 'ALLOCATION_MISMATCH':
    case 'FUNDING_MISMATCH':
    case 'FUND_MISMATCH':
    case 'DIMENSION_MISSING':
    case 'SAME_SOURCE_DESTINATION':
    case 'CLASSIFICATION_REQUIRED':
    case 'CLASSIFICATION_CONFLICT':
    case 'NOT_AN_OWNER':
    case 'OWNER_REQUIRED':
    case 'SETTLEMENT_PARTY_MISMATCH':
      return 422;
    case 'UNAUTHENTICATED':
      return 401;
    case 'FORBIDDEN':
    case 'PASSWORD_CHANGE_REQUIRED':
      return 403;
    case 'NOT_FOUND':
    case 'ENTITY_NOT_FOUND':
    case 'LOCATION_NOT_FOUND':
    case 'ACCOUNT_NOT_FOUND':
    case 'OPEN_ITEM_NOT_FOUND':
      return 404;
    case 'RATE_LIMITED':
      return 429;
    case 'LOCKED':
      return 423;
    case 'INTERNAL':
    case 'INTEGRITY':
      return 500;
    default:
      return 409;
  }
}
