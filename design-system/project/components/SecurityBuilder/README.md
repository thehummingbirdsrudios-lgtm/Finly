# SecurityBuilder

Document security for a share: presets plus each control on its own, honouring OFF / DEFAULT ON / MANDATORY policy.

- Provide: `policy` (`{password: 'default', encryption: 'mandatory', print: 'blocked', …}`; anything unset is optional), optional `expiry`.
- Mandatory controls are on and locked ("Required by policy — cannot turn off"); blocked ones are off and locked. The stricter policy always wins.
- Any change invalidates the preview and verification, and says so.
- The preview shows the Q8 example policy: Password default on, Encryption mandatory, Watermark default on, Expiry 24 hours, Secure Viewer optional, Revocation default on, Download allowed, Print not allowed.

**In the app:** `FySecurityBuilder` — CheckboxListTile rows.
