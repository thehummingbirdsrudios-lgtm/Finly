# ADDON-18 — Universal ownership, partnership, role-based access and permission engine

Received 2026-10-09 as the file `# FINLY — UNIVERSAL OWNERSHIP, PART.txt` (moved here unchanged). Recorded verbatim below the line.

---

# FINLY — UNIVERSAL OWNERSHIP, PARTNERSHIP, ROLE-BASED ACCESS & PERMISSION ENGINE
## Master Implementation Specification for Claude

Implement and audit Finly's complete ownership, entity, membership, role, permission, UI, financial-data access, and delegation architecture. This must be a production-grade design that supports every valid combination of owners, partners, administrators, employees, workers, accountants, investors, and other users across any number of business entities.

Do not build this using a single `role` field, a single `is_owner` Boolean, or hard-coded combinations of users. Use a properly normalized, entity-scoped, many-to-many relationship and authorization model.

The priority order is:

1. Financial correctness and data integrity.
2. Strict entity-level data isolation and security.
3. Correct ownership, partnership, and permission semantics.
4. Safe permission delegation and entity creation.
5. Clear, understandable UI/UX.
6. Auditing, traceability, maintainability, and scalability.

Before changing the existing application, inspect the current Flutter codebase, PostgreSQL/Supabase schema, authentication, existing RLS policies, permission logic, screens, routes, migrations, and seed data. Preserve valid existing records and behavior. Produce a gap analysis, implementation plan, and migration strategy before making destructive changes.

---

# 1. THE FIVE INDEPENDENT CONCEPTS

Finly must distinguish at least these five concepts.

## 1.1 Business or legal ownership

Ownership answers:

**Who owns the business or entity, and what is their ownership interest?**

Examples:
- Krish owns 100% of Firm A.
- Krish, Savan, and Shaileshbhai are all owners of Firm B.
- A person owns 30% of Firm C but does not participate in daily operations.
- A person owns a firm but has not yet activated their Finly account.

Ownership must support:
- One owner or multiple owners.
- Ownership percentage or units, where applicable.
- Equal or unequal ownership.
- Ownership types, such as individual, corporate, beneficial, or other configured types where legally appropriate.
- Effective start and end dates.
- Pending verification or disputed ownership where relevant.
- Ownership history and documented changes.
- Ownership records without requiring immediate app access.

A person may have multiple ownership records across multiple entities.

Do not infer that every owner holds an equal share. Do not assume ownership percentage determines every permission. Do not infer legal ownership merely because someone created an entity or registered its first account.

## 1.2 Partnership relationship

Partnership answers:

**In what capacity is this person associated with this business?**

Examples:
- An equity partner who is also an owner.
- A working partner who does not hold an ownership share in the entity's recorded ownership model.
- A non-equity business partner.
- A sleeping or passive partner.
- A partner responsible for sales, operations, finance, or another function.
- A person listed as a partner for historical or documentary purposes but without current app access.

A partner relationship is independent of ownership.

A partner can also be an owner, but this is not mandatory. An owner can also be a partner, but this is not mandatory.

Partner type, duties, profit-sharing arrangement, capital contribution, repayment obligation, and legal status must not be inferred automatically from app permissions. Track these as distinct fields or records where required.

## 1.3 Application role

Application role answers:

**What kind of work is this user allowed to perform inside this specific entity?**

Examples:
- Entity Administrator.
- Accountant.
- Finance Manager.
- Cashier.
- Salesperson.
- Worker.
- Auditor.
- Read-Only Viewer.
- Custom role created by an authorized administrator.

Roles are configurable permission bundles, not proof of legal ownership.

A person can have different roles in different entities. A role assigned in Firm A must not automatically apply to Firm B.

## 1.4 Membership and login access

Membership answers:

**Has this person been granted access to this entity through their Finly account?**

A person may be recorded as an owner or partner without being an active application member.

Support these membership states:
- Not invited.
- Invitation pending.
- Accepted but activation incomplete.
- Active.
- Suspended.
- Revoked.
- Archived or ended.

Membership must refer to a stable user identity, not merely a display name or phone number.

A person without an active authenticated identity must not be allowed to sign in as a recorded owner merely because that person's name appears in an ownership record.

## 1.5 Effective permissions

Permissions answer:

**Which exact actions and data can this authenticated user access in this context?**

Permissions must be evaluated using the authenticated user, target entity, active membership, assigned roles, explicit grants or restrictions, record scope, field scope, relevant business rules, and current status.

Being an owner, partner, administrator, creator, or member must never be used as a vague substitute for checking the actual permission required by an action.

Finly may provide default permission templates for convenience, but those defaults must be explicit, configurable within policy, auditable, and enforced on the backend.

---

# 2. THE RELATIONSHIP MODEL

Use separate records and relationships for each concept.

Recommended logical data model:

### A. Users
Stores the canonical authenticated identity.

Examples of fields:
- `user_id`
- Display name
- Verified contact details
- Account status
- Authentication-related metadata that is safe to expose to authorized components

Do not store a single universal business role here.

### B. Entities
Represents each private financial or business workspace.

Examples:
- Personal financial book.
- Sole proprietorship.
- Partnership firm.
- Company.
- Branch or business unit.
- Joint venture.
- Other configurable entity types.

Suggested fields:
- `entity_id`
- Entity name
- Entity type
- Parent entity, if applicable
- Status
- Creation timestamp
- Created-by identity
- Applicable settings and configuration

The creator is audit metadata, not proof of ownership.

### C. Entity ownership records
A separate many-to-many relationship between users or legally recognized parties and entities.

