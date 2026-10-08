Finely is a private money app for one family and its businesses. It must feel like the simplest finance app on the phone while a full double-entry ledger runs underneath. Every screen answers four plain questions — how much, from where, to where, why — and the amount is always the first thing the eye lands on.

These rules apply to every screen, proof card, PDF and notification. The components here are reference renderings; the Flutter app implements the same tokens and behaviour (see *Flutter implementation*).

## Content fundamentals

- **Plain words, sentence case, second person.** "You do not have permission to view this account." Never accounting jargon outside the finance-only Accounting View: say *Money in*, *Money out*, *From*, *To*, never *Dr*, *Cr*, *journal* or *ledger*.
- **Say what happened as a sentence a person could read months later.** "₹5,000 came from Mint, was placed in the Tijori, handled by Krish Patel, on 8 October 2026 at 10:15 AM." Never "₹5,000 — adjustment".
- **Every error says what to do next.** "This transfer cannot be completed because the available balance is insufficient." / "Please select where the money is going." Never a code, a stack trace or `ValidationException`.
- **No exclamation marks, no emoji, no hype.** Calm and exact. Success is "Posted." — not "Great job!".
- **The family's own words are labels, not logic.** Avak, Javak, Tijori, Hissa, Khata and Rokda appear wherever the owner configured them; the meaning underneath never changes (*Content and labels*).
- **English, Hindi and Gujarati** from the same keys, with Indian number grouping in every language.

## Visual foundations

**Colour.** Paper-calm neutrals, one ledger-green brand, brass as a rare accent, and a fixed colour for each money direction and state.

- Screens sit on `surface`; cards, sheets, bars and dialogs on `surface-raised`; inputs, keypad keys and skeletons on `surface-sunken`. Separate rows with `line`; give every control boundary `line-strong`.
- Text is `ink`; secondary lines `ink-muted`. Both pass 4.5:1 on all three surfaces in both themes.
- `brand` is for the primary action, the add button, the active navigation item, links and selection — nothing else. Text on a brand fill is `on-brand`. Selected chips and the navigation pill use `brand-soft`.
- `accent` (brass) marks non-state highlights only: onboarding progress, the selected period, the cover. Never a direction or a state.
- Money directions: `money-in`, `money-out`, `transfer`. States: `pending`, `blocked`, `reversed`, `outstanding`, `reconciled`, `exception`. Each has a `-soft` fill for its badge, and each colour always travels with its glyph and its word (*Money language*). `success`, `error` and `warning` are aliases of `reconciled`, `blocked` and `exception`.
- Success is teal, not green, so it never relies on a red–green difference against `blocked`. Money in is blue and money out is vermilion: a pair colour-blind readers can still tell apart, though the sign and arrow carry the meaning anyway.
- Dim behind sheets and dialogs with `scrim`. Focus rings use `focus`: a 2px gap in the ground colour, then a solid 2px ring, at least 3:1 on every surface.
- Proof cards and PDFs always render in the light theme, so an archived proof looks the same years later.

**Type.** One family: Mukta for Latin and Devanagari, Mukta Vaani for Gujarati (same design, so mixed-script lines match), both bundled with the app.

- Amounts use the *Money* styles — `amount-hero` for the one total a screen is about, `amount-lg` on cards, review and proof, `amount` in rows, `amount-sm` in breakdowns and tables — with tabular figures.
- Screens use `display` once at most (Home, setup), `title-lg` for detail titles, `title` for bars and sheets, `section` for section headings, `subhead` for sticky dates and card titles.
- Reading text is `body`; secondary lines `body-sm`; timestamps and helper text `caption`; field labels and badges `label`; buttons and tabs `button`; IDs, references and table dates `figure`.
- Never set an amount in `caption`, never below 15px, never truncated: drop secondary lines first.

**Space and layout.** A 4px grid.

