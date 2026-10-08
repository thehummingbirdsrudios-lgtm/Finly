# Add-on 07 — Finly startup, branding, onboarding, login & user management

> Received from the product owner on 2026-10-08, first session. Verbatim. **It names the product Finly**
> (the folder `D:\Finely` keeps its name). It restates and extends Add-on 06; where they differ, the stricter
> reading wins (BUILD_PROMPT A6.2). The reconciliation notes in Add-on 06 apply here too.

---

ADD-ON — FINLY STARTUP, BRANDING, ONBOARDING, LOGIN & USER MANAGEMENT
The current application name is Finly.
Build the complete first-launch and startup experience as a polished production mobile app.
BRANDING
Use Finly consistently across the app, authentication, notifications, launcher, splash, and documents where applicable.
Create a professional custom SVG logo/icon for Finly now. Do not use a generic placeholder.
Keep branding centralized so the name, logo, icon, colors, and branding can be changed later easily without manually changing every screen.
SPLASH & STARTUP
Create a professional production-quality Splash Screen with Finly branding, correct spacing, lightweight animation, and smooth transition.
Startup flow:
Launch → Splash → App Initialization → Secure Session Check → Configuration Check → Authentication/Unlock → Correct Destination
Handle:
first launch + returning user + active session + expired session + logged out + disabled account + locked account + network unavailable + initialization failure
Never block the UI unnecessarily during startup.
FIRST-TIME SETUP WIZARD
On the first installation/setup, provide a professional guided setup wizard.
The wizard should progressively configure everything required before normal usage, with:
clear steps + progress indicator + Back/Next + Skip where safe + validation + autosave of setup progress + confirmation + recovery from interruption
The wizard must determine what setup is required based on the system configuration and user role instead of showing unnecessary steps.
Include relevant setup such as:
Owner/Super Admin setup → initial security → user setup → organization/company configuration → essential financial configuration → permissions → preferences → optional security features → final review → completion
Do not force optional configuration unnecessarily.
If setup is interrupted, the app must safely resume from the correct step without corrupting or duplicating data.
INITIAL USERS
During first system setup, create these initial users:

* Krish — Super Admin + Owner
* Shaileshbhai — Admin
* Savan — Admin
* Sujal — Worker/Other Role
* Devanshu — Worker/Other Role
* Heet — Worker/Other Role
* Sagar — Worker/Other Role

These are initial seed users only. Do not hard-code the long-term user-management system or final permissions.
SUPER ADMIN USER MANAGEMENT
Super Admin must be able to manage users entirely from the mobile app:
Add → Edit → Change Role → Configure Permissions → Activate/Deactivate → Suspend → Reset Password → Reset M-PIN → Revoke Devices/Sessions → Archive/Remove
Support:
Super Admin + Admin + Worker + future configurable roles
When creating a user, generate/assign a username + temporary password. Credentials can later be changed securely from the app.
Never retrieve, display, log, hard-code, or store passwords in plaintext.
FIRST LOGIN
First-login flow:
Splash → Session Check → Login → First-Time Security Setup → Change Temporary Password → M-PIN/Biometric Setup → Dashboard
Returning flow:
Splash → Secure Session Check → App Unlock/Login → Dashboard
ROLE-BASED UI
The UI must adapt dynamically to actual permissions, not simply the role name.
Super Admin → full administration and system controls
Admin → only authorized operational/configuration features
Worker/Other Role → only assigned features and data
Navigation, screens, buttons, settings, search, totals, actions, and visible data must all respect authorization.
Frontend hiding is only UX; backend authorization is the actual security boundary.
DEPLOYMENT
At final successful deployment/setup, securely provide the initial Krish Super Admin username and temporary password needed for first login.
Temporary credentials must be changed through the secure first-login process.
Never place credentials in:
source code + Git + APK + MD files + logs + screenshots + public configuration
Everything in this startup, onboarding, authentication, branding, and user-management system must be real, smooth, secure, recoverable, and production-ready, with no placeholders or disconnected flows.
