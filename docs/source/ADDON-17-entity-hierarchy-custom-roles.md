# ADDON-17 — Master specification: entity hierarchy, custom role builder, role holders, access, entity creation, database security and UI

Received 2026-10-09 as the file `# FINLY — MASTER SPECIFICATION.txt` (moved here unchanged). Recorded verbatim below the line.

---

# FINLY — MASTER SPECIFICATION
## Universal Entity Hierarchy, Ownership, Custom Role Builder, Role Holders, Access Permissions, Entity Creation, Database Security, and Complete UI/UX

## 1. Objective

Audit, design, implement, and verify Finly's complete, production-grade system for:

- Platform Super Admin and Platform Admin.
- Independent entities and parent–child entity hierarchies.
- Business owners, partners, administrators, workers, accountants, and other members.
- Custom roles created according to each entity's own requirements.
- Role holders and flexible assignment of roles to selected users.
- Granular permissions, data visibility, and resource-level access.
- Entity creation, invitations, membership, and access delegation.
- Parent–child permission policies.
- PostgreSQL/Supabase schema, Row Level Security (RLS), authentication, audit history, and concurrency.
- Flutter screens for managing all these relationships.

This must be a fully connected, data-driven system. Do not hard-code users, entity names, roles, permission combinations, hierarchy depth, or a fixed number of entities.

Before making changes, inspect the existing Finly repository, database schema, authentication, role tables, RLS policies, functions, screens, navigation, and existing financial workflows. Preserve valid data and behavior. Produce a gap analysis and safe migration plan.

**Primary architectural rule:**

`Platform authority ≠ Legal ownership ≠ Partnership ≠ Entity creator ≠ Entity membership ≠ Application role ≠ Permission grant ≠ Role holder ≠ Parent–child relationship ≠ Effective access.`

These concepts must be represented separately and connected only through explicit, validated rules.

---

# 2. Core system concepts

## 2.1 Platform

The platform is the entire Finly application environment. It may contain many completely independent business entities and a restricted platform-administration layer.

Platform privileges must not be inherited by an ordinary entity owner or administrator.

## 2.2 Entity

An entity is a separately identifiable financial or business workspace.

Support configurable types such as:
- Personal book.
- Sole proprietorship.
- Partnership firm.
- Company.
- Branch or business unit.
- Subsidiary.
- Joint venture.
- Other supported entity types.

Every entity has its own identity, configuration, ownership relationships, membership, financial data, roles, and access policy.

## 2.3 Entity creator

The creator is the user who initiated the entity-creation process.

Creation does not automatically establish legal ownership, permanent administration privileges, platform authority, or access to other existing firms.

The creator receives access only through explicitly authorized initial role and membership assignments.

## 2.4 Legal/business owner

An owner is recorded through a separate ownership relationship. An entity can have multiple owners, potentially with different ownership percentages or interests.

An ownership record does not automatically create an active login or unrestricted financial access.

## 2.5 Partner

A partner is recorded through a partnership relationship.

A partner may or may not also be an owner, and may or may not be an active Finly member.

Partnership status must not automatically grant access to every financial record.

## 2.6 Membership

Membership determines whether an authenticated user has an active relationship permitting application access to a particular entity.

Support pending invitation, active, suspended, revoked, and ended states.

## 2.7 Application role

A role groups a configurable set of permissions within a particular scope.

Roles must be independently assignable to different members and can differ between entities.

## 2.8 Role holder

A role holder is a user or authorized subject who has been assigned a role in a defined scope.

The role creator and role holder may be different people. Creating a role must not automatically assign it to the creator.

A user can hold multiple compatible roles within one entity and different roles in different entities.

## 2.9 Permission

A permission represents an allowed action against a resource within a specified scope.

Examples include viewing balances, creating transactions, approving transactions, managing members, creating child entities, creating custom roles, and delegating permissions.

## 2.10 Effective access

Effective access is the result of validating the authenticated identity, entity membership, assigned roles, direct grants, restrictions, hierarchy policies, resource scope, expiry, delegation authority, and mandatory security rules.

Every protected screen, API request, database operation, report, search result, export, attachment, and financial mutation must respect that result.

---

# 3. Complete entity hierarchy

## 3.1 Independent entity roots

A user may create or own multiple completely independent entities.

For example:

- Krish owns Firm A.
- Krish also owns Firm B.
- Firm A and Firm B are independent roots.
- Firm A's administrators cannot access Firm B merely because the same person owns both.

Shared ownership or a shared administrator must not silently merge the access boundaries.

## 3.2 Parent–child entities

Support a configurable hierarchy of entities at any practical depth, subject to documented system limits.

Example:

Finly Platform
- Independent Business A
  - Branch A1
  - Subsidiary A2
    - Branch A2-1
