# ImpactPreview

Before an important change: "This change will affect N areas", each with before → after.

- Provide: `items` (`[{area, before, after}]`, only areas the viewer may see) and `hiddenCount` when other affected areas are hidden.
- Hidden areas are counted as "another area you cannot see" and sent for review — never named or valued.

**In the app:** `FyImpactPreview` — a Column of rows.
