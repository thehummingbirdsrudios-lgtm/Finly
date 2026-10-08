# Add-on 06 — Initial users, first login & role management

> Received from the product owner on 2026-10-08, first session. Verbatim. Extends `BUILD_PROMPT.md`;
> where it is stricter, it wins (BUILD_PROMPT A6.2). How it reconciles with the spec — "Remove" means archive
> for users with history (H15), Super Admin never gains personal-finance visibility (A4), the first password
> is delivered by a one-time local bootstrap and never through chat, Git or logs — is recorded in
> `docs/DECISIONS.md`.

---

ADD-ON — INITIAL USERS, FIRST LOGIN & ROLE MANAGEMENT
Create a professional Splash Screen + secure authentication + role-based user management for the Android app.
INITIAL USERS
During first system setup, create these initial users:

* Krish — Super Admin + Owner
* Shaileshbhai — Admin
* Savan — Admin
* Sujal — Worker/Other Role
* Devanshu — Worker/Other Role
* Heet — Worker/Other Role
* Sagar — Worker/Other Role

These are only the initial seed users. Do not hard-code the user-management system or final permissions.
Permissions must be configurable later by Super Admin.
SUPER ADMIN USER MANAGEMENT
Super Admin must be able to manage users completely from the mobile app:
Add → Edit → Change Role → Configure Permissions → Activate/Deactivate → Suspend → Reset Password → Reset M-PIN → Revoke Device/Sessions → Archive/Remove
Super Admin can create:
Super Admin + Admin + Worker + any future configurable role
When creating a user, generate/assign a username + temporary password. The user can securely change credentials later.
Never retrieve, display, log, hard-code, or store passwords in plaintext.
FIRST-LAUNCH & LOGIN
Flow:
Splash → Session Check → Login → First-Time Security Setup → Change Temporary Password → M-PIN/Biometric Setup → Dashboard
Returning user:
Splash → Secure Session Check → App Unlock/Login → Dashboard
Correctly handle:
first launch + active session + expired session + logout + new device + disabled account + locked account + network unavailable + authentication failure
ROLE-BASED UI
The mobile UI must automatically adapt to the user's actual permissions, not merely their role name.
Super Admin → full administration, users, permissions, security, configuration and system controls
Admin → only features/data/actions granted to that admin
Worker/Other Role → only assigned features/data/actions
Navigation items, screens, buttons, data, search results, totals, actions, and settings must all respect authorization.
Frontend visibility is only UX; backend authorization remains the real security boundary.
DEPLOYMENT LOGIN
At final successful deployment/setup, securely provide the initial Krish Super Admin username and temporary password required for first login.
The temporary password must be changed through the secure first-login flow.
Never place credentials in source code, Git, APK, MD files, logs, screenshots, or public configuration.
Everything must be real, secure, smooth, production-ready, and fully functional.
