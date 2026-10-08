# 6. Transactions, concurrency and offline sync

Add-on 11 items 4 (atomicity), 5 (impact model), 13 (concurrency), 20 (offline) and §30 items 10 and 13. BUILD_PROMPT
J2–J5, P7; RULEBOOK-03 §60.

## 6.1 One operation = one database transaction

| Operation | Everything inside one `BEGIN … COMMIT` |
|---|---|
| Post a transaction | idempotency record · txn status · journals · lines · slices · `balance_current` · `balance_period` · open items · settlement allocations · custody events · holds consumed/released · reference number · chain head · audit rows |
| Approve the last step | approval request decided · re-validation · the whole posting above |
| Settle | settlement txn + its journals + allocations + open-item remainders/status + snapshots + audit |
| Reverse / correct | mirror journals (+ replacement event) · `txn_link` · status changes · open items reversed or reopened · snapshots · audit |
| Close a period | close run · closing journals · `balance_period.closing_enc` · period status · audit |
| Access change (Add / Replace) | access rows ended and created under one `change_id` · audit |
| Share confirmation | verification re-check · status `confirmed` · share event · secure link · audit |

Failure anywhere → `ROLLBACK`: no source without destination, no ledger without balance, no allocation without its
open item, no partial reversal (add-on 11 item 4, J4). Nothing financial is committed in a second transaction "to
finish later".

## 6.2 The posting pipeline in the database (J2 steps 12–30)

```text
BEGIN (READ COMMITTED)
 1. set actor (transaction-local)                         -- RLS and audit attribution
 2. INSERT idempotency_record (user, key, request_hash)  -- a concurrent duplicate blocks here, then replays
 3. SELECT txn … FOR UPDATE; check status transition     -- simultaneous approve/post of the same txn serialise
 4. load legs; plan journals in memory (pure engine)      -- master data read unlocked; see the note below
 5. SELECT open_item … FOR UPDATE ORDER BY id             -- items being settled or advanced
 6. INSERT balance_slice … ON CONFLICT DO NOTHING         -- every slice the plan touches
 7. SELECT balance_current … FOR UPDATE ORDER BY slice key
    SELECT balance_hold WHERE active … FOR UPDATE ORDER BY id
 8. decrypt; re-check available balance, negative-balance policy, reservations   -- authoritative, after the lock
 9. check every invariant (checkJournal, checkPlan); impact + conflict analysis
10. allocate reference (reference_counter row lock)
11. SELECT journal_chain_head FOR UPDATE                 -- last, held for milliseconds
12. INSERT journals, lines, open items, allocations, custody events
13. UPDATE balance_current / balance_period (version = version + 1), open_item remaining/status, holds, txn status
14. INSERT audit_log rows; UPDATE audit_chain_head
COMMIT  -- deferred triggers run: ≥2 lines and both sides per journal and fund; audit row present
```

*Note on step 4:* planning uses master data (accounts, funds, ownership, categories) that changes rarely; the plan is
re-validated against the locked state in steps 8–9, so a master change racing with a posting is caught (an account
deactivated meanwhile is refused by the journal insert trigger as well).

## 6.3 Locking order and deadlocks

All postings take locks in one global order: **idempotency → txn → open items (by id) → slices (by entity, account,
fund, location, counterparty, category) → holds (by id) → reference counter → chain heads**. Two postings that touch
the same rows therefore queue instead of deadlocking. `lock_timeout = 5s` turns an unexpected wait into a clean
"please try again" error with nothing committed. A deadlock, if one ever occurs, aborts one transaction entirely;
the client retries with the same idempotency key.

## 6.4 Concurrency scenarios

| Scenario (add-on 11 item 13) | What happens |
|---|---|
| JSK available ₹1,00,000; A and B each move ₹80,000 at the same moment (J3) | Both lock JSK's bank slice in step 7; B waits; A commits ₹20,000 remaining; B reads the committed balance after the lock, sees ₹20,000, is refused "available balance is insufficient". Never both. |
| Same account updated by a transfer and an expense | Same slice row lock → serial; each sees the other's committed result |
| Same fund reserved and spent | Holds and slice locked together; available = current − active holds, computed after locking |
| Duplicate request / double tap / retry on a poor network | Same idempotency key → the second request waits on the unique index, then returns the first result (re-read with current permissions) |
| Same offline operation synced from two attempts | Unique `(created_by_user_id, client_ref)` → one transaction |
| Two approvers approve at once | `txn` row lock + state-machine trigger: the second sees `approved`/`posted` and gets "already decided" |
| Edit a draft on two devices | Optimistic concurrency: `UPDATE … WHERE id = $1 AND version = $2`; 0 rows → "changed on another device, review the latest" |
| Edit a master (rename Tijori) while it is in use | Masters are labels over IDs; edits carry `version`; postings reference IDs, never names |
| Stale screen (user saw ₹50,000, it is now ₹30,000) | The client never sends balances (J1); the server re-reads under lock and decides |
| Reconciliation while postings continue | The reconciliation stores the expected balance with the slice `version` it read; an adjustment is accepted only if that version is unchanged, otherwise expected is recomputed and the difference shown again |
| Period close while someone posts into that month | Close takes the period row `FOR UPDATE` and re-checks; the journal insert trigger refuses a closed period, so a posting either commits before the close or is refused after it |
| Reversal racing with a settlement of the same item | Both lock the open item; the second re-validates against the new remainder |

