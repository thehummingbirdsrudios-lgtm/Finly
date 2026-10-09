# ADDON-14 — Fully dynamic, configurable architecture

Received 2026-10-09, recorded verbatim.

---

**ADD-ON REQUIREMENT — FULLY DYNAMIC, CONFIGURABLE ARCHITECTURE**

Never hardcode any person name, firm name, business/entity name, account name, fund name, location, role assignment, or other user-specific business data anywhere in the application logic. **Everything must be dynamic, configurable, and flexible.**

Load all names, entities, relationships, roles, permissions, and business settings from the online database. Support creating, renaming, updating, archiving, and managing an unlimited number of entities and users, subject to system limits and authorization. The application must adapt automatically to newly created entities without requiring code changes or redeployment.

Build reusable, entity-independent database schemas, APIs, UI components, business logic, reports, permissions, and workflows. Never design the architecture around a fixed number of users, firms, partners, accounts, or locations. Enforce relationships and access permissions through database identifiers and validated authorization rules—not names or hardcoded conditions.

Use initial seed data only when explicitly required, and keep it configurable and separate from application logic. Verify that adding a new user or entity works throughout the complete application without modifying source code. **Make Finly genuinely data-driven, extensible, multi-user, and production-ready.**

---

## How it is applied

- **Audit 2026-10-09:** no person, firm, account, fund or location name appears in any migration's logic, in
  `backend/src/` or in `app/lib/`. Three table/column *comments* used family names as examples; migration 0010
  replaces them with neutral wording. The seed (0008) contains only generic configuration (transaction types, account
  templates, location types, permission keys, roles) — no people, firms or places.
- Names in the specification documents (Krish, Mint, JSK, Tijori …) are the owner's worked examples. They appear only
  in docs and in the test fixture `backend/tests/db/world.ts`, which creates them as ordinary data through the same
  tables any user would use.
- Every relationship and permission is by id (`entity.id`, `env_access`, `role_permission`); names are labels
  (`display_name`, `location.name`) that can be renamed without effect.
- Open verification: a test that creates a new user and a new entity entirely through the API and uses them end to
  end (planned with the API, add-on 12).
