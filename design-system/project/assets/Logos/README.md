# Logos

The Finly mark and wordmark as standalone SVG files, for the launcher, splash, notifications, PDFs and proof cards. Inks are fixed because `<img>` cannot inherit colour:

| File | Use | Inks |
|---|---|---|
| `finly-mark.svg` | In-app mark, PDF and proof headers, store listing | tile `logo-tile` #1d5c45, glyph `logo-glyph` #ffffff, coin `logo-coin` #d9b45f |
| `finly-wordmark.svg` | Wordmark on light grounds | `ink` #131c17, dot `accent` #8a6a1f |
| `finly-wordmark-dark.svg` | Wordmark on dark grounds | `ink` (dark) #e9eeea, dot `accent` (dark) #d9b45f |
| `finly-launcher-foreground.svg` | Android adaptive icon foreground (108dp canvas, glyph inside the 66dp safe circle); background colour `logo-tile`; also the Android 12+ splash icon | glyph #ffffff, coin #d9b45f |
| `finly-launcher-monochrome.svg` | Android 13+ themed icon layer (the system tints it) | #ffffff |
| `finly-notification.svg` | Status-bar notification icon (white silhouette on transparent, as Android requires) | #ffffff |

Paths match the `Logo` component exactly; change both together.
