# Add-on 05 — Git commit for every change

> Received from the product owner on 2026-10-08, first session. Verbatim. Extends `BUILD_PROMPT.md`
> and Add-on 01; where it is stricter, it wins (BUILD_PROMPT A6.2).

---

**ADD-ON — GIT COMMIT FOR EVERY CHANGE**

Track **every change in Git, no matter how small**.

Even a **single-line change, bug fix, UI adjustment, dependency change, configuration change, documentation update, refactor, or test change** must be traceable.

For every change:

**READ → CHANGE → BUILD/TEST → REGRESSION CHECK → REVIEW DIFF → UPDATE MD/MEMORY → COMMIT**

Create a **small, focused commit immediately after the change is verified successfully**.

Never batch unrelated changes together. Keep every commit **clean, meaningful, traceable, reversible, and independently understandable**.

Before starting the next change:

**CONFIRM PREVIOUS CHANGE IS TESTED + COMMITTED + DOCUMENTED → THEN START NEXT CHANGE.**

Never continue from an unverified or uncommitted change.
