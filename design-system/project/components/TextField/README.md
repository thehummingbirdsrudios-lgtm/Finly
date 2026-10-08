# TextField

Text input with a visible label, inline help and inline errors; validates while typing.

- Provide: `label`, `value`/`onChange` (or `defaultValue`), optional `helper`, `error`, `required`, `icon`, `multiline`, `inputMode`, `autoComplete`.
- Labels sit above the field and never disappear; placeholders are examples, not labels.
- Errors say what to do: "Please write why the money moved."
- Reasons autocomplete from the user's own history (deterministic recency, no AI).

**In the app:** `FyTextField` — TextFormField with InputDecoration from FyTheme.