Suggested fields:
- `ownership_id`
- `entity_id`
- `owner_party_id`
- Ownership percentage or units, if applicable
- Ownership type
- Effective start and end dates
- Verification status
- Supporting document references, where appropriate
- Who recorded the relationship
- Approval and audit metadata

The system must support multiple owner records for one entity and multiple ownership records for one person.

Allow ownership to refer to a non-user legal party when necessary. Link a verified person account to that party through an explicit, validated identity-mapping process.

Do not represent multiple ownership records with a single `owner_user_id` on the entity.

### D. Entity partnership records
A separate many-to-many relationship describing partnership status.

Suggested fields:
- `partnership_id`
- `entity_id`
- `party_id` or linked `user_id`
- Partnership type
- Responsibilities
- Effective dates
- Active or ended status
- Relevant contractual details, if in scope
- Recorded-by and audit metadata

Do not calculate ownership or permissions merely from the existence of a partnership record.

### E. Entity memberships
Defines which authenticated users may access an entity.

Suggested fields:
- `membership_id`
- `entity_id`
- `user_id`
- Membership status
- Invitation status
- Start and end dates
- Access-suspension metadata
- Added-by identity

Use appropriate unique constraints to prevent duplicate active memberships where the model requires uniqueness.

### F. Roles
Stores configurable role definitions and permission bundles.

Suggested fields:
- `role_id`
- Role name
- Description
- Scope type
- System-defined or custom status
- Entity or organization scope
- Created-by identity
- Status and version

### G. Role assignments
Associates users or memberships with roles within a particular scope.

Suggested fields:
- `assignment_id`
- `user_id`
- `role_id`
- `entity_id` or other defined scope
- Valid-from and valid-until dates
- Assignment status
- Granted-by identity
- Delegation provenance

One person may have multiple compatible roles. Do not force every user into one mutually exclusive role.

### H. Permission definitions and role permissions
Maintain a centralized permission catalog and connect permissions to roles.

Examples:
- `entity.view`
- `transaction.view_amount`
- `transaction.create`
- `transaction.approve`
- `member.invite`
- `permission.delegate`
- `ownership.manage`

### I. Direct permission grants and restrictions
Where supported, allow explicitly authorized grants or restrictions at a more specific scope than a role.

Record:
- Subject.
- Permission.
- Resource or entity scope.
- Grant or restriction.
- Effective dates.
- Reason.
- Granting authority.
- Expiry or revocation.
- Audit history.

Direct grants must not bypass mandatory security invariants, entity isolation, maximum delegation authority, or applicable separation-of-duties rules.

### J. Entity creation and delegation records
Keep a traceable record of who may create entities, which parent or organizational scope they may use, whom they may designate as owners, and who may approve the setup.

### K. Audit events
Record important access, ownership, membership, role, permission, and entity-management changes.

Use immutable or tamper-resistant audit mechanisms appropriate to the production architecture.

The above are logical models, not a requirement to blindly add tables with these exact names. Review the existing schema and design suitable normalized tables, keys, indexes, constraints, migrations, and RLS policies.

---

# 3. THE EIGHT FOUNDATIONAL OWNERSHIP–PARTNERSHIP–MEMBERSHIP COMBINATIONS

Ownership, partnership, and application membership are separate binary dimensions. Therefore, there are eight foundational combinations before considering application roles, permissions, and status.

| Case | Owner? | Partner? | Active member? | Required treatment |
|---|---|---|---|---|
| 1 | Yes | Yes | Yes | Owner and partner records remain separate; apply assigned permissions |
| 2 | Yes | Yes | No | Record both relationships; no active login access until properly activated |
| 3 | Yes | No | Yes | Owner can be a member without being classified as a partner |
| 4 | Yes | No | No | Ownership record exists; access invitation or activation may be pending |
| 5 | No | Yes | Yes | Partner has only the access permitted by assigned roles and grants |
| 6 | No | Yes | No | Partnership is recorded, but no active app access exists |
| 7 | No | No | Yes | Ordinary member, accountant, worker, administrator, or other assigned role |
| 8 | No | No | No | External party, prospective member, historical record, or unrelated person |

All eight states must be representable where consistent with the underlying business facts.

Additional states must cover pending or unverified ownership, ended partnership, suspended membership, expired assignments, disputed records, and multiple overlapping relationships.

Never automatically:
- Turn a partner into an owner.
- Turn an owner into an active member.
- Turn an app administrator into a legal owner.
- Turn an entity creator into a legal owner.
- Convert a worker into a partner.
- Transfer ownership when an application role changes.
- Grant access to all firm data because a contact is linked to that firm.

When an owner is invited, the UI may recommend an explicit owner-access permission template. It must show the permissions that will be granted and require the authorized person to confirm the setup.

---

# 4. OWNERSHIP DOES NOT AUTOMATICALLY EQUAL EVERY PERMISSION

Finly must distinguish legal/business authority from technical access.

An ownership record may influence the default access workflow, but actual access requires a valid authenticated identity and an active, authorized access path.

For example:

- A 40% owner may have full financial visibility and management rights if the configured business policy grants them.
- A 40% owner may be a passive investor with restricted application permissions where that arrangement is valid and explicitly configured.
- An owner may be able to view financial statements but not create, edit, reverse, or approve transactions.
- An owner may manage the business's membership but may not be allowed to grant themselves permissions above their own delegation authority.
- An owner may have authority in Firm A but no access to Firm B.
- An entity administrator may manage staff and transactions but cannot change legal ownership unless separately authorized.
- A partner may receive transaction-entry access without having ownership rights.
- A Super Admin may administer the Finly platform without personally becoming the legal owner of every firm.

