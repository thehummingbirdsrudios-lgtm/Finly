# GATE-RESPONSE-06 — Offline drafts with preloaded data, money in paise, on-device OCR

Received 2026-10-10 in answer to three questions asked while planning master plan v3: (1) offline vs the online-only
decision D-031, (2) whole rupees vs paise, (3) OCR for scanned bank statements. Recorded as D-044, D-045, D-046.
The answers are recorded verbatim below the line; the question texts are summarised in brackets.

---

**[1. Offline: the new add-on asks for offline operation; D-031 says online-only. Which should the app do?]**

### Option 1 — Online Database + Offline Drafts with Preloaded Data (Recommended)

The application must use an **online-only database as the single source of truth**, while supporting temporary offline work through encrypted local storage.

Whenever the internet is available, the app should preload and securely cache the necessary data on the phone so users can continue working even when the connection is temporarily lost.

- **Online mode:** All normal operations work using the live online database, with up-to-date data, balances, transactions, permissions, and records.
- **Offline mode:** Users can access previously preloaded data and create, edit, and save transaction drafts locally without an internet connection. The app should support as many transaction-entry workflows as possible using the available cached data.
- **Temporary local storage:** Offline entries must be encrypted and clearly marked as **“Saved on this phone — Not synced or confirmed.”** These are temporary drafts, not permanent database records.
- **Automatic synchronization:** When the internet returns, the app should automatically submit pending drafts to the server. The server must revalidate authentication, permissions, balances, business rules, duplicate transactions, and data conflicts before accepting each entry into the online database.
- **Conflict handling:** If a draft cannot be validated, the app must flag it for user review rather than silently confirming, duplicating, or overwriting a transaction.
- **Cached information:** Previously loaded balances and reports may remain viewable offline, but must display their last-updated time and clearly indicate that they may be outdated.
- **Online-only actions:** Final approvals, reversals, authoritative balance updates, sharing, administrative actions, and other operations requiring live validation must remain online-only.

**Core architecture:** The system is online-first, with an online database and an encrypted offline-draft/preload feature. Do not create a separate offline database that acts as an independent source of truth. Local storage exists only to temporarily cache required data and preserve unsynced drafts.

**Expected behaviour:** Users should be able to continue entering transactions during temporary internet outages without losing their work. However, an offline draft must never be represented as a successfully saved, posted, or confirmed financial transaction until the online server validates and accepts it.

**Option 1 — Online Database + Offline Drafts (Recommended):** The database must remain online-only as the single source of truth. When internet is available, preload and securely cache required data locally. When offline, allow users to perform available workflows and save transactions as encrypted temporary drafts on the phone. Automatically sync and validate drafts when internet returns. Clearly mark unsynced entries as unconfirmed. Final approvals, reversals, and admin actions require internet.

**Option 2 — Online Only:** Keep D-031 unchanged. No financial data or transaction drafts are stored locally. Without internet, display “You are offline” and disable transaction recording.

**Implement both options as a configurable choice, with Option 1 selected by default.**

**[2. Money: whole rupees (BUILD_PROMPT H14) or paise?]**

Store paise (Recommended)

**[3. Scanned bank statements: on-device OCR (an exception to "no AI") or no OCR?]**

On-device OCR (Recommended)
