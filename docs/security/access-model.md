# Access model — ownership, partnership, membership, roles, permissions, hierarchy

Sources: [ADDON-17](../source/ADDON-17-entity-hierarchy-custom-roles.md), [ADDON-18](../source/ADDON-18-ownership-partnership-permissions.md),
read with [ADDON-15](../source/ADDON-15-final-master-development-dependencies.md) §7 and the earlier rules they
refine (A4, L1–L16, RULEBOOK-03 §2–§9). Decision D-038. Both add-ons require this audit, the target model and a safe
migration plan **before** any schema change; this document is that deliverable.

The rule the whole model serves:

> Platform authority ≠ legal ownership ≠ partnership ≠ entity creator ≠ membership ≠ application role ≠ permission
> grant ≠ role holder ≠ parent–child relationship ≠ effective access.

## 1. Audit of the current implementation (migrations 0001–0013)

| Concept | Where it lives today | Gap against add-ons 17/18 | Risk |
|---|---|---|---|
| Identity | `app_user` 1:1 a person `entity` | Fits (ownership may name any party; a login is always a person) | — |
| Entity | `entity` (firm, person, pool, party), `entity_type`, `managed_in_env_id` | No parent–child hierarchy, no relationship kinds (branch, subsidiary…) | Medium |
| Creator | `entity.created_by` (no FK) | Fits as audit metadata; never used for access ✓ | — |
| **Ownership** | `entity_membership.engine_role = 'owner'` | **Overloaded** with partner/staff; no share (%/units), type, verification, effective-dated history with approvals | **High** |
| **Partnership** | same table, `engine_role = 'partner'` | Not independent of ownership; no type, responsibilities, history | High |
| Membership | `env_access` (user × entity, `level` read/write/manage, validity, revocation) | No invited / suspended / ended states; the coarse `level` decides access instead of roles | High |
| Roles | global `role` (system roles), `role_permission` (allow/deny) | No entity-local **custom roles**, no versions, no scope type | High |
| Role holders | `user_role` (user, role, `scope_entity_id`, revocation) | No expiry, no delegation provenance | Medium |
| Permission registry | `permission` (key, resource, action, step-up) | No feature group, scope types, platform-only / grantable / sensitive / implemented flags | Medium |
| Direct grants / restrictions | `access_rule` (allow/deny, amount visibility, validity, source) | Good base; no delegation source or onward-delegation limit | Low |
| Delegation | — | Missing: who may grant what, onward, until when | High |
| Hierarchy policies | — | Missing: parent → child capabilities, default deny | High |
| Entity creation | ad hoc inserts | No creation permissions, modes, atomic creation with designated owners | Medium |
| Invitations | `account_activation` (account level only) | No per-entity invitation bound to an identity | Medium |
| **Super Admin** | `admin.full` gives read/write on **every firm** (`actor_env_ids`) | **Contradicts ADDON-17 §4.1 / ADDON-18 §5.1**: platform authority must not expose customer books | **High** |
| **Owner shortcut** | posting policy and `actor_owns_entity` treat an ownership record as authority to post | **Contradicts ADDON-18 §1.5, §4**: ownership is not a permission | **High** |

## 2. Target model

### 2.1 Records (normalised; never one `role` field or `is_owner` flag)

| # | Record | Holds | Notes |
|---|---|---|---|
| 1 | `entity` | as today + `created_by` (FK) | creator = audit only |
| 2 | `entity_relationship` | parent, child, kind (`branch`, `subsidiary`, `business_unit`, `joint_venture` = structural; `reporting`, `management` = links), effective dates, approver | one structural parent per child; cycles refused by trigger |
| 3 | `entity_ownership` | entity, owner (any entity: person, firm, party), share basis (`percent` in basis points / `units` / `unspecified`), ownership type (configurable list), verification (`unverified`, `pending`, `verified`, `disputed`), effective dates, recorder, approver | active percentages never exceed 100 %; history kept (end-dated, never deleted) |
| 4 | `entity_partnership` | entity, partner (any entity), type (configurable: equity, working, sleeping, non-equity …), responsibilities, optional profit share, effective dates | independent of ownership |
| 5 | `entity_affiliation` | the remaining non-owner, non-partner relations (staff, other) | what is left of today's `entity_membership` |
| 6 | **membership** = `env_access` + `member_status` | user × entity, status (`invited`, `active`, `suspended`, `revoked`, `ended`), validity, who added | name kept (functions depend on it); `level` retired after the policy engine moves to permissions |
| 7 | `member_invitation` | entity, the identity it is bound to, proposed roles, expiry, single use, status | acceptance creates the membership and assignments atomically |
| 8 | `role` | + `scope_type` (`platform`, `entity`, `template`), `scope_entity_id` for entity-local custom roles, `is_custom`, `version`, category, notes | names unique within their scope only |
| 9 | `role_permission` | as today | changes recorded per version in `role_change` (before/after, approver) |
| 10 | `user_role` (role holders) | + `valid_until`, `delegation_id` | assignment validated against the assigner's authority |
| 11 | `permission` | + `feature`, `scope_types`, `platform_only`, `grantable`, `sensitive`, `implemented`, `requires` (e.g. view amounts ⇒ view) | drives the role builder; only implemented permissions are offered |
| 12 | `access_rule` | as today + `delegation_id` | direct grants and restrictions |
| 13 | `delegation` | grantor, grantee, entity scope (± descendants), permissions or roles it covers, onward delegation allowed, validity, source delegation, revocation | re-checked at every use |
| 14 | `hierarchy_grant` | relationship, permission (hierarchy-eligible only), the parent-side role whose holders receive it, validity, approver | default deny; no "full access" flag |
| 15 | `change_request` | sensitive changes needing approval (ownership, hierarchy, sensitive role edits): proposal, status `pending/approved/rejected/cancelled/disputed`, approvals | multi-owner approval where policy requires |