- Independent Business B
  - Branch B1
- Personal Book C

Each entity has its own ID, ownership records, membership, role assignments, financial books, and audit records.

A branch, subsidiary, or child entity must not automatically inherit all records or users from its parent.

## 3.3 Entity creation modes

The creation workflow must support the following modes where the user is authorized:

**Mode A: Create an independent entity**

Creates a new root entity with its own owners, members, administrators, roles, settings, and financial records.

**Mode B: Create a child entity**

Creates a child under a selected parent where the creator has `entity.create_child` authority for that parent.

**Mode C: Create a branch or subsidiary**

Creates a specifically typed child relationship with its own ownership, access, and reporting rules.

**Mode D: Create on behalf of another person or organization**

An authorized user sets up an entity for a designated owner or organization. The creator, legal owner, initial administrator, and approver are recorded separately.

**Mode E: Create another independent entity while already owning one**

An existing firm owner may create another independent firm only if the applicable product policy and permissions allow it. The new entity does not automatically become a child of the existing firm.

## 3.4 Parent–child access

Define explicit policies for:
- Parent-to-child access.
- Child-to-parent access.
- Sibling-to-sibling access.
- Ancestor-to-descendant access.
- Reporting-only links between entities.
- Shared services or management relationships.

Default to denying cross-entity access unless an explicit, authorized policy permits it.

Parent-to-child permissions may include viewing entity metadata, viewing aggregate reports, viewing financial amounts, accessing transactions, managing members, assigning roles, creating descendants, or administering child settings.

These permissions must be separate.

A parent administrator may be permitted to view aggregated reports while remaining unable to open individual child transactions.

A child entity may permit the parent's accountant to review selected books without allowing that accountant to manage its owners or users.

Do not use one unrestricted `parent_has_full_access` flag.

## 3.5 Hierarchy changes

Creating, moving, linking, detaching, or transferring an entity within the hierarchy is a sensitive operation.

Validate the actor's authority, prevent cycles, identify affected descendants, calculate access changes, show affected users, obtain required approvals, commit the change atomically, and record it in the audit log.

A hierarchy change must not silently transfer legal ownership, duplicate transactions, merge books, or give all parent members access to the child.

---

# 4. All role families

Finly must support the following distinct role families. Their exact permission bundles should be configurable within applicable security limits.

## 4.1 Platform Super Admin

Responsible for authorized platform-level operations.

Possible powers include platform configuration, platform-role administration, approved entity provisioning and recovery, and reviewing platform audit events.

Super Admin access must not automatically make the person a legal owner of each entity or grant unrestricted access to all customer financial records.

Super Admin assignment must use a highly restricted administrative workflow. An entity owner must never be able to grant platform Super Admin privileges.

## 4.2 Platform Admin

May manage explicitly delegated platform functions.

Platform Admin is not automatically equivalent to Super Admin and does not automatically receive unrestricted database or financial-data access.

## 4.3 Platform Support Operator

Can execute approved support tasks within defined scope and duration.

Sensitive customer-content access must require explicit authorization and auditing. No silent impersonation is permitted.

## 4.4 Entity Owner access profile

A default permission profile suitable for authorized owners. It is separate from the legal ownership record.

Its permissions may include viewing permitted reports, configuring entity settings, managing members, proposing ownership changes, or approving selected operations, depending on policy.

Multiple owners may receive different roles and effective permissions.

## 4.5 Entity Admin

Manages an entity within delegated authority.

It may include member management, role assignment, permitted configuration, operational workflows, and selected reporting.

It must not automatically imply legal ownership, unrestricted financial access, ownership-management authority, platform administration, or unrestricted child-entity access.

## 4.6 Entity Manager

Handles operational management in an authorized scope.

## 4.7 Accountant or Finance Manager

Performs assigned accounting, reporting, reconciliation, and financial operations.

Approval, posting, reversal, period closing, and exporting are separate permissions.

## 4.8 Cashier or Treasurer

Manages permitted receipt, payment, cash, and reconciliation workflows.

## 4.9 Salesperson or Worker

Receives the operational features and records needed for assigned work. Financial visibility is independently controlled.

## 4.10 Auditor or Read-Only Viewer

Receives authorized viewing permissions. Read-only access does not automatically include exports, attachments, sensitive amounts, or access to unrelated entities.

## 4.11 Custom Entity Role

A role created by an authorized administrator or owner based on their own entity's requirements.

This is a mandatory core feature, not a future optional enhancement.

Custom roles must be configurable through the Flutter UI, persisted in PostgreSQL/Supabase, assignable to selected members, auditable, scoped correctly, and enforced by the backend.

---

# 5. CUSTOM ENTITY ROLE BUILDER — REQUIRED FEATURE

## 5.1 Purpose

