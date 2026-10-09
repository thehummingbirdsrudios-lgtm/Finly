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

"Own" never creates a debt, a loan, income or capital by itself. The arrangement says which it is:

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
3. A `drawings` or `capital` arrangement is refused unless ownership on the posting date proves it (`NOT_AN_OWNER`).
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

## 6. Points for the owner to confirm

These follow from the specification but are choices of meaning worth a look before the screens go live:

1. **Scenario 3 and 4 on the owner's side** ("Expense in the firm, Own/Expense in the owner's books") are recorded as
   personal **income** for the owner (e.g. remuneration), because the firm treated the money as its cost.
2. **Giver Own without repayment** is valid only as drawings (firm → its owner) or capital (person → a firm they own).
   Money given to anyone else without being owed back is recorded as the giver's expense (for example a gift).
3. **Partner protection for C:** a firm-side Expense for one owner's benefit reduces every partner's profit. Should it
   require approval by another owner when the firm has more than one? Not enforced until the owner decides
   (approval rules are configurable).