Business or legal rights must not be misrepresented as settled legal advice. The application should support appropriate configurable policies and require professional review of jurisdiction-specific ownership and partnership requirements.

---

# 5. GLOBAL SUPER ADMIN, ENTITY OWNER, ADMINISTRATOR, AND PARTNER

These titles must never be collapsed into one role.

## 5.1 Platform Super Admin

The platform-level administrator manages platform configuration and only those global administration actions that the security architecture explicitly permits.

Possible powers include:
- Configure global settings.
- Manage supported platform-level role templates.
- Create or repair tenant/entity records through controlled procedures.
- Investigate technical failures.
- Manage user account lifecycle where authorized.
- Review administrative audit events.
- Perform explicitly authorized support or recovery workflows.

A Super Admin must not become the legal owner of every business merely by having platform administration privileges.

Super Admin access to customers' financial contents must be separately restricted, justified, and audited. Technical support access should use an authorized support workflow rather than silent impersonation.

## 5.2 Entity Owner

The entity owner is a person or legal party associated with the entity through an ownership record.

Possible permission bundles include:
- View permitted entity reports and balances.
- Manage ownership records.
- Approve ownership changes.
- Configure entity membership and access.
- Assign roles or delegate permissions within authority.
- Approve selected financial transactions.
- Configure entity settings.

These are configurable permissions, not consequences of a string named `Owner`.

Do not assume every co-owner has unrestricted access or identical authority. Establish explicit business rules for shared ownership, owner disagreement, and sensitive changes.

## 5.3 Entity Administrator

An administrator manages day-to-day application operations within their delegated scope.

Possible powers include:
- Invite or remove members.
- Assign approved roles.
- Manage permitted settings.
- Create and edit transactions.
- Approve records where authorized.
- Generate permitted reports.

An administrator does not automatically receive authority to alter ownership or appoint another user as an unrestricted administrator.

## 5.4 Partner

A partner is a recorded business relationship. A partner may have additional assigned application roles, but the word `Partner` alone must not grant unlimited financial access.

## 5.5 Other roles

Support configurable roles such as Accountant, Auditor, Cashier, Salesperson, Worker, Investor, Read-Only Viewer, and custom roles.

Do not hard-code the example people or business names into authorization logic.

---

# 6. ONE PERSON CAN HAVE DIFFERENT STATUS IN DIFFERENT FIRMS

This is mandatory.

Example:

| Entity | Business relationship | App role | Effective access |
|---|---|---|---|
| Firm A | Owner | Entity Administrator | Full access only to explicitly authorized Firm A resources |
| Firm B | Partner, not recorded as owner | Accountant | Permitted financial records and accounting operations in Firm B |
| Firm C | Neither owner nor partner | Worker | Assigned operational features in Firm C |
| Personal Book D | Personal holder/owner | Personal Book Manager | Only the personal book's authorized data |
| Firm E | Owner, no active membership | None | No interactive access until the required identity and membership setup is complete |

Finly must allow the same user to hold different relationships, roles, and permissions simultaneously.

The UI must derive its labels and available features from the currently selected entity and the user's effective permissions in that entity.

Do not use a global rule such as:

`if user.role == "Owner" then show all financial data`

Use a scoped authorization decision for every sensitive operation.

---

# 7. WHO CAN CREATE A NEW ENTITY?

Entity creation must be controlled by an explicit permission such as `entity.create`, combined with a clearly defined allowed scope.

Support these creation authorities:

### A. Platform-controlled creation
An authorized platform administrator may create or recover entity records through an audited administration workflow.

### B. Independent entity creation
A user with permission to create an independent personal or business entity may start the entity setup flow, subject to product policy and required verification.

The creator must explicitly select or confirm the intended legal/business owner. The system must not silently equate the creator with the legal owner.

### C. Creation by an existing entity owner
An entity owner may create a child entity, branch, or related business entity only if the relevant permission and scope authorize that action.

Creating a related entity must not silently transfer ownership of the new entity to the parent entity's owner. The new entity needs its own ownership records.

### D. Creation by an entity administrator
An administrator may create an entity only if `entity.create` is explicitly delegated to that administrator for the relevant scope.

The administrator's creation permission must specify:
- Which types of entity may be created.
- Whether creation is independent or subordinate.
- Whether the administrator can nominate owners.
- Whether another authority must approve ownership.
- Whether the administrator may grant initial roles.
- Whether the administrator can create entities outside their current business scope.

### E. Creation by a partner, accountant, worker, or other member
No automatic entity-creation rights. Grant the permission only when authorized and needed.

### Entity-creation security rules

1. Entity creation and legal ownership designation are distinct actions.
2. The creator must not silently appoint themselves as owner.
3. A person cannot grant themselves permissions they do not possess the authority to delegate.
4. The creator cannot designate an unrelated user as an owner without the required verification or approval.
5. Parent-child entity relationships must not automatically expose financial data between entities.
6. New entities must receive their own membership, access, and ownership configuration.
7. The creation flow must show the proposed owner, partners, initial administrator, and initial permission bundle before confirmation.
8. All ownership designations, invitations, approvals, and initial role assignments must be audited.
9. Failed creation must not leave a partially created entity with inconsistent ownership, membership, or permissions.
10. If two users attempt to complete the same setup concurrently, enforce database constraints and idempotency.

---

# 8. ENTITY CREATION FLOW — REQUIRED UI

Design an explicit, accessible, multi-step flow.

