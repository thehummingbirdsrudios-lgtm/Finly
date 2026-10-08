# Selector

A searchable picker for accounts, funds, people, firms, categories and dates.

- Provide: `label`, `options` (`[{id, title, subtitle, icon, disabled, reason}]`), `value`/`onSelect`, optional `recentLabel`, `error`.
- Lists only valid, active choices the user may use. The place already chosen as From appears disabled in To with its reason, so a transfer to itself cannot be picked.
- Recents and frequent pairs come first.

**In the app:** `FySelector` — showModalBottomSheet with a searchable ListView.