Every entity with the relevant delegated authority must be able to define custom roles that match its operational needs.

For example, one firm may need a role called `Purchase Entry Operator`. Another may need `Cash Verification Officer`. Another may need `Branch Finance Viewer`.

These names are examples only. Do not hard-code a fixed catalogue of business-specific roles.

The authorized role creator should be able to choose the role name, description, scope, permissions, visibility settings, operational capabilities, data limitations, and applicable delegation restrictions from the central permission catalogue.

## 5.2 Who can create custom roles?

Create separate permissions such as:
- `role.view`
- `role.create_custom`
- `role.edit_custom`
- `role.deactivate_custom`
- `role.assign`
- `role.remove_assignment`
- `role.preview_effective_permissions`
- `role.delegate_assignment_authority`

Use the following safe defaults:

| Actor | Create custom entity roles? | Assign roles? | Scope |
|---|---|---|---|
| Platform Super Admin | Only for authorized platform templates or approved administration workflows | Within platform authority | Platform scope only where explicitly permitted |
| Platform Admin | Only if explicitly granted | Only within delegated authority | Approved platform or entity scope |
| Entity Owner | Yes, when granted `role.create_custom` | Within their own authorized scope | Their entity and explicitly permitted descendants |
| Entity Admin | Yes, when granted `role.create_custom` | Within delegated authority | Authorized entity scope only |
| Partner | No by default; may be granted explicitly | Only when permitted | Explicit scope |
| Accountant/Manager | No by default; may be granted explicitly | Only when permitted | Explicit scope |
| Worker/Viewer | No by default | No by default | Explicitly delegated scope only |
| Other custom-role holder | Only if `role.create_custom` has been delegated | Only when permitted | Cannot exceed delegator's authority |

These are safe defaults, not a claim that every named role automatically has a fixed permission bundle.

An entity owner may configure valid custom roles for their own firm but may not grant platform Super Admin, modify unrelated entities, bypass mandatory security constraints, or grant permissions beyond their authority.

An entity administrator may create custom roles only in the entity and descendant scope where the relevant delegation is valid.

## 5.3 Custom roles are scoped

Every custom role must have a defined scope.

Supported scope types may include:
- One specific entity.
- A selected group of authorized entities.
- Selected descendants of a parent.
- A specific operational or resource scope where supported.
- A reusable organization-level template where the organization and its boundaries are explicitly defined.

The default is an **entity-local custom role**.

Creating a custom role in Firm A must not make that role available automatically in unrelated Firm B.

Copying or reusing a role must create an explicit destination-scope decision and validate every permission in the destination.

A child entity may maintain its own custom roles. Any inheritance or reusable template feature must be explicitly configured and securely enforced.

## 5.4 Custom role creation wizard

Build a complete, multi-step, mobile-friendly role builder.

### Step 1 — Role identity

Collect:
- Role name.
- Description.
- Entity or authorized scope.
- Category or department, if useful.
- Status.
- Optional internal notes.

Validate unique naming within the appropriate scope where required. Avoid global uniqueness rules that unnecessarily prevent unrelated firms from using the same role name.

### Step 2 — Start from a template or blank role

Allow the authorized creator to:
- Start from a blank role.
- Duplicate a permitted template.
- Copy a role from an authorized source entity, if copying is supported.
- Review and modify a proposed permission bundle.

Copying a role must not copy another entity's memberships or silently inherit its full permissions.

Revalidate every permission against the destination scope and creator's delegation authority.

### Step 3 — Select features

Display available system modules and features dynamically from the central feature and permission registry.

Possible groups include:
- Dashboard.
- Entity information.
- Ownership.
- Partnerships.
- Members.
- Roles and permissions.
- Entity hierarchy.
- Transactions.
- Ledgers and accounts.
- Receivables and payables.
- Cash and fund management.
- Expenses.
- Approvals.
- Reconciliation.
- Reports.
- Exports.
- Attachments.
- Notifications.
- Audit history.
- Settings.

Use only modules that actually exist or are formally registered for the application. Future modules must plug into the same permission architecture without requiring the entire role system to be rewritten.

### Step 4 — Select exact permissions

Within each feature, allow the authorized creator to select supported actions such as:
- Discover.
- View.
- View amounts.
- View details.
- Create.
- Edit draft.
- Submit.
- Approve.
- Post.
- Reverse.
- Reconcile.
- Export.
- Share.
- Manage.
- Delete where explicitly supported and safe.
- Delegate.

Do not assume selecting `View` automatically means `View Amounts`, `Export`, or `Manage`.

Do not include unsupported actions in a way that falsely implies they work.

### Step 5 — Configure data access and scope

