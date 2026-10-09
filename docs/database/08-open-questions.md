# 8. Open questions and decisions

Add-on 11 §30 item 16. Where the sources did not decide something, it was listed here with a recommendation and what
the implementation does meanwhile (A6.3: the safest architecture that preserves integrity, security and privacy).
Nothing here changes an approved accounting rule.

## Decided by the owner

| # | Decision | Source | Where implemented |
|---|---|---|---|
| Q1 | **Entries that land in someone else's personal books need that person's acknowledgement by default** (Option B). The receiving person — and only they — may switch their own personal books to immediate posting with notification (Option A). The giver can never override it. Pending entries are visibly distinct from posted ones; on acknowledgement every financial effect of the event posts atomically; rejection, correction or cancellation keeps the original event and its history | [Gate response 03](../source/GATE-RESPONSE-03-decisions-q1-q3-postgres.md) | `personal_book_setting`, `txn_acknowledgement`, status `pending_acknowledgement` (migration 0010); posting service; [ACCOUNTING-ENGINE.md §5.10](../ACCOUNTING-ENGINE.md) |
| Q11 / Q13(b) | **Accounts are created or invited by the Super Admin and activated by the person themself.** Existing books are linked, never duplicated. A one-time activation credential expires (24 h) and dies on use; the person sets their own password and M-PIN on their own phone. **No impersonation:** no path lets an administrator sign in as someone else or act in their name; administrative setup is done with separate tools and recorded under the administrator's identity. Help is a separate, consented, time-limited support grant, fully audited. Nobody can retrieve another person's password, PIN or biometric data | Gate response 03 | `account_activation`, `support_access` (migration 0010); identity service; [SECURITY.md §7](../SECURITY.md) |
| Q4 + Q3 | **Encryption of amounts:** keep application-level encryption if it proves secure and performant (investigate, benchmark, prove key recovery); a different architecture is authorised only if investigation shows it is impractical, and then without pretending storage encryption is equivalent | Gate response 03 | Investigation and decision: [docs/security/encryption-architecture.md](../security/encryption-architecture.md) |
| Q14 | **Test against the real PostgreSQL 17.** The owner's machine runs PostgreSQL 17.11 (port 5435) and 18.6 (port 5432); every database test runs on 17.11, the production version, and also on 18.6 and in-process PGlite | Gate response 03 | `deno task test:pg17`, `test:pg18` |
| F8 / F9 | **Two independent transactions** — firm → owner and owner → anyone — each side classified Own or Expense (eight base scenarios); the repayment arrangement is a separate explicit choice; Option A (two linked debts) and Option B (the receiver owes the firm, the owner only carries the cash) are both supported; never infer a debt or merge the transactions | [Gate response 04](../source/GATE-RESPONSE-04-f8-f9-final.md) | `give` intent, migration 0013, [accounting/F8-F9-model.md](../accounting/F8-F9-model.md), D-037 |
| — | **Online only:** no local database, no offline mode, no offline transaction queue. Every change is saved to the central database; other users see it in real time or through reliable updates. Network failures are handled by retrying the same request with the same idempotency key | [Add-on 12](../source/ADDON-12-complete-the-app-online-only.md) | D-031; `sync_review` and `txn.client_ref` removed (migration 0010); [06 §6.6](06-transactions-concurrency-sync.md) |

## Waiting for the owner

| # | Question | Explained in | Applied meanwhile |
|---|---|---|---|
| F8/F9-1 | Scenarios 3 and 4: the owner's side of a firm Expense is recorded as personal income (e.g. remuneration) — confirm | [accounting/F8-F9-model.md §6](../accounting/F8-F9-model.md) | As described |
| F8/F9-2 | Giver Own without repayment is valid only as drawings or capital; otherwise it is the giver's expense (e.g. a gift) — confirm | same | As described |
| F8/F9-3 | Should a firm Expense for one owner's benefit need another owner's approval when the firm has several owners? | same | Not enforced (approval rules are configurable) |

## Recommendations applied (the owner may change any of them later through a normal migration)

| # | Question | Applied |
|---|---|---|
| Q2 | Reason text stays plaintext (searchable), protected by RLS and field rules; private remarks are encrypted `txn_note` rows | Applied |
| Q5 | Amount-band blind indexes for range filters (they reveal only that two amounts share a band) | Applied |
| Q6 | Server-side M-PIN verifier per device (Argon2id over a peppered PIN) for real attempt limits and remote reset | Applied |
| Q7 | One global journal hash chain | Applied |
| Q8 | Retention: books and audit 8 years after the financial year; security events 2 years; sessions 90 days after expiry; idempotency 30 days — to confirm with the firms' chartered accountant | Seeded; nothing deletes financial data |
| Q9 | Financial year April–March, stored per firm | Applied |
| Q10 | Reversing into an account deactivated since the original: refused until reactivated | Applied |
| Q12 | Partial reversal = a linked adjustment or refund event, never a partial mirror | Applied |
| Q13(a) | Full admin reaches firms only; pools such as a family fund by explicit grant | Applied in RLS |

Sentry: not needed. Error reports stay in our own tables (D-016).
