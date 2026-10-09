# Operations: dependencies, atomic effects and recovery

Add-on 15 §2 and §9. For every material operation: what it depends on, what must commit together, what happens after
the commit, what can conflict, and how a failure is recovered. The schema is in [database/](../database/README.md); the
lock protocol is [database/06 §6.2–6.4](../database/06-transactions-concurrency-sync.md); module boundaries are in
the [module map](module-map.md).

## 1. Kinds of dependency

| Kind (add-on 15 §9) | In Finly | Mechanism |
|---|---|---|
| **Synchronous** | Authentication, session and device; current permissions; master records active; period open; amounts valid; available balance | Checked by the app service *and* re-checked by database guards inside the transaction; any failure → refusal with a stable code, nothing written |
| **Atomic** | Event, legs, journals, lines, balance snapshots, open items, allocations, custody events, holds, references, chain heads, audit rows, notifications, outbox rows | One `BEGIN … COMMIT` as `finly_ledger` (06 §6.1); deferred constraint triggers verify structure at commit |
| **Asynchronous** | Push delivery, "data changed" nudges to other devices, Integrity Verifier runs after a close, report refresh | Written as `outbox_event` rows in the same transaction (transactional outbox); delivered after commit by `finly_system` workers with idempotent consumers |
| **Conditional** | Acknowledgement (only when another person's personal books change and their setting is `acknowledge`); approval (only when an approval rule matches); custody confirmation (F2) | Decided by the app service from data (settings, rules), never by name; enforced again by the database (`txn_ack_posting_check`, approval trigger) |
| **Optional** | Attachments, notes, tags | The core posting does not depend on them; a failed upload leaves the posting intact and is retried by the user |
| **External** | Push provider, WhatsApp share intent, file storage, key source (KEK) | Timeouts and bounded retries; never inside the money transaction except the KEK, whose absence refuses the operation (`INTEGRITY`, nothing written) |

**Never asynchronous:** anything financial. A balance, journal, open item or allocation is never "completed later".

## 2. Operation catalogue

Codes: refusals map to database SQLSTATEs `F1001`–`F1012` (0001) and API error codes; every refusal leaves nothing
written except the failure outcome (06 §6.1).

### 2.1 Post a transfer or payment (money moves)

| | |
|---|---|
| Depends on (direct) | Actor's session; `transactions.create` (and approve, if self-approving is allowed) in each affected environment; source and destination locations active and accessible (`location_access`); fund of each leg; open period for each entity; idempotency key |
| Depends on (indirect) | Ownership of the money (ledger, not the location); emergency write freeze off; key ring available |
| Conditional | Approval rule match → `pending_approval` + hold; another person's personal books → acknowledgement (2.4); custody confirmation (F2) |
| Forbidden | Client-supplied balances or journal lines; posting into a closed period; a leg without a fund on a non-party entity |
| Atomic | idempotency record → txn status → period `FOR SHARE` → slices `FOR UPDATE` → re-check available balance → journals + lines → snapshots → custody event → reference → journal chain → audit (one row per environment) → notifications → outbox |
| After commit | Push to affected users; data-changed nudge to devices that can see the slices |
| Conflicts | Two spends on one slice: serialised by the slice lock; the second sees the committed balance (06 §6.4) |
| Recovery | Any failure rolls back; the idempotency record is marked `failed` in a second short transaction; a resend with the same key returns the stored outcome |
| Tests | Engine scenarios; `ledger_structure_test`, `concurrency_test` (two-connection) |

### 2.2 Record an expense (one or several entities bear it)

| | |
|---|---|
| Depends on | As 2.1, plus: category active; **explicit allocation per bearing entity** (never auto-split, add-on 13 §5); payer ≠ bearer handled as reimbursement open items |
| Atomic | Payer's journal (money out, receivables from bearers); each bearer's journal (expense, payable to payer); open items with origins; all in one transaction |
| Conditional | A bearer is another person's personal books → acknowledgement; amount over a rule → approval |
| Open | F1 (category split across bearers) and F8/F9 with the owner — the affected variants are not built until answered |

### 2.3 Settle an open item

| | |
|---|---|
| Depends on | Open item(s) `open`/`partial`, not reversed; settlement kind valid for the item kind; amount ≤ remaining (re-read under `FOR UPDATE`) |
| Atomic | Settlement event + journals + `settlement_allocation` rows + item remainders/status + snapshots + audit |
| Conflicts | Two settlements or a reversal racing: the item lock serialises them; the second re-validates against the new remainder |
| Forbidden | Settling more than remaining; settling an item of another debtor/creditor pair |

### 2.4 Entry into someone else's personal books (D-029)

| | |
|---|---|
| Depends on | The person's `personal_book_setting` (no row = `acknowledge`) |
| Atomic (submit) | Event `pending_acknowledgement` + `txn_acknowledgement` per person + hold on the giver's side + notification + outbox |
| Atomic (acknowledge) | Acknowledgement row → full re-validation under lock (2.1) → every journal posts → hold released → audit → notify giver |
| Reject / withdraw | Final answer recorded; event `rejected`/`cancelled`; hold released; history kept |
| Database guards | Only the person answers (`F1008`); answers final (`F1007`); no posting while pending (`txn_ack_posting_check`) |

### 2.5 Approve (maker/checker)

Depends on the approval rule, the approver's permission and segregation of duties (`F1011`: maker ≠ checker). The
last approval runs the whole posting (2.1) in the same transaction; a rejection releases the hold. Two approvers at
once: the txn row lock — the second sees "already decided".

### 2.6 Reverse or correct

Depends on the original posted event and everything derived from it: `journal`, `open_item.origin_txn_id`,
`settlement_allocation`, `custody_event`, `txn_link`. Mirror journals + replacement event (correction) + links + item
status changes, atomically. Refused with an explanation while settlements of its open items exist (reverse those
first). Posted rows never change (`F1001`).

### 2.7 Close or reopen a period

Depends on all earlier periods closed, no pending approvals/acknowledgements in the period, Integrity Verifier clean.
Close run + closing journals + `balance_period.closing_enc` + period status, atomically; the period row `FOR UPDATE`
first, then slices (same global order). After commit: Integrity Verifier run via outbox. Reopen only the latest
closed period, with reason and audit.

### 2.8 Change access (grant, revoke, Add / Replace)

Depends on `users.manage` in that environment; personal books only by their owner (A4, `F1008`). Old rows ended and
new rows created under one `change_id`, atomically, with audit. After commit: data-changed nudge so open screens drop
what is no longer visible. The next request is authorised with the new rights, whatever the screen showed.

### 2.9 Archive a master (entity, account, fund, location, category)

Depends on: no non-zero balance in its slices, no open items, no pending events that use it. Status `inactive` →
`archived`; never deleted (`tg_no_delete`). Later postings that name it are refused (`F1004`).

### 2.10 Activate an account; support access (D-030)

Activation depends on a live, unexpired, unused code (`account_activation`, server clock decides) and the person's own
device; sets the person's own password and M-PIN, `activated_at`, audit. Support depends on the person's consent;
the window cannot be extended (`F1001`); every action is audited under the helper's identity.

### 2.11 Share proof (WhatsApp, PDF, secure link)

Depends on the actor's right to share each included value, the recipient's verification and the exact preview hash.
Confirmation re-checks all three; any change after review voids it. Share event + secure link + audit atomically;
the WhatsApp intent opens only after commit.

### 2.12 Reconciliation adjustment

Depends on the reconciliation's stored slice `version`; accepted only if unchanged, otherwise the expected balance is
recomputed and the difference shown again (06 §6.4).

## 3. Transactional outbox

`outbox_event` rows are written by the same transaction as the business change, so an effect is recorded if and only
if the change committed. A `finly_system` worker claims due rows with `FOR UPDATE SKIP LOCKED`, delivers, and marks
them `done`; failures back off exponentially up to a limit, then become `dead` and raise an `exception_finding`. Each
row has a unique `(topic, dedupe_key)`, and consumers are idempotent, so a redelivery never duplicates an effect.
Payloads carry ids only — never amounts, names or other confidential values. Migration and tests come with the
posting service.

## 4. Impact analysis before a change (add-on 15 §2.3)

| Change to | Look at | Tests that must run |
|---|---|---|
| A migration | `docs/database/` (03, 05, 06), the data dictionary, every guard and policy on the touched tables | `deno task verify`, `test:pg17`, `test:pg18`; fingerprint after deployment |
| The engine (`src/domain`) | Every intent and plan kind; `JOURNAL_KINDS`/`OPEN_ITEM_KINDS`/`SETTLEMENT_KINDS` parity with the schema | Engine tests, `catalog_test` |
| A permission or policy | 05 RLS, the policy engine, UI visibility | `rls_privacy_test`, API authorisation tests |
| A shared contract (`Sql`, error codes, DTOs) | The module map — every importer of the file | Whole suite |
