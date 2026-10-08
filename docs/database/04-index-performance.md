# 4. Index strategy and query performance

Add-on 11 items 11 (indexes), 12 (performance) and §30 items 8 and 15. Every index below exists because a real Finly
screen or job runs the query next to it. Nothing is indexed "just in case": each index costs storage and write time,
and the free plan has 500 MB.

## 4.1 Workload and budgets

| Fact | Estimate | Consequence |
|---|---|---|
| Users | ~10 (owner, admins, workers) | Small concurrency; contention only on the same money slices |
| Transactions | 20–100 per day → ≤ 40,000 per year | ≤ 150,000 journal lines per year |
| Masters | hundreds of rows | Everything fits in memory |
| Database growth | ≈ 60–120 MB per year incl. indexes and audit | Free 500 MB lasts years; alert at 60 % |

| Operation | Target (p95, server time) |
|---|---|
| Dashboard (all visible balances) | < 150 ms |
| Activity page (50 rows), statement page, search page | < 200 ms |
| Post a transaction (validate, lock, encrypt, commit) | < 600 ms |
| Monthly report from snapshots | < 500 ms; larger custom reports run as a background job that produces a document |

Encryption cost is bounded by design: AES-256-GCM in WebCrypto is microseconds per value, and every screen decrypts at
most one page of rows or a few hundred balance slices — never "all lines" (Edge Functions allow 2 s CPU per request).

## 4.2 Rules

1. **Server-side filtering, sorting, pagination always** (O). Keyset pagination on `(value_date, id)` or
   `(occurred_at, id)` — never `OFFSET` over growing tables. Page size default 50, maximum 100.
2. **Selective fields:** the API selects only the columns a DTO needs; hidden fields are absent, not masked (O).
3. **Balances come from snapshots**, not from summing lines: dashboard = `balance_current`, period reports =
   `balance_period`. Lines are read only for statements and drill-down, one page at a time.
4. **Permission first, then aggregate** (L12): row-level security and the policy engine narrow the rows *before* any
   sum, count, sort or search ranking is computed.
5. **No materialised views over financial data.** Amounts are encrypted and every result is permission-scoped, so a
   shared precomputed view would either be useless (ciphertext) or leak across scopes. The encrypted snapshots are
   the precomputation, kept exact in the posting transaction.
6. **No shared caches across permission scopes** (O). The phone keeps its own authorised results in its encrypted local
   database; master data uses ETags derived from the newest `change_xid`.
7. Foreign keys are indexed when a query or a parent-side check needs it. Parent rows are never deleted (archive
   policy), so cascades never need child indexes.

## 4.3 Query → index → benefit