### Step 1 — Entity details
Collect the entity name, entity type, optional parent entity, currency, relevant date settings, and other required configuration.

### Step 2 — Ownership
Ask who legally or beneficially owns the entity, based on the entity type and the product's supported business rules.

Allow multiple owners when applicable. Support ownership percentages or units where relevant, including validation of applicable totals.

Do not assume ownership must always be divided equally.

### Step 3 — Partnership
Separately ask which people or parties are partners.

Allow someone to be an owner and a partner, owner only, partner only, or neither.

Clearly explain that partnership status and ownership are different records.

### Step 4 — Initial access
Select which people may sign in and which roles they should receive.

Show the difference between:
- Recorded owner.
- Recorded partner.
- Active app member.
- Assigned app role.
- Effective permissions.

### Step 5 — Permission review
Display a human-readable summary of exactly what each initial member can view, create, change, approve, export, share, administer, or delegate.

Highlight sensitive permissions such as viewing monetary amounts, reversing transactions, managing owners, exporting all data, and delegating administrator privileges.

### Step 6 — Confirm and create
Require explicit confirmation before creating the entity and issuing invitations.

Use an atomic, safely retryable backend operation where possible. Record the creator and all initial assignments in the audit log.

### Step 7 — Result
Display the entity's setup status, pending invitations, verified owners, active administrators, and any remaining actions.

Never imply that a person has accepted an invitation or obtained access before the backend confirms it.

---

# 9. UNIVERSAL PERMISSION CATALOG

Implement permissions as explicit, testable capabilities. The following list is a starting catalog; adapt it to the existing architecture and product scope.

## 9.1 Entity permissions
- Discover entity.
- View entity profile.
- View entity settings.
- Edit entity profile.
- Configure entity.
- Archive or close entity.
- Manage parent/child relationships.
- Create an entity.
- Transfer or change administrative control where authorized.

## 9.2 Ownership permissions
- View ownership records.
- View ownership percentages or units.
- Create proposed ownership record.
- Edit an unapproved ownership record.
- Submit ownership changes.
- Approve ownership changes.
- End or transfer ownership.
- View ownership history.
- Attach or view supporting documents.

Ownership permissions must be independent of partner-management and general role-management permissions.

## 9.3 Partnership permissions
- View partners.
- Add or propose a partner.
- Edit partnership details.
- End a partnership relationship.
- View partnership history.
- Manage partnership duties or configured arrangements.

Partner-management permission must not imply ownership-management permission.

## 9.4 Member and account permissions
- View members.
- Invite members.
- Resend or cancel invitations.
- Activate or suspend membership.
- Revoke entity access.
- Reactivate membership.
- View access history.
- Initiate authorized account recovery.
- Manage own profile and security settings.

Revoking entity membership must not automatically delete the user's account, financial history, or unrelated memberships.

## 9.5 Role and permission administration
- View roles.
- Create custom roles.
- Edit roles.
- Deactivate roles.
- Assign roles.
- Remove assignments.
- View effective permissions.
- Grant direct permissions.
- Restrict permissions where policy permits.
- Delegate authority.
- Revoke delegated authority.
- View delegation history.

Changes to a shared role must not unintentionally elevate every user in every entity. Role scope and affected assignments must be displayed before saving.

## 9.6 Financial-data visibility permissions
Separate at least:
- Discover records.
- View record existence.
- View general details.
- View monetary amounts.
- View balances.
- View counterparties.
- View supporting attachments.
- View account identifiers.
- View ownership/capital information.
- View liabilities and receivables.
- View audit history.

A user may need to see that a transaction exists without permission to see its amount or private attachments.

## 9.7 Financial operation permissions
- Create draft transaction.
- Edit draft transaction.
- Submit for approval.
- Approve transaction.
- Post transaction.
- Edit permitted posted records through controlled correction workflows.
- Reverse transaction.
- Reconcile accounts.
- Close or reopen an accounting period.
- Configure accounting settings.
- View and run financial reports.

Never treat normal editing, reversing, and approving as the same permission.

Posted financial records must follow the accounting correction rules. A permission to edit must not bypass immutable ledger or audit requirements.

## 9.8 Reports and external data permissions
- View dashboard.
- View reports.
- View reports with monetary details.
- Export CSV or spreadsheet.
- Generate PDF.
- Share summaries.
- Share detailed financial records.
- Share attachments.
- Share through WhatsApp or another configured channel.
- Manage notification recipients.

Permissions must be checked when producing the export or share payload, not only when showing the button.

## 9.9 Audit and security permissions
- View access audit.
- View financial audit.
- View own security events.
- Manage entity-level security settings.
- Manage sessions or membership access where authorized.
- Initiate approved support-access workflow.

No role should be able to retrieve another person's password, PIN, biometric data, or secret authentication material.

---

# 10. ROLE-BASED ACCESS AND DATA-LEVEL ACCESS

Use role-based access control combined with attribute- and resource-based rules where needed.

A permission decision should evaluate:

1. Authenticated identity.
2. Current account status.
3. Active entity membership.
4. The selected entity.
5. Role assignments and their scope.
6. Explicit grants or restrictions.
7. Resource ownership and record relationships.
8. Field-level and monetary visibility rules.
9. Relevant transaction status and workflow requirements.
10. Delegation limits and approval rules.
11. Effective dates, expiry, and revocation.
12. Mandatory platform and security restrictions.

The same permission name can produce different results at different scopes.

For example, `transaction.view_amount` granted for Firm A does not authorize access to Firm B.

### Conflict handling