Let the role creator choose the permitted data scope from the authority they hold, such as:
- Entire authorized entity.
- Selected branch or department.
- Selected descendants.
- Assigned records.
- Specific record categories.
- Read-only aggregate reports.
- Other supported scoped resources.

Apply monetary visibility independently of general record visibility.

If a user can view a transaction but not its amount, enforce the restriction in backend responses, aggregates, exports, search, and reports.

### Step 6 — Configure hierarchy access

If relevant to the role, select which parent–child capabilities are permitted.

Examples:
- Discover authorized child entities.
- View child metadata.
- View child aggregate reports.
- View child financial amounts.
- View child transactions.
- Create child entities.
- Manage child members.
- Assign roles to child members.
- Manage hierarchy relationships.
- Delegate selected child permissions.

These permissions must have clear direction and scope. No role can use a hierarchy setting to access unrelated roots.

### Step 7 — Configure sensitive actions

Identify whether the role can:
- Manage owners.
- Manage partnership records.
- Change entity hierarchy.
- Create entities.
- Invite members.
- Assign roles.
- Delegate permissions.
- Approve sensitive transactions.
- Reverse posted transactions.
- Close accounting periods.
- Export confidential financial data.
- Access audit records.
- Use authorized support workflows.

Show warnings for sensitive permission combinations and apply any required independent approval or separation-of-duties policy.

### Step 8 — Delegation settings

Allow delegation only if explicitly authorized.

Choose from permitted settings such as:
- No onward delegation.
- Delegate selected approved permissions.
- Delegate role assignment from a restricted list of roles.
- Delegate within a particular entity.
- Delegate within selected descendants.
- Grant access for a limited duration.

The role creator must not be allowed to delegate permissions above their own authority.

### Step 9 — Effective permission preview

Before saving, display the complete proposed permission set in plain language.

Show:
- Selected permissions.
- Denied or unavailable permissions.
- Data scope.
- Entity scope.
- Monetary visibility.
- Hierarchy access.
- Delegation restrictions.
- Expiry or conditions.
- Any role combination that triggers a policy conflict.

Do not silently remove requested permissions. If a selection is invalid, explain why and require the creator to revise it.

### Step 10 — Save and assign

Allow the creator to:
- Save the custom role without assigning it.
- Assign it to selected authorized members.
- Request approval where required.
- Confirm the final scope and role holders.

Role creation and assignment must be atomic or use a controlled workflow that cannot leave unintended access.

Creating or saving the role must not automatically assign it to the creator.

### Step 11 — Confirmation and audit

After the backend confirms the change, show the new role status and assignment results.

Record who created it, what scope it has, which permissions were included, who approved it if applicable, and which users received it.

## 5.5 Permission-boundary validation

For every custom role, the backend must validate that:
- The creator has `role.create_custom` in the selected scope.
- Each requested permission is permitted to be granted by the creator.
- The requested entity scope is within the creator's delegation authority.
- The role does not grant platform-only privileges to an entity member.
- The role cannot defeat mandatory security restrictions.
- The role cannot expose unrelated entities.
- The role does not violate required separation of duties.
- The proposed delegation settings do not cause privilege escalation.

If the creator cannot grant one selected permission, reject that selection or the entire role creation according to a documented validation policy. Never quietly widen the creator's authority.

## 5.6 Role updates and versions

Custom roles must be editable by an authorized role manager.

Before a role change:
1. Load the current version.
2. Validate the actor's authority.
3. Show the old and new permissions.
4. Identify existing role holders.
5. Calculate the effective-access changes.
6. Highlight newly granted sensitive capabilities.
7. Require confirmation or approval as configured.
8. Apply the change atomically.
9. Audit the result.
10. Refresh effective access.

Use role versioning or an equivalent safe change mechanism.

Do not let a change to a shared template unexpectedly escalate every role holder in unrelated entities. Entity-local roles should remain isolated by default.

When material permission changes affect existing role holders, show the impact and apply any required reapproval or notification workflow.

## 5.7 Role removal and deactivation

Deactivating a role must not delete historical financial records, audit history, or user identities.

Choose and document the correct strategy for existing assignments:
- Prevent deactivation until affected users have another valid role.
- Revoke the role assignment with an explicit workflow.
- Require reassignment to another authorized role.

Never silently transfer users to a more powerful role.

---

# 6. Complete role-holder management

Build a dedicated role-holder management workflow.

Authorized users must be able to:
- View role holders.
- Assign a role to a selected member.
- Remove a role assignment.
- Change an assignment's scope when authorized.
- Set a permitted expiry.
- Review effective permissions.
- See which permissions come from each role.
- See direct grants or restrictions where authorized.
- Identify holders affected by a role change.
- Review role-assignment history.

One member may hold multiple roles. Use the documented permission-combination policy when calculating the final result.

