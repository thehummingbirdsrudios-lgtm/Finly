# Accounting engine — design and posting rules

The authoritative rules are the [source documents](source/README.md), above all RULEBOOK-01..03 and the owner's
answers ([GATE-RESPONSE-02](source/GATE-RESPONSE-02-f1-f7.md)). This document turns them into the exact model and
postings the engine implements. Every posting table here is an automated test (`backend/tests/engine/`).

## 1. Two layers, one event

| Layer | What it records | Where |
|---|---|---|
| **Business transaction** | WHO gave → FROM where → TO whom → FOR whom (owner of the expense) → WHY → WHERE the money is → WHO holds it → HOW MUCH → settlement | `txn` (master event) + its intent payload |
| **Accounting** | Which accounts → Debit / Credit → ledger → balance → reconciliation → report | `journal` + `journal_line` |

One real-world event = **one master event** (`TX-YYYYMMDD-NNNNNN`), which produces one or more balanced journals —
**one journal per entity whose books change**. Source/destination are never stored as debit/credit and debit/credit
are never inferred from source/destination by the UI (RULEBOOK-01 §72).

## 2. Entities and environments

| Kind | Has its own books | Examples |
|---|---|---|
| `firm` | yes | Mint, JSK, ABC Jewellers |
| `person` | yes — the person's **personal/home environment** (private to them, A4) | Krish, Father, Sujal |
| `pool` | yes | Family Fund |
| `party` | no — a counterparty only (sub-ledger) | customers, suppliers, Angadiya, a bank, any outside business |

- Every individual is a separate `person` entity with their own books; partners are never merged (RULEBOOK-03 §2, §5).
- Firm relationships: `firm_member(firm, person, role ∈ owner|partner|worker|employee|other, from, to)`. "Owner" in
  the non-owner rule means role `owner` or `partner` in that firm.
- Access (who may see/act) is a separate permission system (L, RULEBOOK-03 §8); environments are never opened by
  membership alone.

## 3. Chart of accounts, dimensions and sub-ledgers

**Account classes** (computational rule, RULEBOOK-01 §4): asset (Dr), contra_asset (Cr), liability (Cr), equity (Cr),
drawings (Dr), revenue (Cr), expense (Dr), cogs (Dr). The class decides the normal side; the sign of a balance never
decides its meaning (§90).

**Dimensions on every journal line**: entity · ledger account · side · amount · fund · location (cash/bank/wallet lines)
· counterparty (receivable/payable/advance/loan/inter-entity lines) · category (expense/revenue lines) · project/event
· cost centre · holder at posting time (cash at a place) · payment method · master event · journal.

Accounts are **not** created per person, location, project or category (§85): one *Cash* account per entity with the
location dimension, one *Inter-entity receivable* control account with the counterparty dimension, and so on.
Sub-ledger totals (by counterparty / by location) always equal the control account (§62–63).

**System accounts per entity** (template; admins may add, rename labels, deactivate — never delete referenced ones):

| Code | Account | Class | Used for |
|---|---|---|---|
| 1100 | Cash | asset | physical cash; location = Tijori, drawer, *cash with Krish*… |
| 1200 | Bank | asset | location = each bank account |
| 1250 | Wallet / UPI balance | asset | location = each wallet |
| 1300 | Inter-entity receivable | asset | counterparty = entity that owes us (expense paid on its behalf, transfers, own/personal money given) |
| 1310 | Advances given | asset | counterparty = person/party holding the advance |
| 1320 | Loans given | asset | counterparty = borrower |
| 1330 | Customer receivable | asset | counterparty = party |
| 1340 | Investment in firms | asset | person/pool books only; counterparty = firm |
| 1390 | Cash in transit | asset | handovers awaiting confirmation (only when confirmation is ON) |
| 2100 | Inter-entity payable | liability | counterparty = entity we owe |
| 2110 | Supplier payable | liability | counterparty = party |
| 2120 | Loans taken | liability | counterparty = lender |
| 2130 | Advances received | liability | counterparty = payer |
| 3100 | Owner capital | equity | counterparty = owner |
| 3150 | Owner drawings | drawings | counterparty = owner |
| 3200 | Opening balance equity | equity | opening balances (must be explained and cleared) |
| 3300 | Retained earnings | equity | closing journals |
| 3900 | Suspense | asset | unidentified money (must be cleared) |
| 4xxx | Revenue by category | revenue | category dimension |
| 5xxx | Expense by category | expense | category dimension |
| 5900 | Cash over / short | expense | reconciliation adjustments |