Define one centrally implemented policy for combining roles and grants. Document it and test it.

At minimum:
- Mandatory security restrictions always win.
- Cross-entity access is denied unless explicitly authorized.
- Expired, revoked, or inactive grants do not authorize access.
- A permission cannot be delegated beyond the delegator's own authority.
- An explicitly configured restriction at a supported scope must not be silently overridden by an unrelated broad role.
- Higher-level grants must not accidentally defeat a more specific confidentiality restriction.

Do not implement conflicting grant/deny behavior independently in different screens. The Flutter interface and database policies must follow the same documented authorization model.

---

# 11. DELEGATION RULES

A person may delegate only authority they are permitted to delegate.

Example:
- An owner can delegate member management if they have `member.manage` and `permission.delegate` within the relevant scope.
- An administrator can invite accountants if their delegated authority permits it.
- An accountant cannot give themselves ownership-management privileges.
- A partner cannot access every transaction merely because they can invite a worker.
- A worker cannot create an unrestricted administrator account.
- An entity administrator cannot escalate themselves into a platform Super Admin.
- An entity-level owner cannot grant access to unrelated tenants merely because they own one firm.

Every delegation must record:
- Granting user.
- Recipient.
- Entity and scope.
- Permission or role.
- Delegation source.
- Allowed onward delegation, if any.
- Start and expiry.
- Reason where required.
- Revocation history.

Support time-limited and revocable permissions. Review delegated access when the grantor loses authority, leaves the entity, or the underlying delegation expires. Apply a deliberate policy rather than silently preserving or expanding privilege.

Avoid circular and self-escalating delegation. Validate the effective authority of the grantor at the point of every grant and at the point of use.

---

# 12. CROSS-COMBINATION SCENARIOS THAT MUST WORK

Implement and test the following cases. These are examples, not a fixed list of users.

### Scenario A — Three owners, three different permission sets
Firm A has three recorded owners. Each owner has a separate ownership record.

One owner may manage ownership, another may view financial reports, and the third may have restricted or pending application access if that is permitted by the configured business policy.

Do not force identical permissions merely because all three are owners.

### Scenario B — Three partners, only two owners
Firm B has three recorded partners, of whom two also appear in the ownership records.

The third partner must not gain ownership rights merely from partnership status.

### Scenario C — One owner, several partners
Firm C has one recorded owner and multiple partners. The owner may designate the permitted app roles for each partner without changing the partnership records.

### Scenario D — Partner and owner, different permissions
A person is both an owner and a partner. Their effective access must follow the configured grants and restrictions rather than combining the words into an unconditional super-role.

### Scenario E — Owner who is not a partner
A passive investor owns part of the entity but is not recorded as a partner. Their access must follow the explicit policy configured for that ownership relationship.

### Scenario F — Partner who is not an owner
A working partner manages permitted tasks but has no ownership record. The partner's permissions must not create financial ownership or equity.

### Scenario G — Creator is not the owner
An authorized administrator creates an entity on behalf of an owner. The system records the creator independently, designates the owner explicitly, and grants the creator only the authorized role.

### Scenario H — Owner has not joined Finly
The ownership record exists, but the owner has not accepted an invitation. No one can impersonate the owner or treat the owner as an active member.

### Scenario I — Same person, different roles across businesses
The user is an owner in Firm A, a partner and accountant in Firm B, and a worker in Firm C. The selected entity controls which permissions are effective.

### Scenario J — Administrator with no ownership
An administrator may operate the entity within delegated authority but cannot modify ownership records unless independently authorized.

### Scenario K — Member with restricted amount visibility
A worker may see assigned operational records but not balances, financial totals, or sensitive transaction details. Search, notifications, reports, and exports must preserve those restrictions.

### Scenario L — Entity ownership transfer
Ownership changes through a controlled workflow. Preserve historical ownership, record effective dates and approvals, and do not silently transfer financial records or application membership.

### Scenario M — Member removed from the firm
Revoke the appropriate membership and permission assignments. Preserve historical transactions and audit records. Do not reassign transaction ownership or delete business history automatically.

### Scenario N — Cross-entity creation
A user allowed to create a new business cannot automatically create it under another person's ownership or inherit the parent entity's financial access.

### Scenario O — Shared role changed
An administrator updates a shared role. Show affected members and permissions before saving. Ensure the change has only the intended scope and does not unexpectedly elevate unrelated entities.

### Scenario P — Concurrent permission changes
Two administrators modify a user's assignments simultaneously. Use appropriate transaction isolation, constraints, and conflict handling so that the final authorization state is consistent and auditable.

### Scenario Q — Owner loses membership
The ownership relationship may remain while interactive access is revoked. Apply the defined business and legal policy, and record both relationships separately.

### Scenario R — Ownership ends, partnership continues
Ending an ownership record must not automatically end the partnership record unless the user explicitly performs both changes and the business rules require it.

### Scenario S — Partnership ends, ownership continues
Ending a partnership must not automatically remove the person's ownership interest or silently delete a membership. Reassess permissions independently.

### Scenario T — Account disabled globally
A disabled account must not obtain access through any entity membership or role assignment. Preserve the entity's legitimate financial history.

### Scenario U — Invitation sent to the wrong person
Prevent unauthorized acceptance through identity verification, expiry, revocation, and appropriate invitation binding. Do not expose private business information before activation and authorization.

### Scenario V — Conflicting co-owner instructions
Do not silently let the last person to click override a sensitive ownership or governance change where the configured policy requires multi-party approval. Use pending, approved, rejected, and disputed states where appropriate.