Before assigning a custom role, show:
- The target user.
- The target entity.
- The role name and version.
- The scope.
- The permissions granted.
- The permissions restricted.
- The expiry, if applicable.
- Any important permission conflicts.

The user who assigns the role must have authority both to assign that role and to grant its permissions to that recipient.

Do not allow a member to edit the role assignment or grant themselves a different role by changing a client request.

---

# 7. Ownership and partnership remain independent

Support all valid relationship combinations:
- Owner and partner.
- Owner but not partner.
- Partner but not owner.
- Neither owner nor partner.
- Owner without active membership.
- Partner without active membership.
- Administrator without ownership.
- Creator who is not the owner.
- Role holder who is not an owner, partner, or creator.
- Multiple owners with different permissions.

Ownership records should support multiple owners, ownership percentages or units where applicable, effective dates, verification, history, and controlled changes.

Partnership records should support partnership type, status, responsibilities, effective dates, and history.

Changing a role must not silently alter ownership or partnership. Ending a partnership must not automatically remove ownership. Revoking membership must not delete ownership or historical accounting records.

Legal ownership and partnership rules may depend on the actual entity type and jurisdiction. Keep the architecture configurable and seek appropriate legal or accounting review for jurisdiction-specific requirements.

---

# 8. Entity creation permissions

Maintain dedicated permissions, including:
- `entity.create_independent`
- `entity.create_child`
- `entity.create_branch`
- `entity.create_on_behalf`
- `entity.view`
- `entity.edit`
- `entity.archive`
- `entity.manage_relationships`
- `entity.manage_hierarchy`
- `entity.transfer_administration`

Safe default authority matrix:

| Actor | Independent entity | Child entity | Designate legal owner | Initial access |
|---|---|---|---|---|
| Platform Super Admin | Through approved platform workflow | Through authorized provisioning | Through approved setup and verification | Within approved administration scope |
| Platform Admin | Only when explicitly delegated | Only when explicitly delegated | Only when authorized and approved | Within delegated scope |
| Entity Owner | If policy grants it | Within authorized hierarchy | Through permitted ownership workflow | Within authorized entity scope |
| Entity Admin | Only if explicitly granted | Under an authorized parent | Only if explicitly authorized | Within delegated scope |
| Partner | No by default | No by default | No automatic authority | Only if explicitly permitted |
| Accountant/Manager | No by default | No by default | No by default | Only if explicitly permitted |
| Worker/Viewer | No by default | No by default | No by default | No by default unless granted |
| Custom role holder | Only with the relevant permission | Only with the relevant permission | Only with explicit authority | Within delegated scope |

The system must distinguish independent-entity creation from child creation.

Creating an entity does not make the creator its owner automatically. Designating an owner does not automatically give that owner an active application membership. Initial role assignments must be explicitly displayed and confirmed.

Entity creation must be safe under retries and failures; do not leave half-created entities, duplicate memberships, or unapproved privileged access.

---

# 9. Complete permission catalogue

Use a central permission registry that drives the Flutter permission editor and backend authorization.

## 9.1 Platform
- Manage platform configuration.
- Manage platform administrators.
- Manage approved support workflows.
- Provision entities.
- Review platform audit events.
- Manage platform-wide security settings.

## 9.2 Entity
- Discover and view entity.
- Create independent entity.
- Create child.
- Create branch.
- Create on behalf.
- Edit settings.
- Archive.
- Manage hierarchy.
- Manage relationships.
- Transfer administrative control.

## 9.3 Ownership
- View owners.
- View ownership percentages.
- Propose ownership changes.
- Add or update an ownership record.
- Approve ownership changes.
- End or transfer ownership.
- View history.
- Manage supporting documents.

## 9.4 Partnership
- View partners.
- Add or propose a partner.
- Edit partnership.
- End partnership.
- View partnership history.

## 9.5 Membership
- View members.
- Invite.
- Resend or cancel invitation.
- Activate or suspend.
- Revoke or reactivate membership.
- View access history.
- Initiate authorized recovery.

## 9.6 Roles and custom role builder
- View roles.
- Create custom role.
- Edit custom role.
- Deactivate custom role.
- Copy an authorized role template.
- Assign role.
- Remove assignment.
- View role holders.
- Preview effective permissions.
- Review affected users.
- Manage permitted role versions.

## 9.7 Delegation
- Grant direct permission.
- Apply authorized restrictions.
- Delegate selected permissions.
- Delegate role assignment.
- Delegate entity creation.
- Delegate child administration.
- Set expiry.
- Revoke grants.
- View delegation history.

## 9.8 Financial-data access
- Discover records.
- View details.
- View amounts.
- View balances.
- View counterparties.
- View receivables and liabilities.
- View ownership or capital information.
- View attachments.
- View audit data.

