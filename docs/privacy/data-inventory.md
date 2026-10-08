# Personal data inventory

> **Draft for review by a qualified lawyer (and, for retention periods, a chartered accountant).** Nothing here states
> that Finly is legally compliant. Storage locations and processors are confirmed when Gate 1 approves the stack.

Finly is a private, non-commercial system used by one family, its businesses and their workers. It collects as little
personal data as the build specification allows.

## 1. What is collected

| Data | About whom | Why | Where stored | Who can access | Retention (proposed) |
|---|---|---|---|---|---|
| Name, display name, username, role, status | Every user | Sign-in, attribution ("handled by"), permissions | Backend database | Super Admin; others per permission | While the account exists; archived with history afterwards |
| Phone number, email (optional) | Users; share recipients | Recovery, notifications, recipient verification | Backend database (encrypted where sensitive) | Super Admin; the user; share flow | While needed; removed on request unless tied to a share record |
| Password, M-PIN, recovery codes | Users | Authentication | **Hashes only**, backend | Nobody — never retrievable | Replaced on change; deleted with the account |
| Biometric data | Users | App unlock | **Not collected** — Android's own biometric system; Finly stores only "enabled" state | — | — |
| Devices and sessions: model, Android version, app version, last active, push token, refresh-token hash | Users | Device registry, revocation, notifications | Backend database | The user; Super Admin | While the device is registered; login history 1 year (proposed) |
| Login and security events, IP address | Users | Security monitoring, audit | Audit log | Super Admin, auditors | 1–3 years (proposed) |
| Financial records: transactions, balances, funds, notes, reasons, people named in them | Users, family, firms, workers, vendors, customers | The product's purpose | Backend database (sensitive values encrypted) | Per permission; personal finance owner-only | Books of account — see §3 |
| Attachments: receipts, bills, photos | Vendors and others pictured or named | Evidence for entries | Backend file storage, access-controlled | Per attachment permission | With the transaction they support |
| Generated shares: recipient, channel, format, time, document ID, verification | Recipients | Share history and audit | Backend database | Initiator, Super Admin, auditors | With the related records; secure-viewer copies expire per policy |
| Offline cache | The device's user | Offline use | Encrypted on the phone | That user, on that device | Cleared on logout, revocation, or per policy |

**Not collected:** location (places are words the user types), contacts lists, advertising IDs, analytics profiles,
biometric templates, AI inputs.

## 2. Third parties (processors)

| Service | Purpose | Data it can see | Location |
|---|---|---|---|
| Backend host (chosen at Gate 1; Supabase preferred) | Database, auth, storage, functions | Everything stored, sensitive values encrypted at application level | To be fixed at Gate 1 (Mumbai region preferred) |
| Push notification service | Delivery of notifications | Device token; notification text per masking policy | Possibly outside India |
| WhatsApp (only when a user shares) | Delivering proof the user chose to send | The content the user verified and shared | Meta's infrastructure |
| Crash reporting (only if approved at Gate 1) | Diagnostics | Scrubbed technical data, no financial values or personal data | To be decided |

## 3. Retention of financial records

Indian law sets minimum periods for books of account (for companies, eight years under the Companies Act, 2013; for
income-tax purposes, generally six years). **A chartered accountant must confirm the periods for each firm and person.**
Finly never deletes posted history; archived and closed-period records stay readable to authorised users.

## 4. Laws that may apply (flagged, not decided)

- **India — Digital Personal Data Protection Act, 2023 and its Rules.** Processing for purely personal or domestic
  purposes may be exempt; processing of workers', vendors' and customers' data for the businesses is likely not.
  Employment-related processing may rely on the Act's "legitimate uses". **Needs a lawyer's view.**
- **India — Information Technology Act, 2000 and the SPDI Rules** for passwords and financial information.
- **Companies Act, 2013 and Income-tax Act, 1961** for books of account and retention.
- If any recipient or user is outside India, their local law may also apply.

## 5. Rights and requests

Users can see their own profile data, change credentials, see their devices and sessions, and ask the Super Admin
to correct or archive their account. Deleting an account archives it when financial history references it (H15); its
credentials, devices and sessions are deleted. Owner grants over personal finance can be revoked by the owner at any
time, and every grant and revoke is audited (A4).

## 6. Documents still needed before release

A short privacy notice inside the app (what Finly stores and why, who can see it, how to ask for changes), and
internal acceptable-use terms for users. These are written at M10, then reviewed by a lawyer. Business details
(legal names, addresses, contact for privacy requests) are placeholders until the owner provides them.