### Scenario W — Person owns multiple firms
Ownership and access records must remain entity-scoped. No shared login or ownership record should grant implicit access to all the person's firms.

### Scenario X — Personal book linked to a business
Link records through a defined, audited operation. Linking must not duplicate transactions, change ownership silently, or expose the entire personal book to the business.

For every scenario, document:
- Required data model state.
- Allowed and prohibited actions.
- Expected UI state.
- Expected authorization decisions.
- Expected audit events.
- Required database constraints.
- Negative tests and concurrency tests.

---

# 13. HOW THE UI SHOULD DISPLAY OWNERSHIP AND ACCESS

Do not display only one badge reading `Owner` or `Partner`.

## 13.1 Entity switcher

The entity switcher should show:
- Entity name.
- Entity type or a clear icon.
- The current user's relationship to that entity.
- Their assigned application role or a simple access label.
- Pending or restricted status when relevant.

Example:

**Firm A**
- Relationship: Owner
- App role: Entity Administrator
- Access: Full authorized access

**Firm B**
- Relationship: Partner
- App role: Accountant
- Access: Financial operations, restricted administration

**Firm C**
- Relationship: None recorded
- App role: Worker
- Access: Assigned operational features

Use these as explanatory labels only. The interface must derive actual permissions from the authorization engine.

## 13.2 Entity overview

Provide an overview with:
- Entity details.
- Ownership summary, visible only to authorized users.
- Partners and business relationships, visible only to authorized users.
- Active members.
- Pending invitations.
- Role and access summary.
- Required setup tasks.
- Recent relevant audit activity.

Never reveal confidential ownership percentages or sensitive financial data simply because a user can see an entity in the switcher.

## 13.3 Dedicated management screens

Keep the following sections distinct, even if some are combined into a well-designed mobile interface:

1. **Ownership** — owners, interests, effective dates, ownership history and approval status.
2. **Partners** — partnership relationships, types, responsibilities and history.
3. **Members & Invitations** — accounts, membership status, suspension and revocation.
4. **Roles & Permissions** — role definitions, assigned capabilities and scope.
5. **Entity Creation & Relationships** — creation authority, parent/child relationships and delegated creators.
6. **Access Audit** — access grants, permission changes and administrative activity.
7. **Financial Access** — visibility of amounts, records, reports, exports and attachments.

These labels may be localized, but their meanings must remain distinct.

## 13.4 Member detail screen

For each authorized-to-view member, display separate cards or sections:

**Business relationship**
- Owner: Yes/No/Unverified, where permitted.
- Partner: Yes/No/Ended, where permitted.
- Other configured relationship.

**Application access**
- Membership status.
- Assigned roles.
- Access scope.
- Key capabilities.
- Restricted capabilities.
- Grant expiry.
- Delegation source.

**Actions**
- Change role.
- Review effective permissions.
- Grant or revoke authorized access.
- Suspend or reactivate membership.
- Send or cancel an invitation.
- Propose ownership or partnership changes, where authorized.

Require confirmation for sensitive actions and explain their effects.

## 13.5 Role and permission editor

Build a readable editor grouped by feature rather than showing users a huge raw permission list by default.

For each feature, allow an authorized administrator to configure supported actions such as:
- View.
- View amounts.
- Create.
- Edit.
- Approve.
- Reverse.
- Export.
- Share.
- Manage.
- Delegate.

Show the exact scope: this entity, selected branch, permitted records, or supported resource level.

Provide:
- Default role templates.
- Custom role creation where authorized.
- An effective-permissions preview.
- A comparison before-and-after.
- Warnings about sensitive permission combinations.
- A list of affected users before changing a shared role.
- Clear save, cancel, error, and success states.

Never make a toggle appear enabled if the backend will reject the corresponding action without explaining why.

## 13.6 Hide or disable actions correctly

Use the effective permission decision to determine whether an action is available.

For an unauthorized user, follow a consistent policy:
- Hide sensitive actions when their existence itself would reveal protected information.
- Show a disabled action with a concise explanation where this improves usability and does not leak data.
- Never rely on disabled buttons or hidden screens as security controls.

All protected data and backend operations must still be authorized independently.

---

# 14. EFFECTIVE-PERMISSION PREVIEW

Every authorized member manager should be able to see a meaningful access summary before granting permissions.

Example:

**Proposed access — Firm A**

| Capability | Proposed state |
|---|---|
| View assigned transactions | Allowed |
| View monetary amounts | Allowed |
| Create transactions | Allowed |
| Approve transactions | Not allowed |
| Reverse posted transactions | Not allowed |
| Export reports | Not allowed |
| View ownership percentages | Not allowed |
| Manage partners | Not allowed |
| Manage ownership | Not allowed |
| Invite members | Allowed |
| Delegate permissions | Limited or not allowed, as configured |

The actual values must come from the configured grant set. This is an illustrative example, not a default authorization policy.

The preview must also identify:
- Permissions inherited from each role.
- Directly granted permissions.
- Explicit restrictions.
- Permissions blocked by mandatory policy.
- Scope limitations.
- Expiry.
- Delegation restrictions.

If a requested permission combination is invalid, explain the conflict and require correction. Do not silently grant a weaker or stronger permission set than the user requested.

---

# 15. AUTHORIZATION MUST BE ENFORCED IN POSTGRESQL/SUPABASE

The Flutter application is not a security boundary.

For Finly's PostgreSQL/Supabase backend:

1. Authenticate using the supported secure authentication system.
2. Identify the current user from the trusted authenticated context.
3. Enforce entity-level and record-level access on the backend.
4. Implement appropriate Row Level Security policies.
5. Check permission grants and scopes for sensitive mutations.
6. Validate field-level and monetary visibility for reads.
7. Protect nested resources, joins, aggregates, search results, attachments, exports, and reports.
8. Prevent users from replacing an entity ID, owner ID, user ID, or role ID in a request to access another entity.
9. Restrict privileged functions and database operations to documented, justified authorities.
10. Audit sensitive operations under the real authenticated actor.
11. Test security against direct API calls, not just the Flutter interface.
12. Revoke or invalidate effective access when membership, account status, role assignment, or delegation changes.

Do not expose service-role credentials, database passwords, signing secrets, or unrestricted privileged keys in the Flutter app, repository, logs, or APK.

If a privileged server function is necessary, validate the caller's identity and authority inside the trusted server/database boundary. Do not accept client-supplied claims of ownership or permissions without verifying them.

Be particularly careful with:
- Recursive permission checks.
- RLS policy recursion.
- `SECURITY DEFINER` functions.
- Search-path configuration.
- Direct table access.
- Storage policies.
- Views and materialized views.
- RPC functions.
- Background jobs.
- Database migrations and administrative sessions.

Review and test these explicitly.

---

# 16. FINANCIAL INTEGRITY AND SEGREGATION OF DUTIES

Authorization must work with Finly's accounting architecture.

A user with permission to enter a transaction must not automatically be able to approve it, reverse it, reconcile the account, close the accounting period, or export all entity data.

Support configurable separation of duties for sensitive operations.

Where the business policy requires independent approval:
- The creator cannot approve their own entry.
- An unauthorized user cannot bypass the approval workflow.
- A pending transaction must not appear as a posted transaction in final accounting reports.
- A rejected or expired approval request must not post a financial entry.
- A failed posting must not leave partial ledger entries or changed balances.
- Duplicate submissions must not produce duplicate postings.

A permission change must not rewrite financial ownership, transaction classification, historical records, or outstanding balances.

Ownership percentages must not silently determine cash balances, profit allocations, account balances, repayment obligations, or transaction visibility unless a separately specified and valid accounting rule requires that calculation.

Preserve the separation between:
- Legal owner.
- Transaction initiator.
- Approver.
- Money source.
- Recipient.
- Beneficiary.
- Entity bearing an expense.
- Holder or custodian of funds.
- Owner of an account.
- Person responsible for repayment.
- Accounting classification.
- User allowed to access the record.

These relationships can overlap, but they are not interchangeable.

---

# 17. ACCESS CHANGE AND OWNERSHIP CHANGE WORKFLOWS

## Permission change

For a change to an active user's permissions:

1. Authenticate the actor.
2. Authorize the actor's authority to make the change.
3. Identify the exact entity and target user.
4. Resolve the user's current and proposed effective permissions.
5. Check for escalation, conflicts, expiry, and delegation violations.
6. Show the material changes to the actor.
7. Require confirmation for sensitive changes.
8. Apply the change atomically.
9. Record the old and new states in the audit log.
10. Ensure subsequent requests use the updated access state.

Revoke stale sessions or refresh authorization context where appropriate.

## Ownership change

For a transfer, addition, removal, or correction of ownership:

1. Verify the actor's ownership-management authority.
2. Identify the exact legal party or person affected.
3. Capture the proposed change and its effective date.
4. Validate any required approvals, documentation, and ownership constraints.
5. Show consequences for ownership records and any configured dependent workflow.
6. Obtain the necessary confirmation or approval.
7. Apply the change atomically.
8. Preserve historical records.
9. Audit who proposed, approved, and applied the change.
10. Reassess app permissions independently.

Never assume that removing ownership should automatically revoke all access, or that revoking app access should transfer or remove ownership.

Support pending, approved, rejected, cancelled, and disputed states when the workflow needs them.

---

# 18. DATABASE CONCURRENCY AND RACE CONDITIONS

Ownership and permissions may be modified by multiple administrators simultaneously.

Implement suitable transactions, row locking, constraints, isolation, and retry logic for sensitive changes.

Required examples:
- Two administrators simultaneously grant different roles to the same member.
- An administrator revokes membership while the user submits a transaction.
- An ownership change races with another ownership change.
- An invitation is accepted twice.
- Two administrators attempt to approve the same request.
- A role is changed while another user attempts a privileged action.
- A delegated administrator loses authority while attempting further delegation.
- Two requests attempt to create the same entity or relationship.

Define which state must be authoritative at the moment an operation is authorized and committed.

Use atomic, idempotent workflows to prevent duplicate membership, ownership, permission, approval, or financial records.

Never claim concurrency safety solely because PostgreSQL is being used. Add deterministic integration tests using multiple database connections.

---

# 19. AUDIT REQUIREMENTS

Record, as appropriate:
- Entity created.
- Entity ownership added, modified, ended, or transferred.
- Partner relationship created, updated, or ended.
- Invitation issued, accepted, cancelled, or expired.
- Membership activated, suspended, reactivated, or revoked.
- Role created, changed, assigned, or removed.
- Permission granted, restricted, delegated, expired, or revoked.
- Entity creation authority changed.
- Permission-denied attempts for sensitive operations, subject to log-volume and privacy controls.
- Sensitive data export or sharing.
- Administrative support access.
- Ownership or permission approval decisions.

An audit record should identify:
- Actor.
- Affected entity.
- Affected subject or resource.
- Action.
- Timestamp.
- Relevant before-and-after state, or a secure reference to it.
- Reason or business context where required.
- Approval or correlation ID.
- Outcome.