## 9.9 Accounting operations
- Create draft.
- Edit draft.
- Submit.
- Approve.
- Post.
- Reverse.
- Reconcile.
- Close or reopen accounting period.
- Configure accounting.
- View reports.
- Export reports.
- Share data.

## 9.10 External access and data movement
- Generate PDF.
- Export CSV or spreadsheets.
- Share summaries.
- Share details.
- Share attachments.
- Use WhatsApp sharing.
- Manage notification recipients.
- Download permitted resources.

Each registered permission must specify its supported scopes, backend enforcement, audit requirements, and tests.

Do not expose permissions in the UI that are not implemented. If the product adds a module, register its permissions and enforcement rules so the role builder can discover them safely.

---

# 10. Permission scopes and inheritance

Every permission must define its scope.

Supported scope types may include:
- Platform.
- Entity root.
- Specific entity.
- Selected descendants.
- Selected branch.
- Assigned records.
- Specific resources.
- Read-only aggregate reporting.

Do not grant all permissions at all scopes by default.

Use a documented policy for combining roles, direct grants, explicit restrictions, and inherited permissions.

Mandatory security rules always win. Expired, revoked, or invalid grants cannot authorize actions. A role cannot bypass scope restrictions. Parent-level access cannot silently defeat a child-level confidentiality policy where that policy is supported and legally/configurationally valid.

The UI, API, and database must use one consistent authorization model. Avoid separate contradictory permission implementations across screens.

---

# 11. How the UI should work

## 11.1 Entity switcher

Show the entity name, type, relationship label where authorized, the user's assigned role or roles, and a clear access status.

Switching entities must change the data scope of all entity-specific screens and requests. Clear or reload stale protected data when the user changes entities or loses permission.

## 11.2 Entity hierarchy screen

Display an authorized tree or list with search, breadcrumbs, expand/collapse, and appropriate pagination or lazy loading.

Show only entities the user is allowed to discover. The existence of a hidden entity may itself be confidential.

## 11.3 Entity administration screen

Provide distinct sections for:
- Overview.
- Ownership.
- Partners.
- Members and invitations.
- Roles and permissions.
- Custom role builder.
- Role holders.
- Child entities.
- Hierarchy access.
- Financial data and reporting.
- Audit.
- Settings.

## 11.4 Role and permission screen

Provide a list of existing roles, role categories, role holders, scope, and status.

Actions must be permission-aware:
- Create custom role.
- View details.
- Duplicate where authorized.
- Edit.
- Assign members.
- Review permission impact.
- Deactivate through the controlled workflow.

Do not show global or unrelated entity roles to users without permission.

## 11.5 Custom role builder screen

The role builder should present:
- Role identity.
- Scope selection.
- Template selection.
- Feature groups.
- Granular permission selection.
- Monetary and detail visibility.
- Entity hierarchy permissions.
- Delegation settings.
- Permission validation.
- Effective-access preview.
- Selected role holders.
- Confirmation.

Use grouped sections, progressive disclosure, search, select-all within an authorized group, clear descriptions, and warnings for sensitive privileges.

A select-all action must only select permissions that the creator is authorized to grant. It must never override mandatory security boundaries.

## 11.6 Role-holder screen

Display the selected member, assigned roles, scopes, access status, expiry, and a readable effective-permission summary.

Support adding or removing roles only within the current administrator's authority.

## 11.7 Change preview

Before saving a new or updated role, compare the current and proposed effective permissions.

Highlight:
- Newly granted access.
- Access being removed.
- Scope changes.
- Monetary visibility changes.
- Hierarchy access changes.
- Administrative privileges.
- Delegation changes.
- Existing role holders affected.

Require explicit confirmation for sensitive changes.

## 11.8 State and error handling

Implement actual loading, empty, validation, unauthorized, expired invitation, pending approval, conflict, stale data, session-expired, backend failure, and success states.

All buttons must be connected to functioning backend actions. Do not use fake permission toggles or success messages that appear before server confirmation.

---

# 12. PostgreSQL/Supabase data architecture

Inspect the existing schema before implementing. Reuse or migrate valid existing structures rather than blindly duplicating them.

The logical data model must support:

1. Users and authenticated identities.
2. Legal/business parties where needed.
3. Entities.
4. Entity relationships.
5. Entity-creation requests.
6. Ownership records.
7. Partnership records.
8. Entity memberships.
9. Invitations.
10. Role definitions.
11. Permission registry.
12. Role-permission mappings.
13. Role assignments and role holders.
14. Custom role scope and version history.
15. Direct permission grants and restrictions.
16. Delegation records.
17. Parent–child access policies.
18. Permission-change approvals.
19. Audit events.

Each record must use appropriate stable identifiers, foreign keys, constraints, scope fields, status fields, effective dates where needed, and useful indexes.

