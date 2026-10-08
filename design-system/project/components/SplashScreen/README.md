# SplashScreen

The first thing anyone sees: the Finly mark on paper, then the right destination as soon as the session check allows — never a timed delay.

- Provide: `state` — `starting`, `checking`, `offline`, `failed`, `disabled`, `locked` — an optional support `code`, and `onPrimary` / `onSecondary`.
- Startup order: launch → splash → initialise → secure session check → configuration check → unlock or sign in → destination. Work that does not decide the first screen runs after it appears.
- Android 12+ draws the system splash (`surface` background, the launcher icon on `logo-tile`); Flutter's first frame shows the same composition, so there is no jump. The wordmark rises in after 150ms only if the check is still running; under 400ms the app goes straight on with a fade-through.
- After a second, a thin progress line and "Checking your secure session…" appear. Offline with a valid remembered session offers "Continue offline"; without one, it explains that signing in needs a connection.
- Disabled and locked accounts say only what the person may know — no reasons from the administrator, no other users' details.
- Initialisation failure changes nothing, offers "Try again", and shows a code for support; details go to the protected diagnostics log, never to the screen.

**In the app:** `SplashPage` — the Android 12 SplashScreen API for the system splash, then a Flutter page with the same layout.
