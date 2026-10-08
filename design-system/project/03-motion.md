# Motion

Motion confirms what happened and where things went. It is quick, it never delays an action, and it stays smooth on the oldest supported phones.

## Timing

| Token | Value | For |
|---|---|---|
| `duration-instant` | 90ms | Press feedback: buttons scale to 97%, keys to 95%, ripple starts |
| `duration-fast` | 150ms | Chips, checkboxes, switches, badges changing, tab indicator sliding, dialogs |
| `duration-base` | 220ms | Bottom-navigation fade-through, snackbars in and out, screen-level fades, sheet dismissal |
| `duration-slow` | 320ms | Bottom sheets rising, hero transitions into a detail screen |

Curves: entering uses a decelerating curve (`Curves.easeOutCubic`, or `Curves.easeInOutCubicEmphasized` for sheets); leaving uses an accelerating one (`Curves.easeInCubic`). Nothing bounces.

## Patterns

- **Pages.** Pushing a screen uses the platform's own Android transition with predictive back. No custom route animations unless a measurement shows they hold 60fps on the floor device.
- **Bottom navigation.** Switching destinations fades through: the old screen fades out quickly, the new one fades in with a slight scale-up from 92%; the active pill grows from the icon. Each destination keeps its scroll position.
- **Tabs.** The indicator slides; the content follows the swipe.
- **Sheets and dialogs.** Sheets rise over `scrim`; drag down or tap the scrim to close when nothing would be lost. Dialogs fade and scale up from 90%.
- **Success.** When the server confirms a post, the check draws once (about 400ms), a light haptic tap plays, and a Snackbar offers "Share proof". The amount never counts up.
- **Error.** The field or keypad shakes once (two 6px swings, 300ms) with a firmer haptic, the error colour and a message that says what to do. Errors never auto-dismiss.
- **Snackbars** stay 4 seconds, or 6 when they carry an action; never for errors that need a decision.
- **Loading.** Skeletons pulse gently (1.2s cycle) in the layout's real shape. A spinner appears only inside a button that is working ("Posting…").
- **Lists.** Only newly arrived items animate in: fade plus an 8px rise, 150ms, staggered 20ms, at most 8 items. Nothing animates while scrolling.
- **Hero.** A transaction's glyph and amount travel from its card into the detail screen; a proof preview grows from its thumbnail.
- **Numbers.** A changed balance cross-fades; it never rolls or counts.

## Reduced motion and performance

- When Android's *Remove animations* is on, every duration drops to zero. Feedback stays: colour, glyph, text and haptics still say what happened.
- Animate only position, scale and opacity. No blur, backdrop filters or large shadows animating over lists.
- Every animated screen is profiled on the lowest supported Android version before it ships. A dropped-frame animation is simplified, not kept.
