# CLAUDE CODE — COMPLETE BUILD PROMPT
# PRIVATE FAMILY + BUSINESS FINANCIAL OPERATING SYSTEM
## Android-only • Built from scratch • No AI assistant • Double-entry-accounting-first • Simple-fast-UX-first • Edge-case-complete • Security-first • Privacy-first • Money-integrity-first • Configuration-first • WhatsApp-first

Paste this entire document into Claude Code. It is the single authoritative specification. Nothing in it is optional, illustrative-only, or "nice to have" unless explicitly marked **FUTURE**.

---

# PART A — AUTHORITATIVE OVERRIDES (READ FIRST — THESE WIN OVER EVERYTHING BELOW)

## A1. Scope
- **Build the complete production system from zero.** Nothing is assumed to exist: no database, no backend, no app, no design system, no documentation. You create all of it.
- **Android only** for the client right now.
- **Do NOT build iOS.** No iOS UI, builds, native integrations, tests, Apple-specific storage/auth APIs, or iOS-specific architecture.
- **Do NOT build the web app.** It is a FUTURE phase.
- The backend, database, financial engine, authorization model, security model, audit system and APIs must be **client-independent**, so a future web client and a future iOS client can be added later **without rewriting** any of them and **without duplicating** any business logic.
- One database. One backend. One financial truth. Forever.

## A2. No AI
- **NO AI ASSISTANT** of any kind.
- No natural-language financial assistant, no chat over financial data, no AI summaries, no AI explanations, no LLM calls, no AI-based search, no voice/natural-language entry.
- "Intelligence" in this product means **deterministic, explainable, rule-based** validation, anomaly detection, reconciliation checks, duplicate detection, missing-entry detection and configurable financial rules. These are required.

## A3. Proof and sharing
- **NEVER use a screenshot as financial proof.** Never tell a user to screenshot anything (transaction, balance, bill, proof card, report, PDF, secure document).
- Approved proof surfaces only: **generated Message, generated Photo Proof, generated PDF, Secure PDF, Secure Viewer** — all generated from **authorized structured data**.
- **No external financial share without:** authorization → recipient verification → exact-content preview → user review → user verification/step-up where policy requires → explicit final confirmation (**VERIFY & SHARE**).
- If content, recipient, permission, security policy or any material field changes after preview/verification → **invalidate the verification and require a new review.**

## A4. Personal finance privacy (latest rule — overrides any earlier "Super Admin / Family Admin can see personal finance" text)
- **Personal finance is private to its owner by default.**
- Only the owner can view and manage their personal finances by default.
- No other user — family member, worker, admin, **Super Admin**, company member — can access it unless the **owner explicitly grants permission**.
- Visibility is individually configurable **by the owner**.
- Every owner grant/revoke is audited.
- Personal finance is always kept separate from company/business finance.
- Super Admin can administer the system (accounts, roles, recovery) but **system administration ≠ financial visibility**.

## A5. Security and financial truth
- Backend is authoritative for financial truth, permissions, decryption, balances, ownership, ledger posting, audit and security policy.
- Frontend is **never** the security boundary.
- Every financial mutation passes the **complete precondition gate** and the **Impact + Conflict Engine** before posting.
- Sensitive financial values are protected with application-level **authenticated encryption**; passwords are **hashed**; encryption keys **never** ship to Android.
- Remember Me **never** stores the password. M-PIN is an **app-unlock credential**, not the account password. Biometric uses **Android secure platform authentication**.
- Super Admin can **never** retrieve another user's password, M-PIN, raw biometric data or master encryption keys.
- When financial truth, permission, recipient identity or security state is uncertain: **stop, deny, or require review. Never guess.**

## A6. Conflict-resolution rule for this document
1. Part A overrides everything.
2. Where two later sections differ, the **stricter** security/privacy/integrity reading wins.
3. Where something is genuinely ambiguous, choose the **safest architecture** that preserves financial integrity, security, permissions, privacy and the design system — record the choice in `docs/DECISIONS.md` and flag it to the user.
4. Do not reinterpret this into a smaller application. Do not omit requirements because they are complex. Do not invent conflicting requirements.

## A7. Finance & Accounting Expert Mode (applies to every financial feature)
- Think and design as a **senior accountant + financial systems architect + banking/ledger software expert**.
- Finance is **never** CRUD and **never** simple `amount +/- amount`. Every movement of value is recorded as a **balanced double-entry journal** under **Part H-A (Accounting Core)**, which is authoritative for ledger mechanics.
- These are distinct concepts and must stay distinct in schema, logic, UI and reports: **Account ≠ Fund ≠ Ownership ≠ Money Location ≠ Holder ≠ Transaction ≠ Ledger Entry ≠ Balance ≠ Outstanding ≠ Liability ≠ Receivable/Payable.**
- Every movement must be traced through its effect on: source, destination, ownership, ledger accounts, funds, balances, obligations (receivables/payables/advances/reimbursements/inter-entity dues), reconciliation, reports and audit history.
- Custom business terminology (Avak, Javak, Tijori, Rokda, Hissa, Khata…) is **preserved as display labels** over correct underlying accounting. Labels never change accounting logic.
- Financial values must remain **consistent, traceable, auditable and mathematically correct** across the entire system at all times.

## A8. Simple, Fast & Easy UI/UX (applies to every screen — Part K-UX)
- The app must feel like a **modern, extremely easy finance app**, never like accounting software — while supporting the full financial complexity underneath.
- UX priority order: **SIMPLE → FAST → CLEAR → FEW CLICKS → LOW COGNITIVE LOAD → ERROR PREVENTION → EASY DISCOVERY.**
- Search is extremely powerful, global and always permission-filtered.
- Navigation is obvious and consistent: users always know **where they are, what they can do, and how to go back.**
- Minimize forms, typing, screens and confirmations — but never remove a financial or security control. Safety controls are designed to feel light, never removed.

## A9. Exhaustive Edge-Case & Combination Handling (Part G-EC)
- Never design for the happy path only. Before implementing any module, build its **Edge-Case Matrix** covering every realistic combination of conditions.
- Every row is traced through: **INPUT → VALIDATION → AUTHORIZATION → DEPENDENCIES → IMPACT → CONFLICT → FINANCIAL RESULT → ATOMIC SAVE/ROLLBACK → AUDIT → UI RESULT.**
- Never allow: silent corruption, inconsistent balances, partial financial updates, permission leaks, duplicate posting, hidden-data leakage, or broken references.
- When rules conflict: apply the **safest financially correct and permission-safe** behaviour, explain the conflict clearly, and give the user a valid resolution path.
- Cover every realistic production scenario implied by this specification. Do not invent random complexity.

---

# PART B — YOUR ROLE, PRIORITIES AND MINDSET

## B1. Role
Act as: Senior Accountant (chartered-accountant-level finance and accounting expertise), Financial Systems Architect, Banking / Core-Ledger Software Expert, Principal Software Architect, Senior Backend Engineer, Senior Android Engineer, Database Architect, Security Engineer, Financial Systems Engineer, QA/Test Engineer, UI/UX Designer, Design-System Engineer, DevOps/Release Engineer, and FUTURE-web/iOS compatibility architect (architecture only).

Build a **real production-grade private financial operating system** — not a demo, prototype, mockup, CRUD app, spreadsheet replacement, basic expense tracker, or collection of disconnected screens.

It manages highly sensitive: personal finance, family finance, company finance, business funds, private funds, cash, Rokda, Tijori, vaults, wallets, bank accounts, income, expenses, transfers, outstanding, advances, reimbursements, fund allocations, ownership, cash handovers, financial reports, financial documents, WhatsApp financial communication.

## B2. Absolute priority order (when requirements conflict)
1. Financial integrity
2. Security
3. Privacy / confidentiality
4. Authorization
5. Data integrity
6. Data durability
7. Auditability
8. Reliability
9. Performance
10. Ease of use
11. Visual polish

Never sacrifice financial correctness or security for convenience. (Design-system quality is still a first-class requirement — see Part K — it simply never overrides 1–9.)

## B3. Zero-trust
Never assume the user, device, browser, frontend, network or API request is trustworthy. Never assume a logged-in user sees everything, an administrator sees all finances, a worker sees everything of a company, or a generated PDF is safe because the app produced it.

Use: **least privilege + explicit authorization + defense in depth + secure defaults + complete auditability.**

## B4. Product principle
> **"Simple enough to enter in seconds. Powerful enough to explain every rupee months or years later."**
> **"The owner decides what exists, what it means, who can see it, how much they can see, what they can do with it, and which financial information remains private — while every permitted user gets an extremely simple workflow."**
> **No transaction is accepted just because a user entered it. The system must prove it is valid, authorized, financially possible, safe to post, correctly recorded, appropriately protected and fully traceable before treating it as real.**

---

# PART C — HOW YOU WORK (EXECUTION PROTOCOL)

## C1. Never build the whole app in one uncontrolled step
Work in **small tasks** and **vertical slices** (e.g., "Entry → Validation → Balance check → Authorization → Commit → Ledger → UI update → Audit → WhatsApp proof"), not disconnected layers.

## C2. Per-task loop (mandatory)
**READ → UNDERSTAND → INSPECT → FLOW MAP → EDGE-CASE MATRIX → UX FLOW (taps, states, search entry points) → PLAN → IMPLEMENT → TEST → REVIEW → FIX → COMMIT → UPDATE DOCUMENTATION**

Before changing code, identify: existing implementation, dependencies, impact, risks, security implications, financial implications, database implications, screens affected, tests required, affected files.

After implementation: verify the complete impact chain, run all relevant tests (lint, type/static checks, unit, integration, build, E2E where applicable), review against PRD, SRS, ARCHITECTURE, DESIGN, RULES, SECURITY, TEST_PLAN, TASKS for: correctness, architecture, security, privacy, financial logic, error handling, performance, accessibility, responsive behaviour, duplication.

Compiling is not correctness. **Do not move to the next feature until the current one is genuinely production-ready.**

## C3. Debugging rule
On any failure, do not immediately patch. Determine: What failed? Why? Which layer? Which business rule? Which file? Smallest safe fix? How will it be tested? Then implement.

## C4. "Use brain before implementing any feature" — answer these for every feature
Why does it exist? Who uses it? Where/when does it appear? What data does it touch? Which permissions? Which security level? What happens before/after it? Offline? On failure? If the session expires? If the device is lost? If the user forgets the password / M-PIN? If biometrics change? If permissions change? If the account is disabled? If two users act simultaneously? Which audit event? Which financial records change? Which reports change? Which notifications change? Which WhatsApp/PDF behaviour changes? Is this financial proof or merely a UI screen? Does it require user verification before sharing? Could a screenshot accidentally expose or replace controlled proof? How will this work for the future web client?

Implement each feature across: **UI + UX + Android + Backend + Database + Security + Authorization + Financial Logic + Impact/Conflict + Audit + Offline + Error Handling + Recovery + Sharing Verification + Testing + Documentation.**

## C5. No half-finished features
Never leave: broken buttons, fake security, placeholder pages, fake balances, mock financial calculations, hard-coded companies, hard-coded permissions, unimplemented security controls, missing error/loading/offline states, raw API errors, unverified PDF layouts, silent financial changes, hidden partial failures, or placeholder business logic presented as finished. Every screen connects to the real backend, database, auth, authorization, financial logic, validation, security, audit and error handling.

## C6. Stop-and-ask gates
Stop and get explicit user approval before: (1) the technology stack (Part D), (2) the Accounting Model Record (Part H-A, AC19), (3) the final database schema, (4) the design-system foundation together with the UX blueprint (Part K-UX) and the master Edge-Case Matrix (Part G-EC), (5) any irreversible migration, (6) any change to posting-rule templates after go-live, (7) anything that changes a Part A rule.

---

# PART D — TECHNOLOGY STACK DECISION GATE

No stack is pre-chosen. Your first deliverable after the documentation skeleton is a **Stack Decision Record** in `docs/DECISIONS.md` that proposes and justifies (one primary recommendation + at most one alternative per layer):

- Android client: language, UI toolkit, architecture pattern, DI, navigation, local encrypted storage, platform-keystore-backed secret storage, Android biometric API, secure-screen handling, offline queue/storage, networking, image/PDF generation and preview.
- Backend: language, framework, API style + versioning, validation, background jobs.
- Database: engine with strong ACID transactions, row/version locking, constraints, migrations tooling.
- Cryptography: a mature, audited library for authenticated encryption and for password/PIN hashing; key-management service/approach with versioning and rotation.
- Secure document generation: PDF generation, PDF password + encryption support, watermarking, secure-viewer delivery.
- WhatsApp integration approach (share-intent vs. business API) and what delivery confirmation each can actually provide.
- File storage, push notifications, monitoring/error tracking, logging, CI/CD, backup tooling.
- Testing stack for every test category in Part T.

Selection criteria: security maturity, financial-transaction correctness, long-term maintainability, client-independence for FUTURE web/iOS, Android platform-security integration, cost, team simplicity.

**Do not scaffold until the user approves the stack.**

---

# PART E — PROJECT STRUCTURE AND DOCUMENTATION (CREATE FIRST)

```text
project/
├── docs/
│   ├── PRD.md            (what & why)
│   ├── SRS.md            (detailed functional/non-functional requirements)
│   ├── ARCHITECTURE.md   (how)
│   ├── DESIGN.md         (design system, visual + interaction behaviour)
│   ├── RULES.md          (how the coding agent must work)
│   ├── SECURITY.md       (protection requirements, threat model)
│   ├── TEST_PLAN.md      (what "working" means)
│   ├── DECISIONS.md      (every architectural decision + reason)
│   ├── MEMORY.md         (running project context)
│   └── FLOWS/            (one Flow Map per major feature — Part G)
├── <agent rules folder as originally specified: .cursor/rules/ — or the equivalent for the coding agent in use>
├── src/   (backend, android, shared contracts — per approved stack)
├── tests/
├── README.md
├── TASKS.md
├── .env.example
└── .gitignore
```

These documents are permanent project context. Read them before every task; update them after every task.

Git: small commits, descriptive messages, feature branches for larger changes. **Never commit** passwords, API secrets, encryption keys, production credentials, or real private financial data.

Environments: Development, Staging/Preview, Production. Never use production financial data during casual development.

---

# PART F — PRODUCT DEFINITION

## F1. What it is
A **Private Family + Business Money-Flow Management System / Financial Operating System** combining: personal finance + business finance + cash/vault management + bank movement + company transfers + funds/ownership + outstanding + reimbursements + advances + handover tracking + reconciliation + reporting + deterministic mistake detection + audit trail + secure WhatsApp proof — in one simple, secure system.

It is an **internal private system**, not a public accounting SaaS, not a sales app, not merely an expense tracker. It must not feel like traditional accounting software (journals, debit notes, ledgers exposed to users). Users think only: *money came in / money went out / from where / to where / who handled it / why.* The system handles accounting underneath.

## F2. The questions the system must always answer (permission-aware)
How much money exists? Where is it? Whose is it? Which company/fund? Who physically holds it? Who can see/enter/approve/change/share it? Why/when did it move? Who handled it? What happened afterwards?

