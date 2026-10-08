# AddSheet

What the add button opens: the entry types the user may create, with "Repeat last" on top.

- Provide: `onPick`, optional `types` (already permission-filtered), `repeat` (a one-line description of the last entry) with `onRepeat`, `onClose`.
- Each tile leads to a form that shows only the fields its type needs (progressive disclosure).

**In the app:** `FyAddSheet` — showModalBottomSheet.