## 4. Money

- Base currency INR, **whole rupees as exact integers** (H14). The engine uses `bigint`; there is no floating point
  anywhere in money paths. Lines carry a positive amount and a side; direction is never a negative number (§54–55).
- Foreign-currency fields (original amount in minor units, currency, rate) and tax lines are added when those modules are
  built; the INR base amount is always a whole rupee and any difference goes to an explicit rounding or exchange line
  (§49–50). No rounding difference may break Dr = Cr.

## 5. Intents and their postings

Notation: `[E] Dr X / Cr Y amount` — a line pair in entity E's journal. `cp` = counterparty, `loc` = location.

### 5.1 Transfer within one entity (location → location; includes handovers)
`[E] Dr Cash(loc=to) / Cr Cash(loc=from)` (or Bank, Wallet). Bank → cash, cash → bank, Tijori → drawer, *cash with
Krish* → *cash with Sujal*. Never income or expense (§77, §101). Handover confirmation is **OFF** by default
(owner, F2); when a policy turns it ON: initiation `[E] Dr Cash in transit / Cr Cash(from)`, confirmation
`[E] Dr Cash(to) / Cr Cash in transit`.

### 5.2 Expense — source of money ≠ expense owner (owner, F1 and the additional expense rule)
An expense has one or more **funding sources** (payer entity + location + amount; Σ = total) and one or more
**allocations** (owner entity + category + amount; Σ = total). Ownership is **Personal**, **Firm** (one) or
**Common** (several, exact manual amounts; no automatic or equal split, §31, §107). If Σ allocations ≠ total the
intent is rejected; nothing is guessed. Each allocation is matched to the funding in the order entered; then for each
(owner O, payer P, amount a, category c):