Specifically: Where is my money? Where is Mint's / JSK's money? How much is in the Tijori / each bank? How much cash does each person hold? Who owns the cash in the Tijori? Where did this ₹50,000 come from / go? Personal or business? Which company / fund? How much is outstanding? Who owes whom? How much did I personally spend this month? How much did Mint / JSK actually spend? How much did I pay personally on behalf of Mint? How much should Mint reimburse me? Which expenses happened during the Angadiya visit and how was the ₹45,000 distributed? Why doesn't the Tijori balance match? What looks duplicated or suspicious? Who changed a transaction, what, when, who approved?

## F3. Example data (seed/test data ONLY — never hard-coded)
People: Krish Patel, Father, Brother, Sujal, workers, partners (e.g., Savan). Companies: JSK, Mint. Locations: Tijori, Wardrobe, Savan Bank, JSK Wallet, Office, Locker, Drawer. Places: Angadiya, Rajkot, Ahmedabad, Mumbai, Surat. These exist only as configurable records and test fixtures. **Never** as application constants.

## F4. Every transaction must be human-readable months later
Never "₹5,000 — adjustment". Always e.g.: *"₹5,000 came from Mint Company, was placed in the Tijori, handled by Krish Patel, on 8 October 2026 at 10:15 AM, because it was cash received from Mint."*

---

# PART G — FLOW MAPS + FINANCIAL IMPACT & CONFLICT ENGINE (MAIN ARCHITECTURAL RULE)

## G1. Flow Map first
**Never implement a financial feature without first documenting its complete impact chain** in `docs/FLOWS/<feature>.md`:

`INPUT / USER ACTION → AUTHENTICATION → AUTHORIZATION → VALIDATION → DEPENDENCIES / DEPENDENCY CHECK → IMPACT ANALYSIS → CONFLICT CHECK → FINANCIAL CALCULATION → ATOMIC COMMIT → AUDIT → UPDATED VIEWS / REPORTS / RELATED RECORDS`

Each Flow Map lists every screen, module, API, database table/record, report, notification, share artifact and audit event affected; failure paths; offline path; permission-change path; concurrency path.

## G2. Records are never isolated rows
A single change may impact: account balance, fund balance/ownership/allocation, company balance, outstanding, reimbursement, advance, inter-company balances, reconciliation, reports, history, linked/dependent transactions, notifications, share artifacts.

## G3. Impact propagation
When a record is **created, edited, reversed, corrected, re-allocated, ownership-changed, account-changed, or fund-changed**, the system computes **where the change impacts** and updates every valid dependent record **consistently and atomically**.
Example: `₹50,000 Transaction → Account → Fund → Company → Outstanding → Report` — all linked effects stay synchronized.

## G4. Conflict detection pipeline (before every save)
`Change Requested → Calculate Impact → Check All Dependencies → Check Financial Invariants → Check Permissions → Check Conflicts → Validate → Commit Atomically`

If the change conflicts with another record or rule: **DO NOT PARTIALLY SAVE.** Show a clear error stating: what conflicts, which record is affected, where the conflict occurs, why the change is invalid, what will be impacted, how the user can resolve it.
Example: **"Cannot change this transaction. This change would create an inconsistency between the Fund Balance and Account Balance."**
Conflict messages obey permissions: never reveal hidden records/amounts — say only what the user is authorized to know.

## G5. Impact Preview
For important edits/reversals/corrections/re-allocations/ownership changes show, before confirmation: **"This change will affect N records/areas"** and exactly what will change (before → after), limited to what the user may see. If anything hidden is affected, the user sees that additional authorized review is required, not the hidden detail.

---

# PART G-EC — EXHAUSTIVE EDGE-CASE & COMBINATION HANDLING

## EC0. Rule
Before implementing any module, create or extend its **Edge-Case Matrix**. Keep it in `docs/TEST_PLAN.md`, one section per module. Every row becomes an automated test where feasible; rows that can't be automated get a documented manual check. Design is never happy-path-only.

## EC1. Matrix row format
`ID · Condition combination · INPUT → VALIDATION → AUTHORIZATION → DEPENDENCIES → IMPACT → CONFLICT → FINANCIAL RESULT → ATOMIC SAVE / ROLLBACK → AUDIT → UI RESULT (exact message + resolution path) · Test reference`

## EC2. Dimensions to combine
- User + role + permission + ownership + confidentiality (including personal-finance owner-private rule, A4)
- Company + fund + account/location + holder
- Source + destination + transaction type + amount
- Cash + bank + wallet + physical money (Tijori, Wardrobe, holders)
- Personal + company + inter-company money
- Expense + allocation + reimbursement + advance + outstanding + settlement
- Create + edit + reverse + correction + settlement + allocation adjustment
- Draft + validating + pending approval + approved + rejected + cancelled + posted + reversed + corrected
- Multiple users editing / approving / reversing / settling the same record
- Duplicate submissions + retries + idempotency + app restarts
- Offline + online + sync + conflict + failed sync
- Network failure + server failure + database failure + timeout + unknown commit outcome
- Invalid, missing, partial, zero, negative, very large and decimal amounts
- Insufficient balance + reserved funds + locked funds + pending outgoing + overdraft rules
- Permission changes while a transaction or share is in progress
- User / account / fund / company / person / location / ledger account becoming inactive or archived
- Removed or changed relationships that existing records depend on
- Concurrent transactions affecting the same balance, fund, open item or period
- Reconciliation differences and mismatches
- Missing / invalid / corrupt / removed receipts or proof
- Share permission, content, recipient or policy changes after preview/verification
- Recipient verification failure, verification expiry, link expiry, revocation
- Session expiry + logout + device change + device revocation + security re-authentication
- Password / M-PIN / biometric / MFA failures, lockouts and recovery
- Financial history corrections, reversals, closed periods, re-opened periods
- Large datasets, empty datasets, first-time use, partial configuration
- Loading, timeout, empty, error, unauthorized, forbidden, conflict, locked, read-only, stale and recovery states

## EC3. Method
- Combine dimensions systematically (pairwise/combinatorial coverage across all dimensions), then add every **high-risk combination explicitly** (money + permission + concurrency + offline + period).
- Prune only impossible combinations, each with a written reason.
- Use property-based tests for financial invariants (Part H-A AC6) and fault injection for infrastructure failures.

## EC4. Conflict-resolution precedence (when two or more rules collide)
1. Part B2 priority order (financial integrity → security → privacy → authorization → …).
2. Deny beats allow; reject beats partial save; stricter security beats convenience.
3. Server state at commit time beats client state; permissions at commit time beat permissions at draft time.
4. Closed period beats backdating; posted history beats edits (use reversal/correction).
5. Always: explain the conflict in plain language (without revealing hidden data) and offer a valid resolution path (fix field, choose classification, request approval, wait/retry, contact owner, use correction flow).

## EC5. Mandatory handled cases (minimum — extend per module)
**Amounts:** missing → inline "Enter an amount"; zero → reject; negative → impossible in keypad and rejected by API; decimals/paise → rejected (whole rupees only) with a clear message; very large → configured maximum, overflow-safe integer handling, high-value approval/step-up; pasted/formatted text → normalized or rejected; splits/allocations → exact remainder rule, sum always equals total.
**Balances:** insufficient available balance; reserved; locked; pending outgoing already counted; overdraft per account rule; two concurrent spends → one succeeds, the other gets a clear retry message (with refreshed availability only if the user may see it).
**Lifecycle of master data:** source/destination/fund/company/person/user/ledger account becomes inactive or archived between draft and post → rejected at commit, draft preserved, clear message; archived items still render correctly in history; referenced items can only be archived, never deleted; foreign keys prevent orphans; a holder disabled while holding custody cash → exception + custody reassignment flow.
**Permissions:** revoked mid-entry → submit rejected, nothing further exposed; revoked while pending approval → approval re-checks; approver loses rights → cannot approve; maker = checker blocked where segregation of duties applies; access later revoked → recent searches, cached data and pending notifications no longer expose the item; View-As-User can never perform actions.
**Concurrency:** two users editing the same draft → version conflict screen (reload / compare / keep mine where allowed); simultaneous reversal of the same transaction → one succeeds, other sees "Already reversed"; reversing a reversed/corrected transaction → blocked; concurrent settlements exceeding remaining → only valid ones succeed; approval races; period close while postings are in flight → close waits or blocks until clear.
**Duplicates & retries:** double-tap, network retry, app restart, offline replay → idempotency key guarantees one posting; similar-but-distinct entries → duplicate warning, user may confirm with a reason (audited).
**Offline & sync:** actions not allowed offline shown disabled with the reason; queued item later fails validation (balance, permission, period closed, archived entity) → marked rejected with reason and fix/discard options — never silently dropped; sync conflict → review screen; device revoked while items are queued → server rejects them; logout with a pending queue → warning; device clock wrong → server time authoritative, device time kept as metadata; app killed mid-sync → resumes idempotently.
**Infrastructure failures:** timeout or network loss during commit → outcome resolved by an idempotency status check before any retry (never assume failure and repost); server or database error → full rollback; document/share generation failure → nothing sent; notification failure never affects posting; external delivery uncertain → shown as uncertain, not "Sent".
**State transitions:** an explicit allowed-transition table for draft → validating → pending approval → approved → posting → posted → reversed/corrected, plus rejected/failed/cancelled; editing a pending item returns it to validation and re-approval; rejection requires a reason.
**Corrections & periods:** reversal of a transaction in a closed period → posted in the current open period with reference; reversal of a transaction whose open items are already partly settled → blocked until settlements are unwound, with a guided path; reversal of an inter-entity movement reverses both sides atomically; re-opening a period requires privilege, reason, step-up and audit.
**Reconciliation:** positive, negative and zero differences; count taken while transactions are pending → compare against an as-of snapshot; repeated counts; resolved by a found missing entry vs an approved adjustment journal.
**Receipts / proof:** required receipt missing → draft allowed, posting/approval blocked per policy; invalid type, size or corrupt file → rejected with reason; receipt removed after approval → audited exception.
**Sharing:** permission, content, recipient, policy or confidentiality changes after preview → verification invalidated, regenerate; recipient contact changed → re-verify; verification expired → re-verify; link expired/revoked → correct viewer screens; WhatsApp unavailable or share cancelled → nothing recorded as sent; sharing a reversed transaction shows the reversed status.
**Authentication:** session expires mid-form → re-auth sheet, encrypted local draft preserved, resume where left; biometric failure/lockout → M-PIN; M-PIN lockout → password; forgotten password/M-PIN → reset flows; MFA device lost → recovery; biometric enrollment changed → re-enroll; step-up fails → action aborted, nothing posted.
**Data volume & setup:** brand-new organization (no firms/people/accounts) → guided setup; first transaction; partial configuration (e.g., no fund or ledger mapping) → posting blocked with setup guidance; very large histories → pagination and snapshot-based aggregates; very long names/reasons → truncation with full view; many companies/funds/accounts → searchable pickers.
**Personal / company / inter-company:** personal expense paid from a company account; company expense paid personally; cross-entity movement without classification → blocked until classified; mixed splits across companies and personal; owner-private personal details inside a shared transaction → field-level masking.

## EC6. Never allowed
Silent corruption · inconsistent balances · partial financial updates · permission leaks · duplicate posting · hidden-data leakage · broken references.

---

# PART H — DOMAIN MODEL

## H1. Independent dimensions (never collapse them)
1. **Money / Movement** — what amount moved, from where to where.
2. **Ownership** — whose money it is.
3. **Fund** — which fund owns/bears it.
4. **Location / Account** — where it is physically or logically held.
5. **Company / Business attribution** — which entity is involved/responsible.
6. **Event** — why it moved (expense, income, trip, visit, project…).
7. **Attribution** — which company/person/fund bears the cost.
8. **People** — who paid, held, received, handled, approved, entered.
9. **Visibility** — who may know it exists and see its details.
10. **Accounting effect** — ledger consequences.

Four-layer view: **Master data** (what exists) → **Money movement** (what physically happened) → **Ownership / fund allocation** (whose it is) → **Control / audit** (who, when, why, approved, changed, corrected, reconciled).

## H2. Ownership ≠ Location ≠ Visibility
- Tijori ₹10,00,000 may be owned Mint ₹4,00,000 / JSK ₹3,00,000 / Krish ₹2,00,000 / Father ₹1,00,000. Track **where** and **whose** independently; show account total **and** fund-wise allocation beneath it.
- Ownership relationships per object: **legal/business owner, economic owner, fund owner, operational owner, physical holder, custodian, private access controller**. Never assume these are the same.
- Owning money does not grant everyone visibility. Seeing a company does not mean seeing all its accounts/funds.

## H3. Person roles in money
Owner, Payer, Holder (current), Previous holder, Handler (entered/processed), Receiver/Recipient, Custodian, Approver, Creator. Example: Owner = Mint, Holder = Krish → Sujal, Handler = Krish, Location = Tijori, Approver = Father.

## H4. Companies / firms
Unlimited, configurable, never hard-coded. Each may have operating funds, owner funds, cash, banks, vaults, wallets, receivables, payables, private accounts, shared accounts. A newly created firm must work across the entire system immediately.

## H5. Funds
Unlimited: personal, company (Mint Fund, JSK Fund), owner fund, family, shared, restricted, reserve, travel, emergency, private, project. Each fund: owner(s), controller, status, visibility, confidentiality, transfer rules, reservations.
**Fund states:** Available, Reserved, Allocated, Spent, Outstanding, Locked. E.g., Mint total ₹10L but available ₹6L (₹2L reserved, ₹1L outstanding, ₹1L allocated).
**Fund position** answers "Where is Mint's money?" — e.g., Mint ₹12L = Tijori ₹4L + Savan Bank ₹3L + JSK ₹1L + Wardrobe ₹4L — **permission-aware** (owner sees all, worker sees only permitted operational funds).
**Fund lifecycle view:** Opening → Added → Transferred → Allocated → Spent → Returned → Current.
**Moving money between accounts does not change ownership** (Mint Bank → Tijori remains Mint Fund).
**Allocation adjustments** (ownership change without physical movement, e.g., Tijori ₹1L Mint → Mint ₹70k + Personal ₹30k) are a distinct, audited transaction type — always recorded as a balanced journal with an explicit classification (Part H-A, AC10 example 7), never a silent relabel of ownership.

## H6. Accounts / locations
Unlimited: Cash, Rokda, Vault/Tijori (main, office, secondary), Wallet, Bank (current, savings, company, personal), Credit Card, Loan, Receivable, Payable, Petty Cash, Temporary Holding, Locker, Wardrobe, Drawer, custom. Account types are configurable and may behave differently.
Account fields: ID, name, type, owner, company/person, category, currency (INR), opening balance, active/inactive/archived, visibility, discovery, confidentiality, location disclosure level, negative-balance/overdraft rules, reconciliation config. Bank accounts additionally: bank name, account name, masked account number (encrypted), reconciliation status.

## H7. Master transaction + ledger + posting engine
- One real-world event = **one Master Transaction** ("what actually happened"). Unique human ID, e.g., `TX-20261008-001245`.
- It generates linked **Ledger Entries**, **Fund Allocations**, ownership effects, outstanding, reimbursement, advance and inter-company effects, attachments, approvals, shared proofs, audit records. Every derived effect links back to the master transaction.
- **Posting engine** with **configurable posting rules** (per transaction type, company pair, fund rules, inter-company rules, expense allocation rules) — never hard-code accounting into the UI. E.g., JSK → Mint ₹20,000 may produce JSK outgoing, JSK inter-company ledger impact, Mint incoming — all tied to one master transaction.
- Traceability chain: **Fund → Account → Transaction → Ledger Entry → Expense/Allocation → Outstanding/Reimbursement → Settlement → Audit**, with drill-down from any balance.
- Ledger mechanics — accounting entities, chart of accounts, double-entry journals, dimensions, invariants, open items, period close, financial statements — are defined in **Part H-A** and are authoritative.

