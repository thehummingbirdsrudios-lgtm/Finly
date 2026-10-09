# F8 / F9 — the accounting model for money given between entities

Source: the owner's answer, [GATE-RESPONSE-04](../source/GATE-RESPONSE-04-f8-f9-final.md), read together with
[ADDON-16](../source/ADDON-16-universal-accounting-edge-cases.md) §2.4–2.5 and §5. Decision D-037. Implemented by the
`give` intent (`backend/src/domain/engine/plan.ts`); tests `backend/tests/engine/give_test.ts`.

## 1. One flow, two independent transactions

Firm → owner (F8) and owner → anyone (F9) are **two separate events**, each recorded with the same `give` intent:
its own reference, journals, audit history and outstanding items. A later event may name an earlier one for
traceability (`txn_link`, kind `follows`); it never re-posts the earlier amount.

Each `give` has three explicit choices — none is ever inferred or silently defaulted (`CLASSIFICATION_REQUIRED` when
missing):

| Choice | Values | Meaning |
|---|---|---|
| **Giver side** | `own` · `expense` | `expense` = the money is spent for good in the giver's books (category required). `own` = it is still the giver's value in another form — owed back, a drawing, or capital — never "just gone" |
| **Receiver side** (receivers that keep books) | `own` · `expense` | `own` = the money arrives in one of the receiver's places. `expense` = the receiver records it as spent on its own expense (category required); it never sits in a place of theirs |
| **Arrangement** | `repayable` · `drawings` · `capital` · `none` | Who owes whom, if anyone — recorded separately from the two labels (GATE-RESPONSE-04 §2 "Repayment is separate") |

### What "Own" means — precisely (ADDON-16 §5.1)

"Own" never creates a debt, a loan, income or capital by itself. The purpose and the repayment answer say which it is (§6):

| Arrangement | Allowed when | Giver's own side | Receiver's counterpart |
|---|---|---|---|
| `repayable` | giver side `own` | Dr Inter-entity receivable (receiver) | Cr Inter-entity payable (giver) + an open item: receiver owes giver |
| `drawings` (F8 A) | giver is a firm, receiver one of its owners, giver side `own` | Dr Owner drawings (that owner) | Cr Investment in firms (that firm) |
| `capital` | giver is a person, receiver a firm that person owns, giver side `own` | Dr Investment in firms (that firm) | Cr Owner capital (that person) |
| `none` | giver side `expense` | Dr the giver's expense category | Cr the receiver's income category (required) |

Combinations outside this table are refused with `CLASSIFICATION_CONFLICT` and a plain explanation — e.g. giver
`expense` + `repayable` ("an amount that is owed back is not spent; choose Own"), or giver `own` + `none` ("say
whether it is owed back, a drawing or capital, or record it as an expense").

## 2. The eight base scenarios as journal entries

Amount X; giver G pays from place P; receiver R. Each block is one entity's balanced journal (2.1 of ADDON-16).

### F8 — Transaction 1: firm F → its owner O

| # | Firm | Owner | Arrangement | Firm's journal | Owner's journal |
|---|---|---|---|---|---|
| 1 | Own | Own | `drawings` (A) | Dr Owner drawings (O) / Cr Money P | Dr Money Q / Cr Investment in firms (F) |
| 1 | Own | Own | `repayable` (B) | Dr Inter-entity receivable (O) / Cr Money P | Dr Money Q / Cr Inter-entity payable (F); open item O owes F |
| 2 | Own | Expense | `drawings` (A) | Dr Owner drawings (O) / Cr Money P | Dr Expense (category) / Cr Investment in firms (F) |
| 2 | Own | Expense | `repayable` (B) | Dr Inter-entity receivable (O) / Cr Money P | Dr Expense (category) / Cr Inter-entity payable (F); open item O owes F |
| 3 | Expense | Own | `none` (C) | Dr Expense (owner-related category) / Cr Money P | Dr Money Q / Cr Income (category, e.g. remuneration) |
| 4 | Expense | Expense | `none` (C) | Dr Expense (owner-related category) / Cr Money P | Dr Expense (category) / Cr Income (category) |

Q is the owner's place where the money arrives (only when the owner's side is `own`).

### F9 — Transaction 2: owner O → any receiver R (person, firm, pool or outside party)

