# PrivacyBadge

Tells the viewer who can see an item and why, without revealing anything they cannot see.

- Provide: `level` — `private`, `family`, `business`, `restricted`, `shared` — an optional custom `label` (the owner may rename confidentiality levels), and an optional `reason` line.
- Reasons explain the rule, never the hidden content: "Only you can see this." / "You can see that this exists, not its details."
- Personal finance shows Private by default (BUILD_PROMPT A4).

**In the app:** `FyPrivacyBadge` — a DecoratedBox + Icon + Text.
