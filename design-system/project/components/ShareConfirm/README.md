# ShareConfirm

The last step before anything leaves the app: recipient, channel, format, security and content, then Verify & share.

- Provide: `recipient` (`{name, contact, verified}`), `channel`, `format`, `security` (list of applied controls), `content`, `invalidated`, `onVerify`, `onCancel`, `onReview`.
- If anything changed after the preview, the button is disabled until the user reviews again.
- "Sent" is shown only when the channel confirms delivery; a WhatsApp hand-off is shown as "Handed to WhatsApp".

**In the app:** `FyShareConfirm` — showModalBottomSheet.
