# BottomSheet

The default container for choices, reviews and confirmations: it rises from the bottom, within thumb reach.

- Provide: `title`, `children`, optional `actions` (buttons pinned at the bottom), `onClose` (pass `null` when closing would lose required verification).
- Enters in 320ms with a decelerating curve; drag down or tap the scrim to close when nothing would be lost.

**In the app:** `FyBottomSheet` — showModalBottomSheet with drag handle.
