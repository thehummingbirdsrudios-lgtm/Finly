# Security

Protection requirements and the threat model. The requirements come from BUILD_PROMPT Parts A5, B3, L, M, N, O, Q,
U and add-ons 01, 02, 06 and 07. This is the **outline**: data-flow diagrams, the full threat table and the key-management
design are completed at M1, before Gate 3.

## 1. What we protect

| Asset | Why it matters | Highest classification |
|---|---|---|
| Financial values: amounts, balances, outstanding, fund ownership | The family's and firms' money | Confidential; owner-only for personal finance |
| Personal finance of each person | Private to its owner by default (A4) | Owner-only |
| Ledger integrity: journals, lines, snapshots, hash chain | Every rupee must stay explainable | Integrity-critical |
| Credentials: passwords, M-PINs, recovery codes, refresh tokens | Account takeover | Secret (hashed, never retrievable) |
| Encryption keys and key metadata | Decrypt everything | Secret (never on Android, never in Git or logs) |
| Permissions, roles, policies, owner grants | Decide who sees what | Integrity-critical |
| Bank details, private locations, confidential notes, attachments | Targeted theft, fraud | Confidential |
| Shared documents and proof cards | Leave the system | Per share policy |
| Audit log | Accountability and incident evidence | Integrity-critical, tamper-evident |
| Personal data of users and contacts (names, phones, devices) | Privacy | Internal |

## 2. Actors

Owner / Super Admin (Krish), Admins, workers, family members, partners and recipients of shares, a person holding a
lost or stolen phone, a malicious insider with some access, an outside attacker on the network or the internet,
compromised third-party services (backend host, WhatsApp, push), and the developer or agent with repository access.

## 3. Trust boundaries

1. **Phone ↔ network ↔ API.** The phone and everything on it is untrusted; the API authenticates, authorises and validates every request.
2. **API ↔ database.** Only the backend's own roles reach financial tables; client roles are denied by default.
3. **Backend ↔ key material.** Decryption happens only inside the backend's protected memory; keys live in a secret store.
4. **Finly ↔ external channels.** WhatsApp, the Secure Viewer and downloads are outside our control once content leaves.
5. **Production ↔ development.** Separate projects, credentials and data; no production data in development.
6. **Repository ↔ secrets.** Nothing secret is ever committed; CI receives secrets only from its secret store.

## 4. STRIDE outline

| Threat | Examples | Planned mitigations |
|---|---|---|
| **Spoofing** | Stolen password; stolen phone with a remembered session; replayed tokens; fake recipient on a share | Hashed passwords with throttling and lockout; MFA (mandatory for Super Admin); short-lived access tokens with rotating refresh tokens; device registry and remote revocation; biometric/M-PIN app unlock bound to the Android Keystore; device-security-change detection; recipient verification before sharing (N, Q3) |
| **Tampering** | Client sends a forged balance; edits another user's record by changing an ID; alters a posted journal; changes a share after preview | The server computes all results from requested operations; object- and field-level authorization on every request (IDOR tests); immutable journals with hash chain and Integrity Verifier; content-hash binding of share verifications; signed, versioned migrations (J1, O, AC7, Q3) |
| **Repudiation** | "I never approved that"; disputed handover; deleted evidence | Tamper-evident audit log of every U2 event with who, what, when, device, authentication strength; maker/checker records; receipts linked to transactions; nothing deletable that history references (U2, J6, H15) |
| **Information disclosure** | Hidden totals inferred from dashboards, counts or search; private amounts on the lock screen; plaintext amounts in the database or backups; secrets in the APK or logs; screenshots of confidential screens | Permission-aware aggregation and data minimisation (hidden fields absent from responses); application-level authenticated encryption of sensitive values with keys off-device; encrypted backups; masked/generic notifications; secure-screen protection on classified screens; secret scanning and log scrubbing (L12, M, R5, N11) |
| **Denial of service** | Request floods; huge uploads; free-tier quota exhaustion; inactivity pausing of a free backend | Rate limits and request size limits; upload type and size checks; pagination caps; quota monitoring; the free-tier pause and backup behaviour of the chosen backend are verified in the Stack Decision Record and handled by design (O, add-on 01) |
| **Elevation of privilege** | An Admin grants themselves access to personal finance; a worker reaches Super Admin screens by deep link; View As User leaks; break-glass misuse | Central policy engine with explicit deny > allow > default; owner-only grants for personal finance; permission re-checked on every request and every opened result; View As User read-only and bounded by the admin's own rights; break-glass only where configured, with strong auth, reason, audit and owner notification (L8, L9, L15, A4) |

## 5. Security requirements by layer (summary)

- **Android:** no keys or decryption secrets; Keystore-backed encrypted storage for the session and the offline cache;
  biometric via the platform prompt; secure screens per classification; certificate validation; cache cleared on
  revocation and logout; no sensitive data in logs or crash reports.
- **API:** versioned; authentication, session and device checks, authorization (object + field), validation and rate
  limits on every endpoint; idempotency keys on every mutation; errors that never reveal SQL, stacks, keys or hidden data.
- **Database:** constraints and foreign keys; row versioning; deny-by-default access for client roles; encrypted
  sensitive columns; keyed search indexes for encrypted fields; no plaintext shadow columns without a recorded review.
- **Keys:** a dedicated secret store; key versions and rotation; usage audit; separately protected recovery keys;
  tested recovery of encrypted data.
- **Sharing:** generated from authorised data only; exact preview; recipient verification; step-up per policy;
  verification bound to a content hash; honest delivery states; no claim of remote destruction.
- **First login:** Krish's temporary password is generated by a one-time local bootstrap and shown only to him; only
  its hash is stored; first use forces a change (add-ons 06, 07).

## 6. Open decisions (resolved at Gate 1 and M1)

1. Where the key-encryption key lives on a free backend, and what that protects against — and what it does not.
2. Whether the posting engine decrypts inside database functions or inside a backend service holding the transaction.
3. Keyed-index design for searchable encrypted fields (amount ranges, names, references).
4. Backup encryption tooling and off-site storage on free tiers; restore-drill frequency.
5. Crash reporting with strict scrubbing, or none.
6. Minimum Android version, weighed against Keystore, biometric and patch-level guarantees.

## 7. Reporting a vulnerability

This is a private system. Report suspected vulnerabilities directly to the owner (Krish), not in issues or chat
groups. Never include credentials or real financial data in a report.
