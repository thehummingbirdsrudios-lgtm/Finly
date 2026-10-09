# 6. Transactions, concurrency and online updates

Add-on 11 items 4 (atomicity), 5 (impact model), 13 (concurrency), 20 (offline, superseded) and §30 items 10 and 13.
BUILD_PROMPT J2–J5; RULEBOOK-03 §60. **Finly is online only (D-031, add-on 12, add-on 13):** no local database, no
offline mode, no offline queue.

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

Every row above is written by one role, `finly_ledger` (05 §5.2), because one database transaction runs as one role.

Failure anywhere → `ROLLBACK`: no source without destination, no ledger without balance, no allocation without its
open item, no partial reversal (add-on 11 item 4, J4). Nothing financial is committed in a second transaction "to
finish later". The one thing recorded *after* a rollback, in a second short transaction, is the **outcome of the
failure**: the idempotency record marked `failed` with its error code and an approved event moved to `failed` — so a
refused request has a durable, visible result and its key is not silently reusable.

## 6.2 The posting pipeline in the database (J2 steps 12–30)

Implemented by `backend/src/app/posting/` in two transactions. **Prepare** (short): claim the idempotency key, validate
and authorise against the current books, create the draft with its request encrypted (`txn.intent_enc`), its
participants and legs — it holds the day's reference counter only for its own milliseconds. **Post**: the steps below,
re-planning from the stored request under lock. Creating the draft inside the posting transaction would take the
reference counter first, the reverse of a period close (period → slices → reference) — a deadlock; the split keeps one
global order. A refusal is recorded in a third short transaction (idempotency `failed`, draft `failed`, audited); a
lock timeout, deadlock or serialisation failure is not recorded, and the same key resumes from the draft.

```text
BEGIN (READ COMMITTED)
 1. set actor (transaction-local)                         -- RLS and audit attribution
 2. INSERT idempotency_record … ON CONFLICT DO NOTHING    -- a concurrent duplicate waits on the key, then finds
                                                            -- the first one's result and replays it (no 23505)
 3. SELECT txn … FOR UPDATE; check status transition     -- simultaneous approve/post of the same txn serialise
 4. SELECT accounting_period … FOR SHARE ORDER BY entity, start   -- a close of the same month waits, or is waited on
 5. SELECT open_item … FOR UPDATE ORDER BY id             -- ids come from the intent; locked BEFORE planning,
                                                            -- because the plan depends on what remains
 6. load legs; plan journals in memory (pure engine)      -- master data read unlocked; see the note below
 7. INSERT balance_slice … ON CONFLICT DO NOTHING, one by one in slice-key order   -- no deadlock on new keys
 8. SELECT balance_current … FOR UPDATE ORDER BY slice key
    SELECT balance_hold WHERE active … FOR UPDATE ORDER BY id
 9. decrypt; re-check available balance, negative-balance policy, reservations   -- authoritative, after the lock
10. check every invariant (checkJournal, checkPlan); impact + conflict analysis
11. allocate the reference if the event has none yet (references are allocated when a draft is created)
12. SELECT journal_chain_head FOR UPDATE                 -- held for milliseconds
13. INSERT journals, lines, open items + origins, allocations, custody events
14. UPDATE balance_current / balance_period, open_item remaining/status, holds, txn status (draft/approved → posted)
15. INSERT audit_log rows (one per environment); UPDATE audit_chain_head   -- always last
COMMIT  -- deferred triggers: ≥ 2 lines and both sides per journal and fund; every journal entity a participant;
        -- the event has legs; an audit row was written in this transaction
```

*Note on step 4:* planning uses master data (accounts, funds, ownership, categories) that changes rarely; the plan is
re-validated against the locked state in steps 8–9, so a master change racing with a posting is caught (an account
deactivated meanwhile is refused by the journal insert trigger as well).

## 6.3 Locking order and deadlocks

All postings take locks in one global order: **idempotency → txn → periods (by entity, start) → open items (by id) →
slices (by entity, account, fund, location, counterparty, category; created in the same order) → holds (by id) →
reference counter → journal chain head → audit chain head**. A period close takes its period row `FOR UPDATE` first,
then the slices — the same order. Every writer appends audit rows last, so the audit chain head is held only for the
final milliseconds of a transaction. Pending-outgoing holds (AC9) are created when an event is submitted for approval,
under the same slice and hold locks, after checking the available balance. Two postings that touch
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
| The phone resends a request while the original is still running (response lost) | Same `(user_id, key)` in `idempotency_record`: the resend waits on the first one's key, then finds it and returns its result — one posting (`concurrency_test`) |
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

