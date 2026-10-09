# F8 and F9 — explained for the owner's decision

Requested in [gate response 03](source/GATE-RESPONSE-03-decisions-q1-q3-postgres.md) (Q4). Nothing here changes an
accounting rule: until the owner decides, the engine keeps the behaviour marked *applied meanwhile*. Notation:
`[Mint] Dr X / Cr Y ₹n` means a debit and a credit in Mint's books. Every example uses whole rupees.

---

## F8 — Firm money pays a personal expense of that firm's owner

### 1. The exact original question

From the Accounting Model Record, revision 3 ([DECISIONS.md](DECISIONS.md)):

> **F8** (flag) — When firm money pays a personal expense **of that firm's owner**, the app asks every time:
> *withdrawal* (owner drawings, nothing owed back) or *owner owes the firm* (open item, settled later). No default —
> *Interpretation, owner to confirm.*

It refines revision 2's flag F3 ("a personal expense paid from a business account can be recorded as *Due from
<person>* … or *Drawing* … Should Finly ask every time, or should each owner set a default?"), which the owner's F3
answer did not settle for the owner-of-the-firm case.

### 2. In simple words

Krish owns Mint. Krish pays his own dinner (₹5,000) with Mint's money. Two very different things could be true:

- **It was a withdrawal** — Krish took ₹5,000 out of *his share* of Mint, the way a partner takes money out of the
  business. Nothing is owed back; Krish's share of Mint is now ₹5,000 smaller.
- **It was a loan from Mint** — Krish *borrowed* ₹5,000 of Mint's money and will put it back. Mint now has a
  ₹5,000 receivable from Krish until he repays.

The money moved the same way in both cases; what differs is **who owns the ₹5,000 afterwards** and whether anything
is still owed. The question is whether Finly should ask which one every time, or let an owner set a default.

### 3. Example (Mint paid Krish's ₹5,000 dinner from the Tijori)

| | Option A — withdrawal | Option B — owner owes the firm |
|---|---|---|
| Mint's books | Dr Owner drawings – Krish ₹5,000 / Cr Cash (Tijori) ₹5,000 | Dr Inter-entity receivable – Krish ₹5,000 / Cr Cash (Tijori) ₹5,000 |
| Krish's personal books | Dr Food (personal expense) ₹5,000 / Cr Investment in Mint ₹5,000 | Dr Food (personal expense) ₹5,000 / Cr Inter-entity payable – Mint ₹5,000 |
| Open item | none | **Krish owes Mint ₹5,000** |
| Later | nothing | Krish repays (settlement), or the owners later agree to treat it as a withdrawal (an explicit, audited reclassification) |

### 4. Consequences

| | Option A — withdrawal | Option B — owner owes the firm |
|---|---|---|
| Mint's cash | −₹5,000 | −₹5,000 |
| Mint's assets | down ₹5,000 | unchanged (cash became a receivable) |
| Mint's equity (owners' capital) | Krish's capital account down ₹5,000 | unchanged |
| Krish's personal net worth | down ₹5,000 (he spent it; his stake in Mint is smaller) | down ₹5,000 (he spent it; he owes ₹5,000) |
| Receivable / payable | none | Mint receivable ₹5,000; Krish payable ₹5,000 |
| Settlement | none; never shows as outstanding | shows in Outstanding until repaid |
| Partners (Mint is also Father's) | only Krish's capital falls — Father's share is untouched | Mint as a whole is owed the money |
| Mint's profit | unchanged — it was never a business expense | unchanged |

Neither option makes it a Mint business expense, and neither touches Father's share.

### 5. Recommendation

**Ask every time (the current behaviour), and let each owner of a firm optionally set *their own* default that is
pre-selected — never silently applied.** The specification forbids guessing a classification between entities
(AC3: "ambiguous → require explicit user choice (or configured default visible in the preview and confirmed)"), and
the two choices mean different things for ownership. A default per owner fits how people actually behave (some owners
always take drawings, some always repay) without removing the confirmation.

**Applied meanwhile:** asked every time; refused without an answer (`CLASSIFICATION_REQUIRED`). Nothing else depends
on F8.

---

## F9 — "Through owner + Own": who owes whom?

### 1. The exact original question

From the Accounting Model Record, revision 3:

> **F9** (flag) — *Through owner + Own*: the firm's claim is on the owner (owner owes firm) and the owner's claim is on
> the non-owner (non-owner owes owner) — two linked journals — *Interpretation, owner to confirm.*

It interprets the owner's answer to F3 ([gate response 02](source/GATE-RESPONSE-02-f1-f7.md)): "Through owner = two
entries (Firm → Owner, Owner → Non-owner). Own is deducted immediately and settled later."

### 2. In simple words

Mint's money reaches Sujal (a worker, not an owner) **through Krish**: Krish takes ₹20,000 from the Tijori and gives
it to Sujal **as Sujal's own money** (to be paid back later). When Sujal pays it back, to whom does he owe it?

- **Option A (current reading):** two separate debts. Krish owes Mint (he took the money); Sujal owes Krish (Krish
  gave it to him). Each pays back the person they got it from.
- **Option B:** one debt. Sujal owes Mint directly; Krish was only the messenger who carried Mint's cash.

### 3. Example (₹20,000 from Mint's Tijori, through Krish, to Sujal as Sujal's own)

| | Option A — two linked debts (applied) | Option B — Sujal owes Mint; Krish only carried it |
|---|---|---|
| Step 1 | [Mint] Dr Inter-entity receivable – Krish / Cr Cash (Tijori) ₹20,000 · [Krish] Dr Cash with Krish / Cr Inter-entity payable – Mint ₹20,000 | [Mint] Dr Cash (with Krish) / Cr Cash (Tijori) ₹20,000 — Mint's cash, now in Krish's hand |
| Step 2 | [Krish] Dr Inter-entity receivable – Sujal / Cr Cash with Krish ₹20,000 · [Sujal] Dr Cash with Sujal / Cr Inter-entity payable – Krish ₹20,000 | [Mint] Dr Inter-entity receivable – Sujal / Cr Cash (with Krish) ₹20,000 · [Sujal] Dr Cash with Sujal / Cr Inter-entity payable – Mint ₹20,000 |
| Open items | **Krish owes Mint ₹20,000** and **Sujal owes Krish ₹20,000** | **Sujal owes Mint ₹20,000** |
| Krish's books | changed (a receivable and a payable) | untouched |

### 4. Consequences

| | Option A | Option B |
|---|---|---|
| Who carries the risk if Sujal never repays | Krish — he still owes Mint | Mint |
| Mint's receivable | from Krish (an owner) | from Sujal (a worker) |
| Krish's personal books | show both debts | unaffected |
| Settlement | Sujal repays Krish; Krish repays Mint (or a set-off when amounts match) | Sujal repays Mint |
| How it differs from "Directly from firm + Own" | genuinely different (a loan from Krish) | **identical in effect** to "Directly from firm + Own", except for who carried the cash |

### 5. Recommendation

**Option A — keep the current reading.** The owner's own answer describes Through-owner as two entries, *Firm →
Owner* and *Owner → Non-owner*, which is exactly two claims. Option B would make "Through owner + Own" the same as
"Directly from firm + Own" with Krish as a courier — and that case is already available: choose *Directly from firm*
and record that Krish carried the cash (a custody step). Keeping the two routes distinct gives the owner a real choice
of who bears the risk.

**Applied meanwhile:** Option A. Nothing else depends on F9.
