# Money language

How money looks everywhere — lists, details, reports, proof cards, PDFs, WhatsApp messages and notifications. One language, never redrawn per screen.

## Directions and states

Every financial state is told apart three ways at once: a glyph, a word and a colour. Colour alone never carries the meaning.

| Meaning | Sign | Glyph | Word (default label) | Colour / fill |
|---|---|---|---|---|
| Money in (Credit, Avak) | `+` | in-arrow | Money in | `money-in` / `money-in-soft` |
| Money out (Debit, Javak) | `−` | out-arrow | Money out | `money-out` / `money-out-soft` |
| Transfer (same owner, new place) | none | swap | Transfer | `transfer` / `transfer-soft` |
| Draft | — | edit | Draft | `transfer` / `transfer-soft` |
| Pending approval, posting | — | clock, sync | Pending approval, Posting… | `pending` / `pending-soft` |
| Rejected, blocked, failed | — | close, block | Rejected, Blocked | `blocked` / `blocked-soft` |
| Reversed, corrected | — | undo + struck amount | Reversed, Corrected | `reversed` / `reversed-soft` |
| Outstanding, overdue | — | hourglass | Outstanding, Overdue N days | `outstanding` / `outstanding-soft`; overdue uses `exception` |
| Posted, settled, reconciled | — | check, double check | Posted, Settled, Reconciled | `reconciled` / `reconciled-soft` |
| Exception, needs review | — | warning | Needs review | `exception` / `exception-soft` |

- **Direction is relative to the place being viewed.** One transfer is Money in (Avak) on the Tijori's statement and Money out (Javak) on the bank's statement — the same entry, two perspectives. Posting rules decide the accounting; labels never drive it.
- **Posted is the quiet default.** Rows show a badge for every other state; detail screens show all states.

## Writing amounts

- Whole rupees only, as exact integers from the server. **No paise, no decimals, no `.00`.**
- Indian grouping: `₹500`, `₹20,000`, `₹5,00,000`, `₹1,00,00,000`. The rupee sign always comes first, with no space.
- Signs: `+ ₹50,000` and `− ₹50,000` — the true minus `−` (U+2212), a narrow no-break space between the sign and `₹`, so they never split across lines. Plain balances and transfers carry no sign.
- A reversed entry keeps its original amount, struck through in `reversed`, beside a Reversed badge. The reversal is its own entry.
- Amounts never animate by counting up or down: a moving number shows values that never existed. A changed balance cross-fades.
- Screen readers hear words: "plus fifty thousand rupees, money in"; "four lakh eighty-two thousand rupees".

## When the viewer may not see the amount

The server decides and sends only what may be seen (BUILD_PROMPT L4). The client never receives a full amount it must hide.

| Mode | Shown as |
|---|---|
| Full | `₹4,82,000` |
| Rounded | `≈ ₹5 lakh` |
| Range | `₹4–5 lakh` |
| Hidden | eye-off glyph + "Amount hidden" |
| Existence only | eye-off glyph + "Restricted entry" |

## Totals only from what the viewer may see

A total is computed on the server from the viewer's authorised data, then shown — never computed from everything and then hidden. The same Mint money reads ₹12,00,000 to Krish, ₹8,00,000 to Father and ₹3,00,000 to a worker (BUILD_PROMPT L12). So:

- never draw a remainder segment, an "Other" bucket or a gap that hints at hidden money;
- never show counts, averages, trends, rankings or "last transaction" figures that include hidden items;
- breakdown bars are decoration; the legend states every value in words.

## The entry sentence

A transaction always reads as a sentence: **From → To**, amount, reason, date and time, who handled it, and its state. Example card line: "Mint → Tijori · + ₹5,000 · Cash received from Mint · 08 Oct 2026 · 10:15 AM · by Krish Patel".

## Ownership, place and holder are different words

Keep them apart in every label: **where** the money is (Tijori, Savan Bank), **whose** it is (Mint, JSK, Krish), **which fund** (Mint Operating Fund), **who holds it** right now (Sujal). "Mint's money in the Tijori, held by Sujal" — never "Sujal's money".
