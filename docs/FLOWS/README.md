# Flow maps

**No financial feature is implemented before its flow map exists here** (BUILD_PROMPT G1). One file per major
feature: `docs/FLOWS/<feature>.md`. A flow map is reviewed with the feature's Edge-Case Matrix rows
([TEST_PLAN.md](../TEST_PLAN.md) §4) and updated whenever the feature changes.

## Template

```markdown
# <Feature>

## Chain
INPUT / USER ACTION → AUTHENTICATION → AUTHORIZATION → VALIDATION → DEPENDENCIES → IMPACT ANALYSIS →
CONFLICT CHECK → FINANCIAL CALCULATION → ATOMIC COMMIT → AUDIT → UPDATED VIEWS / REPORTS / RELATED RECORDS

## Touches
| Kind | Items |
|---|---|
| Screens | … |
| Modules | … |
| API endpoints | … |
| Tables / records | … |
| Journal lines produced | entity · ledger account · Dr/Cr · amount · fund · location · holder · counterparty |
| Reports affected | … |
| Notifications | … |
| Share artifacts | … |
| Audit events | … |

## Paths
- **Happy path:** …
- **Failure paths:** (validation, authorization, balance, invariant, conflict, infrastructure — each with the exact user message and resolution path)
- **Offline path:** what may be prepared offline, what the server re-checks on sync, how rejection is shown
- **Permission-change path:** what happens when access changes mid-flow
- **Concurrency path:** two users, retries, unknown commit outcome

## C4 questions
Why it exists · who uses it · where and when it appears · data · permissions · security level · before and after ·
offline · failure · session expiry · lost device · forgotten password or M-PIN · biometric change · permission change ·
disabled account · simultaneous users · audit events · financial records · reports · notifications · WhatsApp and PDF
behaviour · proof or screen · share verification · screenshot risk · future web client.
```

## Maps

None yet — the first ones (quick entry, transfer, expense with splits) are written at M6, before the code.
