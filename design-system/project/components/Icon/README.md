# Icon

Every glyph the system uses, drawn on a 24px grid with a 1.8px rounded stroke in `currentColor`.

These are reference stand-ins. The app uses Flutter's built-in Material icons, Rounded style, mapped name by name in the brand book's Iconography section. Pass `label` only when the icon is the whole control's meaning (an icon-only button already has its own label); otherwise icons are hidden from screen readers because the text beside them carries the meaning.

- Provide: `name` (see the grid), optional `size` (default 24, badges 16, dense rows 20), optional `label`.
- Never colour an icon to carry meaning on its own: financial icons always sit next to a word, a sign or both.

**In the app:** `FyIcon` — Icon with Icons.*_rounded.