| # | Query (screen / job) | Index | Benefit |
|---|---|---|---|
| Q1 | Activity: transactions of an environment, newest first (keyset) | `txn_entity (entity_id, value_date DESC, txn_id DESC)` | One index range scan per page; no sort; visibility and order from the same index |
| Q2 | Pending work: drafts, pending approvals, approved, failed in an environment | `txn (primary_env_id, status, value_date DESC) WHERE status IN ('draft','pending_approval','approved','failed')` | Small partial index; posted history (the bulk) is not in it |
| Q3 | Open a transaction by reference; prefix search `TX-20261008…` | `txn (reference)` unique, column collation `"C"` | Equality and `LIKE 'prefix%'` from one B-tree |
| Q4 | Search words in reason (`45000 Angadiya`) | `txn USING gin (search_tsv)` | Full-text search without extensions; Hindi and Gujarati words with the `simple` configuration |
| Q5 | Search an exact amount (`45000`), duplicate warning (same amount, same day) | `txn_leg (amount_bidx)` → `txn` by id | Exact-amount lookup over encrypted amounts via the keyed blind index — only on legs the viewer may see, so a search never reveals a hidden side's total |
| Q6 | Filter an amount range (₹10,000–₹50,000) | `txn_leg (amount_bucket)` → `txn` by id | Candidate legs by band, then exact filter after decryption of that page only |
| Q7 | Location statement (Tijori, Savan Bank), newest first | `journal_line (location_id, value_date DESC, journal_id) WHERE location_id IS NOT NULL` | Statement pages without touching other lines |
| Q8 | Ledger-account statement of an entity (General Ledger, Explain Balance) | `journal_line (entity_id, ledger_account_id, value_date DESC)` | Same, per account |
| Q9 | Counterparty sub-ledger (lines between Mint and Krish) | `journal_line (entity_id, counterparty_entity_id, value_date DESC) WHERE counterparty_entity_id IS NOT NULL` | Reciprocity checks and "who owes whom" drill-down |
| Q10 | Lines of a journal | `journal_line (journal_id, line_no)` unique | Detail view, verifier |
| Q11 | Journals of a transaction | `journal (txn_id, entity_id, step)` unique | Detail view, reversal |
| Q12 | Walk the hash chain in order | `journal (chain_seq)` unique | Verifier streams journals in order |
| Q13 | Dashboard: balances of visible entities | `balance_slice (entity_id, ledger_account_id, fund_id, location_id, counterparty_entity_id, category_id)` unique + `balance_current` PK | All slices of the visible entities in one scan; a few hundred rows to decrypt |
| Q14 | Location totals across owners (Tijori = Mint + JSK + Krish + Father) | `balance_slice (location_id) WHERE location_id IS NOT NULL` | Then filtered to visible entities (L12) |
| Q15 | Monthly reports (I&E by category, fund statement, cash flow) | `balance_period` PK `(slice_id, period_id)` + `balance_period (entity_id, period_id)` | Reports read period movements, not lines |
| Q16 | Outstanding: what is open for an entity, aged by due date | `open_item (creditor_entity_id, due_date) WHERE status IN ('open','partially_settled')` and the same on `debtor_entity_id` | Outstanding screens and aging scan only open items |
| Q17 | Settlement history of an item; items settled by a payment | `settlement_allocation (open_item_id)`, `settlement_allocation (settlement_txn_id)` | Both directions of the many-to-many |
| Q18 | Is this transaction reversed / corrected? | `txn_link (to_txn_id, kind)` + unique `(to_txn_id) WHERE kind = 'reverses'` | Constant-time check, also the "reversed once" guarantee |
| Q19 | Period of a date for an entity | `accounting_period (entity_id, period_start)` unique | `period_start <= d ORDER BY period_start DESC LIMIT 1` |
| Q20 | Approvals inbox | `approval_request (required_permission, requested_at) WHERE status = 'pending'`, `approval_request (txn_id)` | Inbox and transaction detail |
| Q21 | Current access, holder and owner of a location; "locations I may open" | partial uniques `(location_id) WHERE valid_to/revoked_at IS NULL` + `location_access (person_entity_id) WHERE revoked_at IS NULL` | Current facts without scanning history |
| Q22 | RLS: environments of the actor; rules of the actor and the actor's roles | `env_access (user_id) WHERE revoked_at IS NULL`, `user_role (user_id) WHERE revoked_at IS NULL`, `access_rule (subject_user_id) WHERE revoked_at IS NULL`, `access_rule (subject_role_id) WHERE revoked_at IS NULL` | The per-statement visibility sets are computed from a handful of rows |
| Q23 | Members of a firm; firms of a person (owner checks, non-owner rule) | `entity_membership (org_entity_id) WHERE valid_to IS NULL`, `entity_membership (member_entity_id) WHERE valid_to IS NULL` | Engine `isOwner` and membership screens |
| Q24 | Autocomplete people, firms, parties by name | `entity (lower(display_name) text_pattern_ops)` | Prefix search; results then permission-filtered |
| Q25 | Mobile delta sync of masters | `(change_xid)` on each synced table | `WHERE change_xid >= cursor ORDER BY change_xid, id LIMIT n`; next cursor = the snapshot's `xmin` (06 §6.6) |
| Q26 | Notification centre; unread badge | `notification (user_id, created_at DESC) WHERE dismissed_at IS NULL`, `notification (user_id) WHERE read_at IS NULL` | Badge is an index-only count |
| Q27 | Share history (mine; of a transaction) | `share_request (initiated_by, created_at DESC)`, `share_request (txn_id)` | |
| Q28 | Audit trail of an object; of an environment; of a user | `audit_log (object_id, occurred_at)`, `audit_log (env_entity_id, occurred_at DESC)`, `audit_log (actor_user_id, occurred_at DESC)` | Detail history, audit screens, access logs |
| Q29 | Login history, security events of a user | `security_event (user_id, occurred_at DESC)` | |
| Q30 | Sessions and devices of a user; refresh by token | `auth_session (user_id) WHERE revoked_at IS NULL`, `refresh_token (token_hash)` unique, `device (user_id)` | Sign-in, refresh, "Devices" screen |
| Q31 | Idempotent replay; expiry cleanup | `idempotency_record` PK `(user_id, key)`, `(expires_at)` | |
| Q32 | Open exceptions of an environment | `exception_finding (env_entity_id, severity) WHERE status IN ('open','acknowledged')` | Exceptions list, dashboard badge |
| Q33 | Active holds of a fund / location (available balance under lock) | `balance_hold (entity_id, fund_id, location_id) WHERE status = 'active'` | Read with the slice inside the posting lock |
| Q34 | Handovers awaiting my confirmation | `custody_event (to_holder_person_id) WHERE status = 'awaiting_confirmation'` | |
| Q35 | Bank-statement matching by amount and date | `bank_statement_line (amount_bidx, value_date)`, unique `(import_id, line_no)` | |
| Q36 | Lines produced by an allocation (explain an expense split) | `journal_line (txn_leg_id) WHERE txn_leg_id IS NOT NULL` | |

