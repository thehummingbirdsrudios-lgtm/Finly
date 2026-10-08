# Logo

The Finly mark, wordmark and lockup, drawn from the brand tokens so they sit right in both themes.

- Provide: `variant` (`mark`, `wordmark`, `lockup`) and `size` (the mark's side, or the wordmark's height).
- The mark — an F whose two bars echo the twin strokes of the rupee sign, and a brass coin at its foot: every rupee, accounted for — keeps `logo-tile`, `logo-glyph` and `logo-coin` in both themes. The wordmark uses `ink` with an `accent` dot, so it follows the theme.
- Minimum sizes: mark 24px, wordmark 20px tall. Keep clear space of one coin diameter on every side.
- Never recolour the tile, outline the mark, stretch it, add effects, or set the wordmark on a coloured fill — use the mark there instead.
- The name comes from the brand configuration (`brand.json`); no screen types it.

**In the app:** `FyLogo` — a CustomPaint of the same paths, reading BrandConfig.
