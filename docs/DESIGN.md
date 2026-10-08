# Design

The design system is the single source for how Finly looks, reads, moves and behaves (BUILD_PROMPT Part K, K-UX;
add-ons 04, 07, 08, 09). It lives in [`design-system/`](../design-system/) and is published as the
[Finly Design System](https://claude.ai/artifact/TS2kABqmbQoASrgxM6r79J) for review.

> **Status:** draft. It becomes final at **Gate 4**, together with the UX blueprint and the master Edge-Case Matrix,
> after the revision required by add-ons 08 (motion language, decoration) and 09 (chart palette, theme rationale).

## Where each part lives

| Part | Source |
|---|---|
| Colours, light and dark (one palette file) | `design-system/tools/palette.json` → `design-system/project/tokens.json` |
| Type, spacing, radius, elevation, sizes, opacity, durations | `design-system/tools/make-tokens.js` → `tokens.json` |
| Brand: name, tagline, logo files, splash | `design-system/project/brand.json`, `design-system/project/assets/Logos/` |
| Usage rules: content, colour, type, space, shape, iconography, brand | `design-system/project/README.md` |
| Money language: directions, states, amount writing, visibility modes, permission-aware totals | `design-system/project/01-money-language.md` |
| Privacy and security patterns: visibility, unlock, step-up, the verified share path, screen privacy | `design-system/project/02-privacy-and-security.md` |
| Motion | `design-system/project/03-motion.md` |
| Content and labels: message patterns, dates, Avak/Javak/Tijori labels, languages | `design-system/project/04-content-and-labels.md` |
| Accessibility | `design-system/project/05-accessibility.md` |
| Flutter mapping: tokens → `ThemeData` + `ThemeExtension`s, fonts, icons, widgets | `design-system/project/06-flutter-implementation.md` |
| Components: guidelines and live reference previews (47) | `design-system/project/components/<Name>/` (generated from `design-system/tools/components.spec.js`) |

## The "Account / Khata" mapping (AC2)

The word the user sees, *Account* or *Khata*, means a **money location** (Tijori, Savan Bank). Internally it maps to
one asset **ledger account** per owning entity holding value there. *Credit / Avak* is money into the location being
viewed and *Debit / Javak* is money out of it; posting rules turn each into the correct accounting debits and credits.
Labels never drive sign logic.

## Rules every screen follows

- One theme source: no screen defines its own colours, sizes or durations.
- The amount is the strongest element; whole rupees, Indian grouping, a sign and a glyph with every direction.
- Every state is told apart by glyph and word, never colour alone.
- Every screen supports every K3 state (the States board).
- Primary actions at the bottom in thumb reach; one review sheet instead of dialog chains; validation while typing.
- Totals and lists only ever show the viewer's authorised data.

## Still to design (M2, before Gate 4)

- UX blueprint: navigation map per role, search model, tap and time budgets for the UX2 flows (quick entry, find a
  transaction, see a balance, share proof, reverse or correct, settle an outstanding, reconcile a Tijori).
- Add-on 08: a distinct motion language per interaction, decoration rules and tokens, empty-state illustrations.
- Add-on 09: a colour-blind-safe chart palette and chart rules; the written theme rationale.