| Case | Postings |
|---|---|
| P = O | `[O] Dr Expense(c) / Cr Cash(loc) a` |
| P ≠ O, general (firm↔firm, person pays firm, firm pays another entity's expense) | `[O] Dr Expense(c) / Cr Inter-entity payable(cp P) a` · `[P] Dr Inter-entity receivable(cp O) / Cr Cash(loc) a` · open item: O owes P |
| P is a firm, O is a person who **owns** P (owner's personal expense from firm money) | classification **asked every time** (F8): *withdrawal* → `[P] Dr Owner drawings(cp O) / Cr Cash(loc)` · `[O] Dr Expense(c) / Cr Investment in firms(cp P)`; *owner owes firm* → general case (open item) |
| P is a firm, O is a non-owner person | a `give` (§5.3) with explicit treatments, or this general case when the person owes the firm for the expense |

Unpaid bill (accrual, F4): the funding source is *Supplier payable (cp party)* instead of cash: `[O] Dr Expense(c) /
Cr Supplier payable(cp S)`; open item O owes S. Paying it later is a settlement (§5.7) and never a second expense (§113).

### 5.3 Money given between entities — F8 and F9 (owner's decision, D-037)
Firm → owner (F8) and owner → anyone (F9) are **two separate events**, both the `give` intent. Each states the
giver's side (Own/Expense), the receiver's side (Own/Expense, when it keeps books) and the arrangement
(`repayable`, `drawings`, `capital`, `none`); none is ever inferred, and only `repayable` creates a debt. The full
journal-entry matrix — the eight scenarios, F8 A/B/C, F9 C1/C2 and repayment Options A/B — is in
[accounting/F8-F9-model.md](accounting/F8-F9-model.md). `withdrawal` (F8 A) and `capital_contribution` are fixed
shortcuts of the same planner. The earlier `nonowner_payment` and `interentity_transfer` intents assumed a debt
whenever money moved and are retired (migration 0013).

### 5.4 Income
Receiver = owner: `[R] Dr Cash(loc) / Cr Revenue(c)`. On credit: `[R] Dr Customer receivable(cp party) / Cr Revenue(c)`.
Received by someone else on the owner's behalf (worker, owner's personal account): `[Owner] Dr Inter-entity
receivable(cp Receiver) / Cr Revenue(c)` · `[Receiver] Dr Cash(loc) / Cr Inter-entity payable(cp Owner)`.
Unknown money is never income: `[E] Dr Cash(loc) / Cr Suspense` until assigned (§110–111).

### 5.5 Advances
Give: `[G] Dr Advances given(cp R) / Cr Cash(loc)`. Use: `[G] Dr Expense(c) / Cr Advances given(cp R)`. Return:
`[G] Dr Cash(loc) / Cr Advances given(cp R)`. Overspend by R from R's own money: `[G] Dr Expense(c) / Cr Inter-entity
payable(cp R)` · `[R] Dr Inter-entity receivable(cp G) / Cr Cash(R's location)`. An advance is never an expense when
given and never part of R's personal net worth (A9, §17).

### 5.6 Loans, capital, withdrawals
Loan L → B: `[L] Dr Loans given(cp B) / Cr Cash` · `[B] Dr Cash / Cr Loans taken(cp L)` (an outside lender/borrower has
no books, so only one side). Repayment splits principal and interest: `[B] Dr Loans taken / Dr Interest expense /
Cr Cash` · `[L] Dr Cash / Cr Loans given / Cr Interest income` (§28). Capital P → F: `[F] Dr Cash / Cr Owner capital(cp P)`
· `[P] Dr Investment in firms(cp F) / Cr Cash`. Withdrawal F → P: `[F] Dr Owner drawings(cp P) / Cr Cash` ·
`[P] Dr Cash / Cr Investment in firms(cp F)`. Capital vs loan is always chosen, never assumed (§145).

### 5.7 Settlements and open items
Every receivable/payable/advance/loan relationship is an **open item** with explicit **debtor** and **creditor**
(§169), original amount, and matched settlement allocations; remaining = original − Σ allocations, never typed.
A payment from D to C: `[D] Dr Inter-entity payable(cp C) / Cr Cash` · `[C] Dr Cash / Cr Inter-entity receivable(cp D)`,
allocated explicitly to one or more open items (partial, one-to-many, many-to-one, §32–35). An allocation larger
than what remains is refused; an unallocated remainder stays an identifiable balance (§109–110). Net settlement of
two opposite items is an explicit offset event; the originals stay (§119). Settlement never re-creates the expense.

### 5.8 Reversal and correction
Reversal = the exact mirror of every journal of the original event (sides swapped, same dimensions), linked, in the
original's period if open, otherwise in the current open period with a reference (§56, AC8). Correction = reversal +
replacement event, both linked. Posted lines are immutable; the database refuses updates and deletes of posted rows.

### 5.9 Opening balances and reconciliation
Opening: `[E] Dr Cash(loc) / Cr Opening balance equity`; opening balance equity must be explained and cleared
(§88). Cash or bank difference: never edit a balance; an approved adjustment `[E] Dr Cash over/short / Cr Cash(loc)`
(or the reverse), linked to the reconciliation record (§100, §132).

## 6. Locations: owner, access and holder (owner, F5)

Three independent facts, each with history:

| Fact | Table | Operations |
|---|---|---|
| Who owns the location | `location.owner_entity_id` | change (audited) |
| Who has access | `location_access(location, person, granted_at, revoked_at, change_kind)` | **Add** (existing access remains) · **Replace** (one person's access ends, another's starts, in one change) · Revoke |
| Who holds the key / control now | `location_holder(location, person or none, from, to)` | Hand over control (A → B), or set unassigned |

None of these moves money or changes ownership of money (§102). The money at a location, by owner entity and fund, is a
ledger query on the location dimension.

## 7. Invariants checked before every commit (and re-verified by the Integrity Verifier)

1. Every journal has ≥ 2 lines; every line is positive, whole rupees, one side only.
2. Σ Dr = Σ Cr per journal, per entity and per fund (F4).
3. Every line's account belongs to the journal's entity and is active; its class allows the line's dimensions
   (cash lines need a location; receivable/payable/advance/loan lines need a counterparty).
4. Σ allocations = Σ funding = total for every expense; no allocation is zero or negative.
5. Inter-entity reciprocity: for every pair (A, B), A's *receivable cp B* − A's *payable cp B* equals B's *payable cp A*
   − B's *receivable cp A*.
6. Open item remaining = original − Σ allocations, and 0 ≤ remaining ≤ original.
7. No posting into a closed period; closing balance = next opening.
8. Balance snapshots equal the recomputation from lines; the journal hash chain is unbroken.

## 8. Acceptance tests (RULEBOOK-03 §72)

The engine test suite names each test after its scenario number; module tests cover the ones that need reconciliation,
access, acknowledgement (D-029), assets, inventory, tax and foreign currency as those modules are built. The current status of
each is in [TEST_PLAN.md](TEST_PLAN.md).
