# Accessibility

The target is WCAG 2.2 AA on Android, checked with TalkBack, Switch Access, font scaling and the Accessibility Scanner.

## Contrast

All 134 colour pairs the system uses pass in both themes, checked by `design-system/tools/contrast.js`:

- `ink`, `ink-muted`, `brand` and every money and state colour as text on `surface`, `surface-raised` and `surface-sunken`: at least 4.5:1.
- Each state colour on its own `-soft` fill, and `ink` on every `-soft` fill and on `brand-soft`: at least 4.5:1.
- `on-brand` on `brand` and `on-accent` on `accent`: at least 4.5:1.
- `line-strong`, `accent` and `brand` as borders, rings and marks: at least 3:1.

## Not colour alone

Every money direction and state carries a glyph and a word as well as a colour; amounts carry a sign. Selected chips show a check. Breakdown bars have legends with values. Errors have an icon and text.

## Touch and reach

- Everything tappable is at least 48 × 48dp, with at least 8dp between targets.
- Primary actions sit at the bottom within one-thumb reach; the add button is bottom-right.
- Nothing depends on a long-press, a multi-finger gesture or a swipe alone; each has a visible alternative.

## Text size

- All text scales with the system font size up to 200%. Layouts reflow: secondary lines wrap or move below; amounts and buttons never truncate.
- Amounts never go below `amount-sm` (15sp).

## Screen readers

- Amounts are read in words with direction: "plus fifty thousand rupees, money in". Masked amounts read "Amount hidden".
- Badges read their word ("Pending approval"), not their colour. Icons beside text are silent.
- M-PIN digits are never spoken: "2 of 4 digits entered".
- Live updates (posting finished, sync failed, validation errors) are announced politely; errors assertively.
- Focus order follows reading order; sheets and dialogs trap focus and return it to what opened them.

## Focus and motion

- The `focus` ring (2px gap, 2px solid, 3:1 or better) appears on every focusable control for keyboards and Switch Access.
- With *Remove animations* on, motion stops and feedback stays (*Motion*).

## Language

The app's language matches the user's choice — English, Hindi or Gujarati — and screen readers receive the matching locale.