Isolation stays `READ COMMITTED` with explicit row locks: every financial decision is taken after `FOR UPDATE` on the
rows it depends on, which gives serial behaviour exactly where it matters without the retry storms of `SERIALIZABLE`.

## 6.5 Impact and conflict model (add-on 11 item 5, Part G)

```text
CREATE → VALIDATE → DEPENDENCY CHECK → IMPACT ANALYSIS → CONFLICT CHECK → POST → LEDGER → BALANCE → FUND
       → OUTSTANDING → REPORT → AUDIT
```

The schema makes every downstream effect discoverable from the event, so the impact preview and the conflict checks are
queries, not guesses:

| Change requested | Dependencies found through | Propagation |
|---|---|---|
| Edit a draft | `txn_leg` (nothing posted yet) | Direct edit with version check; approvals reset |
| Reverse a posted event | `journal` (by txn), `open_item.origin_txn_id`, `settlement_allocation`, `custody_event`, `txn_link` | Mirror journals; open items it created → `reversed` if unsettled, otherwise the reversal is refused until the settlements are reversed first (conflict explained); snapshots updated; links recorded |
| Correct (amount, owner, account, fund, location, category, date) | as reversal | Reversal + replacement event, linked `corrects`; both visible (H15) |
| Reallocate an expense (Mint ₹30,000 → Mint ₹25,000 + JSK ₹5,000) | original allocation legs, the open items they created | Reversal of the original + new event with the new allocation; open items re-created; settlements already made stay linked to the old item and are re-pointed only by an explicit settlement (never silently) |
| Change ownership of money without moving it (H5) | — | `allocation_adjustment` event: a balanced cross-entity journal with an explicit classification |
| Change account / fund / location of posted money | — | Transfer or correction event; posted lines never change |
| Settlement | open items | Allocation rows + remainders; refused if larger than remaining |
| Reconciliation adjustment | reconciliation row, slice version | Adjustment event linked to the reconciliation |
| Change access, holder or owner of a location | `location_*` current rows | New rows, old rows ended; no money moves (RULEBOOK-03 §13) |

Nothing dependent is ever modified silently: posted rows are immutable at the database level, so every propagation is
a new, linked, audited row.

## 6.6 Offline and sync (P7, RULEBOOK-03 §60)

```text
phone: prepare a permitted operation → local id (UUIDv7) + idempotency key → encrypted local queue (status: queued)
  ↓ connection
API: authenticate → re-authorise with *current* permissions → full precondition pipeline → post or refuse
  ↓
phone: synced (server reference) | rejected (reason) | needs review (sync_review row) — never silently overwritten
```

| Situation | Handling |
|---|---|
| Duplicate sync / retry / network cut during save | Same idempotency key and `client_ref` → exactly one transaction; the retry receives the original result |
| Several offline transactions | Each is its own operation and its own database transaction; one refusal does not undo the others (each is a separate real-world event) |
| Partial connectivity (request committed, response lost) | The retry finds the completed idempotency record and returns the result |
| Stale data (balance changed while offline) | Re-validated under lock; insufficient funds → refused with reason; the phone shows "rejected" |
| Authorisation changed while offline | Re-checked at sync: refused (`permission_changed`) and the review explains it; the phone's cache for revoked environments is purged |
| Master deactivated while offline (RULEBOOK-03 §60) | Refused (`master_inactive`) → `sync_review` with the operation's details so the user can re-enter it against an active master |
| Same draft edited on two devices | Version conflict → `sync_review` (`conflict`); the user chooses |
| Period closed while offline | Refused for the closed period; the user may post it in the open period as a late entry with reference |

**Delta sync of reference data:** every synced master table has `change_seq` (global sequence, set by trigger on insert
and update). The phone asks for `change_seq > cursor` per table, limited to what its user may see. Archived rows arrive
as status changes (nothing is ever deleted, so there are no tombstones to lose). Changes to the user's own `env_access`
and `access_rule` rows are in the same feed: a revocation tells the phone which environments to purge. The phone never
receives other users' data, ciphertext or keys; it receives decrypted, authorised values for its own encrypted cache.
