# Source documents

Everything Finly must do comes from these files. They are never edited after they are recorded; later
documents refine earlier ones, and **where two differ, the stricter security, privacy and integrity reading wins**
(BUILD_PROMPT A6.2). Part A of the build specification overrides everything.

| File | Received | Subject |
|---|---|---|
| [BUILD_PROMPT.md](BUILD_PROMPT.md) | 2026-10-08 | The authoritative build specification (Parts A–Z) |
| [ADDON-01](ADDON-01-production-free-backend-git.md) | 2026-10-08 | Production-grade app, free backend (Supabase preferred), Git discipline |
| [ADDON-02](ADDON-02-engineering-rules.md) | 2026-10-08 | Professional software, mobile and production engineering rules |
| [ADDON-03](ADDON-03-mobile-app-only.md) | 2026-10-08 | Native mobile app only |
| [ADDON-04](ADDON-04-flutter-dart-ui-packages.md) | 2026-10-08 | Flutter + Dart required; packages chosen against built-ins |
| [ADDON-05](ADDON-05-commit-every-change.md) | 2026-10-08 | A tested, reviewed commit for every change |
| [ADDON-06](ADDON-06-initial-users-first-login-roles.md) | 2026-10-08 | Initial users, first login, role management |
| [ADDON-07](ADDON-07-finly-startup-branding-onboarding.md) | 2026-10-08 | The name Finly, branding and logo, splash, setup wizard |
| [ADDON-08](ADDON-08-ui-ux-motion-visual-design.md) | 2026-10-08 | Best-in-class UI/UX, decoration, per-interaction motion |
| [ADDON-09](ADDON-09-premium-theme.md) | 2026-10-08 | A distinctive, centralised premium theme |
| [GATE-RESPONSE-01](GATE-RESPONSE-01-gates-1-2.md) | 2026-10-08 | Gate 1 approved with conditions; Gate 2 corrections (custody history, Angadiya split) |
| [ADDON-10](ADDON-10-continue-to-full-completion.md) | 2026-10-08 | Continue to a complete, working app; stop only at external blockers |
| [GATE-RESPONSE-02](GATE-RESPONSE-02-f1-f7.md) | 2026-10-08 | Answers to F1–F7; source of money ≠ expense owner; continue building; GitHub repository |
| [RULEBOOK-01](RULEBOOK-01-accounting-core.md) | 2026-10-08 | Accounting core rulebook — 152 rules for the journal, ledger and double-entry engine |
| [RULEBOOK-02](RULEBOOK-02-master-accounting-engine.md) | 2026-10-08 | Master accounting engine — loans, advances, inter-firm, settlements, the 100 non-negotiable rules |
| [RULEBOOK-03](RULEBOOK-03-finance-engine-scenarios.md) | 2026-10-08 | Finance engine scenarios — entities, environments, access, masters, 42 acceptance tests |
| [ADDON-11](ADDON-11-database-architecture-schema.md) | 2026-10-08 | Database architecture and schema master prompt: the 16 design outputs before any migration |
| [GATE-RESPONSE-03](GATE-RESPONSE-03-decisions-q1-q3-postgres.md) | 2026-10-09 | Q1 acknowledgement default, Q2 encryption investigation and authorised fallback, Q3 account activation without impersonation, F8/F9 explanation request, use the local PostgreSQL (one credential redacted) |
| [ADDON-12](ADDON-12-complete-the-app-online-only.md) | 2026-10-09 | Complete the whole app to production readiness; **online-only: no local database, no offline mode, no offline queue** |
| [ADDON-13](ADDON-13-final-master-production-grade.md) | 2026-10-09 | Final master add-on: complete production-grade app, Supabase via MCP as the primary database, enterprise architecture, industrial UI/UX, the 11-step financial operation sequence, full test strategy |
| [ADDON-14](ADDON-14-fully-dynamic-configurable.md) | 2026-10-09 | Fully dynamic: no hard-coded names of people, firms, accounts, funds, locations or role assignments; everything from the database |
| [ADDON-15](ADDON-15-final-master-development-dependencies.md) | 2026-10-09 | Final master development prompt: independent yet interconnected modules, explicit dependency graph and impact analysis, architecture tests, transactional outbox for async effects, one authorisation model across UI, API and database |
| [GATE-RESPONSE-04](GATE-RESPONSE-04-f8-f9-final.md) | 2026-10-09 | The owner's answer to F8/F9: two independent transactions (firm → owner, owner → anyone), each side Own or Expense — eight base scenarios; F8 treatments A/B/C; F9 C1 expense / C2 repayable; repayment Option A (two linked debts) or B (recipient owes the firm) |
| [ADDON-16](ADDON-16-universal-accounting-edge-cases.md) | 2026-10-09 | Universal accounting, edge cases and integrity: transaction families, Own/Expense/Transfer/Repayable rules, edge-case catalogue, concurrency, reconciliation, reports, 15 deliverables |
| [ADDON-17](ADDON-17-entity-hierarchy-custom-roles.md) | 2026-10-09 | Entity hierarchy (parent–child), platform vs entity roles, custom role builder, role holders, entity creation modes, permission catalogue and scopes, RLS, delegation |
| [ADDON-18](ADDON-18-ownership-partnership-permissions.md) | 2026-10-09 | Ownership ≠ partnership ≠ creator ≠ membership ≠ role ≠ effective permission; eight ownership/partnership/membership combinations; scenarios A–X; delegation; entity creation flow |
| [GATE-RESPONSE-05](GATE-RESPONSE-05-d038-f8f9-approvals.md) | 2026-10-09 | D-038 confirmed (no platform access to firms' books); F8/F9 modified: purpose-based classification, no automatic owner income or giver expense; configurable owner-benefit approval |
| [ADDON-19](ADDON-19-master-continuation.md) | 2026-10-09 | Master continuation prompt: continue from the real state until the complete app is implemented, integrated, tested and verified; phases A–H; testing strategy; persistent checklist |
| [ADDON-20](ADDON-20-customizable-ledger-rough-hisab.md) | 2026-10-09 | Customizable spreadsheet-style ledger (templates, typed columns, dropdowns, safe formulas and functions), rough-hisab workspace, assets and rate conversions, banks and account holders, clearing, reconciliation, settlement |
| [ADDON-21](ADDON-21-personal-finance-wealth.md) | 2026-10-09 | Complete personal finance and wealth: dashboard, net worth, budgets, assets, loans given and taken, investments, funds, recurring items, business P&L, cross-report integrity |
| [ADDON-22](ADDON-22-bank-statement-import-whatsapp.md) | 2026-10-09 | Bank statement PDF import (extraction, review grid, duplicate matching, reconciliation) and WhatsApp sharing throughout the app. **The owner's last add-on: from here the mobile app is completed, no new scope** |

Other documents cite "the source documents" and link here, so a new add-on is recorded in one place.
