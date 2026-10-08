# UnlockScreen

What a returning user sees: welcome back, fingerprint first, M-PIN and password as fallbacks.

- Provide: `name`, `method` (`biometric` or `pin`), `onBiometric`, `onForgot`, `onPassword`.
- Uses Android's own biometric prompt; the app never sees fingerprint data. A change in enrolled biometrics forces the password.

**In the app:** `UnlockPage` — local_auth (BiometricPrompt) + FyPinPad.