## 6.6 Online only: requests, retries and updates (D-031)

Finly keeps no financial data on the phone. Every read and every change goes to the API, which writes the central
PostgreSQL database; the phone shows a result only after the server has confirmed it.

```text
phone: prepare a permitted operation → idempotency key (UUIDv7) → send (button disabled while it is in flight)
  ↓
API: authenticate → authorise with *current* permissions → full precondition pipeline (6.2) → commit or refuse
  ↓
phone: confirmed (server reference) | refused (reason) | not sent ("No connection — nothing was saved")
```

| Situation | Handling |
|---|---|
| No connection | Nothing is saved, queued or posted locally. The screen says so plainly and keeps the user's input on the form so they can send it when the connection returns — it is never sent automatically later |
| Network cut during save (request committed, response lost) | The phone resends with the **same** idempotency key; the server finds the completed record and returns the original result — exactly one posting |
| Double tap / resend while the first is still running | The second waits on the first one's key, then returns its result (6.4) |
| Balance changed since the screen was loaded | The client never sends balances; re-validated under lock; insufficient → refused with the reason |
| Permission changed while the screen was open | Re-checked on every request; refused, and the phone reloads what the user may now see |
| Master deactivated while the form was open (RULEBOOK-03 §60) | Refused (`F1004`) with the master named; the user picks an active one |
| Same draft edited on two devices | Version check (`version = $2`); the second gets "changed on another device" and sees the latest |
| Period closed while the form was open | Refused for the closed period; the user may post it in the open period as a late entry with reference |
| Session expired | Refused (401); the user unlocks again and resends — same key, so still exactly once |

**Reflecting changes to other users:** after a commit the API sends a push *nudge* (no amounts, no names) to the
devices of users whose visible data changed; an open screen also refreshes on resume and on pull-to-refresh. Either
way the phone fetches the changes with the delta feed below. A missed nudge only delays a refresh; it can never lose
or duplicate data, because the database is the only copy.

**Delta feed:** every table the phone reads has `change_xid` — the id of the transaction that last wrote the
row (`xid8`, set by trigger). A page returns rows with `change_xid >= cursor` and hands back the query snapshot's
`xmin` as the next cursor: every transaction below it had finished when the page was read, so a row committed late by
a slow transaction is never skipped (a plain sequence number would skip it). Rows are deduplicated by id and version
in the phone's memory. The phone asks per table, limited to what its user may see. Archived rows arrive
as status changes (nothing is ever deleted, so there are no tombstones to lose). Changes to the user's own `env_access`
and `access_rule` rows are in the same feed: a revocation tells the phone which environments to drop from the screen
at once. The phone never receives other users' data, ciphertext or keys, and keeps what it receives in memory only —
it is never written to a local database.

## 6.7 Entries into someone else's personal books — acknowledgement (D-029)

Option B is the default: an event that would change another person's personal books waits for that person.

```text
giver submits → posting service finds every *other* person whose personal books the plan changes
  setting = acknowledge (default; no row) → txn status pending_acknowledgement + one txn_acknowledgement row each
                                             + pending-outgoing hold on the giver's side (available balance shown less)
                                             + notification to the person
  setting = immediate (only the person can choose it) → posts at once + notification ("added to your books")
person acknowledges → in ONE transaction: acknowledgement row → re-validate under lock (6.2) → post every journal
                      → release the hold → audit → notify the giver
person rejects     → acknowledgement rejected (final) → event rejected → hold released → giver notified; history kept
giver withdraws    → acknowledgement withdrawn → event cancelled → hold released; history kept
```

Database guards: only the person can change their own setting (`F1008`, even a Super Admin); only that person can
answer, and an answer is final (`F1007`/`F1008`); the deferred check refuses `posted` while any acknowledgement is not
`acknowledged`; the primary key `(txn_id, entity_id)` prevents a duplicate request; the event's row lock (6.2 step 3)
serialises a simultaneous acknowledge and withdraw. Pending entries are listed separately from posted ones and never
count in posted balances. Tests: `decisions_test.ts`.