Do not put passwords, PINs, session tokens, encryption keys, or unnecessary sensitive personal data into logs.

Ordinary administrators must not be able to silently rewrite or delete authoritative audit history. Access to audit records must also be permission-controlled.

---

# 20. REQUIRED AUTOMATED TEST MATRIX

Build automated tests for the permission engine, database schema, RLS, server functions, Flutter screens, and workflows.

At minimum, test:

### Relationship tests
- An entity can have multiple owners.
- An entity can have multiple partners.
- Ownership and partnership lists may differ.
- One person can have several roles across different entities.
- Relationship records do not automatically create inappropriate memberships.
- Creator status does not automatically create legal ownership.

### Authorization tests
- A user can access permitted Firm A records but not Firm B records.
- A partner does not automatically receive ownership permissions.
- An owner does not bypass explicit access restrictions.
- A worker cannot grant themselves administrator access.
- An administrator cannot elevate themselves beyond delegated authority.
- A denied monetary amount does not leak through totals, search results, reports, or exports.
- A revoked membership cannot continue to use stale authorization to access protected resources.
- Unauthorized direct API calls fail even when made outside the UI.

### Creation tests
- Independent entity creation is controlled by the relevant permission.
- Parent-child creation requires appropriate authority.
- The creator and designated owner remain distinct where specified.
- Failed setup does not leave partial membership or ownership records.
- Invitation retries are idempotent.

### Role and permission tests
- Custom roles produce the intended effective permissions.
- Multiple-role combinations follow the documented conflict policy.
- Restrictions cannot be overridden by prohibited broad grants.
- Expired permissions stop authorizing access.
- Shared role changes affect only the intended scope.
- Delegation cannot create permission escalation.
- Permission changes are reflected in backend authorization, not only in refreshed UI state.

### Financial operation tests
- A transaction-entry permission does not imply approval permission.
- Reversal permission is distinct from ordinary edit permission.
- Approval restrictions cannot be bypassed by direct requests.
- Permission changes do not alter posted accounting records.
- Failed or duplicated operations do not create partial or duplicate financial records.

### Concurrency tests
- Concurrent membership updates remain consistent.
- Concurrent ownership changes respect constraints and approvals.
- Concurrent approval requests cannot double-post a transaction.
- Revocation and transaction submission follow the documented authorization timing.
- Concurrent entity creation does not create duplicate entities unintentionally.

### UI tests
- Entity switcher labels match the selected entity's relationship and access.
- Ownership and partnership screens remain separate.
- The permission editor shows an accurate effective-permission preview.
- Users cannot open restricted routes and obtain protected data by bypassing navigation.
- Loading, empty, validation, conflict, unauthorized, expired invitation, and failure states are implemented.
- All controls perform their actual authorized action rather than acting as placeholders.

Use test fixtures to cover the combinations above, but do not hard-code test identities or example firms into production behavior.

---

# 21. MIGRATION AND BACKWARD COMPATIBILITY

Before modifying existing data:

1. Inspect current ownership, role, partner, account, membership, and permission fields.
2. Identify overloaded fields that currently combine multiple concepts.
3. Map existing records to the new normalized model.
4. Identify records whose ownership or access meaning is ambiguous.
5. Preserve historical relationships and audit context.
6. Write reversible or safely repeatable migrations wherever practical.
7. Validate entity isolation and access behavior before enabling the new model.
8. Avoid destructive deletion or silent reassignment of existing users.
9. Define how unresolved relationships will be reviewed.
10. Verify existing authentication and authorized business workflows after migration.

Do not guess that an existing `Owner` role proves legal ownership or that a recorded partner necessarily has an ownership share.

When the current data is ambiguous, preserve it safely, mark the relationship as unverified or requiring review if appropriate, and avoid granting additional privileged access until it is resolved.

---

# 22. REQUIRED DELIVERABLES

Complete the work with:

1. A written explanation of the final relationship and permission model.
2. An audit of the existing implementation and its risks.
3. A documented role and permission catalog.
4. A documented authorization evaluation and conflict-resolution policy.
5. A complete entity creation and invitation workflow.
6. Separate ownership and partnership management flows.
7. A responsive member and permission management UI.
8. A PostgreSQL/Supabase schema and migration plan.
9. RLS policies and properly secured privileged functions.
10. An audit strategy for relationship and permission changes.
11. A scenario matrix covering all eight foundational combinations and the additional cross-scenarios above.
12. Automated unit, database integration, RLS, concurrency, and UI tests.
13. Deployment and migration instructions.
14. A list of remaining risks, unresolved business rules, and jurisdiction-specific questions.

Every screen must be connected to real backend data. Every permission control must have a corresponding enforcement rule. Every sensitive change must follow the appropriate authorization and audit process.

Do not ship fake permission logic, disconnected screens, dummy buttons, hard-coded user mappings, unimplemented approval states, or claims of security that have not been tested.

Use this engineering cycle:

**Inspect → Design → Migrate safely → Implement → Test → Verify → Fix → Retest → Document.**

Report which checks actually ran, which passed, which failed, and which remain untested. Do not report a successful result unless it has been verified.

## FINAL ACCEPTANCE RULE

Finly is not ready until it can correctly represent and enforce the full separation of:

**Entity ownership ≠ partnership ≠ creator ≠ membership ≠ application role ≠ effective permission.**

Every person must be able to have different valid combinations across different entities. Every authorization decision must be entity-scoped, securely enforced by the backend, visible to authorized administrators in understandable language, auditable, and covered by automated tests.