Use normalized tables for security-critical relationships. Do not store the entire authorization model as an opaque JSON object.

Custom roles must be stored in the database. A role created in Firm A must have an explicit scope and must not silently become a global role.

Role assignments must refer to valid role definitions and authorized entity scopes.

Use constraints and validated database operations to prevent duplicate or invalid role assignments, invalid ownership relationships, and unauthorized hierarchy links.

---

# 13. PostgreSQL/Supabase security enforcement

Flutter UI visibility is not a security boundary.

Use authenticated identity, server-side authorization, and appropriate Row Level Security (RLS) to protect all relevant records.

Enforce:
- Entity membership.
- Role assignment scope.
- Permission grants and restrictions.
- Parent–child access.
- Record and field visibility.
- Financial amount visibility.
- Custom role creation and modification authority.
- Role assignment authority.
- Delegation limits.
- Expiry and revocation.
- Access to search, reports, exports, attachments, storage, RPC functions, and aggregate queries.

Never trust a client-supplied owner ID, entity ID, role ID, or permission claim without validating it.

Review RLS recursion, privileged functions, `SECURITY DEFINER`, search paths, views, materialized views, storage policies, background jobs, and direct table access.

Never expose service-role keys, database passwords, signing secrets, or unrestricted privileged credentials in Flutter, the repository, or logs.

Test permission changes and cross-entity denial through direct API/database requests.

---

# 14. Delegation and privilege escalation prevention

A person may create a custom role only if their effective permission includes `role.create_custom` for the correct scope.

A person may assign a role only if they have the required assignment authority and can grant the role's permissions to the recipient.

Prevent:
- Giving oneself higher privilege by editing a role.
- Creating a role with permissions above the creator's authority.
- Assigning an unauthorized role to another user.
- Delegating platform powers from a firm-level role.
- Giving access to an unrelated entity.
- Using a parent-child relation to bypass restrictions.
- Escalation through multiple roles.
- Circular or self-referential delegation.

Every grant must record the grantor, recipient, scope, permissions, delegation source, permitted onward delegation, start/expiry, approval where required, and revocation history.

Reassess delegated authority when the grantor loses access or the underlying delegation expires.

---

# 15. Accounting integrity

Access permissions must work with Finly's accounting architecture.

Separate permissions for creating, editing, submitting, approving, posting, reversing, reconciling, closing accounting periods, exporting, and sharing.

A transaction-entry role must not automatically receive approval or reversal rights.

Changing an owner, role, or membership must not silently change accounting classifications, balances, ownership of historical transactions, repayment obligations, or financial records.

Use atomic, idempotent financial operations with proper audit history and reconciliation.

Where independent approval is required, enforce it in the backend and test that direct API calls cannot bypass it.

---

# 16. Audit history

Record important operations, including:
- Entity creation.
- Parent–child relationship changes.
- Ownership and partnership changes.
- Membership and invitation changes.
- Custom role creation, modification, versioning, and deactivation.
- Role assignment and removal.
- Permission grants, restrictions, expiry, and revocation.
- Hierarchy policy changes.
- Sensitive data export or sharing.
- Support access.
- Approval and rejection decisions.

Each event should identify the actor, entity, target, action, timestamp, relevant before-and-after state, scope, reason or approval reference where required, and outcome.

Protect audit history from unauthorized rewriting or deletion.

Never record passwords, PINs, authentication secrets, or unnecessary sensitive data in the audit log.

---

# 17. Concurrency and failure handling

Use suitable PostgreSQL transactions, constraints, locking, isolation, and idempotency for operations that modify hierarchy, membership, roles, grants, or ownership.

Test:
- Two administrators create or modify roles concurrently.
- Two administrators assign different roles to the same member.
- A role is edited while another user attempts a privileged operation.
- Membership is revoked during a sensitive request.
- A grant expires while an operation is being authorized.
- A user loses delegation authority while attempting to grant access.
- Child hierarchy changes during authorization.
- Invitations are accepted twice.
- Entity creation is retried after a network failure.

The resulting state must be consistent and auditable. Failed workflows must not leave partial grants or duplicate role assignments.

---

# 18. Mandatory cross-scenario tests

## Entity and hierarchy tests
- An owner creates a new independent entity without gaining unrelated entity access.
- An authorized owner creates a child and controls its initial policies within scope.
- A child has its own membership, ownership, and roles.
- Parent access follows explicit policies.
- Child and sibling access remain isolated by default.
- A reporting link does not automatically grant transaction-edit access.
- Hierarchy updates cannot create cycles.

