# PinPad

M-PIN entry: unlocks this phone only, never replaces the password.

- Provide: `length` (4 or 6, by policy), `onComplete`, optional `onBiometric`, `onForgot`, `error`, `lockedFor`.
- Digits are never shown, logged or read aloud; screen readers hear "2 of 4 digits entered".
- Wrong M-PIN shakes once (still under reduced motion) and says attempts left; after the limit it locks with a countdown and offers the password.

**In the app:** `FyPinPad` — a custom keypad; digits never in a TextField.