## 4.4 Search design (UX4, P6)

Search is one API query composed from whichever parts the user typed, always inside the actor's visible set:

| Typed | Matched by |
|---|---|
| `TX-…`, `OI-…` | Q3 reference prefix |
| a number (`45000`, `5,000`, `₹45k`) | Q5 exact amount (blind index; per-entity keys mean one lookup per visible entity) |
| words (`Angadiya`, `Tijori`, `Krish`) | Q4 reason text + Q24 names of entities, locations, funds, events → transactions involving them via Q1 |
| filters (date, company, person, fund, account, category, type, status) | Q1/Q2 ranges + equality filters on the narrowed set |
| amount range | Q6 bands, exact check after decryption of the page |

Results are ranked by date, then text rank; counts are counts of *visible* rows only (L3, L12). A hidden transaction
never contributes to a count, a "no result" message or an autocomplete suggestion.

## 4.5 Concurrency-related indexes

- Unique `balance_slice` key — two postings creating the same slice at once: one `INSERT … ON CONFLICT DO NOTHING`
  wins, both then lock the same row.
- Unique `(user_id, key)` on `idempotency_record` — a double submission inserts once; the second waits and replays.
- Unique `txn (created_by_user_id, client_ref)` — an offline operation synced twice creates one transaction.
- Unique `journal (chain_seq)`, unique `reference` — any race on numbering fails loudly instead of duplicating.

## 4.6 Verification

`deno task db:bench` seeds a realistic volume (5 entities, 40 locations, 50,000 transactions, ~200,000 lines) into
PGlite, runs each query above with `EXPLAIN (ANALYZE, FORMAT JSON)` and fails if a listed query uses a sequential scan
on `txn`, `txn_entity`, `journal_line`, `open_item` or `audit_log`, or exceeds its budget by a wide margin (PGlite is
single-threaded WebAssembly, so the absolute times are pessimistic). Results are recorded in
[TEST_PLAN.md](../TEST_PLAN.md).