## H8. Transaction types (configurable, extensible)
Credit/Avak, Debit/Javak, Transfer, Deposit, Withdrawal, Expense, Income, Receive, Handover, Advance, Reimbursement, Settlement, Refund, Adjustment, Allocation Adjustment, Reversal, Correction, Opening Balance, Inter-company movement, custom types. Each type may define custom fields, validation, approval, posting rules, visibility and sharing policy.
Fields: master ID, type, debit/credit, from, to, amount, date (default now), time (default now), reason, handled by (default current user), owner/fund, company/person, category, tags, place, vendor, event, reference, attachments, notes, confidentiality, status, audit metadata.

## H9. Expenses
Types: personal, business, company, shared/family, split, reimbursable, non-reimbursable, advance-funded, project, trip, event. Capture: amount, paid from, who paid, for whom, company, person, category, reason, place, date, time, vendor, event/project/trip/visit, fund charged, reimbursement status, receipt/photo, notes.
**The payer is never automatically the bearer.**
**Expense Event** (trip, firm visit, Angadiya visit, customer/supplier visit, exhibition, travel, family event, project, meeting, purchase trip, other) groups many expense lines. E.g., Angadiya ₹45,000 = Travel ₹10,000 + Hotel ₹12,000 + Food ₹5,000 + Local ₹3,000 + Firm charges ₹8,000 + Other ₹7,000.
**Splits:** fixed amount, percentage, item-based. Allocations must total exactly 100% / exact amount.
**Reimbursement:** Krish pays ₹45,000; Mint ₹30,000 / JSK ₹5,000 / Personal ₹10,000 → Mint owes Krish ₹30,000, JSK owes Krish ₹5,000, Krish bears ₹10,000. Settlement Mint → Krish ₹30,000 links to the original expense.
**Advances:** ₹50,000 advance; actual spend ₹42,000 → ₹8,000 to be settled (returned or carried forward).

## H10. Cash handover
Chain e.g. **Mint Fund → Krish → Sujal → Tijori**. Each step records: amount, owner, from person, to person, previous/new holder, location, date, time, reason, evidence, confirmation/status, related transaction, approval if required. Ownership, holding and location are separate fields. A worker may see an operational handover while private fund attribution stays restricted.

## H11. Outstanding
Receivable, payable, customer, vendor, person, reimbursement, advance, inter-company. Each: original transaction, party, owner, company, fund, amount, paid, remaining, due date, status, settlement history, partial payments, visibility, confidentiality.

## H12. Inter-company
JSK and Mint are separate entities; JSK → Mint is an identifiable inter-company movement with configurable posting (including inter-company receivable/payable), validated for: both active, user allowed on both, inter-company allowed, posting rules, fund ownership, approvals.

## H13. Personal finance (owner-private by default — A4)
Per person: personal fund, cash, wallet, banks, income, expenses, transfers, outstanding, reimbursements, monthly spending, category spending, balance, distribution (e.g., Krish ₹4,50,000 = Savan Bank ₹2L + Cash ₹50k + Tijori allocation ₹1L + receivable ₹75k + other ₹25k). A personal expense paid from a business account: business-visible transaction may be visible; personal detail, fund attribution and reimbursement remain owner-restricted.

## H14. Money format
- Store and display **whole Indian Rupees only** as exact integers. **No decimals, no paise, no floating-point money, no hidden rounding.** Display in Indian grouping: `₹20,000` / `₹5,00,000` — never `₹20,000.00`.
- Any adjustment is an **explicit adjustment transaction**.

## H15. Immutable history, corrections, deletion
- Never silently overwrite or delete financial history. Use **Reversal, Correction, Adjustment, Versioning**. Example: Original ₹5,000 Mint → Vault; Reversal −₹5,000; Corrected ₹5,500. Full sequence visible.
- Referenced master data is **disabled/archived**, never destructively deleted; historical records keep working.
- **Opening balances** are distinct records: date, amount, source, fund, reason, note, created by.
- **Period locking:** closed periods (e.g., October 2026) cannot be modified by normal users; corrections need permission, reason, audit, approval where configured.

## H16. Core invariant
**Every balance must be explainable:** `Opening + Credits − Debits ± Adjustments = Current Balance`. Fund ownership and account location must reconcile per configured rules. Money never appears or disappears without an explainable event. Custom configuration can never create money or bypass invariants.

---

# PART H-A — ACCOUNTING CORE (FINANCE & ACCOUNTING EXPERT MODE)

## AC0. Mindset
Design this as a core-ledger system, not an app with an `amount` column. One real-world event → one Master Transaction → one or more **balanced journal entries** → journal lines carrying every financial dimension. Every balance anywhere in the system is a **derivation of posted journal lines**. Nothing changes a balance except a posted, balanced, audited journal.

## AC1. Glossary — distinct concepts (put this in `docs/SRS.md` and enforce it in code)
| Concept | Meaning | Is NOT |
|---|---|---|
| **Accounting Entity** | A party that keeps its own self-balancing books: each company/firm, each person with personal finance, and any configured pool (e.g., Family Fund pool). | A user account or a money location. |
| **Ledger Account** (Chart of Accounts) | A classified bucket in an entity's books: asset, liability, equity/net assets, income, expense. | The user-facing "Account/Khata". |
| **Money Location** (user-facing "Account/Khata": Tijori, Savan Bank, JSK Wallet, Wardrobe) | Where value physically/logically sits. Maps to **asset ledger accounts** — one per owning entity holding value there. | Ownership. A location can hold several entities' money. |
| **Fund** (Hissa) | A designated/restricted pool of an entity's net assets (operating, owner, reserve, travel…), tracked as a dimension on every line. | A location or an entity. |
| **Ownership** | Which entity (and fund) has the economic claim to value. Determined by which entity's books the asset sits in. | Physical custody. |
| **Holder / Custodian** | The person physically holding cash at a moment. Custody, not ownership. | The owner or the handler. |
| **Master Transaction** | The real-world event ("₹45,000 Angadiya visit"). | A journal entry. |
| **Journal Entry** | One balanced accounting record within the Master Transaction (Σ debits = Σ credits). | A single row with an amount. |
| **Ledger Entry / Journal Line** | One debit or one credit to one ledger account with its dimensions. | A transaction. |
| **Balance** | Σ posted lines for an account (and dimensions) as of a date. Derived, never typed. | A stored editable number. |
| **Outstanding (Open Item)** | An unsettled obligation document with original amount, settlements and remaining amount. | The ledger account it posts to. |
| **Receivable** | Asset: someone owes this entity. | Income. |
| **Payable** | Liability: this entity owes someone (vendor, person, entity). | Expense. |
| **Liability** | Any present obligation: payables, inter-entity due-to, reimbursements payable, loans, advances received. | Only "payables". |
| **Advance** | Asset of the giver: money handed out to be accounted for later. | An expense at the time it is given. |
| **Reimbursement** | Payable of the entity that benefited, receivable of the person who paid. | A transfer. |
| **Settlement** | A journal that reduces/closes an open item and is matched to it. | A new unrelated payment. |
| **Transfer** | Movement between asset ledger accounts (same entity) — no income/expense effect. | Cross-entity movement (that needs classification). |
| **Allocation** | Assignment of an amount to funds/entities/categories. | A physical movement. |
| **Adjustment** | An explicit, approved journal correcting a known difference. | A balance overwrite. |
| **Reversal** | Exact mirror journal of an original (sides swapped, same dimensions), linked to it. | A delete. |
| **Correction** | Reversal + new correct journal, linked. | An edit of a posted line. |
| **Reconciliation** | Comparison of ledger balance to an external/physical truth with investigation and resolution. | Changing the ledger to match. |
| **Closing balance** | Opening + period movements for a closed period; becomes next opening. | A manually entered figure. |

## AC2. Terminology mapping — preserve labels, keep accounting correct
- User-facing **Credit / Avak** = money **into** the selected location; user-facing **Debit / Javak** = money **out of** the selected location. These are **direction-of-money labels relative to the location being viewed**, not accounting debit/credit.
- Accounting reality: money into an asset location = **accounting DEBIT** to that asset ledger account; money out = **accounting CREDIT**. The engine maps every user action to correct Dr/Cr lines via posting rules.
- One transfer appears as **Avak** on the destination's statement and **Javak** on the source's statement — same Master Transaction, same journal.
- The user-facing word "Account/Khata" means **money location**; internally always distinguish it from **ledger account**. Document the mapping in `docs/DESIGN.md` and the glossary.
- UI labels never drive sign logic directly; only posting rules do.
- When a user selects a company/person as "From" (e.g., "From: Mint") without a specific location, the posting needs a concrete source ledger account: the form must resolve it to a specific location/ledger account (default from configuration or recent use) or ask. Never post against a vague entity.

## AC3. Accounting entities and cross-entity rules
- Every company/firm, every person with personal finance, and every configured pool is an **accounting entity with its own self-balancing books**. Every journal balances **per entity**.
- Value crossing between entities **must** carry an explicit classification, chosen from configured options and required at entry when ambiguous:
  - **Inter-entity loan / transfer** → giver: Dr *Due from <entity>* / receiver: Cr *Due to <entity>*.
  - **Settlement** of an existing due/reimbursement/advance → reduces the matched open item.
  - **Capital contribution** / **Drawing / distribution** (owner ↔ company).
  - **Expense** of the payer / **Income** of the receiver (e.g., salary, payment for services).
  - **Gift / family support** (personal ↔ personal or pool) if configured.
- Never guess the classification; ambiguous → require explicit user choice (or configured default visible in the preview and confirmed).
- **Reciprocity invariant:** Entity A's *Due from B* balance must equal Entity B's *Due to A* balance at all times.