## Custom role tests
- An authorized Entity Owner creates a custom role for Firm A.
- An unauthorized worker cannot create custom roles.
- An Entity Admin can create only within the delegated scope.
- A user cannot create a role with permissions above their grant authority.
- A role cannot grant platform Super Admin privileges.
- A role cannot access unrelated entities.
- The role builder displays only available permissions.
- Invalid permission combinations are rejected.
- Custom roles are persisted and survive app restarts.
- Role holders receive exactly the intended effective permissions.
- Updating a role shows affected members and access changes.
- Deactivating a role follows the documented reassignment/revocation policy.
- A copied role is revalidated against the destination entity.
- Concurrent role updates remain consistent.

## Ownership and membership tests
- An owner may have no active login membership.
- An administrator may not be an owner.
- A partner may not be an owner.
- The creator may be different from the owner.
- Ending a partnership does not automatically remove ownership.
- Revoking membership does not delete historical financial records.

## Security tests
- Direct API calls cannot bypass permissions.
- RLS protects cross-entity records.
- Restricted amounts do not leak through totals, search, reports, notifications, or exports.
- An expired or revoked grant stops authorizing access.
- Delegation cannot create privilege escalation.
- Shared roles do not unexpectedly affect unrelated entities.
- Sensitive changes are audited.
- Privileged functions validate actual authority.

## UI tests
- Entity switcher displays the correct access scope.
- Role builder supports blank roles, templates, permissions, scopes, preview, and save.
- Role-holder assignment uses real database records.
- Role changes update authorized UI capabilities correctly.
- Unauthorized actions cannot be executed by bypassing navigation.
- Loading, empty, conflict, unauthorized, and failure states function correctly.
- No dummy buttons or hard-coded user-role mappings remain.

Run automated unit, database integration, RLS, concurrency, and UI tests against the appropriate environments. Report actual outcomes; never claim a test passed unless it ran and passed.

---

# 19. Safe migration plan

Before changing existing tables or UI:

1. Inspect the current authorization architecture.
2. Identify overloaded roles or fields that combine ownership, partnership, creation, and access.
3. Map existing records into the new relationship model.
4. Separate global role definitions from entity-local custom roles.
5. Identify ambiguous ownership or authorization data.
6. Write safe, repeatable migrations.
7. Preserve historical financial records and audit context.
8. Avoid granting extra permissions based on guessed relationships.
9. Test RLS and entity isolation before rollout.
10. Document unresolved records and migration risks.

Do not assume that an existing `Owner` role proves legal ownership or that an existing `Admin` has platform authority.

For ambiguous legacy records, preserve the data, mark the relationship for review where appropriate, and do not elevate access until the relationship is resolved.

---

# 20. Required deliverables

Deliver:

1. Existing architecture and security audit.
2. Final entity and parent–child relationship model.
3. Ownership, partnership, creator, membership, and role model.
4. Complete platform and entity role catalogue.
5. Custom role builder with feature and permission selection.
6. Role-holder assignment and management screens.
7. Effective-permission preview and before-and-after comparison.
8. Entity creation and invitation workflows.
9. Parent–child access policy UI.
10. PostgreSQL schema and migration plan.
11. Supabase RLS policies and secured privileged functions.
12. Auditing and history.
13. Automated permission, RLS, concurrency, and regression tests.
14. Deployment, recovery, and migration instructions.
15. A clear list of verified results, failures, outstanding tests, and unresolved business rules.

Use this engineering cycle:

**Inspect → Design → Migrate safely → Implement → Test → Verify → Fix → Retest → Document.**

Do not ship fake role logic, placeholder actions, hard-coded roles, or unimplemented security controls.

---

# 21. Final acceptance criteria

Finly is ready only when:

- An authorized entity can define custom roles according to its own requirements.
- The role creator can select only the permissions and scope they are authorized to grant.
- Custom roles can be assigned to selected role holders.
- Multiple roles per user and different roles across entities are supported.
- Ownership, partnership, creator status, membership, and permissions remain separate.
- Super Admin, Platform Admin, Support, Entity Owner, Entity Admin, and custom roles have explicit authority boundaries.
- Entity creation and parent–child access are scoped and auditable.
- Independent and unrelated entities remain isolated by default.
- Custom roles, role holders, permissions, and hierarchy policies are stored in PostgreSQL/Supabase.
- RLS and backend operations enforce every sensitive permission.
- The UI accurately reflects effective access and never acts as the only security check.
- Permission changes and role updates are atomic, auditable, and safe under concurrency.
- Financial records remain intact when roles, memberships, ownership, or hierarchy change.
- The required automated tests actually run and their results are documented.

**Final rule:**

Every entity must be able to use a flexible, authorized permission system that fits its own needs, while Finly centrally enforces the platform's security boundaries.

The role creator defines a permitted role. The role holder receives the approved permissions. The backend determines effective access. The audit trail records the change. No one can use a custom role to grant themselves or another person authority they do not possess.