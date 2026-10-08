# ProofCard

The generated Photo Proof: an image made from the posted record, never a screenshot.

- Provide: `tx` (authorised fields only), `firm`, `classification`, `watermark` (recipient-specific), `verifyCode`.
- Always rendered in the light theme so archived proofs look the same.
- The footer states it was generated from the posted record; the verify code checks it against the server.

**In the app:** `FyProofCard` — rendered off-screen to PNG (RepaintBoundary.toImage) from server-authorised data.
