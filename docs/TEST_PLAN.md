# Test plan

What "working" means for Finly (BUILD_PROMPT Parts G-EC, V and X; add-ons 01, 02 and 05). Test tooling per category is
fixed in the Stack Decision Record at Gate 1.

## 1. Definition of done (every feature)

A feature is done only when all of these are true:

1. Its [flow map](FLOWS/README.md) and its Edge-Case Matrix rows exist, and every row has an automated test or a documented manual check.
2. It works end to end on the owner's phone against the real backend: UI → state → domain → API → database → audit, including offline and failure paths.
3. Lint, static analysis, unit, integration, database, API, widget and relevant E2E tests pass; the build succeeds.
4. Every K3 state is implemented and tested for each of its screens; accessibility checks pass (TalkBack labels, 200 % text, contrast, 48 dp targets).
5. Authorization is tested for every role against restricted resources, including search, counts, totals and errors.
6. Performance is measured on the floor device for the flows it touches, and stays within budget.
7. Financial invariants are re-verified; no partial save, duplicate posting or hidden-data leak is possible in any tested combination.
8. Documentation and [MEMORY.md](MEMORY.md) are updated; the change is committed on its own (add-on 05).

## 2. Test categories (Part V1)

| Category | What it proves | Run |
|---|---|---|
| Unit | Pure logic: money formatting, split remainder, state transitions, policy evaluation | Every commit (CI) |
| Integration (backend + database) | Posting pipeline, constraints, row locking, migrations | Every commit (CI, local stack) |
| Financial | Every V2 case and every AC10 worked example | Every commit |
| Property-based | Random valid sequences never break AC6; random invalid operations always roll back atomically | Every commit |
| Authorization | Every role × restricted resource × action, including discovery and aggregation | Every commit |
| Security | Authentication, sessions, encryption at rest, IDOR, secret extraction from the APK, step-up | Every commit + before release |
| Android / widget / golden | Each widget's states, light/dark, 200 % text, semantics | Every commit |
| E2E on device | Real journeys on the owner's phone (and an older Android version) | Before merge of a milestone |
| Offline and sync | Queue, retry, rejection with reason, conflict review, revocation mid-queue | Every commit + device |
| Concurrency | Simultaneous post, reverse, settle, approve, close | Every commit |
| Fault injection | Network loss, timeout with unknown commit outcome, server and database failure, app killed mid-sync | Every commit |
| Recovery | Password, M-PIN, device, session, backup restore | Before release + scheduled drills |
| Performance | Startup, navigation, scrolling, search, reports, PDF on the floor device | Each milestone |
| Document and share | PDF, photo proof, security controls, verification invalidation | Every commit |
| Screen privacy | Confidential screens, recent-apps preview, no flow needing a screenshot | Before release |
| Regression | Every fixed bug gets a test that failed before the fix | Every commit |
| Accessibility | Automated checks + TalkBack walkthroughs | Each milestone |
| UX budgets | Tap and time budgets of the top flows (set at Gate 4) | Each milestone |

## 3. Mandatory cases

The mandatory financial tests (V2), accounting tests (V2, Part H-A), security and privacy tests (V3), share and
document tests (V4), screen-privacy tests (V5), edge-case tests (V6) and UX and search tests (V7) are requirements
in full; each becomes a `T-` row under its module below as the module is built.

## 4. Edge-Case Matrix

Row format (EC1):

`ID · Condition combination · INPUT → VALIDATION → AUTHORIZATION → DEPENDENCIES → IMPACT → CONFLICT → FINANCIAL RESULT → ATOMIC SAVE / ROLLBACK → AUDIT → UI RESULT (exact message + resolution path) · Test reference`

Method (EC3): pairwise coverage across the EC2 dimensions, then every high-risk combination explicitly (money +
permission + concurrency + offline + period); impossible combinations pruned only with a written reason.
Precedence when rules collide (EC4): B2 priorities → deny beats allow, reject beats partial save → server state and
permissions at commit time win → closed period and posted history win → explain and offer a resolution path.

The master matrix is completed at M2 (Gate 4). Module sections, each grown before its module is built:

### 4.1 Authentication, startup and sessions
### 4.2 Setup wizard and user management
### 4.3 Authorization, visibility and aggregation
### 4.4 Accounting core and posting pipeline
### 4.5 Expenses, splits and expense events
### 4.6 Outstanding, reimbursements, advances, settlements, inter-company
### 4.7 Handover and custody
### 4.8 Reversal, correction, periods and opening balances
### 4.9 Reconciliation, exceptions and month close
### 4.10 Reports, statements, import and export
### 4.11 Search
### 4.12 Notifications
### 4.13 Sharing and secure documents
### 4.14 Offline and sync
### 4.15 Super Admin, configuration and labels

Each section starts from the EC5 mandatory cases for its area.

## 5. Checks that exist today

| Check | Command | Covers |
|---|---|---|
| Design-system contrast | `npm --prefix design-system/tools run contrast` | 138 colour pairs, both themes, WCAG AA |
| Reference component render | `npm --prefix design-system/tools run render` | All previews render; rupee formatting units; tokens and classes exist |

## 6. Release gate

Nothing ships until every item in BUILD_PROMPT Part X is true and recorded here with its evidence.