### 2.2 Effective permission — one function, used by RLS, the API and the UI

`finly.effective_permissions(user, entity)` = the union of

1. the user's **own personal books**: every personal permission (A4);
2. **role holders**: active, unexpired `user_role` rows scoped to the entity (or platform roles, which carry only
   platform permissions), through an **active membership** of that entity;
3. **direct grants** (`access_rule` allow) for the entity or its resources;
4. **hierarchy grants**: holders of the named role in a parent, through an active relationship and grant;

minus every **deny** (role deny, `access_rule` deny), minus **mandatory rules**, which always win:

- platform-only permissions never come from an entity role, and platform roles never carry financial-data permissions;
- someone else's personal books only through that person's own grant (A4, D-029);
- a suspended or disabled account, a revoked/ended membership, an expired grant authorise nothing;
- segregation of duties (maker ≠ checker) where configured.

`actor_env_ids(level)` and `actor_has_permission(key, env)` become thin wrappers over it, so the ~80 existing RLS
policies keep their shape while their meaning moves from levels to permissions.

### 2.3 Delegation and escalation rules (ADDON-17 §5.5, §14; ADDON-18 §11)

- Creating a custom role needs `role.create_custom` in its scope; every permission in it must be one the creator may
  **grant** there (held, grantable, not platform-only); otherwise the whole request is refused with the reasons.
- Assigning a role needs `role.assign` and the ability to grant **all** of that role's permissions to that recipient.
- Nobody grants themselves anything; onward delegation only where the delegation allows it, never wider than the
  grantor's own authority, checked at grant time **and** at use; a grantor's lost authority lapses what depends on it.
- Editing a shared template never changes entity-local roles; editing a role shows its holders and the access change.

## 3. Migration plan (safe, repeatable, no access widened by guessing)

| Step | Migration | What happens to existing data |
|---|---|---|
| 1 | `0014` relationships: `entity_ownership`, `entity_partnership`, `entity_affiliation`, `entity_relationship`, lookups | `entity_membership` rows: `owner` → ownership (**share `unspecified`, verification `unverified`** — marked for review, ADDON-18 §21); `partner` → partnership (type `unspecified`); `staff`/`other` → affiliation. The engine's owner check reads `entity_ownership` |
| 2 | `0015` membership status, invitations, role scope/versions, registry metadata, holder expiry, delegation, hierarchy grants, change requests | `env_access` rows become `active` (or `revoked`); roles become `platform` (Super Admin) or `template` (the others); permissions get metadata |
| 3 | `0016` the policy engine (`effective_permissions`) and the wrappers | **Super Admin loses implicit firm access**; owners keep access only through role assignments — each existing owner receives an explicit "Entity owner" role in their firms so nobody is locked out, recorded as a migration grant for review |
| 4 | services and API: entity creation (modes A–E), invitations, ownership/partnership changes with approval, role builder validation, assignment | — |
| 5 | Flutter screens (entity switcher, administration sections, role builder, role holders, previews) | — |

Every step: tests first for the new rules, the full suite on PGlite, PostgreSQL 17 and 18, fingerprint-verified
deployment. Rollback is forward-fix; no step deletes historical ownership, membership or financial records.

## 4. Decisions and questions

- **D-038 (applied, stricter reading):** platform administration no longer implies access to firms' books. The
  earlier RULEBOOK-03 §7 rule ("full admin covers every firm") is superseded by ADDON-17 §4.1 / ADDON-18 §5.1. A
  Super Admin who needs to see a firm gets a role there, or uses the consented support process.
- **Owners keep working:** step 3 gives each recorded owner an explicit owner role in their firm, so no one loses
  access they have today except through the Super Admin rule above.
- **For the owner to confirm:** the default permission bundles of the system role templates (Entity owner, Entity
  admin, Accountant, Cashier, Worker, Auditor/Viewer) — proposed in the seed of step 2 and editable afterwards.
