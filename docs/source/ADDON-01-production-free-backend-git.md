# Add-on 01 — Production-grade mobile app, free backend & Git discipline

> Received from the product owner on 2026-10-08, in the first session, before any code existed.
> Verbatim. It extends `BUILD_PROMPT.md`. Where it is stricter, it wins (BUILD_PROMPT A6.2).
> Add-on 04 later fixes the client technology to Flutter + Dart.

---

**ADD-ON — PRODUCTION-GRADE MOBILE APP, FREE BACKEND & GIT DISCIPLINE**

Build the **complete Android mobile application from scratch** as a **fully working, deployable, production-grade system** — not a prototype, demo, mockup, static UI, or collection of disconnected screens.

Currently build **Android mobile only**. **Do NOT build the web app now**, but design the architecture so a future web app can reuse the same **backend, database, APIs, authentication, authorization, financial engine, business rules, audit system, and security architecture** without rebuilding the core.

Use the **best free database/backend option** for this project. **Supabase is the first preference**, but evaluate it against other genuinely free, reliable, secure, production-suitable options. Choose the best option based on:

**security + reliability + performance + database capability + offline/sync support + backup/recovery + scalability for private use + ease of development + integrations + zero/near-zero cost.**

This is a **private, non-commercial personal system**, so use **free services/infrastructure wherever reasonably possible**. Do not introduce paid services or unnecessary enterprise infrastructure.

The Android app must support **older compatible Android versions where reasonably possible**, while maintaining strong security, performance, accessibility, stability, and modern UX. Prioritize **small-screen usability, fast startup, low bandwidth, offline capability, touch-friendly controls, simple navigation, and minimal clicks**.

Everything must work end-to-end:

**UI → Backend → Database → APIs → Authentication → Authorization → Financial Logic → Validation → Security → Audit → Offline/Sync → Sharing → Reports → Testing → Deployment**

Implement **real database persistence, real APIs, real authentication, real authorization, real financial calculations, real validation, real error handling, real security, real audit logging, real offline/sync behavior, and real document/share flows**.

Do not use:
**fake data, placeholder business logic, mock balances, dummy buttons, disconnected screens, hard-coded permissions, fake security, temporary calculations, or unfinished workflows.**

Before marking any feature complete:

**BUILD → RUN → TEST → VERIFY → FIX → RETEST**

Maintain the entire project professionally with **Git from the beginning**:

- Keep a clean Git tree.
- Make small, logical, meaningful commits.
- Never mix unrelated changes into one commit.
- Never knowingly commit broken code.
- Review `git status` and `git diff` before commits.
- Use clear, meaningful commit messages.
- Keep the repository buildable and runnable at every meaningful milestone.
- Never commit passwords, API keys, private keys, secrets, or sensitive financial data.
- Use proper `.gitignore`, environment configuration, and secret management.
- Keep changes traceable, reversible, and easy to maintain.

For every major implementation phase, follow:

**READ → PLAN → IMPLEMENT → RUN → TEST → REVIEW → FIX → COMMIT → DOCUMENT**

Do not build a temporary architecture just to get the app running quickly. Build the **real production foundation from the start**, while keeping the system ready for the future web application.

The final output must be a **real, installable, deployable Android application that fully works in real-world use**.
