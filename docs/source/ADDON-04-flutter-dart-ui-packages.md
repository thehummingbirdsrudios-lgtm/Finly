# Add-on 04 — Flutter + Dart + best UI packages

> Received from the product owner on 2026-10-08, first session. Verbatim.
> **This fixes the client technology: Flutter + Dart.** It answers BUILD_PROMPT Part D for the client layer;
> package choices are still evaluated and recorded in `docs/DECISIONS.md`.

---

**ADD-ON — FLUTTER + DART + BEST UI PACKAGES**

**USE FLUTTER + DART. THIS IS THE REQUIRED APPLICATION TECHNOLOGY.**

Build the current app as an **Android-first Flutter mobile application**, while keeping the core architecture reusable for **iOS and Web later**.

Use **Flutter + Material 3 as a foundation where appropriate**, but **do not force Material UI or any specific UI package**.

**You decide the best UI/UX packages and libraries for this project.**

Evaluate the available Flutter ecosystem and choose the **best production-suitable packages** for UI components, animations, navigation, charts, forms, icons, sheets, dialogs, tables, search, loading, gestures, PDF/document handling, image handling, accessibility, and other requirements.

Choose based on:

**UI quality + smoothness + performance + stability + maintenance + security + compatibility + bundle size + accessibility + long-term suitability**

Do not add packages unnecessarily. Prefer **mature, reliable, actively maintained solutions**, and use native Flutter capabilities when they are better.

Create one **centralized design system** for:

**colors + typography + spacing + sizing + radius + elevation + icons + components + states + themes + animation timings + navigation patterns**

The UI must feel like a **real premium production mobile app**:

**smooth + modern + responsive + intuitive + minimal clicks + excellent spacing + clear hierarchy + fast navigation + polished interactions**

Implement polished motion across the app:

**page transitions + navbar animation + tab transitions + button/toggle feedback + success animations + error feedback + snackbar/toast messages + bottom-sheet/dialog transitions + loading/skeleton states + list animations + gesture interactions + useful hero/shared-element transitions**

Animations must remain **lightweight and smooth on older supported Android devices**. Never sacrifice performance for visual effects.

Fully design and implement **every screen, widget, setting, state, navigation path, loading state, empty state, error state, permission state, security state, success state, and confirmation state**.

Do not use multiple unrelated UI styles. All packages must work within the **same consistent design system**.

Follow professional Flutter engineering:

**Clean Architecture + SOLID + modularity + reusable widgets + proper state management + responsive layouts + async/background processing + lifecycle safety + performance profiling + testing + maintainable code.**

Before adding any dependency, **evaluate whether it is actually needed and whether Flutter's built-in solution is better**.

**FINAL TECHNOLOGY DIRECTION:**

**Flutter + Dart + AI-selected best Flutter UI/UX packages and libraries → Android now → iOS later → Web later.**
