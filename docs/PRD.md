# Finly — Product Requirements (what and why)

Source of truth: [BUILD_PROMPT.md](source/BUILD_PROMPT.md) and add-ons [01](source/ADDON-01-production-free-backend-git.md)–[09](source/ADDON-09-premium-theme.md).
This document states the product; the [SRS](SRS.md) states the requirements in testable form.

## 1. The problem

One family runs several businesses (for example Mint and JSK) alongside personal and family money. Cash moves
between people, vaults (Tijori), wardrobes, lockers, banks and wallets; one location holds several owners' money;
people pay for each other and for the firms; advances, reimbursements and inter-firm loans pile up. Today nobody can
answer simple questions with confidence: *where is our money, whose is it, who holds it, why did it move, what is
owed?* Spreadsheets and chat messages lose history, mix personal and business money, and leak private amounts.

## 2. The product

**Finly** is a private family + business financial operating system for Android (BUILD_PROMPT F1). It feels like the
simplest money app on the phone — *money in, money out, from, to, why* — while a full double-entry ledger, a
permission engine and an audit trail run underneath.

> "Simple enough to enter in seconds. Powerful enough to explain every rupee months or years later." (B4)

## 3. Users and roles

| Role | Who (seed users, add-ons 06/07) | What they need |
|---|---|---|
| Super Admin + Owner | Krish | Configure everything; see the money he owns or is granted; manage users, roles, permissions, security |
| Admin | Shaileshbhai, Savan | Exactly the operational and configuration features granted to them |
| Worker / other role | Sujal, Devanshu, Heet, Sagar | Fast blind entry, their own entries, assigned accounts and tasks — nothing else |
| Family members, partners, auditors | Configured later | Read-only, share-based or time-limited access as the owner grants |

Roles are only baselines; the UI follows each person's actual permissions (add-on 06). Personal finance is private
to its owner by default — no other person, Super Admin included, sees it without the owner's grant (A4).

## 4. Goals

1. **Every rupee explainable** — any balance drills down to journal lines, the source transaction, documents and audit (AC13, H16).
2. **Financial integrity** — balanced double-entry journals, atomic posting, no partial saves, no duplicates, immutable history with reversal and correction (A5, H-A, J).
3. **Privacy by default** — owner-private personal finance, field- and amount-level visibility, totals computed only from what the viewer may see (A4, L).
4. **Fast daily use** — quick entry in a few taps, global search, minimal typing, one-hand use, works offline (A8, K-UX, P).
5. **Trusted proof** — generated messages, photo proofs and PDFs, verified before every external share; never screenshots (A3, Q).
6. **A premium, distinctive experience** — a design system with its own visual and motion language (K, add-ons 04, 08 and 09).
7. **Zero or near-zero running cost** on free infrastructure, for private non-commercial use (add-on 01).

## 5. Scope

**In scope now:** Android app (Flutter), one client-independent backend and database, everything in BUILD_PROMPT
Parts F–V and add-ons 01–09.

**Not in scope now (FUTURE, designed for but not built):** web client, iOS client, multi-currency, branches and
cost centres, receipt OCR, automated bank-statement matching, forecasting (Part Z).

**Never:** AI assistants, LLM calls, natural-language or voice entry (A2); screenshots as proof (A3); unverified
external sharing (Q3); a second database or duplicated business logic per client (A1).

## 6. Key journeys

1. **First launch** — splash → session check → sign in → change temporary password → M-PIN/biometric → role-aware setup wizard → dashboard (add-on 07).
2. **Quick entry** — unlock → + Add → Debit/Credit → From → To → Amount → Reason → review → post → share proof (P1).
3. **Find anything** — one tap to global search; `45000 Angadiya`, `Mint Tijori Oct`, `TX-20261008` (UX4).
4. **Where is the money** — dashboard and fund position: total, by place, by owner, by holder, permission-filtered (R1, H5).
5. **Expense event with splits and reimbursement** — the Angadiya visit: ₹45,000 paid by Krish, split Mint/JSK/personal, open items created and later settled (H9, AC10 ex. 4).
6. **Cash handover chain** — Mint money from Krish to Sujal to the Tijori, ownership unchanged (H10).
7. **Correct a mistake** — reverse or correct with an impact preview; never edit posted history (H15, G5).
8. **Reconcile the Tijori** — count, difference, investigation, approved adjustment (S).
9. **Month-end close** — the checklist reaches Clean, the period locks (J9, AC12).
10. **Share proof on WhatsApp** — authorised content → exact preview → security → recipient check → Verify & share (Q).
11. **Super Admin user management** — add, edit, change role, configure permissions, suspend, reset password or M-PIN, revoke devices, archive (add-ons 06/07).

## 7. Constraints

- Android only for now; support older Android versions where reasonably possible (add-on 01). Flutter + Dart (add-on 04).
- Free tiers only; Supabase preferred, evaluated against alternatives (add-on 01).
- Whole rupees only; Indian grouping; English, Hindi and Gujarati (H14, P8).
- Approval gates before stack, accounting model, schema and design/UX (C6). Every change is a tested commit (add-on 05).

## 8. Success measures

- Tap and time budgets for the top flows are met in UI tests and walkthroughs (UX2; budgets set at Gate 4).
- Zero invariant violations from the Integrity Verifier; every AC10 worked example passes as a test (AC6, V2).
- Zero hidden-data leaks across every role in the authorization and search test suites (V3, V7).
- Every Part X pre-production criterion is true before release.
