# Finely design system — source

This folder is the single source of the Finely design system (BUILD_PROMPT Part K). It is published as the
Design System artifact <https://claude.ai/artifact/TS2kABqmbQoASrgxM6r79J>. The Flutter app's theme will be
generated from the same `tokens.json` (`docs/DESIGN.md`).

| Path | What |
|---|---|
| `tools/palette.json` | Every colour, light and dark. Edit colours here only. |
| `tools/make-tokens.js` | Builds `project/tokens.json` from the palette plus usage notes, type, spacing, radius, elevation, size, opacity and duration. |
| `tools/contrast.js` | WCAG 2 check of every text/surface, mark/surface and status/soft pair in both themes. Exit code 1 on any failure. |
| `project/` | The published system: `tokens.json`, the brand book (`README.md` + sections), and reference components (`components/`). |

## Changing a token

```bash
node design-system/tools/make-tokens.js design-system/tools/palette.json design-system/project/tokens.json
```

```bash
node design-system/tools/contrast.js design-system/tools/palette.json
```

Commit the palette, the generator change and the regenerated `tokens.json` together, then republish the
changed `project/` files to the artifact.

The components under `project/components/` are **reference renderings** (React, for the artifact's live
previews). They define layout, states, copy and behaviour; the app implements them as Flutter widgets.
They are not shipped in the app.