## AC4. Chart of accounts (per entity, template-driven, fully configurable)
Classes and normal balances:
- **Assets** (normal Dr): Cash at each location (e.g., Cash – Tijori, Cash – Office, Cash – Wardrobe), Bank accounts, Wallets, Cash in custody/transit (if custody modelled as accounts — AC19), Receivables (by party sub-ledger), Due from entities, Advances to persons, Reimbursements receivable, Deposits.
- **Liabilities** (normal Cr): Payables (by party), Due to entities, Reimbursements payable, Advances received, Loans.
- **Equity / Net Assets** (normal Cr): Owner capital, Drawings (contra, normal Dr), Opening Balance Equity, Retained / Accumulated Surplus, Fund balances (by fund).
- **Income** (normal Cr): by configured income categories.
- **Expenses** (normal Dr): by configured expense categories (Travel, Hotel, Food, Fuel, Salary, Rent, Firm Charges, Bank Charges…), plus Cash Over/Short, Write-offs.
- **Suspense** (must be cleared; aging is an exception).
- **Control accounts + sub-ledgers:** Receivables by party, Payables by party, Advances by person, Reimbursements by person, Due to/from by entity, Custody by holder. Sub-ledger totals must equal their control account.
- Each money location maps to **one asset ledger account per owning entity holding value there**. A shared Tijori with Mint, JSK, Krish and Father money = four asset ledger accounts (one in each entity's books); **location total = Σ those accounts** (shown only to the extent the viewer is authorized — Part L12).
- Default chart-of-accounts templates per entity type (company, person, pool) are proposed in the Accounting Model Record (AC19) for approval; Super Admin can extend/rename/disable (never delete referenced) ledger accounts; renames are labels over stable IDs.

## AC5. Dimensions on every journal line
Entity · ledger account · side (Dr/Cr) · amount (positive whole rupees, encrypted) · **fund** · **location** · **holder/custodian** · counterparty (entity/person/customer/vendor) · business attribution (company) · category · event/trip/project · place · tags · confidentiality · transaction date · master transaction ID · journal ID.
- **Fund accounting:** fund is mandatory on every line. Within an entity, each fund's lines balance (fund-balancing) or balance through configured inter-fund accounts (AC19 decision). **Fund balance = fund assets − fund liabilities.** "Where is Mint's money?" = Σ Mint-entity asset lines grouped by location (and fund), permission-filtered.
- **Ownership of a location's cash** = Σ asset lines at that location grouped by entity + fund.
- **Custody** = holder dimension (or custody sub-accounts, per AC19); a holder statement shows "whose money each person is holding".

## AC6. Hard posting invariants (enforced by the posting engine before every commit, re-verified by the integrity verifier)
1. Every journal has ≥ 2 lines; every line references a journal and a Master Transaction.
2. **Σ Dr = Σ Cr** per journal, **per entity**, and **per fund** (when fund-balancing is enabled).
3. Line amounts are **positive integers** (whole rupees); direction is expressed only by side (Dr/Cr). No negative line amounts, no zero lines, no decimals, no floats.
4. Posted journals and lines are **immutable**; changes only via reversal/correction/adjustment journals.
5. Account balance (any dimension slice, any date) = Σ posted lines; maintained snapshots must equal recomputation.
6. Sub-ledger totals = control account balances.
7. Inter-entity dues reciprocal (AC3).
8. Location total = Σ entity cash-at-location accounts; fund totals reconcile to entity net assets.
9. Open item remaining = original − Σ matched settlements, and 0 ≤ remaining ≤ original.
10. Allocations/splits sum **exactly** to the source amount (AC10 remainder rule).
11. Trial balance balances for every entity and every period.
12. No posting into a closed period; no posting to inactive/archived ledger accounts; no posting that breaks a negative-balance rule.
13. Opening Balance Equity and Suspense are tracked and flagged until cleared/explained.
Any violation → **reject the whole operation** with a clear conflict message (Part G4). Never auto-fix.

## AC7. Encrypted amounts vs ledger mathematics
- Because amounts are encrypted at the application level (Part M), the database cannot `SUM` ciphertext or enforce Σ constraints itself. Therefore:
  - The **posting engine** decrypts in protected backend memory, builds the journal, validates all AC6 invariants, and commits journal + lines + **encrypted, versioned balance snapshots** + open-item updates **in one database transaction** with row-version (optimistic) or row locks.
  - A scheduled + on-demand + pre-close **Integrity Verifier** recomputes every balance from lines and checks all AC6 invariants; any mismatch raises a **Critical** exception, optionally freezes writes per policy, and is never auto-fixed.
  - Journals are **hash-chained** (each journal stores a hash of its canonical content + the previous journal hash) for tamper evidence; the verifier validates the chain.
  - Aggregations for dashboards/reports run in the backend over the user's authorized dataset only (Part L12).
- Record the chosen approach, performance plan (snapshots per account × dimension × period) and trade-offs in `docs/DECISIONS.md`. Any plaintext numeric representation requires formal security review and explicit approval.

## AC8. Dates and periods
Transaction (value) date · posting date · entry timestamp · approval timestamp — stored separately. Period assignment by transaction date. Posting into a closed period is forbidden: the correction posts in the current open period referencing the original. Backdating limits configurable and audited.

## AC9. Balances shown to users
- **Current (posted) balance**, **Pending** (submitted/pending approval), **Reserved**, **Locked**, **Available** = Current − Reserved − Locked − pending outgoing − other committed obligations.
- Pending outgoing amounts **count against available balance from submission** (so approvals can't overspend).
- Display normal-balance-aware signs in friendly language; contra accounts shown correctly; forbidden negatives blocked before posting.

## AC10. Worked postings — mandatory, become automated test fixtures
(Entity in brackets; "Cash–X" = asset account for location X in that entity's books; fund shown where relevant.)

1. **Cash moved within Mint (Mint Bank → Tijori ₹5,000, Mint Operating Fund)** — [Mint] Dr Cash–Tijori 5,000 / Cr Bank–Mint 5,000. Ownership and fund unchanged. Statements: Avak in Tijori, Javak in Mint Bank.
2. **Tijori → Savan Bank deposit ₹5,000 (Mint money)** — [Mint] Dr Bank–Savan 5,000 / Cr Cash–Tijori 5,000.
3. **JSK → Mint ₹50,000, classified inter-entity loan** — [JSK] Dr Due from Mint 50,000 / Cr Bank–JSK 50,000; [Mint] Dr Bank–Mint 50,000 / Cr Due to JSK 50,000. Reciprocity holds. If classified as settlement of an existing Mint→JSK due, it instead reduces that open item.
4. **Angadiya visit ₹45,000 paid personally by Krish; allocation Mint ₹30,000 / JSK ₹5,000 / Personal ₹10,000** (item lines: Travel 10,000, Hotel 12,000, Food 5,000, Local 3,000, Firm charges 8,000, Other 7,000; allocated per chosen split method with the remainder rule):
   - [Krish] Dr Personal expenses (by category) 10,000; Dr Reimbursement receivable – Mint 30,000; Dr Reimbursement receivable – JSK 5,000 / Cr Bank or Cash–Krish 45,000.
   - [Mint] Dr Expenses (by category) 30,000 / Cr Reimbursement payable – Krish 30,000.
   - [JSK] Dr Expenses (by category) 5,000 / Cr Reimbursement payable – Krish 5,000.
   - Open items created: Mint owes Krish 30,000; JSK owes Krish 5,000.
   - **Settlement Mint → Krish ₹30,000:** [Mint] Dr Reimbursement payable – Krish / Cr Bank–Mint; [Krish] Dr Bank–Krish / Cr Reimbursement receivable – Mint; open item closed and matched to the original expense.
5. **Advance ₹50,000 from Mint to Krish for a Mint trip; actual spend ₹42,000; ₹8,000 returned** — [Mint] Dr Advance to Krish 50,000 / Cr Cash–Tijori 50,000 → on expense report Dr Expenses (by category) 42,000 / Cr Advance to Krish 42,000 → on return Dr Cash–Tijori 8,000 / Cr Advance to Krish 8,000 (or carry forward, open item remains 8,000). The advance is **not** an expense when given and **not** Krish's personal money — it never enters Krish's personal net worth; it is Mint's asset in Krish's custody/accountability.
6. **Handover — Mint ₹50,000 held by Krish → Sujal → Tijori** — custody movement only within Mint: [Mint] Dr Cash (holder Sujal) / Cr Cash (holder Krish); then Dr Cash–Tijori / Cr Cash (holder Sujal). Entity net assets, ownership and fund unchanged; holder chain recorded. (Exact shape follows the AC19 custody decision.)
7. **Allocation change inside Tijori ₹1,00,000 Mint → Mint ₹70,000 / Krish personal ₹30,000** — this moves value between entities, so it requires classification: e.g., as owner drawing: [Mint] Dr Drawings – Krish 30,000 / Cr Cash–Tijori 30,000; [Krish] Dr Cash–Tijori 30,000 / Cr Owner distributions received (equity) 30,000. As loan: due-to/due-from per AC3. Physical cash did not move; ownership did — and the books prove it. **Between two funds of the same entity:** inter-fund transfer lines (Fund A Dr Inter-fund transfer out / Cr Cash; Fund B Dr Cash / Cr Inter-fund transfer in), entity total unchanged.
8. **Personal expense ₹5,000 paid from Mint Bank** — [Mint] Dr Drawings – Krish (or Due from Krish, per configured policy) / Cr Bank–Mint; [Krish] Dr Personal expense / Cr Owner distributions received (or Due to Mint). The exception engine flags it as personal/business for review; personal detail stays owner-private.
9. **Income** — Dr Bank / Cr Income:category. **On credit:** Dr Receivable – party / Cr Income; receipt: Dr Cash/Bank / Cr Receivable – party (open item matched).
10. **Vendor bill and payment** — Dr Expense / Cr Payable – vendor; partial payment Dr Payable / Cr Bank (remaining derived).
11. **Reconciliation shortfall ₹2,000 at Tijori** — no automatic entry. After investigation, if unresolved and approved: Dr Cash Over/Short (expense) or Suspense 2,000 / Cr Cash–Tijori 2,000, linked to the reconciliation record. Suspense must later be cleared; aging suspense = exception.
12. **Opening balance** — Dr Cash–Tijori (entity, fund) / Cr Opening Balance Equity; OBE should be reclassified to capital/fund balance; non-zero OBE after setup is flagged.
13. **Reversal** — exact mirror journal (sides swapped, identical dimensions) referencing the original; original status → Reversed. **Correction** — reversal + new journal, linked. If the original's period is closed, both post in the current open period with references.
14. **Write-off of an uncollectible receivable** — approved only: Dr Write-off expense / Cr Receivable – party; open item closed as written off.
- **Split remainder rule (whole rupees):** percentage/ratio splits use a deterministic largest-remainder method with a documented tie-break so the parts sum **exactly** to the total; the split preview shows final rupee amounts before saving.

## AC11. Open-item (outstanding) management
Every receivable, payable, advance, reimbursement and inter-entity due is an **open item** linked to its originating journal line. Settlements are matched (full, partial, one-to-many, many-to-one) and recorded as match records; **remaining is derived, never typed**. Aging buckets, due dates, status (Open / Partially settled / Settled / Written off). Open-item sub-ledger totals = control account. Settlement of a reimbursement/advance always references the original.

## AC12. Period close
Per entity, per period (month by default). Close checklist (Month Close Assistant, Part J9): trial balance balanced; sub-ledgers = control accounts; cash/bank reconciliations done; suspense cleared or explained; OBE explained; inter-entity dues reciprocal; no pending approvals dated in the period; integrity verifier clean. Then close: closing method per AC19 (closing journals rolling Income/Expense into Retained/Accumulated Surplus per fund, or a virtual close). Closing balances become next-period opening balances automatically. Re-opening requires high privilege, reason, step-up and audit.

## AC13. Explainability
Every number drills down: figure → journal lines → journal → Master Transaction → source documents/attachments → audit trail. An **"Explain Balance"** view shows Opening + each movement = Closing for any account/fund/location/holder/period, within the viewer's permissions.

## AC14. Financial statements (per entity and per fund, permission-aware)
Trial Balance · General Ledger · Ledger-account / money-location statement (with Avak/Javak labels) · Balance Sheet (assets, liabilities, equity/fund balances) · Income & Expenditure (P&L) · Money-flow / cash-flow statement · Fund statement (opening, in, out, inter-fund transfers, closing) · Receivable / payable / advance / reimbursement aging · Inter-entity due reconciliation · Custody/holder statement (who holds whose money) · Location statement (e.g., Tijori total with entity/fund breakdown) · Expense-event statement. **Consolidated group/family view** across entities with inter-entity eliminations — only across entities fully visible to the viewer, so eliminations can never reveal hidden entities; otherwise show per-entity only.

## AC15. Posting-rule templates
Each transaction type maps to a versioned posting-rule template: line roles (source asset, destination asset, expense-category account, counterparty receivable/payable, due-to/due-from, fund lines), required classifications, dimension requirements and validations. Templates are validated at save by running sample postings that must balance; changes are versioned and audited; admins get a **journal preview** of what a template produces. Templates can never produce an unbalanced or invariant-breaking journal.

## AC16. Accounting view in the UI
Normal users never see Dr/Cr jargon — they see Money In / Money Out / From / To. Authorized finance roles (L4/L5 detail level) can open an **Accounting View** of any transaction showing its journal lines and dimensions. The Impact Preview (Part G5) lists affected ledger accounts, funds, locations, holders and open items in plain language.

## AC17. Deterministic accounting exceptions (feed Part J8)
Unbalanced or failed-invariant attempts (logged), non-reciprocal inter-entity dues, sub-ledger ≠ control, snapshot ≠ recomputation, broken hash chain, aging suspense, non-zero OBE, open items overdue, advances unsettled beyond threshold, reimbursements unpaid beyond threshold, negative balance on accounts where unusual, cross-entity movement without settlement trail, personal expense paid from business, allocation not summing exactly.

## AC18. Accounting tests are part of the Definition of Done (see Part V2)

## AC19. Accounting Model Record (decisions — present options with one recommendation each, then STOP for user approval)
1. Accounting basis: cash, accrual, or hybrid (outstanding/receivable/payable modules require at least accrual-capable recognition).
2. Default chart-of-accounts templates for company, person and pool entities.
3. Custody modelling: holder as a dimension on cash lines vs custody sub-accounts.
4. Fund balancing inside an entity: strict per-fund self-balancing vs inter-fund due accounts.
5. Default classification and allowed options for cross-entity movements (AC3), including personal expenses paid by a business (drawing vs due-from).
6. Period-close method: closing journals vs virtual close; period length.
7. Balance-snapshot and aggregation strategy under application-level encryption (AC7).
8. Split remainder rule and tie-break.
9. Treatment of advances held by persons (accountable advance receivable — default; or custody).
Record the approved model in `docs/DECISIONS.md` and the glossary in `docs/SRS.md`. Do not build the ledger until approved.

---

# PART I — DATABASE (DESIGN FROM SCRATCH)

## I1. Principles
Relational, ACID, strong constraints, foreign keys, stable internal IDs, versioned migrations from the first commit, row versioning for optimistic concurrency, no destructive deletes of referenced financial data, encrypted sensitive columns (Part M), no unnecessary plaintext shadow copies (no `amount_plaintext` beside `amount_encrypted` unless formally reviewed and recorded in DECISIONS.md), keyed/tokenized protected search indexes where search on sensitive fields is required, pagination-friendly indexes. Never design the core as `Date | Amount | Reason`.

## I2. Entities (minimum — design full columns, keys, constraints, indexes, encryption flags)
Users · Roles · Permissions · Permission Policies / Access Policies · Policy rules (explicit deny/allow, inheritance, exceptions) · Temporary access grants · Break-glass records · Personal-finance owner grants · Companies/Firms · Company memberships · People · Person types / Worker types · Customers · Vendors/Firms · Funds · Fund ownership · Fund reservations/locks · Accounts · Account ownership · Account types · Banks · Locations · Places · Projects · Trips / Expense Events · Categories / Subcategories · Expense types · Income types · Transaction types · Tags · Statuses · Confidentiality levels · Custom fields (definitions + values) · Custom labels (+ translation keys) · Custom forms + conditional rules · Master Transactions · Transaction lines · Ledger entries · Posting rules · Fund allocations · Allocation adjustments · Expenses · Expense lines · Expense splits · Advances · Reimbursements · Outstanding · Settlements · Handovers · Opening balances · Periods (open/closed) · Approvals / approval workflows / thresholds · Workflow rules · Reconciliation records (expected, actual, difference, investigation, resolution, adjustment, approval) · Exception/anomaly findings · Attachments · Reports / report definitions · Dashboard configurations · Documents · Document versions · Share profiles · Share events / share history · Share verifications (content hash, recipient, security config, expiry) · Secure-viewer links (expiry, revocation, access log) · Message / photo / PDF templates · Security policies (OFF / DEFAULT ON / MANDATORY per control, hierarchy level) · Notification rules · Notification events · Devices · Sessions / refresh tokens (hashed) · M-PIN credentials (protected representation, attempts, lockout) · Biometric enrollment state (no biometric data) · MFA factors · Recovery methods / codes (hashed) · Login history · Security events · Idempotency keys · Audit logs (tamper-evident) · Encryption key metadata (key version/ID only — never keys) · Retention policies · System settings · Emergency lock state · Offline sync records.

**Accounting core (Part H-A):** Accounting entities (companies, persons with personal finance, configured pools) · Chart of accounts / ledger accounts (class, normal balance, parent/control account, entity, status, stable ID, label) · Chart-of-accounts templates · Money-location ↔ ledger-account mappings (per entity) · Journal entries (master transaction, transaction date, posting date, period, status, reversal-of, correction-of, posting-rule version, content hash, previous hash) · Journal lines (side Dr/Cr, encrypted positive whole-rupee amount, ledger account and all AC5 dimensions: entity, fund, location, holder/custodian, counterparty, attribution, category, event, place, tags, confidentiality) · Encrypted, versioned balance snapshots (account × dimension × period) · Open items + settlement match records · Inter-entity due pairs · Custody records · Fund balances · Accounting periods, close records, closing journals · Posting-rule templates (versioned) · Split/allocation records with remainder · Integrity-verification runs and findings.

## I3. Approval gate
Present the full schema (ERD + table definitions + encryption map + index plan + invariants) for user approval before implementing it.

---

# PART J — FINANCIAL ENGINE

## J1. Simple daily entry (UI) vs rigorous engine (backend)
UI: **Debit / Credit → From → To → Amount → Reason → Save**. The client submits the **requested operation**; it never submits resulting balances (`new_balance = ₹9,50,000` is never trusted). The backend computes all resulting state.
The user-facing **Credit/Avak** and **Debit/Javak** labels describe the direction of money for the selected location; the engine converts every operation into balanced double-entry journals via posting rules (Part H-A, AC2/AC15). UI labels never drive sign logic directly.

## J2. Mandatory precondition pipeline — NOTHING posts until ALL pass
1. Authenticate user. 2. Validate session. 3. Validate device/session policy. 4. Authorization. 5. Discovery permission. 6. Transaction-type validation. 7. Source account validation. 8. Destination validation. 9. Company relationship validation. 10. Fund validation. 11. Ownership validation. 12. Authoritative current balance (recheck at commit — never trust what the user saw). 13. Available balance. 14. Reserved/locked funds. 15. Overdraft / negative-balance policy. 16. Account rules. 17. Amount rules. 18. Duplicate / idempotency check. 19. Concurrency check. 20. Approval requirements. 21. Required fields. 22. Attachment validation. 23. Confidentiality / shareability. 24. Business rules. 25. Cross-entity classification present (Part H-A AC3). 26. Build the balanced journal(s) from the posting-rule template. 27. Validate all accounting invariants (AC6) — per journal, per entity, per fund, reciprocity, sub-ledger/control, open items, exact splits, open period. 28. Financial invariants. 29. Impact + conflict analysis (Part G). 30. Atomic commit (journal + lines + balance snapshots + open items + allocations + audit, one database transaction).

Final gate:
```text
AUTHENTICATE → AUTHORIZE → DISCOVER → VALIDATE TRANSACTION TYPE → VALIDATE SOURCE → VALIDATE DESTINATION
→ VALIDATE COMPANY → VALIDATE FUND → VALIDATE OWNERSHIP → CHECK CURRENT BALANCE → CHECK AVAILABLE BALANCE
→ CHECK RESERVATIONS → CHECK DUPLICATE → CHECK CONCURRENCY → CHECK APPROVAL → CHECK BUSINESS RULES
→ CLASSIFY CROSS-ENTITY MOVEMENT → BUILD BALANCED JOURNAL → CHECK ACCOUNTING + FINANCIAL INVARIANTS
→ IMPACT + CONFLICT CHECK → ATOMIC COMMIT (journal + lines + snapshots + open items + audit)
```

## J3. Validation details
- **Account:** exists, active, not archived, supports this transaction, user may access, relationship valid, ownership valid.
- **Source:** sufficient valid available funds per its rules, rechecked authoritatively before commit.
- **Destination:** exists, active, accepts the transaction, accessible, matches rules.
- **Source ≠ destination** (reject JSK → JSK) unless a configured type supports it.
- **Fund:** exists, active, ownership, availability, reservations, user permission, transfer rules.
- **Available balance** = Current − Reserved − Locked − other committed obligations (per configured rules).
- **Insufficient funds example:** JSK total ₹5,00,000, reserved ₹1,00,000, available ₹4,00,000; JSK → Mint ₹4,50,000 → **REJECT**, showing only what the user may know: *"This transfer cannot be completed because the available balance is insufficient."*
- **Negative balance:** per account: allowed?, overdraft allowed?, limit?, approval required? If forbidden → reject before posting.
- **Amount:** required, positive, whole rupees, within type/policy limits.
- **Duplicates:** idempotency key, same request, same source/destination/amount, similar timestamp, reference number, recent duplicate pattern. Poor-network resubmission must not double-post.
- **Concurrency:** JSK available ₹1,00,000; A and B each request ₹80,000 simultaneously → only one succeeds. Use DB transaction boundaries, locking, isolation, version checks, idempotency.

## J4. Atomic commit
Success: JSK −₹50,000, Mint +₹50,000, ledger effects, fund allocation, balances, audit, notifications — all together. Failure: **no financial mutation at all**. Never partial posting.

## J5. Financial state machine
`Draft → Validating → Pending Approval → Approved → Posting → Posted`; alternatives `Rejected, Failed, Cancelled, Reversed, Corrected`. Never silently overwrite history.

## J6. Approvals and segregation of duties
Maker / Checker / Approver / Auditor, configurable per company, account or transaction type. Configurable high-value thresholds (e.g., > ₹5,00,000 requires maker + checker + approver). High-value controls: confirmation, second approval, mandatory reason, supporting document, step-up (biometric/M-PIN/password/MFA). Approval screens reveal only what the approver needs.

## J7. Policy engines (deterministic, configurable)
- **Expense policy** per company: allowed categories, max amount, approval threshold, receipt mandatory above X (e.g., Mint expenses > ₹10,000 need receipt), personal-expense restrictions, reimbursement rules.
- **Attachment policy:** final approval blocked until required evidence exists.

## J8. Smart exception engine (deterministic only — no AI)
Detect: duplicate transaction (same amount + accounts + similar time); missing transaction / possible forgotten entry (e.g., expected weekly cash deposit absent); money appearing without source; money leaving without destination; impossible balance movement; wrong company / fund / owner / account / location; incorrect transfer direction; unexpected negative balance; cash mismatch; bank mismatch; personal/business mismatch; missing receipt; unsettled reimbursement; unsettled/aging advance; unusual amount outside pattern; unexpected balance; allocation mismatch; ownership mismatch; outstanding mismatch; reversal mismatch; ledger imbalance; unreconciled transaction; unclassified transaction; repeated incorrect patterns; aging outstanding (e.g., unpaid 30 days).
Each finding explains: **Problem, Possible reason, Affected records (authorized only), Suggested action.** The engine **warns and suggests** — it never silently changes financial records. Corrections require explicit user action/approval.

## J9. Month-end close (Month Close Assistant — rule-based)
Review transactions → reconcile cash & bank → review outstanding, advances, reimbursements, personal vs business expenses, inter-company balances, unusual/unclassified items, duplicates, missing documentation → resolve warnings → show **Clean / Needs Review (N issues) / Critical** → close period.

---

# PART K — DESIGN SYSTEM (BUILD BEFORE ANY SCREEN)

## K1. Feel
Premium, minimal, extremely clean, fast, modern, calm, financially trustworthy, easy for non-technical users, one-hand mobile use, minimum clicks, minimum typing, maximum clarity, no unnecessary accounting terminology, never looks like a spreadsheet. Do not copy desktop accounting software onto Android.

## K2. Centralized, reusable — no one-off per-screen styles
- **Tokens:** colours (primary, secondary, success, warning, error, background, surface, text, muted text, debit/money-out, credit/money-in, transfer, pending, blocked, reversed, outstanding, reconciled, exception, security levels), typography (display, heading, section heading, subheading, body, caption, label, button, financial amount, currency/numbers), spacing, grid, radius, elevation, icons, motion.
- **Components:** buttons; inputs; dedicated **amount input** (large numeric keypad, INR grouping, whole numbers, fast editing, validation, authorized balance context, currency indicator); search; searchable selectors (account, fund, person, company, category, date/time); chips; tabs; cards (money, balance, debit, credit, fund, account, outstanding); list rows; tables; transaction cards; bottom navigation; top navigation; context menus; bottom sheets; dialogs; confirmation; destructive confirmation; impact preview; conflict/error component; toast/snackbar; loading; empty states; permission/unauthorized states; security indicators; permission indicators (🔒 Private, 👥 Family, 🏢 Business, ⚠ Restricted, ✓ Shared — explaining *why* without revealing hidden content); financial status components; authentication, biometric, M-PIN and OTP screens; share preview and security-builder components.
- **Financial visual language:** Money In / Money Out / Transfer / Pending / Blocked / Reversed / Outstanding / Reconciled / Exception — instantly distinguishable, **never by colour alone** (icon + sign + label). Amount is the strongest visual element: **+ ₹50,000** Mint → Tijori; **− ₹50,000** Tijori → Bank. Same language across dashboard, lists, reports, WhatsApp photo, PDF, notifications.
- Accessibility (contrast, touch targets, screen readers, font scaling), responsive Android layouts (phones, small screens, large screens/foldables), light/dark behaviour as decided in DESIGN.md.
- Proof cards and PDFs use the same design system.

## K3. Every screen supports every state
Loading, Empty (explains what is missing + next action — e.g., "No transactions yet. Add your first money movement."; "No outstanding amount."; "No bank accounts added yet."; "No personal expenses recorded this month."), Success, Error, Unauthorized, Permission denied, Offline, Syncing, Sync failed, Conflict, Validation error, Confirmation, Destructive action, Locked, Session expired, Security re-authentication, No search results, Timeout, Forbidden, Read-only (e.g., closed period), Stale data (with last-updated time), Partially loaded, Large list (paginated/virtualized), Recovery (what to do next). Never only the happy path.

## K4. Approval gate
Present the design system (tokens + component sheet + financial visual language) for approval before building screens.

---

# PART K-UX — SIMPLE, FAST & EASY UI/UX

## UX0. Priority
**SIMPLE → FAST → CLEAR → FEW CLICKS → LOW COGNITIVE LOAD → ERROR PREVENTION → EASY DISCOVERY.** UX never overrides financial integrity, security, privacy or authorization (Part B2) — instead, those controls are designed to feel light.

## UX1. Navigation — obvious and consistent
- Same bottom navigation everywhere (Part P2); Home is always one tap away.
- Every screen shows a clear title plus context path (e.g., "Money › Mint › Tijori"), so users always know where they are.
- The primary action is always in the same place; secondary actions sit in a consistent overflow.
- Back behaviour is predictable: system back = in-app back, and unsaved input is never lost without warning (drafts are auto-saved, encrypted).
- No dead ends: every empty, error, denied, locked or offline state offers the next sensible action.
- Navigation is role-shaped: users see only what they can use, not a maze of disabled items. When a known item is restricted, a short reason is shown without revealing hidden data.
- Notifications deep-link straight to the right screen after unlock.

## UX2. Tap and time budgets
Define explicit tap/time budgets in `docs/DESIGN.md` for the top flows and get them approved:
- quick entry (Avak / Javak / transfer)
- find any transaction
- see any balance
- share proof after saving
- reverse or correct an entry
- settle an outstanding
- reconcile a Tijori
Measure the budgets in UI tests and usability walkthroughs. A flow that misses its budget is not done.

## UX3. Less work for the user
- **Smart defaults:** date/time = now, handler = me, last-used location/fund, frequent from→to pairs first.
- **Shortcuts:** "Repeat last", saved quick templates (e.g., "Mint → Tijori"), favourites, recents.
- **Input aids:** a fast amount keypad, reason autocomplete from the user's own history, and progressive disclosure — simple cases fit on one screen.
- **Validation as you type,** never only after submit.
- **No redundant "Are you sure?" dialogs.** Confirmation appears only for financial commits, irreversible actions, high-risk actions and external shares. Use a single review sheet (with Impact Preview) instead of chains of dialogs.
- **Step-up and share verification** stay mandatory but are a single inline step (e.g., biometric prompt) wherever policy allows.
- **Posted entries are not edited.** "Edit" on a posted entry opens the correction flow with Impact Preview; drafts and pending items are directly editable.

## UX4. Search — extremely powerful and easy
- **Global search** is reachable in one tap from anywhere (top of Home and every list), with in-context search on each list.
- **Searchable:** names of people, companies, funds, accounts, locations, holders, vendors, customers, places and events; amounts (exact, ranges such as `5000-10000`); transaction IDs and references; dates in natural forms ("8 Oct", "Oct 2026", "today", "last week"); reasons/notes; tags; categories; statuses; types (Avak, Javak, transfer, expense…); custom fields; outstanding items; reconciliations; shares; audit entries (for authorized roles).
- **Multi-term queries** are parsed deterministically by rules (no AI): e.g. `45000 Angadiya`, `Mint Tijori Oct`, `TX-20261008`. Custom labels and English/Hindi/Gujarati terms all match.
- **Results** are grouped by type (Transactions, Accounts, Funds, People, Companies, Outstanding, Reports), best match first, with matched terms highlighted. Each transaction row shows amount, Avak/Javak sign, date and from→to.
- **While typing:** autocomplete, smart suggestions, recent searches (per user, clearable, stored securely), saved searches, and combinable filter chips (date, company, fund, account, location, person, type, amount range, status, tag, approval, reconciliation) with sorting. "No results" suggests widening filters.
- **One tap from result to action:** open, explain balance, share proof, reverse, settle — only the actions the user is permitted.
- **Performance:** server-side, indexed (keyed/tokenized indexes for encrypted fields — Part M), debounced and paginated. Offline search covers only the cached authorized subset and is labelled as offline.
- **Security:** everything is permission-filtered on the server **before** ranking, counting or suggesting. Counts, suggestions, autocomplete, recent searches, spelling suggestions and zero-result behaviour can never reveal hidden items. Permission is re-checked when a result is opened.

## UX5. Clarity and feedback
- Plain language for normal users (no journal/ledger jargon — the accounting view is for finance roles only, Part H-A AC16).
- Amounts are the dominant element; wording, icons and statuses (Draft, Pending, Posted, Reversed, Rejected) are consistent.
- Sync state and "last updated" time are visible where relevant; every tap gets immediate feedback (skeleton loaders, progress).
- Never show a financial result as final until the server confirms it ("Posting…" → posted result). Optimistic UI only for non-financial actions.
- When something is unavailable, explain why in a few words without leaking hidden data.

## UX6. Error prevention
- Pickers list only valid, active, authorized choices; source ≠ destination is enforced in the picker itself; the amount keypad accepts whole rupees only.
- Show available-balance context before submit (only when permitted).
- Inline warnings: duplicate, unusual amount (configured rule), closed period, missing receipt, unclassified cross-entity movement.
- Impact Preview before important changes, and clear recovery paths after any error.

## UX7. Every realistic scenario is designed
- **First-time use:** guided Super Admin setup (firms → people → accounts/locations → funds → opening balances → roles), and guided member onboarding (unlock setup, what you can do).
- **Frequent users:** shortcuts, repeat, favourites, recents.
- **Mistakes:** reverse/correct reachable directly from the transaction.
- **Edits & conflicts:** clear resolution screens.
- **Permissions:** denied and limited views.
- **Offline:** banner, queued count, what is allowed.
- **Loading, empty and error states.**
- **Sync failures:** per-item retry / fix / discard, never silent.
- **Locked data:** closed period, emergency freeze, record under approval.
- **Security verification:** inline step-up sheet.
- **Large data:** virtualized lists, pagination, date grouping with sticky headers, jump-to-date, summary first then detail.

## UX8. Accessibility and language
- Font scaling, contrast and comfortable touch targets.
- Screen-reader labels that read amounts meaningfully.
- One-hand reach for primary actions.
- English/Hindi/Gujarati with Indian number grouping.

## UX9. Usability validation
Walk through the top flows as each role (owner, family admin, finance, worker/entry operator, partner, Super Admin) against the UX2 budgets and the K3 state list. Record findings in `docs/MEMORY.md`, then fix before the feature counts as done.

---

# PART L — AUTHORIZATION, PRIVACY AND VISIBILITY

## L1. Model
**RBAC + ABAC + resource-level + record-level + field-level + confidentiality rules + ownership + context**, enforced **server-side** on every request. Role gives baseline capability; resource permissions determine actual financial visibility. Membership in a firm **never** means seeing everything in it.
Evaluation inputs: user, role, company, fund, account, location, transaction, record, field, amount, personal/business classification, confidentiality, action, status, date, device, session, authentication strength, approval level, context.

## L2. Independent access dimensions (per resource)
Discover · View · View Amount · View Details · Create · Edit · Reverse · Approve · Reconcile · Export · Share Message · Share Photo · Share PDF · Share Secure · Copy · Download · Print · View Attachments · View Audit · Manage. Having one never implies another (view ≠ edit ≠ approve ≠ export ≠ share).

## L3. Discovery
A user may not even be allowed to know a resource exists. Hidden resources never appear in search, autocomplete, suggestions, dropdowns, filters, related records, recently viewed, dashboards, reports, notifications, exports, counts, "no result" behaviour, sorting or API responses.

## L4. Amount visibility modes
Full (₹5,00,000) · Rounded · Range (₹4–5 lakh) · Hidden ("Amount hidden") · Existence-only.

## L5. Transaction detail levels
L1 Existence → L2 Basic (date, type, amount) → L3 Operational (from, to, amount, reason) → L4 Financial (fund, company, allocation) → L5 Full (all + attachments + audit).

## L6. Field-level visibility
E.g., worker sees amount, from, to, reason; not fund owner, internal note, private allocation, profit impact, bank details, confidential reference. Attachments have their own permissions.

## L7. Confidentiality levels (custom-nameable, each with default rules)
Public (within org), Internal, Company-only, Family-only, Restricted, Confidential, Highly Confidential, Owner-only, Private, Secret, Hidden — and owner-created levels (e.g., Normal / Family / Business / Owner Only / Private / Secret). **Labels change; the permission engine does not.**

## L8. Policy precedence, inheritance, exceptions
- **Explicit Deny > Explicit Allow > Role Default** (central, tested).
- Company defaults inherit to funds/accounts; private resources override (Mint default "Family Admins can view"; Mint Private Wardrobe override "Krish only").
- Exceptions ("all workers see Mint Tijori except Worker B"; "family sees Mint except Mint Private Fund").
- Conditional rules, e.g.: *If Worker AND company = Mint AND account = Tijori AND type = Cash Transfer → View + Create; if account confidentiality = Owner Only → Deny.*

## L9. Owner control, temporary access, break-glass
- Owners may set owner-only visibility on owned/controlled resources (Mint-owned fund visible only to Krish) — explicit and audited.
- One-time share, temporary access (1 hour, 1 day, until date — auto-expires), permanent access, specific report only, specific transaction only. Read-only and entry-only access.
- **Break-glass** (only where deliberately configured): reason, strong authentication, optional second approval, full audit, start/end time, owner notified afterwards.

## L10. Contextual & device access
Sensitive resources may require biometric confirmation, specific trusted devices only, session strength, time/network policy.

## L11. Account / location privacy
Account states: org-public, company-only, family-only, selected users, owner-only, hidden, archived. Location disclosure: visible name ("Tijori") / generic ("Cash Location" / "Private Location") / hidden / owner-only. Combinations: private account inside public company; public account with private exact location.

## L12. Permission-aware aggregation (mandatory)
**Authorized dataset → aggregate → display.** Never **entire dataset → aggregate → hide rows.**
Example: Mint actual ₹12,00,000 (Tijori ₹3L worker-visible, Bank ₹5L Krish + Father, Owner Fund ₹4L Wardrobe Krish-only) → Krish sees **₹12,00,000**, Father sees **₹8,00,000**, Worker sees **₹3,00,000**; nobody can infer the hidden difference via totals, averages, charts, trends, rankings, counts, "last transaction" widgets, search counts, notifications, PDFs, WhatsApp, exports, errors, logs, analytics, sorting or history.

## L13. Worker experience / blind entry
Worker UI: Add Entry, My Entries, Assigned Accounts/Transactions, Pending, Notifications. A worker can enter Mint → Tijori ₹50,000 and sees only "Entry recorded successfully" — not the Mint balance, private funds, personal finance, restricted accounts or browsable history.

## L14. Private data firewall
Personal banks, private funds, owner accounts, confidential notes, sensitive documents, personal expenses are firewalled. Reimbursement privacy: finance sees Mint reimbursement, JSK team sees JSK reimbursement, Krish sees all — no cross-company leakage.

## L15. Admin "View As User" + Permission Simulator
- View As User shows the exact navigation, dashboard, totals, accounts, funds, transactions, search, reports, notifications, exports, WhatsApp and PDFs a user would get. The simulator itself must never leak hidden data beyond what the simulating admin is authorized for.
- Simulator: select **User → Resource → Action** → **ALLOWED / DENIED** + reason for authorized admins/audit (e.g., "Worker A → Mint Wardrobe → View Balance: DENIED — account confidentiality = Owner Only").

## L16. Family sharing
Krish can share "Mint Monthly Report" with Father without granting permanent access. All sharing auditable.

---

# PART M — ENCRYPTION AND KEY MANAGEMENT

- Sensitive values (transaction amounts, account/fund/cash/bank balances, outstanding, reimbursement, customer/vendor balances, sensitive ownership values, bank account numbers, private locations, confidential notes, sensitive attachments, internal identifiers, any configurable sensitive field) are **never stored as ordinary plaintext** where application-level encryption is required: `₹5,000 → backend encryption service → authenticated encryption → ciphertext → database`.
- **Encryption ≠ hashing.** Passwords, M-PINs, recovery codes, refresh tokens → one-way hashing (password-grade where applicable). Recoverable financial values → reversible **authenticated encryption**. Never hash amounts the system must calculate with.
- Use mature, audited constructions/libraries only. **No custom cryptography.**
- **Backend owns decryption:** `Android → authenticated API → authentication → authorization → permission check → secure financial service → decrypt when required → calculate/validate → authorized result → Android`. Decrypted values live only in protected backend memory; no plaintext persistence.
- Android **never** contains: master keys, DB keys, private decryption keys, KMS credentials, backend service credentials, any secret able to decrypt data — not in APK, source, build config, public env vars, local DB, shared preferences, assets, network config, bundles or logs. Never send ciphertext to Android expecting it to decrypt.
- **Key management:** dedicated secure key management; never hard-coded, in Git, in frontend, in ordinary DB tables, in plain config, or in logs; key versioning; rotation; controlled privileged access; key-usage audit; separately protected recovery keys; tested encrypted-data recovery. Encrypted records store only the key ID/version and parameters needed.
- Search over encrypted data: authorized server-side processing, keyed search indexes, tokenization, restricted search services — never weaken encryption or create plaintext shadows.
- Layers: transport encryption, storage/database encryption at rest, application-level field encryption, encrypted backups, encrypted minimal secure local storage on Android.

---

# PART N — AUTHENTICATION, APP UNLOCK, RECOVERY, SESSIONS, DEVICES

## N1. Three distinct layers
- **Account authentication** — "Who are you?" (email/username + password; MFA where required).
- **App unlock** — "Can you unlock this already-authenticated device/session?" (Android biometric, M-PIN, valid remembered session, password fallback).
- **Step-up** — "Are you authorized for this sensitive action now?" (password, M-PIN, biometric, MFA per policy).

## N2. First login flow
Splash → **Welcome / Sign In** (Email/Username, Password; actions: Sign In, Forgot Password?, Help) → MFA / new-device verification if required → **Remember this device?** → **Secure your app**: Enable Biometric / Create M-PIN / Skip for now (M-PIN mandatory only if policy says so). Login throttling and brute-force protection always on.

## N3. Remember Me — never the password
`Successful login → secure session/refresh mechanism → protected Android keystore-backed storage → device/session policy → next launch → validate remembered session → local unlock if configured → authorized access`. Remembered sessions are expirable, revocable, policy-controlled, invalidated after critical security changes. **Never "unlimited permanent access".**

## N4. Returning user scenarios
A: remembered + biometric → "Welcome Back — Use Fingerprint/Face" → unlock. B: remembered + M-PIN → "Enter M-PIN" → unlock. C: biometric unavailable → M-PIN. D: M-PIN unavailable → account password. E: remembered session expired → full login. F: session revoked → full login. G: password/security changed → full re-authentication. H: device disabled → block access.

## N5. M-PIN (a proper authentication factor)
Create, confirm, change, forgot, reset, disable, force-reset by authorized Super Admin, attempt limiting, temporary lockout, re-authentication. Creation: Enter → Confirm → validate strength/policy → save protected representation → register unlock method → audit → success. Never store raw, log, display or recover a PIN. **Forgot M-PIN** = reset, not retrieval: strong identity verification (password/MFA/approved recovery) → invalidate old unlock credential → create new M-PIN → optionally reconfigure biometric → audit → unlock.

## N6. Biometric
Android platform biometric prompt (fingerprint, face, other supported modalities); app stores no raw biometric data. Success → unlock; failure → M-PIN/password per policy. Enable, disable, re-enroll, fallback. **Detect device-security changes** (new biometric enrolled, lock-screen change, device reset, app data restored, new device) → invalidate local unlock → require stronger authentication → re-enroll.

## N7. Passwords
Strong password policy, hashing. **Forgot Password:** identifier → secure recovery challenge → identity verification → additional factor if required → secure reset → new + confirm → invalidate appropriate sessions → notify → login. Never reveal account existence unnecessarily, never email/display the old password, never store recoverable passwords, never let reset bypass MFA/policy. **Change Password:** Profile → Security → current → new → confirm → validate → session handling → audit → security notification.

## N8. MFA, passkeys, recovery
MFA/2FA (OTP, authenticator, security key where supported); passkeys where supported; recovery methods, hashed recovery codes, emergency recovery, admin-assisted recovery (never secret retrieval).

## N9. Sessions
Access-token expiry, refresh-token rotation, session revocation, device/session list, logout current, logout all, remote device revocation, inactivity timeout, step-up, security-event re-auth, password-change handling, suspicious-login/device detection, new-device notifications.

## N10. Devices
Register, trust, revoke, mark lost, restore through full authentication. **Lost phone:** from another trusted session: Security → Devices (device, Android version/metadata, last active, status) → Sign Out / Revoke Device / Revoke All / Mark Lost / Require Full Login → the old device can no longer use the remembered session. **New device:** install → full login → verification → register → policy → biometric/M-PIN → optional Remember Me → audit + notify.

## N11. Auto-lock & screen privacy
Backgrounded → configurable timeout (or immediate lock for highly confidential policy) → **App Locked** (Use Biometric / Enter M-PIN). Classify screens by confidentiality; protect highly confidential screens from recent-apps previews and capture using Android secure-screen behaviour where appropriate — without applying the strongest restriction app-wide if it harms usability.

## N12. High-risk actions (configurable step-up)
Large transfers, ownership changes, fund-visibility changes, new bank accounts, account delete/disable, high-confidentiality exports, secure PDF creation, permission changes, privileged member creation, high-value reversal, security-policy changes, highly confidential external sharing, viewing sensitive passwords for secure docs.

## N13. Super Admin security
Mandatory MFA, stricter session controls, re-authentication, device management, privileged-action confirmation, full audit. Never shared or default admin passwords; no hidden privilege escalation. Super Admin can never: see passwords/M-PINs, retrieve biometrics, extract keys via UI, directly manipulate encrypted values, silently alter balances. Admin controls **access, permissions, recovery, configuration** — not secrets.

---

# PART O — BACKEND AND API

- Versioned API; consistent contracts shared conceptually with future clients; one backend for all clients.
- Every endpoint: authentication, session validation, authorization (object-level + field-level), input validation, financial rules, rate limiting. Changing IDs in a request must never bypass authorization (test for IDOR).
- **Data minimization:** never return hidden fields for the client to hide. Unauthorized fields are absent, not masked in UI.
- Idempotency keys on all mutations.
- Pagination, server-side search/filter/sort, efficient permission-aware aggregates, controlled caching (never caching data across permission scopes), background jobs (PDF generation, notifications, exception scans, backups), image compression.
- Never load the entire financial database into mobile memory.
- Errors: safe actionable messages to users; detailed technical info only in protected developer/security logs; never SQL errors, stack traces, encryption internals, secrets, hidden balances, sensitive authorization details or credentials.
- Logs and analytics never contain secrets, keys, passwords, PINs, tokens, or unauthorized financial values.
- Monitoring, error tracking, structured logs, migrations, secure deployment.

---

# PART P — ANDROID APPLICATION

## P1. Primary flow
Open app → Biometric/M-PIN unlock → Dashboard → **+ Add** → Debit/Credit → From → To → Amount → Reason → Save → Share Proof (verified flow). Auto-filled: date, time, user, recent selections, frequent accounts/categories/reasons/people/companies (smart, non-intrusive, from the user's own authorized history — deterministic frequency/recency, not AI). Recent transactions can be reused/duplicated.

## P2. Navigation (mobile-first)
Bottom navigation: **Home** (dashboard) · **Money** (accounts + funds) · **Activity** (transactions, expenses, income, handovers) · **Outstanding** (receivables, payables, reimbursements, advances) · **More** (reports, reconciliation, notifications, security, profile, admin where permitted). Prominent **+ Add**: Transfer, Expense, Income, Receive, Handover, Reimbursement, Advance, Adjustment — progressive disclosure, only required fields shown. Worker navigation reduced per L13.

## P3. Smart conditional form engine (configuration-driven)
Payment Method = Bank → Bank Account required. Expense = Travel → Destination required. Company = Mint → show authorized Mint funds. Confidential = Yes → visibility/security options. Admin-built forms (e.g., Expense Form: Amount, Paid By, Company, Fund, Category, Reason; optional Vendor, Place, Receipt. Bank Transfer Form: From, To, Amount, Reference, Reason).

## P4. Complete page inventory (every page wired to real backend behaviour, every state from K3)
**Authentication:** 1 Splash · 2 Welcome · 3 Login · 4 Forgot Password · 5 Recovery Verification · 6 Reset Password · 7 MFA · 8 New Device Verification · 9 Remember Device · 10 Biometric Setup · 11 M-PIN Setup · 12 App Unlock · 13 Forgot M-PIN · 14 Security Lock · 15 Session Expired.
**Main:** 16 Home Dashboard · 17 Accounts · 18 Account Detail · 19 Funds · 20 Fund Detail · 21 Locations · 22 People · 23 Firms · 24 Search.
**Transactions:** 25 List · 26 Detail (full detail + audit history per permission) · 27 Add Transfer · 28 Add Expense (incl. expense events, splits) · 29 Add Income · 30 Add Handover · 31 Add Reimbursement · 32 Add Advance · 33 Add Adjustment · 34 Validation Review · 35 Approval · 36 Posted Result · 37 Reverse Transaction · 38 Correction (with Impact Preview).
**Outstanding:** 39 Dashboard · 40 Receivable · 41 Payable · 42 Reimbursement · 43 Advance · 44 Settlement.
**Reconciliation:** 45 Dashboard · 46 Select Account/Fund · 47 Enter Actual Balance · 48 Difference · 49 Investigation · 50 Resolution · 51 History.
**Reports:** 52 Dashboard · 53 Daily · 54 Monthly · 55 Company · 56 Fund · 57 Person · 58 Expense · 59 Outstanding · 60 Reconciliation · 61 Exceptions.
**Sharing:** 62 Share Proof · 63 Message Preview · 64 Photo Proof · 65 PDF Preview · 66 Security Settings · 67 Secure Viewer · 68 Share History · 69 Expired Share · 70 Revoked Share · 71 Share Verification · 72 Recipient Verification · 73 Final Share Confirmation.
**Notifications:** 74 Center · 75 Detail · 76 Security Alerts · 77 Financial Alerts.
**User:** 78 Profile · 79 Preferences (language, lock-screen privacy, default share format, notification settings, personal-finance visibility grants) · 80 Security Center · 81 Devices · 82 Sessions · 83 Login History.
**Super Admin:** 84 Admin Dashboard · 85 Members · 86 Add Member · 87 Member Detail · 88 Firms · 89 Add Firm · 90 Roles · 91 Permissions · 92 Permission Simulator · 93 View As User · 94 Masters · 95 Workflows · 96 Approval Rules · 97 Security Policies · 98 Share Profiles · 99 WhatsApp Templates · 100 PDF Templates · 101 Audit Logs · 102 System Activity · 103 Emergency Security Controls.
Plus as needed: Expense Event detail, Fund flow/lifecycle view, Month Close Assistant, Exceptions list/detail, Custom Fields/Forms builders, Confidentiality Levels, Custom Labels, Dashboard configuration, Report Builder, Notification Rules, Temporary Access, Break-glass, Visibility Rule Builder, Import/Export.

## P5. Transaction list/detail
Readable cards: "08 Oct 2026 · 10:15 AM — CREDIT ₹5,000 — Mint Company → Tijori — Reason: Cash deposit — Handled by: Krish Patel — Status: Completed". Tap → full detail + permitted audit history.

## P6. Search and filters (full specification: Part K-UX, UX4)
Search across amount, person, company, fund, account, bank, vault, date, month, reason, place, vendor, expense event, transaction ID, debit/credit, outstanding (e.g., `45000 Angadiya`, `5000 Mint`) — server-side, permission-filtered before return. Filters: date, company, person, fund, account, from, to, debit/credit, category, place, vendor, amount range, type, status, approval status, reconciliation status.

## P7. Offline & sync
Secure, encrypted, minimal, integrity-protected local storage; user can prepare **permitted** transactions offline with a local ID; sync when online; server assigns authoritative ID; server re-runs the full precondition + impact/conflict pipeline (offline never bypasses financial truth or authorization); idempotent sync (no duplicates); conflict detection with a "needs review" record; visible sync status (queued, syncing, synced, rejected with reason, conflict). Financial records are never silently overwritten during sync. Offline cache respects permissions and is cleared on revocation/logout per policy.

## P8. Multi-language & labels
English, Hindi, Gujarati via translation keys. Custom display labels (Expense → Javak, Income → Avak, Vault → Tijori, Fund → Hissa, Worker → Operator, Wallet → Rokda Wallet, Account → Khata). Labels and language never change financial behaviour, permissions or internal IDs.

---

# PART Q — SHARING, WHATSAPP AND GENERATED PROOF

## Q1. WhatsApp is a first-class workflow
After a transaction: **Share Proof** → Message / Photo Proof / PDF / Secure PDF / Secure Viewer. User can set a default format (e.g., Message) and override per share. Share types: single transaction, daily, weekly, monthly, account (e.g., Tijori), person, company, fund, vault, bank, outstanding, expense event, reconciliation, audit reports — all permission-filtered.

## Q2. Generation pipeline (filter BEFORE generating — never generate unrestricted then hide)
`Transaction/Report → Permission check → Authorized data scope → Recipient selection → Share profile → Field filtering → Security policy evaluation → Generate → Encryption/security applied → Exact preview → User review → Recipient verification → User verification / step-up when required → VERIFY & SHARE → External channel → Audit`

## Q3. Mandatory verification
- Never auto-send because a transaction was created/saved/approved/completed. No auto-sharing via WhatsApp, SMS, email, external apps or share sheet unless an explicit policy-approved automation exists — and even then every current permission, confidentiality, recipient, share and security condition is re-checked; any failure → do not share.
- **Recipient verification:** show recipient identity, channel, phone/contact where appropriate, format, authorized fields, security settings; extra confirmation for sensitive documents; no hidden/default recipient may silently receive data.
- **Exact preview:** Message → exact text; Photo → exact generated image; PDF → PDF preview; Secure PDF → preview + password, encryption, watermark, expiry, viewer restrictions, download/print policy. Never approve something different from what is sent.
- **Final confirmation screen** e.g.: Send this proof? Recipient: Sujal · Channel: WhatsApp · Format: PDF · Security: Password ✓ Encryption ✓ Watermark ✓ Expiry 24h ✓ · Content: ₹50,000 · Mint → Tijori · #TX-10291 → **Cancel / VERIFY & SHARE**.
- **Step-up** for configured confidentiality levels (biometric / M-PIN / password / MFA).
- **Share integrity:** bind verification to a content hash + recipient + security config. Never preview one amount/recipient/security state and send another. Any change to recipient, transaction, amount, visible fields, security settings, expiry, download/print policy, permission or confidentiality → invalidate, regenerate, re-verify.
- **Failure/cancel:** cancel → nothing sent; recipient verification fails → nothing sent; permission changed → abort and regenerate; policy changed → abort/re-evaluate; generation fails → nothing sent; delivery fails → clear failure state. Never show "Sent Successfully" without real confirmation from the channel integration (document honestly what the chosen integration can confirm).

## Q4. Share permissions
View never implies Message / Photo / PDF / Secure share / Export / Download / Print / Copy. Each independent.

## Q5. Message format (fields per permission)
```
PAYMENT RECEIVED / CREDIT / AVAK
From: Mint · To: Tijori · Amount: ₹5,000 · Date: 08-10-2026 · Day: Thursday · Time: 10:15 AM
Reason: Cash received · Handled By: Krish Patel · Fund: Mint Fund · Reference: TX-001245
```
Consistent layout every time; templates admin-configurable.

## Q6. Photo Proof
Dedicated **generated** proof card from authorized structured data — never a screenshot, screen capture or manually edited image. May include: firm name, transaction type, amount, from, to, date, time, reason, fund, handler, transaction ID, verification code/link, watermark, security classification. Same design system, mobile-first, well aligned, high readability, correct INR formatting, easy to forward/archive. Flow: Generate → Preview → Recipient verify → User verify → Confirm → Share.

## Q7. PDF (first-class design surface — never a raw DB table)
Header (title, company/person, period) · Summary page (opening, credits, debits, net movement, closing) · Detail pages (structured transaction table) · Final (outstanding, reimbursements, reconciliation, exceptions, totals) · Footer (page number, document ID, generated timestamp, security classification, optional verification). Authorized data only. Test: multiple pages, large amounts, long names/descriptions, page breaks, overflow, clipped text, broken tables, missing totals/headers, wrong currency format, tiny text, watermark, password, encryption, expiry, download/print restrictions. Never produced by screenshotting screens.

## Q8. Secure document security builder
Independent controls (checkboxes): **Password Protection · Encryption · Watermark · Expiry · Secure Viewer · Revocable Access · Recipient Identity Marking · Download Allowed · Print Allowed · Require User Verification · Require Step-Up Authentication.**
- Each control supports **OFF / DEFAULT ON / MANDATORY** (and "user may enable/disable: yes/no").
- Super Admin sets defaults (e.g., Password ☑, Encryption ☑, Watermark ☑, Expiry ☑, Secure Viewer ☐, Revocation ☑); applied automatically to every new document.
- **Presets (names customizable):** Standard (none) · Protected (password) · Secure (password + encryption) · Confidential (+ watermark + expiry) · Combined Secure (+ secure viewer + revocation) · Owner Secure (maximum). Individual controls stay visible.
- **Policy hierarchy:** System → Company/Firm → Fund → Account → Transaction → Report → Role → Recipient → Share Profile → User Preference → One-time selection. **Stricter always wins**; users change only what policy permits; MANDATORY controls are locked ("Encryption — cannot disable").
- Examples to implement as tests: Normal (all off, standard PDF); Confidential (password, encryption, watermark, 24h, viewer optional); Highly Confidential (all on, 1h, viewer on, download/print restricted); Owner-only / Mint Owner Fund (all mandatory, download disabled, external sharing only explicitly authorized); admin policy "Owner Financial PDF".
- Config example → UI: Password DEFAULT ON, Encryption MANDATORY, Watermark DEFAULT ON, Expiry DEFAULT ON/24h, Secure Viewer OPTIONAL, Revocation DEFAULT ON, Download ALLOWED, Print NOT ALLOWED → ☑ Password ☑ Encryption (locked) ☑ Watermark ☑ Expiry 24h ☐ Secure Viewer ☑ Revocation.
- **Expiry options:** 1h, 6h, 24h, 3 days, 7 days, custom; default configurable.
- **Password options (policy-controlled):** user-selected, system-generated, one-time, recipient-specific, shown only after biometric authentication.
- **Encryption:** real document encryption via the supported secure-document implementation — never a filename/password-only illusion, never custom crypto.
- **Watermark:** configurable — CONFIDENTIAL, shared with (recipient), generated timestamp, document ID; recipient-specific for accountability.
- **Secure Viewer:** controlled viewing with expiry + watermark + revocation. After revocation: "This document is no longer available." After expiry: "This secure document has expired." — no content exposed.
- **Honest limitation:** never claim remote destruction of files already downloaded, copied, screenshotted, photographed, forwarded or backed up. Prefer Secure Viewer for highly confidential data. Temporary artifacts have their own retention; the underlying financial record follows financial retention policy.

## Q9. Share profiles (per recipient, reusable)
Recipient, default format, allowed formats, visible fields, hidden fields, default security, password/encryption/watermark/expiry/viewer requirements, download/print permission, revocation, required verification, required step-up. Example **Savan:** default Message; allowed Message/Photo/PDF/Secure PDF; visible Amount, Date, From, To, Company; hidden Private fund, Internal note; security Password + Encryption + Watermark.

## Q10. Partner update system
Daily, weekly, monthly, high-value transaction, outstanding, reconciliation updates — partner sees only permitted information; still goes through verification/confirmation unless a policy-approved automation satisfies Q3.

## Q11. Share history & audit
Who initiated, who verified, recipient, channel, format, transaction/report, document ID, security configuration/policy, step-up used, timestamp, expiry, revocation, result, failure/cancellation. No secret material in audit.

---

# PART R — DASHBOARDS, REPORTS, NOTIFICATIONS

## R1. Dashboards (all permission-aware, all totals from authorized data)
Simple, not an accounting dashboard. Immediately answers "Where is our money?" Cards: visible total money, personal, each company, vault, bank, cash, funds, outstanding, receivable, payable, reimbursement, monthly spending, unreconciled, exceptions, recent transactions, alerts. Reorderable. Admin-configurable widgets, order, labels, visibility, filters.
**Fund dashboard:** total funds, available, reserved, outstanding, personal, per company. **Company dashboard:** total, bank, cash, vault allocation, receivables, payables, monthly inflow/outflow, inter-company movement, expenses, outstanding. **Personal dashboard (owner only by default):** balance, funds, spending, income, outstanding, reimbursements, monthly expense, bank/cash distribution. **Financial flow view:** how a fund or high-value transaction moved over time.

## R2. Summaries & monthly view
Today in/out; this month credit/debit/net; by company, person, location. Monthly per person/company/fund/account: opening, credit, debit, transfers, expenses, reimbursements, outstanding, adjustments, closing, company-wise movement, personal spending, vault/bank movement, major expenses, unresolved errors — switchable Personal / each company / All (as permitted).

## R3. Reports (same privacy model as the app — no bypass via PDF/Excel/CSV/photo/WhatsApp/API/print/export)
Accounting statements (Part H-A AC14: trial balance, general ledger, ledger-account / location statements, balance sheet, income & expenditure, money-flow statement, fund statement, aging, inter-entity reconciliation, custody/holder, location, expense-event) plus daily/weekly/monthly cash flow, credit, debit, company, personal, fund, account, vault, bank movement, person, expense, expense event, income, outstanding, handover, reconciliation, exceptions, transaction audit. **Custom report builder:** columns, filters, grouping, sorting, totals, subtotals, charts, security, share format.

## R4. Import / export
Import CSV/Excel/bank statements/existing records (validated, previewed, run through the full pipeline). Export Excel/CSV/PDF — **export permission separate from view**, permission-filtered, audited.

## R5. Notifications
Meaningful, configurable per user: high-value transaction, possible duplicate, pending reimbursement, unsettled advance, Tijori difference, personal expense charged to business fund, personal expense from shared account, handover recorded, outstanding unpaid N days, period ready to close, security alerts (new device, password/M-PIN/biometric change, failed logins). Same visibility engine. Modes: **Full / Masked / Generic** ("A financial update requires your attention."). Lock-screen policy: show details / hide amounts / hide transaction names / hide all. Never a restricted amount on a lock screen; authorize on open.

---

# PART S — RECONCILIATION, CASH COUNTING, BANK

- Reconcile at account, cash, vault, bank, fund, ownership, outstanding levels.
- **Cash count:** System ₹4,82,000 vs Physical ₹4,80,000 → Difference ₹2,000 → investigation of likely causes: missing entry/expense, wrong entry, duplicate posting, incorrect transfer, wrong fund/owner/location, unrecorded handover, unrecorded expense, counting/data-entry error.
- Show Expected / Actual / Difference / Investigation / Resolution / History.
- **Never silently change balances to match reality.** Any resolution adjustment is an explicit, approved, audited adjustment journal (Part H-A AC10 example 11 — Cash Over/Short or Suspense), never a balance overwrite.
- **Bank reconciliation:** system vs actual bank balance, manual reconciliation, statement import, matched/unmatched transactions, duplicate detection, reconciliation history.

---

# PART T — SUPER ADMIN AND MASTER / CONFIGURATION SYSTEM

## T1. Nothing important hard-coded
Super Admin creates/manages without code changes: companies/firms, people, members/users, workers, worker types, partners, customers, vendors/firms, funds, accounts, banks, wallets, vaults, locations, places, projects, trips/events, departments, categories, subcategories, expense types, income types, transaction types, statuses, tags, confidentiality levels, custom labels, custom fields, custom forms, conditional rules, roles, permissions, visibility rules, reports, dashboards, workflows, approval rules, posting rules, notification rules, share profiles, message/photo/PDF/WhatsApp templates, security policies, retention policies, system settings.
Actions: Create, Rename, Disable, Archive, Reorder, Configure. Stable internal IDs. Never destroy referenced history. **Every configuration change affecting financial/security behaviour is versioned and audited** (who, when, old, new, reason) — e.g., "Mint Private Fund visibility: Krish only → Krish + Father".

## T2. Add Member
Fields: full name, display name, phone, email, status, firm access, role, resource access, fund visibility, account visibility, field permissions, approval, reconciliation, export, share permissions, security policy, device policy. Actions: Create, Invite, Activate, Disable, Suspend, Force Password Reset, Force M-PIN Reset, Revoke Sessions, Revoke Device. Never shows existing password/M-PIN. Cannot grant themselves access to someone's personal finance (A4).

## T3. Add Firm
Name, internal ID, display name, status, members, accounts, funds, locations, security policy, permissions, approval rules, share defaults, financial configuration. Works system-wide immediately.

## T4. Roles (configurable baselines)
Super Admin (system control, small number), Family Admin, Finance/Trusted Operator, Entry Operator/Worker, Read Only, Partner, Auditor, custom. Roles grant baseline capability only.

## T5. Custom fields
Types: text, number, amount, date, time, dropdown, multi-select, person, company, fund, account, image, file, boolean — attachable to transactions (invoice no, reference, vehicle no, project, internal note), expenses (firm, place, visit, purpose), people (relation, worker type, department), accounts (bank, branch, location, security class).

## T6. Security & Visibility Center (admin)
Users, roles, permissions, companies, funds, accounts, visibility rules (visual rule builder — e.g., "Mint Private Fund: Krish Full, Others Hidden"; "Mint Tijori: Worker A View + Create; cannot see Mint total, cannot export, no historical personal records"), confidentiality levels, field rules, access logs, device sessions, temporary access, approval rules, security policies.

## T7. Emergency security controls
Freeze financial writes, disable exports, disable sharing, revoke sessions, disable selected users/devices/accounts, require re-authentication, preserve evidence. All audited.

---

# PART U — FILES, AUDIT, BACKUP, INCIDENTS

## U1. Attachments
Photo, receipt, bill, PDF, invoice, supporting document — linked to transactions; validated type and size; malware scanning where appropriate; protected storage; authorization on every access; no unrestricted public URLs; time-limited access; access/share logging; integrity maintained; replacement/removal audited. A user-uploaded image is evidence, never an application-generated proof.

## U2. Audit log (tamper-evident, protected from unauthorized modification/deletion/access)
Record user, action, object, old value, new value, timestamp, session/device metadata, IP where appropriate, reason, approval information — for: login, failed login, logout, password reset/change, M-PIN create/change/reset, biometric changes, MFA changes, new device, device revocation, session revocation, permission/role/visibility/confidentiality changes, access grants/revocations, owner personal-finance grants, temporary access, break-glass, private record access, member/firm/account/fund/master creation & changes, configuration changes, transaction create/edit/approve/reject/reverse/correct, fund allocation/reallocation, reconciliation, period close, exception resolution, export, report generation, document generation, PDF creation, share preview, share verification, share confirmation, share cancellation, WhatsApp share attempt, secure link creation/access/revocation, attachment upload, admin activity, emergency controls, key usage. Example access log: "Krish viewed Mint Private Fund — 08-10-2026 15:20:31 — Device: Android — Authentication: Biometric".

## U3. Backup & disaster recovery
Automated, encrypted, access-controlled, integrity-checked, versioned, retained, isolated/independent path where practical, **restore-tested**: Backup → Restore → DB valid → transactions valid → balances valid → funds valid → audit valid → app works. Covers DB corruption, bad deployment, accidental deletion, credential compromise, ransomware, outage, key incident, migration failure, application bug. No plaintext backup copies. An untested backup is not reliable.

## U4. Incident response
Detection, alert, investigation, session revocation, user disable, financial lock, sharing lock, evidence preservation, recovery, integrity verification, root-cause review.

## U5. Failure behaviour
Security uncertain → deny. Financial state uncertain → do not post. Balance uncertain → use authoritative backend state. Permission uncertain → deny. Partial failure → atomic rollback. Possible hidden-data leak → do not return it. Recipient uncertain → do not share. Not user-verified → do not share. Content changed after verification → invalidate and re-verify.

## U6. User-facing messages (simple, actionable)
"Please select where the money is going." · "Transaction could not be saved. Please check your internet connection and try again." · "This transaction appears to be a duplicate. Please review it before saving." · "You do not have permission to view this account." · "This transfer cannot be completed because the available balance is insufficient." Never `ValidationException: invalid account relationship`.

---

# PART V — TESTING AND QA (BEFORE ANY FEATURE IS "DONE")

## V1. Categories
Unit · Integration (backend/DB) · Financial · Authorization (every role × restricted resource) · Security (auth, encryption, sessions, authz) · Android (real device/emulator, multiple Android versions/screen sizes) · Offline (queue, retry, rejection, conflict) · E2E (real workflows) · Recovery (password, M-PIN, device, session, backup restore) · Concurrency · Performance (dashboard, search, history, reports, PDF) · Document (PDF/photo/share/security) · Screen-privacy · Share verification · Impact/conflict propagation · Regression · Accessibility.

## V2. Mandatory financial tests
Credit, debit, transfer, insufficient funds, reserved funds, negative balance/overdraft, duplicate submission, concurrent transfer, atomic rollback, reversal (exact inverse), correction, fund allocation (100% reconciles), allocation adjustment, expense split, reimbursement, outstanding, advance, handover chain, inter-company posting, reconciliation, period locking, opening balance, balance-explainability invariant, impact propagation to every dependent record, conflict → no partial save.

**Mandatory accounting tests (Part H-A):** every AC10 worked example produces exactly the specified journal lines and dimensions; Σ Dr = Σ Cr per journal, per entity, per fund; trial balance balances for every entity and period; sub-ledgers equal control accounts; inter-entity dues reciprocal; location total = Σ entity/fund cash at that location; fund totals reconcile to entity net assets; open-item remaining = original − settlements across full, partial, one-to-many and many-to-one matching; splits sum exactly with the deterministic remainder rule; reversal is an exact mirror; correction links correctly; posting to a closed period is rejected and lands in the open period with reference; opening-balance-equity and suspense aging are flagged; advance never enters the holder's personal net worth; Avak/Javak ↔ Dr/Cr mapping correct for every transaction type and both statement perspectives; integrity verifier detects a deliberately corrupted snapshot and a broken hash chain; encrypted-amount aggregates equal a plaintext reference computation in tests; **property-based tests**: random sequences of valid operations never break any AC6 invariant, and random invalid operations are always rejected atomically; period close produces correct closing and next-period opening balances.

## V3. Mandatory security & privacy tests
Unauthorized user/company/fund/account; hidden private fund; hidden field; hidden amount; hidden account absent from search/autocomplete/dropdowns/counts; hidden totals cannot leak via dashboard/charts/reports/notifications/exports/WhatsApp/PDF/errors; API ID manipulation; unauthorized export/share/PDF; personal finance invisible to Super Admin and family by default and visible only after owner grant; protected values not plaintext in DB; master keys not extractable from APK; unauthorized decryption impossible; expired/revoked secure document; file access bypass; remembered session revocation; lost device revocation; password reset secure; M-PIN reset secure; old M-PIN irretrievable; failed PIN attempt lockout; Super Admin activity audited; step-up triggered for configured high-risk actions; View-As-User leaks nothing; policy precedence (explicit deny wins).

## V4. WhatsApp / share / document tests
Worker can generate allowed Mint Tijori message but not private Mint Wardrobe PDF; restricted user can view but not share; secure profile applies password/encryption/watermark/expiry; mandatory controls cannot be turned off; no share without explicit confirmation; wrong recipient blocked; changed content/recipient/security invalidates verification; permission/policy change invalidates pending share; unauthorized users cannot generate shareable content; highly confidential share requires step-up; photo proof generated from structured data (never screenshot); password required; encrypted content protected; recipient-specific watermark; secure viewer stops after expiry/revocation; combined secure works together; config-defaults test (Part Q8 example) renders exactly.

## V5. Screen privacy tests
Confidential screens behave per policy; recent-apps preview reveals nothing protected; no flow requires a screenshot.

## V6. Edge-case tests (Part G-EC)
Every Edge-Case Matrix row has an automated test or a documented manual check. Include combinatorial (pairwise) suites across the EC2 dimensions, property-based financial invariant tests, fault-injection tests (network loss, timeout with unknown outcome, server/database failure, app killed mid-sync), concurrency suites (simultaneous post/reverse/settle/approve/close), and permission-change-mid-flow tests for entries, approvals and shares.

## V7. UX and search tests (Part K-UX)
Tap/time budgets measured for every top flow. Every screen renders every K3 state. Back navigation never loses data. Search finds items by every listed attribute and query form, and filters/sorting/pagination behave correctly. Search, autocomplete, suggestions, counts, recent searches and zero-result behaviour leak nothing hidden (tested per role). Large-dataset performance is within agreed targets. Accessibility checks pass. Role-based usability walkthroughs are completed.

---

# PART W — BUILD ORDER (FROM SCRATCH)

1. Documentation skeleton (Part E) + PRD/SRS/SECURITY/TEST_PLAN drafted from this prompt.
2. Stack Decision Record + Accounting Model Record (Part H-A AC19) → **user approval**.
3. Threat model + architecture (client-independent backend, API contracts, encryption & key-management design) → document.
4. Database schema design → **user approval** → migrations.
5. Android design system + UX blueprint (Part K-UX: navigation map, search model, tap budgets, key flows) + master Edge-Case Matrix (Part G-EC) → **user approval**.
6. Backend foundation: config, logging, error handling, audit engine, encryption service, key management integration, idempotency, migrations, CI.
7. Authentication (login, MFA, throttling).
8. Forgot Password / recovery.
9. Remember Me / sessions.
10. Android biometric.
11. M-PIN create/unlock/change/reset/lockout.
12. Session/device management, auto-lock, screen privacy, step-up.
13. Authorization engine (RBAC + ABAC + resource + field + confidentiality + discovery + precedence + personal-finance owner grants) + permission-aware aggregation layer.
14. Master/configuration system + Super Admin members/firms/roles/permissions (minimum needed to configure data).
15. Dashboard.
16. Accounts / funds / locations / fund positions.
17. **Accounting core** (Part H-A): accounting entities, chart-of-accounts templates, location ↔ ledger mappings, journal engine, posting-rule templates with journal preview, AC6 invariant checker, encrypted balance snapshots, hash chain, Integrity Verifier, Explain Balance — then the transaction engine built on top of it.
18. Precondition pipeline + balance/available-balance validation + concurrency + idempotency + state machine.
19. Impact + Conflict Engine + Impact Preview + financial integrity/invariants.
20. Expenses / income / expense events / splits / personal allocation.
21. Outstanding / reimbursement / advance / settlement / inter-company.
22. Handover.
23. Reversal / correction / allocation adjustment / opening balances / period locking.
24. Reconciliation + exception engine + month-end close.
25. Financial statements (AC14) + period close (AC12) + reports + custom report builder + import/export.
26. Notifications.
27. WhatsApp message + mandatory verification pipeline + share profiles.
28. Generated Photo Proof (never screenshot).
29. PDF.
30. Secure PDF / security builder / secure viewer / expiry / revocation.
31. Offline sync.
32. Remaining Super Admin (simulator, View As User, workflows, approval rules, security policies, templates, audit viewer, emergency controls, break-glass, temporary access).
33. Multi-language + custom labels.
34. Security hardening + backup/restore testing + monitoring + incident runbooks.
35. Full Android testing (all of Part V).
36. Production readiness review against Part X.

Each step is a vertical slice delivered through the Part C loop with its Flow Map.

---

# PART X — PRE-PRODUCTION GATE / MASTER ACCEPTANCE CRITERIA

Not production-ready until **all** are true:
- [ ] Android app builds and runs on supported Android versions/devices.
- [ ] Database created from versioned migrations; integrity constraints in place; data preserved across all migrations.
- [ ] All financial mutations pass the authoritative precondition pipeline and Impact + Conflict Engine; conflicts never partially save.
- [ ] All balances derived from authoritative backend truth and explainable; fund allocation, outstanding, reimbursement reconcile.
- [ ] Every posted movement is a balanced double-entry journal; trial balance balances per entity and period; sub-ledgers = control accounts; inter-entity dues reciprocal; fund and location totals reconcile; Integrity Verifier clean; every AC10 example verified; financial statements tie out to the ledger; Accounting Model Record approved and implemented.
- [ ] Insufficient funds rejected; reserved funds protected; duplicates and concurrent mutations controlled; commits atomic.
- [ ] History immutable except via controlled reversal/correction; period locking works.
- [ ] Ownership, location, fund, payer, holder, handler, receiver and approver remain distinct.
- [ ] Granular discover/view/amount/details/create/edit/reverse/approve/reconcile/export/share/manage permissions enforced server-side, object- and field-level.
- [ ] Personal finance owner-private by default; owner grants audited.
- [ ] No hidden-data leakage through totals, charts, search, filters, counts, reports, notifications, exports, WhatsApp, documents, errors or logs.
- [ ] Sensitive values encrypted appropriately; passwords hashed; keys never on Android; key rotation tested; secure storage verified.
- [ ] Remember Me never stores passwords; M-PIN separate from password; biometric uses Android platform authentication; Forgot Password / Forgot M-PIN are reset flows; lost-device and session revocation work.
- [ ] Super Admin can manage members, firms, masters, policies; cannot retrieve secrets or keys; all admin actions audited.
- [ ] Deterministic exception detection works. **No AI anywhere.**
- [ ] No screenshot used as proof; Photo Proof and PDF are generated artifacts.
- [ ] Every external share: authorized data only, recipient verification, exact preview, explicit confirmation, step-up where required, invalidation on change, honest delivery status, audited.
- [ ] Secure document controls (password, encryption, watermark, expiry, secure viewer, revocation, recipient identity, download, print, verification, step-up) configurable as OFF / DEFAULT ON / MANDATORY; stricter policy wins; expiry/revocation work; financial records retained independently.
- [ ] Audit logs capture all sensitive actions and are tamper-evident.
- [ ] Backup/restore tested end-to-end.
- [ ] Offline mode cannot bypass financial truth or authorization.
- [ ] Every Edge-Case Matrix row is implemented and tested; no silent corruption, partial update, duplicate posting, permission/hidden-data leak or broken reference is possible in any tested combination.
- [ ] Global search works across every listed attribute with suggestions, filters, recent searches and autocomplete, and is fully permission-filtered.
- [ ] UX tap/time budgets met; navigation consistent; role-based usability walkthroughs passed.
- [ ] Every screen has all states; design system applied consistently; accessibility checked.
- [ ] All Part V test categories pass.
- [ ] Documentation current; no secrets in Git; no half-finished feature treated as complete.

---

# PART Y — FINAL GOLDEN RULES

1. Never post without complete precondition validation.
2. Always recheck the authoritative current balance at commit.
3. Insufficient available funds block debits unless an explicit overdraft/approval rule permits.
4. Every financial operation is atomic.
5. Duplicate mutations are prevented.
6. Ownership, location, payer, holder, handler, receiver and approver are different concepts.
7. Company visibility ≠ account visibility ≠ fund visibility ≠ transaction context.
8. Viewing ≠ editing ≠ approving ≠ exporting ≠ sharing.
9. Hidden data never leaks through totals, charts, search, notifications, exports, WhatsApp or documents.
10. Passwords hashed; recoverable financial values encrypted; keys separately protected; backups encrypted and restore-tested.
11. Frontend hiding is never security; backend authorization is mandatory.
12. WhatsApp/PDF/photo/message generation only from the authorized data scope.
13. Each secure-document control independently configurable with OFF / DEFAULT ON / MANDATORY; stricter policy wins; users customize only what policy permits.
14. Never promise remote destruction of downloaded files.
15. Every sensitive share, configuration change and financial change is auditable.
16. Historical records never silently disappear; master data is archived, not deleted.
17. Every balance is explainable; configuration never bypasses financial invariants.
18. No single frontend bug can override backend financial/security rules.
19. Authentication alone never exposes sensitive data.
20. Personal finance is owner-private by default.
21. Every change propagates its full impact atomically or fails with a clear conflict — never partial.
22. One real-world event = one master transaction with linked, balanced double-entry journals; Σ debits = Σ credits per journal, per entity and per fund — always.
- Account ≠ Fund ≠ Ownership ≠ Money Location ≠ Holder ≠ Transaction ≠ Ledger Entry ≠ Balance ≠ Outstanding ≠ Liability ≠ Receivable/Payable.
- Value never crosses entities without an explicit classification (due-to/due-from, capital, drawing, settlement, expense, income).
- Balances, remaining amounts and closing balances are derived from posted lines — never typed.
- Custom terminology is a label; the accounting underneath is always correct.
- Simple → fast → clear → few clicks: the app feels easy; the complexity stays underneath.
- Users always know where they are, what they can do and how to go back; search reaches anything in minimum steps — and only what they may see.
- No happy-path-only design: every realistic combination has a defined, tested outcome; conflicts resolve to the safest correct behaviour with a clear resolution path.
23. Normal users see only the complexity their job needs.
24. The system scales from a few family users and companies to a large internal organization.
25. When financial integrity is uncertain: stop, warn, require review.
26. **NO AI. NO SCREENSHOT AS PROOF. NO UNVERIFIED EXTERNAL SHARING. ANDROID ONLY NOW.**

---

# PART Z — FUTURE (DESIGN FOR, DO NOT BUILD)

- **Web client** (admin, master setup, full financial review, fund management, permissions, reports, reconciliation, audit, security, approval queues, exports, multi-device management) and **iOS client** — both reuse the same database, backend, authentication, authorization, financial engine, posting engine, permission engine, audit engine, security policy engine and share/document security model. No second database, no duplicate logic.
- Optional deterministic extensions: automated bank statement matching, receipt OCR, scheduled reports, cash-flow forecasting, multi-currency, branches, departments, cost centers, business units. (Natural-language/voice/AI features remain excluded.)

---

# FIRST SESSION — WHAT TO DO NOW

1. Read this entire prompt. Restate, in under one page, your understanding of Part A, the AC1 glossary, and how one sample transaction (AC10 example 4) becomes journal lines — plus any ambiguities.
2. Create the Part E documentation skeleton and populate PRD.md, SRS.md, SECURITY.md (with threat model outline), RULES.md and TEST_PLAN.md from this prompt — without dropping any requirement.
3. Produce the Stack Decision Record (Part D) and the Accounting Model Record (Part H-A AC19) and **stop for approval**.
Do not write application code before step 3 is approved.
4. After approval: produce the database schema, the design system, the UX blueprint (Part K-UX) and the master Edge-Case Matrix (Part G-EC) — and **stop for approval** again before building screens or financial logic.