| # | Owner | Receiver | Arrangement | Owner's journal | Receiver's journal (when R keeps books) |
|---|---|---|---|---|---|
| 5 | Own | Own | `repayable` (C2) | Dr Inter-entity receivable (R) / Cr Money P | Dr Money Q / Cr Inter-entity payable (O); open item R owes O |
| 5 | Own | Own | `capital` (R is O's firm) | Dr Investment in firms (R) / Cr Money P | Dr Money Q / Cr Owner capital (O) |
| 6 | Own | Expense | `repayable` (C2) | Dr Inter-entity receivable (R) / Cr Money P | Dr Expense (category) / Cr Inter-entity payable (O); open item R owes O |
| 6 | Own | Expense | `capital` (R is O's firm) | Dr Investment in firms (R) / Cr Money P | Dr Expense (category) / Cr Owner capital (O) |
| 7 | Expense | Own | `none` (C1) | Dr Expense (category) / Cr Money P | Dr Money Q / Cr Income (category) |
| 8 | Expense | Expense | `none` (C1) | Dr Expense (category) / Cr Money P | Dr Expense (category) / Cr Income (category) |

An outside party (no books in Finly) has no journal; only the giver's side posts, and only `expense` (`none`) or
`repayable` (the party then owes the giver: open item with the party as debtor) apply.

## 3. Repayment relationships across the two transactions (GATE-RESPONSE-04 §4)

**Option A — two linked debts.** Transaction 1 `repayable` (O owes F) and Transaction 2 `repayable` (R owes O): two
open items, settled separately; the second is linked to the first (`follows`). O remains F's debtor whatever R does.

**Option B — the receiver owes the firm directly; the owner only carries the cash.** Transaction 1 is not F8 at all:
it is a **custody transfer inside the firm's books** — the firm's money moves to a place the owner holds for the firm
(`transfer` intent; nothing changes in the owner's personal books, rule 6 "custody is not ownership"). Transaction 2
is a `give` by the **firm**, paid from that place, `repayable`: F's receivable from R and R's payable to F. No personal
debt is created for the owner.

When Transaction 1 was an owner-related firm expense (C), Transaction 2 never creates a firm receivable on its own; a
different arrangement needs its own authorised entry.

## 4. Rules the engine enforces

1. Every journal balances per entity and per fund; each side posts in its own entity's books (ADDON-16 §2.1).
2. `repayable` always creates exactly one open item with the real debtor and creditor; nothing else creates debt.
3. A `drawings`, `distribution` or `capital` purpose is refused unless ownership on the posting date proves it (`NOT_AN_OWNER`).
4. Giver and receiver must differ (`SAME_SOURCE_DESTINATION`); amounts are positive whole rupees.
5. The receiver's place is required for `own`, refused for `expense`; categories must be active and of the right kind.
6. Another partner's capital never moves: drawings, capital and receivables name the one owner concerned.
7. Entries into another person's personal books follow D-029 (acknowledgement) like every posting.

## 5. Reports — no double counting

Within each entity's own books every amount appears once. In a combined view of several books (family or group
reports), the pairs this flow creates between two book-keeping entities — giver expense ↔ receiver income (`none`),
drawings ↔ investment, capital ↔ investment, receivable ↔ payable — are eliminated as internal; only expenses paid
to the outside world remain. Scenario 4 therefore shows one expense in a combined report, never two. (Implemented
with the reports module; the event and its journals carry everything needed to pair them.)

## 6. Purpose and validation matrix (D-039, GATE-RESPONSE-05)

The owner answered the three points this section used to ask (GATE-RESPONSE-05): a firm's expense must not become the
owner's income by itself, a non-repayable transfer must not be assumed to be the giver's expense, and owner-benefit
approval is an entity policy (D-040). The engine therefore asks for two more explicit answers on every gift of money,
and validates all four together:

- **Purpose** — what the money actually is: `loan`, `drawings`, `capital`, `distribution`, `remuneration`,
  `reimbursement`, `gift`, `donation`, `business_expense`, `personal_benefit`. A repayment of an existing debt is a
  settlement, not money given.
- **Repayable** — whether the receiver must pay it back. Separate from the purpose, and required.
- **Giver side / receiver side** — Own or Expense, as before (GATE-RESPONSE-04).

| Purpose | Repayable | Who → whom | Giver's books (Dr) | Receiver's books (Cr) |
|---|---|---|---|---|
| loan | must be yes | any → any | Inter-entity receivable (Own) | Inter-entity payable + open item |
| personal_benefit | yes or no | firm/pool → **its owner** | yes: receivable (Own) · no: expense category chosen (Expense) | yes: payable · no: **income category the owner chooses** |
| drawings | no | firm → **its owner** (person) | Owner drawings (Own) | Investment in firms |
| distribution | no | firm → **its owner** | 3160 Profit distributions (Own) — equity, not an expense | income category chosen (e.g. Profit share received) |
| capital | no | person → **a firm they own** | Investment in firms (Own) | Owner capital |
| remuneration | no | any → person or outside party | expense category chosen (Expense) | income category chosen |
| reimbursement | no | any → the person who spent it | expense category chosen (Expense) | **recovers** the receiver's expense category (Cr expense) — never income; receiver side must be Own |
| gift, donation | no | any → any, except into a firm the giver owns, or from a firm to its owner | expense category chosen (Expense) | income category chosen (e.g. Gift received) |
| business_expense | no | any → any (to an owner: a related-party payment) | expense category chosen (Expense) | income category chosen |

Rules the matrix enforces (each refusal says what to change):

1. A missing purpose, repayment answer, side, place or category is **CLASSIFICATION_REQUIRED** — never filled in.
2. A loan that is not repayable, or any other purpose that is (except a personal benefit), is a conflict.
3. Own is required where the giver keeps the value (repayable, drawings, capital, distribution); Expense where the money
   leaves for good (remuneration, reimbursement, gift, donation, business expense, a non-repayable personal benefit).
4. Income on the receiver's side appears only as the category the user chose for that purpose; a loan, drawing or
   capital receipt with an income category is a conflict.
5. Ownership is checked against `entity_ownership` (`is_owner_of`): drawings, distributions and personal benefits go
   only to an owner; capital only into a firm the giver owns; a firm does not give its owner gifts; an owner's money
   into their own firm is capital or a loan, not a gift.
6. Every refusal is raised before anything posts; nothing creates income, debt, capital or expense that the chosen
   purpose does not support (GATE-RESPONSE-05 §5).

The eight Own/Expense scenarios of §2 remain, each now reached with a purpose — tested in
`backend/tests/engine/give_test.ts`: F8 1 drawings / loan / distribution, F8 2 drawings or a repayable personal benefit
paying the owner's expense, F8 3 remuneration, F8 4 a non-repayable personal benefit paying the owner's bill; F9 5 loan
(and capital into the owner's firm), F9 6 loan spent by the receiver, F9 7 gift, F9 8 gift paying the receiver's bill.

**Owner-benefit approval (D-040)** applies on top: personal benefits, remuneration, distributions, drawings and
business expenses paid to an owner are related-party movements, and the entity's approval policy decides whether they
wait for an independent approver before posting.