- Screen gutter `space-4`; card padding `space-4`; bottom-sheet padding `space-5`; gap between sections `space-6`; space above a screen's primary action `space-8`.
- Everything tappable is at least `touch-min` (48px). Fields and selectors are `field-height`, keypad keys `key-height`, the app bar `app-bar`, the navigation `nav-bar`, the add button `fab`.
- Primary actions live at the bottom, in thumb reach. The add button sits bottom-right above the navigation on every main screen.
- Phones first: design at 360px wide, check at 320px and on foldables. Lists are lazy and paginated; nothing loads the whole ledger.

**Shape and depth.** Soft corners, little shadow.

- `radius-sm` for badges and chips; `radius-md` for buttons, inputs, keys and banners; `radius-lg` for cards and proof cards; `radius-xl` for sheet tops and dialogs; `radius-full` for pills and the navigation pill.
- `elevation-1` for cards, `elevation-2` for sheets and the navigation, `elevation-3` for the add button, dialogs and snackbars. Dark theme leans on surface steps rather than shadow.

**States.** Every screen supports every state on the States board — loading, empty, error, denied, offline, syncing, conflict, read-only, stale, session expired and the rest — before it is called done.

## Iconography

Rounded, 24px, one stroke weight, always beside a word or a sign when it carries financial meaning. In the app: Flutter's built-in Material icons, Rounded style (no icon package). The reference glyphs in the Icon card are stand-ins drawn to match; this is the mapping (verified against the Flutter SDK when the theme is built).

| Glyph | Flutter icon | Used for |
|---|---|---|
| in | `Icons.call_received_rounded` | Money in |
| out | `Icons.call_made_rounded` | Money out |
| transfer | `Icons.swap_horiz_rounded` | Transfer |
| clock | `Icons.schedule_rounded` | Pending |
| sync | `Icons.sync_rounded` | Posting, syncing |
| check / check-double | `Icons.check_rounded` / `Icons.done_all_rounded` | Posted, settled / reconciled |
| x / ban | `Icons.close_rounded` / `Icons.block_rounded` | Rejected / blocked |
| undo | `Icons.undo_rounded` | Reversed, corrected |
| hourglass | `Icons.hourglass_empty_rounded` | Outstanding |
| alert / alert-circle / info | `Icons.warning_amber_rounded` / `Icons.error_outline_rounded` / `Icons.info_outline_rounded` | Exception, error, information |
| lock / family / business / shield-alert / share | `Icons.lock_outline_rounded` / `Icons.group_outlined` / `Icons.apartment_rounded` / `Icons.gpp_maybe_outlined` / `Icons.share_rounded` | Private, Family, Business, Restricted, Shared |
| shield / fingerprint / key / timer | `Icons.verified_user_outlined` / `Icons.fingerprint_rounded` / `Icons.key_rounded` / `Icons.timer_outlined` | Step-up, biometric, password, expiry |
| home / wallet / list / more / plus | `Icons.home_rounded` / `Icons.account_balance_wallet_outlined` / `Icons.format_list_bulleted_rounded` / `Icons.more_horiz_rounded` / `Icons.add_rounded` | Navigation and add |
| search / back / chevron / arrow-right | `Icons.search_rounded` / `Icons.arrow_back_rounded` / `Icons.chevron_right_rounded` / `Icons.arrow_forward_rounded` | Wayfinding; arrow-right joins From → To |
| eye-off / backspace / cloud-off | `Icons.visibility_off_outlined` / `Icons.backspace_outlined` / `Icons.cloud_off_rounded` | Hidden amount, keypad delete, offline |
| message / photo / document / watermark / print / download / copy | `Icons.chat_bubble_outline_rounded` / `Icons.image_outlined` / `Icons.description_outlined` / `Icons.branding_watermark_outlined` / `Icons.print_outlined` / `Icons.download_rounded` / `Icons.content_copy_rounded` | Share formats and document controls |
| receipt / calendar / user / edit / phone | `Icons.receipt_long_outlined` / `Icons.calendar_today_outlined` / `Icons.person_outline_rounded` / `Icons.edit_outlined` / `Icons.smartphone_rounded` | Bills, dates, people, drafts, devices |
| vault | none built in — `Icons.inventory_2_outlined` until a custom Tijori glyph is drawn | Tijori, lockers, cash locations |

There is no logo yet: the name is set in plain type.
