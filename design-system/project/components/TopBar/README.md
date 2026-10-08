# TopBar

The top of every screen: back, a title, and the path that says where you are.

- Provide: `title`, `path` (`['Money', 'Mint']`), `onBack` (pass `null` on top-level tabs), `actions` (`[{icon, label, onClick}]`, at most two; the rest go in the overflow).
- System back does the same as the back arrow. Leaving unsaved input keeps an encrypted draft and says so.

**In the app:** `FyTopBar` — AppBar (title + path) / SliverAppBar on long screens.
