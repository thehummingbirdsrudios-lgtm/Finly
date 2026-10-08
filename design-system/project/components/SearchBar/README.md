# SearchBar

Global search, one tap from every screen, with combinable filter chips.

- Provide: `value`/`onChange`, `filters` (`[{id, label, selected}]`), `onToggleFilter`, optional `placeholder`.
- Understands multi-term queries by rule: `45000 Angadiya`, `Mint Tijori Oct`, `TX-20261008`, `5000-10000`, `last week`.
- Results, counts, suggestions and recent searches are permission-filtered on the server before they reach the phone.

**In the app:** `FySearchBar` — SearchBar + SearchAnchor.
