# Finly

A private family + business financial operating system for Android: double-entry accounting underneath, a
simple and fast money app on top. Personal finance is private to its owner, every rupee is explainable, proof is
always generated (never a screenshot), and there is no AI anywhere.

> **Status: M0 — foundation.** No application code exists yet. The build specification requires approval of the
> technology stack and the accounting model before any code is written (Gates 1 and 2). See [TASKS.md](TASKS.md).

## Where things are

| Path | What |
|---|---|
| [docs/source/BUILD_PROMPT.md](docs/source/BUILD_PROMPT.md) | The authoritative build specification |
| [docs/source/](docs/source/) | The product owner's add-ons 01–08, verbatim (the stricter reading wins) |
| [docs/](docs/) | PRD, SRS, architecture, design, rules, security, test plan, decisions, memory, flow maps, privacy |
| [design-system/](design-system/) | The Finly design system source — tokens, brand, logo, reference components — published as the [Design System artifact](https://claude.ai/artifact/TS2kABqmbQoASrgxM6r79J) |
| [TASKS.md](TASKS.md) | Milestones M0–M10 and their approval gates |

The Flutter app (`app/`) and the backend (`backend/` or `supabase/`) are created after Gate 1 approves the stack.

## Technology (decided so far)

- **Client:** Flutter + Dart, Android first; iOS and web later on the same backend (add-on 04).
- **Backend:** free tier only; Supabase is the first preference, under evaluation in the Stack Decision Record
  ([docs/DECISIONS.md](docs/DECISIONS.md)).

## Design-system checks

Requires Node.js 18 or newer.

```bash
npm --prefix design-system/tools ci --ignore-scripts
```

```bash
npm --prefix design-system/tools run check
```

`check` runs the WCAG contrast check over every colour pair in both themes and renders every reference component.

## Rules that never bend

- Never commit passwords, keys, tokens, `.env` files or real financial data. `.env.example` lists names only.
- Every change is a small, tested, reviewed commit ([docs/RULES.md](docs/RULES.md)).
- No AI features. No screenshots as proof. No external share without verification. Android only, for now.
