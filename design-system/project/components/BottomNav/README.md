# BottomNav

The same five destinations on every screen — Home, Money, Activity, Outstanding, More — with the add button above.

- Provide: `value`/`onChange`, `onAdd`, optional `items` (workers get the reduced set from BUILD_PROMPT L13: Add entry, My entries, Assigned, Pending, Notifications).
- Role-shaped: users see only destinations they can use, never a row of disabled items.
- Switching tabs fades through in 220ms; the active pill grows from the icon.

**In the app:** `FyBottomNav` — NavigationBar.
