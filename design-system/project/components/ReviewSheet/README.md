# ReviewSheet

The single review before money posts: amount, route, classification, impact, warnings, and one confirm button.

- Provide: `amount`, `direction`, `rows` (`[{label, value}]`), optional `impact`, `hiddenImpact`, `warnings`, `stepUp`, `posting`, `onConfirm`, `onEdit`.
- Replaces chains of dialogs. If step-up is required, confirming opens the fingerprint prompt inline.
- Nothing is shown as posted until the server confirms; the button reads "Posting…" meanwhile.

**In the app:** `FyReviewSheet` — showModalBottomSheet (isScrollControlled).
